// ===== 開發者測試模式 =====
// 開啟方式：網址加 ?dev=1，或在畫面上連點畫面左上的版本號 5 次。
// 開啟後「結束今日」下方會出現「開發者模式」按鈕，打開浮動面板，可以直接指定目前這隻的個性、標籤與顏色。
// 這裡只動目前周目的狀態，不會寫進存檔設定；要拿掉這個功能，刪掉這個檔案與 index.html 的對應行即可。
function devUnlock(){$('bDev').hidden=false}
try{if(/[?&]dev=1(&|$)/.test(location.search))devUnlock()}catch(e){}
(()=>{let n=0,tm=null;
  $('ver').addEventListener('click',()=>{
    n++;clearTimeout(tm);tm=setTimeout(()=>{n=0},2500);       // 2.5 秒內連點 5 次
    if(n>=5){n=0;devUnlock()}
  });
})();

function devBuild(){
  const p=$('devp');p.textContent='';
  const close=h('button',{'aria-label':'關閉',onclick:()=>{p.hidden=true}},'✕');
  p.append(h('h4',{},'開發者模式',close));
  // 信紙測試：用一隻假的畢業小球（或最近交還的那隻）馬上寄一封；會照常存進收藏（可以取消勾選）
  const fake=()=>{const r=META.returned[META.returned.length-1];
    return r?{...r,rnd:Math.min(r.rnd||0,META.rounds-1)}:{name:'測試球',temp:R(TEMPER_IDS),own:[R(Object.keys(TAGS))],pg:R(GIFTS),pt:R(TOYS),end:R(Object.keys(ENDS).slice(0,6)),rnd:META.rounds-3}};
  p.append(h('div',{class:'dg'},h('label',{},'信紙（畢業小球）'),
    ...[['normal','一般'],['young','未滿兩個月'],['farewell','離開前轉述']].map(([k,t])=>h('button',{onclick:()=>letterShow(letterMake(fake(),k),true)},t)),
    h('div',{class:'dim'},`可寄信的畢業小球：${letterCands().length} 隻｜已完成 ${META.rounds} 輪`)));
  // 裝扮：全部拿到／全部拿掉（拿掉時，正在戴的也一起脫下）
  p.append(h('div',{class:'dg'},h('label',{},`裝扮（有 ${META.wears.length}／${Object.keys(WEARS).length} 種）`),
    h('button',{onclick:()=>{META.wears=Object.keys(WEARS);codexSave();refresh();devBuild()}},'取得全部裝扮'),
    h('button',{onclick:()=>{META.wears=[];if(S)S.wear='';CODEX.forEach(e=>{e.wear=''});codexSave();refresh();devBuild()}},'刪除全部裝扮')));
  if(!S){p.append(h('p',{class:'dim'},'先開始一局，這裡才能改目前的小球。'));return}
  // 個性
  const sel=h('select',{'aria-label':'個性'},...TEMPER_IDS.map(id=>h('option',{value:id,selected:id===S.temp},TEXT.temper[id].name)));
  sel.onchange=()=>{S.temp=sel.value;C.steering=false;C.next=0;M=null;C.home=pickHome();refresh()};
  p.append(h('div',{class:'dg'},h('label',{},'個性'),sel));
  // 標籤
  const tg=h('div',{class:'dt'});
  Object.keys(TAGS).forEach(id=>{
    const cb=h('input',{type:'checkbox',checked:S.tags.includes(id)});
    cb.onchange=()=>{
      S.tags=S.tags.filter(x=>x!==id);if(cb.checked)S.tags.push(id);
      S.tagsFound=S.tagsFound.filter(x=>S.tags.includes(x));refresh();
    };
    tg.append(h('label',{},cb,' '+TEXT.tags[id].name+(TAGS[id].off?'（停用）':'')));
  });
  p.append(h('div',{class:'dg'},h('label',{},'標籤（勾選＝擁有，效果立即生效）'),tg,
    h('button',{onclick:()=>{S.tags.forEach(id=>discoverTag(id))}},'揭曉全部（看提示框）'),
    h('button',{onclick:()=>{S.tagsFound=[];refresh()}},'全部設為未發現')));
  // 圖鑑：每種個性各一隻（覆蓋現有圖鑑，用來測試小球之間的互動）
  const give=h('button',{},'取得每種個性各一隻（覆蓋圖鑑）');let armed=0;
  give.onclick=()=>{
    if(!armed){armed=1;give.textContent='再按一次確認：會覆蓋現有圖鑑';setTimeout(()=>{armed=0;give.textContent='取得每種個性各一隻（覆蓋圖鑑）'},4000);return}
    armed=0;devGiveAll();give.textContent='已覆蓋：前 3 隻放進水缸';
  };
  const rev=h('button',{},REVEAL?'還原收藏顯示':'揭曉所有圖鑑資料');
  rev.onclick=()=>{REVEAL=!REVEAL;rev.textContent=REVEAL?'還原收藏顯示':'揭曉所有圖鑑資料'};
  p.append(h('div',{class:'dg'},h('label',{},'圖鑑測試資料'),give,rev));
  // 水質、飽食（拖動立刻生效）
  const sl=(label,get,set,min,max,step)=>{
    const out=h('span',{},String(get()));
    const r=h('input',{type:'range',min,max,step,value:get(),'aria-label':label});
    r.oninput=()=>{set(+r.value);out.textContent=r.value;refresh()};
    return h('div',{},h('label',{},label+'：',out),r)};
  p.append(h('div',{class:'dg'},
    sl('污染（0 乾淨～100 很髒）',()=>Math.round(S.dirt),v=>{S.dirt=v},0,100,1),
    sl('酸鹼度 pH（7 為中性）',()=>+S.ph.toFixed(1),v=>{S.ph=v},4,10,.1),
    sl('飽食（0 很餓～100 很飽）',()=>Math.round(S.sat),v=>{S.sat=v},0,100,1)));
  // 物品：一鍵補齊／清空
  const setInv=(keys,n)=>{keys.forEach(k=>{S.inv[k]=n});refresh()};
  p.append(h('div',{class:'dg'},h('label',{},'物品'),
    h('button',{onclick:()=>setInv(FOODS,9)},'補齊食物'),h('button',{onclick:()=>setInv(FOODS,0)},'清空食物'),
    h('button',{onclick:()=>setInv(['agent'],9)},'補齊換水劑'),h('button',{onclick:()=>setInv(['agent'],0)},'清空換水劑')));
  // 格蕾特（事件與解鎖）
  const rs=()=>{if(S){S.grete=false;S.trans=false;S.tc=S.tb='';S.chatC=[];S.chatB=[]}META.greteMet=META.grete=META.chatColor=META.chatDual=false;META.chatWins=0;codexSave();refresh()};
  p.append(h('div',{class:'dg'},h('label',{},'格蕾特'),
    h('button',{onclick:()=>{p.hidden=true;runEvent('greteMeet')}},'遇見格蕾特（跑事件並解鎖小助手）'),
    h('button',{onclick:()=>{META.chatColor=true;codexSave();refresh()}},'開啟染色'),
    h('button',{onclick:()=>{META.chatColor=true;META.chatDual=true;META.chatWins=Math.max(1,META.chatWins);codexSave();refresh()}},'開啟雙色'),
    h('button',{onclick:rs},'全部格蕾特事件重置')));
  // 禮物與偷偷七逃
  p.append(h('div',{class:'dg'},h('label',{},'禮物／偷偷七逃'),
    h('button',{onclick:()=>giveSouv(TEMPER_SOUV[S.temp])},'收到這隻個性的禮物'),
    h('button',{onclick:()=>{const k=Object.keys(TAG_SOUV).find(t=>S.tags.includes(t));if(k)giveSouv(TAG_SOUV[k]);else say('這隻沒有標籤禮物可送。','sys')}},'收到標籤禮物'),
    h('button',{onclick:()=>{if(!S.tags.includes('sneak')){S.tags.push('sneak')}sneakDaily(true)}},'觸發偷偷七逃（補上標籤）')));
  // 顏色
  const hex=h('input',{type:'text',value:S.col,'aria-label':'代表色'});
  const col=h('input',{type:'color',value:parseColor(S.col)||'#58a6ff','aria-label':'選色'});
  const setCol=v=>{const c=parseColor(v);if(!c)return;S.col=c;hex.value=c;col.value=c;paintName($('pname'),c);refresh()};
  hex.onchange=()=>setCol(hex.value);col.oninput=()=>setCol(col.value);
  const colored=h('input',{type:'checkbox',checked:!!S.colored});
  colored.onchange=()=>{S.colored=colored.checked;refresh()};
  const hue=h('input',{type:'range',min:0,max:359,value:S.hue,'aria-label':'核心色相'});
  hue.oninput=()=>{S.hue=+hue.value};
  p.append(h('div',{class:'dg'},h('label',{},'玩家代表色（色碼或選色）'),hex,col,
    h('label',{},colored,' 核心已染上代表色'),h('label',{},'核心色相（未染色時）'),hue));
}
$('bDev').onclick=()=>{const p=$('devp');if(p.hidden){devBuild();p.hidden=false}else p.hidden=true};

// 圖鑑換成「每種個性各一隻」的測試資料（顏色各不同、都活著），前 3 隻直接放進水缸
function devGiveAll(){
  CODEX=TEMPER_IDS.map((id,i)=>codexNorm({id:'dev-'+id,name:TEXT.temper[id].name+'球',pname:META.pname||'測試',col:COLORS[i%COLORS.length],
    hue:i*55,colored:i%2===0,day:7,temp:id,end:'END-02',pg:GIFTS[i%3],pt:TOYS[i%3],at:new Date().toISOString().slice(0,10)}));
  GUEST_IDS=CODEX.slice(0,3).map(e=>e.id);
  codexSave();if(S)syncGuests(true);
}
