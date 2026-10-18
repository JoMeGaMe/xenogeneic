// 【資料】異生會大樓（地圖上的「異生會大樓」，耗 1 行動）：樓層、成就、心等。文字在 js/data/texts.js 的 TEXT.hall、TEXT.ach。
// 樓層（由上往下排成電梯按鈕）：
//   bg：背景圖（assets/ 底下的檔名，720×360）｜chr：站在畫面裡的角色立繪（[平常, 第二張]；沒有圖時先用暫代圖）
//   pokeAlt：被戳時哪幾句（TEXT.hall.poke 的第幾句，從 0 起算）換第二張；沒寫＝每戳一次輪流換
//   need：要幾等心等才開放（沒到＝按鈕灰色，按了只看說明）｜lock：還沒做好、不能按（例如 4F）
const HALL_FLOORS={
  top:  {bg:'hall_top',  chr:['yanjie_1','yanjie_2'],lock:true},         // 5F 頂樓辦公室：大部分時間是顧問言街。v0.4 主線第一章完成後開放
  f4:   {bg:'hall_4f',   chr:['yanxiang_1','yanxiang_2'],lock:true},     // 4F 研究中心：真正的掌權者言巷。v0.4 主線第一章完成後開放
  f3:   {bg:'hall_3f',   chr:['joan_1','joan_2'],pokeAlt:[0,2]},         // 3F 後勤辦公室：瓊（成就、心等）。joan_2 是驚訝表情：只有被戳的第 1、3 句（TEXT.hall.poke.f3）用
  f2:   {bg:'hall_2f',   chr:['silence_1','silence_2'],need:2,pokeAlt:[1]}, // 2F 實習生辦公室：賽倫絲（特殊委託，v0.26）。silence_2 是瞇眼笑
  lobby:{bg:'hall_lobby',chr:['grete_1','grete_2']},                     // 1F 大廳：進來先到這裡；格蕾特偶爾在櫃檯或當電梯小姐
  b1:   {bg:'hall_b1',   chr:['xiaojun_1','xiaojun_2'],need:3,back:4,pokeAlt:[2]}   // B1 特殊任務室：言曉君。心等 3 能進來（只有紙條），心等 back（4）她任務回來；xiaojun_2 是閉眼嘆氣（被戳第 3 句用）。緊急委託 v0.4
};
const HALL_ORDER=['top','f4','f3','f2','lobby','b1'];
// 被戳時跳多高（px，依角色個性）：瓊、格蕾特跳得大，賽倫絲中等，言盡很小
const NPC_HOP={f3:24,lobby:24,f2:16,b1:8,shop:6};
// 1F 大廳的訪客（v0.32.2）：認識了（met）才會出現，每次進大廳隨機一位或沒人。w＝權重（格蕾特是大廳常客）
//   home：平常在哪一層——在 1F 遇到他之後按那一層，會有「原來你是來找我的」（TEXT.hall.follow），同一趟不會再出現在 1F
//   hop：被戳跳多高（NPC_HOP 的 key）｜pokeAlt：同 HALL_FLOORS（TEXT.hall.visitPoke 的第幾句用第二張圖）
//   文字：格蕾特沿用 TEXT.hall.lobbyGrete／poke.lobby；其他人 TEXT.hall.visit／visitPoke／follow／visitName
const LOBBY_NPC={
  grete:  {chr:['grete_1','grete_2'],     w:2,hop:'lobby',            met:()=>META.greteMet},
  joan:   {chr:['joan_1','joan_2'],       w:1,hop:'f3',home:'f3',pokeAlt:[0],met:()=>META.joanMet},
  silence:{chr:['silence_1','silence_2'], w:1,hop:'f2',home:'f2',pokeAlt:[1],met:()=>META.silenceMet&&floorOpen('f2')},
  xiaojun:{chr:['xiaojun_1','xiaojun_2'], w:1,hop:'b1',home:'b1',pokeAlt:[2],met:()=>META.xiaojunMet&&META.heartLv>=(HALL_FLOORS.b1.back||1)},
  yanjin: {chr:['yanjin_1','yanjin_2'],   w:1,hop:'shop',pokeAlt:[0],met:()=>META.shopMet}   // 言盡：沒有自己的樓層，只是晃進來
};
const HALL_RULE={lobbyNpc:.5,                                          // 大廳有訪客的機率（認識的人裡挑，見 LOBBY_NPC；v0.32.2 前只有格蕾特 .35）
  larva:.5,                // 每到一層，背景裡有一隻小球在爬的機率（0～1 隻；不會走到人那邊）
  gift:.25,giftMax:3,      // 戳背景的小球：這個機率送你一個道具（gifts 裡挑），每次去大樓最多拿 giftMax 個
  gifts:['agent','snack'],  // 一半換水劑、一半點心（snack＝甜果／鹹貝／苦藻三選一）
  larvaSc:.9,              // 背景小球的大小
  known:.3,                // 有交還過的小球時：背景的小球是「交還過的那隻」的機率（顏色照牠交還時；舊存檔沒記到顏色＝原色）
  strangerDay:2};          // 不認識的小球的顏色：照第幾日的小球（1＝全白，越大越有顏色）

