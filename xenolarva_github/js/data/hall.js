// 【資料】異生會大樓（地圖上的「異生會大樓」，耗 1 行動）：樓層、成就、心等。文字在 js/data/texts.js 的 TEXT.hall、TEXT.ach。
// 樓層（由上往下排成電梯按鈕）：
//   bg：背景圖（assets/ 底下的檔名，720×360）｜chr：站在畫面裡的角色立繪（[平常, 第二張]；沒有圖時先用暫代圖）
//   pokeAlt：被戳時哪幾句（TEXT.hall.poke 的第幾句，從 0 起算）換第二張；沒寫＝每戳一次輪流換
//   need：要幾等心等才開放（沒到＝按鈕灰色，按了只看說明）｜lock：還沒做好、不能按（例如 4F）
const HALL_FLOORS={
  top:  {bg:'hall_top',  chr:['yanxiang_1','yanxiang_2'],lock:true},     // 4F 辦公室（原頂樓）：言巷（金主）。之後才開放
  f3:   {bg:'hall_3f',   chr:['joan_1','joan_2'],pokeAlt:[0,2]},         // 3F 後勤辦公室：瓊（成就、心等）。joan_2 是驚訝表情：只有被戳的第 1、3 句（TEXT.hall.poke.f3）用
  f2:   {bg:'hall_2f',   chr:['silence_1','silence_2'],need:2,pokeAlt:[1]}, // 2F 實習生辦公室：賽倫絲（特殊委託，v0.26）。silence_2 是瞇眼笑
  lobby:{bg:'hall_lobby',chr:['grete_1','grete_2']},                     // 1F 大廳：進來先到這裡；格蕾特偶爾在櫃檯或當電梯小姐
  b1:   {bg:'hall_b1',   chr:['xiaojun_1','xiaojun_2'],need:3}           // B1 特殊任務室：言曉君（緊急委託，之後）
};
const HALL_ORDER=['top','f3','f2','lobby','b1'];
// 被戳時跳多高（px，依角色個性）：瓊、格蕾特跳得大，賽倫絲中等，言盡很小
const NPC_HOP={f3:24,lobby:24,f2:16,shop:6};
const HALL_RULE={greteLobby:.35,                                       // 大廳遇到格蕾特的機率（認識她之後）
  larva:.5,                // 每到一層，背景裡有一隻小球在爬的機率（0～1 隻；不會走到人那邊）
  gift:.25,giftMax:3,      // 戳背景的小球：這個機率送你一個道具（gifts 裡挑），每次去大樓最多拿 giftMax 個
  gifts:['agent','snack'],  // 一半換水劑、一半點心（snack＝甜果／鹹貝／苦藻三選一）
  larvaSc:.9,              // 背景小球的大小
  known:.3,                // 有交還過的小球時：背景的小球是「交還過的那隻」的機率（顏色照牠交還時；舊存檔沒記到顏色＝原色）
  strangerDay:2};          // 不認識的小球的顏色：照第幾日的小球（1＝全白，越大越有顏色）

// 心等：累積的心（領取成就得到）到了就可以去 3F 找瓊「升級」（要自己按）。這階段最高 3 等。
//   need[等級]＝升到這一等要的心｜shop：商店每次擺幾種
const HEART_RULE={max:3,need:{2:6,3:20},shop:{1:3,2:3,3:4}};

