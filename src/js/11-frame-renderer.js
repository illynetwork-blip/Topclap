/* ---------- frame renderer ---------- */
function renderFrame(t){
  const W=cv.width,H=cv.height,u=Math.min(W,H)/1080;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
  ctx.fillStyle=P.bg;ctx.fillRect(0,0,W,H);
  for(const k in bounds)delete bounds[k];
  const order=P.tracks.filter(tr=>tr.kind!=='audio'&&!tr.hidden).slice().reverse();
  for(const tr of order){
    const cs=P.clips.filter(c=>c.trackId===tr.id).sort((a,b)=>a.start-b.start);
    for(const c of cs){
      const lt=t-c.start;if(lt<0||lt>=c.dur)continue;
      let al=clamp(kv(c,'opacity',lt));if(c.fadeOut>0)al*=clamp((c.dur-lt)/c.fadeOut);
      if(c.kind==='adjust'){
        if(GLX){const p=clipParams(c,lt),ex=glExtras(c);if(needsGL(p,ex)){try{const img=GLX.run(cv,W,H,p,t,ex);ctx.globalAlpha=al;ctx.drawImage(img,0,0);ctx.globalAlpha=1}catch(e){}}}
        ctx.save();ctx.globalAlpha=al;fxOverlay(ctx,c,lt,W,H,u);ctx.restore();continue;
      }
      const tt=c.trans;const inT=tt&&tt.type!=='none'&&lt<tt.dur;
      if(inT){
        const prev=cs.find(o=>o!==c&&o.kind!=='adjust'&&Math.abs(o.start+o.dur-c.start)<.02);
        L1.getContext('2d').clearRect(0,0,W,H);L2.getContext('2d').clearRect(0,0,W,H);
        if(prev)renderClip(prev,t,L1);renderClip(c,t,L2);
        compose(ctx,tt.type,prev?L1:null,L2,clamp(lt/tt.dur),W,H,al);
      }else{
        const g1=L1.getContext('2d');g1.clearRect(0,0,W,H);renderClip(c,t,L1);
        ctx.globalAlpha=al;ctx.globalCompositeOperation=c.blend||'source-over';ctx.drawImage(L1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
      }
    }
  }
}
