// ===== 異生會大樓（地圖「異生會大樓」，耗 1 行動）＋成就＋心等 =====
// 進大樓先到 1F 大廳（第一次有開場），右邊（手機在下面）是電梯按鈕：4F｜3F｜2F｜1F｜B1（電腦版：左 2F 1F B1、右 4F 3F）。同一趟可以逛所有樓層。
//   3F 後勤辦公室（瓊）：查看成就（領取積分、心、裝扮）、升級心等（心夠了要自己按）。第一次去有認識瓊的對話。
//   2F（賽倫絲，心等 2）：特殊委託（v0.26）｜B1（心等 3 只有紙條；心等 4 言曉君回來，可以戳；第一次見面後問要不要接緊急委託→長相登記 v0.35；委託本身 v0.4）｜4F、5F：還不能去。
// 成就：存檔時（codexSave）檢查，剛達成的在畫面最上方跳橫幅＋訊息區記一行（META.achSeen）；領取後記在 META.achGot。
// 資料 js/data/hall.js，文字 TEXT.hall／TEXT.ach。
let HALL_IMG=null;   // 這句專用的人物圖 {say,img}（js/data/lineimg.js；只在 HALL_SAY 還是那句時有效）
// 從清單挑一句，有專用圖就記下來
function hallKeyPick(arr,key){const i=Math.floor(Math.random()*arr.length),t=arr[i],im=lineImg(key+'['+i+']');HALL_IMG=im?{say:t,img:im}:null;return t}
let HALL_AT='lobby',HALL_SAY='',HALL_CHR=0,HALL_OFFERS=null,HALL_LAND=null,HALL_GIFT=0;
let HALL_VISIT=null,HALL_GONE=[];   // 1F 現在的訪客（LOBBY_NPC 的 id）｜這一趟已經跟著回自己樓層的人（不會再出現在 1F）

EVENTS.hallFirst={pages:()=>TEXT.hall.first,apply(){META.hallMet=true;codexSave()}};
EVENTS.silenceFirst={pages:()=>TEXT.special.first,apply(){META.silenceMet=true;codexSave()}};
EVENTS.xiaojunFirst={pages:()=>TEXT.hall.xiaojunFirst,apply(){META.xiaojunMet=true;codexSave()}};
EVENTS.joanFirst={pages:()=>TEXT.hall.joanFirst,apply(){META.joanMet=true;codexSave()}};
EVENTS.yanxiangFirst={pages:()=>TEXT.hall.yanxiangFirst,apply(){META.yanxiangMet=true;codexSave()}};   // v0.40.59：4F、5F（主線第一章完成後）
EVENTS.yanjieFirst={pages:()=>TEXT.hall.yanjieFirst,apply(){META.yanjieMet=true;codexSave()}};
EVENTS.yanxiangPt={pages:()=>TEXT.hall.yanxiangPt.map(p=>p.note?{...p,note:fmt(p.note,{n:HALL_RULE.yanxiangPt})}:p),apply(){if(META.yanxiangPt)return;META.yanxiangPt=true;META.points+=HALL_RULE.yanxiangPt;say(fmt(TEXT.hall.yanxiangPtLog,{n:HALL_RULE.yanxiangPt}),'ev');codexSave()}};   // 心等 5 第一次去 4F

