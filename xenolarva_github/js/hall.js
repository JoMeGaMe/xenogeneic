// ===== 異生會大樓（地圖「異生會大樓」，耗 1 行動）＋成就＋心等 =====
// 進大樓先到 1F 大廳（第一次有開場），右邊（手機在下面）是電梯按鈕：4F｜3F｜2F｜1F｜B1（電腦版：左 2F 1F B1、右 4F 3F）。同一趟可以逛所有樓層。
//   3F 後勤辦公室（瓊）：查看成就（領取積分、心、裝扮）、升級心等（心夠了要自己按）。第一次去有認識瓊的對話。
//   2F（賽倫絲，心等 2）：特殊委託（v0.26）｜B1（言曉君，心等 3）：緊急委託（之後）｜4F（言巷）：還不能去。
// 成就：存檔時（codexSave）檢查，剛達成的在畫面最上方跳橫幅＋訊息區記一行（META.achSeen）；領取後記在 META.achGot。
// 資料 js/data/hall.js，文字 TEXT.hall／TEXT.ach。
let HALL_AT='lobby',HALL_SAY='',HALL_CHR=0,HALL_OFFERS=null,HALL_LAND=null,HALL_GIFT=0;

EVENTS.hallFirst={pages:()=>TEXT.hall.first,apply(){META.hallMet=true;codexSave()}};
EVENTS.silenceFirst={pages:()=>TEXT.special.first,apply(){META.silenceMet=true;codexSave()}};
EVENTS.joanFirst={pages:()=>TEXT.hall.joanFirst,apply(){META.joanMet=true;codexSave()}};

