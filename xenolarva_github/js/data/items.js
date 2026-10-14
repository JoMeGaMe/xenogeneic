// 【資料】物品名稱、零食（GIFTS）／玩具清單、代表色色票。要新增物品或顏色，改這裡。
const NAME={food:'海草湯',agent:'換水劑',sweet:'甜果',salty:'鹹貝',bitter:'苦藻',bubble:'氣泡棒',bell:'小鈴鐺',ball:'軟球',kit:'水質檢測儀',wand:'亮亮指揮棒',bucket:'小水桶',magV:'潮流髮型雜誌',magH:'酷炫動漫雜誌'};   // wand：商店買的永久道具（META.tools），不在物品欄
const GIFTS=['sweet','salty','bitter'], TOYS=['bubble','bell','ball'];
const PLAY_TOOLS=['wand','bucket'];   // META.tools 裡會出現在玩耍選單的（雜誌 magV／magH 是聊天用的，不在玩耍）
const COLORS=['#e5484d','#ff8a3d','#f2b84b','#ffe94d','#5fd38d','#58a6ff','#a56bff','#ff7aa8','#8b5a2b','#25252b','#f5f5f5'];
const CNAME=['紅','橘','金','黃','綠','藍','紫','粉','棕','黑','白'];

// 物品圖鑑的分組（顯示順序）。新增物品時記得放進對應的組。
const ITEM_GROUPS=[['食物',['food']],['零食',GIFTS],['玩具',TOYS],['工具',['agent','kit']]];
