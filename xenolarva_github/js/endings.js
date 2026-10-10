// 結局判定（endCode）與結局畫面（finish）。結局文字在 js/data/endings.js。
function endCode(){
  if(S.colored)return'END-05';
  if(S.life<40||S.trust<25)return'END-06';
  if(S.trust>=70&&S.bond>=5)return'END-02';
  if(S.explore>=4&&S.temp==='curious')return'END-03';
  if(S.life>=70&&S.bond<=2)return'END-04';
  return'END-01';
}
function finish(code){
  S.over=code;refresh();codexRecord(code);
  const [t,x]=ENDS[code];
  $('et').textContent=`${code}　${t}`;
  $('ex').textContent=x.replace(/幼體/g,S.name);
  const color=S.colored?'已染上你的代表色':`核心為 hsl ${S.hue}° 色`;
  $('sum').textContent=`存活至第 ${S.day} 日｜個性：${{clingy:'黏人',shy:'害羞',curious:'好奇'}[S.temp]}｜喜歡的零食：${NAME[S.pref.gift]}｜喜歡的玩具：${NAME[S.pref.toy]}｜${color}`;
  $('sum').textContent+='｜已收錄進圖鑑';
  setTimeout(()=>$('ovEnd').classList.add('show'),code==='END-07'?1800:600);
}