// 從地圖出發
function hallGo(){
  S.ap--;
  if(!META.visited.includes('assoc'))META.visited.push('assoc');
  say(TEXT.hall.arrive,'ev');codexSave();refresh();
  HALL_AT='lobby';HALL_OFFERS=null;HALL_GIFT=0;                    // 委託名單：這一趟第一次看時才產生
  if(!META.hallMet)runEvent('hallFirst',{cb:()=>hallOpen('lobby')});
  else hallOpen('lobby');
}
function hallOpen(f){
  $('hallTitle').textContent=TEXT.hall.title;$('hallLeave').textContent=TEXT.hall.leave;
  hallFloor(f||HALL_AT);
  $('ovHall').classList.add('show');
}
function hallClose(){$('ovHall').classList.remove('show');hallLandStop();refresh()}
const heartsNow=()=>ACH.filter(a=>META.achGot.includes(a.id)).reduce((n,a)=>n+a.heart,0);
const floorOpen=f=>!HALL_FLOORS[f].lock&&(META.heartLv>=(HALL_FLOORS[f].need||1));
// 換樓層：決定這層的人說什麼、站誰
function hallFloor(f){
  const H=TEXT.hall,F=HALL_FLOORS[f];
  if(!floorOpen(f)){HALL_SAY=F.lock?H.topLock:(f==='f2'?H.silenceLock:H.b1Lock)+'\n（'+fmt(H.needLv,{n:F.need})+'）';hallDraw();return}
  HALL_AT=f;HALL_CHR=0;
  if(f==='f2'&&!META.silenceMet){$('ovHall').classList.remove('show');runEvent('silenceFirst',{cb:()=>{hallOpen('f2');specialOpen()}});return}
  if(f==='f3'&&!META.joanMet){$('ovHall').classList.remove('show');runEvent('joanFirst',{cb:()=>{HALL_SAY=R(H.joan);hallOpen('f3')}});return}
  if(f==='lobby'){const g=META.greteMet&&Math.random()<HALL_RULE.greteLobby;HALL_CHR=g?0:-1;HALL_SAY=R(g?H.lobbyGrete:H.lobby)}
  else if(f==='f3')HALL_SAY=R(H.joan);
  else if(f==='f2')HALL_SAY=META.special?fmt(TEXT.special.reserved,{temp:TEXT.temper[META.special.temp].name}):R(TEXT.special.idle);
  else if(f==='b1'){HALL_SAY=H.b1;HALL_CHR=-1}                      // 言曉君還在任務中：不站人
  hallDraw();hallLandRun();
}
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
    const got=fmt(H.larvaGot,{item:NAME[k]}),who=HALL_CHR>=0?H.larvaSay[HALL_AT]:'';
    HALL_SAY=got+(who?'\n'+who:'');say(got,'ev');codexSave();
    if(who)npcHop($('hallChr'),HALL_AT);
  }else HALL_SAY=R(H.larvaPoke);
  $('hallTalk').textContent=HALL_SAY;
}
function hallDraw(){
  const H=TEXT.hall,f=HALL_AT,F=HALL_FLOORS[f];
  $('hallBg').src=assetImg(F.bg);
  const ch=HALL_CHR>=0?F.chr[HALL_CHR]:null;$('hallChr').hidden=!ch;if(ch)$('hallChr').src=assetImg(ch);
  $('hallWho').textContent=H.who[f];$('hallWho').hidden=!ch;
  $('hallWhere').textContent=H.floors[f]+'｜'+H.floorName[f];
  $('hallTalk').textContent=HALL_SAY;
  // 電梯
  const L=$('hallLift');L.textContent='';
  HALL_ORDER.forEach(k=>{
    const o=floorOpen(k),Fk=HALL_FLOORS[k];
    L.append(h('button',{class:'lbtn'+(k===f?' on':'')+(o?'':' locked'),'data-f':k,disabled:!!Fk.lock,title:Fk.lock?'':(o?H.floorName[k]:fmt(H.needLv,{n:Fk.need})),onclick:()=>hallFloor(k)},H.floors[k]));
  });
  // 這一層能做的事
  const A=$('hallActs');A.textContent='';
  if(f==='f3'){
    const n=achReady().length;
    A.append(h('button',{onclick:achOpen},H.btnAch+(n?`（${n}）`:'')),h('button',{onclick:heartUp},H.btnUp));
  }
  if(f==='f2')A.append(h('button',{onclick:specialOpen},TEXT.special.btnList));
  if(f==='b1')A.append(h('button',{disabled:true},H.btnUrgent));
  while(A.children.length<2)A.append(h('button',{class:'hph',tabindex:-1,'aria-hidden':'true'},'—'));   // 按鈕位置固定兩格（框的大小不變）
  heartFoot($('hallHeart'));
}
// 心等徽章（點亮到目前等級）＋心數
function heartFoot(box){
  const H=TEXT.hall,lv=META.heartLv;box.textContent='';
  const b=h('span',{class:'hbadges'});
  for(let i=1;i<=HEART_RULE.max;i++)b.append(h('img',{class:'hbadge'+(i<=lv?' on':''),src:assetImg('heart_badge'),alt:''}));
  const nx=HEART_RULE.need[lv+1];
  box.append(b,h('span',{},fmt(H.status,{lv,h:heartsNow()})),h('small',{class:'dim'},nx?fmt(H.next,{n:lv+1,need:nx}):H.maxLv));
}
function heartUp(){
  const H=TEXT.hall,lv=META.heartLv,nx=HEART_RULE.need[lv+1];
  HALL_CHR=0;
  if(!nx){HALL_SAY=H.upMax;hallDraw();return}
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
$('hallChr').onclick=e=>{const lx=hallLarvaHit(e);if(lx!==false){hallLarvaTap(lx);return}const L=TEXT.hall.poke[HALL_AT];if(!L)return;const F=HALL_FLOORS[HALL_AT],i=Math.floor(Math.random()*L.length);HALL_SAY=L[i];if(F.chr[1])HALL_CHR=F.pokeAlt?(F.pokeAlt.includes(i)?1:0):HALL_CHR===0?1:0;hallDraw();
  npcHop($('hallChr'),HALL_AT)};   // 跳一下
$('hallClose').onclick=hallClose;$('hallLeave').onclick=hallClose;
$('achClose').onclick=()=>$('ovAch').classList.remove('show');
$('achAll').onclick=achClaimAll;
setTimeout(achCheck,800);   // 讀檔後：舊存檔已經達成的成就（合併成一則）

// ---------- 特殊委託（2F 賽倫絲）----------
function specialRoll(){
  const lv=Math.min(3,META.heartLv),n=SPECIAL_RULE.count[lv]||2,od=SPECIAL_RULE.odds[lv]||SPECIAL_RULE.odds[2],T=TEXT.special;
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

