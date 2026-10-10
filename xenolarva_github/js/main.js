// 啟動：按鈕事件綁定、開局選色、開始與重新開始。
// ---------- 事件綁定 ----------
$('bWater').onclick=actWater;$('bFeed').onclick=actFeed;$('bPlay').onclick=actPlay;
$('bOut').onclick=actOut;$('bBag').onclick=actBag;
$('end').onclick=()=>pick(S.ap>0?`還有 ${S.ap} 次行動沒用，確定結束今天？`:'結束今天並進行結算？',
  [{id:1,label:'結束今日'}],settle);
function markSw(){[...$('sw').children].forEach(b=>b.className=b.dataset.c===selColor?'sel':'')}
function setColor(c){selColor=c;$('cp').value=c;$('hex').value=c;$('hex').style.borderColor='';markSw()}
COLORS.forEach((c,i)=>{const b=document.createElement('button');b.style.background=c;b.dataset.c=c;b.title=CNAME[i];b.setAttribute('aria-label',CNAME[i]);
  b.onclick=()=>setColor(c);$('sw').appendChild(b)});
$('cp').oninput=e=>setColor(e.target.value);
$('hex').oninput=e=>{const c=parseColor(e.target.value);if(c){selColor=c;$('cp').value=c;e.target.style.borderColor='';markSw()}else e.target.style.borderColor='#ff8a6b'};
$('hex').onchange=()=>{$('hex').value=selColor;$('hex').style.borderColor=''};
setColor(selColor);
$('go').onclick=()=>{$('ovStart').classList.remove('show');newGame($('pn').value.trim()||'玩家',$('nm').value.trim()||'小球',selColor)};
$('again').onclick=()=>{$('ovEnd').classList.remove('show');$('ovStart').classList.add('show')};

// ---------- 說明 / 圖鑑 ----------
$('aboutBody').innerHTML=ABOUT_HTML;
['bAbout','sAbout'].forEach(i=>$(i).onclick=()=>$('ovAbout').classList.add('show'));
['bCodex','sCodex'].forEach(i=>$(i).onclick=()=>{$('cmsg').textContent='';renderCodex();$('ovCodex').classList.add('show')});
$('aboutClose').onclick=()=>$('ovAbout').classList.remove('show');
$('codexClose').onclick=()=>$('ovCodex').classList.remove('show');
$('cDown').onclick=codexDownload;
$('cUp').onchange=e=>{const f=e.target.files[0];if(f)f.text().then(codexMerge);e.target.value=''};
$('cImport').onclick=()=>codexMerge($('saveText').value);
