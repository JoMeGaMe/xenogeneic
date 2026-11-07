/* 出錯時在畫面底部顯示訊息（手機沒有主控台，方便回報問題）。點一下可關閉。 */
(function(){
  function show(m){var d=document.getElementById('err');
    if(!d){d=document.createElement('div');d.id='err';d.onclick=function(){d.style.display='none'};(document.body||document.documentElement).appendChild(d)}
    d.style.display='block';d.textContent='發生錯誤（點一下關閉）：'+m}
  window.addEventListener('error',function(e){var t=e.target;
    if(t&&t.tagName==='SCRIPT'){show('檔案載入失敗 '+(t.getAttribute('src')||''));return}
    if(t&&t!==window)return;
    if(/ResizeObserver loop/.test(e.message||''))return;   // 瀏覽器的無害警告（版面重算時），不算錯誤
    show((e.message||'未知錯誤')+' @'+String(e.filename||'').split('/').pop()+':'+e.lineno)},true);
  window.addEventListener('unhandledrejection',function(e){show(String(e.reason))});
  window.showErr=show;
})();
