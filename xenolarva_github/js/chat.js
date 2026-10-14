// ===== 聊天染色：「聊天」鍵（v0.24.0 從玩耍選單拆出來）。選一個顏色聊同一個顏色的東西，累積 CHAT_RULE.need 次，小球就會染上那個顏色 =====
// 單色：核心染色（身體會跟著稍微染一點）。聽格蕾特提過雙色之後，可以分別指定「核心」或「外殼」，兩邊各自累積。
// S.tc／S.tb＝已染上的核心／外殼顏色（'' 為沒有）；S.chatC／S.chatB＝累積中的 [{c,n}]。聊天色優先於「核心染上代表色」。
const CHAT_SEL={core:null,shell:null,shell2:null,part:'core',style:'',soft:true};      // 選單裡目前選的顏色（核心／外殼／外殼第二色，null＝沒選）、正在指定哪個部位、外殼樣式（''單色｜v 上下｜h 左右）、柔和／分色
// 雜誌染色（v0.27，言盡的商店）：買了雜誌（META.tools 的 magV／magH），聊天框多一列「外殼：單色｜上下｜左右」＋「柔和｜分色」。
//   選了上下／左右時，外殼分成兩邊（shell＝上／左、shell2＝下／右），兩邊各自累積 CHAT_RULE.need 次（S.chatB／S.chatB2）。
//   兩邊都染好（S.tb、S.tb2）之後，外殼就變兩色（S.tbm、S.tbs）。之後想換樣式（上下↔左右、柔和↔分色），選好樣式聊一次就會換。
const MAG_SPLIT=false;                                  // 分色（一刀切開）先關掉，只有柔和（使用者 v0.28.6：效果不好，之後再想）
const magOwned=()=>['magV','magH'].filter(k=>META.tools.includes(k));
function rgbHsl(hex){
  const [r,g,b]=hexRgb(hex).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;
  let hh=0;if(d){hh=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;hh=(hh*60+360)%360}
  return {h:hh,s:d?d/(1-Math.abs(2*l-1)):0,l};
}
// 大約是什麼顏色（用在文字裡）
function colName(hex){
  const {h,s,l}=rgbHsl(hex);
  if(l>.9)return '白';if(l<.15)return '黑';if(s<.14)return l>.55?'淺灰':'灰';
  if((h<18||h>=335)&&l>.72)return '粉';
  if(h>=15&&h<48&&l<.42)return '褐';
  if(h<15||h>=345)return '紅';if(h<42)return '橘';if(h<68)return '黃';if(h<165)return '綠';if(h<198)return '青';
  if(h<255)return '藍';if(h<290)return '紫';return '粉';
}
const sameCol=(a,b)=>{const x=hexRgb(a),y=hexRgb(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])<CHAT_RULE.near};