// 從地圖出發
function hallGo(){
  S.ap--;
  if(!META.visited.includes('assoc'))META.visited.push('assoc');
  say(TEXT.hall.arrive,'ev');codexSave();refresh();
  HALL_AT='lobby';HALL_OFFERS=null;HALL_GIFT=0;HALL_VISIT=null;HALL_GONE=[];                    // 委託名單：這一趟第一次看時才產生
  if(!META.hallMet)runEvent('hallFirst',{cb:()=>hallOpen('lobby')});
  else hallOpen('lobby');
}
function hallOpen(f){
  $('hallTitle').textContent=TEXT.hall.title;$('hallLeave').textContent=TEXT.hall.leave;
  hallFloor(f||HALL_AT);
  $('ovHall').classList.add('show');
}
function hallClose(){$('ovHall').classList.remove('show');hallLandStop();if(S)refresh()}
const heartsNow=()=>ACH.filter(a=>META.achGot.includes(a.id)).reduce((n,a)=>n+a.heart,0);
const chOk=F=>!F.ch||(META.chDone||0)>=F.ch;   // 主線章節到了沒（4F／5F）
const floorOpen=f=>!HALL_FLOORS[f].lock&&chOk(HALL_FLOORS[f])&&(META.heartLv>=(HALL_FLOORS[f].need||1));
// 換樓層：決定這層的人說什麼、站誰
function hallFloor(f){
  const H=TEXT.hall,F=HALL_FLOORS[f];
  if(!floorOpen(f)){HALL_SAY=F.lock||!chOk(F)?H.topLock:(f==='f2'?H.silenceLock:H.b1Lock)+'\n（'+fmt(H.needLv,{n:F.need})+'）';hallDraw();return}
  const from=HALL_AT,met=HALL_VISIT,followed=from==='lobby'&&met&&LOBBY_NPC[met].home===f;   // 在 1F 遇到的人，按了他那一層
  HALL_AT=f;HALL_CHR=0;
  if(f==='f2'&&!META.silenceMet){$('ovHall').classList.remove('show');runEvent('silenceFirst',{cb:()=>{hallOpen('f2');specialOpen()}});return}
  const xjBack=f==='b1'&&META.heartLv>=(F.back||1);                     // 言曉君任務回來了沒
  if(xjBack&&!META.xiaojunMet){$('ovHall').classList.remove('show');runEvent('xiaojunFirst',{cb:()=>{HALL_AT='b1';urgentAsk()}});return}   // 見面完接著問緊急委託
  if(xjBack&&!META.urgentAsked){HALL_AT='b1';urgentAsk();return}                                                                     // 舊存檔：已經見過，第一次再來時問
  if(f==='f4'||f==='top'){                                              // 4F 言巷／5F 言街：第一次有見面；言巷在心等 5 第一次會給積分
    const evs=[];
    if(f==='f4'&&!META.yanxiangMet)evs.push('yanxiangFirst');
    if(f==='top'&&!META.yanjieMet)evs.push('yanjieFirst');
    if(f==='f4'&&META.heartLv>=5&&!META.yanxiangPt)evs.push('yanxiangPt');
    if(evs.length){$('ovHall').classList.remove('show');const nx=()=>{const e=evs.shift();if(e)runEvent(e,{cb:nx});else{HALL_SAY=R(f==='f4'?H.yanxiang:H.yanjie);hallOpen(f)}};nx();return}
  }
  if(f==='f3'&&!META.joanMet){$('ovHall').classList.remove('show');runEvent('joanFirst',{cb:()=>{HALL_SAY=R(H.joan);hallOpen('f3')}});return}
  if(f==='lobby'){HALL_VISIT=lobbyPick();HALL_CHR=HALL_VISIT?0:-1;HALL_SAY=!HALL_VISIT?R(H.lobby):HALL_VISIT==='grete'?hallKeyPick(H.lobbyGrete,'hall.lobbyGrete'):hallKeyPick(H.visit[HALL_VISIT],'hall.visit.'+HALL_VISIT)}
  else if(f==='f3')HALL_SAY=R(H.joan);
  else if(f==='f4')HALL_SAY=R(H.yanxiang);
  else if(f==='top')HALL_SAY=R(H.yanjie);
  else if(f==='f2')HALL_SAY=META.special?fmt(TEXT.special.reserved,{temp:TEXT.temper[META.special.temp].name}):R(TEXT.special.idle);
  else if(f==='b1'){if(xjBack)HALL_SAY=R(H.xiaojun);else{HALL_SAY=H.b1+'\n'+fmt(H.b1Back,{n:F.back});HALL_CHR=-1}}   // 還在任務中：只有紙條、不站人
  if(followed&&H.follow[met]){HALL_SAY=H.follow[met];HALL_GONE.push(met)}
  if(f!=='lobby')HALL_VISIT=null;
  hallDraw();hallLandRun();
}
// 1F 的訪客：認識的人裡照權重挑一位（這一趟已經跟你回樓層的除外）；沒挑到＝沒人
function lobbyPick(){
  if(Math.random()>=HALL_RULE.lobbyNpc)return null;
  const c=Object.keys(LOBBY_NPC).filter(k=>!HALL_GONE.includes(k)&&LOBBY_NPC[k].met());if(!c.length)return null;
  let r=Math.random()*c.reduce((n,k)=>n+LOBBY_NPC[k].w,0);for(const k of c){r-=LOBBY_NPC[k].w;if(r<0)return k}return c[c.length-1];
}
// 畫面裡站的是誰：1F 看訪客，其他樓層是樓層主人
const hallCast=()=>{const v=HALL_AT==='lobby'&&HALL_VISIT&&HALL_VISIT!=='grete'?LOBBY_NPC[HALL_VISIT]:null,F=HALL_FLOORS[HALL_AT];
  return v?{chr:v.chr,pokeAlt:v.pokeAlt,pokeIdx:v.pokeIdx,pokeKey:'hall.visitPoke.'+HALL_VISIT,hop:v.hop,poke:TEXT.hall.visitPoke[HALL_VISIT],who:TEXT.hall.visitName[HALL_VISIT],larva:v.home}
          :{chr:F.chr,pokeAlt:F.pokeAlt,pokeIdx:F.pokeIdx,pokeKey:'hall.poke.'+HALL_AT,hop:HALL_AT,poke:TEXT.hall.poke[HALL_AT],who:TEXT.hall.who[HALL_AT],larva:HALL_AT}};
