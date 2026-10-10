// 圖鑑：每個周目結束後收錄一隻。存在瀏覽器（localStorage），可下載／上傳成 JSON 檔搬移。
const CODEX_KEY='xenolarva.codex.v1', TEMPN={clingy:'黏人',shy:'害羞',curious:'好奇'};
let CODEX=[], GUEST_IDS=[];
const META={kit:false,decor:[]};   // 跨周目繼承：水質檢測儀、背景裝飾
const saveObj=()=>({v:1,codex:CODEX,guests:GUEST_IDS,kit:META.kit,decor:META.decor});
function codexLoad(){try{const d=JSON.parse(localStorage.getItem(CODEX_KEY)||'{}');CODEX=(d.codex||[]).map(codexNorm).filter(Boolean);GUEST_IDS=(d.guests||[]).map(String);META.kit=d.kit===true;META.decor=(d.decor||[]).filter(k=>DECOR[k])}catch(e){}}
function codexSave(){try{localStorage.setItem(CODEX_KEY,JSON.stringify(saveObj()))}catch(e){}}
// 檢查並整理一筆資料（匯入的檔案不可信，所以每個欄位都驗證）
function codexNorm(e){
  if(!e||typeof e!=='object')return null;
  const col=parseColor(String(e.col||''));if(!col)return null;
  return {id:String(e.id||Date.now().toString(36)+Math.random().toString(36).slice(2,6)).slice(0,40),
    name:String(e.name||'小球').slice(0,8),pname:String(e.pname||'').slice(0,8),col,
    hue:((+e.hue||0)%360+360)%360,colored:!!e.colored,day:Math.max(1,Math.min(7,Math.round(+e.day)||7)),
    temp:TEMPN[e.temp]?e.temp:'curious',end:ENDS[e.end]?e.end:'END-01',
    pg:NAME[e.pg]?e.pg:'sweet',pt:NAME[e.pt]?e.pt:'bubble',at:String(e.at||'').slice(0,10)};
}
function codexRecord(code){
  const e=codexNorm({name:S.name,pname:S.pname,col:S.col,hue:S.hue,colored:S.colored,day:S.day,temp:S.temp,end:code,
    pg:S.pref.gift,pt:S.pref.toy,at:new Date().toISOString().slice(0,10)});
  CODEX.push(e);codexSave();
}
const guestEntries=()=>GUEST_IDS.map(id=>CODEX.find(e=>e.id===id)).filter(e=>e&&e.end!=='END-07').slice(0,3);
function toggleGuest(id,on){
  GUEST_IDS=GUEST_IDS.filter(x=>x!==id);if(on)GUEST_IDS.push(id);
  GUEST_IDS=GUEST_IDS.slice(-3);codexSave();
  $('cmsg').textContent=on?'下一次換日時，牠會游進水缸（最多 3 隻）。':'';renderCodex();
}
function thumb(c,e){
  if(nLoaded<IMGN.length){setTimeout(()=>thumb(c,e),300);return}
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');
  g.fillStyle=gr;g.fillRect(0,0,96,96);
  drawLarva(g,48,44,0,0,'idle_a',larvaLook(e),0,e.end==='END-07'?.45:1,1);
}
function renderCodex(){
  const box=$('cgrid');box.innerHTML='';
  const keys=Object.keys(ENDS),got=new Set(CODEX.map(e=>e.end));
  $('cstat').textContent=`已收錄 ${CODEX.length} 隻｜結局收藏 ${got.size}/${keys.length}｜裝飾 ${META.decor.length}/${Object.keys(DECOR).length}｜水質檢測儀 ${META.kit?'已取得':'未取得'}`;
  $('cends').textContent=keys.map(k=>got.has(k)?'✔ '+ENDS[k][0]:'？？？').join('　');
  if(!CODEX.length)box.textContent='還沒有紀錄。完成一個周目後，幼體會出現在這裡。';
  CODEX.forEach(e=>{
    const d=document.createElement('div');d.className='card';
    const c=document.createElement('canvas');c.width=c.height=96;d.appendChild(c);thumb(c,e);
    const add=(t,cls)=>{const p=document.createElement('div');p.textContent=t;if(cls)p.className=cls;d.appendChild(p)};
    add(e.name);add(ENDS[e.end][0]);add(`${TEMPN[e.temp]}｜第 ${e.day} 日`,'dim');add(`${e.pname||'—'}　${e.at}`,'dim');
    if(e.end!=='END-07'){
      const l=document.createElement('label'),k=document.createElement('input');
      k.type='checkbox';k.checked=GUEST_IDS.includes(e.id);k.onchange=()=>toggleGuest(e.id,k.checked);
      l.append(k,' 放入水缸');d.appendChild(l);
    }
    box.appendChild(d);
  });
  $('saveText').value=JSON.stringify(saveObj());
}
function codexDownload(){
  const b=new Blob([JSON.stringify(saveObj(),null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='xenolarva_save.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function codexMerge(txt){
  try{
    const d=JSON.parse(txt),list=(d.codex||[]).map(codexNorm).filter(Boolean);let n=0;
    list.forEach(e=>{if(!CODEX.some(x=>x.id===e.id)){CODEX.push(e);n++}});
    if(Array.isArray(d.guests))GUEST_IDS=[...new Set([...GUEST_IDS,...d.guests.map(String)])].slice(-3);
    if(d.kit===true)META.kit=true;
    META.decor=[...new Set([...META.decor,...(Array.isArray(d.decor)?d.decor:[]).filter(k=>DECOR[k])])];
    codexSave();renderCodex();$('cmsg').textContent=`匯入完成，新增 ${n} 隻。`;
  }catch(err){$('cmsg').textContent='讀取失敗：檔案格式不正確。'}
}
codexLoad();
