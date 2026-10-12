// ===== 圖鑑、收藏與存檔 =====
// 資料存在瀏覽器（localStorage），可「下載進度／上傳進度」成 JSON 檔搬到別的裝置。
// 選單有三頁：說明與存檔／收藏（結局、個性、物品、裝飾）／小球們（以前養的每一隻）。
const CODEX_KEY='xenolarva.codex.v1';
let CODEX=[];          // 養過的每一隻小球（見 codexNorm 的欄位）
let GUEST_IDS=[];      // 勾選「放入水缸」的小球 id（最多 3 隻）
// 跨周目繼承的東西
const META={intro:false,points:0,returned:[],got:{end:[],temper:[],tag:[]},homeUsed:0,outMode:'random',rounds:0,letterMode:'popup',letters:[],letterGot:{normal:0,young:0,farewell:0},farewells:0,shopMet:false,wears:[],tools:[],playMode:'quick',kit:false,grete:false,greteMet:false,chatColor:false,chatDual:false,chatWins:0,souv:{},decor:[],hidden:[],seen:[],pname:'',pcol:''};
//  tools 買過的互動道具（指揮棒）｜playMode 玩耍方式（quick 精簡／play 遊玩）｜wears 買過的裝扮（js/data/wears.js 的 id）｜shopMet 見過言盡（商店開場事件看過）｜farewells 收到幾封「道別」信（算消逝，回歸者名額）｜rounds 完成過幾輪（按「等待新委託」＋1）｜letterMode 收到信紙的方式（popup 跳出／log 只在訊息區）｜letters 收藏的信紙
//  returned 每筆另外記 temp/own/pg/pt/end（寫信用）與 rnd（交還時的輪數）
//  intro 看過開場故事｜points 積分｜returned 已交還的小球紀錄 [{id,name,at,back,gift}]｜got 交還後仍算已收集的結局／個性／標籤｜homeUsed 交還掉的回歸者名額｜outMode 外出方式（random／map）
//  kit 水質檢測儀｜grete 已遇見格蕾特｜decor 撿到的裝飾｜hidden 在水缸隱藏的裝飾｜seen 見過的物品（物品圖鑑）｜pname/pcol 玩家名字與代表色

