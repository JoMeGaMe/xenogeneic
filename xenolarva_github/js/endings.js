// ===== 結局判定（endCode）與結局畫面（finish）。結局文字在 js/data/endings.js =====
// 判定順序：特殊色彩 → 遺憾 → 親密 → 好奇探索 → 慢熱獨立 → 平穩。（提前消逝 END-07 由每日結算直接觸發）
function endCode(){
  if(S.colored)return'END-05';
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
  const tagEnd=S.tagsFound.map(id=>TEXT.tags[id].end).filter(Boolean);        // 發現的標籤各多一句結局文字
  $('ex').textContent=[x,...tagEnd].join('\n').replace(/幼體/g,S.name);
  const color=S.colored?'已染上你的代表色':`核心為 hsl ${S.hue}° 色`;
  $('sum').textContent=`存活至第 ${S.day} 日｜個性：${TEXT.temper[S.temp].name}｜喜歡的零食：${NAME[S.pref.gift]}｜喜歡的玩具：${NAME[S.pref.toy]}｜${color}｜已收錄進圖鑑`;
  setTimeout(()=>$('ovEnd').classList.add('show'),code==='END-07'?1800:600);
}
