// ===== 圖鑑、收藏與存檔 =====
// 資料存在瀏覽器（localStorage），可「下載進度／上傳進度」成 JSON 檔搬到別的裝置。
// 選單有三頁：說明與存檔／收藏（結局、個性、物品、裝飾）／小球們（以前養的每一隻）。
const CODEX_KEY='xenolarva.codex.v1';
let CODEX=[];          // 養過的每一隻小球（見 codexNorm 的欄位）
let GUEST_IDS=[];      // 勾選「放入水缸」的小球 id（最多 3 隻）
// 跨周目繼承的東西
const META={kit:false,grete:false,greteMet:false,chatColor:false,chatDual:false,chatWins:0,souv:{},decor:[],hidden:[],seen:[],pname:'',pcol:''};
//  kit 水質檢測儀｜grete 已遇見格蕾特｜decor 撿到的裝飾｜hidden 在水缸隱藏的裝飾｜seen 見過的物品（物品圖鑑）｜pname/pcol 玩家名字與代表色

const saveObj=()=>({v:2,codex:CODEX,guests:GUEST_IDS,kit:META.kit,grete:META.grete,greteMet:META.greteMet,chatColor:META.chatColor,chatDual:META.chatDual,chatWins:META.chatWins,souv:Object.keys(SOUV_SRC).reduce((o,k)=>(META.souv[k]>0&&(o[k]=META.souv[k]),o),{}),decor:META.decor,hidden:META.hidden,seen:META.seen,pname:META.pname,pcol:META.pcol});

// ---------- 讀取與驗證（匯入的檔案不可信，每個欄位都檢查）----------
function codexNorm(e){
  if(!e||typeof e!=='object')return null;
  const col=parseColor(String(e.col||''));if(!col)return null;
  return {
    id:String(e.id||Date.now().toString(36)+Math.random().toString(36).slice(2,6)).slice(0,40),
    name:String(e.name||'小球').slice(0,8),pname:String(e.pname||'').slice(0,8),col,
    hue:((+e.hue||0)%360+360)%360,colored:!!e.colored,tc:parseColor(String(e.tc||''))||'',tb:parseColor(String(e.tb||''))||'',
    day:Math.max(1,Math.min(7,Math.round(+e.day)||7)),
    temp:has(TEMPERS,e.temp)?e.temp:'curious',end:has(ENDS,e.end)?e.end:'END-01',
    pg:has(NAME,e.pg)?e.pg:R(GIFTS),pt:has(NAME,e.pt)?e.pt:R(TOYS),      // 舊資料沒有記錄喜好時，隨機補一個（之後存檔就固定了）
    at:String(e.at||'').slice(0,10),
    star:!!e.star,hide:!!e.hide,                                   // 星號、隱藏
    tags:(Array.isArray(e.tags)?e.tags:[]).map(String).filter(x=>has(TAGS,x)).slice(0,6),   // 已發現的特殊標籤（id）
    own:(Array.isArray(e.own)?e.own:[]).map(String).filter(x=>has(TAGS,x)).slice(0,6)       // 實際擁有的標籤（含沒被發現的，回歸者計數用）
  };
}
function readSave(d){
  d=(d&&typeof d==='object')?d:{};
  const list=a=>Array.isArray(a)?a:[];
  return {codex:list(d.codex).map(codexNorm).filter(Boolean),guests:list(d.guests).map(String),kit:d.kit===true,grete:d.grete===true,greteMet:d.greteMet===true,chatColor:d.chatColor===true,chatDual:d.chatDual===true,chatWins:Math.max(0,Math.min(9999,Math.floor(Number(d.chatWins))||0)),
    souv:Object.keys(SOUV_SRC).reduce((o,k)=>{const n=Math.floor(Number(d.souv&&d.souv[k]));if(n>0)o[k]=Math.min(n,9999);return o},{}),
    decor:list(d.decor).filter(k=>has(DECOR,k)),hidden:list(d.hidden).filter(k=>has(DECOR,k)),seen:list(d.seen).filter(k=>has(NAME,k)),
    pname:String(d.pname||'').slice(0,8),pcol:parseColor(String(d.pcol||''))||''};
}
function codexLoad(){
  try{
    const s=readSave(JSON.parse(localStorage.getItem(CODEX_KEY)||'{}'));
    CODEX=s.codex;GUEST_IDS=s.guests;
    Object.assign(META,{kit:s.kit,grete:s.grete,greteMet:s.greteMet,chatColor:s.chatColor,chatDual:s.chatDual,chatWins:s.chatWins,souv:s.souv,decor:s.decor,hidden:s.hidden,seen:s.seen,pname:s.pname,pcol:s.pcol});
  }catch(e){}
}
function codexSave(){try{localStorage.setItem(CODEX_KEY,JSON.stringify(saveObj()))}catch(e){}}

