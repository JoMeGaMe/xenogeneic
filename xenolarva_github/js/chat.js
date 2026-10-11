// ===== 聊天染色：玩耍選單裡的「聊天」。選一個顏色聊同一個顏色的東西，累積 CHAT_RULE.need 次，小球就會染上那個顏色 =====
// 單色：核心染色（身體會跟著稍微染一點）。聽格蕾特提過雙色之後，可以分別指定「核心」或「外殼」，兩邊各自累積。
// S.tc／S.tb＝已染上的核心／外殼顏色（'' 為沒有）；S.chatC／S.chatB＝累積中的 [{c,n}]。聊天色優先於「核心染上代表色」。
const CHAT_SEL={core:null,shell:null,part:'core'};      // 選單裡目前選的顏色（核心／外殼，null＝沒選）與正在指定哪個部位
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
const chatUnlocked=()=>!!META.chatColor;

// 聊天選單裡的區塊（玩耍選單的「聊天」下方）：
//   一開始只有「普通聊天」；學會染色後多出色票與「推薦顏色」；學會雙色後再多出「設定核心／設定外殼／全部設定／全部取消」。
// 用法：先點「設定核心」「設定外殼」或「全部設定」決定要設定哪裡，再點顏色。再點同一個顏色可取消那一邊。
function chatBox(){
  const box=h('div',{class:'chatbox'}),info=h('div',{class:'dim chatinfo'});
  const go=color=>{$('ovPick').classList.remove('show');actChat(color)};
  const bPlain=h('button',{class:'cbtn',onclick:()=>go(false)},TEXT.chat.btnPlain);
  box.append(h('div',{class:'crow'},bPlain));
  if(!META.chatColor)return box;
  const dual=!!META.chatDual,show=c=>c?colName(c)+'色':'未選';
  const bColor=h('button',{class:'cbtn',onclick:()=>go(true)},TEXT.chat.btnColor);
  const paint=()=>{
    const P=CHAT_SEL.part;
    box.querySelectorAll('.sw1').forEach(b=>b.classList.toggle('sel',P==='both'?(CHAT_SEL.core===b.dataset.c&&CHAT_SEL.shell===b.dataset.c):b.dataset.c===CHAT_SEL[P]));
    box.querySelectorAll('.pbtn').forEach(b=>b.classList.toggle('on',b.dataset.p===P));
    info.textContent=dual?`核心：${show(CHAT_SEL.core)}　外殼：${show(CHAT_SEL.shell)}`:`顏色：${show(CHAT_SEL.core)}`;
    bColor.disabled=!(CHAT_SEL.core||(dual&&CHAT_SEL.shell));
  };
  const choose=c=>{
    const P=dual?CHAT_SEL.part:'core',ks=P==='both'?['core','shell']:[P];
    const same=ks.every(k=>CHAT_SEL[k]===c);ks.forEach(k=>{CHAT_SEL[k]=same?null:c});paint();
  };
  const clear=()=>{CHAT_SEL.core=CHAT_SEL.shell=null;paint()};
  if(dual){
    box.append(h('div',{class:'crow'},...[['core','設定核心'],['shell','設定外殼']].map(([k,t])=>h('button',{class:'pbtn cbtn','data-p':k,onclick:()=>{CHAT_SEL.part=k;paint()}},t))),
      h('div',{class:'crow'},h('button',{class:'pbtn cbtn','data-p':'both',onclick:()=>{CHAT_SEL.part='both';paint()}},'全部設定'),h('button',{class:'cbtn',onclick:clear},TEXT.chat.cancel)));
  }else CHAT_SEL.part='core';
  const sw=h('div',{class:'sw'});
  COLORS.forEach((c,i)=>sw.append(h('button',{class:'sw1',style:'background:'+c,'data-c':c,title:CNAME[i],'aria-label':CNAME[i],onclick:()=>choose(c)})));
  const cp=h('input',{type:'color',value:'#58a6ff','aria-label':'自訂顏色'});
  cp.oninput=()=>choose(cp.value);
  box.append(sw,h('div',{class:'cust'},cp,h('span',{class:'dim'},'自訂顏色'),dual?'':h('button',{class:'cclr',onclick:clear},TEXT.chat.cancel)),info,h('div',{class:'crow'},bColor));
  paint();
  return box;
}

// 聊天（耗 1 行動，已包含在「玩耍」；不耗道具）：心情與信賴和「不喜歡也不討厭的玩具」相同。color＝true 時依選好的顏色聊
function actChat(color){
  S.ap--;S.playedToday=true;
  const before=[...S.tagsFound];
  S.trust=clamp(S.trust+(hasTag('scholar')?Math.round(gain(2)/2):gain(2)));emote('q');
  const T=TEXT.chat,sel=[];
  if(color){
    if(CHAT_SEL.core)sel.push(['core',CHAT_SEL.core]);
    if(META.chatDual&&CHAT_SEL.shell)sel.push(['shell',CHAT_SEL.shell]);
  }
  if(!sel.length)say(R(T.plain));
  else{
    const cn=colName(sel[0][1]),v={c:cn,things:T.things[cn]||'好看的東西'};
    if(sel.length===2)say(fmt(T.talkBoth,{...v,c2:colName(sel[1][1])}));
    else say(fmt(META.chatDual?T[sel[0][0]==='core'?'talkCore':'talkShell']:T.talk,v));
    say(R(T.react));
    sel.forEach(([part,c])=>{
      const key=part==='core'?'chatC':'chatB',arr=S[key],pv={c:colName(c)};
      let e=arr.find(x=>sameCol(x.c,c));if(!e){e={c,n:0};arr.push(e)}
      e.n++;
      if(e.n>=CHAT_RULE.need){
        S[part==='core'?'tc':'tb']=e.c;S[key]=[];META.chatWins=(META.chatWins||0)+1;codexSave();
        const dv={c:colName(e.c)};
        say(fmt(T.done[part],dv),'ev');toast(fmt(T.toast,dv));emote('heart');
      }else say(fmt(R(T['p'+e.n+(part==='core'?'':'s')]),pv),'ev');
    });
  }
  if(TEMPERS[S.temp].explorer)S.explore++;
  tagReact('play',{},before);
  refresh();
}
