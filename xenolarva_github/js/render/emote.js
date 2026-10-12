// 表情氣泡的繪製。圖案資料在 js/data/emotes.js。
// ---- 表情氣泡 ----
function emote(type){EM={type,t:performance.now()}}
// 任何一隻小球冒氣泡：玩家養的那隻用 EM，同伴存在自己身上（g.em）
function emoteOn(o,type){if(o===C)emote(type);else o.em={type,t:performance.now()}}
function drawEmote(t,x,y){if(EM&&!drawBubble(EM,t,x,y))EM=null}
// 畫一個氣泡；過期回傳 false
function drawBubble(em,t,x,y){
  const age=t-em.t;if(age>2000)return false;
  const ic=ICON[em.type],m=ic.m,K=5,T=3,P=12,w=Math.max(...m.map(r=>r.length))*K,h=m.length*K,al=age>1600?(2000-age)/400:1,pop=Math.min(1,age/150);
  const bw=w+P*2,bh=h+P*2,X=Math.round(Math.max(4,Math.min(WORLD.w-4-bw,x-bw/2))),Y=Math.round(Math.max(2,y-bh-14-Math.sin(age/200)*4-(1-pop)*16)),o='#3b6b80';
  px(X+T,Y,bw-2*T,bh,o,al);px(X,Y+T,bw,bh-2*T,o,al);
  px(X+2*T,Y+T,bw-4*T,bh-2*T,'#fff',al);px(X+T,Y+2*T,bw-2*T,bh-4*T,'#fff',al);
  px(x-2*T,Y+bh-T,4*T,T,'#fff',al);px(x-3*T,Y+bh-T,T,T,o,al);px(x+2*T,Y+bh-T,T,T,o,al);
  px(x-2*T,Y+bh,T,T,o,al);px(x+T,Y+bh,T,T,o,al);px(x-T,Y+bh,2*T,T,'#fff',al);px(x-T,Y+bh+T,2*T,T,o,al);
  m.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]==='#')px(X+P+i*K,Y+P+j*K,K,K,ic.c,al)});
  cx.globalAlpha=1;
  return true;
}