// 成就：id 對應 TEXT.ach.list 的名稱與條件。
//   heart 心｜pt 積分（沒寫就照心數：1→3、2→5、3→8、5→12）｜wear 獎勵的裝扮｜hide：'all'＝達成前連條件都看不到（預設只有名稱是？？？）
//   prog()：回傳 [目前, 目標]
const gotSet=k=>new Set([...CODEX.map(e=>k==='end'?e.end:k==='temper'?e.temp:null).filter(Boolean),...META.got[k],...META.returned.map(r=>k==='end'?r.end:k==='temper'?r.temp:null).filter(Boolean)]);
const tagSet=()=>new Set([...CODEX.flatMap(e=>e.tags),...META.got.tag]);
const souvKinds=()=>Object.keys(SOUV_SRC).filter(k=>META.souv[k]>0).length;
const souvTotal=()=>Object.keys(SOUV_SRC).reduce((n,k)=>n+(META.souv[k]||0),0);
const letterTotal=()=>(META.letterGot.normal||0)+(META.letterGot.young||0)+(META.letterGot.farewell||0);
const openPlaces=()=>Object.keys(PLACES).filter(k=>!PLACES[k].home&&!PLACES[k].locked);
const twoTone=()=>[...CODEX,...(S&&!PV?[S]:[])].some(e=>e.tc&&e.tb&&e.tc!==e.tb);
const ACH=[
  // 養育
  {id:'round1',  cat:'raise',heart:1,pt:5, prog:()=>[META.rounds,1]},
  {id:'round3',  cat:'raise',heart:1,pt:5, prog:()=>[META.rounds,3]},
  {id:'round7',  cat:'raise',heart:2,pt:10,prog:()=>[META.rounds,7]},
  {id:'safe7',   cat:'raise',heart:1,      prog:()=>[[...CODEX,...META.returned].some(e=>e.end&&e.end!=='END-07')?1:0,1]},
  {id:'return1', cat:'raise',heart:1,      prog:()=>[META.returned.length,1]},
  {id:'return5', cat:'raise',heart:2,      prog:()=>[META.returned.length,5]},
  // 圖鑑
  {id:'end3',    cat:'book', heart:1,      prog:()=>[gotSet('end').size,3]},
  {id:'end6',    cat:'book', heart:3,wear:'foxmask',prog:()=>[[...gotSet('end')].filter(x=>x!=='END-07').length,6]},
  {id:'temper6', cat:'book', heart:2,      prog:()=>[gotSet('temper').size,TEMPER_IDS.length]},
  {id:'tag5',    cat:'book', heart:3,      prog:()=>[tagSet().size,5]},
  {id:'tag10',   cat:'book', heart:5,wear:'detective',prog:()=>[tagSet().size,Object.keys(TAGS).length]},
  // 交流
  {id:'grete',   cat:'talk', heart:1,      prog:()=>[META.greteMet||META.grete?1:0,1]},
  {id:'dye1',    cat:'talk', heart:1,      prog:()=>[Math.min(1,META.chatWins||0),1]},
  {id:'dye2',    cat:'talk', heart:1,      prog:()=>[twoTone()?1:0,1]},
  {id:'crown',   cat:'talk', heart:1,      prog:()=>[Math.min(1,META.crowns||0),1]},
  // 禮物
  {id:'gift10k', cat:'gift', heart:1,      prog:()=>[souvKinds(),10]},
  {id:'gift10',  cat:'gift', heart:1,      prog:()=>[souvTotal(),10]},
  {id:'gift20',  cat:'gift', heart:2,      prog:()=>[souvTotal(),20]},
  // 信
  {id:'letterN', cat:'letter',heart:1,     prog:()=>[Math.min(1,META.letterGot.normal||0),1]},
  {id:'letterY', cat:'letter',heart:2,     prog:()=>[Math.min(1,META.letterGot.young||0),1]},
  {id:'letterF', cat:'letter',heart:3,hide:'all',prog:()=>[Math.min(1,META.letterGot.farewell||0),1]},
  {id:'letter3', cat:'letter',heart:1,     prog:()=>[letterTotal(),3]},
  {id:'letter5', cat:'letter',heart:2,     prog:()=>[letterTotal(),5]},
  {id:'keep1',   cat:'letter',heart:1,     prog:()=>[META.letters.length,1]},
  {id:'keep3',   cat:'letter',heart:2,     prog:()=>[META.letters.length,3]},
  // 外出
  {id:'places',  cat:'out',  heart:1,      prog:()=>{const o=openPlaces();return [o.filter(k=>META.visited.includes(k)).length,o.length]}},
  {id:'buy1',    cat:'out',  heart:1,      prog:()=>[Math.min(1,META.buys||0),1]},
  {id:'tools',   cat:'out',  heart:2,      prog:()=>[['wand','bucket'].filter(k=>META.tools.includes(k)).length,2]},
  {id:'decor3',  cat:'out',  heart:1,      prog:()=>[META.decor.length,3]}
];
const ACH_PT={1:3,2:5,3:8,5:12};
const achPts=a=>a.pt!=null?a.pt:(ACH_PT[a.heart]||a.heart*3);

// 特殊委託（2F 賽倫絲，心等 2）：每次來大樓名單換一批（同一趟不變）；每一輪只能預約一隻，預約後不能改；下一輪接到的就是牠。
//   count：心等→名單幾隻｜odds：標籤數量的機率（none 0 個、one 1 個，其他 2 個）｜noTag：不會出現在委託裡的標籤
//   why：說明文（TEXT.special.why 通用、whyTag 依標籤、whyTemp 依個性）；有對應的時候 tagWhy 的機率用對應的
const SPECIAL_RULE={count:{2:2,3:3},odds:{2:{none:.5,one:.45},3:{none:.25,one:.55}},noTag:['homereturn'],tagWhy:.6};

