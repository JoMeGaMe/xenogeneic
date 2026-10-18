# 異種幼體養成模擬器 — 檔案地圖

直接用 GitHub Pages 開 `index.html` 即可。所有程式是一般的 `<script>` 檔，**載入順序就是 index.html 裡的順序**，不需要打包工具。

| 想做的事 | 改哪個檔 |
| --- | --- |
| 新增物品、禮物、玩具、代表色 | `js/data/items.js` |
| 修改結局文字 | `js/data/endings.js` |
| 修改結局判定條件／順序 | `js/endings.js`（`endCode`） |
| 新增玩家指令 | `js/actions.js` ＋ `index.html` 加按鈕 ＋ `js/main.js` 綁定 |
| 調整每日數值（飽食、水質、生命、信賴）、行動數值、結局門檻 | `js/data/rules.js`（DAY_RULE、WATER_RULE、ACT_RULE、END_RULE；邏輯在 `js/settle.js`、`js/actions.js`、`js/endings.js`） |
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
| 介面配色、版型、按鈕質感 | `css/theme.css`（接在 style.css 後面；顏色都用這裡的變數） |
| 設定裡的外觀選項（版型／配色／字體） | `js/skin.js`（文字：`texts.js` 的 `skin`；字體檔 `assets/font/`） |
| 開場故事、第 0 日（沒小球）、接取委託、設定、交還協會積分 | `js/flow.js`（資料：`js/data/assoc.js`；文字：`texts.js` 的 `intro`／`idle`／`assoc`） |
| 觀察水缸模式（750×500、最多 5 隻、可戳） | `js/preview.js`（背景 `assets/larva/bg_preview.png`） |
| 聊天與聊天染色（單色／雙色） | `js/chat.js`、`js/data/chat.js`；事件在 `js/events.js`（`colorTalk`／`colorTalk2`） |
| 事件框（多頁、分支） | `js/events.js` |
| 格蕾特小助手與心聲翻譯 | `js/grete.js`、`js/data/grete.js` |
| 禮物與偷偷七逃 | `js/souvenirs.js`、`js/data/souvenirs.js` |
| 開發者模式（連點版本號 5 次或網址 `?dev=1`） | `js/dev.js` |
| 離線測試（不開瀏覽器跑遊戲邏輯） | `tools/test_harness.js`（用法在檔案開頭） |
| 打包成單一 HTML（Claude 預覽用） | `python3 tools/build_single_file.py` |
| ☰ 選單（順序與文字）、設定與存檔頁的跳段按鈕、手機版底部固定行動區、訊息區展開 | `js/layout.js`（樣式在 `css/style.css` 最後一段；選單順序與文字 `TEXT.layout.ham`） |
| 選單頁面（小球們／收藏品／設定與存檔／說明與公告；設定內容在 `js/flow.js` 的 `settingsBuild`） | `index.html` 的 `#ovMenu`、`js/codex.js` 的 `showTab`；說明 `js/data/about.js`；更新公告 `js/data/news.js` |
| 按鈕上的單色圖示（16×16 像素，或換成自己的圖片路徑） | `js/data/icons.js` |
| 截圖檢查版面（環境內建 Chromium） | `python3 tools/screenshot.py <game_inline.html 絕對路徑> <輸出資料夾>` |
| 設定總表（產生／套回文字） | `python3 tools/textsheet.py build <專案根目錄> <舊總表.xlsx> <新總表.xlsx>`；`python3 tools/textsheet.py apply <專案根目錄> <總表.xlsx>` |
| index.html 寫死的介面字 | 元素加 `data-t="ui.xxx"`，文字放 `TEXT.ui`（開遊戲時 ui.js 會換上） |
| 畢業小球的信紙（寄信判定、內容、收藏重看） | `js/letters.js`（規則 `js/data/letters.js`；文字 `TEXT.letter`；信紙圖 `assets/letter.png`） |
| 外出地圖（地點、名牌位置、掉落權重、地圖底圖） | `js/places.js`（資料 `js/data/places.js`；文字 `TEXT.place`／`TEXT.map`；底圖 `assets/map.png` 750×500）；隨機外出也從 `RANDOM_PLACES` 挑地點 |
| 廢棄大樓的商店（言盡）：商品、價格、擺放位置 | `js/shop.js`（資料 `js/data/shop.js`；文字 `TEXT.shop`；開場事件 `EVENTS.shopIntro`） |
| 事件頁的場景（背景＋角色＋道具） | 事件頁面加 `bg`／`chr`／`item`（assets 檔名）＝`js/events.js` 的 showEvent；圖片 `assetImg(檔名)` |
| 裝扮道具（像素圖、戴的位置） | `js/data/wears.js`（商品在 `js/data/shop.js` 加一筆 `wear:'id'`；畫在 `js/render/larva.js` 的 drawLarva） |
| 互動玩耍（指揮棒、氣泡棒、小鈴鐺、軟球） | `js/minigame.js`（文字 `TEXT.game`；開始＝`gameStart`，由 actPlay 在「遊玩」方式時呼叫）；表情氣泡圖案 `js/data/emotes.js` |
| 異生會大樓（樓層、電梯、瓊的成就與心等、背景小球、交還的小球回來） | `js/hall.js`（資料 `js/data/hall.js`：`HALL_FLOORS`、`HALL_RULE`、`NPC_HOP`、`ACH`；文字 `TEXT.hall`） |
| 特殊委託（2F 賽倫絲：名單、預約→下一輪） | `js/hall.js` 的 `specialOpen`（文字 `TEXT.special`） |
| 商店閒聊畫面（言盡、行李箱、送東西的小球） | `js/shop.js` 的 `shopView`（`SHOP_SCENE` 在 `js/data/shop.js`） |
| 雜誌染色（外殼上下／左右漸層） | `js/chat.js`（`MAG_SPLIT`）＋ `js/render/sprites.js` 的 `tint2` |
| 打扮（獨立視窗 `#ovDress`）、發光裝扮顏色 | `js/codex.js`（`DRESS`、`dressOpen`／`dressRender`）＋ `js/data/wears.js` |
| 存檔欄位（新增跨輪資料） | `js/codex.js` 的 `SAVE_FIELDS` |
| 圖片載入與失敗提示 | `js/render/sprites.js`（`IMG_MISSING`、`imgOK`） |

## 分工原則
- `data/`：只放資料，不放規則。
- `state.js`：遊戲狀態（唯一的一份）。
- `ui.js`、`render/`：只負責顯示，不改規則。
- `actions.js`、`settle.js`、`endings.js`：遊戲規則。

## 預覽用單檔
`python tools/build_single_file.py` 會產生 `game_inline.html`（含所有圖片，一個檔案就能開）。
