// 【資料】圖片檔清單與每個姿勢的核心位置。新增姿勢圖時，在這裡登記。
// ---- 圖片載入（ASSETS 為內嵌版專用，GitHub 版讀 assets/larva/）----
const BASE='assets/larva/';
const IMGN=['bg_tank','bg_preview','bg_tank_glass_1','bg_tank_glass_2','deco_castle','deco_shell','deco_coral','body_close','body_curl','body_droop','body_flat_a','body_flat_b','body_idle_a','body_idle_b','body_open_a','body_open_b','body_reach_a','body_reach_b','body_rest','core_mask','core_glow'];
// 核心中心位置（以 96×96 幼體圖為座標），不同姿勢可微調
const CORE={rest:[48,62],curl:[46,50],droop:[46,48],flat_a:[46,50],flat_b:[46,50]};
const coreAt=p=>CORE[p]||[46,46];
