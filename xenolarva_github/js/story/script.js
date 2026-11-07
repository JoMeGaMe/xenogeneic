// ===== 主線 script.js：劇情引擎：條件 stCond、找觸發的劇情 stEvents／stMeetEv、播放 stPlay、進到某一句 stVnEnter、效果 stEff、好感 =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// 人物說的話自動加「」（一行一組；已經有「『（開頭或」』結尾的不動；裡面原本的「」改成『』）；旁白、選項不加。tools/storysheet.py 的 quote 一樣
function stQuote(who,t){if(!t||!who||who==='narr'||who==='choice'||who==='cond')return t;
  return String(t).split('\n').map(c=>{const s=c.trim();if(!s||/^[「『（(]/.test(s)||/[」』]$/.test(s))return c;const m=c.match(/^(\s*)([\s\S]*?)(\s*)$/);return m[1]+'「'+m[2].replace(/「/g,'『').replace(/」/g,'』')+'」'+m[3]}).join('\n')}
STORY_SCRIPT.forEach(e=>e.lines.forEach(l=>{if(l.text)l.text=stQuote(l.who,l.text)}));
// ---------- 劇情（STORY_SCRIPT，js/story/data/storyscript.js；設定總表「主線劇情」）----------
// 條件：hp>=20、calm<25、week==2，用「,」連起來＝而且
// 條件是否符合（變數表在 js/story/data/story.js 的 STORY_COND）。看不懂的條件＝不符合，主控台會提醒（預覽時畫面左下也會）
let ST_DAYX=null;   // 正在處理的那一天（執行行程隨機的條件「沒遇到人」用）
const ST_COND_GET={alone:()=>ST_DAYX&&!ST_DAYX.enc&&(STORY_CMDS[ST_DAYX.id].enc||[]).length?1:0,debt:()=>STY.debt||0,week:()=>STY.week,med:()=>STY.medDone,fav:id=>STY.fav[id]||0,fav0:id=>((SUI.vn&&SUI.vn.fav0)||STY.fav)[id]||0,seen:id=>STY.seen.includes(id)?1:0};
function stCond(c){const {terms,bad}=storyCondParse(c);
  if(bad.length){console.warn('看不懂的條件',bad);if(ST_PV)stPopMsg('看不懂的條件：'+bad.join('、'));return false}
  return terms.every(t=>{const g=ST_COND_GET[t.v.k],v=g?g(t.of):(stCur()[t.v.k]??0),n=t.n;
    // 好感 >0／==0＝認識了沒（v0.40.69：自由模式第一次見面好感還是 0，但算認識）；原本好感看劇情開始時的認識名單
    if((t.v.k==='fav'||t.v.k==='fav0')&&n===0&&['>','==','=','<='].includes(t.op)){const kn=t.v.k==='fav'?stKnow(t.of):v>0||((SUI.vn&&SUI.vn.met0)||STY.met||[]).includes(t.of);return t.op==='>'?kn:!kn}
    return {'>=':v>=n,'<=':v<=n,'>':v>n,'<':v<n,'==':v===n,'=':v===n}[t.op]});}
// 這一章、這個觸發還沒播過、有台詞的事件
//   stat／chapterEnd 的參數＝條件；其他觸發的參數＝「對象,條件…」（例 touch,calm<0｜3,med<3），條件可以省略
const stArg=x=>{const [k,...c]=String(x.arg??'').split(/[,，、]/);return [k.trim(),c.join(',')]};
function stEvents(trig,arg){
  return STORY_SCRIPT.filter(x=>{if(x.ch!==STY.ch||x.trig!==trig||!x.lines.length||STY.done.includes(x.id))return false;
    if(trig==='stat'||trig==='chapterEnd')return stCond(x.arg);
    const [k,c]=stArg(x);return (arg==null||k===String(arg))&&stCond(c);});}
// 執行行程隨機（v0.40.60）：參數「行程%機率,條件…」；這天做的是那個行程、條件符合，就各自擲一次，最多播一段
//   away＝只看條件裡有「沒遇到人==1」的：擲中就讓那天平常會在的人不在（v0.40.64；原本要那天剛好不在才擲，機率太低）
function stRollEv(x,away){ST_DAYX=away?{...x,enc:null}:x;
  try{return STORY_SCRIPT.find(e=>{if(e.ch!==STY.ch||e.trig!=='roll'||!e.lines.length||STY.done.includes(e.id))return false;
    const [k,c]=stArg(e),[cmd,p]=k.split('%');if(away&&!/(^|,)alone==1(,|$)/.test(c))return false;
    return cmd===x.id&&stCond(c)&&Math.random()*100<(p?+p:STORY_RULE.rollP)})||null}
  finally{ST_DAYX=null}}
// 遇到人：參數「人物」或「人物@行程」（例 yanmo@busk）；指定行程的優先
function stMeetEv(who,cmd){
  const ok=STORY_SCRIPT.filter(x=>{if(x.ch!==STY.ch||x.trig!=='meet'||!x.lines.length||STY.done.includes(x.id))return false;
    const [k,c]=stArg(x),[w,at]=k.split('@');return w===who&&(!at||at.split('|').includes(cmd))&&stCond(c);});   // 人物@行程｜行程＝其中一個行程（v0.40.57）
  return ok.find(x=>stArg(x)[0].includes('@'))||ok[0]||null;}
// 週中途播的劇情（打開畫面、排行程）：記進自動存檔，離開再回來不會重播
function stDoneKeep(){if(!ST_PV&&META.story){META.story.done=[...new Set([...(META.story.done||[]),...STY.done])];codexSave()}}
function stPlay(evs,done){
  if(!evs.length){if(done)done();return}
  const [ev,...rest]=evs;if(!ST_REPLAY&&!ev.tmp)STY.done.push(ev.id);   // tmp＝臨時的一段（新出現的打工），不記
  // 先讀好這段用到的背景、立繪（含白邊）、玩家頭像；超過 0.15 秒才顯示「讀取中」
  const lt=setTimeout(()=>{SUI.loading=true;stRender()},150);
  stLoadEv(ev).then(()=>{clearTimeout(lt);SUI.loading=false;
    SUI.vn={ev,i:0,fav0:{...(ev.trig==='meet'&&ST_FAVPRE&&!ST_PV?ST_FAVPRE:STY.fav)},met0:[...(ev.trig==='meet'&&ST_FAVPRE&&!ST_PV&&ST_METPRE?ST_METPRE:STY.met||[])],bg:null,chr:null,chl:null,larva:false,fx:[],fxAll:[],scr:null,done:()=>{if(ev.lines.some(l=>/(^|,)scr:/.test(l.fx||''))){SUI.scr='home'}stPlay(rest,done)}};
    stVnEnter();});
}
// 這段劇情會用到的圖：照 stVnEnter 的規則走一遍（立繪換表情、左邊換 _R_）
// 立繪移動的七個位置：x＝在兩格之間的哪裡（0 左格、1 右格），z＝前後（前層 3、平常 2、後層 1）
const ST_POS={RF:{x:.9,z:3},R:{x:1,z:2},RB:{x:.86,z:1},C:{x:.5,z:2},LF:{x:.1,z:3},L:{x:0,z:2},LB:{x:.14,z:1}};
const stWho=k=>k?String(k).split(/[_:]/)[0]:null;   // 立繪格裡是誰（larvae:3 → larvae）
// 玩家自己說一句的臨時劇情（不記進播過的劇情；錢不夠、新的打工、自由模式錢滿了）
const stTalk=(id,text)=>({id,tmp:true,ch:STY.ch,trig:'',arg:'',lines:[{who:'player',text}]});
// 換表情：圖名最後的 _數字 換掉，方向、配件（+acc）不變
const stFaceSwap=(k,f)=>k.replace(/_[^_+]+(\+.*)?$/,(m,acc)=>'_'+f+(acc||''));
// 這句的立繪格是不是說話的人自己（是＝照立繪格，不換表情；v0.40.62：只看說話的人自己，另一格換成小球之類的也要換表情）
const stOwnImg=L=>[L.chr,L.chl].some(k=>k&&k!=='none'&&String(k).startsWith(L.who+'_'));
function stLoadEv(ev){
  const bgs=new Set(),chrs=new Set();let chr=null,chl=null,me=false;
  ev.lines.forEach(L=>{if(L.bg&&L.bg!=='black')bgs.add(L.bg);if(L.who==='player')me=true;
    if(L.chr)chr=L.chr==='none'?null:L.chr;if(L.chl)chl=L.chl==='none'?null:L.chl;
    const N=L.who&&STORY_NPC[L.who];
    if(N&&N.img&&L.face!=null&&L.face!==''&&!stOwnImg(L)){const sw=k=>stFaceSwap(k,L.face);const mine=k=>k&&k.startsWith(L.who+'_');
      if(mine(chr))chr=sw(chr);else if(mine(chl))chl=sw(chl);else chr=sw(N.img);}
    if(chr&&!stIsLarva(chr))chrs.add(chr);if(chl&&!stIsLarva(chl))chrs.add(stFaceR(chl));});
  const img=src=>new Promise(r=>{const i=new Image();i.onload=i.onerror=()=>r();i.src=src;if(i.complete)r()});
  const ol=k=>new Promise(r=>{chrOl(k);if(!chrNew(k))return img(assetImg(k.replace(/\+acc$/,''))).then(r);const t0=Date.now(),w=()=>{if(CHR_OL[k]!==false||Date.now()-t0>6000)r();else setTimeout(w,80)};w()});
  const all=[...[...bgs].map(b=>img(stBg(b,true))),...[...chrs].map(ol),img(assetImg('scar_1'))];
  if(me)all.push(dollLoad().then(()=>{ST_DOLL_OK=true}));
  return Promise.race([Promise.all(all),new Promise(r=>setTimeout(r,8000))]);
}
// 進到某一行：套用背景、立繪、演出、數值；選項行一起顯示
// 判定（差分）：連續幾行 who:'cond'，text＝條件（同 stCond），go＝標籤。第一個符合的跳過去；text 空白＝其他情況；都不符合＝接著往下
const stCondCn=c=>{const T=stT();return storyCondCn(c,Object.fromEntries(Object.entries(T.npc).map(([k,v])=>[k,v.n])),T.cmd)};
function stCondJump(ls,i){let k=i;while(k<ls.length&&ls[k].who==='cond')k++;
  for(let j=i;j<k;j++){const c=ls[j];if(!c.text||stCond(c.text)){const t=c.go==='end'?ls.length:c.go?ls.findIndex(l=>l.tag===c.go):j+1;
    if(ST_PV)stPopMsg(fmt(stT().pv.cond,{c:c.text?stCondCn(c.text):stT().pv.condElse,go:c.go==='end'?stT().pv.condEnd:(c.go||'')}));return t<0?ls.length:t}}
  if(ST_PV)stPopMsg(stT().pv.condNone);return k}
function stVnEnter(){
  const V=SUI.vn;let n=0;while(V.ev.lines[V.i]&&V.ev.lines[V.i].who==='cond'&&n++<50)V.i=stCondJump(V.ev.lines,V.i);
  const L=V.ev.lines[V.i];
  if(!L){const d=V.done;SUI.vn=null;stRender();d();return}
  if(L.bg&&L.bg!==V.bg){V.bgPrev=V.bg;V.bgFade=true;V.bg=L.bg;V.bgZ=false}else V.bgFade=false;   // bgZ＝走過去放大了（換背景就回來）   // 換背景：新的淡入（第一張從黑色淡入）
  // 立繪兩格：chr 右邊（面向左，平常用這格）、chl 左邊（兩個人對話時；自動換成面向右的 _R_ 圖）。none＝收起來
  if(V.gone){V[V.gone]=null;V.gone=null}   // 上一句走開的人：這句起收掉（已經走出畫面，不用再淡出）
  const pr=V.chr,pl=V.chl;
  // 右下角的小助手（v0.40.49；v0.40.50 改成從畫面下緣冒出來）：helperIn＝這句的右立繪（沒寫＝說話的人）從右下角冒出來，原本的立繪不動；helperIn:39%＝露出整張圖的 39%（從上面算，沒寫＝60%）；helperOut＝縮回去（下一句起收掉）；右立繪寫「無」也會一起收掉
  const fx0=String(L.fx||'').split(/[,，、\n]/).map(x=>x.trim().split('@')[0]),hx=fx0.find(x=>/^helperIn(:|$)/.test(x)),hIn=!!hx;
  if(V.helperGone||(L.chr==='none'&&!hIn)){V.helper=null;V.helperGone=false}V.helperIn=hIn;V.helperOut=fx0.includes('helperOut');V.tl=performance.now();
  if(hIn)V.helperPct=Math.max(10,Math.min(100,parseInt(hx.split(':')[1])||60));
  if(hIn)V.helper=L.chr&&L.chr!=='none'&&!stIsLarva(L.chr)?L.chr:(STORY_NPC[L.who]&&STORY_NPC[L.who].img)||null;
  if(V.helperOut)V.helperGone=true;
  if(L.chr&&!hIn)V.chr=L.chr==='none'?null:L.chr;
  if(L.chl)V.chl=L.chl==='none'?null:L.chl;
  // 人物說話時寫了表情：換掉正在顯示他的那一格（方向、配件不變）；兩格都沒有他＝放到右邊
  const N=L.who&&STORY_NPC[L.who];
  if(N&&N.img&&L.face!=null&&L.face!==''&&!stOwnImg(L)){
    const sw=k=>stFaceSwap(k,L.face);
    const mine=k=>k&&k.startsWith(L.who+'_');
    if(mine(V.helper))V.helper=sw(V.helper);else if(mine(V.chr))V.chr=sw(V.chr);else if(mine(V.chl))V.chl=sw(V.chl);else V.chr=sw(N.img);
  }
  // 人物出場／退場：換了一個人（不是同一個人換表情、轉向）＝新的淡入（或跑進來）、舊的淡出
  const pp=k=>k?String(k).split('_')[0]:null;
  V.inR=!!V.chr&&pp(V.chr)!==pp(pr);V.inL=!!V.chl&&pp(V.chl)!==pp(pl);
  V.outR=pr&&pp(pr)!==pp(V.chr)?pr:null;V.outL=pl&&pp(pl)!==pp(V.chl)?pl:null;
  // 演出可以寫好幾個（用「,」隔開）；寫成「演出@3」＝這句的第 3 段出來時才演（段＝換行或「｜」）
  V.fxAll=String(L.fx||'').split(/[,，、\n]/).map(x=>x.trim()).filter(Boolean);
  // 一群小球的動作（v0.40.49）：lvJump／lvWave／lvSleep（:L1＝左邊第 1 隻、:R2＝右邊第 2 隻，從外側數；沒寫＝全部）。只演這一句；lvKeep＝接著上一句的動作（不重來）
  if(!V.fxAll.includes('lvKeep'))V.lv={};
  V.fxAll.forEach(x=>{const m=x.split('@')[0].match(/^lv(Jump|Wave|Sleep)(?::(\w+))?$/)||x.split('@')[0].match(/^larva(Sway):(\w+)$/);if(m)V.lv[m[2]||'*']={a:m[1].toLowerCase(),t0:performance.now()}});   // 小球晃一晃:左1＝一群小球裡那一隻晃（v0.40.57）
  // 立繪移動（v0.40.62，七個位置 ST_POS）：move+位置[:L／:R]＝那一格（沒寫＝說話的人那格，旁白＝右）滑過去；V.pos＝每格現在在哪，換了人就回原位
  const fxb=V.fxAll.map(x=>x.split('@')[0]);V.mvA={};
  V.pos=V.pos||{};['chr','chl'].forEach(k=>{if(!V[k]||(k==='chr'?pr:pl)&&stWho(V[k])!==stWho(k==='chr'?pr:pl))delete V.pos[k]});
  fxb.forEach(f=>{const [b,t]=f.split(':'),m=b.match(/^move(RF|RB|R|C|LF|LB|L)$/);if(!m)return;
    const k=t==='L'?'chl':t==='R'?'chr':V.chl&&L.who&&V.chl.startsWith(L.who+'_')?'chl':'chr',home=k==='chr'?'R':'L',from=V.pos[k]||home;
    if(from!==m[1]){V.mvA[k]=[from,m[1]];V.pos[k]=m[1]}});
  // 立繪晃一晃倒下：倒著到那格換圖為止（V.fallen）；對象＝:左／:右，沒寫＝說話的人（旁白＝右）
  V.fallen=V.fallen||{};if(L.chr)V.fallen.chr=false;if(L.chl)V.fallen.chl=false;V.fallA=null;
  const ff=fxb.find(x=>x.split(':')[0]==='fall');
  if(ff){const t=ff.split(':')[1];V.fallA=t==='L'?'chl':t==='R'?'chr':V.chl&&L.who&&V.chl.startsWith(L.who+'_')?'chl':'chr';V.fallen[V.fallA]=true}
  V.bgWalk=V.fxAll.some(x=>x.split('@')[0]==='walk');if(V.bgWalk)V.bgZ=true;   // 背景上下搖晃稍微放大：像往前走（v0.40.60）
  if(V.fxAll.includes('larvaIn'))V.larva=true;if(V.fxAll.includes('larvaOut'))V.larva=false;
  // 走開（leaveL／leaveR＝往左／右走）：後面寫 :L／:R（總表「:左」「:右」）＝那一格走開（旁白一律寫，v0.40.52）；沒寫＝這句寫了哪一格／說話的人那一格。演完下一句收掉
  const lv=V.fxAll.find(x=>/^leave[LR](:|$)/.test(x.split('@')[0]));V.leave=null;
  const lvT=lv&&lv.split('@')[0].split(':')[1];if(lvT){V.leave=lvT==='L'?'chl':'chr';V.gone=V.leave}
  else if(lv){const who=k=>k&&L.who&&k.startsWith(L.who+'_');V.leave=L.chl?'chl':L.chr?'chr':who(V.chl)?'chl':who(V.chr)?'chr':V.chr&&!stIsLarva(V.chr)?'chr':V.chl&&!stIsLarva(V.chl)?'chl':V.chr?'chr':'chl';   /* 旁白：優先走開的是人（不是小球） */V.gone=V.leave}
  // 教學：scr:畫面.頁籤＝打開那個畫面（一直開到換掉；scr:none 關掉），立繪縮到右下；hl:區塊＝這句講到的地方（其他地方調暗）
  V.fxAll.filter(x=>x.startsWith('scr:')).forEach(x=>{const [sc,tab]=x.slice(4).split('.');
    if(sc==='none'){V.scr=null;SUI.scr='home';return}V.scr=sc;SUI.scr=sc;
    if(tab){if(sc==='stat')SUI.stab=tab;if(sc==='bag')SUI.btab=tab;if(sc==='plan')SUI.tab=tab}});
  V.hl=V.fxAll.filter(x=>x.startsWith('hl:')).map(x=>x.slice(3));V.dtop=false;
  // 接續：和上一句放在同一個對話框（cont 接在後面｜contNl 換一行），例如同一句話中間換表情
  //   contNl＝換一行再接、contNl2＝換兩行（中間空一行）再接
  const lf=V.lastFull||'',lt=lf.replace(/\n+$/,'');
  V.carry=V.fxAll.includes('cont')?lf:V.fxAll.includes('contNl')?(lf?lt+'\n':''):V.fxAll.includes('contNl2')?(lf?lt+'\n\n':''):'';
  V.t0=performance.now();V.tk=0;V.typing=false;V.scroll=0;
  V.k=1;V.fx=stFxAt(V,1);   // 多行的內容：一次出一行（點一下出下一行，全出完才換句）；演出寫 all＝整段一起出現
  if(L.eff&&L.who!=='choice')stEff(L.eff,true);
  stRender();
}
// 好感：加到這章的上限為止（本來就超過上限的不扣）；回傳實際加了多少
let ST_OVER=false;
// 認識了沒：好感 >0，或記在 met（自由模式第一次見面，好感不變；v0.40.69）
const stKnow=k=>(STY.fav[k]||0)>0||(STY.met||[]).includes(k);
function stFavAdd(k,d){if(STY.freeMode){if(d>0&&STORY_PPL.includes(k)&&!stKnow(k))(STY.met=STY.met||[]).push(k);return 0}   // 自由模式：好感不變
  const a=STY.fav[k]||0,b=d>0?Math.max(a,Math.min(storyFavCap(STY.ch,k),a+d)):Math.max(0,a+d);STY.fav[k]=b;return b-a}
// 這週行程裡遇到人各加多少（第一次 meet、之後 enc，到上限為止）：結果表顯示和週末結算用同一份
function stFavSim(){const f={...STY.fav},g=new Map();(STRUN&&STRUN.res||[]).forEach(x=>{if(!x.enc)return;const a=f[x.enc]||0,b=Math.max(a,Math.min(storyFavCap(STY.ch,x.enc),a+(a>0?STORY_FAV.enc:STORY_FAV.meet)));f[x.enc]=b;g.set(x,b-a)});return g}
function stEff(str,pop){if(ST_REPLAY)return;String(str).split(/[,，、]/).forEach(p=>{p=p.trim();
  if(p.startsWith('open.')){const k=p.slice(5);if(!STY.open.includes(k))STY.open.push(k);return}
  if(p==='gameOver'){if(!ST_PV)ST_OVER=true;return}   // 這段播完遊戲結束（週結算時看，v0.40.53）   // 劇情開放新地點（例 open.f4＝異生會 4F）
  const m=p.match(/^(fav\.)?(\w+)\s*([+-]\d+)$/);if(!m)return;
  if(m[1]){const was=STY.fav[m[2]]||0,d=stFavAdd(m[2],+m[3]);if(pop&&d&&was>0)stFavPop(m[2],d);return}   // 初次見面（原本 0）不浮提示
  const st=stCur();if(m[2] in st&&(!STY.freeMode||ST_FREE_KEYS.includes(m[2])))st[m[2]]+= +m[3];});}   // 週中途的劇情加在這週的數值上（v0.40.62 修正：原本加在週初，週末會被蓋掉）
// 教學：把講到的區塊以外的畫面調暗；講到的地方在下半部時，對話框移到上面
function stGuideDim(st){const V=SUI.vn;if(!V||!V.scr||!V.hl||!V.hl.length)return;
  const pane=st.querySelector('.spane'),svn=st.querySelector('.svn');if(!pane||!svn)return;
  const els=V.hl.flatMap(k=>[...st.querySelectorAll(`[data-hl~="${k}"]`)]);if(!els.length)return;
  const sc=+st.dataset.s||1,s0=st.getBoundingClientRect(),R=e=>{const r=e.getBoundingClientRect();return {x:(r.left-s0.left)/sc,y:(r.top-s0.top)/sc,r:(r.right-s0.left)/sc,b:(r.bottom-s0.top)/sc}};
  const p=R(pane),u=els.map(R).reduce((a,b)=>({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),r:Math.max(a.r,b.r),b:Math.max(a.b,b.b)}));
  const d=document.createElement('div');d.className='svdim';Object.assign(d.style,{left:p.x+'px',top:p.y+'px',width:(p.r-p.x)+'px',height:(p.b-p.y)+'px'});
  const hole=document.createElement('div');hole.className='svhole';Object.assign(hole.style,{left:(u.x-p.x-4)+'px',top:(u.y-p.y-4)+'px',width:(u.r-u.x+8)+'px',height:(u.b-u.y+8)+'px'});
  d.append(hole);svn.prepend(d);
  const g0=st.querySelector('.svdlg:not(.top)'),gt=g0?R(g0).y:st.offsetHeight-200;
  // 講到的地方整個被對話框擋住時，對話框才移到上面
  const top=V.dtop?true:u.y>gt-10;if(top!==!!V.dtop){V.dtop=top;const g=st.querySelector('.svdlg');if(g)g.classList.toggle('top',top)}}
