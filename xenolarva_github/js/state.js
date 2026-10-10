// 遊戲狀態 S 與「新周目建立」，以及把數值轉成文字（穩定、飢餓…）和觀察線索。
let S=null, selColor=COLORS[5];

// ---------- 新周目 ----------
function newGame(pname,name,col){
  const g=R(GIFTS);
  S={day:1,ap:2,life:90,sat:70,dirt:15,ph:7,trust:10,bond:0,explore:0,outs:0,
    pname,name,col,hue:Math.floor(Math.random()*360),colored:false,over:null,
    pref:{gift:g,dislike:R(GIFTS.filter(x=>x!==g)),toy:R(TOYS)},
    temp:R(['clingy','shy','curious']),
    inv:{food:3,agent:3,sweet:1,salty:0,bitter:0,bubble:1,bell:0,ball:0,kit:META.kit?1:0},
    waterToday:0,history:[],found:{gift:false,toy:false}};
  $('pname').textContent=pname;paintName($('pname'),col);$('cname').textContent=name;
  $('log').innerHTML='';
  say('幼體在水中輕輕晃動，透明的身體什麼也看不出來。',"sys");
  say('提示：每天有 2 次行動。換水與餵食不佔行動，但要小心別過度。','sys');
  refresh();
  GUESTS=[];syncGuests(false);
}
// ---------- 文字化狀態 ----------
const lifeW=()=>S.life>75?'穩定':S.life>50?'注意':S.life>25?'衰弱':'危險';
const satW=()=>S.sat>75?'飽足':S.sat>35?'正常':'飢餓';
const trustW=()=>S.trust>75?'依偎':S.trust>50?'親近':S.trust>25?'好奇':'警戒';
const waterBad=()=>S.dirt>60||Math.abs(S.ph-7)>1.2;
const waterSevere=()=>S.dirt>85||Math.abs(S.ph-7)>2;
function waterW(){
  if(S.inv.kit>0) return `污${Math.round(S.dirt)} pH${S.ph.toFixed(1)}`;
  return '未知';
}
function hints(){
  const h=[];
  if(S.dirt>60)h.push('水色混濁，幼體縮在缸底。');
  else if(S.dirt>35)h.push('水有點霧霧的。');
  if(S.ph-7>1.2)h.push('水面浮著細小泡沫，觸肢一直抖。');
  if(7-S.ph>1.2)h.push('水帶著酸味，幼體的觸肢捲了起來。');
  if(S.sat<=35)h.push('幼體繞著缸壁打轉，一直碰你放海草湯的地方。');
  if(S.life<=50)h.push('幼體活動力很低，慢慢往下沉。');
  return h;
}