const saveObj=()=>({v:2,intro:META.intro,points:META.points,returned:META.returned,got:META.got,homeUsed:META.homeUsed,outMode:META.outMode,rounds:META.rounds,letterMode:META.letterMode,letters:META.letters,letterGot:META.letterGot,farewells:META.farewells,shopMet:META.shopMet,wears:META.wears,tools:META.tools,playMode:META.playMode,codex:CODEX,guests:GUEST_IDS,kit:META.kit,grete:META.grete,greteMet:META.greteMet,chatColor:META.chatColor,chatDual:META.chatDual,chatWins:META.chatWins,souv:Object.keys(SOUV_SRC).reduce((o,k)=>(META.souv[k]>0&&(o[k]=META.souv[k]),o),{}),decor:META.decor,hidden:META.hidden,seen:META.seen,pname:META.pname,pcol:META.pcol});

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
    star:!!e.star,hide:false,                                      // 星號（「隱藏」已拿掉，舊存檔隱藏的放回來）
    tags:(Array.isArray(e.tags)?e.tags:[]).map(String).filter(x=>has(TAGS,x)).slice(0,6),   // 已發現的特殊標籤（id）
    own:(Array.isArray(e.own)?e.own:[]).map(String).filter(x=>has(TAGS,x)).slice(0,6),      // 實際擁有的標籤（含沒被發現的，回歸者計數用）
    wear:has(WEARS,e.wear)?e.wear:''                                                          // 戴著的裝扮
  };
}
function readSave(d){
  d=(d&&typeof d==='object')?d:{};
  const list=a=>Array.isArray(a)?a:[];
  const gl=(a,ok)=>[...new Set(list(a).map(String).filter(ok))],gg=d.got&&typeof d.got==='object'?d.got:{};
  const ret=list(d.returned).filter(r=>r&&typeof r==='object').slice(0,500).map(r=>({id:String(r.id||'').slice(0,40),name:String(r.name||'小球').slice(0,8),at:String(r.at||'').slice(0,10),back:String(r.back||'').slice(0,10),gift:r.gift===true,
    temp:has(TEMPERS,r.temp)?r.temp:'',own:(Array.isArray(r.own)?r.own:[]).map(String).filter(x=>has(TAGS,x)).slice(0,6),pg:has(NAME,r.pg)?r.pg:'',pt:has(NAME,r.pt)?r.pt:'',end:has(ENDS,r.end)?r.end:'',rnd:Math.max(0,Math.min(99999,Math.floor(Number(r.rnd))||0))}));
  const str=(v,n)=>String(v==null?'':v).slice(0,n);
  const letters=list(d.letters).filter(x=>x&&typeof x==='object').slice(0,300).map(x=>({id:str(x.id,40),from:str(x.from,8),at:str(x.at,10),kind:['normal','young','farewell'].includes(x.kind)?x.kind:'normal',
    intro:str(x.intro,400),body:str(x.body,800),note:str(x.note,200),note2:str(x.note2,200),img:x.img!==false}));
  const num=(v,m)=>Math.max(0,Math.min(m,Math.floor(Number(v))||0));
  return {intro:d.intro===true,points:num(d.points,999999),returned:ret,homeUsed:num(d.homeUsed,9999),outMode:d.outMode==='map'?'map':'random',rounds:num(d.rounds,99999),farewells:num(d.farewells,9999),shopMet:d.shopMet===true,wears:gl(d.wears,x=>has(WEARS,x)),tools:gl(d.tools,x=>['wand','bucket'].includes(x)),playMode:d.playMode==='play'?'play':'quick',letterMode:d.letterMode==='log'?'log':'popup',letters,letterGot:['normal','young','farewell'].reduce((o,k)=>(o[k]=num(d.letterGot&&d.letterGot[k],9999),o),{}),
    got:{end:gl(gg.end,x=>has(ENDS,x)),temper:gl(gg.temper,x=>has(TEMPERS,x)),tag:gl(gg.tag,x=>has(TAGS,x))},
    codex:list(d.codex).map(codexNorm).filter(Boolean),guests:list(d.guests).map(String),kit:d.kit===true,grete:d.grete===true,greteMet:d.greteMet===true,chatColor:d.chatColor===true,chatDual:d.chatDual===true,chatWins:Math.max(0,Math.min(9999,Math.floor(Number(d.chatWins))||0)),
    souv:Object.keys(SOUV_SRC).reduce((o,k)=>{const n=Math.floor(Number(d.souv&&d.souv[k]));if(n>0)o[k]=Math.min(n,9999);return o},{}),
    decor:list(d.decor).filter(k=>has(DECOR,k)),hidden:list(d.hidden).filter(k=>has(DECOR,k)),seen:list(d.seen).filter(k=>has(NAME,k)),
    pname:String(d.pname||'').slice(0,8),pcol:parseColor(String(d.pcol||''))||''};
}
function codexLoad(){
  try{
    const s=readSave(JSON.parse(localStorage.getItem(CODEX_KEY)||'{}'));
    CODEX=s.codex;GUEST_IDS=s.guests;
    Object.assign(META,{intro:s.intro,points:s.points,returned:s.returned,got:s.got,homeUsed:s.homeUsed,outMode:s.outMode,rounds:s.rounds,farewells:s.farewells,shopMet:s.shopMet,wears:s.wears,tools:s.tools,playMode:s.playMode,letterMode:s.letterMode,letters:s.letters,letterGot:s.letterGot,kit:s.kit,grete:s.grete,greteMet:s.greteMet,chatColor:s.chatColor,chatDual:s.chatDual,chatWins:s.chatWins,souv:s.souv,decor:s.decor,hidden:s.hidden,seen:s.seen,pname:s.pname,pcol:s.pcol});
  }catch(e){}
}
function codexSave(){try{localStorage.setItem(CODEX_KEY,JSON.stringify(saveObj()))}catch(e){}}

