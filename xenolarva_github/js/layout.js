// ===== 版面：右上角 ☰ 選單（電腦、手機都有）、設定與存檔的跳段按鈕、手機版底部固定的行動區 =====
// 樣式在 css/style.css 最後一段；文字在 TEXT.layout。

// ---------- ☰ 選單：順序與文字在 TEXT.layout.ham（版本號在左上角，連點 5 次＝開發者模式）----------
const HAM_DO={watch:()=>pvEnter()};
function hamClose(){$('hamMenu').hidden=true;$('bHam').setAttribute('aria-expanded','false')}
function hamOpen(){
  const m=$('hamMenu');m.textContent='';
  const who=h('div',{class:'hwho'},META.pname||'');paintName(who,META.pcol||'');
  m.append(who,...TEXT.layout.ham.map(([k,label])=>h('button',{onclick:()=>{hamClose();(HAM_DO[k]||(()=>openMenu(k)))()}},label)));
  m.hidden=false;$('bHam').setAttribute('aria-expanded','true');
}
$('bHam').onclick=e=>{e.stopPropagation();$('hamMenu').hidden?hamOpen():hamClose()};
document.addEventListener('click',e=>{if(!$('hamMenu').hidden&&!e.target.closest('#hamMenu'))hamClose()});

// ---------- 「設定與存檔」頁：上方兩顆按鈕＝跳到該段（同一頁捲動），捲動時按鈕跟著亮 ----------
const JUMP_SECS=['secSet','secSave'];
function jumpOn(){
  const pg=$('pg_save'),top=pg.scrollTop+$('saveTabs').offsetHeight+8;
  let cur=JUMP_SECS[0];JUMP_SECS.forEach(id=>{if($(id).offsetTop<=top)cur=id});
  if(pg.scrollTop+pg.clientHeight>=pg.scrollHeight-2)cur=JUMP_SECS[JUMP_SECS.length-1];
  $('saveTabs').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.to===cur));
}
function jumpTo(id,smooth){
  const pg=$('pg_save');
  pg.scrollTo({top:Math.max(0,$(id).offsetTop-$('saveTabs').offsetHeight-6),behavior:smooth?'smooth':'auto'});
  setTimeout(jumpOn,smooth?400:0);
}
// 最後一段至少一頁高，才捲得到最上面；sec＝打開時要跳到的段落
function jumpFit(sec){
  const pg=$('pg_save'),last=$(JUMP_SECS[JUMP_SECS.length-1]);
  last.style.minHeight=Math.max(0,pg.clientHeight-$('saveTabs').offsetHeight-8)+'px';
  if(sec)jumpTo(sec,false);else jumpOn();
}
$('saveTabs').querySelectorAll('button').forEach(b=>{b.onclick=()=>jumpTo(b.dataset.to,true)});
$('pg_save').addEventListener('scroll',jumpOn);

const mobileQ=window.matchMedia?window.matchMedia('(max-width:759px)'):{matches:false};

// ---------- 底部行動區的高度 → CSS 變數 --actsH（主畫面留出空間、水缸依剩下的高度縮放）----------
// 下一格畫面才更新，避免 ResizeObserver 在同一格裡反覆觸發
let actsRaf=0;
function actsFit(){cancelAnimationFrame(actsRaf);actsRaf=requestAnimationFrame(()=>{const a=$('acts');document.documentElement.style.setProperty('--actsH',(mobileQ.matches?a.offsetHeight:0)+'px')})}
if(window.ResizeObserver)new ResizeObserver(actsFit).observe($('acts'));
addEventListener('resize',actsFit);actsFit();
