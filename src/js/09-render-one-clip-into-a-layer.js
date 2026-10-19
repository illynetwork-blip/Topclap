/* ---------- render one clip into a layer ---------- */
function measureClip(g,c,lt,u){if(c.kind==='text')return drawText(g,c,lt,u,true);if(c.kind==='caption')return drawCaption(g,c,lt,u,true);if(c.kind==='shape')return [c.w*u,c.h*u];return null}
function renderClip(c,t,L){
  const g=L.getContext('2d'),W=L.width,H=L.height,u=Math.min(W,H)/1080,lt=t-c.start;
  const mo=fxMotion(c,lt);let cx=(kv(c,'x',lt)+mo.ex)*W,cy=(kv(c,'y',lt)+mo.ey)*H;const rotD=kv(c,'rot',lt)+mo.er,rot=rotD*Math.PI/180;let sc=kv(c,'scale',lt)*mo.es;
  if(c.autofit!==false&&isGraphic(c)){
    const m=measureClip(g,c,lt,u);
    if(m&&m[0]>0){const mw=W*.92,mh=H*.92;let bw=m[0]*sc,bh=m[1]*sc;if(bw>mw){sc*=mw/bw;bw=mw;bh=m[1]*sc}if(bh>mh){sc*=mh/bh;bw=m[0]*sc;bh=mh}
      if(Math.abs(((rotD%180)+180)%180)<20||Math.abs(((rotD%180)+180)%180)>160){const mx=W*.04,my=H*.04;if(bw<W-2*mx)cx=clamp(cx,mx+bw/2,W-mx-bw/2);if(bh<H-2*my)cy=clamp(cy,my+bh/2,H-my-bh/2)}}
  }
  g.save();g.translate(cx,cy);g.rotate(rot);g.scale(sc,sc);
  let wh=null;
  if(isMedia(c)){
    const src=getSrc(c);
    if(src){
      const sw=src.videoWidth||src.naturalWidth||src.width,sh=src.videoHeight||src.naturalHeight||src.height;
      const mode=c.fit==='cover'?'cover':'contain';const [dw,dh]=fitWH(sw,sh,W,H,mode);
      if(c.fit==='blurfill'){const [bw2,bh2]=fitWH(sw,sh,W,H,'cover');g.save();if(hasFilter)g.filter=`blur(${Math.round(28*u)}px) brightness(.7)`;g.drawImage(src,-bw2/2*1.08,-bh2/2*1.08,bw2*1.08,bh2*1.08);g.restore()}
      const p=clipParams(c,lt),ex=glExtras(c);let img=src;
      if(GLX&&needsGL(p,ex)){const cap=S.exporting?2400:1400;const k=clamp(Math.min(cap/Math.max(sw,sh),Math.max(dw*sc,64)/sw*1.15),.25,1);try{img=GLX.run(src,sw*k,sh*k,p,t,ex)}catch(e){img=src}}
      g.drawImage(img,-dw/2,-dh/2,dw,dh);wh=[dw,dh];
      if(p.split>-.5)drawSplit(g,p.split,dw,dh,H,u);
    }
  }else if(c.kind==='text')wh=drawText(g,c,lt,u);
  else if(c.kind==='caption')wh=drawCaption(g,c,lt,u);
  else if(c.kind==='shape')wh=drawShape(g,c,u,lt);
  else if(c.kind==='color'){const a=c.angle*Math.PI/180,dx=Math.cos(a)*W/2,dy=Math.sin(a)*H/2;g.fillStyle=lg(g,-dx,-dy,dx,dy,[[0,c.c1],[1,c.c2]]);g.fillRect(-W/2-2,-H/2-2,W+4,H+4);wh=[W,H]}
  g.restore();
  if(isGraphic(c)){const bl=c.fx.find(f=>f.id==='blur');if(bl&&hasFilter&&bl.v>0){g.save();g.filter=`blur(${bl.v*8*u}px)`;g.globalCompositeOperation='copy';g.drawImage(L,0,0);g.restore()}}
  fxOverlay(g,c,lt,W,H,u);
  if(wh)bounds[c.id]={cx,cy,w:wh[0]*sc,h:wh[1]*sc,rot};
  return !!wh;
}
function drawSplit(g,split,dw,dh,H,u){
  const x=-dw/2+split*dw;g.save();g.fillStyle='#fff';g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=10*u;g.fillRect(x-1.5*u,-dh/2,3*u,dh);g.beginPath();g.arc(x,0,22*u,0,7);g.fill();g.shadowBlur=0;g.fillStyle='#1C1B19';g.beginPath();g.moveTo(x-12*u,0);g.lineTo(x-4*u,-7*u);g.lineTo(x-4*u,7*u);g.fill();g.beginPath();g.moveTo(x+12*u,0);g.lineTo(x+4*u,-7*u);g.lineTo(x+4*u,7*u);g.fill();
  g.font=`700 ${34*u}px "Inter", sans-serif`;g.textBaseline='top';const ty=-Math.min(dh,H)/2+30*u;
  const tag=(s,x2,al)=>{g.textAlign=al;const tw=g.measureText(s).width;g.fillStyle='rgba(17,19,26,.72)';rr(g,al==='right'?x2-tw-36*u:x2,ty,tw+36*u,56*u,28*u);g.fill();g.fillStyle='#fff';g.fillText(s,al==='right'?x2-18*u:x2+18*u,ty+11*u)};
  if(split>.12)tag('AVANT',x-34*u,'right');if(split<.88)tag('APRÈS',x+34*u,'left');g.restore();
}
