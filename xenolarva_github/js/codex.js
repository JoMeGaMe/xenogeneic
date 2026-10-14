// ===== 圖鑑、收藏與存檔 =====
// 資料存在瀏覽器（localStorage），可「下載進度／上傳進度」成 JSON 檔搬到別的裝置。
// 選單有三頁：說明與存檔／收藏（結局、個性、物品、裝飾）／小球們（以前養的每一隻）。
const CODEX_KEY='xenolarva.codex.v1';
let CODEX=[];          // 養過的每一隻小球（見 codexNorm 的欄位）
let GUEST_IDS=[];      // 勾選「放入水缸」的小球 id（最多 3 隻）
// ---------- 跨周目繼承的東西（META）：所有要存的欄位都寫在 SAVE_FIELDS 這張表 ----------
// 新增一個要存的欄位：只要在表裡加一列（預設值、怎麼從存檔讀、合併進度時怎麼合）。META 預設、存檔、讀檔、合併、清除存檔都會照這張表。
//   def：預設值（函式，每次給一份新的）｜read(d)：從存檔物件 d 讀出來並檢查（匯入的檔案不可信）｜merge：合併進度的方式
//     'or' 有一邊是 true 就 true｜'max' 取大的｜'union' 陣列取聯集｜'mine' 保留自己的｜'fill' 自己沒有才用對方的｜函式 (mine,theirs)=>合併後的值
//   save(v)：存檔時要先整理的（沒寫就原樣存）
// 欄位說明：intro 看過開場故事｜points 積分｜returned 已交還的小球 [{id,name,at,back,gift,temp,own,pg,pt,end,rnd,lkind,look}]（rnd＝交還時的輪數；look＝外觀，大樓背景用）
//   got 交還後仍算已收集的結局／個性／標籤｜homeUsed 交還掉的回歸者名額｜outMode 外出方式（random／map）｜rounds 完成過幾輪｜farewells 收到幾封「道別」信
//   letterMode 收到信紙的方式（popup／log）｜letters 收藏的信紙｜letterGot 各種信收過幾封｜crowns 玩耍拿過幾次王冠｜special 預約的特殊委託
//   visited 去過的地點｜buys 買過幾次｜achGot 領過的成就｜achSeen 達成過（跳過橫幅）的成就｜heartLv 心等｜hallMet／joanMet／silenceMet 看過大樓／瓊／賽倫絲的開場
//   shopMet 見過言盡｜wears 有的裝扮｜tools 永久道具（指揮棒、水桶、雜誌）｜playMode 玩耍方式（quick／play）｜kit 水質檢測儀｜grete 遇見格蕾特｜greteMet 認識格蕾特
//   chatColor／chatDual 學會聊天染色／雙色｜chatWins 染色成功幾次｜souv 禮物收藏｜decor 撿到的裝飾｜hidden 在水缸隱藏的裝飾｜seen 見過的物品｜pname／pcol 玩家名字與代表色
const _list=a=>Array.isArray(a)?a:[];
const _gl=(a,ok)=>[...new Set(_list(a).map(String).filter(ok))];
const _num=(v,m)=>Math.max(0,Math.min(m,Math.floor(Number(v))||0));
const _str=(v,n)=>String(v==null?'':v).slice(0,n);
const _bool=k=>({def:()=>false,read:d=>d[k]===true,merge:'or'});
const _hue=v=>((+v||0)%360+360)%360;
const _look=l=>l&&parseColor(String(l.col||''))?{col:parseColor(String(l.col)),hue:_hue(l.hue),colored:!!l.colored,tc:parseColor(String(l.tc||''))||'',tb:parseColor(String(l.tb||''))||'',
  tb2:parseColor(String(l.tb2||''))||'',tbm:['v','h'].includes(l.tbm)?l.tbm:'',tbs:l.tbs==='split'?'split':'soft',day:Math.max(1,Math.min(7,+l.day||7))}:null;
