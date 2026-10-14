// 【資料】畢業小球的信紙（交還協會的小球，之後偶爾會寄信來）。信的文字在 js/data/texts.js 的 TEXT.letter。
// 判定方式：每輪按「等待新委託」時，把已交還、還沒寄過信的小球從最近交還的開始（剛滿 5 週的先）一隻一隻判定，寄出一封就停（每輪最多一封）。
// 週數＝交還之後過了幾輪（一輪＝一週）。
// minWeeks：未滿這個週數不判定（不寄信）
// stableWeeks：滿這個週數算「穩定期」：normal 的機率寄「問候」信
// 未滿穩定期（minWeeks～stableWeeks-1 週）：farewell 的機率寄「道別」（離開前轉述的極短信，沒有手寫信紙，只有後勤的翻譯稿）、
//   young 的機率寄「期許」（快兩個月了、好希望能順利長大），其餘不寄 → 換下一隻
//   （模擬：不管多常交還，大約 問候 55%／期許 40%／道別 4.5%）
// 收到「道別」信＝那隻小球也離開了：和日常的提前消逝一樣，算一次「消逝」（回歸者標籤的名額＋1，見 js/tags.js 的 lostCount）
const LETTER_RULE={minWeeks:5,stableWeeks:8,normal:.2,young:.18,farewell:.02};
// 信紙圖：assets/letter.png（建議 360×180，或 180×90 像素畫放大 2 倍）。目前是暫用圖。
const LETTER_IMG=(typeof ASSETS!=='undefined'&&ASSETS.letter)||'assets/letter.png';                 // 舊的通用信紙圖（找不到分類圖時用）
// 後勤翻譯稿的配圖依種類（720×360，2:1）：問候 letter_normal（櫻花，使用者的 letter_1）｜期許 letter_young（綠葉，letter_2）｜道別 letter_farewell（冬天，letter_3）。LETTER_IMG＝舊的通用圖（找不到時用）
const LETTER_IMGS={normal:'letter_normal',young:'letter_young',farewell:'letter_farewell'};
