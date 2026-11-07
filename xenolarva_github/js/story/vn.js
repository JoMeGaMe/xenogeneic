// ===== 主線 vn.js：劇情畫面：逐字、對話框、立繪與演出 stVn、跳過、日記本重看、劇情預覽 =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// 對話顯示方式：type 逐字｜line 整行（存在這台裝置）
const ST_TXTS=['type','line'];
let ST_TXT=(()=>{try{const v=localStorage.getItem('xenolarva_storytext');return ST_TXTS.includes(v)?v:'type'}catch(e){return 'type'}})();
let ST_TW=0;
function stTypeStart(){clearInterval(ST_TW);const V=SUI.vn;if(!V||!V.typing)return;
  const box=document.querySelector('#ovStory .svdlg p');if(!box)return;const sp=[...box.querySelectorAll('.tw')];let i=0;
  ST_TW=setInterval(()=>{for(let n=0;n<2&&i<sp.length;n++)sp[i++].classList.remove('tw');stScrollDlg(box,sp[i-1]);
    if(i>=sp.length)stTypeDone();},STORY_RULE.typeMs*2);}
function stTypeDone(){clearInterval(ST_TW);const V=SUI.vn;if(!V)return;V.typing=false;V.tk=V.k;
  document.querySelectorAll('#ovStory .svdlg .tw').forEach(e=>e.classList.remove('tw'));
  const box=document.querySelector('#ovStory .svdlg p');if(box)stScrollDlg(box);}
// 對話框捲到看得到最新的字（慢慢捲下去）
function stScrollDlg(box,el){const want=el?Math.max(0,el.offsetTop+el.offsetHeight-box.clientHeight):box.scrollHeight-box.clientHeight;
  if(want>box.scrollTop+1)box.scrollTo({top:want,behavior:'smooth'});}
// 逐字用：每個字一個 span（先藏起來、位置先佔好，不會跳行）；**字**＝強調
function stTypeHTML(t){let h='',em=false;const s=stSub(t);
  for(let i=0;i<s.length;i++){if(s[i]==='*'&&s[i+1]==='*'){em=!em;i++;continue}if(s[i]==='\n'){h+='<br>';continue}
    h+=em?`<b class="svem tw">${esc(s[i])}</b>`:`<span class="tw">${esc(s[i])}</span>`;}
  return h;}
function stTxtNode(after){const T=stT().txt,d=document.createElement('div');d.className='stxtset';
  const draw=()=>{d.innerHTML=`<div class="phead">${esc(T.title)}</div><div class="prow">${ST_TXTS.map(k=>`<button class="pbtn${k===ST_TXT?' on':''}" data-k="${k}">${esc(T[k])}</button>`).join('')}</div>`;
    d.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();ST_TXT=b.dataset.k;try{localStorage.setItem('xenolarva_storytext',ST_TXT)}catch(x){}draw();if(after)after()});};
  draw();return d;}
// 這一句還有沒出來的行？
// 一句拆成「一次出來的單位」：每一行、以及行內的「｜」（停頓：點一下才繼續，不換行）。pre＝前面要換幾行（空行＝段落間隔）
const ST_PAUSE=/[｜|]/;
function stUnits(t){const u=[];let pre='';
  String(t||'').split('\n').forEach((ln,i)=>{if(i)pre+='\n';if(!ln.trim())return;
    ln.split(ST_PAUSE).forEach((p,j)=>{if(!p&&j)return;u.push({pre,t:p});pre=''});});
  return u.length?u:[{pre:'',t:''}];}
