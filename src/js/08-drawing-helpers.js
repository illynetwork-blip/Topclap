/* ---------- drawing helpers ---------- */
function getSrc(c){
  if(c.kind==='scene')return SCN[c.scene]||SCN.villa;
  const m=media[c.mediaId];if(!m)return null;
  if(c.kind==='image')return m.el&&m.el.complete&&m.el.naturalWidth?m.el:null;
  if(c.kind==='video'){const e=elFor(c);return e&&e.readyState>=2&&e.videoWidth?e:null}
  return null;
}
const fitWH=(sw,sh,W,H,mode)=>{const r=mode==='cover'?Math.max(W/sw,H/sh):Math.min(W/sw,H/sh);return [sw*r,sh*r]};
const fontStr=(c,sz,font=c.font,w=c.weight)=>`${c.italic?'italic ':''}${w} ${sz}px "${font}", "Onest", sans-serif`;
const fontsReq=new Set();
function ensureFont(f,w){const k=f+w;if(fontsReq.has(k)||!document.fonts)return;fontsReq.add(k);document.fonts.load(`${w} 40px "${f}"`).then(req).catch(()=>{})}

function textAnim(c,lt){
  const A={a:1,dx:0,dy:0,sc:1,blur:0,tw:null,letters:null,wipe:1};
  const p=c.animIn!=='none'&&c.inDur>0?clamp(lt/c.inDur):1,e=ease.out(p);
  switch(c.animIn){case'fade':A.a*=p;break;case'slide-up':A.dy+=(1-e)*90;A.a*=p;break;case'slide-down':A.dy-=(1-e)*90;A.a*=p;break;
    case'slide-left':A.dx+=(1-e)*180;A.a*=p;break;case'slide-right':A.dx-=(1-e)*180;A.a*=p;break;case'pop':A.sc*=p<1?Math.max(0,ease.back(p)):1;A.a*=clamp(p*4);break;
    case'zoom':A.sc*=1+(1-e)*.8;A.a*=p;break;case'blur':A.blur=(1-p)*26;A.a*=p;break;case'typewriter':A.tw=p;break;case'letters':A.letters=p;break;case'wipe':A.wipe=ease.inOut(p);break;case'count':A.count=ease.out(p);A.a*=clamp(p*5);break;}
  const q=c.animOut!=='none'&&c.outDur>0?clamp((c.dur-lt)/c.outDur):1,eq=1-ease.out(q);
  switch(c.animOut){case'fade':A.a*=q;break;case'slide-up':A.dy-=eq*90;A.a*=q;break;case'slide-down':A.dy+=eq*90;A.a*=q;break;
    case'zoom':A.sc*=1+eq*.5;A.a*=q;break;case'blur':A.blur+=eq*26;A.a*=q;break;case'wipe':A.wipe*=q;break;}
  return A;
}
function countText(s,k){return s.replace(/\d[\d \u202f\u00a0.]*\d|\d/g,m=>{const n=parseInt(m.replace(/\D/g,''),10);if(!isFinite(n))return m;const v=Math.round(n*k);const sep=/[ \u202f\u00a0]/.test(m)?' ':/\./.test(m)?'.':'';return sep?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,sep):String(v)})}
function drawText(g,c,lt,u,measure){
  const lines=((c.upper?c.text.toUpperCase():c.text)||' ').split('\n');ensureFont(c.font,c.weight);
  const base=c.size*u,sizes=lines.map((_,i)=>i===0?base:base*c.sub),lhs=sizes.map(s=>s*c.lh);
  const hasLS='letterSpacing' in g;if(hasLS)g.letterSpacing=(c.ls*u)+'px';
  const widths=lines.map((l,i)=>{g.font=fontStr(c,sizes[i]);return g.measureText(l).width});
  const bw=Math.max(1,...widths),bh=lhs.reduce((a,b)=>a+b,0),pad=c.pad*u;
  if(measure){if(hasLS)g.letterSpacing='0px';return [bw+2*pad,bh+2*pad]}
  const A=textAnim(c,lt);if(A.count!=null)for(let i=0;i<lines.length;i++)lines[i]=countText(lines[i],A.count);
  g.save();g.globalAlpha*=A.a;g.translate(A.dx*u,A.dy*u);g.scale(A.sc,A.sc);
  if(A.blur>.3&&hasFilter)g.filter=`blur(${(A.blur*u).toFixed(1)}px)`;
  if(A.wipe<1){g.beginPath();g.rect(-bw/2-pad-2,-bh/2-pad-base,(bw+2*pad+4)*A.wipe,bh+2*pad+base*2);g.clip()}
  if(c.bgA>0){g.save();g.globalAlpha*=c.bgA;g.fillStyle=c.bg;rr(g,-bw/2-pad,-bh/2-pad,bw+2*pad,bh+2*pad,c.radius*u);g.fill();g.restore()}
  if(c.shadowBlur>0){g.shadowColor=c.shadowColor;g.shadowBlur=c.shadowBlur*u;g.shadowOffsetY=c.shadowY*u}
  g.textBaseline='middle';g.textAlign='left';g.lineJoin='round';
  const total=lines.reduce((a,l)=>a+[...l].length,0);let y=-bh/2,ci=0;
  const sf=(s,x,yy)=>{if(c.sw>0){g.lineWidth=c.sw*u;g.strokeStyle=c.stroke;g.strokeText(s,x,yy)}g.fillStyle=c.color;g.fillText(s,x,yy)};
  lines.forEach((line,i)=>{
    g.font=fontStr(c,sizes[i]);const lh=lhs[i],cy=y+lh/2;y+=lh;const w=widths[i];
    const w2=A.count!=null?g.measureText(line).width:w;const x0=c.align==='left'?-bw/2:c.align==='right'?bw/2-w2:-w2/2;const ch=[...line];
    if(A.letters!=null){ch.forEach((k,j)=>{const pi=clamp((A.letters*(total+8)-(ci+j))/8);if(pi<=0)return;const x=x0+g.measureText(ch.slice(0,j).join('')).width;g.save();g.globalAlpha*=pi;sf(k,x,cy+(1-ease.out(pi))*sizes[i]*.45);g.restore()})}
    else{let s=line;if(A.tw!=null){const rem=Math.floor(A.tw*total)-ci;s=rem<=0?'':ch.slice(0,rem).join('')}if(s)sf(s,x0,cy)}
    ci+=ch.length;
  });
  g.restore();if(hasLS)g.letterSpacing='0px';
  return [bw+2*pad,bh+2*pad];
}
function drawShape(g,c,u,lt=0){
  const w=c.w*u,h=c.h*u,sw=c.sw*u;g.fillStyle=c.fill;g.strokeStyle=c.stroke;g.lineWidth=sw;g.lineJoin='round';
  const fillStroke=()=>{if(c.shape!=='frame'&&c.shape!=='line')g.fill();if(sw>0)g.stroke()};
  const label=(col=c.labelColor,sz=Math.min(h*.42,w*.18),x=0,al='center',weight=800)=>{if(!c.label)return;g.save();g.fillStyle=col;g.font=`${weight} ${sz}px "${c.font}", "Onest", sans-serif`;ensureFont(c.font,weight);g.textAlign=al;g.textBaseline='middle';g.fillText(c.label,x,0);g.restore()};
  switch(c.shape){
    case'rect':g.beginPath();g.rect(-w/2,-h/2,w,h);fillStroke();label();break;
    case'round':rr(g,-w/2,-h/2,w,h,Math.min(w,h)*.22);fillStroke();label();break;
    case'circle':g.beginPath();g.ellipse(0,0,w/2,h/2,0,0,Math.PI*2);fillStroke();label();break;
    case'frame':g.lineWidth=Math.max(2,sw||8*u);g.strokeStyle=c.fill;g.strokeRect(-w/2,-h/2,w,h);break;
    case'line':g.fillRect(-w/2,-Math.max(2,h*.04)/2,w,Math.max(2,h*.04));break;
    case'arrow':{const s=h*.22;g.beginPath();g.moveTo(-w/2,-s/2);g.lineTo(w/2-h*.5,-s/2);g.lineTo(w/2-h*.5,-h/2);g.lineTo(w/2,0);g.lineTo(w/2-h*.5,h/2);g.lineTo(w/2-h*.5,s/2);g.lineTo(-w/2,s/2);g.closePath();fillStroke();break}
    case'tag':{g.beginPath();g.moveTo(-w/2,0);g.lineTo(-w/2+h*.45,-h/2);g.lineTo(w/2,-h/2);g.lineTo(w/2,h/2);g.lineTo(-w/2+h*.45,h/2);g.closePath();fillStroke();g.save();g.globalCompositeOperation='destination-out';g.beginPath();g.arc(-w/2+h*.38,0,h*.1,0,7);g.fill();g.restore();g.save();g.translate(h*.2,0);label();g.restore();break}
    case'pin':{const r=Math.min(w,h*.8)/2;g.beginPath();g.arc(0,-h/2+r,r,Math.PI*.82,Math.PI*.18,false);g.lineTo(0,h/2);g.closePath();fillStroke();g.save();g.globalCompositeOperation='destination-out';g.beginPath();g.arc(0,-h/2+r,r*.4,0,7);g.fill();g.restore();break}
    case'stamp':{g.save();g.strokeStyle=c.fill;g.lineWidth=Math.max(3,h*.06);rr(g,-w/2,-h/2,w,h,h*.12);g.stroke();g.lineWidth=Math.max(1.5,h*.025);rr(g,-w/2+h*.1,-h/2+h*.1,w-h*.2,h-h*.2,h*.08);g.stroke();g.restore();label(c.fill,h*.46,0,'center',900);break}
    case'ribbon':g.beginPath();g.rect(-w/2,-h/2,w,h);g.fill();g.save();g.globalAlpha=.25;g.fillStyle='#000';g.fillRect(-w/2,h/2-h*.12,w,h*.12);g.restore();label(c.labelColor,h*.44);break;
    case'house':{g.save();g.strokeStyle=c.fill;g.lineWidth=Math.max(3,Math.min(w,h)*.07);g.lineJoin='round';g.lineCap='round';g.beginPath();g.moveTo(-w/2,-h*.02);g.lineTo(0,-h/2);g.lineTo(w/2,-h*.02);g.moveTo(-w*.36,-h*.14);g.lineTo(-w*.36,h/2);g.lineTo(w*.36,h/2);g.lineTo(w*.36,-h*.14);g.moveTo(-w*.1,h/2);g.lineTo(-w*.1,h*.14);g.lineTo(w*.1,h*.14);g.lineTo(w*.1,h/2);g.stroke();g.restore();break}
    case'progress':{const p=clamp(lt/Math.max(.1,c.dur));rr(g,-w/2,-h/2,w,h,h/2);g.save();g.globalAlpha*=.3;g.fillStyle=c.stroke;g.fill();g.restore();g.save();rr(g,-w/2,-h/2,w,h,h/2);g.clip();g.fillStyle=c.fill;g.fillRect(-w/2,-h/2,w*p,h);g.restore();break}
    case'lowerbar':{const gr=g.createLinearGradient(-w/2,0,w/2,0);gr.addColorStop(0,c.fill);gr.addColorStop(.75,c.fill+'CC');gr.addColorStop(1,c.fill+'00');g.fillStyle=gr;g.fillRect(-w/2,-h/2,w,h);g.fillStyle=c.labelColor;g.fillRect(-w/2,-h/2,Math.max(4,h*.06),h);label(c.labelColor,h*.36,-w/2+h*.35,'left',700);break}
  }
  return [w,h];
}
function fxMotion(c,lt){
  const prog=clamp(lt/c.dur);let ex=0,ey=0,es=1,er=0;
  for(const f of c.fx){const v=f.v;switch(f.id){
    case'kb-in':es*=1+.2*v*ease.inOut(prog);break;case'kb-out':es*=1+.2*v*(1-ease.inOut(prog));break;
    case'pan-l':es*=1+.16*v;ex+=.065*v*(1-2*prog);break;case'pan-r':es*=1+.16*v;ex-=.065*v*(1-2*prog);break;
    case'tilt-up':es*=1+.16*v;ey-=.065*v*(1-2*prog);break;
    case'drone':es*=1+.38*v*ease.inOut(prog);er+=2.2*v*(prog-.5);break;
    case'orbit':es*=1+.14*v;er+=5*v*(prog-.5);break;
    case'pulse':es*=1+.045*v*Math.pow(.5+.5*Math.sin(lt*Math.PI*2*1.67),3);break;
    case'shake':{const k=lt*13;ex+=(rnd(Math.floor(k))-.5+(rnd(Math.floor(k)+1)-rnd(Math.floor(k)))*(k%1))*.018*v;ey+=(rnd(Math.floor(k)+50)-.5)*.014*v;er+=(rnd(Math.floor(k)+99)-.5)*1.2*v;es*=1+.03*v;break}
  }}
  return {ex,ey,es,er};
}
function fxOverlay(g,c,lt,W,H,u){
  for(const f of c.fx){const v=f.v;switch(f.id){
    case'flash':if(lt<.5){g.save();g.globalAlpha=(1-lt/.5)*v;g.fillStyle='#fff';g.fillRect(0,0,W,H);g.restore()}break;
    case'leak':{g.save();g.globalCompositeOperation='screen';for(let i=0;i<2;i++){const x=W*(.2+.6*(.5+.5*Math.sin(lt*.6+i*2.4))),y=H*(.3+.4*(.5+.5*Math.cos(lt*.45+i))),r=Math.max(W,H)*(.45+.1*i);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,i?`rgba(255,110,140,${.45*v})`:`rgba(255,170,80,${.55*v})`);gr.addColorStop(1,'rgba(255,120,60,0)');g.fillStyle=gr;g.fillRect(0,0,W,H)}g.restore();break}
    case'bokeh':{g.save();g.globalCompositeOperation='screen';for(let i=0;i<26;i++){const r=(10+rnd(i)*36)*u,x=rnd(i+3)*W+Math.sin(lt*.4+i)*20*u,y=((rnd(i+7)*H-lt*(18+rnd(i)*30)*u)%H+H)%H;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(255,214,150,${.5*v})`);gr.addColorStop(.7,`rgba(255,190,110,${.18*v})`);gr.addColorStop(1,'rgba(255,190,110,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill()}g.restore();break}
    case'snow':{g.save();g.fillStyle='rgba(255,255,255,.9)';const n=Math.round(160*v);for(let i=0;i<n;i++){const s=(1.5+rnd(i)*3.5)*u,sp=40+rnd(i+1)*80,x=(rnd(i+2)*W+Math.sin(lt*1.2+i)*18*u)%W,y=((rnd(i+5)*H+lt*sp*u*2)%H);g.globalAlpha=.4+rnd(i+9)*.6;g.beginPath();g.arc(x,y,s,0,7);g.fill()}g.restore();break}
    case'rain':{g.save();g.strokeStyle='rgba(200,215,235,.55)';g.lineWidth=1.6*u;const n=Math.round(220*v);g.beginPath();for(let i=0;i<n;i++){const x=(rnd(i)*W*1.2+lt*-160*u)%W,len=(20+rnd(i+1)*30)*u,y=((rnd(i+3)*H+lt*(900+rnd(i)*500)*u)%H);g.moveTo(x,y);g.lineTo(x-len*.25,y+len)}g.stroke();g.globalAlpha=.12*v;g.fillStyle='#0d1830';g.fillRect(0,0,W,H);g.restore();break}
    case'letterbox':{const b=H*.12*v;g.fillStyle='#000';g.fillRect(0,0,W,b);g.fillRect(0,H-b,W,b);break}
    case'glitch':if(glitchBurst(lt)){const seed=Math.floor(lt*24);for(let i=0;i<7;i++){const y=rnd(seed*13+i)*H,h=(4+rnd(seed+i*7)*40)*u,dx=(rnd(seed*3+i)-.5)*90*u*v;try{g.drawImage(g.canvas,0,y,W,h,dx,y,W,h)}catch(e){}}}break;
  }}
}

/* word-by-word captions (karaoke / pop / classic / boxed) */
function captionGroups(c){
  if(c._g&&c._gk===c.words.length+':'+c.maxWords)return c._g;
  const gs=[];let cur=[];c.words.forEach((w,i)=>{const prev=c.words[i-1];if(cur.length>=c.maxWords||(prev&&w.s-prev.e>.6)||(prev&&/[.!?]$/.test(prev.w))){gs.push(cur);cur=[]}cur.push(i)});if(cur.length)gs.push(cur);
  Object.defineProperty(c,'_g',{value:gs,writable:true,configurable:true,enumerable:false});Object.defineProperty(c,'_gk',{value:c.words.length+':'+c.maxWords,writable:true,configurable:true,enumerable:false});return gs;
}
function drawCaption(g,c,lt,u,measure){
  ensureFont(c.font,c.weight);const ws=c.words;if(!ws.length)return [10,10];
  const gs=captionGroups(c);let gi=gs.findIndex(gr=>lt>=ws[gr[0]].s-.05&&lt<=ws[gr[gr.length-1]].e+.25);
  if(gi<0){if(measure)gi=0;else return [10,10]}
  const grp=gs[gi],sz=c.size*u;g.font=fontStr(c,sz);g.textBaseline='middle';g.textAlign='left';g.lineJoin='round';
  const txt=i=>c.upper?ws[i].w.toUpperCase():ws[i].w;const space=g.measureText(' ').width*1.25+c.sw*u*.6+sz*.04;
  const single=c.style==='pop';const items=single?[grp.find(i=>lt>=ws[i].s&&lt<ws[i].e+.05)??grp.filter(i=>lt>=ws[i].s).pop()??grp[0]]:grp;
  const widths=items.map(i=>g.measureText(txt(i)).width);const maxW=1080*u*.86;const lines=[[]];let lw=0;
  items.forEach((it,k)=>{const w=widths[k];if(lw>0&&lw+space+w>maxW){lines.push([]);lw=0}lines[lines.length-1].push(k);lw+=(lw>0?space:0)+w});
  const lh=sz*1.18,bh=lines.length*lh;const lineW=l=>l.reduce((a,k,j)=>a+widths[k]+(j?space:0),0);const bw=Math.max(...lines.map(lineW));
  const pad=c.bgA>0?sz*.3:0;if(measure)return [bw+2*pad+sz*.4,bh+2*pad];
  if(c.bgA>0){g.save();g.globalAlpha*=c.bgA;g.fillStyle=c.bg;rr(g,-bw/2-pad,-bh/2-pad,bw+2*pad,bh+2*pad,sz*.25);g.fill();g.restore()}
  lines.forEach((l,li)=>{let x=-lineW(l)/2;const y=-bh/2+lh*li+lh/2;
    l.forEach(k=>{const i=items[k],w=widths[k],s=txt(i),act=lt>=ws[i].s&&lt<ws[i].e+.02,past=lt>=ws[i].e;
      let sc=1,col=c.color;if(c.style==='karaoke'){if(act){col=c.hl;sc=1.05}}else if(c.style==='boxed'){if(act){g.save();g.fillStyle=c.hl;rr(g,x-sz*.12,y-sz*.62,w+sz*.24,sz*1.24,sz*.16);g.fill();g.restore();col=pickInk(c.hl)}}
      else if(c.style==='pop'){const pp=clamp((lt-ws[i].s)/.12);sc=.6+.4*ease.back(pp);col=c.hl}else if(c.style==='classic'){if(!past&&!act)col=c.color;if(act)col=c.hl}
      g.save();g.translate(x+w/2,y);g.scale(sc,sc);if(c.sw>0&&c.style!=='boxed'){g.lineWidth=c.sw*u;g.strokeStyle=c.stroke;g.strokeText(s,-w/2,0)}g.fillStyle=col;g.fillText(s,-w/2,0);g.restore();x+=w+space})});
  return [bw+2*pad+sz*.4,bh+2*pad];
}
function pickInk(hex){const [r,g,b]=hexRGB(hex);return (r*.299+g*.587+b*.114)>.6?'#111111':'#FFFFFF'}