// ---------- 背景裡爬的小球（0～1 隻，js/render/land.js）：有人站著時只在左邊爬，不會撞到人 ----------
// NPC 跳一下（高度照 NPC_HOP）
function npcHop(el,who){el.style.setProperty('--hop',-(NPC_HOP[who]||16)+'px');el.classList.remove('hop');void el.offsetWidth;el.classList.add('hop')}
function hallLandStop(){if(HALL_LAND){HALL_LAND.stop();HALL_LAND=null}const c=$('hallLand');c.getContext('2d').clearRect(0,0,c.width,c.height)}
function hallLandRun(){
  hallLandStop();if(Math.random()>=HALL_RULE.larva)return;
  const c=$('hallLand'),sc=HALL_RULE.larvaSc,alone=HALL_CHR<0;
  const known=META.returned.length&&Math.random()<HALL_RULE.known?R(META.returned):null;   // 交還過的小球回來逛逛
  HALL_LAND=landStart(c,{n:1,floor:c.height-36*sc-14,xmin:60,xmax:alone?c.width-60:380,sc,
    look:known?larvaLook(known.look||{day:1,hue:0,col:'#ffffff'}):larvaLook({day:HALL_RULE.strangerDay,hue:Math.floor(Math.random()*360),col:'#ffffff'})});
  HALL_LAND.known=known;HALL_LAND.hi=false;
}
// 有沒有戳到背景的小球（回傳畫布上的 x；沒戳到＝false）。和人物重疊時小球優先
const hallLarvaHit=e=>{if(!HALL_LAND)return false;const c=$('hallLand'),r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/r.width,y=(e.clientY-r.top)*c.height/r.height;
  const b=HALL_LAND.list[0],sc=HALL_RULE.larvaSc,by=c.height-36*sc-14-b.z;return Math.abs(b.x-x)<=60*sc&&Math.abs(by-y)<=70*sc?x:false};
