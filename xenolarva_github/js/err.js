/* 出錯時在畫面底部顯示訊息（手機沒有主控台，方便回報問題）。點一下可關閉。 */
(function(){
  function show(m){var d=document.getElementById('err');
    if(!d){d=document.createElement('div');d.id='err';d.onclick=function(){d.style.display='none'};(document.body||document.documentElement).appendChild(d)}
    d.style.display='block';d.textContent='發生錯誤（點一下關閉）：'+m}
  window.addEventListener('error',function(e){var t=e.target;
    if(t&&t.tagName==='SCRIPT'){show('檔案載入失敗 '+(t.getAttribute('src')||''));return}
    if(t&&t!==window)return;
    if(/ResizeObserver loop/.test(e.message||''))return;   // 瀏覽器的無害警告（版面重算時），不算錯誤
    var f=String(e.filename||'').split('/').pop().split('?')[0],ln=e.lineno;
    // 發布版的程式合成一個 game.js（v0.40.69 續 16）：SRC_LINES＝每個原始檔從第幾行開始，換回原本的檔名和行號
    if(f==='game.js'&&window.SRC_LINES){var L=window.SRC_LINES;for(var i=L.length-1;i>=0;i--)if(ln>=L[i][1]){f=L[i][0];ln=ln-L[i][1]+1;break}}
    show((e.message||'未知錯誤')+' @'+f+':'+ln)},true);
  window.addEventListener('unhandledrejection',function(e){show(String(e.reason))});
  window.showErr=show;
})();