const stLineN=t=>stUnits(t).length;
function stVnMore(){const V=SUI.vn,L=V&&V.ev.lines[V.i];return !!L&&L.who!=='choice'&&!V.fxAll.includes('all')&&V.k<stLineN(L.text)}
function stVnNext(go){
  const V=SUI.vn,ls=V.ev.lines,cur=ls[V.i];
  if(cur&&cur.who!=='choice')V.lastFull=(V.carry||'')+String(cur.text||'').replace(new RegExp(ST_PAUSE.source,'g'),'');   // 給下一句「接續」用
  if(go==='end'){V.i=ls.length;stVnEnter();return}
  if(go){const j=ls.findIndex(l=>l.tag===go);V.i=j>=0?j:ls.length;stVnEnter();return}
  const L=ls[V.i];if(L&&L.go){stVnNext(L.go);return}
  V.i++;while(ls[V.i]&&ls[V.i].who==='choice'&&ls[V.i-1]&&ls[V.i-1].who==='choice')V.i++;   // 選項之後跳過其他選項
  stVnEnter();
}
// 內容：**字**＝強調（粗體、亮色）
const stTxt=t=>esc(stSub(t).replace(new RegExp(ST_PAUSE.source,'g'),'')).replace(/\*\*(.+?)\*\*/g,'<b class="svem">$1</b>');
const stSub=t=>String(t||'').replace(/\{(num|編號)\}/g,STY.num).replace(/\{(name|玩家名字|玩家名稱|名字)\}/g,META.pname||TEXT.misc.defPlayer);
function stVn(D){
  const V=SUI.vn,ls=V.ev.lines,L=ls[V.i],T=stT();if(!L)return '';
  const fx=V.fx||[],bg=V.bg||STORY_HOME.plan,lay=(b,c)=>b==='black'||!b?`<div class="svbg svblack${c}"></div>`:`<img class="svbg${c}" alt="" src="${esc(stBg(b,true))}">`;
  if(V.scr){   // 教學：畫面本身就是背景（不畫背景圖）；立繪＝右下角的小助手（從對話框右上角冒出來，v0.40.49）
    let h=`<div class="svn guide${fx.includes('shake')?' a-fail':''}">`;
    const hp=V.helper||(V.chr&&!stIsLarva(V.chr)?V.chr:null);
    return h+stVnDlg(V,L,T,hp)+stVnHelp(V,hp)+stVnTop(V)+'</div>';
  }
  const z=V.bgWalk?` svwalk" style="animation-delay:-${Math.round(performance.now()-(V.tl||0))}ms`:V.bgZ?' svzoom':'';   // 往前走：放大後維持到換背景
  let h=`<div class="svn${fx.includes('shake')?' a-fail':''}">`+(V.bgFade?lay(V.bgPrev,'')+lay(bg,' svfade'+z):bg==='black'?'':lay(bg,z));
  const two=V.chr&&V.chl,talk=k=>k&&L.who&&k.startsWith(L.who+'_'),isL=stIsLarva;
  // 立繪的演出：說話的人（旁白時＝右邊那個；右邊是小球就換左邊）；hop 跳一下｜crouch 蹲下再起來｜sway 晃一晃
  const narrK=V.chr&&!isL(V.chr)?V.chr:V.chl;
  //   演出後面寫 :L／:R（總表「:左」「:右」）＝指定左／右立繪，不管誰說話（v0.40.51）
  const mv=(v,k)=>{const def=talk(v)||!two||(L.who==='narr'&&v===narrK);let c='';
    [['hop','a-ok'],['crouch','a-crouch'],['squat','a-squat'],['sway','a-sway']].forEach(([x,cl])=>fx.forEach(f=>{const [b,t]=f.split(':');if(b===x&&(t?(t==='L')===(k==='chl'):def))c+=' '+cl}));
    if(V.fallen&&V.fallen[k])c+=V.fallA===k?' a-fall':' fallen';   // 晃一晃倒下（v0.40.61）
    return c};
  // 出場：預設淡入；runL／runR＝從左／右邊畫面外跑進來；walkL／walkR＝走進來（面向走的方向）
  //   退場：leaveL／leaveR＝往左／右走出畫面（面向走的方向，下一句起收掉）
  const walk=fx.includes('walkL')?'L':fx.includes('walkR')?'R':'',lvDir=(V.fxAll||fx).some(x=>/^leaveL(:|@|$)/.test(x))?'L':'R';
  const ent=on=>on?(fx.includes('runL')?' a-runL':fx.includes('runR')?' a-runR':walk?' a-walk'+walk:' svin'):'';
  const lvc=k=>V.leave===k?' a-leave'+lvDir:'';
  // 畫面重畫（例：逐字打完）時動畫不要重來：從這句開始算已經過了多久
  const dl=(k,on)=>(on||V.leave===k)?` style="animation-delay:-${Math.round(performance.now()-(V.tl||V.t0))}ms"`:'';   // 從這一句開始算（點出下一段時進場／走開不重播，v0.40.51）
  const slot=(k,on)=>{const v=V[k];if(!v)return '';const side=k==='chl';if(V.leave===k)on=false;   // 走開的人不再淡入
    if(/^larvae:\d$/.test(v)){let g='';V.lvLook=V.lvLook||{};const now=performance.now();   // 一群小球（v0.40.49）：那一側站 n 隻，顏色隨機（這段劇情裡不變）；動作見 V.lv
      for(let i=0;i<+v.slice(7);i++){const key=(side?'L':'R')+(i+1),a=V.lv&&(V.lv[key]||V.lv['*']),look=V.lvLook[key]||(V.lvLook[key]=stLarvaCol());
        const lvg=V.leave===k;   // 這一群走開（例 小球們一哄而散）
        g+=`<canvas class="slarva svlarva svlg${ent(on)}${lvg?lvc(k):a?' a-lv'+a.a:''}" data-look="${look}" data-pose="${a&&a.a==='sleep'?'rest':a&&a.a==='wave'?'reach_a':'idle_a'}" width="192" height="192" style="${side?'left':'left:auto;right'}:${D?16+i*10:4+i*14}%;animation-delay:-${Math.round(now-(lvg?(V.tl||V.t0):a?a.t0:V.t0))}ms"></canvas>`}
      return stMvWrap(V,k,g,true)}
    if(isL(v))return stMvWrap(V,k,`<canvas class="slarva svlarva svlslot ${side?'svlslotL':'svlslotR'}${ent(on)}${lvc(k)}${fx.includes('larvaSway')?' a-lsway':''}" data-pose="${esc(v.split(':')[1]||'curl')}" width="192" height="192"${dl(k,on)}></canvas>`,true);
    let im=side?stFaceR(v):v;
    if(V.leave===k)im=lvDir==='L'?stFaceL(v):stFaceR(v);else if(on&&walk)im=walk==='L'?stFaceR(v):stFaceL(v);
    const x=`<img class="svchr${side?' svchl':''}${two?' two':''}${mv(v,k)}${ent(on)}${lvc(k)}${two&&L.who!=='narr'&&L.who!=='choice'&&!talk(v)&&!isL(V[side?'chr':'chl'])?' off':''}" alt="" ${(a=>{const d=dl(k,on);return !d?a:a.includes(' style="')?a.replace(' style="',d.slice(0,-1)+';'):a+d})(chrAttr(im))}>`;
    // 右立繪移到左邊（後層）／滑回右邊（v0.40.61）：包一層從右到左的軌道，left 和 translateX 一起動
    return stMvWrap(V,k,x,false)};
  const out=(v,side)=>/^larvae:/.test(v)?'':isL(v)?`<canvas class="slarva svlarva svlslot ${side?'svlslotL':'svlslotR'} svout" data-pose="${esc(v.split(':')[1]||'curl')}" width="192" height="192"></canvas>`
    :`<img class="svchr${side?' svchl':''} svout${two?' two':''}" alt="" ${chrAttr(side?stFaceR(v):v)}>`;
  if(bg!=='black'){   // 全黑畫面：人物、小球都不畫（狀態留著，換回背景再出現）
    if(V.outL)h+=out(V.outL,true);
    if(V.outR)h+=out(V.outR,false);
    h+=slot('chl',V.inL)+slot('chr',V.inR);
    if(V.larva)h+=stLarva('','svlarva'+(two?' two':'')+(fx.includes('larvaSway')?' a-lsway':''));   // 兩個人時小球在正中間
  }
  const bf=fx.find(x=>x.startsWith('bigFace'));   // 大臉飄過（v0.40.49）：那個人的頭像，半透明地從左上飄過
  if(bf){const w=bf.split(':')[1]||L.who,im=STORY_NPC[w]?STORY_NPC[w].img:w;   // 對象＝人物（用他的 _L_0）或圖名（例 yanjie_L_6）；只擷取頭部、邊緣淡化
    if(im)h+=`<div class="svbigface" style="animation-delay:-${Math.round(performance.now()-V.t0)}ms"><img alt="" ${chrAttr(im)}></div>`}
  if(fx.includes('flash'))h+='<div class="svflash"></div>';
  h+=stVnDlg(V,L,T,V.helper)+stVnHelp(V,V.helper)+stVnTop(V);
  return h+'</div>';
}

