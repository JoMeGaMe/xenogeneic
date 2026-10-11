// ===== 開發者測試模式 =====
// 開啟方式：網址加 ?dev=1，或在畫面上連點畫面左上的版本號 5 次。
// 開啟後「結束今日」下方會出現「開發者模式」按鈕，打開浮動面板，可以直接指定目前這隻的個性、標籤與顏色。
// 這裡只動目前周目的狀態，不會寫進存檔設定；要拿掉這個功能，刪掉這個檔案與 index.html 的對應行即可。
function devUnlock(){$('bDev').hidden=false}
try{if(/[?&]dev=1(&|$)/.test(location.search))devUnlock()}catch(e){}
(()=>{let n=0,tm=null;
  $('ver').addEventListener('click',()=>{
    n++;clearTimeout(tm);tm=setTimeout(()=>{n=0},2500);       // 2.5 秒內連點 5 次
    if(n>=5){n=0;devUnlock()}
  });
})();

function devBuild(){
  const p=$('devp');p.textContent='';
  const close=h('button',{'aria-label':'關閉',onclick:()=>{p.hidden=true}},'✕');
  p.append(h('h4',{},'開發者模式',close));
  if(!S){p.append(h('p',{class:'dim'},'先開始一局，這裡才能改目前的小球。'));return}
  // 個性
  const sel=h('select',{'aria-label':'個性'},...TEMPER_IDS.map(id=>h('option',{value:id,selected:id===S.temp},TEXT.temper[id].name)));
  sel.onchange=()=>{S.temp=sel.value;C.steering=false;C.next=0;M=null;C.home=pickHome();refresh()};
  p.append(h('div',{class:'dg'},h('label',{},'個性'),sel));
  // 標籤
  const tg=h('div',{class:'dt'});
  Object.keys(TAGS).forEach(id=>{
    const cb=h('input',{type:'checkbox',checked:S.tags.includes(id)});
    cb.onchange=()=>{
      S.tags=S.tags.filter(x=>x!==id);if(cb.checked)S.tags.push(id);
      S.tagsFound=S.tagsFound.filter(x=>S.tags.includes(x));refresh();
    };
    tg.append(h('label',{},cb,' '+TEXT.tags[id].name+(TAGS[id].off?'（停用）':'')));
  });
  p.append(h('div',{class:'dg'},h('label',{},'標籤（勾選＝擁有，效果立即生效）'),tg,
    h('button',{onclick:()=>{S.tags.forEach(id=>discoverTag(id))}},'揭曉全部（看提示框）'),
    h('button',{onclick:()=>{S.tagsFound=[];refresh()}},'全部設為未發現')));
  // 圖鑑：每種個性各一隻（覆蓋現有圖鑑，用來測試小球之間的互動）
  const give=h('button',{},'取得每種個性各一隻（覆蓋圖鑑）');let armed=0;
  give.onclick=()=>{
    if(!armed){armed=1;give.textContent='再按一次確認：會覆蓋現有圖鑑';setTimeout(()=>{armed=0;give.textContent='取得每種個性各一隻（覆蓋圖鑑）'},4000);return}
    armed=0;devGiveAll();give.textContent='已覆蓋：前 3 隻放進水缸';
  };
  const rev=h('button',{},REVEAL?'還原收藏顯示':'揭曉所有圖鑑資料');
  rev.onclick=()=>{REVEAL=!REVEAL;rev.textContent=REVEAL?'還原收藏顯示':'揭曉所有圖鑑資料'};
  p.append(h('div',{class:'dg'},h('label',{},'圖鑑測試資料'),give,rev));
  // 格蕾特
  const gm=h('input',{type:'checkbox',checked:!!META.grete});
  gm.onchange=()=>{META.grete=gm.checked;if(!META.grete&&S){S.grete=false;S.trans=false}codexSave();refresh()};
  p.append(h('div',{class:'dg'},h('label',{},gm,' 已遇見格蕾特（解鎖小助手按鈕）')));
  // 水質、飽食（拖動立刻生效）
  const sl=(label,get,set,min,max,step)=>{
    const out=h('span',{},String(get()));
    const r=h('input',{type:'range',min,max,step,value:get(),'aria-label':label});
    r.oninput=()=>{set(+r.value);out.textContent=r.value;refresh()};
    return h('div',{},h('label',{},label+'：',out),r)};
  p.append(h('div',{class:'dg'},
    sl('污染（0 乾淨～100 很髒）',()=>Math.round(S.dirt),v=>{S.dirt=v},0,100,1),
    sl('酸鹼度 pH（7 為中性）',()=>+S.ph.toFixed(1),v=>{S.ph=v},4,10,.1),
    sl('飽食（0 很餓～100 很飽）',()=>Math.round(S.sat),v=>{S.sat=v},0,100,1)));
  // 物品：一鍵補齊／清空
  const setInv=(keys,n)=>{keys.forEach(k=>{S.inv[k]=n});refresh()};
  p.append(h('div',{class:'dg'},h('label',{},'物品'),
    h('button',{onclick:()=>setInv(FOODS,9)},'補齊食物'),h('button',{onclick:()=>setInv(FOODS,0)},'清空食物'),
    h('button',{onclick:()=>setInv(['agent'],9)},'補齊換水劑'),h('button',{onclick:()=>setInv(['agent'],0)},'清空換水劑')));
  // 格蕾特：立刻執行一次照顧、預覽事件框
  p.append(h('div',{class:'dg'},h('label',{},'格蕾特'),
    h('button',{onclick:()=>{if(!S.grete){S.grete=true;refresh()}greteDaily()}},'測試格蕾特執行（開啟並跑一次）'),
    h('button',{onclick:()=>runEvent('greteMeet',{preview:true})},'預覽「遇見格蕾特」事件（3 頁，不解鎖）'),
    h('button',{onclick:()=>runEvent('greteAgain',{preview:true})},'預覽「再次遇到」事件'),
    h('button',{onclick:()=>{META.greteMet=false;META.grete=false;S.grete=false;S.trans=false;codexSave();refresh()}},'重置：回到沒見過格蕾特')));
  // 事件測試
  const gt=h('textarea',{rows:3,'aria-label':'提示框文字'});gt.value='這是預覽文字，用來看事件框的排版。\n圖片會在內文後面靠右。';
  p.append(h('div',{class:'dg'},h('label',{},'格蕾特提示框測試'),gt,
    h('button',{onclick:()=>showEvent(gt.value,{img:GRETE_IMG,name:'？？？'})},'跳出事件框（含頭像與名牌）'),
    h('button',{onclick:()=>showEvent(gt.value)},'跳出事件框（無圖）'),
    h('button',{onclick:()=>say(voiceLine(),'voice')},'產生一則心聲')));
  // 顏色
  const hex=h('input',{type:'text',value:S.col,'aria-label':'代表色'});
  const col=h('input',{type:'color',value:parseColor(S.col)||'#58a6ff','aria-label':'選色'});
  const setCol=v=>{const c=parseColor(v);if(!c)return;S.col=c;hex.value=c;col.value=c;paintName($('pname'),c);refresh()};
  hex.onchange=()=>setCol(hex.value);col.oninput=()=>setCol(col.value);
  const colored=h('input',{type:'checkbox',checked:!!S.colored});
  colored.onchange=()=>{S.colored=colored.checked;refresh()};
  const hue=h('input',{type:'range',min:0,max:359,value:S.hue,'aria-label':'核心色相'});
  hue.oninput=()=>{S.hue=+hue.value};
  p.append(h('div',{class:'dg'},h('label',{},'玩家代表色（色碼或選色）'),hex,col,
    h('label',{},colored,' 核心已染上代表色'),h('label',{},'核心色相（未染色時）'),hue));
}
$('bDev').onclick=()=>{const p=$('devp');if(p.hidden){devBuild();p.hidden=false}else p.hidden=true};

// 圖鑑換成「每種個性各一隻」的測試資料（顏色各不同、都活著），前 3 隻直接放進水缸
function devGiveAll(){
  CODEX=TEMPER_IDS.map((id,i)=>codexNorm({id:'dev-'+id,name:TEXT.temper[id].name+'球',pname:META.pname||'測試',col:COLORS[i%COLORS.length],
    hue:i*55,colored:i%2===0,day:7,temp:id,end:'END-02',pg:GIFTS[i%3],pt:TOYS[i%3],at:new Date().toISOString().slice(0,10)}));
  GUEST_IDS=CODEX.slice(0,3).map(e=>e.id);
  codexSave();if(S)syncGuests(true);
}
