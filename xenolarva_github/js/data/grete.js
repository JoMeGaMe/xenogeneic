// 【資料】格蕾特（出門遇見的小助手 NPC）。頭像圖片：assets/npc/grete_L_0.png、grete_L_4.png（200×200，顯示時縮小）。用在事件／提示框上方，（按鈕上不放圖）。
// 內嵌預覽版由 tools/build_single_file.py 把圖片打包進去；想換圖就直接換掉 assets/npc/grete_L_0.png。
const GRETE_IMG='grete_L_0';   // v0.40.4 起是圖名（showEvent 會描白邊）
const GRETE_IMG2='grete_L_4';   // 樂（裙角觸肢的版本是 grete_L_6，只用在遇見格蕾特第 3 頁、大廳被戳第 1 句）
// 小助手每天結算前的判斷門檻（飽食、水質）
const GRETE_RULE={waterDirt:20,waterPh:1.0,feedBelow:60,hungryBelow:50,maxFeeds:3};
// 出門遇見的機率：每次 20%；第 4 次出門起一定會遇見
const GRETE_MEET={chance:.2,sure:4,again:.3};   // again：見過面但拒絕之後，每次出門再遇到的機率
