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
const TEMPERS={
  clingy:  {speed:.8, trustGain:1.3,favGain:1,  explorer:false,poke:'come'},
  shy:     {speed:.5, trustGain:.8, favGain:1,  explorer:false,poke:'hide',shyPose:true},
  curious: {speed:1.2,trustGain:1,  favGain:1,  explorer:true, poke:'wave'},
  stubborn:{speed:.45,trustGain:1,  favGain:1.6,explorer:false,poke:'turn',territory:true},
  lively:  {speed:1.7,trustGain:1.1,favGain:1,  explorer:true, poke:'spin',bubbles:true},
  sleepy:  {speed:.3, trustGain:1,  favGain:1.2,explorer:false,poke:'stretch',sleepy:true}
};
const TEMPER_IDS=Object.keys(TEMPERS);