// ---------- 收錄與查詢 ----------
function codexRecord(code){
  CODEX.push(codexNorm({name:S.name,pname:S.pname,col:S.col,hue:S.hue,colored:S.colored,tc:S.tc,tb:S.tb,day:S.day,temp:S.temp,end:code,
    pg:S.pref.gift,pt:S.pref.toy,wear:S.wear||'',tags:S.tagsFound,own:S.tags,at:new Date().toISOString().slice(0,10)}));
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
const COLL_TABS=[['end','結局'],['temper','個性'],['item','物品'],['decor','裝飾品'],['tag','標籤'],['souv','禮物'],['letter','信紙']];
let CT='end';
const UNK='？？？';
let REVEAL=false;      // 開發者模式：把所有收藏都顯示成已發現（不會存檔）
// 回傳這個種類的表頭與每一列。found＝已發現
function collData(k){
  if(k==='end'){
    const got=new Set([...CODEX.map(e=>e.end),...META.got.end]);
    return {head:['名稱','說明'],rows:Object.keys(ENDS).map(id=>got.has(id)||REVEAL?{found:1,cells:[ENDS[id][0],ENDS[id][1]]}:{cells:[UNK,UNK]})};
  }
  if(k==='temper'){
    const got=new Set([...CODEX.map(e=>e.temp),...META.got.temper]);
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
      const src=kind==='temper'?h('span',{class:'srcT'},TEXT.temper[key].name):kind==='grad'?h('span',{class:'srcL'},TEXT.letter.src):h('span',{class:'srcG'},TEXT.tags[key].name);
      return n>0||REVEAL?{found:1,cells:[t.name,src,String(n),t.desc]}
        :{cells:[UNK,UNK,'0',UNK]}})};
  }
  if(k==='letter')return {count:META.letters.length,rows:[],custom:letterList};   // 收藏的信紙（js/letters.js 的 letterList；數量＝收藏幾封）
  const got=new Set(CODEX.reduce((a,e)=>a.concat(e.tags),[...META.got.tag]));   // 標籤：有小球在結局前被發現過就算
  return {head:['名稱','說明'],rows:Object.keys(TAGS).map(id=>got.has(id)||REVEAL?{found:1,cells:[TEXT.tags[id].name,TEXT.tags[id].desc]}:{cells:[UNK,UNK]})};
}
function renderColl(){
  const fb=$('cfilter');fb.textContent='';
  COLL_TABS.forEach(([k,t])=>{
    const d=collData(k);
    fb.append(h('button',{class:CT===k?'on':'',onclick:()=>{CT=k;renderColl()}},t,h('small',{},d.count!=null?String(d.count):`${d.rows.filter(r=>r.found).length}/${d.rows.length}`)));
  });
  const d=collData(CT),box=$('collBody');box.textContent='';
  if(d.custom){d.custom(box);return}
  box.append(h('table',{class:'ctab'},
    h('thead',{},h('tr',{},...d.head.map(t=>h('th',{},t)))),
    h('tbody',{},...d.rows.map(r=>h('tr',{class:r.found?'':'unk'},...r.cells.map(c=>h('td',{},c)))))));
}

