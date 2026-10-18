// ===== 流程：開場故事＋簽名（只看一次）、第 0 日（沒有小球的日常畫面）、接取新委託、設定、交還給異生協會 =====
// 沒有小球時 S 是 null，畫面只顯示空水缸與「接取新委託」；接取後 newGame() 才開始第 1 日。

// ---------- 選代表色的元件（開場簽名、設定共用）：左 4×3 色票（最後一格自訂），右邊用這個顏色顯示名字 ----------
function colorWidget(get,set,nameOf){
  const wrap=h('div',{class:'cmid cw'}),grid=h('div',{class:'sgrid'}),sample=h('span',{class:'csample'}),fr=h('div',{class:'cpv cwv'},sample);
  const repaint=()=>{
    grid.querySelectorAll('.sw1').forEach(b=>b.classList.toggle('sel',b.dataset.c===get()));
    sample.textContent=nameOf()||TEXT.misc.defPlayer;paintName(sample,get());
  };
  const pick_=c=>{if(c){set(c);repaint()}};
  COLORS.forEach((c,i)=>grid.append(h('button',{class:'sw1',style:'background:'+c,'data-c':c,title:CNAME[i],'aria-label':CNAME[i],onclick:()=>pick_(c)})));
  const cp=h('input',{type:'color',value:get(),'aria-label':TEXT.misc.customColor,title:TEXT.misc.customColor});
  cp.oninput=()=>pick_(parseColor(cp.value));
  grid.append(h('label',{class:'scust'},cp,h('span',{},TEXT.misc.custom)));
  wrap.append(grid,h('div',{class:'cfr'},fr));
  const fit=()=>{const n=grid.offsetHeight;if(n>0){fr.style.width=fr.style.height=n+'px'}};
  setTimeout(fit,0);setTimeout(fit,100);setTimeout(fit,400);
  wrap.repaint=repaint;repaint();
  return wrap;
}

// ---------- 開場故事（沒看過才會出現）----------
let introCol=null;
function introOpen(){
  const T=TEXT.intro;
  $('introStory').textContent='';
  T.story.forEach(t=>$('introStory').append(h('p',{class:t.startsWith('「')?'q':''},t)));
  $('pn').value=META.pname||'';selColor=META.pcol||selColor;
  $('introCol').textContent='';
  introCol=colorWidget(()=>selColor,c=>{selColor=c},()=>$('pn').value.trim());
  $('introCol').append(introCol);
  $('pn').oninput=()=>introCol.repaint();
  $('ovStart').classList.add('show');
}
$('go').onclick=()=>{
  META.pname=($('pn').value.trim()||TEXT.misc.defPlayer).slice(0,8);META.pcol=selColor;META.intro=true;codexSave();
  $('ovStart').classList.remove('show');
  toIdle();
};

// ---------- 第 0 日：沒有小球 ----------
function toIdle(){
  gameStop();
  S=null;GUESTS=[];M=null;SN=null;EM=null;pokes=[];
  document.body.classList.add('idle');
  ['ovEnd','ovPick','ovBag'].forEach(i=>$(i).classList.remove('show'));
  $('day').textContent=fmt(TEXT.misc.dayLabel,{d:0});$('pips').innerHTML='';
  $('cname').textContent='';paintName($('cname'),'');
  $('pname').textContent=META.pname||'';paintName($('pname'),META.pcol||'');
  $('wq').hidden=true;
  $('log').innerHTML='';say(TEXT.idle.msg,'sys');
}
// 接取新委託：取名字後，小球出現並進入第 1 日
function acceptOpen(){
  const inp=h('input',{type:'text',maxLength:8,value:TEXT.misc.defLarva,'aria-label':TEXT.idle.nameLabel});
  pick(TEXT.idle.accept,[{node:h('div',{class:'acc'},h('label',{},TEXT.idle.nameLabel),inp)},{id:'ok',label:TEXT.idle.ok,main:true}],()=>{
    newGame(META.pname||TEXT.misc.defPlayer,inp.value.trim()||TEXT.misc.defLarva,META.pcol||selColor);
  },META.special?TEXT.special.accept:TEXT.idle.acceptBody);
}
$('bAccept').onclick=acceptOpen;
// 等待新委託：完成一輪（＋1），回到第 0 日，再看畢業小球有沒有寄信來
$('again').onclick=()=>{META.rounds++;if(S&&S.special&&!PV)META.specialDone=(META.specialDone||0)+1;codexSave();toIdle();letterCheck()};

