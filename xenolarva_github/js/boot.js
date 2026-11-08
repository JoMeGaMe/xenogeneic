// 開頭的讀取畫面（v0.40.69）：index.html 的 #boot 一開始就顯示；這裡算進度：
//   程式一個一個載完（#boot 的 data-n＝後面有幾個 <script>，tools/build_single_file.py 會自動更新）＝0～85%，
//   js/layout.js 最後呼叫 bootDone()＝90%，等開頭的圖讀完（window load，最多 10 秒）＝100%，淡出。
//   出錯沒跑到 bootDone 時，25 秒後也會收掉（錯誤訊息由 js/err.js 顯示）。
(()=>{const b=document.getElementById('boot');if(!b){window.bootDone=()=>{};return}
  const n=+b.dataset.n||1,fill=b.querySelector('.bootbar i'),pc=b.querySelector('.bootpct');let k=0,p=0,done=false;
  const set=v=>{p=Math.max(p,Math.min(100,v));if(fill)fill.style.width=p+'%';if(pc)pc.textContent=Math.floor(p)+'%'};
  document.addEventListener('load',e=>{if(!done&&e.target&&e.target.tagName==='SCRIPT'){k++;set(k/n*85)}},true);
  if(n<=1){const t=setInterval(()=>{if(done||p>=80)clearInterval(t);else set(p+(80-p)*.06)},120)}   // 發布版只有一個 game.js（續 16）：載入中慢慢往前走
  const hide=()=>{set(100);setTimeout(()=>{b.classList.add('out');setTimeout(()=>b.remove(),400)},150)};
  window.bootDone=()=>{if(done)return;done=true;set(90);
    if(document.readyState==='complete'){hide();return}
    const t=setInterval(()=>set(p+(99-p)*.08),200),end=()=>{clearInterval(t);hide()};
    addEventListener('load',end,{once:true});setTimeout(end,10000)};
  setTimeout(()=>{if(document.getElementById('boot'))hide()},25000);
})();