$('hallLand').onclick=e=>{const x=hallLarvaHit(e);if(x!==false)hallLarvaTap(x)};
function hallLarvaTap(x){
  const b=HALL_LAND.list[0];
  const H=TEXT.hall,k0=HALL_LAND.known;
  if(k0&&!HALL_LAND.hi){                                                  // 交還過的小球：戳的第一下＝認出你、揮手
    HALL_LAND.hi=true;b.act='wave';b.until=performance.now()+2200;
    HALL_SAY=fmt((H.knownHiTemp&&H.knownHiTemp[k0.temp])||H.knownHi,{name:k0.name});$('hallTalk').textContent=HALL_SAY;return;
  }
  HALL_LAND.poke(x);
  if(HALL_GIFT<HALL_RULE.giftMax&&Math.random()<HALL_RULE.gift){         // 小球送你道具
    HALL_GIFT++;let k=R(HALL_RULE.gifts);if(k==='snack')k=R(GIFTS);S.inv[k]=(S.inv[k]||0)+1;seeItem(k);
    const C=hallCast(),got=fmt(H.larvaGot,{item:NAME[k]}),who=HALL_CHR>=0?H.larvaSay[C.larva]:'';
    HALL_SAY=got+(who?'\n'+who:'');{const im=who&&lineImg('hall.larvaSay.'+C.larva);HALL_IMG=im?{say:HALL_SAY,img:im}:null}say(got,'ev');codexSave();
    if(who)npcHop($('hallChr'),C.hop);
  }else HALL_SAY=R(H.larvaPoke);
  $('hallTalk').textContent=HALL_SAY;
}
function hallDraw(){
  const H=TEXT.hall,f=HALL_AT,F=HALL_FLOORS[f];
  $('hallBg').src=assetImg(F.bg);
  const C=hallCast(),ch=HALL_CHR<0?null:(HALL_IMG&&HALL_IMG.say===HALL_SAY&&HALL_IMG.img)||C.chr[HALL_CHR];$('hallChr').hidden=!ch;if(ch){const e=$('hallChr');e.style.maxHeight='';e.onload=()=>{e.style.maxHeight=e.naturalHeight+'px'};chrSet(e,ch)}   // 不放大超過原圖
  $('hallWho').textContent=C.who;$('hallWho').hidden=!ch;
  $('hallWhere').textContent=H.floors[f]+'｜'+H.floorName[f];
  $('hallTalk').textContent=HALL_SAY;
  // 電梯
  const L=$('hallLift');L.textContent='';
  HALL_ORDER.forEach(k=>{
    const o=floorOpen(k),Fk=HALL_FLOORS[k];
    L.append(h('button',{class:'lbtn'+(k===f?' on':'')+(o?'':' locked'),'data-f':k,disabled:!!Fk.lock||!chOk(Fk),title:Fk.lock||!chOk(Fk)?'':(o?H.floorName[k]:fmt(H.needLv,{n:Fk.need})),onclick:()=>hallFloor(k)},H.floors[k]));
  });
  // 這一層能做的事
  const A=$('hallActs');A.textContent='';
  if(f==='f3'){
    const n=achReady().length;
    A.append(h('button',{onclick:achOpen},H.btnAch+(n?`（${n}）`:'')),h('button',{onclick:heartUp},H.btnUp));
  }
  if(f==='f2')A.append(h('button',{onclick:specialOpen},TEXT.special.btnList));
  if(f==='b1'&&HALL_CHR>=0&&META.heartLv>=(F.back||1)){   // 言曉君在：登記過＝緊急委託（準備中）＋下面「更改登記」｜還沒＝「緊急委託」再問一次
    if(META.urgent&&META.doll)A.append(h('button',{onclick:urgentGo},H.btnUrgent),h('button',{onclick:urgentEdit},H.btnReg));
    else A.append(h('button',{onclick:urgentAsk},H.btnUrgentAsk));
  }
  while(A.children.length<2)A.append(h('button',{class:'hph',tabindex:-1,'aria-hidden':'true'},'—'));   // 按鈕位置固定兩格（框的大小不變）
  heartFoot($('hallHeart'));
}
// ---------- 緊急委託的登記（B1 言曉君，v0.35）----------
// 問要不要接：有 →「好，我幫你登記」→ 長相登記（紙娃娃，js/doll.js）；按確定才算登記好｜還在考慮 →「好，你考慮。」（之後按「緊急委託」可以再回答）
function urgentAsk(){
  const H=TEXT.hall,sc=chr=>({bg:'hall_b1',chr,name:H.who.b1});
  $('ovHall').classList.remove('show');
  const back=say_=>{hallOpen('b1');HALL_SAY=say_;HALL_CHR=0;hallDraw()};   // 回到 B1，言曉君說最後那句
  showEvent(H.urgentAsk,{scene:sc('xiaojun_L_0+acc'),opts:[{id:0,label:H.urgentYes},{id:1,label:H.urgentLater}],cb:k=>{
    META.urgentAsked=true;codexSave();
    if(k===1){showEvent(H.urgentLaterSay,{scene:sc('xiaojun_L_3+acc'),cb:()=>back(H.urgentLaterSay)});return}
    showEvent(H.urgentYesSay,{scene:sc('xiaojun_L_0+acc'),btn:H.urgentStart,cb:()=>dollOpen({done:ok=>{
      if(ok){META.urgent=true;codexSave();say(H.urgentLog,'ev');back(H.urgentDone)}
      else back(H.urgentCancel);
    }})});
  }});
}
// 進主線（v0.40.1）：正在照顧小球時，言曉君確認後由賽倫絲接手（這一輪不收錄）；第 0 日直接進
function urgentGo(){
  const H=TEXT.hall,sc=chr=>({bg:'hall_b1',chr,name:H.who.b1});
  $('ovHall').classList.remove('show');
  const go=()=>{if(S&&!PV){toIdle()}storyOpen()};
  if(!S||PV){go();return}
  showEvent(H.urgentGoAsk,{scene:sc('xiaojun_L_0+acc'),opts:[{id:0,label:H.urgentGoYes,main:true},{id:1,label:H.urgentGoNo}],cb:k=>{
    if(k===1){hallOpen('b1');return}
    showEvent(H.urgentHandover,{scene:sc('xiaojun_L_0+acc'),cb:go});
  }});
}
// 更改登記：直接打開長相登記
function urgentEdit(){dollOpen({done:ok=>{if(ok){HALL_SAY=TEXT.hall.regDone;HALL_CHR=0;hallDraw()}}})}
// 心等徽章（點亮到目前等級）＋心數
function heartFoot(box){
  const H=TEXT.hall,lv=META.heartLv;box.textContent='';
  const b=h('span',{class:'hbadges'});
  for(let i=1;i<=HEART_RULE.max;i++)b.append(h('img',{class:'hbadge'+(i<=lv?' on':''),src:assetImg('heart_badge'),alt:''}));
  const nx=HEART_RULE.need[lv+1];
  const nc=(HEART_RULE.ch||{})[lv+1],chNo=nc&&(META.chDone||0)<nc;   // 心等 5：還要主線第一章完成
  box.append(b,h('span',{},fmt(H.status,{lv,h:heartsNow()})),h('small',{class:'dim'},nx?fmt(chNo?H.nextCh:H.next,{n:lv+1,need:nx,ch:nc}):H.maxLv));
}
function heartUp(){
  const H=TEXT.hall,lv=META.heartLv,nx=HEART_RULE.need[lv+1];
  HALL_CHR=0;
  if(!nx){HALL_SAY=H.upMax;hallDraw();return}
  const nc=(HEART_RULE.ch||{})[lv+1];
  if(nc&&(META.chDone||0)<nc){HALL_SAY=H.upCh;hallDraw();return}
  if(heartsNow()<nx){HALL_SAY=H.upNo;hallDraw();return}
  META.heartLv=lv+1;codexSave();HALL_CHR=0;
  HALL_SAY=H.up[META.heartLv]||'';
  say(fmt(H.upLog,{n:META.heartLv})+((HEART_RULE.shop[META.heartLv]||0)>(HEART_RULE.shop[lv]||0)?H.upShop:''),'ev');
  toast(fmt(H.upLog,{n:META.heartLv}));
  hallDraw();
}

