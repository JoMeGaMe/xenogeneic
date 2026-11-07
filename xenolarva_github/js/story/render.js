// ===== 主線 render.js：畫面重畫 stRender、點擊 stClick、拖曳／縮放 =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

let ST_TOAST_T=0;function stFlash(m){SUI.toast=m;stRender();clearTimeout(ST_TOAST_T);ST_TOAST_T=setTimeout(()=>{SUI.toast='';stRender()},1800)}
function stRender(){
  const box=$('ovStory');if(!box||!STY||!box.classList.contains('show'))return;
  const D=innerWidth/innerHeight>=.8;           // 電腦／橫放 or 手機直放
  const W=D?1280:390,H=D?720:Math.max(640,Math.round(innerHeight*390/innerWidth));
  const sc=D?Math.min(innerWidth/W,innerHeight/H):innerWidth/W;
  const day=stDayLook();                         // 早上／晚上的配色（系統 → 設定；隨時間變化＝執行這週、自由行動是早上，排行程的家是晚上）
  const bn=STRUN&&STRUN.i<7&&STRUN.res[STRUN.i]?STRUN.res[STRUN.i].big:STORY_HOME.plan;
  const fx=!D&&bn.startsWith('home')?(SUI.bgx??STORY_FOCUS[bn]??50):50;
  const fade=STRUN&&STRUN.i<7&&STRUN.res[STRUN.i]&&STRUN.phase===0&&STRUN.bgFade,pb=fade?(STRUN.i?STRUN.res[STRUN.i-1].big:STORY_HOME.plan):'';
  let h=fade?`<img class="sbg" alt="" draggable="false" src="${stBg(pb,true)}" style="object-position:${!D&&pb.startsWith('home')?(SUI.bgx??STORY_FOCUS[pb]??50):50}% 50%">`:'';
  h+=`<img class="sbg${fade?' sfadein':''}" alt="" draggable="false" src="${stBg(bn,true)}" style="object-position:${fx}% 50%">`;
  if(STRUN&&STRUN.free)h=stFree(D,W,H);
  else{
    h+=stHome(D);
    if(!STRUN){if(SUI.scr==='plan')h+=stPlan(D);if(SUI.scr==='stat')h+=stStat(D);if(SUI.scr==='bag')h+=stBag(D);if(SUI.scr==='tank')h+=stTank(D);}
    h+=stChrome(D);
    if(STRUN)h+=stRun(D);
  }
  if(SUI.vn)h+=stVn(D);
  if(SUI.over==='mid'){const M=stT().mid;h=`<div class="sover"><b>${esc(fmt(M.title,{ch:stT().chapter[STY.ch]||''}))}</b><div><button data-act="midsave"${SUI.midSaved?' disabled':''}>${esc(SUI.midSaved?M.saved:M.save)}</button><button data-act="overleave">${esc(stT().over.leave)}</button></div></div>`}   // 章末：中繼存檔
  else if(SUI.over)h=`<div class="sover"><b>${esc(stT().over.title)}</b><div><button data-act="overload">${esc(stT().over.load)}</button><button data-act="overleave">${esc(stT().over.leave)}</button></div></div>`;   // 遊戲結束（負債、月底評估沒過）
  if(SUI.loading)h=`<div class="svload"><span class="svlw"><span class="svlb">${[1,2,3].map(i=>`<img alt="" src="${assetImg('loading_'+i)}">`).join('')}</span>${esc(stT().loading)}</span></div>`;   // 讀取中：跳跳小球（三格輪播，v0.40.69）   // 讀取中：整個畫面黑的（不要先閃出底下的行程動畫）
  if(SUI.toast)h+=`<div class="stoast">${esc(SUI.toast)}</div>`;
  let st=box.querySelector('.sstage');if(!st){st=h_('div','sstage');box.append(st)}
  st.className='sstage '+(D?'sD':'sP')+(day?' pday':'');document.body.classList.toggle('storyday',day);st.style.width=W+'px';st.style.height=H+'px';
  st.style.transform=`translate(${Math.round((innerWidth-W*sc)/2)}px,${D?Math.round((innerHeight-H*sc)/2):0}px) scale(${sc})`;
  // 重畫時捲動位置不要跳回最上面（v0.40.64：點行程表的指令、道具清單等）：同一個 class 的捲動區照順序還原
  const all0=[...st.querySelectorAll('*')],same=(L,c)=>L.filter(x=>x.className===c);
  const keep=all0.filter(e=>e.scrollTop>0&&!e.matches('.svdlg p')).map(e=>[e.className,same(all0,e.className).indexOf(e),e.scrollTop]);
  st.innerHTML=h;st.dataset.s=sc;stPaint(st);
  if(keep.length){const all1=[...st.querySelectorAll('*')];keep.forEach(([cls,i,top])=>{const e=same(all1,cls)[i];if(e)e.scrollTop=top})}box.scrollTop=box.scrollLeft=st.scrollTop=st.scrollLeft=0;
  const dp=st.querySelector('.svdlg p');if(dp){const sv=SUI.vn&&SUI.vn.scroll||0;dp.scrollTop=sv;requestAnimationFrame(()=>{stScrollDlg(dp,SUI.vn&&SUI.vn.typing?dp.querySelector('.tw'):null)})}   // 對話框固定高度：從上次的位置慢慢捲到最新一行
  if(SUI.vn&&SUI.vn.typing)stTypeStart();else clearInterval(ST_TW);
  stGuideDim(st);
  if(st.querySelector('canvas.stanklv'))stTankLoop();
}
function h_(tag,cls){const e=document.createElement(tag);e.className=cls;return e}