// 立繪移動（v0.40.62）：不在原位或這句在移動的那一格，包一層軌道（兩格立繪之間）
//   圖片：left＝x×軌道寬、translateX＝−x×自己的寬（x 0＝貼左格、1＝貼右格）｜小球（一群或單隻）：整群平移 (x−原位)×軌道寬
function stMvWrap(V,k,inner,lv){const home=k==='chr'?'R':'L',p=(V.pos&&V.pos[k])||home,a=V.mvA&&V.mvA[k];if(p===home&&!a)return inner;
  const P=ST_POS[p],x0=a?ST_POS[a[0]].x:P.x,dl=`--dl:-${Math.round(performance.now()-(V.tl||0))}ms`;
  if(lv){const h0=ST_POS[home].x,n=/^larvae:(\d)/.test(V[k])?+V[k].slice(7):1;return `<div class="svlgw${a?' mving':''}" style="--x0:${x0-h0};--x1:${P.x-h0};--n:${n};z-index:${P.z};${dl}">${inner}</div>`}
  return `<div class="svmv" style="z-index:${P.z}"><div class="svmb${a?' mving':''}" style="--x0:${x0};--x1:${P.x};${dl}">${inner}</div></div>`}
// 對話框（或選項）
// hp＝右下角的小助手：從畫面下緣冒出來，露出整張圖的 V.helperPct%（從上面算），擋住對話框右邊一點（對話框的字縮短，不會被擋到）。教學的格蕾特、helperIn
const stVnHelp=(V,hp)=>hp?`<div class="svhelp${V.helperIn?' in':''}${V.helperOut?' out':''}" style="--hp:${(V.helperPct||60)/100};--dl:-${Math.round(performance.now()-(V.tl||0))}ms"><img alt="" ${chrAttr(hp)}></div>`:'';
function stVnDlg(V,L,T,hp){const ls=V.ev.lines,fx=V.fx||[];let h='';
  if(L.who==='choice'){
    const ch=[];for(let j=V.i;ls[j]&&ls[j].who==='choice';j++)ch.push(j);
    // 選項出來時，上一句的對話框留著（不能點）
    let pj=V.i-1;while(pj>=0&&ls[pj].who==='choice')pj--;const P=ls[pj];
    if(P&&V.lastFull){const who=P.who==='narr'||!P.who?'':P.who==='player'?(META.pname||TEXT.misc.defPlayer):(T.npc[P.who]?T.npc[P.who].n:P.who);
      h+=`<div class="svdlg still${hp?' hhelp'+(V.helper===hp&&(V.helperPct||60)<=45?' hlow':''):''}">${who?`<span class="svwho">${esc(who)}</span>`:''}${P.who==='player'?`<span class="svava">${stHead(P.face||'','svhead')}</span>`:''}<p class="${who?'':'svnarr'}">${stTxt(V.lastFull).replace(/\n/g,'<br>')}</p></div>`;}
    h+=`<div class="svchoices">${ch.map(j=>`<button data-vnc="${j}">${stTxt(ls[j].text)}</button>`).join('')}</div>`;
  }else{
    const who=L.who==='narr'||!L.who?'':L.who==='player'?(META.pname||TEXT.misc.defPlayer):(T.npc[L.who]?T.npc[L.who].n:L.who);
    // 多行：只顯示到第 k 個有字的行（空行照樣留空隙）
    //   head＝已經出完的部分，cur＝這次新出的那一行（逐字模式：一個字一個字出來）
    let head=V.carry||'',cur=String(L.text||'').replace(new RegExp(ST_PAUSE.source,'g'),'');
    if(!V.fxAll.includes('all')){const u=stUnits(L.text),k=Math.min(V.k,u.length);
      head+=u.slice(0,k-1).map(x=>x.pre+x.t).join('');cur=u[k-1].pre+u[k-1].t;}
    V.typing=ST_TXT==='type'&&V.tk<V.k;
    const body=stTxt(head).replace(/\n/g,'<br>')+(V.typing?stTypeHTML(cur):stTxt(cur).replace(/\n/g,'<br>'));
    h+=`<div class="svdlg${V.dtop?' top':''}${hp&&!V.dtop?' hhelp'+(V.helper===hp&&(V.helperPct||60)<=45?' hlow':''):''}" data-act="vnext">${who?`<span class="svwho">${esc(who)}</span>`:''}${L.who==='player'?`<span class="svava">${stHead(L.face||'','svhead')}</span>`:''}<p class="${who?'':'svnarr'}">${body}</p><span class="svnx">▼</span></div>`;
  }
  return h;}
