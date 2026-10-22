// 【資料】紙娃娃（玩家的長相，v0.35）。圖在 assets/doll/（372×400 整張畫布、照位置畫好的灰階圖），程式用 186×200 當座標。
// 規格見專案文件「紙娃娃規格」。文字（部件名稱、按鈕）在 TEXT.doll。
//   新增部件圖：檔名＝部件_編號（例：back_15.png）放進 assets/doll/，再把檔名加進 DOLL_LISTS、有畫的範圍加進 DOLL_BB（tools 裡可以算，或請 Claude 算）。
const DOLL_W=186,DOLL_H=200,DOLL_K=2;   // 邏輯尺寸｜內部 2 倍解析度
// 每種部件有哪些圖（順序＝格子裡的順序；編號＝原檔編號）
const DOLL_LISTS={
  front:["front_1", "front_2", "front_3", "front_4", "front_5", "front_6", "front_7", "front_8"],
  back:["back_1", "back_2", "back_3", "back_4", "back_5", "back_6", "back_7", "back_8", "back_9", "back_10", "back_11", "back_12", "back_13", "back_14"],
  tie:["tie_1", "tie_2", "tie_3", "tie_4", "tie_5", "tie_6", "tie_7", "tie_8", "tie_9", "tie_10"],
  sideR:["sideR_2", "sideR_3", "sideR_4", "sideR_5", "sideR_6", "sideR_7", "sideR_8"],
  sideL:["sideL_3", "sideL_4", "sideL_5", "sideL_6", "sideL_7", "sideL_8"],
  ahoge:["ahoge_1", "ahoge_2", "ahoge_3", "ahoge_4", "ahoge_5", "ahoge_6", "ahoge_7"],
  brow:["brow_1", "brow_2", "brow_3", "brow_4", "brow_5", "brow_6", "brow_7", "brow_8", "brow_9", "brow_10", "brow_11"],
  eye:["eye_1", "eye_2", "eye_3", "eye_4", "eye_5", "eye_6", "eye_7", "eye_8", "eye_9", "eye_10", "eye_11", "eye_12", "eye_13", "eye_14", "eye_15", "eye_16", "eye_17", "eye_18"],
  hl:["hl_0", "hl_1", "hl_11", "hl_14", "hl_15"],
  mouth:["mouth_1", "mouth_2", "mouth_3", "mouth_4", "mouth_5", "mouth_6", "mouth_7", "mouth_8", "mouth_9", "mouth_10", "mouth_11", "mouth_12"],
  ear:["ear_1", "ear_2"],
  top:["top_1"],
  pants:["pants_1"]
};
// 每張圖有畫的範圍 [x0,y0,x1,y1]（186×200 座標）：縮圖放大、以中心縮放移動用
const DOLL_BB={sideR_2:[115,55,128,84],sideL_3:[38,51,57,105],sideR_3:[107,47,129,99],sideR_4:[111,50,128,103],sideL_4:[41,51,59,105],sideL_5:[41,46,58,110],sideR_5:[105,42,127,113],sideL_6:[37,45,56,137],sideR_6:[109,43,138,139],sideL_7:[34,47,57,99],sideR_7:[111,48,138,95],sideR_8:[112,47,134,117],sideL_8:[37,53,59,114],ahoge_1:[70,2,93,39],ahoge_2:[65,5,104,32],ahoge_3:[60,21,84,52],ahoge_4:[49,21,74,40],ahoge_5:[62,14,82,57],ahoge_6:[71,18,98,59],ahoge_7:[82,21,116,65],mouth_1:[73,81,83,85],mouth_2:[69,80,86,88],mouth_3:[67,80,88,93],mouth_4:[71,81,83,85],mouth_5:[72,79,86,88],mouth_6:[73,80,81,89],mouth_7:[73,82,81,84],mouth_8:[70,81,85,88],mouth_9:[70,81,85,86],mouth_10:[70,80,84,85],mouth_11:[72,79,80,85],mouth_12:[68,81,90,88],back_1:[39,13,139,102],back_2:[37,13,141,103],back_3:[39,13,139,116],back_4:[37,13,141,113],back_5:[34,13,141,132],back_6:[28,13,153,168],back_7:[34,12,140,118],back_8:[25,12,155,134],back_9:[31,12,150,132],back_10:[30,13,152,157],back_11:[29,12,156,181],back_12:[37,12,141,132],back_13:[37,12,141,155],back_14:[29,12,146,154],front_1:[40,12,132,94],front_2:[32,14,143,81],front_3:[34,16,143,83],front_4:[32,15,134,70],front_5:[36,14,139,74],front_6:[39,19,134,101],front_7:[36,15,134,74],front_8:[37,16,132,87],brow_1:[55,56,107,61],brow_2:[52,54,106,61],brow_3:[53,55,106,62],brow_4:[52,51,108,61],brow_5:[54,55,105,65],brow_6:[51,52,106,62],brow_7:[55,56,105,63],brow_8:[49,51,106,61],brow_9:[54,48,111,63],brow_10:[54,53,106,61],brow_11:[51,52,109,62],eye_1:[58,63,101,81],eye_2:[58,66,101,81],eye_3:[58,66,100,81],eye_4:[53,69,104,77],eye_5:[56,69,103,77],eye_6:[55,63,100,79],eye_7:[54,69,105,78],eye_8:[53,63,105,81],eye_9:[53,66,102,81],eye_10:[55,69,101,78],eye_11:[46,63,109,81],eye_12:[51,58,108,80],eye_13:[50,62,103,81],eye_14:[50,59,107,82],eye_15:[47,65,110,80],eye_16:[51,61,103,80],eye_17:[52,62,106,82],eye_18:[50,66,106,78],hl_0:[59,71,96,77],hl_1:[61,71,98,79],hl_11:[56,69,98,77],hl_14:[55,69,99,80],hl_15:[59,71,99,77],tie_1:[92,97,142,179],tie_2:[92,97,125,128],tie_3:[92,97,134,155],tie_4:[91,97,122,126],tie_5:[27,14,156,114],tie_6:[27,14,72,114],tie_7:[111,14,156,114],tie_8:[80,1,139,111],tie_9:[85,1,129,135],tie_10:[59,1,140,142],ear_1:[123,62,137,85],ear_2:[121,56,139,86],pants_1:[68,146,111,198],top_1:[63,102,118,156],body:[43,20,129,198]};
// 部件設定：tint＝用哪個顏色上色（hair 髮色｜skin 膚色｜eye 瞳色｜mouth 固定粉色｜null 不上色）｜none＝可以選「無」｜fixed＝衣服（只挑圖，不上色、不調大小位置）
const DOLL_PARTS={
  front:{tint:'hair',none:true},back:{tint:'hair',none:true},tie:{tint:'hair',none:true},   // 前髮｜後髮｜綁髮（在後髮再後面一層）
  sideR:{tint:'hair',none:true},sideL:{tint:'hair',none:true},ahoge:{tint:'hair',none:true},  // 鬢角右（疊在臉上）｜鬢角左（在臉後面）｜呆毛
  brow:{tint:'hair'},eye:{tint:'eye'},hl:{tint:null,none:true},mouth:{tint:'mouth'},          // 眉（跟髮色）｜眼｜眼睛光（白色，跟著眼睛移動縮放）｜口（張嘴的地方固定粉色）
  ear:{tint:'skin',none:true},top:{tint:null,fixed:true},pants:{tint:null,fixed:true}          // 耳（跟膚色）｜上衣｜褲子（上衣固定疊在褲子上面）
};
// 圖層（由下往上）
const DOLL_ORDER=['tie','back','sideL','body','ear','pants','top','sideR','eye','hl','mouth','front','brow','ahoge'];
const DOLL_FACE=['brow','eye','hl','mouth'];   // 表情可以換的部件
// 編輯器左邊（手機在預覽下面）的部件按鈕順序；skin＝膚色（不是圖）
const DOLL_PLIST=['front','back','tie','sideR','sideL','ahoge','brow','eye','hl','mouth','ear','skin','top','pants'];
const DOLL_EMOS=['joy','anger','sad','fun','shock'];   // 喜 怒 哀 樂 驚
const DOLL_SKINS=['#fbe7da','#f3d2bd','#e5b998','#c99572','#8d5b3d','#dfe6f0'];
const DOLL_HAIRS=['#2b2b33','#6b4a3a','#a8743f','#e8c46a','#e9e4dc','#c94a4a','#e58fb5','#5b7fd6','#4ea886','#8a63c9'];   // 髮色色票（也可以自己選）
const DOLL_EYES=['#3f7fd0','#6b4a3a','#2f9e6e','#d9a43a','#c94a4a','#8a63c9','#2b2b33'];
const DOLL_FIXED={mouth:'#f2a0aa'};
// 有自己顏色的眼睛（漫畫表現，v0.35.1）：預設用這個顏色；玩家可以改成「瞳色」（平常、每個表情各自選，存在部件的 c：'def' 預設色｜'eye' 瞳色）
const DOLL_EYE_DEF={eye_13:'#8fcdf0',eye_16:'#f39ab9',eye_17:'#e04a4a'};   // 13 淡藍｜16 粉色（愛心）｜17 紅色   // 不給玩家選、固定的顏色
const DOLL_LIM={d:12,smin:.8,smax:1.2};   // 移動 ±12、大小 80～120%
const DOLL_LIM_D={ahoge:18};               // 個別部件的移動上限（v0.35.3：呆毛 ±18，可以拿來補髮型缺的地方）
const dollD=k=>DOLL_LIM_D[k]||DOLL_LIM.d;
const DOLL_OUTLINE=3;                     // 白邊粗細（邏輯 px）
// 預設長相（第一次登記時）
const dollTf=()=>({x:0,y:0,s:1});
const dollDef=()=>({skin:DOLL_SKINS[0],hair:'#6b4a3a',eye:'#3f7fd0',top:'top_1',pants:'pants_1',
  parts:{front:{id:'front_3',...dollTf()},back:{id:'back_8',...dollTf()},tie:{id:'none',...dollTf()},sideR:{id:'none',...dollTf()},sideL:{id:'none',...dollTf()},ahoge:{id:'none',...dollTf()},
    brow:{id:'brow_1',...dollTf()},eye:{id:'eye_1',...dollTf(),c:'def'},hl:{id:'hl_1',...dollTf()},mouth:{id:'mouth_1',...dollTf()},ear:{id:'ear_1',...dollTf()}},
  emo:{joy:dollEmo('brow_1','eye_6','none','mouth_7'),anger:dollEmo('brow_4','eye_13','none','mouth_4'),sad:dollEmo('brow_1','eye_9','none','mouth_6'),
    fun:dollEmo('brow_1','eye_8','none','mouth_8'),shock:dollEmo('brow_1','eye_1','hl_1','mouth_10')}});
