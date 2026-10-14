// 在沒有瀏覽器的環境測試遊戲邏輯：用 node 把 index.html 的所有 <script> 依序放進 vm，DOM 用 Proxy 假物件。
// 用法：node tools/test_harness.js <專案根目錄> <測試片段.js>
// 測試片段可直接使用遊戲裡的全域函式與變數（newGame、S、C、frames(n) 跑 n 格畫面、pick 會被你覆寫…），結尾要自己 console.log 結果並 process.exit(0)。
// 範例片段：  newGame('我','小球','#58a6ff');frames(60);console.log(S.day);process.exit(0);
// 注意：這不是真的瀏覽器，排版／點擊手感／圖片要在瀏覽器確認。
const fs=require('fs'),vm=require('vm'),root=process.argv[2]||'.',snip=process.argv[3];
const P=()=>new Proxy(function(){},{get:(t,k)=>k==='length'?0:k===Symbol.toPrimitive?()=>0:(k==='getBoundingClientRect'?()=>({left:0,top:0,width:500,height:500}):k==='children'?[]:k==='naturalWidth'?10:k==='width'||k==='height'?96:P()),set:()=>true,apply:()=>P(),has:()=>false});
const store={};
const ctx={document:P(),localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},innerWidth:800,innerHeight:600,
 Image:function(){setTimeout(()=>this.onload&&this.onload(),0)},performance:{now:()=>Date.now()},Blob:function(){},URL:{createObjectURL:()=>'x',revokeObjectURL(){}},
 requestAnimationFrame:()=>0,cancelAnimationFrame(){},setTimeout,clearTimeout,setInterval:()=>0,clearInterval(){},console,process,Math,JSON,Date,Array,Object,String,Number,Set,Promise};
ctx.addEventListener=()=>{};ctx.window=ctx;vm.createContext(ctx);
const html=fs.readFileSync(root+'/index.html','utf8');
const files=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
let code=files.map(f=>fs.readFileSync(root+'/'+f,'utf8')).join('\n');
code+=`
nLoaded=IMGN.length;CODEX=[];GUEST_IDS=[];
let T0=1000;const frames=n=>{for(let i=0;i<n;i++){T0+=16.7;draw(T0)}};
${snip?fs.readFileSync(snip,'utf8'):''}
`;
vm.runInContext(code,ctx);