// 聊天框的內容（「聊天」鍵打開）：
//   一開始只有「普通聊天」；學會染色後多出「3×4 色票（最後一格是自訂顏色）＋小球預覽」與「推薦顏色」；
//   學會雙色後再多出「全部設定／設定核心／設定外殼」（決定下一個點的顏色要設定哪裡）。
// 預覽：用目前選的顏色（沒選的部位用已經染上的顏色）畫出小球染色後的樣子。再點同一個顏色可取消那一邊。
function chatBox(){
  const box=h('div',{class:'chatbox'});
  const go=color=>{$('ovPick').classList.remove('show');actChat(color)};
  box.append(h('div',{class:'crow'},h('button',{class:'cbtn',onclick:()=>go(false)},TEXT.chat.btnPlain)));
  if(!META.chatColor)return box;
  const X=TEXT.misc,dual=!!META.chatDual,show=c=>c?colName(c)+X.colorSuffix:X.none,T=TEXT.chat;
  const mags=dual?magOwned():[];
  // 上次選的（樣式、顏色、部位）都留著；只有沒雜誌時把樣式清掉
  if(CHAT_SEL.style&&!mags.includes(CHAT_SEL.style==='v'?'magV':'magH'))CHAT_SEL.style='';
  if(!CHAT_SEL.style&&S.tbm&&mags.includes(S.tbm==='v'?'magV':'magH'))CHAT_SEL.style=S.tbm;   // 已經是兩色：預設照現在的樣式
  if(!MAG_SPLIT)CHAT_SEL.soft=true;
  if(!CHAT_SEL.style){CHAT_SEL.shell2=null;if(CHAT_SEL.part==='shell2')CHAT_SEL.part='shell'}
  const bColor=h('button',{class:'cbtn main',onclick:()=>go(true)},TEXT.chat.btnColor);
  const info=h('div',{class:'chatinfo dim'}),pc=h('canvas',{width:96,height:96,class:'cprev'});
  const drawPrev=(t)=>{
    if(nLoaded<IMGN.length)return;
    const g=pc.getContext('2d');g.imageSmoothingEnabled=false;
    const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');g.fillStyle=gr;g.fillRect(0,0,96,96);
    const st=CHAT_SEL.style,o={...S,tc:CHAT_SEL.core||S.tc,tb:(dual&&CHAT_SEL.shell)||S.tb,tb2:st?(CHAT_SEL.shell2||S.tb2):'',tbm:st,tbs:CHAT_SEL.soft?'soft':'split'},tt=(t||0)/1000;
    drawLarva(g,48,44+Math.sin(tt*.9)*2,0,Math.sin(tt*2)*.03,'idle_a',larvaLook(o),tt,1,1);
  };
  const keysOf=P=>P==='both'?['core','shell',...(CHAT_SEL.style?['shell2']:[])]:[P];
  // 注意：按鈕只建一次，之後只改文字／狀態（點擊時把按鈕拿掉重建，會被當成點到框外而關掉選單）
  const prow=h('div',{class:'crow'}),pb={};
  [['both',X.partAll],['core',X.partCore],['shell',X.partShell],['shell2','']].forEach(([k,t])=>prow.append(pb[k]=h('button',{class:'pbtn cbtn','data-p':k,onclick:()=>{CHAT_SEL.part=k;paint()}},t)));
  const partRow=()=>{                                                      // 部位按鈕（雙色）：選了上下／左右時，外殼分成兩個按鈕
    const sd=CHAT_SEL.style?T.side[CHAT_SEL.style]:null;prow.classList.toggle('c4',!!sd);
    pb.core.textContent=sd?X.core:X.partCore;pb.shell.textContent=sd?X.shell+sd[0]:X.partShell;pb.shell2.textContent=sd?X.shell+sd[1]:'';pb.shell2.hidden=!sd;
  };
  const srow=h('div',{class:'crow srow'}),yb=[];
  const styleRow=()=>yb.forEach(([b,k,v])=>{if(k==='style')b.classList.toggle('on',CHAT_SEL.style===v);else{b.classList.toggle('on',!!CHAT_SEL.style&&CHAT_SEL.soft===v);b.disabled=!CHAT_SEL.style}});
  srow.append(h('span',{class:'slab dim'},T.style));
  [['',T.styleOne],['v',T.styleV,'magV'],['h',T.styleH,'magH']].filter(x=>!x[2]||mags.includes(x[2])).forEach(([v,t])=>{
    const b=h('button',{class:'ybtn cbtn',onclick:()=>{CHAT_SEL.style=v;if(!v){CHAT_SEL.shell2=null;if(CHAT_SEL.part==='shell2')CHAT_SEL.part='shell'}styleRow();partRow();paint()}},t);yb.push([b,'style',v]);srow.append(b)});
  if(MAG_SPLIT){srow.append(h('span',{class:'sgap'}));[[true,T.soft],[false,T.split]].forEach(([v,t])=>{const b=h('button',{class:'ybtn cbtn',onclick:()=>{CHAT_SEL.soft=v;styleRow();paint()}},t);yb.push([b,'soft',v]);srow.append(b)})}
  const styleOnly=()=>!!(CHAT_SEL.style&&S.tb&&S.tb2&&(CHAT_SEL.style!==S.tbm||CHAT_SEL.soft!==(S.tbs!=='split')));   // 兩色都有了，只換樣式
  const paint=()=>{
    const P=CHAT_SEL.part,ks=keysOf(P);
    box.querySelectorAll('.sw1').forEach(b=>b.classList.toggle('sel',ks.every(k=>CHAT_SEL[k]===b.dataset.c)));
    box.querySelectorAll('.pbtn').forEach(b=>b.classList.toggle('on',b.dataset.p===P));
    info.textContent='';
    if(dual&&CHAT_SEL.style){const sd=T.side[CHAT_SEL.style];info.append(h('div',{},X.core+'：'+show(CHAT_SEL.core)),h('div',{},X.shell+sd[0]+'：'+show(CHAT_SEL.shell)),h('div',{},X.shell+sd[1]+'：'+show(CHAT_SEL.shell2)))}
    else if(dual)info.append(h('div',{},X.core+'：'+show(CHAT_SEL.core)),h('div',{},X.shell+'：'+show(CHAT_SEL.shell)));
    else info.textContent=X.infoColor+show(CHAT_SEL.core);
    bColor.disabled=!(CHAT_SEL.core||(dual&&(CHAT_SEL.shell||CHAT_SEL.shell2))||styleOnly());
    drawPrev(performance.now());
  };
  const choose=c=>{
    const ks=dual?keysOf(CHAT_SEL.part):['core'];
    const same=ks.every(k=>CHAT_SEL[k]===c);ks.forEach(k=>{CHAT_SEL[k]=same?null:c});paint();
  };
  const clear=()=>{CHAT_SEL.core=CHAT_SEL.shell=CHAT_SEL.shell2=null;paint()};
  if(mags.length){styleRow();box.append(srow)}
  if(dual){partRow();box.append(prow)}
  else CHAT_SEL.part='core';
  const grid=h('div',{class:'sgrid'});
  COLORS.forEach((c,i)=>grid.append(h('button',{class:'sw1',style:'background:'+c,'data-c':c,title:CNAME[i],'aria-label':CNAME[i],onclick:()=>choose(c)})));
  const cp=h('input',{type:'color',value:'#58a6ff','aria-label':X.customColor,title:X.customColor});
  cp.oninput=()=>choose(cp.value);
  grid.append(h('label',{class:'scust'},cp,h('span',{},X.custom)));
  const fr=h('div',{class:'cpv'},pc),cancel=h('button',{class:'cclr',onclick:clear},TEXT.chat.cancel);
  box.append(h('div',{class:'cmid'},grid,h('div',{class:'cfr'},fr),cancel,info),h('div',{class:'crow'},bColor));
  const fit=()=>{const n=grid.offsetHeight;if(n>0){fr.style.width=fr.style.height=n+'px'}};     // 小球框是正方形，邊長＝色票區的高度
  paint();setTimeout(fit,0);setTimeout(fit,80);
  const tm=setInterval(()=>{if(!pc.isConnected||!$('ovPick').classList.contains('show')){clearInterval(tm);return}fit();drawPrev(performance.now())},120);   // 預覽裡的小球輕輕晃動
  return box;
}

