// 畫面文字訊息、狀態面板更新、選單彈窗。只負責顯示，不改遊戲規則。
// ---------- 訊息 / 介面 ----------
function say(t,c=''){bounce=1;const p=document.createElement('p');p.textContent=(S?t.replace(/幼體/g,S.name):t);if(c)p.className=c;$('log').appendChild(p);$('log').scrollTop=1e9}
function refresh(){
  paintName($('cname'),S.colored?S.col:'');
  $('day').textContent=`第 ${Math.min(S.day,7)} 日 / 7`;
  $('pips').innerHTML=[0,1].map(i=>`<span class="${i<S.ap?'on':''}"></span>`).join('');
  $('status').innerHTML=[['飽食',satW()],['水質',waterW()],['個性',TEMPN[S.temp]],['喜好',` ${S.found.gift?NAME[S.pref.gift]:'？'} / ${S.found.toy?NAME[S.pref.toy]:'？'}`]]
    .map(([a,b])=>`<div><b>${a}</b>${b}</div>`).join('');
  const off=!!S.over;
  $('bWater').disabled=off||S.inv.agent<1;
  $('bFeed').disabled=off||!FOODS.some(k=>S.inv[k]>0);
  $('bPlay').disabled=off||S.ap<1||!TOYS.some(t=>S.inv[t]>0);
  $('bOut').disabled=off||S.ap<1;
  $('end').disabled=off;
}
function pick(title,opts,cb){
  $('pt').textContent=title;
  $('po').innerHTML='';
  opts.forEach(o=>{const b=document.createElement('button');b.textContent=o.label;b.disabled=!!o.off;
    b.onclick=()=>{$('ovPick').classList.remove('show');cb(o.id)};$('po').appendChild(b)});
  $('ovPick').classList.add('show');
}
$('pc').onclick=()=>$('ovPick').classList.remove('show');