// ---------- 成就 ----------
const achDone=a=>{const [c,n]=a.prog();return c>=n};
const achReady=()=>ACH.filter(a=>achDone(a)&&!META.achGot.includes(a.id));
function achOpen(){
  $('achTitle').textContent=TEXT.ach.title;achDraw();$('ovAch').classList.add('show');
}
function achDraw(){
  const T=TEXT.ach,box=$('achBody');box.textContent='';
  const ready=achReady();
  $('achAll').textContent=T.claimAll;$('achAll').disabled=!ready.length;
  heartFoot($('achHead'));
  let last=null;
  ACH.forEach(a=>{
    if(a.cat!==last){if(last)box.append(h('hr',{class:'div'}));box.append(h('div',{class:'bagh'},T.cats[a.cat]));last=a.cat}
    const L=T.list[a.id],done=achDone(a),got=META.achGot.includes(a.id),[c,n]=a.prog();
    const name=done?L.name:T.hidden,cond=done||a.hide!=='all'?L.cond:T.hidden;
    const rw=fmt(T.reward,{h:a.heart,pt:achPts(a)})+(a.wear?fmt(T.rewardWear,{w:wearName(a.wear)}):'');
    const right=got?h('span',{class:'dim'},T.claimed):done?h('button',{class:'ib achget',onclick:()=>{achClaim(a);achDraw();hallDraw()}},T.claim)
      :h('span',{class:'dim'},a.hide==='all'?'':`${Math.min(c,n)}／${n}`);
    box.append(h('div',{class:'achrow'+(got?' got':done?' ready':'')},h('div',{class:'achtxt'},h('strong',{},name),h('div',{class:'dim'},cond),h('div',{class:'achrw'},rw)),right));
  });
}
function achClaim(a,quiet){
  if(META.achGot.includes(a.id)||!achDone(a))return;
  const T=TEXT.ach;
  META.achGot.push(a.id);META.points+=achPts(a);
  if(a.wear&&WEARS[a.wear]&&!META.wears.includes(a.wear)){META.wears.push(a.wear);say(fmt(T.gotWear,{w:wearName(a.wear)}),'ev')}
  say(fmt(T.got,{name:T.list[a.id].name,h:a.heart,pt:achPts(a)}),'ev');
  if(!quiet)codexSave();
}
function achClaimAll(){achReady().forEach(a=>achClaim(a,true));codexSave();achDraw();hallDraw()}

