// 【資料】個性表。每種個性一列，程式只讀這張表；新增個性＝在這裡加一列＋在 texts.js 加名字與說明。
// 欄位說明：
//   speed      平常游動速度（數字越大越快）
//   trustGain  信賴成長倍率（互動後增加的信賴 × 這個數字）
//   favGain    碰到「喜歡的零食／玩具」時額外的倍率（頑固特別高）
//   explorer   true＝算「探索型」，玩耍時會累積探索次數（影響結局 END-03）
//   poke       被玩家戳時的反應，名稱對應 js/render/creature.js 的 POKE 表
//   （小球之間怎麼互動，看 js/render/social.js 的 REL 表）
//   territory  true＝有自己的角落，別人靠近會輕輕撞開對方
//   bubbles    true＝愛追著水裡的泡泡跑
//   shyPose    true＝信賴低時偶爾縮起來
//   sleepy     true＝大部分時間貼在缸底睡覺，偶爾才慢慢游一下（睏睏）
//   follow     true＝跟屁蟲：每天挑一隻「最喜歡的」小球跟著、偶爾繞圈；沒有同伴就靠近你的手指（游標）（黏人）
//   nosy       true＝湊熱鬧：哪裡有動靜（別的小球在動、泡泡、裝飾）就過去看一下，看完就走（好奇）
//   patrol     true＝固定的巡邏路線；看到別的小球相撞會游過去勸架（守序）
//   mimic      true＝學附近小球的動作（最愛學守序的）；沒有同伴就學你手指（游標）的動作（易染）
const TEMPERS={
  clingy:  {speed:.8, trustGain:1.3,favGain:1,  explorer:false,poke:'come',follow:true},
  shy:     {speed:.5, trustGain:.8, favGain:1,  explorer:false,poke:'hide',shyPose:true},
  curious: {speed:1.2,trustGain:1,  favGain:1,  explorer:true, poke:'wave',nosy:true},
  stubborn:{speed:.45,trustGain:1,  favGain:1.6,explorer:false,poke:'turn',territory:true},
  lively:  {speed:1.7,trustGain:1.1,favGain:1,  explorer:true, poke:'spin',bubbles:true},
  sleepy:  {speed:.3, trustGain:1,  favGain:1.2,explorer:false,poke:'stretch',sleepy:true},
  helper:  {speed:.9, trustGain:1.1,favGain:1,  explorer:false,poke:'come',patrol:true},     // 守序（v0.28；v0.29.10 定名）
  mimic:   {speed:1,  trustGain:1,  favGain:1.1,explorer:true, poke:'wave',mimic:true}       // 易染（v0.28；v0.29.10 定名）
};
const TEMPER_IDS=Object.keys(TEMPERS);
