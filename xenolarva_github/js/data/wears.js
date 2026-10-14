// 【資料】小球的裝扮道具（在言盡的商店買，永久持有；在「物品」裡幫這一輪的小球戴上／拿下）。名字在 TEXT.shop.items。
//   art：像素圖（每個字一格；. 透明，其他字對應 pal 的顏色）｜scale：每格放大幾倍（小球圖是 96×96）
//   （舊格式）art＋pal＋scale＋dx、dy：程式畫的像素圖，相對於核心的中心
// 用圖片：img:'wear_xxx'（assets/wear_xxx.png，96×96 透明底，照 tools/wear_template 的小球位置直接畫上去）。
//   換姿勢時程式會讓圖跟著核心移動。商店的商品圖也直接用這張（box＝有畫東西的範圍 [左,上,右,下]，商店只放大這一塊；換圖後要重算）。
// cat：打扮頁的分類（head 頭飾｜face 臉飾｜icon 圖示（符號類）｜other 其他）
const WEARS={
  // glow：會發光、可以換顏色的部分（白色或淺灰的圖，程式上色）；顏色存在小球的 wearCol（色碼或 'rainbow'＝慢慢彩虹變色）
  glowstick:{img:'wear_glowstick',glow:'wear_glowstick_glow',box:[0,0,93,78],cat:'other'},
  squareglasses:{img:'wear_squareglasses',box:[3,14,85,56],cat:'face'},
  goldglasses:{img:'wear_goldglasses',box:[6,14,81,76],cat:'face'},
  shades:{img:'wear_shades',box:[2,4,78,53],cat:'face'},
  catears:{img:'wear_catears',box:[3,2,84,53],cat:'head'},
  bow:{img:'wear_bow',box:[6,0,57,34],cat:'head'},
  clipx:{img:'wear_clipx',box:[2,25,23,47],cat:'head'},
  clipeq:{img:'wear_clipeq',box:[59,7,78,28],cat:'head'},
  sparkle:{img:'wear_sparkle',box:[7,1,84,54],cat:'icon'},
  hearts:{img:'wear_hearts',box:[4,4,83,51],cat:'icon'},
  bolts:{img:'wear_bolts',box:[3,0,41,61],cat:'icon'},
  bandaid:{img:'wear_bandaid',box:[32,29,58,45],cat:'face'},
  coin:{img:'wear_coin',box:[3,5,32,49],cat:'icon'},
  cross:{img:'wear_cross',box:[0,25,93,69],cat:'other'},
  tie:{img:'wear_tie',box:[32,50,83,86],cat:'other'},
  bowtie:{img:'wear_bowtie',box:[37,50,69,72],cat:'other'},
  satchel:{img:'wear_satchel',box:[1,11,85,87],cat:'other'},
  wings:{img:'wear_wings',box:[0,32,95,78],cat:'other'},
  devil:{img:'wear_devil',box:[0,0,92,75],cat:'other'},
  foxmask:{img:'wear_foxmask',box:[1,0,86,44],cat:'head'},
  minilarva:{img:'wear_minilarva',box:[0,0,51,48],cat:'head'},
  eyepatch:{img:'wear_eyepatch',box:[6,12,92,71],cat:'face'},
  dododo:{img:'wear_dododo',box:[12,4,44,78],cat:'icon'},
  gogogo:{img:'wear_gogogo',box:[47,1,90,63],cat:'icon'},
  detective:{img:'wear_detective',box:[1,0,52,54],cat:'head'},   // 偵探帽（成就「看透小球心」的獎勵）
};
