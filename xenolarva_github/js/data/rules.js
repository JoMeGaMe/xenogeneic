// 【資料】每日結算與基本行動的數值（v0.30 從 js/settle.js、js/actions.js、js/state.js 抽出來，設定總表「數值參考」會自動列出）
// 要調難度改這裡；邏輯在 js/settle.js（每日結算）與 js/actions.js（換水、餵食、玩耍、出門）。

// 每日結算（照順序：① 飽食與水質 → ② 生命 → ③ 信賴 → ④ 核心變色 → ⑤ 死亡／結局）
const DAY_RULE={
  sat:{normal:28,glutton:36,smalleat:18},          // ① 每天飽食減少（貪吃鬼餓得快、不愛吃餓得慢）
  dirt:{normal:18,clean:9},                        // ① 每天污染增加（愛乾淨減半）
  ph:{drift:1.1,bias:.15,cleanMul:.5,min:4,max:10},// ① 酸鹼度每天隨機飄移 ±drift/2，再往遠離 7 的方向偏 bias；愛乾淨飄移 ×cleanMul
  lifeSat:{starve:20,starveD:-15,hungry:45,hungryD:-4,okD:4},   // ② 生命（飽食）：<starve 扣 starveD｜<hungry 扣 hungryD｜否則 +okD
  lifeWater:{severeD:-20,badD:-10,okD:3},          // ② 生命（水質）：嚴重｜差｜正常
  frailMul:1.5,                                    // ② 虛弱：生命的負變化 ×1.5
  trust:{sat:35,life:50,up:2,down:-5},             // ③ 信賴：飽食≥sat 且生命>life 就 +up，否則 down
  tagCost:{playfulDays:2,playful:3,lovey:2,cleanDirt:60,clean:3,vain:2},   // ③ 標籤的代價：貪玩 playfulDays 天沒玩 −3｜人類愛好者當天沒玩 −2｜愛乾淨污染>60 −3｜愛美沒戴裝扮 −2（戴了 +2）
  color:{day:3,trust:60,bond:2,life:50}            // ④ 核心染上代表色：第 day 日起，信賴≥、互動≥、生命≥
};
// 水質判定（「差」「嚴重」；虛弱的小球門檻比較低）。dirt＝污染超過，ph＝與 7 的差超過
const WATER_RULE={bad:{dirt:60,ph:1.2},severe:{dirt:85,ph:2},frailBad:{dirt:50,ph:1},frailSevere:{dirt:75,ph:1.6}};
// 基本行動
const ACT_RULE={
  water:{dirt:60,min:5,ph:.7,overLife:6},          // 換水：污染 −dirt（最低 min）、pH 往 7 靠 ph；同一天第二次換水生命 −overLife
  feed:{food:35,snack:15,smalleatMul:.6,full:85,fullGlutton:70,overFood:5,overSnack:3,dislikeSat:40,dislikeAmt:10,favTrust:11,okTrust:4},
  //   海草湯／零食的飽食｜不愛吃 ×smalleatMul｜飽食>full（貪吃鬼>fullGlutton）還硬塞：生命 −overFood／−overSnack
  //   不喜歡的零食：飽食≤dislikeSat 才勉強吃（+dislikeAmt），否則推開｜喜歡的零食信賴 +favTrust｜普通零食 +okTrust（都再乘個性倍率）
  play:{fav:9,playful:6,meh:2,scholarMul:.5},       // 玩耍信賴：最愛的玩具｜貪玩（每種都喜歡）｜普通｜學者 ×scholarMul
  out:{kitChance:.25,kitSure:3,decor:.35}          // 出門：水質檢測儀 25%（第 3 次起必得）｜背景裝飾 35%
};
// 結局條件（js/endings.js 由上到下第一個符合的）：END-05 核心被聊天染成別的顏色｜END-06 生命<sadLife 或信賴<sadTrust｜END-02 信賴≥bondTrust 且互動≥bondN
//   END-03 探索≥explore 且是探索型個性｜END-04 生命≥lonerLife 且互動≤lonerBond｜其他 END-01
const END_RULE={sadLife:40,sadTrust:25,bondTrust:70,bondN:5,explore:4,lonerLife:70,lonerBond:2};
