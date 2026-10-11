// ===== 特殊標籤：分配、揭曉、受影響的文字，以及需要特別行為的標籤（鑑賞家、人類愛好者）=====
// S.tags＝這隻小球擁有的標籤（開局時依機率分配），S.tagsFound＝玩家已經發現的。
// 效果一開始就生效，但專屬文字要等「發現」之後才會出現；發現的那一刻呼叫 discoverTag(id)。
const hasTag=id=>!!S&&S.tags.includes(id);
// 虛弱的徵兆：水質差或肚子餓（門檻比一般小球低）時，身體會變得更透明、動作更慢
const frailSym=()=>hasTag('frail')&&(S.sat<=50||S.dirt>45||Math.abs(S.ph-7)>.9);
// 目前顯示在水缸裡的裝飾 id
const visibleDecor=()=>Object.keys(DECOR).filter(id=>META.decor.includes(id)&&!META.hidden.includes(id));

// ---------- 分配 ----------
// 回歸者：消逝過幾隻，最多就出現幾隻（已經帶過回歸者標籤的要扣掉）
const lostCount=()=>CODEX.filter(e=>e.end==='END-07').length;
const homeLeft=()=>lostCount()-CODEX.filter(e=>e.own.includes('homereturn')).length;
function tagOK(id,have){
  const d=TAGS[id];
  if(d.off||have.includes(id))return false;
  if(TAG_CLASH.some(([a,b])=>(a===id&&have.includes(b))||(b===id&&have.includes(a))))return false;
  if(d.needsLost&&homeLeft()<=0)return false;
  return true;
}
function rollTags(){
  const r=Math.random(),n=r<TAG_ODDS.none?0:r<TAG_ODDS.none+TAG_ODDS.one?1:2;
  const have=[];
  for(let i=0;i<n;i++){
    const pool=Object.keys(TAGS).filter(id=>tagOK(id,have));
    if(!pool.length)break;
    let w=Math.random()*pool.reduce((s,id)=>s+TAGS[id].weight,0);
    have.push(pool.find(id=>(w-=TAGS[id].weight)<0)||pool[pool.length-1]);
  }
  return have;
}

// ---------- 揭曉 ----------
// 回傳 true＝這次才剛發現。訊息區先寫專屬的「被發現當下」文字，再寫標籤名稱，水缸上方跳提示框。
function discoverTag(id){
  if(!S||!has(TAGS,id)||!S.tags.includes(id)||S.tagsFound.includes(id))return false;
  S.tagsFound.push(id);
  const v={tag:TEXT.tags[id].name,desc:TEXT.tags[id].desc};
  if(TEXT.tags[id].found)say(TEXT.tags[id].found,'ev');
  say(fmt(TEXT.tag.found,v),'ev');       // 訊息區
  toast(fmt(TEXT.tag.toast,v));          // 水缸上方的提示框
  refresh();
  return true;
}
// 已經發現的標籤，在某個情境（feed／play／poke／day）會多說一句。
// ids＝要看的標籤（預設全部已發現的；呼叫前先複製一份，剛發現的那個就不會重複說）；chance＝出現機率
function tagReact(kind,v,ids,chance){
  (ids||S.tagsFound).forEach(id=>{
    let t=TEXT.tags[id][kind];
    if(kind==='day'&&TEXT.tags[id].dayNone&&!visibleDecor().length)t=TEXT.tags[id].dayNone;
    if(!t||(chance!=null&&Math.random()>chance))return;
    if(t.includes('{deco}')){
      const ds=visibleDecor();if(!ds.length)return;
      v=Object.assign({},v,{deco:DECOR[R(ds)].name});
    }
    say(fmt(t,v),'ev');
  });
}

// ---------- 鑑賞家：會去裝飾旁邊打轉 ----------
const JD={id:null,until:0,heart:false};
function judgeSteer(t){
  if(!hasTag('judge'))return null;
  const ids=visibleDecor();
  if(!ids.length){JD.id=null;return null}
  if(t>JD.until){
    if(JD.id){JD.id=null;JD.until=t+8000+Math.random()*7000}                 // 逛夠了，去別處
    else{JD.id=R(ids);JD.until=t+6000+Math.random()*3000;JD.heart=false;discoverTag('judge')}
  }
  if(!JD.id)return null;
  if(!ids.includes(JD.id)){JD.id=null;return null}
  const d=DECOR[JD.id],p={x:d.x+WORLD.dx,y:Math.min(300,d.y-30)};
  if(dist(C,p)<45){
    if(!JD.heart&&Math.random()<.02){JD.heart=true;emote('heart')}
    return [Math.sin(t/900)*.12,Math.cos(t/700)*.06];                       // 在裝飾旁輕輕打轉
  }
  return aim(C,p,1);
}

// ---------- 人類愛好者：偶爾停下來「看」你、追游標 ----------
const CUR={x:0,y:0,t:-1e9};               // 游標最後在水缸上的位置與時間（creature.js 更新）
const LV={on:false,until:0,next:0,heart:false};
function loveySteer(t){
  if(!hasTag('lovey'))return null;
  if(!LV.next)LV.next=t+8000;
  if(LV.on&&t>LV.until){LV.on=false;LV.next=t+9000+Math.random()*9000}
  if(!LV.on&&t>=LV.next){LV.on=true;LV.until=t+3500;LV.heart=false;discoverTag('lovey')}
  if(!LV.on)return null;
  if(t-CUR.t>6000)return [0,0];                                             // 沒有游標：只是停下來盯著你的方向
  if(dist(C,CUR)<50){if(!LV.heart){LV.heart=true;emote('heart')}return [0,0]}
  return aim(C,CUR,1.1);
}
function tagsReset(){JD.id=null;JD.until=0;LV.on=false;LV.next=0}
