// ===== 主線 week.js：行程（排行程的規則）＋執行這週（一天的結果 stRoll、一天一天播 stStep、當天的劇情、週結算、章末） =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// ---------- 行程 ----------
const stCmdName=id=>stT().cmd[id];
// 固定日（換藥水）：自由模式不固定（不預先排進去，當普通指令；v0.40.64）
const stFixed=c=>STY.freeMode?null:c.fixed;
function stFixedFill(){const a=Array(7).fill('');for(const id in STORY_CMDS){const f=stFixed(STORY_CMDS[id]);if(f)f.forEach(d=>a[d]=id)}return a}
const stMedN=()=>SUI.sched.filter(x=>x==='med').length;
// ---------- 指令能不能做（v0.40.37 統整：所有「顯示／隱藏／變灰」都在這張表）----------
// 兩個地方會列出指令：plan＝行程表、free＝自由行動（地點卡、大樓）。
// 每一條規則：in＝在哪裡檢查（both／plan／free）、hide＝符合就不列出來、off＝符合就列出來但變灰（回傳要寫的原因）。
// 照順序檢查，第一條符合的就決定。新的條件＝這張表加一行；特例寫成 STORY_CMDS 的欄位（例 need、kick），畫面程式不另外判斷。
// v0.40.44：自由行動改成點了直接做（js/story/free.js），這張表主要給行程表用；打工不用先去過，數值到了就出現
const stOpen=o=>!o.open||(STY.open||[]).includes(o.open);   // 劇情開放後才出現（v0.40.23；地圖名牌、大樓樓層也用）
const stHas=k=>!!((STY.items||{})[k]||(STRUN&&STRUN.res.some(x=>x&&(x.buys||[]).includes(k))));   // 買到的東西（這週前面買的也算）
const stDid=id=>STY.seen.includes(id)||!!(STRUN&&STRUN.res.some(x=>x&&x.id===id));   // 做過這件事（這週前面也算；4F 去過一次就鎖）
const stCur=()=>STRUN?STRUN.end:STY.st;   // 現在的數值：週中途（回家改行程、看狀態）用這週目前的
const ST_GATES=[
  {k:'open',    in:'both', hide:c=>!stOpen(c)},                            // 劇情還沒開放（開放:異生會4F）
  {k:'book',    in:'both', hide:c=>c.book&&!stHas(c.book)},                // 讀書：要先買那本書
  {k:'freeOnly',in:'plan', hide:c=>c.freeOnly},                            // 只在自由行動發生（逛道具店、白跑一趟）
  {k:'need',    in:'plan', hide:(c,id,st)=>c.need&&Object.keys(c.need).some(k=>st[k]<c.need[k])},   // 數值門檻：沒到不顯示，到了直接出現（v0.40.44）
  {k:'money',   in:'both', off:(c,id,st)=>c.eff.money<0&&st.money<-c.eff.money&&fmt(stT().poor,{n:-c.eff.money})}   // 錢不夠
];
// where：plan｜free。回傳 {hide, off（變灰的原因，''＝可以做）}。週中途用這週目前的數值
function stGate(id,where){const c=STORY_CMDS[id],st=stCur();
  for(const g of ST_GATES){if(g.in!=='both'&&g.in!==where)continue;
    if(g.hide&&g.hide(c,id,st))return {hide:true,off:''};
    const o=g.off&&g.off(c,id,st);if(o)return {hide:false,off:o};}
  return {hide:false,off:''};}
const stShown=(id,where='free')=>!stGate(id,where).hide;
const stOff=(id,free)=>stGate(id,free?'free':'plan').off;
// 指令下面那行：效果的上下箭頭（好的綠、壞的紅）＋備註
function stEffHTML(id){const c=STORY_CMDS[id],T=stT(),e=c.eff,parts=[];
  for(const k in e){if(k==='rnd'){parts.push(`<i>${esc(T.rnd)}</i>`);continue}if(k==='money')continue;
    const v=e[k],cost=k==='fat'||k==='tired',good=cost?v<0:v>0,ar=Math.abs(v)>=20?(v>0?'↑↑':'↓↓'):(v>0?'↑':'↓');
    parts.push(`<${good?'i':'u'}>${esc(T.S[k])}${ar}</${good?'i':'u'}>`);}
  if(c.hurt&&(STRUN?STRUN.end.meds:STY.meds)<c.hurt.n)parts.push(`<u>${esc(T.S.calm)}↓</u>`);   // 換藥水：前三次會痛（第四次以後不寫）
  if(c.cat==='care'&&!e.tired)parts.push(`<u>${esc(T.S.tired)}↑</u>`);
  const note=T.note[id];return parts.join(' ')+(note?'　'+esc(note):'')+(c.min?'　'+esc(fmt(T.minNote,{n:c.min})):'')+(c.cap?Object.keys(c.cap).map(k=>esc(fmt(T.capNote,{stat:T.S[k],n:c.cap[k]}))).join(''):'');}