// 畫面上層：好感提示、預覽的句號、跳過
function stVnTop(V){let h='';
  if(ST_FAVPOP.length)h+=`<div class="svfavs">${ST_FAVPOP.map(x=>`<div class="svfav${x.bad?' bad':''}" data-id="${x.id}" style="animation-delay:-${Math.round(performance.now()-x.t0)}ms">${esc(x.t)}</div>`).join('')}</div>`;
  if(!ST_REPLAY)h+=`<button class="svskip" data-act="vskip">${esc(stT().skip)}</button>`;
  if(ST_REPLAY)h+=`<button class="svpvx" data-act="rpquit">${esc(stT().diaryQuit)}</button>`;
  if(ST_PV)h+=`<span class="svpvno">${esc(V.ev.id)} #${V.i+1}</span>`;   // 預覽：跳過＝結束這段（不另外放「結束預覽」）   // 預覽：左上顯示句號（和總表「句號」欄一樣）
  return h;}
// 跳過這段劇情：照預設路線（選項選第一個）把還沒算的數值變化算完，直接結束這段
function stVnSkip(){const V=SUI.vn;if(!V)return;const ls=V.ev.lines;let i=V.i,first=true,n=0;
  while(i<ls.length&&n++<999){const L=ls[i];
    if(L.who==='cond'){i=stCondJump(ls,i);continue}
    if(L.who==='choice'){if(L.eff)stEff(L.eff);const j=L.go==='end'?ls.length:L.go?ls.findIndex(l=>l.tag===L.go):i+1;i=j<0?ls.length:j;first=false;continue}
    if(!first&&L.eff)stEff(L.eff);first=false;
    if(L.go){const j=L.go==='end'?ls.length:ls.findIndex(l=>l.tag===L.go);i=j<0?ls.length:j}else i++;}
  clearInterval(ST_TW);const d=V.done;SUI.vn=null;stRender();d();}
