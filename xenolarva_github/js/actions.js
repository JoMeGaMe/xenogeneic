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
  const AW=ACT_RULE.water;
  S.dirt=Math.max(AW.min,S.dirt-AW.dirt);S.ph+=(7-S.ph)*AW.ph;
  if(S.waterToday>1){                           // 一天換超過一次：嚇到幼體
    S.life=clamp(S.life-AW.overLife);emote('x');say(TEXT.water.over,'bad');
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
  const AF=ACT_RULE.feed,amt=Math.round((k==='food'?AF.food:AF.snack)*(hasTag('smalleat')?AF.smalleatMul:1)),full=   // 不愛吃：每次吃得少
    S.sat>(glut?AF.fullGlutton:AF.full),v={item:NAME[k]};   // 貪吃鬼更容易吃撐、什麼零食都不推開
  if(k===S.pref.dislike&&!glut&&S.sat<=AF.dislikeSat){          // 不喜歡的零食：餓得受不了才勉強吃
    S.sat=clamp(S.sat+AF.dislikeAmt);emote('q');say(fmt(TEXT.feed.dislikeEat,v));
  }else if(k===S.pref.dislike&&!glut){               // 不喜歡的零食：推開（還是會消耗）
    emote('x');say(fmt(TEXT.feed.dislike,v));
  }else if(full){                              // 已經吃飽還硬塞：傷身體
    S.life=clamp(S.life-(k==='food'?AF.overFood:AF.overSnack));S.sat=clamp(S.sat+amt);
    emote('x');say(TEXT.feed.full,'bad');
  }else if(k==='food'){
    S.sat=clamp(S.sat+amt);emote('star');say(TEXT.feed.soup);
  }else if(k===S.pref.gift){                   // 喜歡的零食：信賴大增，並記進「喜好」欄
    S.sat=clamp(S.sat+amt);S.trust=clamp(S.trust+gain(AF.favTrust,true));S.bond++;S.found.gift=true;
    emote('heart');say(fmt(TEXT.temper[S.temp].feedFav||TEXT.feed.fav,v),'ev');
  }else{                                       // 普通零食
    S.sat=clamp(S.sat+amt);S.trust=clamp(S.trust+gain(AF.okTrust));
    emote('star');say(fmt(TEXT.feed.ok,v));
  }
  if(glut&&snack)discoverTag('glutton');
  if(hasTag('smalleat'))discoverTag('smalleat');
  tagReact('feed',v,before);
  refresh();
}

// ---------- 玩耍（耗 1 行動）----------
function actPlay(){
  const toys=[...TOYS.filter(t=>S.inv[t]>0),...META.tools.filter(t=>PLAY_TOOLS.includes(t))].map(t=>({id:t,label:NAME[t]}));   // 玩具＋永久道具（指揮棒）
  const opts=toys.length?[{head:TEXT.play.toyHead},...toys]:[];   // 聊天改成獨立的「聊天」鍵（js/chat.js 的 chatOpen）
  pick(TEXT.play.pick,opts,t=>{
    S.ap--;S.playedToday=true;
    const v={item:NAME[t]},before=[...S.tagsFound],pl=hasTag('playful');
    const AP=ACT_RULE.play,pgain=(n,f)=>hasTag('scholar')?Math.round(gain(n,f)*AP.scholarMul):gain(n,f);   // 學者：玩耍加的信賴只有一半
    if(t===S.pref.toy){
      S.trust=clamp(S.trust+pgain(AP.fav,true));S.bond++;S.found.toy=true;
      emote('heart');say(fmt(TEXT.temper[S.temp].playFav||TEXT.play.fav,v),'ev');
    }else if(pl){                                   // 貪玩：每種玩具都喜歡（信賴增加比最愛的少一點）
      S.trust=clamp(S.trust+pgain(AP.playful));emote('heart');
    }else{
      S.trust=clamp(S.trust+pgain(AP.meh));emote('q');say(fmt(TEXT.play.meh,v));
    }
    if(pl)discoverTag('playful');
    tagReact('play',v,before);
    if(TEMPERS[S.temp].explorer)S.explore++;     // 探索型個性：累積探索次數（結局用）
    refresh();
    if(META.playMode==='play')gameStart(t);      // 玩耍方式＝遊玩：在水缸裡真的玩一場（js/minigame.js）
  },toys.length?'':TEXT.play.noToy);
}