// ---------- 一天的結果（規則照「後續規劃（v0.4）」）----------
function stRoll(st,id,forced){
  const c=STORY_CMDS[id],R_=STORY_RULE,care=c.cat==='care';
  let r='ok';
  if(care){const ok=st.tired<100&&Math.random()<.5+st.mood/200;r=ok?(Math.random()<R_.crit?'great':'ok'):(Math.random()<R_.fumble?'bad':'fail')}
  else if(c.cat==='job'){const q=Math.random();r=q<R_.jobGreat?'great':q<R_.jobGreat+R_.jobBad?'bad':'ok'}   // 打工：固定機率
  let e={...c.eff};
  const first=!STY.seen.includes(id)&&!(STRUN&&STRUN.res.some(x=>x&&x.id===id));   // 第一次做（這週前面的日子也算）
  const kick=(c.kickFirst&&first)||(c.kick&&Object.keys(c.kick).some(k=>st[k]<c.kick[k]));if(kick){e={...c.kickEff};r='fail'}   // 數值不夠：被趕出來（還是會遇到人）
  if(c.scared&&st.calm<0)e={...e,...c.scared};
  if(c.hurt&&st.meds<c.hurt.n)e.calm=(e.calm||0)+c.hurt.calm;
  if(e.rnd){delete e.rnd;e[R(['str','soc','know'])]=1}
  const vary=v=>Math.round(v*(1+(Math.random()*2-1)*R_.vary));
  const d={};
  for(const k in e){let v=e[k];if(k!=='money'&&Math.abs(v)>2)v=vary(v);
    if(care){const cost=k==='tired'||k==='fat';
      v=Math.round(v*(cost?{ok:1,great:k==='tired'?0:1,fail:1.5,bad:2}[r]:v>0?{ok:1,great:2,fail:.5,bad:0}[r]:{ok:1,great:1,fail:1.5,bad:2}[r]));}
    else if(r!=='ok'&&R_.jobMul[r]&&k!=='money'&&v>0){const cost=k==='tired'||k==='fat';v=Math.round(v*R_.jobMul[r][cost?'cost':'gain'])}   // 打工的大成功／大失敗
    d[k]=v;}
  if(!care)d.tired=(d.tired||0)+R_.rest;
  if(STY.freeMode)for(const k in d)if(!ST_FREE_KEYS.includes(k))delete d[k];   // 自由模式：只有錢、疲勞、疲倦會變（v0.40.62）
  const before={...st};
  for(const k in d)st[k]+=d[k];
  if(c.cap)for(const k in c.cap)if(k in d)st[k]=Math.min(st[k],Math.max(before[k],c.cap[k]));   // 讀書最多讀到 cap
  if(!STY.freeMode){st.mood+=care?(r==='ok'||r==='great'?R_.moodOk:R_.moodFail):R_.moodRest;
  if(st.tired>=R_.moodTiredAt)st.mood+=R_.moodTired;}
  st.hp=clamp(st.hp);st.calm=clamp(st.calm,-100,100);st.mood=clamp(st.mood);st.tired=clamp(st.tired);st.fat=clamp(st.fat);
  ['str','soc','know'].forEach(k=>st[k]=clamp(st[k],0,999));   // 錢不夾：可以是負的（v0.40.47 負債；花錢的事錢不夠本來就做不了）
  for(const k in d)d[k]=st[k]-before[k];
  if(id==='med')st.meds++;
  const sm=c.small||(care?STORY_HOME.tank:STORY_HOME.day),small=Array.isArray(sm)?R(sm):sm;
  const day=STRUN?STRUN.i:0,lim=o=>!o||((o.w==null||o.w===STY.week)&&(!o.d||o.d.includes(day)));
  const encs=(c.enc||[]).filter(([,p,o])=>lim(o)&&Math.random()<p).map(([n])=>n);const enc=encs[0]||null;
  return {id,r,before,d,small,big:c.big||STORY_HOME.day,enc,forced,kick,stg:stStageRoll(c,r,enc)};
}
// 小動畫要演什麼（算結果時先決定好，畫面重畫時不會變）：規則在 js/story/data/story.js 的 STORY_STAGE＋指令的 stage
const stStage=c=>{const s=c.stage||{},o={...STORY_STAGE,...s};o.npc={...STORY_STAGE.npc};for(const k in s.npc||{})o.npc[k]={...STORY_STAGE.npc[k],...s.npc[k]};o.me={...STORY_STAGE.me,...(s.me||{})};o.pass={...STORY_STAGE.pass,...(s.pass||{})};return o};
function stLarvaCol(){const h=Math.random()*360,c=(s,l)=>{const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return [f(0),f(8),f(4)].join(',')};return c(.55,.82)+'|'+c(.8,.6)}   // 身體（淡）｜核心（亮）
// 一種行動模式的路人小球（tgt＝在誰旁邊／頭上：me 玩家｜npc 遇到的人）
function stPassMake(m,hasNpc){const L=()=>stLarvaCol(),rn=(a,b)=>Math.round(a+Math.random()*(b-a)),tgt=hasNpc&&Math.random()<.5?'npc':'me',dl=rn(0,900);
  if(m==='run')return [{m,look:L(),pose:R(['idle_a','open_a']),y:rn(6,16),rev:Math.random()<.5,dur:Math.random()<.5?1600:5200,dl:rn(0,4000)}];
  if(m==='follow')return [{m,look:L(),pose:'idle_a',tgt,dl}];
  if(m==='nest')return [{m,look:L(),pose:R(['rest','curl']),tgt,dl}];
  if(m==='head')return [{m,look:L(),pose:R(['idle_a','rest','curl']),tgt,dl}];
  if(m==='big')return [{m,look:L(),pose:R(['rest','idle_a']),side:Math.random()<.5?'L':'R',dl}];
  const x=rn(28,58),y=rn(2,12);return [{m:'pair',look:L(),pose:'idle_a',x,y,i:0,dl:0},{m:'pair',look:L(),pose:'open_a',x:x+7,y,i:1,dl:0}];}
