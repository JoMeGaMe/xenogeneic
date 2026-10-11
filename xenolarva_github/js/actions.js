// ===== 玩家指令：換水、餵食（海草湯＋零食）、玩耍、出門、查看物品 =====
// 要新增指令：在這裡寫一個 actXxx 函式，在 index.html 加按鈕，在 js/main.js 綁定，文字放進 js/data/texts.js。
// 慣例：先扣庫存／行動次數 → 改狀態 → 表情氣泡 emote() → 訊息 say() → refresh() 重畫面板。

// 信賴增加量：基本值 n × 個性倍率；碰到「喜歡的東西」時（fav＝true）再乘上個性的 favGain（頑固特別高）
function gain(n,fav){
  const T=TEMPERS[S.temp];
  return Math.round(n*T.trustGain*(fav?T.favGain:1));
}
const FOODS=['food',...GIFTS];                 // 可以餵的東西：海草湯 ＋ 三種零食
const itemLabel=k=>`${NAME[k]} ×${S.inv[k]}`;

// ---------- 換水 ----------
function actWater(){
  S.inv.agent--;S.waterToday++;
  S.dirt=Math.max(5,S.dirt-60);S.ph+=(7-S.ph)*0.7;
  if(S.waterToday>1){                           // 一天換超過一次：嚇到幼體
    S.life=clamp(S.life-6);emote('x');say(TEXT.water.over,'bad');
  }else{emote('drop');say(TEXT.water.ok)}
  refresh();
}

// ---------- 餵食 ----------
// 海草湯是主食（飽食 +35）；零食飽食較少（+15），但幼體對零食有自己的喜惡
function actFeed(){
  const have=FOODS.filter(k=>S.inv[k]>0);
  const opts=[];
  if(have.includes('food'))opts.push({head:TEXT.feed.headMain},{id:'food',label:itemLabel('food')});      // 主食：飽足 +35
  if(have.some(k=>k!=='food'))opts.push({head:TEXT.feed.headSnack},...have.filter(k=>k!=='food').map(k=>({id:k,label:itemLabel(k)})));   // 零食：飽足 +15
  pick(TEXT.feed.pick,opts,feedItem);
}
// 餵一份東西（玩家自己餵和格蕾特餵都走這裡）
function feedItem(k){
  S.inv[k]--;S.history.push('feed');
  const glut=hasTag('glutton'),snack=GIFTS.includes(k),before=S.tagsFound.filter(id=>snack||id!=='glutton');
  const amt=k==='food'?35:15,full=S.sat>(glut?70:85),v={item:NAME[k]};   // 貪吃鬼更容易吃撐、什麼零食都不推開
  if(k===S.pref.dislike&&!glut&&S.sat<=40){          // 不喜歡的零食：餓得受不了才勉強吃
    S.sat=clamp(S.sat+10);emote('q');say(fmt(TEXT.feed.dislikeEat,v));
  }else if(k===S.pref.dislike&&!glut){               // 不喜歡的零食：推開（還是會消耗）
    emote('x');say(fmt(TEXT.feed.dislike,v));
  }else if(full){                              // 已經吃飽還硬塞：傷身體
    S.life=clamp(S.life-(k==='food'?5:3));S.sat=clamp(S.sat+amt);
    emote('x');say(TEXT.feed.full,'bad');
  }else if(k==='food'){
    S.sat=clamp(S.sat+amt);emote('star');say(TEXT.feed.soup);
  }else if(k===S.pref.gift){                   // 喜歡的零食：信賴大增，並記進「喜好」欄
    S.sat=clamp(S.sat+amt);S.trust=clamp(S.trust+gain(11,true));S.bond++;S.found.gift=true;
    emote('heart');say(fmt(TEXT.temper[S.temp].feedFav||TEXT.feed.fav,v),'ev');
  }else{                                       // 普通零食
    S.sat=clamp(S.sat+amt);S.trust=clamp(S.trust+gain(4));
    emote('star');say(fmt(TEXT.feed.ok,v));
  }
  if(glut&&snack)discoverTag('glutton');
  tagReact('feed',v,before);
  refresh();
}