// 心等：累積的心（領取成就得到）到了就可以去 3F 找瓊「升級」（要自己按）。目前最高 4 等（v0.30）。
//   need[等級]＝升到這一等要的心｜shop：商店每次擺幾種
const HEART_RULE={max:4,need:{2:6,3:20,4:36},shop:{1:3,2:3,3:4,4:4}};   // v0.30：心等 4（36 心；獎勵是特殊委託名單多一隻，見 SPECIAL_RULE.count）

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
  {id:'special1',cat:'raise',heart:1,      prog:()=>[Math.min(1,META.specialDone||0),1]},   // v0.30：完成特殊委託（2F 賽倫絲）
  {id:'special3',cat:'raise',heart:2,      prog:()=>[META.specialDone||0,3]},
  // 圖鑑
  {id:'end3',    cat:'book', heart:1,      prog:()=>[gotSet('end').size,3]},
  {id:'end6',    cat:'book', heart:3,wear:'foxmask',prog:()=>[[...gotSet('end')].filter(x=>x!=='END-07').length,6]},
  {id:'temper6', cat:'book', heart:2,      prog:()=>[gotSet('temper').size,TEMPER_IDS.length]},
  {id:'tag5',    cat:'book', heart:3,      prog:()=>[tagSet().size,5]},
  {id:'tag10',   cat:'book', heart:5,wear:'detective',prog:()=>[tagSet().size,10]},
  {id:'tag15',   cat:'book', heart:5,avail:()=>Object.keys(TAGS).length>=15,prog:()=>[tagSet().size,15]},   // avail：標籤種類夠了才出現（不寫死「全部」，之後加標籤可以再加 20…）
  // 交流
  {id:'grete',   cat:'talk', heart:1,      prog:()=>[META.greteMet||META.grete?1:0,1]},
  {id:'meetYanjin',cat:'talk',heart:1,     prog:()=>[META.shopMet?1:0,1]},       // v0.32.2：NPC 初見成就
  {id:'meetJoan',cat:'talk',  heart:1,      prog:()=>[META.joanMet?1:0,1]},
  {id:'meetSilence',cat:'talk',heart:1,     prog:()=>[META.silenceMet?1:0,1]},
  {id:'xiaojun', cat:'talk', heart:2,      prog:()=>[META.xiaojunMet?1:0,1]},   // v0.32.1：在 B1 見到言曉君（心等 4）
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
].filter(a=>!a.avail||a.avail());
const ACH_PT={1:3,2:5,3:8,5:12};
const achPts=a=>a.pt!=null?a.pt:(ACH_PT[a.heart]||a.heart*3);

// 特殊委託（2F 賽倫絲，心等 2）：每次來大樓名單換一批（同一趟不變）；每一輪只能預約一隻，預約後不能改；下一輪接到的就是牠。
//   count：心等→名單幾隻｜odds：標籤數量的機率（none 0 個、one 1 個，其他 2 個）｜noTag：不會出現在委託裡的標籤
//   why：說明文（TEXT.special.why 通用、whyTag 依標籤、whyTemp 依個性）；有對應的時候 tagWhy 的機率用對應的
const SPECIAL_RULE={count:{2:2,3:3,4:4},odds:{2:{none:.5,one:.45},3:{none:.25,one:.55},4:{none:.25,one:.55}},noTag:['homereturn'],tagWhy:.6};