function stStageRoll(c,r,enc){const S=stStage(c),o={};
  const n=S.npc[r];if(enc&&n&&(n.p==null||Math.random()<n.p))o.npc={face:n.face,hop:!!n.hop};
  if(S.me[r]!=null)o.me=S.me[r];
  const hasNpc=!!(enc&&stNpcImg(enc));
  if(c.at!=='home'){   // 路人小球：先決定這次有幾種行動模式（0～2），再照權重挑不重複的模式
    let q=Math.random(),k=0;for(;k<S.pass.n.length-1&&q>=S.pass.n[k];k++)q-=S.pass.n[k];
    const pool=Object.keys(S.pass.modes).filter(m=>S.pass.modes[m]>0);o.pass=[];
    for(let i=0;i<k&&pool.length;i++){let t=Math.random()*pool.reduce((a,m)=>a+S.pass.modes[m],0),j=0;for(;j<pool.length-1&&t>=S.pass.modes[pool[j]];j++)t-=S.pass.modes[pool[j]];
      o.pass.push(...stPassMake(pool.splice(j,1)[0],hasNpc))}}
  else if(S.visit.p&&typeof CODEX!=='undefined'&&Math.random()<S.visit.p){   // 在家：日常模式的小球來陪你
    const al=CODEX.filter(e=>e.end!=='END-07');if(al.length){const e=R(al);o.visit={cid:e.id,name:e.name,pose:c.act==='sleep'?'rest':R(['idle_a','open_a']),m:c.act==='sleep'?'sleep':c.cat==='care'?'watch':'roam',spot:Math.random()<.5?'head':'side',dl:Math.round(Math.random()*900)}}}
  const nCrowd=S.crowd||(!enc&&S.crowdAlone)||0;   // crowdAlone：沒遇到人時圍著玩家（v0.40.49）
  if(nCrowd){o.crowd=[];for(let i=0;i<nCrowd;i++){const go=r==='bad'&&enc&&i<Math.round(nCrowd*S.crowdBad);   // 大失敗：前一半跑去找遇到的人
    o.crowd.push({look:stLarvaCol(),x:Math.round(55+((i*37)%40)),y:Math.round(((i*53)%5)*4),pose:R(['idle_a','open_a','reach_a']),sp:Math.round(550+Math.random()*350),go:go?Math.round(6+Math.random()*22):null,front:i%2===0,dl:Math.round(Math.random()*600)})}}
  if(!enc&&S.away&&stNpcImg(S.away))o.away=S.away;   // 人在、但沒在理你（看向另一邊）
  const nc=S.npcCrowd&&enc&&hasNpc&&S.npcCrowd[enc];   // 圍著遇到的人的小球（例：言默唱歌）
  if(nc&&Math.random()<nc.p){if(nc.face!=null)o.npc={face:nc.face,sing:!!nc.sing};o.crowd=o.crowd||[];for(let i=0;i<nc.n;i++)o.crowd.push({look:stLarvaCol(),x:Math.round(2+i*38/Math.max(1,nc.n-1)),y:Math.round(((i*53)%5)*3),pose:R(['idle_a','open_a','reach_a']),sp:Math.round(550+Math.random()*350),go:null,front:i%2===0,dl:Math.round(Math.random()*600)})}
  return o;}
