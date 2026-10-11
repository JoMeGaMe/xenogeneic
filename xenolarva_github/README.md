# 異種幼體養成模擬器 — 檔案地圖

直接用 GitHub Pages 開 `index.html` 即可。所有程式是一般的 `<script>` 檔，**載入順序就是 index.html 裡的順序**，不需要打包工具。

| 想做的事 | 改哪個檔 |
| --- | --- |
| 新增物品、禮物、玩具、代表色 | `js/data/items.js` |
| 修改結局文字 | `js/data/endings.js` |
| 修改結局判定條件／順序 | `js/endings.js`（`endCode`） |
| 新增玩家指令 | `js/actions.js` ＋ `index.html` 加按鈕 ＋ `js/main.js` 綁定 |
| 調整每日數值（飽食、水質、生命、信賴） | `js/settle.js` |
| 圖鑑／存檔／匯入匯出 | `js/codex.js` |
| 水缸同伴（追逐、互撞） | `js/render/guests.js` |
| 說明頁文字、世界觀、製作者 | `js/data/about.js` |
| 幼體共用繪製與身體染色幅度 | `js/render/larva.js` |
| 背景裝飾（出門撿到、永久保留） | `js/data/decor.js` ＋ `assets/larva/deco_*.png` |
| 所有顯示給玩家的文字（訊息、反應、提示） | `js/data/texts.js` |
| 新增／調整個性（速度、信賴倍率、被戳反應） | `js/data/temperaments.js` ＋ `js/data/texts.js`（名字與說明） |
| 特殊標籤（機率、互斥、效果、發現時機） | `js/data/tags.js`（資料）＋ `js/tags.js`（分配、揭曉、鑑賞家／人類愛好者行為）＋ 餵玩在 `js/actions.js`、結算在 `js/settle.js`、被戳在 `js/render/creature.js` |
| 版本號（畫面左上角） | `js/data/version.js` |
| 新增被戳的反應動作 | `js/render/creature.js` 的 `POKE` 表 |
| 小球之間的互動（一起玩、追逐、躲開…）對照表 | `js/render/social.js`（`REL` 表與 `ACT` 機率） |
| 同伴行為、飄進飄出、互撞 | `js/render/guests.js` |
| 共用移動、撞牆、個性行為（領地、追泡泡） | `js/render/motion.js` |
| 選單三頁（收藏、小球們、存檔） | `js/codex.js` ＋ `index.html` 的 `#ovMenu` |
| 新增表情氣泡圖示 | `js/data/emotes.js` |
| 新增姿勢圖 | `assets/larva/` 放圖 ＋ `js/data/sprites.js` 登記 |
| 調整游動速度、被戳的反應 | `js/render/creature.js` |
| 調整版面、顏色、按鈕 | `css/style.css`、`index.html` |

## 分工原則
- `data/`：只放資料，不放規則。
- `state.js`：遊戲狀態（唯一的一份）。
- `ui.js`、`render/`：只負責顯示，不改規則。
- `actions.js`、`settle.js`、`endings.js`：遊戲規則。

## 預覽用單檔
`python tools/build_single_file.py` 會產生 `game_inline.html`（含所有圖片，一個檔案就能開）。