// ---------- 操作 ----------
function stClick(e){
  if(STRUN&&STRUN.free&&!SUI.vn){   // 自由行動；白天的家（stHub）只有中間的按鈕歸自由行動管，旁邊的按鈕照平常
    if(!stHub()||e.target.closest('[data-fk],[data-fact]')){stFreeClick(e);return}
    if(STRUN.free.sel&&!e.target.closest('.sfcard')){STRUN.free.sel=null;stRender()}}
  const t=e.target.closest('[data-vnc],[data-encpop],[data-go],[data-day],[data-cmd],[data-tab],[data-stab],[data-btab],[data-act],[data-diary],'+WARD_SEL);if(!t)return;
  const d=t.dataset,T=stT();
  if(SUI.loading)return;
  if(SUI.over){if(d.act==='overload')storyLoadMenu();if(d.act==='overleave')storyClose();
    if(d.act==='midsave'&&!SUI.midSaved){const T=stT().start,F=META.storyFree||[null,null,null];   // 選一格存（3 格）
      pick(stT().mid.save,[0,1,2].map(i=>({id:i,label:stFreeLabel(F[i],i)})),i=>{F[i]=storyFreeMake(i);META.storyFree=F;codexSave();SUI.midSaved=true;stFlash(fmt(stT().mid.savedToast,{n:i+1}))})}return}
  if(SUI.vn){
    if(d.act==='rpquit'){stReplayEnd();return}
    if(d.act==='vskip'){const T=stT();pick(T.skipAsk,[{id:'y',label:T.skipYes,main:true},{id:'n',label:T.skipNo}],k=>{if(k==='y')stVnSkip()},T.skipBody);return}
    const V=SUI.vn;if(performance.now()-V.t0<250)return;   // 換句後 0.25 秒內的點擊不算（避免連點跳過一句）
    if(d.act==='vnext'){if(V.typing){stTypeDone();return}
      if(stVnMore()){const dp=document.querySelector('#ovStory .svdlg p');V.scroll=dp?dp.scrollTop:0;V.k++;V.fx=stFxAt(V,V.k);V.bgFade=false;V.inR=V.inL=false;V.outR=V.outL=null;V.t0=performance.now();stRender()}else stVnNext()}
    else if(d.vnc!=null){const L=SUI.vn.ev.lines[+d.vnc];if(L.eff)stEff(L.eff,true);stVnNext(L.go||'end')}return}
  if(d.encpop){e.stopPropagation();SUI.encPop=SUI.encPop===d.encpop?null:d.encpop;stRender();return}
  if(d.act==='use'){stUseItem(d.k);return}
  if(d.act==='dlock'){META.storyDiaryHide=!META.storyDiaryHide;codexSave();stRender();return}   // 日記本：顯示／隱藏還沒觸發的
  if(d.act==='skip'){e.stopPropagation();stSkip();return}
  if(d.act==='tap'){stTap();return}
  if(d.act==='weekok'){if(STRUN&&STRUN.i>=7)stWeekDone();return}   // 結算框還沒收掉時連按：不再算一次
  if(STRUN&&!stHub())return;
  if(d.act==='tip'){SUI.tip++;stRender();return}
  if(d.go){
    if(d.go==='grete'){SUI.greteOn=!SUI.greteOn;stRender();return}
    if(d.go==='sys'){stSys();return}
    if(d.go==='leave'){storyLeaveAsk();return}
    if(d.go==='run'){stStartRun();return}
    SUI.scr=SUI.scr===d.go?'home':d.go;SUI.encPop=null;stRender();
    if(SUI.scr!=='home'){const ev=stEvents('open',SUI.scr);if(ev.length)stPlay(ev,stDoneKeep)}return}
  if(d.day!=null){const i=+d.day;if(i<=stPlanLo())return;SUI.sched[i]='';SUI.sel=i;if(stHub())stHubSync();stRender();return}   // 週中途：今天以前不能改
  if(d.cmd){const c=STORY_CMDS[d.cmd],ev=stEvents('pick',d.cmd),tip=()=>{if(ev.length)stPlay(ev,stDoneKeep)};
    if(stFixed(c)){c.fixed.forEach(x=>SUI.sched[x]=d.cmd);stFlash(fmt(T.fixedToast,{cmd:stCmdName(d.cmd),days:c.fixed.map(x=>ST_DAYS()[x]).join('、')}));tip();return}
    if(SUI.sel<=stPlanLo())return;SUI.sched[SUI.sel]=d.cmd;const nx=SUI.sched.findIndex((x,j)=>!x&&j>stPlanLo());if(nx>=0)SUI.sel=nx;if(stHub())stHubSync();stRender();tip();return}
  if(d.tab){SUI.tab=d.tab;SUI.encPop=null;stRender();return}
  if(d.stab){SUI.stab=d.stab;stRender();return}
  if(d.btab){SUI.btab=d.btab;stRender();return}
  if(wardClick(t,v=>{SUI.wtab=v})){stRender();return}   // 衣櫃（js/wardrobe.js）
  if(d.act==='tankpoke'){stTankPoke(e);return}
  if(d.diary){stReplay(d.diary);return}
  if(d.act==='undo'){const f=stFixedFill(),lo=stPlanLo();SUI.sched=SUI.sched.map((x,j)=>j<=lo?x:f[j]);SUI.sel=Math.min(6,lo+1);if(stHub())stHubSync();stRender();return}
  if(d.act==='ok'){SUI.scr='home';const n=SUI.sched.filter((x,j)=>!x&&j>stPlanLo()).length;stFlash(n?fmt(T.okToastFree,{n}):T.okToast);return}
}
$('ovStory').addEventListener('click',stClick);
// 衣櫃：自己選顏色、褲襪透明度（放開才套用：重畫會換掉輸入框）
$('ovStory').addEventListener('change',e=>{const t=e.target;if(STRUN)return;
  if(wardChange(t))stRender()});