// 聊天（耗 1 行動，已包含在「玩耍」；不耗道具）：心情與信賴和「不喜歡也不討厭的玩具」相同。color＝true 時依選好的顏色聊
// 「聊天」鍵：打開聊天框（普通聊天＋學會染色後的色票）
function chatOpen(){pick(TEXT.chat.head,[{node:chatBox()}])}
function actChat(color){
  S.ap--;S.playedToday=true;
  const before=[...S.tagsFound];
  S.trust=clamp(S.trust+(hasTag('scholar')?Math.round(gain(2)/2):gain(2)));emote('q');
  const T=TEXT.chat,sel=[],st=color&&META.chatDual?CHAT_SEL.style:'',sd=st?T.side[st]:null;
  if(color){
    if(CHAT_SEL.core)sel.push(['core',CHAT_SEL.core]);
    if(META.chatDual&&CHAT_SEL.shell)sel.push(['shell',CHAT_SEL.shell]);
    if(st&&CHAT_SEL.shell2)sel.push(['shell2',CHAT_SEL.shell2]);
  }
  const shells=sel.filter(x=>x[0]!=='core');
  if(st&&(shells.length||(S.tb&&S.tb2))){                                 // 雜誌染色：和小球一起看雜誌
    const mag=NAME[st==='v'?'magV':'magH'],s1=CHAT_SEL.shell||S.tb,s2=CHAT_SEL.shell2||S.tb2;
    if(s1&&s2)say(fmt(T.magTalk,{mag,a:sd[0],b:sd[1],c:colName(s1),c2:colName(s2)}));
    else{const [p,c]=shells[0];say(fmt(T.magTalkOne,{mag,a:sd[p==='shell'?0:1],c:colName(c)}))}
    say(R(T.magReact));
    let done2=false;
    sel.forEach(([part,c])=>{
      const key={core:'chatC',shell:'chatB',shell2:'chatB2'}[part],arr=S[key]||(S[key]=[]),pv={c:colName(c)};
      let e=arr.find(x=>sameCol(x.c,c));if(!e){e={c,n:0};arr.push(e)}
      e.n++;
      if(e.n>=CHAT_RULE.need){
        S[{core:'tc',shell:'tb',shell2:'tb2'}[part]]=e.c;S[key]=[];META.chatWins=(META.chatWins||0)+1;codexSave();
        const dv={c:colName(e.c),a:part==='core'?'':sd[part==='shell'?0:1]};
        if(part==='core'){say(fmt(T.done.core,dv),'ev');toast(fmt(T.toast,dv))}else{say(fmt(T.done2,dv),'ev');done2=true}
        emote('heart');
      }else say(fmt(R(T['p'+e.n+(part==='core'?'':'s')]),pv),'ev');
    });
    if(S.tb&&S.tb2){
      const ns=CHAT_SEL.soft?'soft':'split',changed=S.tbm!==st||S.tbs!==ns;
      S.tbm=st;S.tbs=ns;
      const v={a:sd[0],b:sd[1],c:colName(S.tb)+TEXT.misc.colorSuffix,c2:colName(S.tb2)+TEXT.misc.colorSuffix,s:fmt(TEXT.misc.styleName,{soft:CHAT_SEL.soft?T.soft:T.split,style:T['style'+st.toUpperCase()]})};
      if(done2){say(fmt(T.doneTwo,v),'ev');toast(T.toastTwo)}else if(changed)say(fmt(T.styleSet,v),'ev');
      codexSave();
    }
  }
  else if(!sel.length)say(R(T.plain));
  else{
    const cn=colName(sel[0][1]),v={c:cn,things:T.things[cn]||TEXT.misc.things};
    if(sel.length===2)say(fmt(T.talkBoth,{...v,c2:colName(sel[1][1])}));
    else say(fmt(META.chatDual?T[sel[0][0]==='core'?'talkCore':'talkShell']:T.talk,v));
    say(R(T.react));
    sel.forEach(([part,c])=>{
      const key=part==='core'?'chatC':'chatB',arr=S[key],pv={c:colName(c)};
      let e=arr.find(x=>sameCol(x.c,c));if(!e){e={c,n:0};arr.push(e)}
      e.n++;
      if(e.n>=CHAT_RULE.need){
        S[part==='core'?'tc':'tb']=e.c;S[key]=[];META.chatWins=(META.chatWins||0)+1;if(part==='shell')S.tbm='';codexSave();   // 單色外殼：回到單色
        const dv={c:colName(e.c)};
        say(fmt(T.done[part],dv),'ev');toast(fmt(T.toast,dv));emote('heart');
      }else say(fmt(R(T['p'+e.n+(part==='core'?'':'s')]),pv),'ev');
    });
  }
  if(TEMPERS[S.temp].explorer)S.explore++;
  tagReact('play',{},before);
  refresh();
}
