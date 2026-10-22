// ===== 觀察水缸模式：沒有換日、和日常模式完全隔開的獨立空間，只看小球們互動、每隻都能戳 =====
// 做法：暫時把 S（遊戲狀態）換成一份空白的假狀態，玩家養的那隻（C）不參與（PV 為 true 時各處都會略過 C），
// 選到的小球（最多 5 隻，來自圖鑑）全部當成 GUESTS 放進水缸。離開時把原本的 S、C、同伴、訊息區、水缸大小全部還原。
// 選擇名單另外存（WATCH_KEY），和說明／圖鑑裡的「放入水缸」勾選互不影響。水缸寬 750×500，背景 assets/larva/bg_preview.png。
const PV_TXT=TEXT.pv;                              // 文字在 js/data/texts.js 的 TEXT.pv
const WATCH_KEY='xenolarva.watch.v1',WATCH_MAX=5;
let WATCH_IDS=[];try{WATCH_IDS=JSON.parse(localStorage.getItem(WATCH_KEY)||'[]').map(String)}catch(e){}
const watchSave=()=>{try{localStorage.setItem(WATCH_KEY,JSON.stringify(WATCH_IDS))}catch(e){}};
let PVS=null;                                    // 進入前的狀態備份
const pvList=()=>CODEX.filter(e=>e.end!=='END-07'&&!e.hide);
const watchEntries=()=>WATCH_IDS.map(findLarva).filter(e=>e&&e.end!=='END-07'&&!e.hide).slice(0,WATCH_MAX);

function setWorld(w){
  const k=w/WORLD.w;
  BUB.forEach(b=>{b.x*=k});
  WORLD.w=w;WORLD.dx=(w-500)/2;WALL.r=w-40;
  cv.width=w*CVK;cv.height=500*CVK;cx.setTransform(CVK,0,0,CVK,0,0);cv.style.aspectRatio=w+'/500';cx.imageSmoothingEnabled=false;
}
// 空白的假狀態：只要讓畫面與移動規則讀得到欄位
const pvState=trans=>({day:1,ap:0,life:90,sat:60,dirt:0,ph:7,trust:60,pname:'',name:'',col:'#ffffff',hue:0,colored:false,over:null,temp:'curious',inv:{},
  found:{gift:true,toy:true},tags:[],tagsFound:[],playedToday:false,noPlay:0,touchGain:9,grete:true,trans:!!trans,preview:true});

function pvBar(){
  const n=watchEntries().length,on=!!(S&&S.trans),t=$('pvTrans');
  $('pvSel').textContent=fmt(PV_TXT.sel,{n,max:WATCH_MAX});
  t.className='tog'+(on?' on':'');t.setAttribute('aria-pressed',String(on));t.textContent=fmt(PV_TXT.trans,{s:on?PV_TXT.on:PV_TXT.off});t.title=PV_TXT.transTitle;
}
// 依選擇更新水缸：新選的飄進來、取消的飄出去
function pvApply(announce){
  const want=watchEntries();
  GUESTS.forEach(g=>{
    if(g.phase!=='out'&&!want.some(e=>e.id===g.e.id)){leaveGuest(g);if(announce)say(fmt(PV_TXT.leave,{name:g.name}),'sys')}
  });
  want.forEach(e=>{
    if(!GUESTS.some(g=>g.e.id===e.id&&g.phase!=='out')){GUESTS.push(makeGuest(e));if(announce)say(fmt(PV_TXT.join,{name:e.name}),'sys')}
  });
  pvBar();
}
// ---------- 選擇小球的彈窗（內容和「小球們」一頁相同，勾選另外存）----------
function watchRow(e){
  const c=h('canvas',{width:96,height:96});thumb(c,e);
  const on=WATCH_IDS.includes(e.id);
  const mid=h('div',{class:'lmid'},h('div',{class:'nrow'},h('strong',{class:'nm'},e.name)),
    h('div',{},ENDS[e.end][0],' ｜ ',tipSpan(e.temp)),
    ...rowInfo(e),
    h('div',{class:'dim'},fmt(TEXT.misc.rowLike,{g:NAME[e.pg],t:NAME[e.pt]})));
  const act=h('div',{class:'lact'},h('button',{class:'ib'+(on?' on':''),'aria-pressed':String(on),onclick:()=>watchToggle(e.id,!on)},on?PV_TXT.watchOff:PV_TXT.watchOn));
  return h('div',{class:'lrow'},c,mid,act);
}
function watchRender(){
  const box=$('wlist');box.textContent='';
  const list=[...pvList()].reverse().sort((a,b)=>(b.star?1:0)-(a.star?1:0));
  $('wstat').textContent=fmt(PV_TXT.stat,{n:watchEntries().length,max:WATCH_MAX});
  if(!list.length)box.append(h('p',{class:'dim'},PV_TXT.noList));
  list.forEach(e=>box.append(watchRow(e)));
}
function watchToggle(id,on){
  WATCH_IDS=WATCH_IDS.filter(x=>x!==id);if(on)WATCH_IDS.push(id);
  WATCH_IDS=WATCH_IDS.filter(x=>findLarva(x)).slice(-WATCH_MAX);watchSave();
  watchRender();if(PV)pvApply(true);
}
function watchOpen(){const b=$('wlist');watchRender();$('ovWatch').classList.add('show')}