// 存檔後檢查：剛達成的跳橫幅（一次很多個就合併成一則）
let ACH_T=0;
function achSoon(){clearTimeout(ACH_T);ACH_T=setTimeout(achCheck,60)}
function achCheck(){
  if(typeof ACH==='undefined')return;
  const fresh=ACH.filter(a=>!META.achSeen.includes(a.id)&&achDone(a));
  if(!fresh.length)return;
  const T=TEXT.ach;
  fresh.forEach(a=>META.achSeen.push(a.id));
  saveRaw();                                     // 不用 codexSave：避免又觸發一次成就檢查
  if(fresh.length>2){achBanner(fmt(T.bannerMany,{n:fresh.length}));if(S)say(fmt(T.logMany,{n:fresh.length}),'ev');return}
  fresh.forEach(a=>{const nm_=T.list[a.id].name;achBanner(fmt(T.banner,{name:nm_}));if(S)say(fmt(T.log,{name:nm_}),'ev')});
}
// 畫面最上方滑下來的橫幅（排隊依序顯示）
const BANNER_Q=[];let bannerBusy=false;
function achBanner(t){BANNER_Q.push(t);if(!bannerBusy)bannerNext()}
function bannerNext(){
  const t=BANNER_Q.shift();if(!t){bannerBusy=false;return}
  bannerBusy=true;const el=$('achBanner');
  el.textContent='';el.append(h('img',{src:assetImg('heart_badge'),alt:''}),h('span',{},t));
  el.classList.add('show');
  setTimeout(()=>{el.classList.remove('show');setTimeout(bannerNext,450)},3200);
}

// 戳一下站在畫面裡的人：隨機一句（TEXT.hall.poke）
$('hallChr').onclick=e=>{const lx=hallLarvaHit(e);if(lx!==false){hallLarvaTap(lx);return}const C=hallCast(),L=C.poke;if(!L)return;const i=Math.floor(Math.random()*L.length);HALL_SAY=L[i];{const im=lineImg(C.pokeKey+'['+i+']');HALL_IMG=im?{say:HALL_SAY,img:im}:null}if(C.chr[1])HALL_CHR=C.pokeIdx&&C.pokeIdx[i]!=null?C.pokeIdx[i]:C.pokeAlt?(C.pokeAlt.includes(i)?1:0):HALL_CHR===0?1:0;hallDraw();
  npcHop($('hallChr'),C.hop)};   // 跳一下
