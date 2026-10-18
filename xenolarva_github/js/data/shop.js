// 【資料】廢棄大樓的商店（言盡）。名字與言盡的介紹在 js/data/texts.js 的 TEXT.shop。
//   price：積分｜give：買了會得到的東西（物品 id：數量，放進這一輪的物品欄）｜icon：還沒有商品圖時用的圖示（js/data/icons.js）與顏色
//   img：商品圖（assets/ 底下的檔名，不含副檔名；200×200 透明背景，檔名 item_*）
// 商品之後要換成正式的（小球裝飾品、互動玩具…），在這裡加減就好。
const SHOP_ITEMS={
  // 生活物資（fixed：「固定商品」分頁每次都擺；這一輪用，下一輪物品欄會重置；撿得到，應急用，便宜）
  soup3:   {price:1,fixed:true,give:{food:3},img:'item_soup'},
  agent2:  {price:1,fixed:true,give:{agent:2},img:'item_agent'},
  snacks:  {price:2,fixed:true,give:{sweet:1,salty:1,bitter:1},img:'item_snacks'},
  bubble:  {price:2,fixed:true,give:{bubble:1},img:'item_bubble'},
  bell:    {price:2,fixed:true,give:{bell:1},img:'item_bell'},
  ball:    {price:2,fixed:true,give:{ball:1},img:'item_ball'},
  // 裝扮（永久持有，可以預覽；wear＝js/data/wears.js 的 id，商品圖＝穿戴圖 wear_*.png）。always：每次都會擺出來（還沒買的話）｜hidden：不在商店擺（其他方式拿到）
  squareglasses: {price:8,wear:'squareglasses'},
  glowstick:     {price:9,wear:'glowstick'},
  goldglasses:   {price:9,wear:'goldglasses'},
  shades:        {price:9,wear:'shades'},
  catears:       {price:10,wear:'catears'},
  bow:           {price:6,wear:'bow'},
  clipx:         {price:5,wear:'clipx'},
  clipeq:        {price:5,wear:'clipeq'},
  sparkle:       {price:5,wear:'sparkle'},
  hearts:        {price:5,wear:'hearts'},
  bolts:         {price:5,wear:'bolts'},
  bandaid:       {price:5,wear:'bandaid'},
  coin:          {price:6,wear:'coin'},
  cross:         {price:8,wear:'cross'},
  tie:           {price:6,wear:'tie'},
  bowtie:        {price:6,wear:'bowtie'},
  satchel:       {price:8,wear:'satchel'},
  wings:         {price:10,wear:'wings'},
  devil:         {price:12,wear:'devil'},
  minilarva:     {price:10,wear:'minilarva'},
  bunny:         {price:8,wear:'bunny'},
  shushu:        {price:8,wear:'shushu'},
  puppy:         {price:8,wear:'puppy'},
  snake:         {price:8,wear:'snake'},
  blackcat:      {price:8,wear:'blackcat'},
  eyepatch:      {price:7,wear:'eyepatch'},
  dododo:        {price:6,wear:'dododo'},
  gogogo:        {price:6,wear:'gogogo'},
  detective:     {price:0,wear:'detective',hidden:true},   // 成就「看透小球心」的獎勵，不在商店擺
  foxmask:       {price:0,wear:'foxmask',hidden:true},   // 成就「千球千面」的獎勵，不在商店擺
  // 互動道具（永久持有；tool＝META.tools 的 id）。玩耍選單會多一個選項，「遊玩」方式時會在水缸裡互動
  wand:    {price:10,tool:'wand',img:'item_wand'},
  bucket:  {price:10,tool:'bucket',img:'item_bucket'},
  // 雜誌（永久學會，聊天染色用；cond：要先跟格蕾特學會雙色才會擺出來）。magV 外殼上下兩色、magH 外殼左右兩色（都可以選柔和或分色）
  magV:    {price:12,tool:'magV',img:'item_magV',cond:()=>META.chatDual},
  magH:    {price:12,tool:'magH',img:'item_magH',cond:()=>META.chatDual}
};
const SHOP_SHOW=3;                                     // 「隨機商品」每次擺幾種（裝扮、永久玩具；always 的先擺，其他隨機；心等 3 多一種，見 HEART_RULE.shop）
const SHOP_SLOTS6=[{x:22,y:36},{x:50,y:36},{x:78,y:36},{x:22,y:74},{x:50,y:74},{x:78,y:74}];   // 「固定商品」六種的位置
const SHOP_SLOTS=[{x:26,y:38},{x:74,y:38},{x:50,y:74}];   // 商品在行李箱圖上的位置（百分比）
const SHOP_SLOTS4=[{x:24,y:36},{x:62,y:34},{x:36,y:74},{x:76,y:72}];   // 心等 3：擺 4 種時的位置
const SHOP_CASE='shop_case';                           // 行李箱（由上往下看）：assets/shop_case.png，3:2（750×500；目前是使用者的圖切掉上蓋）
// 閒聊畫面（商店的「閒聊」）：廢墟背景＋行李箱＋言盡（戳她發呆時換 yanjin_2）＋偶爾一隻小球
// chatAlt：閒聊畫面打開時那句（TEXT.shop.chat 的第幾句，從 0 起算）用第二張圖 yanjin_2（v0.32.3 使用者在總表指定第 5 則）
const SHOP_SCENE={bg:'ruins_1',suitcase:'suitcase',chr:['yanjin_1','yanjin_2'],pokeAlt:[2],chatAlt:[4],larva:.35,larvaSc:.85,giftMax:3};   // 閒聊畫面的小球也會送東西（機率、種類同大樓 HALL_RULE），每次去商店最多 giftMax 個
// （v0.29.2 起商品畫面不放言盡的頭像；assets/yanjin_face.png 先留著）
