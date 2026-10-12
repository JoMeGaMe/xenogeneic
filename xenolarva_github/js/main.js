// ===== 啟動：按鈕事件綁定、開局選色、開始與重新開始、說明／圖鑑選單 =====
// ---------- 遊戲指令按鈕（用 () => 包起來，確保點下去時才呼叫）----------
$('bWater').onclick=()=>actWater();$('bFeed').onclick=()=>actFeed();$('bPlay').onclick=()=>actPlay();$('bChat').onclick=()=>chatOpen();
$('bOut').onclick=()=>goOut();$('bBag').onclick=()=>actBag();
// 結束今日：第一次按先變成「再按一次」，4 秒內再按才真的換日（不跳視窗）
(()=>{let armed=0,tm=null;const b=$('end');
  const reset=()=>{armed=0;clearTimeout(tm);b.textContent=TEXT.ui.end;b.classList.remove('arm')};
  b.onclick=()=>{
    if(!armed){armed=1;b.textContent=S.ap>0?`再按一次結束今日（還有 ${S.ap} 次行動）`:'再按一次結束今日';b.classList.add('arm');tm=setTimeout(reset,4000);return}
    reset();gameStop();settle();
  };
})();
// 格蕾特小助手與翻譯開關
$('bGrete').onclick=()=>{S.grete=!S.grete;if(!S.grete)S.trans=false;say(S.grete?TEXT.grete.on:TEXT.grete.off,'ev');refresh();if(S.grete)greteDaily()};
$('bTrans').onclick=()=>{S.trans=!S.trans;say(S.trans?TEXT.grete.transOn:TEXT.grete.transOff,'ev');refresh()};

// ---------- 說明／圖鑑選單（三頁：說明與存檔、收藏、小球們）----------
if(typeof ABOUT_HTML!=='undefined')$('aboutBody').innerHTML=ABOUT_HTML;
if(typeof NEWS_HTML!=='undefined')$('newsBody').innerHTML=NEWS_HTML;
$('bMenu').onclick=()=>openMenu('larvae');
$('again').textContent=TEXT.idle.wait;
$('eLarvae').onclick=()=>openMenu('larvae');
$('menuClose').onclick=()=>$('ovMenu').classList.remove('show');
document.addEventListener('keydown',e=>{if(e.key==='Escape')['ovMenu','ovPick','ovBag','ovWatch'].forEach(i=>$(i).classList.remove('show'))});
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