const _byId=(mine,theirs)=>{theirs.forEach(x=>{if(!mine.some(y=>y.id===x.id))mine.push(x)});return mine};
const _maxKeys=(mine,theirs)=>{Object.keys(theirs).forEach(k=>{mine[k]=Math.max(mine[k]||0,theirs[k])});return mine};
const LETTER_KINDS=['normal','young','farewell'];
const SAVE_FIELDS={
  intro:_bool('intro'),
  points:{def:()=>0,read:d=>_num(d.points,999999),merge:'max'},
  returned:{def:()=>[],merge:(m,t)=>{t.forEach(r=>{const o=m.find(x=>x.id===r.id);if(!o)m.push(r);else if(r.gift)o.gift=true});return m},
    read:d=>_list(d.returned).filter(r=>r&&typeof r==='object').slice(0,500).map(r=>({id:_str(r.id||'',40),name:String(r.name||'小球').slice(0,8),at:_str(r.at,10),back:_str(r.back,10),gift:r.gift===true,
      temp:has(TEMPERS,r.temp)?r.temp:'',own:_list(r.own).map(String).filter(x=>has(TAGS,x)).slice(0,6),pg:has(NAME,r.pg)?r.pg:'',pt:has(NAME,r.pt)?r.pt:'',end:has(ENDS,r.end)?r.end:'',
      rnd:_num(r.rnd,99999),lkind:LETTER_KINDS.includes(r.lkind)?r.lkind:'',look:_look(r.look)}))},
  got:{def:()=>({end:[],temper:[],tag:[]}),merge:(m,t)=>{['end','temper','tag'].forEach(k=>{m[k]=[...new Set([...m[k],...t[k]])]});return m},
    read:d=>{const g=d.got&&typeof d.got==='object'?d.got:{};return {end:_gl(g.end,x=>has(ENDS,x)),temper:_gl(g.temper,x=>has(TEMPERS,x)),tag:_gl(g.tag,x=>has(TAGS,x))}}},
  homeUsed:{def:()=>0,read:d=>_num(d.homeUsed,9999),merge:'max'},
  outMode:{def:()=>'random',read:d=>d.outMode==='map'?'map':'random',merge:'mine'},
  rounds:{def:()=>0,read:d=>_num(d.rounds,99999),merge:'max'},
  letterMode:{def:()=>'popup',read:d=>d.letterMode==='log'?'log':'popup',merge:'mine'},
  letters:{def:()=>[],merge:_byId,
    read:d=>_list(d.letters).filter(x=>x&&typeof x==='object').slice(0,300).map(x=>({id:_str(x.id,40),from:_str(x.from,8),at:_str(x.at,10),kind:LETTER_KINDS.includes(x.kind)?x.kind:'normal',
      intro:_str(x.intro,400),body:_str(x.body,800),note:_str(x.note,200),note2:_str(x.note2,200),img:x.img!==false}))},
  letterGot:{def:()=>({normal:0,young:0,farewell:0}),read:d=>LETTER_KINDS.reduce((o,k)=>(o[k]=_num(d.letterGot&&d.letterGot[k],9999),o),{}),merge:_maxKeys},
  crowns:{def:()=>0,read:d=>_num(d.crowns,99999),merge:'max'},
  visited:{def:()=>[],read:d=>_gl(d.visited,x=>has(PLACES,x)),merge:'union'},
  buys:{def:()=>0,read:d=>_num(d.buys,99999),merge:'max'},
  special:{def:()=>null,merge:'fill',
    read:d=>d.special&&has(TEMPERS,d.special.temp)?{temp:d.special.temp,tags:_list(d.special.tags).map(String).filter(x=>has(TAGS,x)).slice(0,2),hue:_hue(d.special.hue),why:String(d.special.why||'').slice(0,200),rnd:_num(d.special.rnd,99999)}:null},
  achGot:{def:()=>[],read:d=>_gl(d.achGot,x=>ACH.some(a=>a.id===x)),merge:'union'},
  achSeen:{def:()=>[],read:d=>_gl(d.achSeen,x=>ACH.some(a=>a.id===x)),merge:'union'},
  heartLv:{def:()=>1,read:d=>Math.max(1,Math.min(HEART_RULE.max,_num(d.heartLv,9)||1)),merge:'max'},
  hallMet:_bool('hallMet'),joanMet:_bool('joanMet'),silenceMet:_bool('silenceMet'),
  farewells:{def:()=>0,read:d=>_num(d.farewells,9999),merge:'max'},
  shopMet:_bool('shopMet'),
  wears:{def:()=>[],read:d=>_gl(d.wears,x=>has(WEARS,x)),merge:'union'},
  tools:{def:()=>[],read:d=>_gl(d.tools,x=>['wand','bucket','magV','magH'].includes(x)),merge:'union'},
  playMode:{def:()=>'quick',read:d=>d.playMode==='play'?'play':'quick',merge:'mine'},
  kit:_bool('kit'),grete:_bool('grete'),greteMet:_bool('greteMet'),chatColor:_bool('chatColor'),chatDual:_bool('chatDual'),
  chatWins:{def:()=>0,read:d=>_num(d.chatWins,9999),merge:'max'},
  souv:{def:()=>({}),merge:_maxKeys,save:v=>Object.keys(SOUV_SRC).reduce((o,k)=>(v[k]>0&&(o[k]=v[k]),o),{}),
    read:d=>Object.keys(SOUV_SRC).reduce((o,k)=>{const n=Math.floor(Number(d.souv&&d.souv[k]));if(n>0)o[k]=Math.min(n,9999);return o},{})},
  decor:{def:()=>[],read:d=>_list(d.decor).filter(k=>has(DECOR,k)),merge:'union'},
  hidden:{def:()=>[],read:d=>_list(d.hidden).filter(k=>has(DECOR,k)),merge:'union'},
  seen:{def:()=>[],read:d=>_list(d.seen).filter(k=>has(NAME,k)),merge:'union'},
  pname:{def:()=>'',read:d=>String(d.pname||'').slice(0,8),merge:'fill'},
  pcol:{def:()=>'',read:d=>parseColor(String(d.pcol||''))||'',merge:'fill'}
};
const metaDefaults=()=>Object.keys(SAVE_FIELDS).reduce((o,k)=>(o[k]=SAVE_FIELDS[k].def(),o),{});
const META=metaDefaults();
// 存檔物件：v（格式版本）＋ META 的每個欄位 ＋ 圖鑑（codex）與同伴（guests）
const saveObj=()=>{const o={v:2};for(const k in SAVE_FIELDS){const F=SAVE_FIELDS[k];o[k]=F.save?F.save(META[k]):META[k]}o.codex=CODEX;o.guests=GUEST_IDS;return o};
// 合併：把 theirs（讀好的存檔）併進 META
function metaMerge(s){
  for(const k in SAVE_FIELDS){
    const m=SAVE_FIELDS[k].merge,a=META[k],b=s[k];
    META[k]=typeof m==='function'?m(a,b):m==='or'?(a||b):m==='max'?Math.max(a||0,b||0):m==='union'?[...new Set([...a,...b])]:m==='fill'?(a||b):a;
  }
}