// 日記本：重看看過的劇情（ST_REPLAY：不加數值、不記錄，看完回到日記本）
let ST_REPLAY=false;
function stReplay(id){const ev=STORY_SCRIPT.find(x=>x.id===id);if(!ev)return;ST_REPLAY=true;ST_FAVPOP=[];
  stPlay([ev],stReplayEnd);}
function stReplayEnd(){clearInterval(ST_TW);SUI.vn=null;ST_REPLAY=false;SUI.scr='bag';SUI.btab='diary';stRender()}
// ---------- 劇情預覽（不動到存檔）：日常的開發者模式 →「劇情預覽」（v0.40.69 起沒有預覽頁了）----------
let ST_PV=false;
function stPvMenu(){const T=stT().pv;
  const evs=STORY_SCRIPT.filter(x=>x.lines.length);
  pick(T.title,[{node:stTxtNode()},{rule:true},...evs.map(e=>({id:e.id,label:e.id+'　'+(e.note||'')}))],k=>stPvPlay(k),T.body);}
// id＝事件編號，或直接給一個事件（匯入的、試播用的）；after＝播完要回哪裡（預設回清單）
function stPvPlay(id,after){
  const ev=typeof id==='object'?id:STORY_SCRIPT.find(x=>x.id===id);if(!ev)return;ST_PV_AFTER=after||null;
  ST_PV=true;$('ovPick').classList.remove('show');if(!META.doll)META.doll=dollDef();
  STY=storyNew();SUI.scr='home';SUI.sched=stFixedFill();SUI.sel=0;SUI.greteOn=false;STRUN=null;STORY_DOLL={};ST_FAVPOP=[];
  $('ovStory').classList.add('show');document.body.classList.add('story');
  dollLoad().then(()=>{ST_DOLL_OK=true;STORY_DOLL={};stRender()});
  stPlay([ev],stPvEnd);
}
let ST_PV_AFTER=null;
function stPvEnd(){storyClose();ST_PV=false;STY=null;const f=ST_PV_AFTER;ST_PV_AFTER=null;(f||stPvMenu)()}

