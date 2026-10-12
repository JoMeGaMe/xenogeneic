// 【資料】格蕾特（出門遇見的小助手 NPC）。頭像圖片：assets/grete_1.png、grete_2.png（200×200，顯示時縮小）。用在事件／提示框上方，（按鈕上不放圖）。
// 內嵌預覽版由 tools/build_single_file.py 把圖片打包進去；想換圖就直接換掉 assets/grete_1.png。
const GRETE_IMG=(typeof ASSETS!=='undefined'&&ASSETS.grete_1)||'assets/grete_1.png';
const GRETE_IMG2=(typeof ASSETS!=='undefined'&&ASSETS.grete_2)||'assets/grete_2.png';   // 裙角露出觸肢的版本（自我介紹時用）
// 小助手每天結算前的判斷門檻（飽食、水質）
const GRETE_RULE={waterDirt:20,waterPh:1.0,feedBelow:60,hungryBelow:50,maxFeeds:3};
// 出門遇見的機率：每次 20%；第 4 次出門起一定會遇見
const GRETE_MEET={chance:.2,sure:4,again:.3};   // again：見過面但拒絕之後，每次出門再遇到的機率
