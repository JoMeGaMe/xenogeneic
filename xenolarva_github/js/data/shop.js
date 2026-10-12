// 【資料】廢棄大樓的商店（言盡）。名字與言盡的介紹在 js/data/texts.js 的 TEXT.shop。
//   price：積分｜give：買了會得到的東西（物品 id：數量，放進這一輪的物品欄）｜icon：還沒有商品圖時用的圖示（js/data/icons.js）與顏色
//   img：商品圖（assets/ 底下的檔名，不含副檔名；200×200 透明背景，檔名 item_*）
// 商品之後要換成正式的（小球裝飾品、互動玩具…），在這裡加減就好。
const SHOP_ITEMS={
  // 日常道具（撿得到，應急用，便宜）
  soup3:   {price:2,give:{food:3},img:'item_soup'},
  agent2:  {price:2,give:{agent:2},img:'item_agent'},
  snacks:  {price:3,give:{sweet:1,salty:1,bitter:1},img:'item_snacks'},
  bubble:  {price:3,give:{bubble:1},img:'item_bubble'},
  bell:    {price:3,give:{bell:1},img:'item_bell'},
  ball:    {price:3,give:{ball:1},img:'item_ball'},
  // 裝扮（永久持有，可以預覽；wear＝js/data/wears.js 的 id，商品圖＝穿戴圖 wear_*.png）。always：每次都會擺出來（還沒買的話）｜hidden：不在商店擺（其他方式拿到）
  squareglasses: {price:8,wear:'squareglasses'},
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
  eyepatch:      {price:7,wear:'eyepatch'},
  dododo:        {price:6,wear:'dododo'},
  gogogo:        {price:6,wear:'gogogo'},
  foxmask:       {price:0,wear:'foxmask',hidden:true},   // 成就「千球千面」的獎勵，不在商店擺
  // 互動道具（永久持有；tool＝META.tools 的 id）。玩耍選單會多一個選項，「遊玩」方式時會在水缸裡互動
  wand:    {price:10,tool:'wand',img:'item_wand'},
  bucket:  {price:10,tool:'bucket',img:'item_bucket'}
};
const SHOP_SHOW=3;                                     // 每次去商店，行李箱上擺幾種（always 的先擺，其他隨機）
const SHOP_SLOTS=[{x:26,y:38},{x:74,y:38},{x:50,y:74}];   // 商品在行李箱圖上的位置（百分比）
const SHOP_CASE='shop_case';                           // 行李箱（由上往下看）：assets/shop_case.png，3:2（750×500；目前是使用者的圖切掉上蓋）
const SHOP_FACE='yanjin_face';                         // 對話框旁的言盡頭像：assets/yanjin_face.png（100×100，從 yanjin_1 裁頭部）