// ---------- 收錄與查詢 ----------
function codexRecord(code){
  CODEX.push(codexNorm({name:S.name,pname:S.pname,col:S.col,hue:S.hue,colored:S.colored,tc:S.tc,tb:S.tb,day:S.day,temp:S.temp,end:code,
    pg:S.pref.gift,pt:S.pref.toy,tags:S.tagsFound,own:S.tags,at:new Date().toISOString().slice(0,10)}));
  codexSave();
}
function seeItem(k){if(has(NAME,k)&&!META.seen.includes(k))META.seen.push(k)}
const findLarva=id=>CODEX.find(e=>e.id===id);
// 會出現在水缸的同伴：勾選、活著、沒被隱藏，最多 3 隻
const guestEntries=()=>GUEST_IDS.map(findLarva).filter(e=>e&&e.end!=='END-07'&&!e.hide).slice(0,3);

function toggleGuest(id,on){
  GUEST_IDS=GUEST_IDS.filter(x=>x!==id);if(on)GUEST_IDS.push(id);
  GUEST_IDS=GUEST_IDS.slice(-3);codexSave();
  $('lmsg').textContent=on?TEXT.guest.queue:TEXT.guest.queueLeave;renderLarvae();
}
function toggleDecor(id,show){
  META.hidden=META.hidden.filter(x=>x!==id);if(!show)META.hidden.push(id);
  codexSave();
}
function toggleStar(id){const e=findLarva(id);if(e){e.star=!e.star;codexSave();renderLarvae()}}
function toggleHide(id){
  const e=findLarva(id);if(!e)return;
  e.hide=!e.hide;
  if(e.hide)GUEST_IDS=GUEST_IDS.filter(x=>x!==id);               // 隱藏的不會出現在水缸
  codexSave();renderLarvae();
}
// 儲存新名字（空白就當作取消）。RENAMING 是目前正在改名的那一隻的 id
function renameLarva(id,v){
  const e=findLarva(id),n=String(v).trim().slice(0,8);
  if(e&&n){e.name=n;GUESTS.forEach(g=>{if(g.e.id===id)g.name=n});codexSave()}
  RENAMING=null;renderLarvae();
}

// ---------- 小圖（把存下來的資料畫成一隻小球）----------
function thumb(c,e){
  if(nLoaded<IMGN.length){setTimeout(()=>thumb(c,e),300);return}
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');
  g.fillStyle=gr;g.fillRect(0,0,96,96);
  drawLarva(g,48,44,0,0,'idle_a',larvaLook(e),0,e.end==='END-07'?.45:1,1);
}
const tipSpan=(id)=>h('span',{class:'tipc','data-tip':TEXT.temper[id].desc,tabindex:0},TEXT.temper[id].name);