// ---------- 出門（耗 1 行動）----------
// 出門鍵：外出方式「隨機」＝從 RANDOM_PLACES 挑一個地點；「地圖」＝打開地圖自己選（js/places.js）
function goOut(){if(META.outMode==='map')mapOpen();else actOut(R(RANDOM_PLACES))}
// 依地點的權重擲一件戰利品的種類（js/data/places.js 的 loot）
function lootPick(w){
  let n=Math.random()*Object.values(w).reduce((a,b)=>a+b,0);
  for(const k in w){n-=w[k];if(n<0)return k==='snack'?R(GIFTS):k==='toy'?R(TOYS):k}
  return 'food';
}
// 在 place 帶回 OUT_ITEMS 件東西（海草湯、換水劑、零食、玩具）；有機會撿到「水質檢測儀」和「背景裝飾」，兩者都永久保留。
function actOut(place){
  place=PLACES[place]&&PLACES[place].loot?place:RANDOM_PLACES[0];
  S.ap--;S.outs++;S.explore++;
  if(!META.visited.includes(place))META.visited.push(place);   // 去過的地點（成就）
  const got={};
  for(let i=0;i<OUT_ITEMS;i++){const k=lootPick(PLACES[place].loot);got[k]=(got[k]||0)+1}
  if(S.inv.kit<1&&(S.outs>=ACT_RULE.out.kitSure||Math.random()<ACT_RULE.out.kitChance))got.kit=1;      // 水質檢測儀：第 3 次出門起必拿到，之前有 25% 機率

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
  if(free.length&&Math.random()<ACT_RULE.out.decor){deco=R(free);META.decor.push(deco)}   // 背景裝飾：35% 機率撿到沒有的一種
  codexSave();

  emote(list.length||deco?'ex':'q');
  const pn=TEXT.place[place].name;
  say(list.length?fmt(TEXT.out.back,{list:list.join('、'),place:pn}):fmt(TEXT.out.empty,{place:pn}));
  if(got.kit)say(TEXT.out.kit,'ev');
  if(deco)say(fmt(TEXT.out.deco,{deco:DECOR[deco].name}),'ev');
  // 遇見格蕾特：每次 20%，第 4 次出門起一定會遇見；遇見後永久解鎖「小助手」
  if(!META.grete&&(META.greteMet?Math.random()<GRETE_MEET.again:(S.outs>=GRETE_MEET.sure||Math.random()<GRETE_MEET.chance))){
    runEvent(META.greteMet?'greteAgain':'greteMeet');return;
  }
  // 認識格蕾特之後：遇到她閒聊，學會「聊天染色」；之後有機會再學「雙色」（小球至少成功染過一次）
  if(META.grete&&!META.chatColor&&Math.random()<CHAT_RULE.event){runEvent('colorTalk');return}
  if(META.grete&&META.chatColor&&!META.chatDual&&META.chatWins>0&&Math.random()<CHAT_RULE.event){runEvent('colorTalk2');return}
  refresh();
}

// ---------- 查看物品 ----------
// 物品欄：依分類列出（分類之間用橫線隔開）｜名稱 ×數量，右上 ✕ 關閉
function actBag(){
  const groups=ITEM_GROUPS.map(([label,ids])=>[label,ids.filter(id=>S.inv[id]>0).map(id=>[NAME[id],S.inv[id]])]);
  groups.push([TEXT.bag.decorHead,META.decor.map(id=>[DECOR[id].name,1])]);
  const box=$('bagBody');box.textContent='';
  const shown=groups.filter(g=>g[1].length);
  if(!shown.length)box.append(h('p',{class:'dim'},TEXT.bag.empty));
  shown.forEach(([label,rows],i)=>{                  // 裝扮改到「小球們 → 打扮」
    if(i)box.append(h('hr',{class:'div'}));
    box.append(h('div',{class:'bagh'},label),...rows.map(r=>h('div',{class:'bagrow'},h('span',{},r[0]),h('span',{class:'num'},'×'+r[1]))));
  });
  $('ovBag').classList.add('show');
}
