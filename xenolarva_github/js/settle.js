// ===== 每日結算：飽食、水質、生命、信賴的變化，核心變色事件，死亡與結局判定 =====
// 順序固定：① 飽食與水質 → ② 生命 → ③ 信賴 → ④ 事件 → ⑤ 死亡／結局 → 進入下一天
// 數值在 js/data/rules.js 的 DAY_RULE（v0.30 抽出），要調難度改那裡。文字在 js/data/texts.js。
function settle(){
  // ① 一天過去：肚子變餓（貪吃鬼餓得更快）、水變髒、酸鹼度隨機飄移
  const before=[...S.tagsFound];
  const DR=DAY_RULE;
  S.sat=clamp(S.sat-(hasTag('glutton')?DR.sat.glutton:hasTag('smalleat')?DR.sat.smalleat:DR.sat.normal));   // 貪吃鬼餓得快、不愛吃餓得慢
  const dirt0=S.dirt,clean=hasTag('clean');                                     // 愛乾淨：水變髒的速度減半、酸鹼度漂移小一半
  S.dirt=clamp(S.dirt+(clean?DR.dirt.clean:DR.dirt.normal));
  S.ph+=((Math.random()-0.5)*DR.ph.drift+(S.ph>7?DR.ph.bias:-DR.ph.bias))*(clean?DR.ph.cleanMul:1);
  S.ph=clamp(S.ph,DR.ph.min,DR.ph.max);

  // ② 生命：太餓、水質差會扣，照顧得好會回復
  let d=0;
  const LS=DR.lifeSat,LW=DR.lifeWater;
  d+=S.sat<LS.starve?LS.starveD:S.sat<LS.hungry?LS.hungryD:LS.okD;
  d+=waterSevere()?LW.severeD:waterBad()?LW.badD:LW.okD;
  if(hasTag('frail')&&d<0)d=Math.round(d*DR.frailMul);        // 虛弱：不好的狀況傷得更重
  S.life=clamp(S.life+d);

  // ③ 信賴：吃飽又健康 +2，否則 -5
  S.trust=clamp(S.trust+((S.sat>=DR.trust.sat&&S.life>DR.trust.life)?DR.trust.up:DR.trust.down));

  // 標籤的代價：貪玩太久沒玩、人類愛好者沒人陪都會掉信賴
  S.noPlay=S.playedToday?0:S.noPlay+1;
  const cost=[];
  const TC=DR.tagCost;
  if(hasTag('playful')&&S.noPlay>=TC.playfulDays){S.trust=clamp(S.trust-TC.playful);cost.push('playful')}
  if(hasTag('lovey')&&!S.playedToday){S.trust=clamp(S.trust-TC.lovey);cost.push('lovey')}
  if(clean&&S.dirt>TC.cleanDirt){S.trust=clamp(S.trust-TC.clean);cost.push('clean')}          // 愛乾淨：水真的髒了會悶悶不樂
  const vainOn=hasTag('vain')&&!!S.wear;                                        // 愛美：戴著裝扮心情好，沒戴會無聊
  if(hasTag('vain')){if(vainOn)S.trust=clamp(S.trust+TC.vain);else{S.trust=clamp(S.trust-TC.vain);cost.push('vain')}}
  S.playedToday=false;S.touchGain=0;

  // ④ 事件：核心變色（最早第 3 日；信賴 ≥60、互動 ≥2 次、生命 ≥50）
  const lines=hints();
  const ev=[];
  const CR=DR.color;
  if(!S.colored&&!S.tc&&S.day>=CR.day&&S.trust>=CR.trust&&S.bond>=CR.bond&&S.life>=CR.life){
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
  if(clean&&((clamp(dirt0+DR.dirt.normal)>35&&S.dirt<=35)||S.day>=3))discoverTag('clean');
  if(frailSym())discoverTag('frail');                 // 虛弱：水質或飢餓出現徵兆時揭曉
  if(hasTag('vain')&&(vainOn||S.day>=3))discoverTag('vain');   // 愛美：戴著裝扮過了一天（最晚第 3 日）揭曉
  if(hasTag('high')&&S.day>=2)discoverTag('high');      // 高高在上：過了一晚就看得出來
  tagReact('day',{},before.filter(id=>id!=='frail'||frailSym()));
  sneakDaily();souvDaily();                           // 偷偷七逃從缸邊游進來、小球送禮
  ev.forEach(e=>say(e,'ev'));
  if(!lines.length&&!ev.length)say(TEXT.temper[S.temp].mood);
  refresh();
  greteDaily();                                       // 換日完小助手先跑：東西不夠就跳提示
}