// ---------- 收藏（每個種類一頁，文字列表；沒發現的顯示 ？？？）----------
const COLL_TABS=[['end','結局'],['temper','個性'],['item','物品'],['decor','裝飾品'],['tag','標籤'],['souv','禮物']];
let CT='end';
const UNK='？？？';
let REVEAL=false;      // 開發者模式：把所有收藏都顯示成已發現（不會存檔）
// 回傳這個種類的表頭與每一列。found＝已發現
function collData(k){
  if(k==='end'){
    const got=new Set(CODEX.map(e=>e.end));
    return {head:['名稱','說明'],rows:Object.keys(ENDS).map(id=>got.has(id)||REVEAL?{found:1,cells:[ENDS[id][0],ENDS[id][1]]}:{cells:[UNK,UNK]})};
  }
  if(k==='temper'){
    const got=new Set(CODEX.map(e=>e.temp));
    return {head:['名稱','說明'],rows:TEMPER_IDS.map(id=>got.has(id)||REVEAL?{found:1,cells:[TEXT.temper[id].name,TEXT.temper[id].desc]}:{cells:[UNK,UNK]})};
  }
  if(k==='item'){
    const seen=id=>REVEAL||META.seen.includes(id)||(id==='kit'&&META.kit),rows=[];
    ITEM_GROUPS.forEach(([label,ids])=>ids.forEach(id=>rows.push(seen(id)?{found:1,cells:[label,NAME[id],TEXT.item[id]]}:{cells:[label,UNK,UNK]})));
    return {head:['種類','名稱','說明'],rows};
  }
  if(k==='decor'){
    return {head:['顯示','名稱','說明'],rows:Object.keys(DECOR).map(id=>META.decor.includes(id)||REVEAL
      ?{found:1,cells:[META.decor.includes(id)?h('input',{type:'checkbox',checked:!META.hidden.includes(id),'aria-label':'顯示在水缸',onchange:ev=>toggleDecor(id,ev.target.checked)}):'—',DECOR[id].name,TEXT.decor[id]||'']}
      :{cells:['—',UNK,UNK]})};
  }
  if(k==='souv'){
    return {head:['名稱','來源','數量','說明'],rows:Object.keys(SOUV_SRC).map(id=>{
      const n=META.souv[id]||0,[kind,key]=SOUV_SRC[id],t=TEXT.souv[id];
      return n>0||REVEAL?{found:1,cells:[t.name,(kind==='temper'?h('span',{class:'srcT'},TEXT.temper[key].name):h('span',{class:'srcG'},TEXT.tags[key].name)),String(n),t.desc]}
        :{cells:[UNK,UNK,'0',UNK]}})};
  }
  const got=new Set(CODEX.reduce((a,e)=>a.concat(e.tags),[]));   // 標籤：有小球在結局前被發現過就算
  return {head:['名稱','說明'],rows:Object.keys(TAGS).map(id=>got.has(id)||REVEAL?{found:1,cells:[TEXT.tags[id].name,TEXT.tags[id].desc]}:{cells:[UNK,UNK]})};
}
function renderColl(){
  const fb=$('cfilter');fb.textContent='';
  COLL_TABS.forEach(([k,t])=>{
    const d=collData(k);
    fb.append(h('button',{class:CT===k?'on':'',onclick:()=>{CT=k;renderColl()}},t,h('small',{},`${d.rows.filter(r=>r.found).length}/${d.rows.length}`)));
  });
  const d=collData(CT),box=$('collBody');box.textContent='';
  box.append(h('table',{class:'ctab'},
    h('thead',{},h('tr',{},...d.head.map(t=>h('th',{},t)))),
    h('tbody',{},...d.rows.map(r=>h('tr',{class:r.found?'':'unk'},...r.cells.map(c=>h('td',{},c)))))));
}

// ---------- 小球們 ----------
let LF='all';          // 目前的篩選：all 全部／star 星號／hidden 已隱藏
let RENAMING=null;     // 正在改名的小球 id
// 名字那一列：平常是「名字 …… ✎」（筆固定在最右側）；按下筆後變成輸入框＋✔（儲存）＋✖（取消）
function nameRow(e){
  if(RENAMING!==e.id){
    return h('div',{class:'nrow'},h('strong',{class:'nm'},e.name),
      h('span',{class:'nbtn'},h('button',{class:'ib pen','aria-label':'改名',title:'改名',onclick:()=>{RENAMING=e.id;renderLarvae()}},'✎')));
  }
  const inp=h('input',{type:'text',maxLength:8,value:e.name,class:'rn','aria-label':'新名字'});
  const ok=()=>renameLarva(e.id,inp.value),no=()=>{RENAMING=null;renderLarvae()};
  inp.onkeydown=ev=>{if(ev.key==='Enter')ok();else if(ev.key==='Escape')no()};
  setTimeout(()=>{inp.focus();inp.select()},0);
  return h('div',{class:'nrow'},inp,
    h('span',{class:'nbtn'},h('button',{class:'ib sq','aria-label':'儲存名字',onclick:ok},'✔'),
    h('button',{class:'ib sq','aria-label':'取消改名',onclick:no},'✖')));
}
function larvaRow(e){
  const alive=e.end!=='END-07';
  const c=h('canvas',{width:96,height:96});thumb(c,e);
  const mid=h('div',{class:'lmid'},
    nameRow(e),
    h('div',{},ENDS[e.end][0],' ｜ ',tipSpan(e.temp)),
    h('div',{class:'dim'},`第 ${e.day} 日｜${e.at||'—'}｜${e.pname||'—'}`),
    h('div',{class:'dim'},'標籤：'+(e.tags.length?e.tags.map(t=>TEXT.tags[t].name).join('、'):'—')),
    h('div',{class:'dim'},`喜歡：${NAME[e.pg]}｜${NAME[e.pt]}`));
  const act=h('div',{class:'lact'});
  // 消逝的小球不能放進水缸，只能改名、標星號或隱藏
  if(alive&&!e.hide){
    const on=GUEST_IDS.includes(e.id);
    act.append(h('button',{class:'ib'+(on?' on':''),'aria-pressed':String(on),onclick:()=>toggleGuest(e.id,!on)},on?'離開水缸':'放入水缸'));
  }
  act.append(
    h('button',{class:'ib'+(e.star?' on':''),'aria-pressed':String(!!e.star),'aria-label':e.star?'取消星號':'標上星號',onclick:()=>toggleStar(e.id)},e.star?'★':'☆'),
    h('button',{class:'ib',onclick:()=>toggleHide(e.id)},e.hide?'取消隱藏':'隱藏'));
  return h('div',{class:'lrow'+(alive?'':' dead')},c,mid,act);
}
function renderLarvae(){
  const fb=$('lfilter');fb.textContent='';
  [['all','全部'],['star','★ 星號'],['hidden','已隱藏']].forEach(([k,t])=>
    fb.append(h('button',{class:LF===k?'on':'',onclick:()=>{LF=k;renderLarvae()}},t)));
  let list=CODEX.filter(e=>LF==='hidden'?e.hide:LF==='star'?(e.star&&!e.hide):!e.hide);
  list=[...list].reverse();                                              // 最新的在前
  if(LF==='all')list.sort((a,b)=>(b.star?1:0)-(a.star?1:0));             // 全部頁：星號排最前面
  $('lstat').textContent=`顯示 ${list.length} 隻（共養過 ${CODEX.length} 隻）`;
  const box=$('llist');box.textContent='';
  if(!list.length)box.append(h('p',{class:'dim'},CODEX.length?'這個分類沒有小球。':'還沒有紀錄。完成一個周目後，小球會出現在這裡。'));
  list.forEach(e=>box.append(larvaRow(e)));
}

