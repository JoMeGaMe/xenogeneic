// ===== 主線（故事模式，v0.40）：家、行程、執行這週、狀態、背包、水缸、系統 =====
// v0.40.34 起主線全部在 js/story/：
//   main.js 進入／離開、存檔｜week.js 行程＋執行這週｜script.js 劇情引擎｜vn.js 劇情畫面＋預覽｜sys.js 系統
//   art.js 圖｜view.js 各畫面｜free.js 自由行動｜render.js 重畫＋點擊
//   資料 js/story/data/story.js（STORY_*）、storyscript.js（劇情）、texts.js（TEXT.story）；樣式 css/story.css。
// 畫面是一張固定大小的「舞台」再整張縮放：電腦／橫放 1280×720（放不下就加黑邊）、手機直放寬 390、高度跟著螢幕。
// 存檔：META.story＝自動存檔（每週開始、白天回到家時）；META.storySlots＝手動存檔 3 格。週中途存的會多一個 run（這週跑到哪一天，見 storyRunNorm）。
// 進入：第 0 日的「主線：緊急委託」按鈕（長相登記過才有）→ storyOpen()。

let STY=null;          // 進行中的主線（從 META.story 複製出來；週結束後寫回）
let STRUN=null;        // 執行這週的進度 {i, phase 0 執行｜1 結束, still, res[], start, end, bgFade}
const SUI={scr:'home',sel:0,tab:'care',stab:'me',btab:'wear',greteOn:false,tip:0,bgx:null,toast:'',encPop:null,sched:null};
const ST_DAYS=()=>TEXT.story.days;
const stT=()=>TEXT.story;

// ---------- 存檔 ----------
const storyCopy=o=>JSON.parse(JSON.stringify(o));
// 要存的東西：STY＋（白天在家時）這週的進度。讀進來：stResume 把進度接回去（v0.40.44）
// 主線存檔時：這個存檔拿到的衣物併進 META.wearOwn（日常模式看得到；v0.40.69）
function storyOwnSync(){const w=STY&&STY.wearOwn||[];if(w.some(x=>!(META.wearOwn||[]).includes(x)))META.wearOwn=[...new Set([...(META.wearOwn||[]),...w])]}
function storyPack(){storyOwnSync();const o=storyCopy(STY);delete o.run;if(typeof stHub==='function'&&stHub())o.run=stRunPack();return o}
function storyAutoSave(){STY.at=new Date().toISOString().slice(0,10);if(STY.freeMode){META.storyFree=META.storyFree||[null,null,null];META.storyFree[STY.freeSlot||0]=storyPack()}else META.story=storyPack();codexSave()}   // 自由模式只存回中繼存檔（和一般存檔分開）

// ---------- 進入／離開 ----------
// v0.40.33：入口＝新遊戲｜讀取（一般存檔：自動存檔＋手動 3 格｜自由模式存檔：每章結束時存，第一章過關後才有）
function storyOpen(){
  if(!META.urgent||!META.doll)return;
  const T=stT().start,has=!!META.story||(META.storyFree||[]).some(Boolean)||(META.storySlots||[]).some(Boolean);
  if(!has){pick(T.title,[{node:stTxtNode()},{id:'go',label:T.ok,main:true}],()=>storyEnter(null),T.body);return}
  pick(T.title,[{id:'new',label:T.newGame},{id:'load',label:T.loadGame,main:true}],k=>k==='new'?storyNewAsk():storyLoadMenu(),T.menuBody);
}
function storyNewAsk(){const T=stT().start;
  pick(T.newAsk,[{node:stTxtNode()},{id:'go',label:T.ok,main:true},{id:'back',label:T.back}],k=>k==='go'?storyEnter(null):storyOpen(),T.newBody);}
// 讀取清單的中繼存檔 3 格（id：free0～free2；全空＝一行說明）
function stFreeItems(){const T=stT().start,F=META.storyFree||[];
  if(!F.some(Boolean))return [{id:'free',label:T.freeNone,off:true}];
  return [0,1,2].map(i=>{const f=F[i];return {id:'free'+i,label:stFreeLabel(f,i),off:!f}})}
function storyLoadMenu(){const T=stT().start,TS=stT().sys,sl=META.storySlots||[],au=META.story;
  pick(T.loadTitle,[{head:T.loadNormal},
    {id:'auto',label:fmt(T.autoSlot,{info:au?stSlotInfo(au):TS.empty}),off:!au,main:!!au},
    ...[0,1,2].map(i=>({id:i,label:stSlotLabel(sl[i],i),off:!sl[i]})),
    {rule:true,label:T.loadFree},...stFreeItems(),
    {id:'back',label:T.back}],k=>{
    if(k==='back'){storyOpen();return}
    if(k==='auto')storyEnter(storyCopy(au));
    else if(String(k).startsWith('free')){const f=(META.storyFree||[])[+String(k).slice(4)];if(f)storyEnter(storyCopy(f))}
    else if(typeof k==='number'&&sl[k]){storyEnter(storyCopy(sl[k]));storyAutoSave();stFlash(fmt(TS.loaded,{n:k+1}))}
  });}
// 進到主線：sty＝讀進來的存檔；null＝新遊戲（第一章開頭，播開場）
function storyEnter(sty){
  const fresh=!sty;STY=sty||storyNew();SUI.greteOn=false;
SUI.bgx=null;STORY_DOLL={};stResume();stJobNews(!Array.isArray(STY.jobSeen));if(fresh)storyAutoSave();
  $('ovStory').classList.add('show');document.body.classList.add('story');stPreload();
  if(META.doll&&['glass','hold'].some(k=>META.doll[k]!=='none'&&!wearHas(META.doll[k])))wardSet(o=>{['glass','hold'].forEach(k=>{if(!wearHas(o[k]))o[k]='none'})});   // 這個存檔沒有的配飾就拿掉（衣物分存檔，v0.40.69）

  if(fresh)SUI.loading=true;   // 新遊戲：先黑畫面讀取，不要先閃出房間（開場讀好就會換掉）
  stDollLoad();
  if(fresh)stPlay([...stEvents('start'),...stEvents('weekStart',1)],()=>storyAutoSave());
  stRender();
}
function storyClose(){SUI.over=false;document.body.classList.remove('storyday');clearTimeout(ST_TIMER);clearInterval(ST_TW);SUI.loading=false;STRUN=null;SUI.vn=null;$('ovStory').classList.remove('show');document.body.classList.remove('story')}
function storyLeaveAsk(){
  const T=stT().leave;
  const hub=stHub();
  pick(T.title,[{id:'save',label:T.saveFirst},{id:'ok',label:T.ok,main:true},{id:'no',label:T.cancel}],k=>{
    if(k==='ok'){if(hub)storyAutoSave();storyClose()}
    if(k==='save')stSysSave(()=>{if(hub)storyAutoSave();storyClose()});
  },hub?T.bodyDay:T.body);
}

