// ===== 結局判定（endCode）與結局畫面（finish）。結局文字在 js/data/endings.js =====
// 判定順序：特殊色彩 → 遺憾 → 親密 → 好奇探索 → 慢熱獨立 → 平穩。（提前消逝 END-07 由每日結算直接觸發）
function endCode(){
  if(S.colored&&!S.tc)return'END-05';                          // 核心被聊天染成別的顏色，就不算「染上你的代表色」
  if(S.life<40||S.trust<25)return'END-06';
  if(S.trust>=70&&S.bond>=5)return'END-02';
  if(S.explore>=4&&TEMPERS[S.temp].explorer)return'END-03';     // 探索型個性（好奇、活潑）
  if(S.life>=70&&S.bond<=2)return'END-04';
  return'END-01';
}
function finish(code){
  S.over=code;refresh();codexRecord(code);
  const [t,x]=ENDS[code];
  $('et').textContent=`${code}　${t}`;
  const nmS=s=>String(s).replace(/幼體/g,S.name);
  $('ex').textContent=nmS(x);
  // 摘要：表 1＝個性與發現的標籤（標籤用結局的那一句）｜表 2＝時間、喜歡、色彩（顏色寫 #色碼（色名））
  const X=TEXT.misc,look=larvaLook(S),hex=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase(),col=c=>`${c.toUpperCase()}（${colName(c)}）`;
  const tr=(k,v)=>h('tr',{},h('th',{},k||''),h('td',{},v));
  // 一張表（欄寬一致）：個性、標籤 → 時間、喜歡（零食 / 玩具，同筆記欄）→ 色彩
  const core=S.tc||(S.colored?S.col:hex(look.core));
  const coreNote=S.tc?X.sumByChat:S.colored?X.sumDyed:X.sumNatural;
  const shell=S.tb?col(S.tb)+'｜'+X.sumByChat:X.sumPlain;
  const two=S.tbm&&S.tb2?col(S.tb2)+'｜'+(S.tbm==='v'?X.sumV:X.sumH):'';
  const tbl=h('table',{class:'etab'},tr(TEXT.temper[S.temp].name,TEXT.temper[S.temp].desc),...S.tagsFound.map(id=>tr(TEXT.tags[id].name,nmS(TEXT.tags[id].end||TEXT.tags[id].desc))),
    tr(X.sumTime,fmt(X.sumDays,{day:S.day})),tr(X.sumLike,NAME[S.pref.gift]+' / '+NAME[S.pref.toy]),
    tr(X.sumColor,X.core+'：'+col(core)+'｜'+coreNote),tr('',X.shell+'：'+shell),...(two?[tr('',X.sumTwo+'：'+two)]:[]));
  $('sum').textContent='';$('sum').append(tbl,h('p',{class:'dim'},X.sumSaved));
  setTimeout(()=>{if(PV)pvExit();$('ovEnd').classList.add('show')},code==='END-07'?1800:600);   // 等結局框的這段時間如果進了觀察水缸，先離開
}