// ---------- 小球們 ----------
let LF='all';          // 目前的分頁：all 小球們（星號排前面）／ret 已交還
let RENAMING=null;     // 正在改名的小球 id
// 名字那一列：平常是「名字 …… ✎」（筆固定在最右側）；按下筆後變成輸入框＋✔（儲存）＋✖（取消）
function nameRow(e){
  // 名字左邊：小小的星號方塊；右邊：改名（✎）
  const star=h('button',{class:'ib sq lstar'+(e.star?' on':''),'aria-pressed':String(!!e.star),'aria-label':e.star?TEXT.larvae.unstar:TEXT.larvae.star,title:TEXT.larvae.star,onclick:()=>toggleStar(e.id)},e.star?'★':'☆');
  if(RENAMING!==e.id){
    return h('div',{class:'nrow'},star,h('strong',{class:'nm'},e.name),
      h('span',{class:'nbtn'},h('button',{class:'ib pen','aria-label':'改名',title:'改名',onclick:()=>{RENAMING=e.id;renderLarvae()}},'✎')));
  }
  const inp=h('input',{type:'text',maxLength:8,value:e.name,class:'rn','aria-label':'新名字'});
  const ok=()=>renameLarva(e.id,inp.value),no=()=>{RENAMING=null;renderLarvae()};
  inp.onkeydown=ev=>{if(ev.key==='Enter')ok();else if(ev.key==='Escape')no()};
  setTimeout(()=>{inp.focus();inp.select()},0);
  return h('div',{class:'nrow'},star,inp,
    h('span',{class:'nbtn'},h('button',{class:'ib sq','aria-label':'儲存名字',onclick:ok},'✔'),
    h('button',{class:'ib sq','aria-label':'取消改名',onclick:no},'✖')));
}
// 裝扮面板：一次只開一隻（WEAR_OPEN）；WEAR_PV＝正在預覽的裝扮（'' 不戴；null 沒在預覽）
let WEAR_OPEN=null,WEAR_PV=null;
function setWear(e,id){
  e.wear=id;codexSave();
  GUESTS.forEach(g=>{if(g.e===e)g.look=larvaLook(e)});                      // 水缸裡的同伴馬上換上
  WEAR_PV=null;renderLarvae();
}
function wearPanel(e){
  const L=TEXT.larvae,pv=h('canvas',{width:96,height:96,class:'wpv'});
  const show=WEAR_PV!==null?WEAR_PV:e.wear;
  const g=pv.getContext('2d');drawLarva(g,48,46,0,0,'idle_a',{...larvaLook(e),wear:show},0,1,.92);
  const rows=META.wears.map(id=>{
    const on=e.wear===id,pvOn=WEAR_PV===id;
    return h('div',{class:'wrow'},
      h('button',{class:'ib wname'+(pvOn?' on':''),onclick:()=>{WEAR_PV=pvOn?null:id;renderLarvae()}},wearName(id)),
      h('button',{class:'ib wbtn2'+(on?' on':''),onclick:()=>setWear(e,on?'':id)},on?TEXT.bag.wearOff:TEXT.bag.wearOn));
  });
  return h('div',{class:'wpanel'},
    h('div',{class:'wpvbox'},pv,h('div',{class:'dim'},WEAR_PV!==null?L.previewing:(e.wear?wearName(e.wear):L.noWear))),
    h('div',{class:'wlist'},META.wears.length?h('p',{class:'dim'},L.wearHint):h('p',{class:'dim'},L.noWears),...rows));
}
function larvaRow(e){
  const alive=e.end!=='END-07',L=TEXT.larvae;
  const c=h('canvas',{width:96,height:96});thumb(c,e);
  const mid=h('div',{class:'lmid'},
    nameRow(e),
    h('div',{},ENDS[e.end][0],' ｜ ',tipSpan(e.temp)),
    h('div',{class:'dim'},`第 ${e.day} 日｜${e.at||'—'}｜${e.pname||'—'}`),
    h('div',{class:'dim'},'標籤：'+(e.tags.length?e.tags.map(t=>TEXT.tags[t].name).join('、'):'—')),
    h('div',{class:'dim'},`喜歡：${NAME[e.pg]}｜${NAME[e.pt]}`+(e.wear?`｜${L.wearing}：${wearName(e.wear)}`:'')));
  const act=h('div',{class:'lact'});
  if(alive){
    const open=WEAR_OPEN===e.id;
    act.append(h('button',{class:'ib'+(open?' on':''),'aria-expanded':String(open),onclick:()=>{WEAR_OPEN=open?null:e.id;WEAR_PV=null;renderLarvae()}},L.wear));
    const on=GUEST_IDS.includes(e.id);
    act.append(h('button',{class:'ib'+(on?' on':''),'aria-pressed':String(on),onclick:()=>toggleGuest(e.id,!on)},on?'離開水缸':'放入水缸'));
    const rb=h('button',{class:'ib lret'},TEXT.assoc.ret);let armed=0,tm=null;       // 交還給異生會：離開圖鑑、換積分（按兩次確認）
    rb.onclick=()=>{
      if(!armed){armed=1;rb.textContent=fmt(TEXT.assoc.retConfirm,{pts:assocPts(e)});rb.classList.add('arm');tm=setTimeout(()=>{armed=0;rb.textContent=TEXT.assoc.ret;rb.classList.remove('arm')},4000);return}
      clearTimeout(tm);const msg=assocReturn(e);renderLarvae();$('lmsg').textContent=msg;
    };
    act.append(rb);
  }
  return h('div',{class:'lrow'+(alive?'':' dead')},c,mid,act,alive&&WEAR_OPEN===e.id?wearPanel(e):null);
}
function renderLarvae(){
  const L=TEXT.larvae,fb=$('lfilter');fb.textContent='';
  if(LF!=='ret')LF='all';
  [['all',L.tabNow],['ret',L.tabRet]].forEach(([k,t])=>
    fb.append(h('button',{class:LF===k?'on':'',onclick:()=>{LF=k;WEAR_OPEN=null;renderLarvae()}},t)));
  const box=$('llist');box.textContent='';
  if(LF==='ret'){        // 已交還：直接列出紀錄（名字｜交還日期｜信寄了沒）
    $('lstat').textContent=fmt(L.retStat,{n:META.returned.length})+`｜${TEXT.assoc.pts} ${META.points}`;
    if(!META.returned.length){box.append(h('p',{class:'dim'},L.retEmpty));return}
    [...META.returned].reverse().forEach(r=>box.append(h('div',{class:'rrow'},h('strong',{},r.name),h('span',{class:'dim'},fmt(L.retAt,{d:r.back||'—'})),h('span',{class:'dim'},r.gift?L.retLetter:''))));
    return;
  }
  const list=[...CODEX].reverse().sort((a,b)=>(b.star?1:0)-(a.star?1:0));   // 最新的在前，星號排最前面
  $('lstat').textContent=fmt(L.nowStat,{n:list.length})+`｜${TEXT.assoc.pts} ${META.points}`;
  if(!list.length)box.append(h('p',{class:'dim'},'還沒有紀錄。完成一個周目後，小球會出現在這裡。'));
  list.forEach(e=>box.append(larvaRow(e)));
}