// ---------- 讀取與驗證（匯入的檔案不可信，每個欄位都檢查）----------
function codexNorm(e){
  if(!e||typeof e!=='object')return null;
  const col=parseColor(String(e.col||''));if(!col)return null;
  return {
    id:String(e.id||Date.now().toString(36)+Math.random().toString(36).slice(2,6)).slice(0,40),
    name:String(e.name||'小球').slice(0,8),pname:String(e.pname||'').slice(0,8),col,
    hue:((+e.hue||0)%360+360)%360,colored:!!e.colored,tc:parseColor(String(e.tc||''))||'',tb:parseColor(String(e.tb||''))||'',
    tb2:parseColor(String(e.tb2||''))||'',tbm:['v','h'].includes(e.tbm)?e.tbm:'',tbs:e.tbs==='split'?'split':'soft',
    day:Math.max(1,Math.min(7,Math.round(+e.day)||7)),
    temp:has(TEMPERS,e.temp)?e.temp:'curious',end:has(ENDS,e.end)?e.end:'END-01',
    pg:has(NAME,e.pg)?e.pg:R(GIFTS),pt:has(NAME,e.pt)?e.pt:R(TOYS),      // 舊資料沒有記錄喜好時，隨機補一個（之後存檔就固定了）
    at:String(e.at||'').slice(0,10),
    star:!!e.star,hide:false,                                      // 星號（「隱藏」已拿掉，舊存檔隱藏的放回來）
    tags:(Array.isArray(e.tags)?e.tags:[]).map(String).filter(x=>has(TAGS,x)).slice(0,6),   // 已發現的特殊標籤（id）
    own:(Array.isArray(e.own)?e.own:[]).map(String).filter(x=>has(TAGS,x)).slice(0,6),      // 實際擁有的標籤（含沒被發現的，回歸者計數用）
    wear:has(WEARS,e.wear)?e.wear:'',                                                         // 戴著的裝扮
    wearCol:e.wearCol==='rainbow'?'rainbow':(parseColor(String(e.wearCol||''))||'')            // 發光裝扮的顏色（'' 或 rainbow＝彩虹）
  };
}
function readSave(d){
  d=(d&&typeof d==='object')?d:{};
  const o={};for(const k in SAVE_FIELDS)o[k]=SAVE_FIELDS[k].read(d);
  o.codex=_list(d.codex).map(codexNorm).filter(Boolean);o.guests=_list(d.guests).map(String);
  return o;
}
function codexLoad(){
  try{
    const s=readSave(JSON.parse(localStorage.getItem(CODEX_KEY)||'{}'));
    CODEX=s.codex;GUEST_IDS=s.guests;
    for(const k in SAVE_FIELDS)META[k]=s[k];
  }catch(e){}
}
const saveRaw=()=>{try{localStorage.setItem(CODEX_KEY,JSON.stringify(saveObj()))}catch(e){}};   // 只寫進瀏覽器（不檢查成就）
function codexSave(){saveRaw();if(typeof achSoon==='function')achSoon()}   // 存檔後檢查成就（js/hall.js）