$('hallClose').onclick=hallClose;$('hallLeave').onclick=hallClose;
$('achClose').onclick=()=>$('ovAch').classList.remove('show');
$('achAll').onclick=achClaimAll;
setTimeout(achCheck,800);   // 讀檔後：舊存檔已經達成的成就（合併成一則）

// ---------- 特殊委託（2F 賽倫絲）----------
function specialRoll(){
  const lv=Math.min(Math.max(...Object.keys(SPECIAL_RULE.count).map(Number)),META.heartLv),n=SPECIAL_RULE.count[lv]||2,od=SPECIAL_RULE.odds[lv]||SPECIAL_RULE.odds[2],T=TEXT.special;
  return Array.from({length:n},()=>{
    const r=Math.random(),k=r<od.none?0:r<od.none+od.one?1:2,tags=[];
    for(let i=0;i<k;i++){
      const pool=Object.keys(TAGS).filter(id=>!SPECIAL_RULE.noTag.includes(id)&&!TAGS[id].off&&!tags.includes(id)&&!TAG_CLASH.some(([a,b])=>(a===id&&tags.includes(b))||(b===id&&tags.includes(a))));
      if(!pool.length)break;let w=Math.random()*pool.reduce((s,id)=>s+TAGS[id].weight,0);tags.push(pool.find(id=>(w-=TAGS[id].weight)<0)||pool[pool.length-1]);
    }
    const temp=R(TEMPER_IDS),fit=[...tags.flatMap(t=>T.whyTag[t]||[]),...(T.whyTemp[temp]||[])];   // 有對應標籤或個性的說明文：比較常用
    const why=fmt(fit.length&&Math.random()<SPECIAL_RULE.tagWhy?R(fit):R(T.why),{who:R(T.who)});
    return {temp,tags,hue:Math.floor(Math.random()*360),why};
  });
}
const specialLocked=()=>!!META.special;          // 這一輪已經預約（下一輪開始時才清掉）
function specialOpen(){
  if(!HALL_OFFERS)HALL_OFFERS=specialRoll();
  $('spTitle').textContent=TEXT.special.title;specialDraw();$('ovSpecial').classList.add('show');
}
function specialDraw(){
  const T=TEXT.special,box=$('spBody');box.textContent='';
  $('spHint').textContent=specialLocked()?T.locked:T.hint;
  HALL_OFFERS.forEach((o,i)=>{
    const c=h('canvas',{width:96,height:96,class:'spthumb'});const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');g.fillStyle=gr;g.fillRect(0,0,96,96);
    drawLarva(g,48,44,0,0,'idle_a',larvaLook({day:3,hue:o.hue,col:'#ffffff'}),0,1,1);
    const mine=META.special&&META.special.why===o.why&&META.special.temp===o.temp;
    const btn=mine?h('span',{class:'achrw'},T.booked):h('button',{class:'ib main',disabled:specialLocked(),onclick:()=>specialBook(o)},T.book);
    // 和「小球們」同一種卡片：縮圖｜名字與說明｜按鈕
    box.append(h('div',{class:'lrow'+(mine?' on':'')},c,
      h('div',{class:'lmid'},h('div',{class:'nrow'},h('strong',{class:'nm'},tipSpan(o.temp))),h('div',{class:'dim'},T.tagHead+(o.tags.length?o.tags.map(t=>TEXT.tags[t].name).join('、'):T.noTag)),h('div',{class:'spwhy'},o.why)),
      h('div',{class:'lact'},btn)));
  });
}
function specialBook(o){
  if(specialLocked())return;
  META.special={...o,tags:[...o.tags],rnd:META.rounds};codexSave();
  const T=TEXT.special,tg=o.tags.length?'、'+o.tags.map(t=>TEXT.tags[t].name).join('、'):'';
  say(fmt(T.log,{temp:TEXT.temper[o.temp].name,tags:tg}),'ev');
  HALL_SAY=fmt(T.reserved,{temp:TEXT.temper[o.temp].name});HALL_CHR=1;
  specialDraw();hallDraw();
}
$('spClose').onclick=()=>$('ovSpecial').classList.remove('show');

