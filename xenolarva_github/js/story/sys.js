// ===== 主線 sys.js：系統：儲存、讀取、設定（對話顯示、行程本樣式） =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// ---------- 系統：儲存／讀取（每週開始、白天回到家時；其他時候執行中不能開）----------
const stSlotInfo=s=>{const T=stT().sys;return s.run?fmt(T.slotInfoDay,{w:s.week,d:ST_DAYS()[s.run.i],at:s.at}):fmt(T.slotInfo,{w:s.week,at:s.at})};   // 週中途存的：寫星期幾
// 中繼存檔（自由模式）的名字：中繼 n　第一章　UM-XXXX　日期（不寫週；之後小球代號會換成名字，v0.40.69）
const stFreeLabel=(f,i)=>{const T=stT().start;return f?fmt(T.freeSlot,{n:i+1,ch:stT().chapter[f.ch]||'',id:fmt(stT().larvaId,{n:f.num}),at:f.at}):fmt(T.freeEmpty,{n:i+1})};
function stSlotLabel(s,i){const T=stT().sys;return fmt(T.slot,{n:i+1})+'　'+(s?stSlotInfo(s):T.empty)}
function stSys(){
  const T=stT().sys;
  pick(T.title,[{id:'save',label:T.save},{id:'load',label:T.load},{id:'set',label:T.set},{id:'leave',label:T.leave}],k=>{
    if(k==='save')stSysSave();if(k==='load')stSysLoad();if(k==='set')stSysSet();if(k==='leave')storyLeaveAsk();
  },T.auto);
}
// 設定：畫面配色（v0.40.45；只存在這台裝置，像外觀設定）：day 永晝｜night 永夜｜auto 隨時間變化（排行程的家＝晚上，執行這週、自由行動＝早上）
//   控制列、行程本、狀態、收納、水缸、系統、確認框都照這個（背景圖不變）
const ST_THEMES=['day','night','auto'];
let ST_THEME=(()=>{try{const v=localStorage.getItem('xenolarva_storytheme');return ST_THEMES.includes(v)?v:'auto'}catch(e){return 'auto'}})();
const stDayLook=()=>ST_THEME==='day'||(ST_THEME==='auto'&&!!STRUN);   // 現在用早上的配色
function stSysSet(){
  const T=stT().sys;
  pick(T.set,[{node:stTxtNode()},{rule:true,label:T.book},...ST_THEMES.map(b=>({id:b,label:T.books[b]+(b===ST_THEME?T.now:''),main:b===ST_THEME}))],b=>{ST_THEME=b;try{localStorage.setItem('xenolarva_storytheme',b)}catch(e){}stRender()});
}
function stSysSave(after){
  const T=stT().sys,sl=META.storySlots;
  if(STY.freeMode){storyAutoSave();stFlash(T.freeSaved);if(after)after();return}   // 自由模式：存回中繼存檔
  pick(T.save,sl.map((s,i)=>({id:i,label:stSlotLabel(s,i)})),i=>{
    STY.at=new Date().toISOString().slice(0,10);const o=storyPack();sl[i]=o;codexSave();stFlash(fmt(T.saved,{n:i+1}));if(after)after();
  },stHub()?T.onlyDay:T.onlyWeek);
}
function stSysLoad(){
  const T=stT().sys,sl=META.storySlots;
  const TS=stT().start;
  pick(T.load,[...sl.map((s,i)=>({id:i,label:stSlotLabel(s,i),off:!s})),{rule:true,label:TS.loadFree},...stFreeItems()],i=>{
    clearTimeout(ST_TIMER);if(String(i).startsWith('free')){const f=(META.storyFree||[])[+String(i).slice(4)];if(!f)return;STY=storyCopy(f);stResume();storyAutoSave();stFlash(TS.freeLoaded);return}
    STY=storyCopy(sl[i]);stResume();stJobNews(!Array.isArray(STY.jobSeen));storyAutoSave();stFlash(fmt(T.loaded,{n:i+1}));
  });
}