function pvEnter(){
  if(PV||$('ovEnd').classList.contains('show'))return;        // 結局框開著時不進來（避免在觀察水缸裡結束這一輪）
  if(!pvList().length){toast(PV_TXT.noList);return}
  ['ovMenu','ovPick','ovBag'].forEach(i=>$(i).classList.remove('show'));$('devp').hidden=true;
  PVS={S,C:Object.assign({},C),GUESTS,M,pokes,SN,EM,log:$('log').innerHTML,start:$('ovStart').classList.contains('show')};
  gameStop();PV=true;S=pvState(false);GUESTS=[];M=null;pokes=[];SN=null;EM=null;
  $('ovStart').classList.remove('show');
  document.body.classList.add('pv');$('pvbar').hidden=false;
  setWorld(750);
  $('log').innerHTML='';
  WATCH_IDS=WATCH_IDS.filter(x=>findLarva(x)).slice(-WATCH_MAX);
  pvApply(false);
  say(watchEntries().length?PV_TXT.hi:PV_TXT.none,'sys');
  if(!watchEntries().length)watchOpen();
}
function pvExit(){
  if(!PV)return;
  const B=PVS;gameStop();PV=false;PVS=null;
  $('ovWatch').classList.remove('show');
  document.body.classList.remove('pv');$('pvbar').hidden=true;
  setWorld(500);
  S=B.S;Object.assign(C,B.C);GUESTS=B.GUESTS;M=B.M;pokes=B.pokes;SN=B.SN;EM=B.EM;
  GUESTS.forEach(g=>{if(g.x>WALL.r+10)g.x=WALL.r-10});
  tagsReset();
  $('log').innerHTML=B.log;$('log').scrollTop=1e9;
  if(B.start)$('ovStart').classList.add('show');
  if(S)refresh();
}
// 點到哪一隻就戳哪一隻（重疊時取最近的）
function pvPoke(x,y){
  const t=performance.now();let best=null,bd=1e9;
  GUESTS.forEach(b=>{
    if(!isLive(b))return;
    const dx=Math.abs(x-b.x),dy=Math.abs(y-(b.y-6));
    if(dx<52&&dy<52&&dx+dy<bd){bd=dx+dy;best=b}
  });
  if(!best||!pokeGuest(best,t,x,y))return;
  if(S.trans){
    const vl=voiceLine({temp:best.e.temp,tags:best.e.own,found:best.e.own,sat:60,dirt:20,life:90,trust:60,self:best});
    say(withLarva(nm(best.name)+'\n'+vl,nm(best.name)),vl===TEXT.grete.nothing?'ev':'voice');
  }
}
$('pvSel').onclick=watchOpen;
$('watchClose').onclick=()=>$('ovWatch').classList.remove('show');
$('pvTrans').onclick=()=>{S.trans=!S.trans;say(S.trans?PV_TXT.transOn:PV_TXT.transOff,'sys');pvBar()};
$('pvExit').onclick=pvExit;
// 觀察水缸的「玩耍」：五種玩具都能玩（不用持有、不耗什麼、不影響日常），一定是「遊玩」方式
const PV_TOYS=['bubble','bell','ball','wand','bucket'];
function pvPlay(){
  if(!GUESTS.some(g=>g.phase!=='out')){toast(PV_TXT.none);return}
  pick(TEXT.play.pick,[{head:TEXT.play.toyHead},...PV_TOYS.map(t=>({id:t,label:NAME[t]}))],t=>gameStart(t),TEXT.play.pvHead);
}
$('pvPlay').onclick=pvPlay;
$('bWatch').onclick=pvEnter;
