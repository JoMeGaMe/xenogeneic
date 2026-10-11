// ===== 遊戲狀態 S（唯一的一份）、新周目建立、把數值轉成文字 =====
let S=null, selColor=COLORS[5];

// ---------- 新周目 ----------
// 每個周目隨機生成：個性、喜歡的零食、不喜歡的零食、喜歡的玩具、核心顏色（hue）
function newGame(pname,name,col){
  const g=R(GIFTS);
  S={day:1,ap:2,life:90,sat:70,dirt:15,ph:7,trust:10,bond:0,explore:0,outs:0,
    pname,name,col,hue:Math.floor(Math.random()*360),colored:false,over:null,
    pref:{gift:g,dislike:R(GIFTS.filter(x=>x!==g)),toy:R(TOYS)},
    temp:R(TEMPER_IDS),
    inv:{food:3,agent:3,sweet:1,salty:0,bitter:0,bubble:1,bell:0,ball:0,kit:META.kit?1:0},   // 水質檢測儀跨周目繼承
    waterToday:0,history:[],found:{gift:false,toy:false},
    tags:rollTags(),tagsFound:[],                 // tags：擁有的特殊標籤（開局依機率分配）；tagsFound：已被發現的
    playedToday:false,noPlay:0,touchGain:0,grete:false,trans:false};      // 標籤用：今天有沒有玩、連續幾天沒玩、今天被戳加了幾次信賴
  tagsReset();
  Object.keys(S.inv).forEach(k=>{if(S.inv[k]>0)seeItem(k)});codexSave();   // 開局就有的物品也記進物品圖鑑

  // 重設幼體在水缸裡的狀態
  Object.assign(C,{lastFood:0,x:250,y:180,vx:1,vy:.15,tx:1,ty:0,rot:0,rv:0,next:0,calm:0,steering:false,home:pickHome()});
  M=null;pokes=[];

  $('pname').textContent=pname;paintName($('pname'),col);$('cname').textContent=name;
  $('log').innerHTML='';
  say(TEXT.start.born,'sys');
  say(TEXT.start.tip,'sys');
  refresh();
  GUESTS=[];syncGuests(false);                    // 勾選的圖鑑同伴會從邊緣飄進來
}

// ---------- 把數值轉成玩家看得懂的文字 ----------
const lifeW=()=>S.life>75?'穩定':S.life>50?'注意':S.life>25?'衰弱':'危險';
const satW=()=>S.sat>75?'飽足':S.sat>35?'正常':'飢餓';
const trustW=()=>S.trust>75?'依偎':S.trust>50?'親近':S.trust>25?'好奇':'警戒';
// 虛弱的小球對水質更挑剔（門檻比較低）
const waterBad=()=>hasTag('frail')?(S.dirt>50||Math.abs(S.ph-7)>1):(S.dirt>60||Math.abs(S.ph-7)>1.2);
const waterSevere=()=>hasTag('frail')?(S.dirt>75||Math.abs(S.ph-7)>1.6):(S.dirt>85||Math.abs(S.ph-7)>2);
// 水質：有檢測儀才顯示精確數值，沒有就顯示「未知」，要從行為線索判斷
function waterW(){
  if(S.inv.kit>0)return `污${Math.round(S.dirt)} pH${S.ph.toFixed(1)}`;
  return '未知';
}
// 沒有儀器時的觀察線索（每日結算時顯示）
function hints(){
  const h=[];
  if(S.dirt>60)h.push(TEXT.hint.dirty);
  else if(S.dirt>35)h.push(TEXT.hint.hazy);
  if(S.ph-7>1.2)h.push(TEXT.hint.base);
  if(7-S.ph>1.2)h.push(TEXT.hint.acid);
  if(S.sat<=35)h.push(TEXT.hint.hungry);
  if(S.life<=50)h.push(TEXT.hint.weak);
  return h;
}