// 第 k 段要演的：沒寫 @ 的在第 1 段，寫 @n 的在第 n 段
function stFxAt(V,k){return V.fxAll.filter(x=>{const m=x.split('@');return m[1]?+m[1]===k:k===1}).map(x=>x.split('@')[0])}
// 好感變化：畫面左下浮出來的小提示（劇情裡的數值變化、選項）
let ST_FAVPOP=[],ST_FAVN=0;
// 預覽用的小提示（判定走了哪一條）：和好感提示同一個位置
function stPopMsg(t){const id=++ST_FAVN;ST_FAVPOP.push({id,t0:performance.now(),t,bad:false});setTimeout(()=>{ST_FAVPOP=ST_FAVPOP.filter(x=>x.id!==id);const e=document.querySelector('#ovStory .svfav[data-id="'+id+'"]');if(e)e.remove()},3200);}
function stFavPop(who,n){const T=stT(),id=++ST_FAVN;ST_FAVPOP.push({id,t0:performance.now(),t:fmt(T.favPop,{name:T.npc[who]?T.npc[who].n:who,n:(n>0?'+':'')+n}),bad:n<0});
  setTimeout(()=>{ST_FAVPOP=ST_FAVPOP.filter(x=>x.id!==id);const e=document.querySelector('#ovStory .svfav[data-id="'+id+'"]');if(e)e.remove()},2600);}