// v0.40.14：一天一天算（end＝這週目前的數值）。行程空白的日子＝自由行動：輪到那天時打開地圖（STRUN.free），選好才算
function stStartRun(){
  const st={...STY.st};st.meds=STY.meds;
  STRUN={i:0,phase:0,still:false,start:{...STY.st},end:st,ids:SUI.sched.map(x=>x||'free'),res:[],tired:false,bgFade:true,skip:false,free:null,met:{}};
  SUI.scr='home';SUI.greteOn=false;SUI.encPop=null;
  // v0.40.36：按下執行這週先黑畫面「讀取中」，這週會用到的背景讀好才開始（不會先閃過行程動畫）
  SUI.loading=true;stRender();
  const ks=new Set([STORY_HOME.day,STORY_HOME.tank,...STRUN.ids.flatMap(id=>{const c=STORY_CMDS[id]||{};return [c.big,...[].concat(c.small||[])]}).filter(Boolean)]);
  const img=k=>new Promise(r=>{const i=new Image();i.onload=i.onerror=()=>r();i.src=stBg(k,true);if(i.complete)r()});
  Promise.race([Promise.all([...ks].map(img)),new Promise(r=>setTimeout(r,3000))]).then(()=>setTimeout(()=>{if(!STRUN)return;SUI.loading=false;stStep()},250));
}
// 這一天的結果：還沒算就算。前一天累倒＝強制睡覺。回傳 false＝自由行動，等玩家在地圖上選
function stDay(){const R=STRUN,i=R.i;if(R.res[i])return true;
  if(R.tired)R.res[i]=stRoll(R.end,'sleep',true);
  else if(R.ids[i]==='free'){if(!R.free)R.free=stFreeNew();return false}
  else{const c=STORY_CMDS[R.ids[i]];   // 排了要花錢的事、到那天錢不夠：這天改成自由行動（v0.40.46；主角說一句）
    if(c.eff.money<0&&R.end.money<-c.eff.money){R.free=stFreeNew();R.free.poor=R.ids[i];R.ids[i]='free';return false}
    R.res[i]=stRoll(R.end,R.ids[i]);}
  R.tired=R.end.fat>=100;R.bgFade=(i?R.res[i-1].big:STORY_HOME.plan)!==R.res[i].big;return true}
// 道具能不能用（v0.40.63）：消耗品＝排行程時、白天回家時｜書＝白天回家時（自由行動的那天拿來讀）
const stReadCmd=k=>Object.keys(STORY_CMDS).find(id=>STORY_CMDS[id].book===k);
const stItemUsable=k=>!!(STY.items||{})[k]&&(STORY_USE[k]?(!STRUN||stHub()):!!(stReadCmd(k)&&stHub()));
// 用道具：消耗品加在現在的數值上（週中途＝這週的），用一次少一個、存檔｜書＝這天讀書（和在行程裡排讀書一樣）
function stUseItem(k){if(!stItemUsable(k))return;const u=STORY_USE[k],T=stT();
  if(!u){SUI.scr='home';stFreeGo(stReadCmd(k));return}
  const st=stCur();for(const s in u)st[s]=clamp(st[s]+u[s]);if(!--STY.items[k])delete STY.items[k];
  stFlash(fmt(T.bag.used,{n:T.items[k].n})+'　'+Object.entries(u).map(([s,v])=>T.S[s]+' '+v).join('、'));storyAutoSave()}