// ---------- 設定：暱稱、代表色、外出方式（隨時可改）。在 ☰「設定與存檔」頁的上半部 ----------
function settingsBuild(){
  const b=$('setBody');b.textContent='';
  const nm_=h('input',{type:'text',maxLength:8,value:META.pname||'','aria-label':TEXT.misc.nick});
  const col=colorWidget(()=>META.pcol||selColor,c=>{META.pcol=c;selColor=c;if(S)S.col=c;paintName($('pname'),c);if(S)refresh();codexSave()},()=>nm_.value.trim()||META.pname);
  nm_.oninput=()=>col.repaint();
  nm_.onchange=()=>{const v=(nm_.value.trim()||TEXT.misc.defPlayer).slice(0,8);META.pname=v;if(S)S.pname=v;$('pname').textContent=v;col.repaint();codexSave()};
  const mode=m=>h('label',{class:'mrow'},h('input',{type:'radio',name:'outMode',value:m[0],checked:META.outMode===m[0],disabled:!!m[2],onchange:()=>{META.outMode=m[0];codexSave();outChip()}}),' '+m[1]);
  const U=TEXT.ui;
  b.append(h('label',{class:'sl'},U.nick),nm_,h('hr',{class:'div'}),h('label',{class:'sl'},U.color),col,
    h('hr',{class:'div'}),h('label',{class:'sl'},U.outMode),mode(['random',U.outRandom]),mode(['map',U.outMap]),
    h('hr',{class:'div'}),h('label',{class:'sl'},TEXT.game.modeHead),
    ...[['quick',TEXT.game.modeQuick],['play',TEXT.game.modePlay]].map(m=>h('label',{class:'mrow'},h('input',{type:'radio',name:'playMode',value:m[0],checked:META.playMode===m[0],onchange:()=>{META.playMode=m[0];codexSave();playChip()}}),' '+m[1])),
    h('hr',{class:'div'}),h('label',{class:'sl'},U.letterMode),
    ...[['popup',U.letterPopup],['log',U.letterLog]].map(m=>h('label',{class:'mrow'},h('input',{type:'radio',name:'letterMode',value:m[0],checked:META.letterMode===m[0],onchange:()=>{META.letterMode=m[0];codexSave()}}),' '+m[1])));
}
const settingsOpen=()=>openMenu('save','secSet');
$('bSet').onclick=settingsOpen;
function prefillPlayer(){if(introCol&&$('ovStart').classList.contains('show')){$('pn').value=META.pname||'';selColor=META.pcol||selColor;introCol.repaint()}}

// 交還可得的積分＝基本分＋每個標籤的加分（標籤用小球真正擁有的，沒發現的也算；數值在 js/data/assoc.js）
const assocPts=e=>ASSOC.returnPts+(e.own||[]).reduce((n,t)=>n+(ASSOC.tagPts[t]||0),0);

// ---------- 交還給異生協會：小球離開圖鑑換積分（收藏進度、回歸者名額會保留）----------
function assocReturn(e){
  const G=META.got;
  if(!G.end.includes(e.end))G.end.push(e.end);
  if(!G.temper.includes(e.temp))G.temper.push(e.temp);
  e.tags.forEach(t=>{if(!G.tag.includes(t))G.tag.push(t)});
  if(e.own.includes('homereturn'))META.homeUsed++;
  const pts=assocPts(e);META.points+=pts;
  META.returned.push({id:e.id,name:e.name,at:e.at,back:new Date().toISOString().slice(0,10),gift:false,   // gift：寄過信紙了沒（每隻只寄一次，js/letters.js）
    temp:e.temp,own:e.own,pg:e.pg,pt:e.pt,end:e.end,rnd:META.rounds+(S&&!PV?1:0),
    look:{col:e.col,hue:e.hue,colored:e.colored,tc:e.tc,tb:e.tb,tb2:e.tb2,tbm:e.tbm,tbs:e.tbs,day:e.day}});   // look：外觀（之後大樓背景可能出現寄過信的小球）
  CODEX=CODEX.filter(x=>x!==e);GUEST_IDS=GUEST_IDS.filter(x=>x!==e.id);
  if(typeof WATCH_IDS!=='undefined'){WATCH_IDS=WATCH_IDS.filter(x=>x!==e.id);watchSave()}
  codexSave();
  if(S)syncGuests(false);
  return fmt(TEXT.assoc.done,{pts,name:e.name});
}

// ---------- 啟動 ----------
selColor=META.pcol||selColor;
if(META.intro)toIdle();else introOpen();
