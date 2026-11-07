// 【資料】大樓、言盡商店的台詞「這一句專用的人物圖」（v0.40.13）。設定總表「5 事件」的「換人物圖（填檔名）」欄會寫回這裡。
// key＝台詞的程式位置（例 hall.poke.lobby[0]）；值＝圖名，或陣列＝每次出現這句時輪流換。沒寫的句子照原本的規則（HALL_FLOORS／LOBBY_NPC／SHOP_SCENE 的 chr、pokeAlt）。
const LINE_IMG={
  "hall.larvaSay.lobby":"grete_L_6",
  "hall.lobbyGrete[0]":"grete_L_1",
  "hall.lobbyGrete[1]":"grete_L_4",
  "hall.lobbyGrete[2]":"grete_L_5",
  "hall.poke.b1[1]":"xiaojun_L_3+acc",
  "hall.poke.b1[2]":"xiaojun_L_2+acc",
  "hall.poke.b1[3]":"xiaojun_L_1+acc",
  "hall.poke.lobby[0]":"grete_L_6",
  "hall.poke.lobby[1]":["grete_L_1", "grete_L_4"],
  "hall.poke.lobby[2]":["grete_L_4", "grete_L_5"],
  "hall.visit.xiaojun[0]":"xiaojun_L_0+acc",
  "hall.visit.xiaojun[1]":"xiaojun_L_2+acc",
  "hall.visit.xiaojun[2]":"xiaojun_L_0+acc",
  "hall.visit.yanjin[1]":"yanjin_L_6",
  "hall.visit.yanjin[2]":"yanjin_L_4",
  "hall.visitPoke.xiaojun[1]":"xiaojun_L_5",
  "hall.visitPoke.xiaojun[2]":"xiaojun_L_2",
  "shop.chat[1]":"yanjin_L_5",
  "shop.chat[3]":"yanjin_L_4",
  "shop.chat[5]":"yanjin_L_1",
  "shop.poke[0]":"yanjin_L_6",
  "shop.poke[2]":"yanjin_L_0",
  "shop.sceneLarva[2]":"yanjin_L_4",
};
const LINE_IMG_N={};
function lineImg(k){const v=LINE_IMG[k];if(!v)return '';if(!Array.isArray(v))return v;const n=LINE_IMG_N[k]=(LINE_IMG_N[k]||0)+1;return v[(n-1)%v.length]}