// 自由行動決定了：x＝蓋過結果的欄位（白跑一趟的背景）｜buys＝在店裡買的 [[道具, 價錢], …]（錢在這天的結果裡扣）
function stFreeGo(id,x,buys){const R=STRUN;R.free=null;SUI.scr='home';const r=R.res[R.i]=stRoll(R.end,id);r.free=true;if(x)Object.assign(r,x);
  if(buys&&buys.length){const n=buys.reduce((a,b)=>a+b[1],0);R.end.money-=n;r.d.money=(r.d.money||0)-n;r.buys=buys.filter(b=>!STORY_USE[b[0]]&&!stIsWear(b[0])).map(b=>b[0]);
    buys.filter(b=>STORY_USE[b[0]]).forEach(([k,,q])=>{STY.items[k]=Math.min(99,(STY.items[k]||0)+(q||1))});
    const wr=buys.filter(b=>stIsWear(b[0])).map(b=>b[0]);
    if(wr.length)STY.wearOwn=[...new Set([...(STY.wearOwn||[]),...wr])]}   // 服飾店：買了記在這個存檔（STY.wearOwn），不會自動穿上；存檔時併進 META.wearOwn（v0.40.69）   // 消耗品（舒緩液、能量飲料）：買了馬上放進道具（v0.40.62）；書照舊週末才算
  R.tired=R.end.fat>=100;R.bgFade=true;R.phase=0;R.still=false;stStep()}
// v0.40.33：劇情在那一天播，不等週末——
//   pre（這天的動畫之前）：遇到人（一個人一週最多一段）、第一次做這個行程、第一次累倒
//   post（這天的結果之後、下一天之前）：第一次大成功／大失敗／小球疲倦滿、數值達到（v0.40.62）
//   遇到人的好感也在這時候加（x.fg＝這次加多少，x.meet＝第一次認識）；「原本好感」＝遇到之前（ST_FAVPRE）
function stDayEvs(x,when){const R=STRUN,q=[];
  if(when==='pre'){
    // 執行行程隨機＋沒遇到人：今天會遇到人、但沒有見面劇情時先擲；擲中＝那個人今天不在（小動畫重算），播這段
    if(x.enc&&!x.forced&&!(R.met[x.enc]?null:stMeetEv(x.enc,x.id))){const ev=stRollEv(x,true);if(ev){x.enc=null;x.stg=stStageRoll(STORY_CMDS[x.id],x.r,null);q.push(ev)}}
    if(x.enc){ST_FAVPRE={...STY.fav};ST_METPRE=[...(STY.met||[])];const ev=R.met[x.enc]?null:stMeetEv(x.enc,x.id);if(ev)R.met[x.enc]=1;
      const a=STY.fav[x.enc]||0;x.meet=!a;x.fg=stFavAdd(x.enc,a>0?STORY_FAV.enc:STORY_FAV.meet);if(ev)q.push(ev);}
    if(!x.forced){if(!STY.seen.includes(x.id))STY.seen.push(x.id);q.push(...stEvents('first',x.id))}   // 累倒的那天不算「第一次睡覺」｜v0.40.61：每次做都看一次＝有條件的「第一次做」是條件符合之後的第一次（例 觸碰、安心≥0）
    if(x.forced)q.push(...stEvents('first','collapse'));
    if(!x.enc&&!x.forced&&(STORY_CMDS[x.id].enc||[]).length)q.push(...stEvents('alone',x.id));   // 沒遇到平常會在的人（例：5F 言街不在；v0.40.47）
    if(!q.length&&!x.forced){const ev=stRollEv(x);if(ev)q.push(ev)}   // 執行行程隨機：這天沒有別的劇情才擲（v0.40.60）
  }else{
    if(x.r==='great'&&STORY_CMDS[x.id].cat==='care')q.push(...stEvents('first','crit'));   // 第一次大成功／大失敗的提示：只算照顧
    if(x.r==='bad'&&STORY_CMDS[x.id].cat==='care')q.push(...stEvents('first','fumble'));
    if(x.before.tired+(x.d.tired||0)>=100)q.push(...stEvents('first','tiredMax'));
    if(!STY.freeMode)q.push(...stEvents('stat'));   // 數值達到：每天結果出來就看（v0.40.62；原本週末才看，會擠在一起）
  }
  return q.filter((e,i)=>q.indexOf(e)===i);}
