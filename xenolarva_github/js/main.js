// ===== 啟動：按鈕事件綁定、開局選色、開始與重新開始、說明／圖鑑選單 =====
// ---------- 遊戲指令按鈕（用 () => 包起來，確保點下去時才呼叫）----------
$('bWater').onclick=()=>actWater();$('bFeed').onclick=()=>actFeed();$('bPlay').onclick=()=>actPlay();$('bChat').onclick=()=>chatOpen();
$('bOut').onclick=()=>goOut();$('bBag').onclick=()=>actBag();
// 結束今日：第一次按先變成「再按一次」，4 秒內再按才真的換日（不跳視窗）
(()=>{let armed=0,tm=null;const b=$('end');
  const reset=()=>{armed=0;clearTimeout(tm);b.textContent=TEXT.ui.end;b.classList.remove('arm')};
  b.onclick=()=>{
    if(!armed){armed=1;b.textContent=S.ap>0?fmt(TEXT.misc.endArmAp,{n:S.ap}):TEXT.misc.endArm;b.classList.add('arm');tm=setTimeout(reset,4000);return}
    reset();gameStop();settle();
  };
})();
// 格蕾特小助手與翻譯開關
$('bGrete').onclick=()=>{S.grete=!S.grete;if(!S.grete)S.trans=false;say(S.grete?TEXT.grete.on:TEXT.grete.off,'ev');refresh();if(S.grete)greteDaily()};
$('bTrans').onclick=()=>{S.trans=!S.trans;say(S.trans?TEXT.grete.transOn:TEXT.grete.transOff,'ev');refresh()};

// ---------- 說明／圖鑑選單（三頁：說明與存檔、收藏、小球們）----------
if(typeof ABOUT_HTML!=='undefined'){$('aboutBody').innerHTML=ABOUT_HTML;   // 說明頁上面一排標籤（h3 的 data-tag）：點了捲到那一段（v0.40.69）
  const ab=$('aboutBody'),tg=$('aboutTags');ab.querySelectorAll('h3[data-tag]').forEach(h3=>{const b=h('button',{type:'button'},h3.dataset.tag);b.onclick=()=>{ab.scrollTop+=h3.getBoundingClientRect().top-ab.getBoundingClientRect().top-4};tg.append(b)})}
if(typeof NEWS_HTML!=='undefined')$('newsBody').innerHTML=NEWS_HTML;
$('bMenu').onclick=()=>openMenu('larvae');
$('again').textContent=TEXT.idle.wait;
$('eLarvae').onclick=()=>openMenu('larvae');
$('menuClose').onclick=()=>$('ovMenu').classList.remove('show');
$('dressClose').onclick=dressClose;
document.addEventListener('keydown',e=>{if(e.key==='Escape')['ovMenu','ovPick','ovBag','ovWatch'].forEach(i=>$(i).classList.remove('show'))});
$('cDown').onclick=()=>codexDownload('daily');$('cDownS').onclick=()=>codexDownload('story');
$('cMode').querySelectorAll('button').forEach(b=>b.onclick=()=>{SAVE_MODE=b.dataset.m;$('cMode').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))});
$('cUp').onchange=e=>{const f=e.target.files[0];if(f&&f.size<=20*1024*1024)f.text().then(codexImport);e.target.value=''};   // 存檔檔案上限 20MB（資安 v0.40.40）
$('cImport').onclick=()=>codexImport($('saveText').value);
$('ver').textContent='v'+VERSION;
// 清除存檔：第一次按先變成「再按一次確認」，4 秒內再按才真的清除
(()=>{let t=0,tm=null;const b=$('cWipe');
  const reset=()=>{t=0;b.textContent=TEXT.misc.wipe;b.className='danger'};
  b.onclick=()=>{
    if(!t){t=1;b.textContent=TEXT.misc.wipeArm;b.className='danger arm';tm=setTimeout(reset,4000);return}
    clearTimeout(tm);reset();codexWipe();
  };
})();
