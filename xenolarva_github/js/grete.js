// ===== 格蕾特小助手：出門遇見後永久解鎖 =====
// 開啟「小助手」之後：換水與餵食（基礎照顧）在換日之後（和剛開啟時）由她自動處理，畫面上的換水／餵食按鈕會收起來，
// 多出一個「翻譯」開關（開著時戳小球，有機會聽見心聲）。玩耍、出門、物品照舊。
// 東西不夠時會跳出提示、關掉小助手模式，讓玩家回到原本的按鈕自己處理。

// 跳出格蕾特的提示框（有頭像就顯示頭像）。cb＝按下「知道了」之後要做的事
function gretePrompt(text,cb){
  showEvent(text,{title:TEXT.misc.grete,img:GRETE_IMG,name:TEXT.misc.grete,cb});
}
function gretOff(){S.grete=false;S.trans=false;refresh()}

// 換日之後、以及剛開啟小助手時呼叫。東西不夠就跳提示並關掉小助手（不影響結束今天）
function greteDaily(){
  if(!S.grete)return true;
  const R_=GRETE_RULE,lack=[];
  // 1) 換水：水質下降了才換（今天玩家已經換過就不重複）
  const needWater=S.dirt>R_.waterDirt||Math.abs(S.ph-7)>R_.waterPh;
  if(needWater){
    if(S.inv.agent<1)lack.push(TEXT.grete.shortWater);
    else{say(TEXT.grete.water,'ev');const w=S.waterToday;S.waterToday=0;actWater();S.waterToday=w}   // 她換的不算玩家的次數（也不會因為玩家今天換過而被當成換太多次）
  }
  // 2) 餵食：先餵喜歡的零食 → 海草湯 →（真的很餓才）其他零食；不喜歡的零食不餵
  if(S.sat<R_.feedBelow){
    const others=GIFTS.filter(k=>k!==S.pref.gift&&k!==S.pref.dislike);
    const order=[S.pref.gift,'food',...others,S.pref.dislike];     // 不喜歡的零食是最後手段
    say(TEXT.grete.feed,'ev');
    let n=0;
    while(S.sat<R_.feedBelow&&n<R_.maxFeeds){
      const k=order.find(k=>S.inv[k]>0&&(k===S.pref.dislike?S.sat<=40:(!others.includes(k)||S.sat<R_.hungryBelow)));
      if(!k)break;
      if(k===S.pref.gift)S.found.gift=true;                 // 她餵的是最愛的零食，玩家也就知道了
      feedItem(k);n++;
    }
    if(S.sat<R_.feedBelow&&!order.some(k=>S.inv[k]>0))lack.push(TEXT.grete.shortFood);   // 還需要吃、但已經沒有東西可餵
  }
  if(lack.length){gretOff();gretePrompt(lack.join('\n'));return false}
  return true;
}

// 心聲：翻譯開著時戳小球。約 45% 什麼都沒在想（格蕾特說）；其餘是主腦（本體）與觸肢副腦的對話，不加格蕾特前綴。
// 學者、回歸者：第一次聽見心聲時揭曉（VOICE_FOUND 由 creature.js 的 poke 讀取）
let VOICE_FOUND=null;
function voiceLine(sub){
  if(Math.random()<.45)return TEXT.grete.nothing;
  // sub＝說話的是誰（預覽模式戳其他小球時用）；沒給就是玩家養的這隻
  const w=sub||{temp:S.temp,tags:S.tags,found:S.tagsFound,sat:S.sat,dirt:S.dirt,life:S.life,trust:S.trust,self:C};
  const V=TEXT.voice,v={},r=Math.random();
  const first=!sub&&['scholar','homereturn'].find(id=>w.tags.includes(id)&&!w.found.includes(id));
  if(first){VOICE_FOUND=first;return R(V.tag[first]).map(([a,t])=>a+'：'+t).join('\n')}
  const others=[...(PV?[]:[C]),...GUESTS].filter(b=>b!==w.self&&isLive(b));      // 水缸裡其他的小球
  let pool=null;
  if(others.length&&r<.3){
    const b=R(others);v.g=nm(b===C?S.name:b.name);pool=V.guest[b===C?S.temp:b.e.temp];
  }
  if(!pool){
    const st=[];
    if(w.sat<=35)st.push(V.hungry);else if(w.sat>=75)st.push(V.full);
    if(w.dirt>60)st.push(V.dirty);
    if(w.life<40)st.push(V.weak);
    if(w.trust>75)st.push(V.love);
    if(st.length&&r<.65)pool=R(st);
  }
  if(!pool&&r<.78)pool=V.notice;
  if(!pool){
    const tg=w.tags.filter(id=>has(V.tag,id));
    if(tg.length&&Math.random()<.35)pool=V.tag[R(tg)];
    else if(w.temp==='sleepy'&&Math.random()<.4)pool=V.stone;
    else pool=V.temper[w.temp];
  }
  return R(pool).map(([a,t])=>a+'：'+fmt(t,v)).join('\n');
}