// 表情：mode＝face（換眉眼口）｜bubble（臉不變，頭上跳泡泡）；x／y／s 是 null＝跟平常一樣
function dollEmo(brow,eye,hl,mouth){const p=id=>({id,x:null,y:null,s:null});return {mode:'face',brow:p(brow),eye:{...p(eye),c:'def'},hl:p(hl),mouth:p(mouth)}}
// 存檔讀進來時檢查（匯入的檔案不可信）；不對的欄位用預設值
function dollNorm(o){
  if(!o||typeof o!=='object')return null;
  const D=dollDef(),col=(v,d)=>parseColor(String(v||''))||d,num=(v,a,b,r)=>Math.max(a,Math.min(b,Math.round((+v||0)*r)/r));
  const okId=(k,id)=>(DOLL_PARTS[k].none&&id==='none')||DOLL_LISTS[k].includes(id);
  const r={skin:col(o.skin,D.skin),hair:col(o.hair,D.hair),eye:col(o.eye,D.eye),
    top:DOLL_LISTS.top.includes(o.top)?o.top:D.top,pants:DOLL_LISTS.pants.includes(o.pants)?o.pants:D.pants,parts:{},emo:{}};
  const P=o.parts&&typeof o.parts==='object'?o.parts:{};
  for(const k in D.parts){const p=P[k]||{};r.parts[k]=okId(k,p.id)?{id:p.id,x:num(p.x,-dollD(k),dollD(k),1),y:num(p.y,-dollD(k),dollD(k),1),s:p.s==null?1:num(p.s,DOLL_LIM.smin,DOLL_LIM.smax,100),...(k==='eye'?{c:p.c==='eye'?'eye':'def'}:{})}:D.parts[k]}
  const E=o.emo&&typeof o.emo==='object'?o.emo:{};
  DOLL_EMOS.forEach(e=>{const x=E[e]&&typeof E[e]==='object'?E[e]:{},d=D.emo[e];
    r.emo[e]={mode:x.mode==='bubble'?'bubble':'face'};
    DOLL_FACE.forEach(k=>{const p=x[k]||{},n=(v,a,b,q)=>v==null?null:num(v,a,b,q);
      r.emo[e][k]=okId(k,p.id)?{id:p.id,x:n(p.x,-dollD(k),dollD(k),1),y:n(p.y,-dollD(k),dollD(k),1),s:n(p.s,DOLL_LIM.smin,DOLL_LIM.smax,100),...(k==='eye'?{c:p.c==='eye'?'eye':'def'}:{})}:d[k]})});
  return r;
}