// ---------- 選單頁面（從右上角 ☰ 各自打開，沒有切換頁籤）----------
// 頁面：larvae 小球們｜coll 收藏品｜save 設定與存檔（上方兩顆按鈕跳到該段）｜about 說明與公告。標題文字在 TEXT.layout.pages
let TAB='larvae';
const MENU_PAGES=['larvae','coll','save','about'];
const PAGE_ALIAS={info:'save',set:'save',news:'about'};
function showTab(n,sec){
  n=PAGE_ALIAS[n]||n;
  TAB=n;
  MENU_PAGES.forEach(k=>{$('pg_'+k).hidden=(k!==n)});
  $('menuTitle').textContent=TEXT.layout.pages[n];
  if(n==='coll')renderColl();
  if(n==='larvae')renderLarvae();
  if(n==='save'){settingsBuild();$('saveText').value=JSON.stringify(saveObj())}
  $('pg_'+n).scrollTop=0;
  if(n==='save')jumpFit(sec);
  if(n==='about')['aboutBody','newsBody'].forEach(id=>{$(id).scrollTop=0});
}
function openMenu(tab,sec){$('cmsg').textContent='';$('lmsg').textContent='';RENAMING=null;$('ovMenu').classList.add('show');showTab(tab||'larvae',sec)}

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
    s.codex.forEach(e=>{if(!findLarva(e.id)&&!META.returned.some(r=>r.id===e.id)){CODEX.push(e);n++}});
    if(s.intro)META.intro=true;META.points=Math.max(META.points,s.points);META.homeUsed=Math.max(META.homeUsed,s.homeUsed);
    s.returned.forEach(r=>{const o=META.returned.find(x=>x.id===r.id);if(!o)META.returned.push(r);else if(r.gift)o.gift=true});
    META.rounds=Math.max(META.rounds,s.rounds);META.farewells=Math.max(META.farewells,s.farewells);if(s.shopMet)META.shopMet=true;META.wears=[...new Set([...META.wears,...s.wears])];META.tools=[...new Set([...META.tools,...s.tools])];
    s.letters.forEach(x=>{if(!META.letters.some(y=>y.id===x.id))META.letters.push(x)});
    Object.keys(s.letterGot).forEach(k=>{META.letterGot[k]=Math.max(META.letterGot[k]||0,s.letterGot[k])});
    ['end','temper','tag'].forEach(k=>{META.got[k]=[...new Set([...META.got[k],...s.got[k]])]});
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
  Object.assign(META,{intro:false,points:0,returned:[],got:{end:[],temper:[],tag:[]},homeUsed:0,outMode:'random',rounds:0,letterMode:'popup',letters:[],letterGot:{normal:0,young:0,farewell:0},farewells:0,shopMet:false,wears:[],tools:[],playMode:'quick',kit:false,grete:false,greteMet:false,chatColor:false,chatDual:false,chatWins:0,souv:{},decor:[],hidden:[],seen:[],pname:'',pcol:''});
  codexSave();
  if(S){syncGuests(false);refresh()}
  showTab(TAB);
  $('cmsg').textContent='存檔已清除。';
}