addEventListener('resize',()=>{if($('ovStory').classList.contains('show'))stRender()});
// 手機直放：左右拖家裡的背景（人物不動）
(()=>{const box=$('ovStory');let sx=null,sb=0;
  box.addEventListener('pointerdown',e=>{const st=box.querySelector('.sstage');if(!st||!st.classList.contains('sP')||SUI.scr!=='home'||(STRUN&&!stHub())||e.target.closest('button,.sbub,.sfhub'))return;
    sx=e.clientX;sb=SUI.bgx??STORY_FOCUS[STORY_HOME.plan]??50;});
  box.addEventListener('pointermove',e=>{if(sx==null)return;const st=box.querySelector('.sstage'),img=st&&st.querySelector('.sbg');if(!img||!img.naturalWidth)return;
    const s=+st.dataset.s||1,over=img.naturalWidth*(st.offsetHeight/img.naturalHeight)-st.offsetWidth;if(over<=0)return;
    SUI.bgx=clamp(sb-(e.clientX-sx)/s/over*100);img.style.objectPosition=SUI.bgx+'% 50%';});
  const up=()=>{sx=null};box.addEventListener('pointerup',up);box.addEventListener('pointercancel',up);box.addEventListener('pointerleave',up);
})();
// 自由行動：拖地圖／房間（電腦上下、手機左右；超過 6px 才算拖，放開後那一下點擊不算）
(()=>{const box=$('ovStory');let s=null;
  box.addEventListener('pointerdown',e=>{const m=e.target.closest('.sfmap');if(!m||e.target.closest('button')||!STRUN||!STRUN.free)return;
    const F=STRUN.free;s={x:e.clientX,y:e.clientY,o:{...F.off[F.scr]},m,moved:false}});
  box.addEventListener('pointermove',e=>{if(!s)return;const st=box.querySelector('.sstage'),k=+st.dataset.s||1,F=STRUN&&STRUN.free;if(!F)return;
    const dx=(e.clientX-s.x)/k,dy=(e.clientY-s.y)/k;if(!s.moved&&Math.hypot(dx,dy)<6)return;s.moved=true;
    const o={x:clamp(s.o.x+dx,st.offsetWidth-s.m.offsetWidth,0),y:clamp(s.o.y+dy,st.offsetHeight-s.m.offsetHeight,0)};F.off[F.scr]=o;s.m.style.transform=`translate(${o.x}px,${o.y}px)`});
  const up=()=>{if(s&&s.moved)ST_FDRAG=true;s=null;setTimeout(()=>{ST_FDRAG=false},0)};box.addEventListener('pointerup',up);box.addEventListener('pointercancel',up);
})();
// 舞台不能被捲動（點到畫面外的名牌時，瀏覽器會自己把 overflow:hidden 的框捲過去）
$('ovStory').addEventListener('scroll',e=>{const t=e.target;if((t.id==='ovStory'||(t.classList&&t.classList.contains('sstage')))&&(t.scrollTop||t.scrollLeft)){t.scrollTop=0;t.scrollLeft=0}},true);   // 只管外框和舞台，裡面的清單照常捲
// 第 0 日的入口按鈕
$('bStory').onclick=storyOpen;
