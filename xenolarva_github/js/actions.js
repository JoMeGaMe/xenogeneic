// 玩家指令：換水、餵食（海草湯＋零食）、玩耍、出門、查看物品。要新增指令，在這裡加。
// ---------- 行動 ----------
function gain(n){return Math.round(n*(S.temp==='clingy'?1.3:S.temp==='shy'?0.8:1))}
const FOODS=['food',...GIFTS];   // 可餵的東西：海草湯 + 三種零食
function actWater(){
  S.inv.agent--;S.waterToday++;
  S.dirt=Math.max(5,S.dirt-60);S.ph+= (7-S.ph)*0.7;
  if(S.waterToday>1){S.life=clamp(S.life-6);emote('x');say('今天換太多次水了，幼體被嚇到，身體縮成一小球。','bad')}
  else{emote('drop');say('換上乾淨的水。水面晃了晃，幼體慢慢伸出觸肢。')}
  refresh();
}
// 餵食：海草湯是主食；零食飽食較少，但幼體有自己的喜惡（原本的送禮）
function actFeed(){
  pick('餵什麼？',FOODS.filter(k=>S.inv[k]>0).map(k=>({id:k,label:`${NAME[k]} ×${S.inv[k]}`})),k=>{
    S.inv[k]--;S.history.push('feed');
    const amt=k==='food'?35:15, full=S.sat>85;
    if(k===S.pref.dislike){emote('x');say(`幼體把${NAME[k]}推開，縮到缸的另一邊。`)}
    else if(full){S.life=clamp(S.life-(k==='food'?5:3));S.sat=clamp(S.sat+amt);emote('x');say('幼體已經吃飽了，硬塞進去後身體脹得圓圓的。','bad')}
    else if(k==='food'){S.sat=clamp(S.sat+amt);emote('star');say('幼體用觸肢把海草湯一點一點包進核心。')}
    else if(k===S.pref.gift){S.sat=clamp(S.sat+amt);S.trust=clamp(S.trust+gain(11));S.bond++;S.found.gift=true;emote('heart');
      say(`幼體整個身體亮了一下，用觸肢輕輕碰你的手。（${NAME[k]}好像很合牠的胃口）`,'ev')}
    else{S.sat=clamp(S.sat+amt);S.trust=clamp(S.trust+gain(4));emote('star');say(`幼體收下${NAME[k]}，慢慢吃掉了。`)}
    refresh();
  });
}
function actPlay(){
  pick('選一個玩具',TOYS.filter(t=>S.inv[t]>0).map(t=>({id:t,label:NAME[t]})),t=>{
    S.ap--;
    if(t===S.pref.toy){S.trust=clamp(S.trust+gain(9));S.bond++;S.found.toy=true;emote('heart');say(`幼體抱著${NAME[t]}不放，觸肢興奮地一起擺動。`,'ev')}
    else{S.trust=clamp(S.trust+gain(2));emote('q');say(`幼體碰了碰${NAME[t]}，看起來沒那麼感興趣。`)}
    if(S.temp==='curious')S.explore++;
    refresh();
  });
}
// 出門：帶回海草湯、換水劑、零食、玩具；有機會撿到背景裝飾和水質檢測儀（兩者都會永久保留）
function actOut(){
  S.ap--;S.outs++;S.explore++;
  const pool=['food','food','agent','agent','sweet','salty','bitter','bubble','bell','ball'];
  const got={};
  for(let i=0;i<3;i++){const k=R(pool);got[k]=(got[k]||0)+1}
  if(S.inv.kit<1&&(S.outs>=3||Math.random()<0.25)){got.kit=1}
  const txt=[];
  for(const k in got){
    if(k==='kit'||TOYS.includes(k)){
      if(S.inv[k]>0){got[k]=0;continue}
      S.inv[k]=1;txt.push(NAME[k]);
      if(k==='kit'){META.kit=true;codexSave()}
    }else{S.inv[k]+=got[k];txt.push(`${NAME[k]}×${got[k]}`)}
  }
  const free=Object.keys(DECOR).filter(k=>!META.decor.includes(k));
  let deco=null;
  if(free.length&&Math.random()<.35){deco=R(free);META.decor.push(deco);codexSave()}
  emote(txt.length||deco?'ex':'q');
  say(txt.length?`出門逛了一圈，帶回：${txt.join('、')}。`:'出門逛了一圈，空手而回。');
  if(got.kit)say('你得到了水質檢測儀！現在能看到精確的水質數值了，之後的周目也會一直帶著它。','ev');
  if(deco)say(`在外面發現了「${DECOR[deco].name}」，已經放進水缸當裝飾！（之後的周目也會保留）`,'ev');
  refresh();
}
function actBag(){
  const rows=Object.keys(NAME).filter(k=>S.inv[k]>0).map(k=>`${NAME[k]}${['kit','bubble','bell','ball'].includes(k)?'':' ×'+S.inv[k]}`);
  if(META.decor.length)rows.push('裝飾：'+META.decor.map(k=>DECOR[k].name).join('、'));
  pick('物品：'+(rows.join('、')||'空空如也'),[],()=>{});
}
