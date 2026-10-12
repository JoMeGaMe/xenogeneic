// 【資料】外出的地點（地圖模式）。名字與說明在 js/data/texts.js 的 TEXT.place。
//   x、y：名牌在地圖上的位置（百分比，0～100；地圖 750×500）
//   loot：每件戰利品是哪一類的權重（food 海草湯｜snack 零食三選一｜agent 換水劑｜toy 玩具三選一；玩具每種只會有一個）
//   home：回家＝不出門（不耗行動）｜locked：之後開放（灰色名牌，不能前往）
const PLACES={
  assoc:{x:14,y:30,locked:true},                                  // 異生會大樓（左上的藍色高樓；之後：指定委託）
  ruins:{x:76,y:26,shop:true},                                    // 廢棄大樓區（右上；言盡的商店，js/shop.js）
  mall: {x:62,y:58,loot:{food:15,snack:20,agent:35,toy:30}},     // 商業區（粉色看板大樓）：換水劑、玩具多
  park: {x:26,y:60,loot:{food:45,snack:30,agent:10,toy:15}},     // 中央公園（噴水池）：海草湯、零食多
  home: {x:89,y:62,home:true}                                     // 住所（右邊半山腰的紅屋頂）
};
const RANDOM_PLACES=['park','mall'];   // 外出方式「隨機」時，從這幾個地點平均挑一個
const OUT_ITEMS=3;                     // 每次出門帶回幾件
// 地圖底圖：assets/map.jpg（3:2，目前 1200×800；不要畫地名，名牌由程式放）。換圖後名牌位置（x、y）要重新對一下。
const MAP_IMG=(typeof ASSETS!=='undefined'&&ASSETS.map)||'assets/map.jpg';
