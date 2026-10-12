// ===== 外出地圖（外出方式＝「自選地點（地圖）」時，按出門會打開）=====
// 上面是地圖（底圖 MAP_IMG＋程式放的名牌，位置在 js/data/places.js），下面是說明。
// 點一下名牌＝選取（名牌變成「前往」、下方顯示說明），再點一次＝出發。住所＝回家（不出門、不耗行動）；灰色名牌＝之後開放；shop＝商店。
let MAP_SEL=null;
function mapOpen(){
  MAP_SEL=null;
  $('mapTitle').textContent=TEXT.map.title;
  $('mapImg').src=MAP_IMG;
  mapDraw();
  $('ovMap').classList.add('show');
}
function mapClose(){$('ovMap').classList.remove('show');MAP_SEL=null}
function mapDraw(){
  const W=$('mapWrap'),M=TEXT.map;
  W.querySelectorAll('.pin').forEach(e=>e.remove());
  Object.keys(PLACES).forEach(id=>{
    const P=PLACES[id],sel=MAP_SEL===id;
    const label=sel&&!P.locked?(P.home?M.back:M.go):TEXT.place[id].name;
    const b=h('button',{class:'pin'+(sel?' sel':'')+(P.locked?' locked':'')+(P.home?' home':''),style:`left:${P.x}%;top:${P.y}%`,
      'aria-label':TEXT.place[id].name+(P.locked?'（'+M.locked+'）':''),onclick:()=>mapTap(id)},label);
    W.append(b);
  });
  // 說明區：沒選＝操作提示；選了＝名字、說明、比較容易撿到什麼
  const I=$('mapInfo');I.textContent='';
  if(!MAP_SEL){I.append(h('p',{class:'dim'},M.hint));return}
  const P=PLACES[MAP_SEL],T=TEXT.place[MAP_SEL];
  I.append(...[h('p',{class:'mname'},T.name,P.locked?h('span',{class:'mtag'},M.locked):null,P.home?h('span',{class:'dim'},' '+M.homeNote):null),
    h('p',{},T.desc),T.find?h('p',{class:'mfind'},M.findHead+T.find):null].filter(Boolean));   // 沒有的項目不要放（append(null) 會印出 "null"）
}
function mapTap(id){
  const P=PLACES[id];
  if(MAP_SEL!==id||P.locked){MAP_SEL=id;mapDraw();return}   // 第一下：選取（灰色名牌只看說明）
  mapClose();                                                // 第二下：出發
  if(P.home)return;                                          // 回家＝不出門
  if(P.shop){shopGo();return}                                // 廢棄大樓＝言盡的商店（js/shop.js）
  actOut(id);
}
$('mapClose').onclick=mapClose;

// ---------- 出門鍵右上角的小牌子：顯示目前的外出方式，點它＝切換（隨機⇄地圖），不會出門 ----------
function outChip(){$('bOutMode').textContent=TEXT.ui.outChip[META.outMode]||''}
function outToggle(e){
  e.stopPropagation();e.preventDefault();
  META.outMode=META.outMode==='map'?'random':'map';codexSave();outChip();
  say(fmt(TEXT.ui.outSwitched,{m:TEXT.ui.outChip[META.outMode]}),'sys');
}
$('bOutMode').addEventListener('click',outToggle);
$('bOutMode').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')outToggle(e)});
outChip();

// ---------- 玩耍鍵上的小牌子：玩耍方式（精簡⇄遊玩），點它切換 ----------
function playChip(){$('bPlayMode').textContent=TEXT.game.mode[META.playMode]||''}
function playToggle(e){
  e.stopPropagation();e.preventDefault();
  META.playMode=META.playMode==='play'?'quick':'play';codexSave();playChip();
  say(fmt(TEXT.game.switched,{m:TEXT.game.mode[META.playMode]}),'sys');
}
$('bPlayMode').addEventListener('click',playToggle);
$('bPlayMode').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')playToggle(e)});
playChip();