// ---------- 玩耍（耗 1 行動）----------
function actPlay(){
  pick(TEXT.play.pick,TOYS.filter(t=>S.inv[t]>0).map(t=>({id:t,label:NAME[t]})),t=>{
    S.ap--;S.playedToday=true;
    const v={item:NAME[t]},before=[...S.tagsFound],pl=hasTag('playful');
    if(t===S.pref.toy){
      S.trust=clamp(S.trust+gain(9,true));S.bond++;S.found.toy=true;
      emote('heart');say(fmt(TEXT.temper[S.temp].playFav||TEXT.play.fav,v),'ev');
    }else if(pl){                                   // 貪玩：每種玩具都喜歡（信賴增加比最愛的少一點）
      S.trust=clamp(S.trust+gain(6));emote('heart');
    }else{
      S.trust=clamp(S.trust+gain(2));emote('q');say(fmt(TEXT.play.meh,v));
    }
    if(pl)discoverTag('playful');
    tagReact('play',v,before);
    if(TEMPERS[S.temp].explorer)S.explore++;     // 探索型個性：累積探索次數（結局用）
    refresh();
  });
}

// ---------- 出門（耗 1 行動）----------
// 帶回 3 件東西（海草湯、換水劑、零食、玩具）；有機會撿到「水質檢測儀」和「背景裝飾」，兩者都永久保留。
const LOOT_POOL=['food','food','agent','agent','sweet','salty','bitter','bubble','bell','ball'];
function actOut(){
  S.ap--;S.outs++;S.explore++;
  const got={};
  for(let i=0;i<3;i++){const k=R(LOOT_POOL);got[k]=(got[k]||0)+1}
  if(S.inv.kit<1&&(S.outs>=3||Math.random()<0.25))got.kit=1;      // 水質檢測儀：第 3 次出門起必拿到，之前有 25% 機率

  const list=[];
  for(const k in got){
    if(k==='kit'||TOYS.includes(k)){            // 工具與玩具只會有一份，有了就不重複給
      if(S.inv[k]>0){got[k]=0;continue}
      S.inv[k]=1;list.push(NAME[k]);
      if(k==='kit'){META.kit=true}
    }else{S.inv[k]+=got[k];list.push(`${NAME[k]}×${got[k]}`)}
    seeItem(k);                                  // 記進物品圖鑑
  }
  const free=Object.keys(DECOR).filter(k=>!META.decor.includes(k));
  let deco=null;
  if(free.length&&Math.random()<.35){deco=R(free);META.decor.push(deco)}   // 背景裝飾：35% 機率撿到沒有的一種
  codexSave();

  emote(list.length||deco?'ex':'q');
  say(list.length?fmt(TEXT.out.back,{list:list.join('、')}):TEXT.out.empty);
  if(got.kit)say(TEXT.out.kit,'ev');
  if(deco)say(fmt(TEXT.out.deco,{deco:DECOR[deco].name}),'ev');
  // 遇見格蕾特：每次 20%，第 4 次出門起一定會遇見；遇見後永久解鎖「小助手」
  if(!META.grete&&(META.greteMet?Math.random()<GRETE_MEET.again:(S.outs>=GRETE_MEET.sure||Math.random()<GRETE_MEET.chance))){
    runEvent(META.greteMet?'greteAgain':'greteMeet');return;
  }
  refresh();
}

// ---------- 查看物品 ----------
// 物品欄：分類｜名稱｜數量 的列表（不分頁），右上 ✕ 關閉
function actBag(){
  const rows=[];
  ITEM_GROUPS.forEach(([label,ids])=>ids.forEach(id=>{if(S.inv[id]>0)rows.push([label,NAME[id],S.inv[id]])}));
  META.decor.forEach(id=>rows.push(['裝飾',DECOR[id].name,1]));
  const box=$('bagBody');box.textContent='';
  if(!rows.length)box.append(h('p',{class:'dim'},TEXT.bag.empty));
  else box.append(h('table',{class:'ctab'},
    h('thead',{},h('tr',{},h('th',{},'分類'),h('th',{},'名稱'),h('th',{class:'num'},'數量'))),
    h('tbody',{},...rows.map(r=>h('tr',{},h('td',{},r[0]),h('td',{},r[1]),h('td',{class:'num'},'×'+r[2]))))));
  $('ovBag').classList.add('show');
}