// ---------- 選單開關與分頁 ----------
let TAB='larvae';
function showTab(n){
  TAB=n;
  ['info','coll','larvae'].forEach(k=>{$('pg_'+k).hidden=(k!==n)});
  [...$('mtabs').children].forEach(b=>{b.className=b.getAttribute('data-tab')===n?'on':''});
  if(n==='coll')renderColl();
  if(n==='larvae')renderLarvae();
  if(n==='info')$('saveText').value=JSON.stringify(saveObj());
}
function openMenu(tab){$('cmsg').textContent='';$('lmsg').textContent='';RENAMING=null;showTab(tab||'larvae');$('ovMenu').classList.add('show')}

// ---------- 下載、上傳、合併 ----------
function codexDownload(){
  const b=new Blob([JSON.stringify(saveObj(),null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='xenolarva_save.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
// 合併進度：已經有的小球（相同 id）不會被覆蓋；其他設定取聯集
function codexMerge(txt){
  try{
    const s=readSave(JSON.parse(txt));let n=0;
    s.codex.forEach(e=>{if(!findLarva(e.id)){CODEX.push(e);n++}});
    GUEST_IDS=[...new Set([...GUEST_IDS,...s.guests])].slice(-3);
    if(s.kit)META.kit=true;
    if(s.grete)META.grete=true;
    if(s.greteMet)META.greteMet=true;
    if(s.chatColor)META.chatColor=true;if(s.chatDual)META.chatDual=true;META.chatWins=Math.max(META.chatWins||0,s.chatWins||0);
    Object.keys(s.souv).forEach(k=>{META.souv[k]=Math.max(META.souv[k]||0,s.souv[k])});
    META.decor=[...new Set([...META.decor,...s.decor])];
    META.hidden=[...new Set([...META.hidden,...s.hidden])];
    META.seen=[...new Set([...META.seen,...s.seen])];
    if(!META.pname&&s.pname)META.pname=s.pname;
    if(!META.pcol&&s.pcol)META.pcol=s.pcol;
    prefillPlayer();codexSave();showTab(TAB);
    $('cmsg').textContent=`匯入完成，新增 ${n} 隻。`;
  }catch(err){$('cmsg').textContent='讀取失敗：檔案格式不正確。'}
}
codexLoad();

// ---------- 清除存檔：圖鑑、同伴、物品、裝飾、玩家名字全部清空（目前進行中的周目不受影響）----------
function codexWipe(){
  CODEX=[];GUEST_IDS=[];
  Object.assign(META,{kit:false,grete:false,greteMet:false,chatColor:false,chatDual:false,chatWins:0,souv:{},decor:[],hidden:[],seen:[],pname:'',pcol:''});
  codexSave();
  if(S){syncGuests(false);refresh()}
  showTab(TAB);
  $('cmsg').textContent='存檔已清除。';
}
