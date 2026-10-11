// 【資料】特殊標籤（機制參數）。標籤的名字、說明與各種情境的文字在 js/data/texts.js 的 TEXT.tags。
// 欄位：
//   weight    抽到「有標籤」之後，各標籤被抽中的權重（常見型 50｜一般型 30｜稀有型 10｜極稀有型 5）
//   off       true＝暫時不會分配給任何小球（等需要的機制做好）
//   needsLost true＝只有「消逝過的小球」還沒被用掉時才會出現（回歸者：消逝過幾隻，最多就出現幾隻）
// 標籤的行為與效果寫在：js/tags.js（分配、揭曉、裝飾與游標行為）、js/actions.js（餵食與玩耍）、
//   js/settle.js（每日結算）、js/render/creature.js（被戳）。
const TAGS={
  glutton:   {weight:50},
  playful:   {weight:50},
  touchy:    {weight:30},
  frail:     {weight:10},
  judge:     {weight:30},
  lovey:     {weight:10},
  clean:     {weight:30},
  scholar:   {weight:10},                           // 第一次聽到心聲時揭曉
  homereturn:{weight:5, needsLost:true},            // 同上；另外需要有消逝過的小球才會出現
  sneak:     {weight:10}                            // 偷偷七逃：換日時偶爾從缸邊游進來，才發現牠溜出去過
};
// 互相矛盾、不會同時出現的標籤
const TAG_CLASH=[['glutton','frail'],['playful','scholar'],['frail','sneak']];
// 每隻小球的標籤數量：60% 沒有、35% 一個、5% 兩個
const TAG_ODDS={none:.60,one:.35};