// 這一天還沒播的劇情：播完回到 then；回傳 true＝有劇情（跳過會停下來）
function stDayPlay(x,when,then){const k=when==='pre'?'preDone':'postDone';if(x[k])return false;x[k]=1;
  const q=stDayEvs(x,when);if(!q.length)return false;clearTimeout(ST_TIMER);STRUN.skip=false;stPlay(q,then);return true}
let ST_TIMER=0;
function stStep(){clearTimeout(ST_TIMER);const R=STRUN;
  if(R&&R.i<7){
    if(R.skip){   // 跳過：一路算到週末；碰到自由行動要選、碰到劇情先播（播完回到那天的動畫，要再按一次跳過）
      while(R.i<7&&stDay()){const x=R.res[R.i];
        if(stDayPlay(x,'pre',stStep))return;
        if(!x.postDone&&stDayEvs(x,'post').length){R.phase=1;R.still=true;R.skip=false;break}   // 有結果後的劇情：停在這天的結果，接著播劇情
        R.i++;}
    }else if(stDay()&&R.phase===0&&stDayPlay(R.res[R.i],'pre',stStep))return;
  }
  if(R&&R.i>=7&&!R.lived){R.lived=1;R.end.money-=STORY_RULE.living}   // 週結算：扣生活費（結算表多一列）
  stRender();
  if(R&&R.free&&!SUI.vn&&!R.free.tip){R.free.tip=1;const q=stEvents('first','free');
    if(R.free.poor)q.unshift(stTalk('_poor',fmt(stT().poorDay,{cmd:stCmdName(R.free.poor)})));
    if(q.length){stPlay(q,stRender);return}}   // 第一次自由行動：說明玩法的劇情（主線總表，觸發＝第一次做：自由行動）
  if(!R||R.i>=7||R.free||SUI.vn)return;
  ST_TIMER=setTimeout(()=>{if(STRUN.phase===0){STRUN.phase=1;STRUN.still=false;stStep()}else stNext()},STRUN.phase===0?STORY_RULE.tExec:STORY_RULE.tEnd);}
