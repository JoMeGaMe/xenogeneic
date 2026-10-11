// ===== 每日結算：飽食、水質、生命、信賴的變化，核心變色事件，死亡與結局判定 =====
// 順序固定：① 飽食與水質 → ② 生命 → ③ 信賴 → ④ 事件 → ⑤ 死亡／結局 → 進入下一天
// 所有數值都在這個檔案裡，要調難度就改這裡。文字在 js/data/texts.js。
function settle(){
  // ① 一天過去：肚子變餓（貪吃鬼餓得更快）、水變髒、酸鹼度隨機飄移
  const before=[...S.tagsFound];
  S.sat=clamp(S.sat-(hasTag('glutton')?36:28));
  const dirt0=S.dirt,clean=hasTag('clean');                                     // 愛乾淨：水變髒的速度減半、酸鹼度漂移小一半
  S.dirt=clamp(S.dirt+(clean?9:18));
  S.ph+=((Math.random()-0.5)*1.1+(S.ph>7?0.15:-0.15))*(clean?.5:1);
  S.ph=clamp(S.ph,4,10);

  // ② 生命：太餓、水質差會扣，照顧得好會回復
  let d=0;
  d+=S.sat<20?-15:S.sat<45?-4:4;
  d+=waterSevere()?-20:waterBad()?-10:3;
  if(hasTag('frail')&&d<0)d=Math.round(d*1.5);        // 虛弱：不好的狀況傷得更重
  S.life=clamp(S.life+d);

  // ③ 信賴：吃飽又健康 +2，否則 -5
  S.trust=clamp(S.trust+((S.sat>=35&&S.life>50)?2:-5));

  // 標籤的代價：貪玩太久沒玩、人類愛好者沒人陪都會掉信賴
  S.noPlay=S.playedToday?0:S.noPlay+1;
  const cost=[];
  if(hasTag('playful')&&S.noPlay>=2){S.trust=clamp(S.trust-3);cost.push('playful')}
  if(hasTag('lovey')&&!S.playedToday){S.trust=clamp(S.trust-2);cost.push('lovey')}
  if(clean&&S.dirt>60){S.trust=clamp(S.trust-3);cost.push('clean')}          // 愛乾淨：水真的髒了會悶悶不樂
  S.playedToday=false;S.touchGain=0;

  // ④ 事件：核心變色（最早第 3 日；信賴 ≥60、互動 ≥2 次、生命 ≥50）
  const lines=hints();
  const ev=[];
  if(!S.colored&&!S.tc&&S.day>=3&&S.trust>=60&&S.bond>=2&&S.life>=50){
    S.colored=true;setTimeout(()=>emote('heart'),400);ev.push(TEXT.settle.color);
  }
  S.waterToday=0;

  // ⑤ 死亡判定、第七日結局
  if(S.life<=0){finish('END-07');return}
  if(S.day>=7){finish(endCode());return}

  // 進入下一天
  S.day++;S.ap=2;
  say('','rule');                                      // 換日：先畫一條橫線分隔
  say(fmt(TEXT.settle.day,{day:S.day}),'sys');
  syncGuests(true);                                   // 勾選的同伴飄進來／飄出去
  lines.forEach(l=>say(l,'bad'));
  cost.filter(id=>S.tagsFound.includes(id)).forEach(id=>say(TEXT.tagCost[id],'bad'));
  // 愛乾淨：普通小球今天會變得有點霧的時候，牠的水還是清的 → 揭曉（最晚第 3 日一定揭曉）
  if(clean&&((clamp(dirt0+18)>35&&S.dirt<=35)||S.day>=3))discoverTag('clean');
  if(frailSym())discoverTag('frail');                 // 虛弱：水質或飢餓出現徵兆時揭曉
  tagReact('day',{},before.filter(id=>id!=='frail'||frailSym()));
  sneakDaily();souvDaily();                           // 偷偷七逃從缸邊游進來、小球送禮
  ev.forEach(e=>say(e,'ev'));
  if(!lines.length&&!ev.length)say(TEXT.temper[S.temp].mood);
  refresh();
  greteDaily();                                       // 換日完小助手先跑：東西不夠就跳提示
}
