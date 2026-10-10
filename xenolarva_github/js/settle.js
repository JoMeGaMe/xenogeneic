// 每日結算：飽食、水質、生命、信賴的變化，以及核心變色事件。
// ---------- 每日結算 ----------
function settle(){
  // 1 更新飽食與水質
  S.sat=clamp(S.sat-28);
  S.dirt=clamp(S.dirt+18);
  S.ph+=(Math.random()-0.5)*1.1+(S.ph>7?0.15:-0.15);
  S.ph=clamp(S.ph,4,10);
  // 2 生命
  let d=0;
  d+= S.sat<20?-15:S.sat<45?-4:4;
  d+= waterSevere()?-20:waterBad()?-10:3;
  S.life=clamp(S.life+d);
  // 3 信賴
  S.trust=clamp(S.trust+((S.sat>=35&&S.life>50)?2:-5));
  // 4 事件
  const lines=hints();
  const ev=[];
  if(!S.colored&&S.day>=3&&S.trust>=60&&S.bond>=2&&S.life>=50){
    S.colored=true;setTimeout(()=>emote('heart'),400);ev.push('幼體的核心慢慢染上了你的代表色，像是把你記住了。');
  }
  S.waterToday=0;
  // 5 死亡判定
  if(S.life<=0){finish('END-07');return}
  if(S.day>=7){finish(endCode());return}
  S.day++;S.ap=2;
  say(`—— 第 ${S.day} 日 ——`,'sys');
  syncGuests(true);
  lines.forEach(l=>say(l,'bad'));
  ev.forEach(e=>say(e,'ev'));
  if(!lines.length&&!ev.length)say(moodLine());
  refresh();
}
function moodLine(){
  const m={clingy:'幼體貼著玻璃，看著你這一側。',shy:'幼體躲在水草旁偷偷看你。',curious:'幼體在缸裡四處亂游，觸肢摸遍每個角落。'};
  return m[S.temp];
}
