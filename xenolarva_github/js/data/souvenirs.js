// 【資料】小球送的禮物（紀念品）。名稱、送禮當下的描述、圖鑑說明在 js/data/texts.js 的 TEXT.souv。
// 來源：個性（每種個性一種）或標籤。禮物只記「收到幾次」，存在 META.souv，跨周目保留，列表在「收藏 → 禮物」。
const SOUV_SRC={
  weedWave:['temper','lively'],  weedHead:['temper','shy'],
  stoneTerritory:['temper','stubborn'], stoneSleep:['temper','sleepy'],
  bubbleSurprise:['temper','curious'],  bubbleCling:['temper','clingy'],
  stoneRoute:['temper','helper'], bubbleCopy:['temper','mimic'],
  gem:['tag','judge'], toy:['tag','playful'], halfFood:['tag','glutton'], massage:['tag','touchy'],
  shed:['tag','frail'], shell:['tag','lovey'], pebble:['tag','clean'],
  mirror:['tag','vain'], saved:['tag','smalleat'], surface:['tag','high'],
  note:['tag','scholar'], oldPiece:['tag','homereturn'], outSand:['tag','sneak'], outFeather:['tag','sneak'], outBead:['tag','sneak'], outGrass:['tag','sneak'], outGlass:['tag','sneak'], outCoin:['tag','sneak'],   // 偷偷七逃：每次隨機帶回其中一種
  letter:['grad','letter']   // 畢業小球的信紙（js/letters.js；不是在養的小球送的）
};
// 送禮的規則：每天換日時判斷。信賴要夠高才會送（26＝正常照顧、第 3 日差不多就會到的程度，大約是剛脫離「戒備」）；個性禮物與標籤禮物各自擲骰（每天最多 2 份）
const SOUV_RULE={trust:26,temper:.3,tag:.2,maxPerDay:2,
  sneak:.35,        // 偷偷七逃：每天換日溜出去的機率（發現之前，第 4 日起一定會溜出去）
  sneakGift:.6};    // 溜出去回來時帶禮物的機率