function stNext(){const R=STRUN,x=R.res[R.i],go=()=>{R.i++;R.phase=0;R.still=false;stStep()};if(x&&stDayPlay(x,'post',go))return;go()}
function stTap(){if(!STRUN||STRUN.i>=7||STRUN.free||SUI.vn)return;if(STRUN.phase===0){STRUN.phase=1;STRUN.still=true;stStep()}else stNext()}
function stSkip(){clearTimeout(ST_TIMER);const R=STRUN,x=R.res[R.i];if(R.phase===1&&x&&!x.postDone&&stDayPlay(x,'post',()=>{R.i++;R.phase=0;R.still=false;stStep()}))return;R.skip=true;stStep()}   // 跳過：一路算到週末（自由行動、劇情會停下來）
// 做完一件事會解鎖什麼（週結算時照順序跑；這週裡面的判斷用 stHas／stDid 先算進去）
const ST_UNLOCKS=[
  (x,c)=>{if(c.at&&!STY.visit.includes(c.at))STY.visit.push(c.at)},                                // 去過的地點（記錄；v0.40.44 起打工不看這個）
  (x,c)=>{(x.buys||[]).forEach(k=>{STY.items=STY.items||{};STY.items[k]=1})},                       // 在店裡買到的東西 → 讀書的行程
  (x,c)=>{if(c.min)STY.medDone++}                                                                  // 有「本月至少幾次」的（換藥水）：記次數
];
// 週結算「確定」：寫回、下一週（自動存檔）
let ST_FAVPRE=null,ST_METPRE=null;
function stWeekDone(){
  const e=STRUN.end,w=STY.week;STY.meds=e.meds;delete e.meds;STY.st=e;
  // 遇到人、第一次做（含大成功等）、好感已經在那一天處理過了（stDayEvs）
  STRUN.res.forEach(x=>ST_UNLOCKS.forEach(f=>f(x,STORY_CMDS[x.id])));   // 做完這週解鎖的東西（v0.40.37 統整成一張表）
  STRUN=null;SUI.sched=stFixedFill();SUI.sel=0;ST_FAVPRE=null;
  const capQ=[];
  if(STY.freeMode){   // 自由模式（v0.40.62）：第一章結束時的數值、好感都不動（每天只有錢、疲勞、疲倦會變，ST_FREE_KEYS），錢上限 STORY_RULE.freeCap；不算負債、沒有考察
    const m=STY.st.money;STY.st.money=Math.min(m,STORY_RULE.freeCap);STY.debt=0;
    if(m>=STORY_RULE.freeCap)capQ.push(stTalk('_cap',stT().freeCapTalk));}
  else STY.debt=STY.st.money<0?(STY.debt||0)+1:0;   // 負債：連續幾週結算時錢是負的
  if(STY.debt>=STORY_RULE.debtOver){stPlay(STORY_SCRIPT.filter(x=>x.ch===STY.ch&&x.trig==='gameOver'&&stArg(x)[0]==='debt'&&x.lines.length),stGameOver);return}   // 小球被帶回異生會：不跑考察
  const q=STY.freeMode?capQ:[...stEvents('weekEnd',w),...stEvents('stat')];
  stPlay(q,()=>{
    if(ST_OVER){ST_OVER=false;stGameOver();return}   // 劇情效果「遊戲結束」（例 C1-06 月底評估沒過）
    if(STY.week>=STORY_RULE.weeks&&!STY.freeMode){stChapterEnd();return}
    STY.week++;
    stPlay([...stEvents('weekStart',STY.week),...stJobNews()],()=>{storyAutoSave();if(STY.freeMode)stRender();else stFlash(fmt(stT().week,{n:STY.week}))});   // 自由模式不跳「第幾週」，但一樣要重畫（v0.40.63 修正：沒重畫＝結算框還在，再按一次出錯）
  });
}
// 新出現的打工（v0.40.44）：數值到了就出現在行程表；下週開始排行程時，玩家自己的對話框提一句（一段臨時劇情，不記進播過的劇情）
//   silent＝只記下來不提（新遊戲、舊存檔第一次讀進來）
function stJobNews(silent){const now=stPlanIds('job');
  if(!Array.isArray(STY.jobSeen)||silent){STY.jobSeen=now;return []}
  const nw=now.filter(x=>!STY.jobSeen.includes(x));if(!nw.length)return [];STY.jobSeen.push(...nw);
  return [stTalk('_jobs',fmt(stT().jobNews,{list:nw.map(stCmdName).join('、')}))];}
// 遊戲結束（負債）：黑畫面，只能讀檔或離開；不存檔（自動存檔還是這週開始時的）
function stGameOver(){SUI.over=true;SUI.scr='home';stRender()}
// 章末（v0.40.53）：月底評估在第 4 週的考察裡（C1-06；沒過＝劇情效果「遊戲結束」）。走到這裡＝過關：
//   照順序挑第一個符合條件的章末劇情（C1-50）＋過關後，播完是「中繼存檔」畫面：儲存中繼存檔／離開主線
function stChapterEnd(){
  if(!ST_PV&&(META.chDone||0)<STY.ch){META.chDone=STY.ch;codexSave()}   // 日常模式：4F／5F、心等 5（v0.40.59）
  const ev=STORY_SCRIPT.find(x=>x.ch===STY.ch&&x.trig==='chapterEnd'&&stCond(x.arg)&&x.lines.length);
  stPlay([...(ev?[ev]:[]),...stEvents('chapterPass')],()=>{SUI.over='mid';SUI.midSaved=false;SUI.scr='home';stRender()});
}
// 中繼存檔（自由模式存檔，v0.40.55 起 3 格 META.storyFree[i]）：自由模式一直存回讀進來的那一格（freeSlot）。base＝存的當下的數值、好感（自由模式每週回到這裡）
function storyFreeMake(i){storyOwnSync();const o=storyCopy(STY);o.freeSlot=i;delete o.run;o.freeMode=true;o.week=STY.week+1;o.debt=0;o.at=new Date().toISOString().slice(0,10);return o}

