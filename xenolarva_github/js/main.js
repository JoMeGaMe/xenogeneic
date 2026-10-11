// ===== 啟動：按鈕事件綁定、開局選色、開始與重新開始、說明／圖鑑選單 =====
// ---------- 遊戲指令按鈕（用 () => 包起來，確保點下去時才呼叫）----------
$('bWater').onclick=()=>actWater();$('bFeed').onclick=()=>actFeed();$('bPlay').onclick=()=>actPlay();
$('bOut').onclick=()=>actOut();$('bBag').onclick=()=>actBag();
// 結束今日：第一次按先變成「再按一次」，4 秒內再按才真的換日（不跳視窗）
(()=>{let armed=0,tm=null;const b=$('end');
  const reset=()=>{armed=0;clearTimeout(tm);b.textContent='結束今日';b.classList.remove('arm')};
  b.onclick=()=>{
    if(!armed){armed=1;b.textContent=S.ap>0?`再按一次結束今日（還有 ${S.ap} 次行動）`:'再按一次結束今日';b.classList.add('arm');tm=setTimeout(reset,4000);return}
    reset();settle();
  };
})();
// 格蕾特小助手與翻譯開關
$('bGrete').onclick=()=>{S.grete=!S.grete;if(!S.grete)S.trans=false;say(S.grete?TEXT.grete.on:TEXT.grete.off,'ev');refresh();if(S.grete)greteDaily()};
$('bTrans').onclick=()=>{S.trans=!S.trans;say(S.trans?TEXT.grete.transOn:TEXT.grete.transOff,'ev');refresh()};

// ---------- 開局：選代表色 ----------
function markSw(){[...$('sw').children].forEach(b=>b.className=b.dataset.c===selColor?'sel':'')}
function setColor(c){selColor=c;$('cp').value=c;$('hex').value=c;$('hex').style.borderColor='';markSw()}
COLORS.forEach((c,i)=>{
  const b=document.createElement('button');
  b.style.background=c;b.dataset.c=c;b.title=CNAME[i];b.setAttribute('aria-label',CNAME[i]);
  b.onclick=()=>setColor(c);$('sw').appendChild(b);
});
$('cp').oninput=e=>setColor(e.target.value);
$('hex').oninput=e=>{
  const c=parseColor(e.target.value);
  if(c){selColor=c;$('cp').value=c;e.target.style.borderColor='';markSw()}else e.target.style.borderColor='#ff8a6b';
};
$('hex').onchange=()=>{$('hex').value=selColor;$('hex').style.borderColor=''};
setColor(selColor);
// 玩家名字與代表色跨周目繼承：上次用的會自動填入
function prefillPlayer(){if(typeof META==='undefined')return;if(META.pname)$('pn').value=META.pname;if(META.pcol)setColor(META.pcol)}
prefillPlayer();

// ---------- 開始／重新開始 ----------
$('go').onclick=()=>{
  const pn=$('pn').value.trim()||'玩家';
  try{META.pname=pn.slice(0,8);META.pcol=selColor;codexSave()}catch(e){}
  $('ovStart').classList.remove('show');
  newGame(pn,$('nm').value.trim()||'小球',selColor);
};
$('again').onclick=()=>{$('ovEnd').classList.remove('show');$('ovStart').classList.add('show')};

// ---------- 說明／圖鑑選單（三頁：說明與存檔、收藏、小球們）----------
if(typeof ABOUT_HTML!=='undefined')$('aboutBody').innerHTML=ABOUT_HTML;
['bMenu','sMenu'].forEach(i=>$(i).onclick=()=>openMenu('larvae'));
$('eLarvae').onclick=()=>openMenu('larvae');
[...$('mtabs').children].forEach(b=>{b.onclick=()=>showTab(b.getAttribute('data-tab'))});
$('menuClose').onclick=()=>$('ovMenu').classList.remove('show');
document.addEventListener('keydown',e=>{if(e.key==='Escape')['ovMenu','ovPick','ovBag'].forEach(i=>$(i).classList.remove('show'))});
$('cDown').onclick=()=>codexDownload();
$('cUp').onchange=e=>{const f=e.target.files[0];if(f)f.text().then(codexMerge);e.target.value=''};
$('cImport').onclick=()=>codexMerge($('saveText').value);
$('ver').textContent='v'+VERSION;
// 清除存檔：第一次按先變成「再按一次確認」，4 秒內再按才真的清除
(()=>{let t=0,tm=null;const b=$('cWipe');
  const reset=()=>{t=0;b.textContent='清除存檔';b.className='danger'};
  b.onclick=()=>{
    if(!t){t=1;b.textContent='再按一次確認（無法復原）';b.className='danger arm';tm=setTimeout(reset,4000);return}
    clearTimeout(tm);reset();codexWipe();
  };
})();