// ---------- 收錄與查詢 ----------
function codexRecord(code){
  CODEX.push(codexNorm({name:S.name,pname:S.pname,col:S.col,hue:S.hue,colored:S.colored,tc:S.tc,tb:S.tb,tb2:S.tb2,tbm:S.tbm,tbs:S.tbs,day:S.day,temp:S.temp,end:code,
    pg:S.pref.gift,pt:S.pref.toy,wear:S.wear||'',wearCol:S.wearCol||'',tags:S.tagsFound,own:S.tags,at:new Date().toISOString().slice(0,10)}));
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
// 小球那一列共用的兩行：第幾日｜日期｜照顧者、標籤（小球們、觀察水缸的選擇都用）
const rowInfo=e=>[h('div',{class:'dim'},fmt(TEXT.misc.rowInfo,{day:e.day,at:e.at||'—',p:e.pname||'—'})),
  h('div',{class:'dim'},TEXT.misc.rowTags+(e.tags.length?e.tags.map(t=>TEXT.tags[t].name).join('、'):'—'))];
const tipSpan=(id)=>h('span',{class:'tipc','data-tip':TEXT.temper[id].desc,tabindex:0},TEXT.temper[id].name);

// ---------- 收藏（每個種類一頁，文字列表；沒發現的顯示 ？？？）----------
const COLL_TABS=['end','temper','item','decor','tag','souv','letter'];   // 名字在 TEXT.misc.collTabs
let CT='end';
const UNK='？？？';
let REVEAL=false;      // 開發者模式：把所有收藏都顯示成已發現（不會存檔）
// 回傳這個種類的表頭與每一列。found＝已發現
function collData(k){
  const X_=TEXT.misc;
  if(k==='end'){
    const got=new Set([...CODEX.map(e=>e.end),...META.got.end]);
    return {head:[X_.colName,X_.colDesc],rows:Object.keys(ENDS).map(id=>got.has(id)||REVEAL?{found:1,cells:[ENDS[id][0],ENDS[id][1]]}:{cells:[UNK,UNK]})};
  }
  if(k==='temper'){
    const got=new Set([...CODEX.map(e=>e.temp),...META.got.temper]);
    return {head:[X_.colName,X_.colDesc],rows:TEMPER_IDS.map(id=>got.has(id)||REVEAL?{found:1,cells:[TEXT.temper[id].name,TEXT.temper[id].desc]}:{cells:[UNK,UNK]})};
  }
  if(k==='item'){
    const seen=id=>REVEAL||META.seen.includes(id)||(id==='kit'&&META.kit),rows=[];
    ITEM_GROUPS.forEach(([label,ids])=>ids.forEach(id=>rows.push(seen(id)?{found:1,cells:[label,NAME[id],TEXT.item[id]]}:{cells:[label,UNK,UNK]})));
    return {head:[X_.colKind,X_.colName,X_.colDesc],rows};
  }
  if(k==='decor'){
    return {head:[X_.colShow,X_.colName,X_.colDesc],rows:Object.keys(DECOR).map(id=>META.decor.includes(id)||REVEAL
      ?{found:1,cells:[META.decor.includes(id)?h('input',{type:'checkbox',checked:!META.hidden.includes(id),'aria-label':X_.showInTank,onchange:ev=>toggleDecor(id,ev.target.checked)}):'—',DECOR[id].name,TEXT.decor[id]||'']}
      :{cells:['—',UNK,UNK]})};
  }
  if(k==='souv'){
    return {head:[X_.colName,X_.colSrc,X_.colCount,X_.colDesc],rows:Object.keys(SOUV_SRC).map(id=>{
      const n=META.souv[id]||0,[kind,key]=SOUV_SRC[id],t=TEXT.souv[id];
      const src=kind==='temper'?h('span',{class:'srcT'},TEXT.temper[key].name):kind==='grad'?h('span',{class:'srcL'},TEXT.letter.src):h('span',{class:'srcG'},TEXT.tags[key].name);
      return n>0||REVEAL?{found:1,cells:[t.name,src,String(n),t.desc]}
        :{cells:[UNK,UNK,'0',UNK]}})};
  }
  if(k==='letter')return {count:META.letters.length,rows:[],custom:letterList};   // 收藏的信紙（js/letters.js 的 letterList；數量＝收藏幾封）
  const got=new Set(CODEX.reduce((a,e)=>a.concat(e.tags),[...META.got.tag]));   // 標籤：有小球在結局前被發現過就算
  return {head:[X_.colName,X_.colDesc],rows:Object.keys(TAGS).map(id=>got.has(id)||REVEAL?{found:1,cells:[TEXT.tags[id].name,TEXT.tags[id].desc]}:{cells:[UNK,UNK]})};
}
function renderColl(){
  const fb=$('cfilter');fb.textContent='';
  COLL_TABS.forEach(k=>{const t=TEXT.misc.collTabs[k];
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
let LF='all';          // 目前的分頁：all 小球們（星號排前面）／dress 打扮／ret 已交還
let RENAMING=null;     // 正在改名的小球 id
// 名字那一列：平常是「名字 …… ✎」（筆固定在最右側）；按下筆後變成輸入框＋✔（儲存）＋✖（取消）
function nameRow(e){
  // 名字左邊：小小的星號方塊；右邊：改名（✎）
  const star=h('button',{class:'ib sq lstar'+(e.star?' on':''),'aria-pressed':String(!!e.star),'aria-label':e.star?TEXT.larvae.unstar:TEXT.larvae.star,title:TEXT.larvae.star,onclick:()=>toggleStar(e.id)},e.star?'★':'☆');
  if(RENAMING!==e.id){
    return h('div',{class:'nrow'},star,h('strong',{class:'nm'},e.name),
      h('span',{class:'nbtn'},h('button',{class:'ib pen','aria-label':TEXT.misc.rename,title:TEXT.misc.rename,onclick:()=>{RENAMING=e.id;renderLarvae()}},'✎')));
  }
  const inp=h('input',{type:'text',maxLength:8,value:e.name,class:'rn','aria-label':TEXT.misc.newName});
  const ok=()=>renameLarva(e.id,inp.value),no=()=>{RENAMING=null;renderLarvae()};
  inp.onkeydown=ev=>{if(ev.key==='Enter')ok();else if(ev.key==='Escape')no()};
  setTimeout(()=>{inp.focus();inp.select()},0);
  return h('div',{class:'nrow'},star,inp,
    h('span',{class:'nbtn'},h('button',{class:'ib sq','aria-label':TEXT.misc.saveName,onclick:ok},'✔'),
    h('button',{class:'ib sq','aria-label':TEXT.misc.cancelName,onclick:no},'✖')));
}
function larvaRow(e){
  const alive=e.end!=='END-07',L=TEXT.larvae;
  const c=h('canvas',{width:96,height:96});thumb(c,e);
  const mid=h('div',{class:'lmid'},
    nameRow(e),
    h('div',{},ENDS[e.end][0],' ｜ ',tipSpan(e.temp)),
    ...rowInfo(e),
    h('div',{class:'dim'},fmt(TEXT.misc.rowLike,{g:NAME[e.pg],t:NAME[e.pt]})+(e.wear?`｜${L.wearing}：${wearName(e.wear)}`:'')));
  const act=h('div',{class:'lact'});
  if(alive){
    const on=GUEST_IDS.includes(e.id);
    act.append(h('button',{class:'ib'+(on?' on':''),'aria-pressed':String(on),onclick:()=>toggleGuest(e.id,!on)},on?TEXT.misc.guestOff:TEXT.misc.guestOn));
    const rb=h('button',{class:'ib lret'},TEXT.assoc.ret);let armed=0,tm=null;       // 交還給異生會：離開圖鑑、換積分（按兩次確認）
    rb.onclick=()=>{
      if(!armed){armed=1;rb.textContent=fmt(TEXT.assoc.retConfirm,{pts:assocPts(e)});rb.classList.add('arm');tm=setTimeout(()=>{armed=0;rb.textContent=TEXT.assoc.ret;rb.classList.remove('arm')},4000);return}
      clearTimeout(tm);const msg=assocReturn(e);renderLarvae();$('lmsg').textContent=msg;
    };
    act.append(rb);
  }
  return h('div',{class:'lrow'+(alive?'':' dead')},c,mid,act);
}
function renderLarvae(){
  const L=TEXT.larvae,fb=$('lfilter');fb.textContent='';
  if(!['ret','dress'].includes(LF))LF='all';
  // 分頁：小球們｜已交還｜（空一格）｜打扮（打扮用比較淡的顏色，和另外兩個區分）
  [['all',L.tabNow],['ret',L.tabRet],[null],['dress',L.tabDress]].forEach(([k,t])=>
    fb.append(k?h('button',{class:(LF===k?'on':'')+(k==='dress'?' tdress':''),onclick:()=>{LF=k;if(k==='dress')DRESS.who=null;renderLarvae()}},t):h('span',{class:'tgap'})));
  const box=$('llist');box.textContent='';
  $('pg_larvae').classList.toggle('dressing',LF==='dress');
  if(LF==='dress'){dressRender(box);return}
  if(LF==='ret'){        // 已交還：直接列出紀錄（名字｜交還日期｜信寄了沒）
    $('lstat').textContent=fmt(L.retStat,{n:META.returned.length})+`｜${TEXT.assoc.pts} ${META.points}`;
    if(!META.returned.length){box.append(h('p',{class:'dim'},L.retEmpty));return}
    [...META.returned].reverse().forEach(r=>box.append(h('div',{class:'rrow'},h('strong',{},r.name),h('span',{class:'dim'},fmt(L.retAt,{d:r.back||'—'})),h('span',{class:'dim'},r.gift?L.retLetter:''))));
    return;
  }
  const list=[...CODEX].reverse().sort((a,b)=>(b.star?1:0)-(a.star?1:0));   // 最新的在前，星號排最前面
  $('lstat').textContent=fmt(L.nowStat,{n:list.length})+`｜${TEXT.assoc.pts} ${META.points}`;
  if(!list.length)box.append(h('p',{class:'dim'},TEXT.misc.noLarva));
  list.forEach(e=>box.append(larvaRow(e)));
}

// ---------- 打扮（小球們的第二個分頁）----------
// 上：選小球（這一輪的小球＋圖鑑裡還在的，橫向捲動）｜中：預覽＋「打扮好了」｜下：分類＋裝扮格子（框內捲動）。電腦版：左預覽、右兩個選單。
// 選好裝扮要按「打扮好了」才會換上；換別隻或離開＝放棄。DRESS.who＝'_cur'（這一輪）或圖鑑 id；pick＝選的裝扮（'' 不戴）
const DRESS={who:null,pick:null,cat:'all',col:'rainbow'};   // col：發光裝扮（螢光棒）選的顏色
function dressList(){
  const L=[];
  if(S&&!S.over&&!PV)L.push({id:'_cur',name:S.name,look:()=>larvaLook(S),wear:()=>S.wear||'',col:()=>S.wearCol||'rainbow',cur:true});
  [...CODEX].reverse().sort((a,b)=>(b.star?1:0)-(a.star?1:0)).filter(e=>e.end!=='END-07')
    .forEach(e=>L.push({id:e.id,name:e.name,look:()=>larvaLook(e),wear:()=>e.wear||'',col:()=>e.wearCol||'rainbow',e}));
  return L;
}
function dressDraw(c,look,wear,col,tt){
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');g.fillStyle=gr;g.fillRect(0,0,96,96);
  if(nLoaded<IMGN.length){setTimeout(()=>dressDraw(c,look,wear,col),300);return}
  drawLarva(g,48,44,0,0,'idle_a',{...look,wear,wcol:col||look.wcol},tt||0,1,1);
}
// 會發光的裝扮：畫布持續重畫（彩虹會慢慢換色），離開畫面就停
function dressGlowLoop(c,look,wear,col){
  if(!wear||!WEARS[wear]||!WEARS[wear].glow)return;
  const tm=setInterval(()=>{if(!c.isConnected){clearInterval(tm);return}dressDraw(c,look,wear,col,performance.now()/1000)},100);
}
function dressRender(box){
  const L=TEXT.larvae,list=dressList();
  if(!list.length){box.append(h('p',{class:'dim'},L.dressNoLarva));$('lstat').textContent='';return}
  let who=list.find(x=>x.id===DRESS.who);
  if(!who){who=list[0];DRESS.who=who.id;DRESS.pick=null}
  if(DRESS.pick===null){DRESS.pick=who.wear();DRESS.col=who.col()}
  $('lstat').textContent=L.dressHint;
  // 小球
  const strip=h('div',{class:'dwho'},...list.map(x=>{
    const c=h('canvas',{width:96,height:96});dressDraw(c,x.look(),x.wear(),x.col());dressGlowLoop(c,x.look(),x.wear(),x.col());
    return h('button',{class:'dchip'+(x.id===who.id?' on':''),onclick:()=>{DRESS.who=x.id;DRESS.pick=null;renderLarvae()}},c,h('span',{},x.cur?L.dressCur+'｜'+x.name:x.name));
  }));
  // 預覽
  const glow=!!(DRESS.pick&&WEARS[DRESS.pick]&&WEARS[DRESS.pick].glow);
  const pv=h('canvas',{width:96,height:96,class:'dpvc'});dressDraw(pv,who.look(),DRESS.pick,DRESS.col);dressGlowLoop(pv,who.look(),DRESS.pick,DRESS.col);
  const changed=DRESS.pick!==who.wear()||(glow&&DRESS.col!==who.col());
  const done=h('button',{class:'ddone main',disabled:!changed,onclick:()=>dressApply(who)},L.dressDone);
  // 發光裝扮：選顏色（色票＋彩虹）
  const colRow=glow?h('div',{class:'dcols'},h('span',{class:'t3'},L.dressColor),
    ...COLORS.map((c,i)=>h('button',{class:'sw1'+(DRESS.col===c?' sel':''),style:'background:'+c,title:CNAME[i],'aria-label':CNAME[i],onclick:()=>{DRESS.col=c;renderLarvae()}})),
    h('button',{class:'sw1 rainbow'+(DRESS.col==='rainbow'?' sel':''),title:L.dressRainbow,'aria-label':L.dressRainbow,onclick:()=>{DRESS.col='rainbow';renderLarvae()}})):null;
  const pvBox=h('div',{class:'dpv'},pv,h('div',{class:'dinfo'},h('strong',{},who.name),h('span',{class:'dim'},DRESS.pick?wearName(DRESS.pick):L.dressNone)),done,colRow);
  // 裝扮
  const cats=Object.keys(L.dressCats);
  const tabs=h('div',{class:'filter dcats'},...cats.map(k=>h('button',{class:DRESS.cat===k?'on':'',onclick:()=>{DRESS.cat=k;renderLarvae()}},L.dressCats[k])));
  const own=META.wears.filter(id=>WEARS[id]&&(DRESS.cat==='all'||WEARS[id].cat===DRESS.cat));
  const cell=(id,label,pic)=>h('button',{class:'dcell'+(DRESS.pick===id?' on':'')+(who.wear()===id?' worn':''),onclick:()=>{DRESS.pick=id;renderLarvae()}},pic,h('span',{},label));
  const grid=h('div',{class:'dgrid'},cell('',L.dressNone,h('span',{class:'dnone'},'∅')),...own.map(id=>cell(id,wearName(id),wearIcon(id))));
  const pick=h('div',{class:'dpick'},tabs,META.wears.length?grid:h('p',{class:'dim'},L.noWears));
  box.append(h('div',{class:'dress'},strip,pvBox,pick));
  const on=strip.querySelector('.on');if(on)requestAnimationFrame(()=>{const r=on.offsetLeft-strip.offsetLeft;if(r<strip.scrollLeft||r+on.offsetWidth>strip.scrollLeft+strip.clientWidth)strip.scrollLeft=r-8});   // 選中的那隻捲進畫面（不用 scrollIntoView，免得整頁橫移）
}
function dressApply(who){
  const L=TEXT.larvae,id=DRESS.pick,wc=id&&WEARS[id]&&WEARS[id].glow?DRESS.col:'';
  if(who.cur){S.wear=id;S.wearCol=wc;if(id&&hasTag('vain')){emote('heart');discoverTag('vain')}}   // 愛美：一戴上就很開心
  else{who.e.wear=id;who.e.wearCol=wc;GUESTS.forEach(g=>{if(g.e===who.e)g.look=larvaLook(who.e)})}   // 水缸裡的同伴馬上換上
  codexSave();
  const msg=id?fmt(L.dressOn,{name:who.name,item:wearName(id)}):fmt(L.dressOff,{name:who.name});
  say(msg,'sys');DRESS.pick=null;renderLarvae();$('lmsg').textContent=msg;
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
    metaMerge(s);
    GUEST_IDS=[...new Set([...GUEST_IDS,...s.guests])].slice(-3);
    prefillPlayer();codexSave();showTab(TAB);
    $('cmsg').textContent=fmt(TEXT.misc.mergeOk,{n});
  }catch(err){$('cmsg').textContent=TEXT.misc.mergeBad}
}
codexLoad();

// ---------- 清除存檔：圖鑑、同伴、物品、裝飾、玩家名字全部清空（目前進行中的周目不受影響）----------
function codexWipe(){
  CODEX=[];GUEST_IDS=[];
  Object.assign(META,metaDefaults());
  codexSave();
  if(S){syncGuests(false);refresh()}
  showTab(TAB);
  $('cmsg').textContent=TEXT.misc.wiped;
}
