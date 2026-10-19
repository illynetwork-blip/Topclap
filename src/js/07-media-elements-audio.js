/* ---------- media elements & audio ---------- */
/* Each video/audio clip owns one media element routed through: source → high-pass → presence EQ → compressor → gain → master.
   "Voix claire" switches the EQ/compressor on; music clips can be ducked automatically under voice clips. */
let AC=null,master=null,exportDest=null;const chains=new Map();const els={};
function connectEl(el){
  if(!AC||chains.has(el))return;
  try{const s=AC.createMediaElementSource(el);const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=10;
    const pk=AC.createBiquadFilter();pk.type='peaking';pk.frequency.value=3200;pk.Q.value=.9;pk.gain.value=0;
    const cp=AC.createDynamicsCompressor();cp.threshold.value=0;cp.ratio.value=1;cp.attack.value=.005;cp.release.value=.2;
    const g=AC.createGain();s.connect(hp);hp.connect(pk);pk.connect(cp);cp.connect(g);g.connect(master);chains.set(el,{g,hp,pk,cp,fx:false})}catch(e){}
}
function ensureAudio(){
  try{if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.connect(AC.destination);exportDest=AC.createMediaStreamDestination();master.connect(exportDest);Object.values(els).forEach(connectEl)}
  if(AC.state==='suspended')AC.resume()}catch(e){}
}
function elFor(c){
  let e=els[c.id];const m=media[c.mediaId];if(!m)return null;
  if(e&&e._src===m.url)return e;
  e=document.createElement(c.kind==='audio'?'audio':'video');e._src=m.url;e.src=m.url;e.preload='auto';e.playsInline=true;e.setAttribute('playsinline','');
  e.addEventListener('seeked',req);e.addEventListener('loadeddata',req);
  els[c.id]=e;connectEl(e);return e;
}
function setVol(e,v,voiceFx){
  const ch=chains.get(e);
  if(ch){ch.g.gain.value=v;if(ch.fx!==!!voiceFx){ch.fx=!!voiceFx;ch.hp.frequency.value=voiceFx?90:10;ch.pk.gain.value=voiceFx?3.5:0;ch.cp.threshold.value=voiceFx?-24:0;ch.cp.ratio.value=voiceFx?4:1}}
  else{e.volume=clamp(v);e.muted=v<=0}
}
function inTransAsA(c,t){const tr=trackOf(c);if(!tr)return false;const nx=P.clips.find(o=>o.trackId===c.trackId&&o!==c&&Math.abs(o.start-(c.start+c.dur))<.02&&o.trans.type!=='none');return !!nx&&t>=nx.start&&t<nx.start+nx.trans.dur}
const isVoice=c=>(c.kind==='audio'||c.kind==='video')&&c.role==='voice';
function duckFactor(t){let f=0;for(const v of P.clips){if(!isVoice(v))continue;const tr=trackOf(v);if(tr&&tr.muted)continue;const a=clamp((t-(v.start-.3))/.3),b=clamp(((v.start+v.dur+.3)-t)/.3);f=Math.max(f,Math.min(a,b))}return f}
function clipGain(c,t){
  const tr=trackOf(c),lt=t-c.start;let env=1;if(c.fadeIn>0)env=Math.min(env,lt/c.fadeIn);if(c.fadeOutA>0)env=Math.min(env,(c.dur-lt)/c.fadeOutA);
  let v=(tr&&tr.muted?0:1)*c.volume*clamp(env,0,1)*(lt<c.dur?1:0);
  if(c.duck>0&&!isVoice(c))v*=1-c.duck*duckFactor(t);
  return v;
}
function syncMedia(t,playing){
  for(const c of P.clips){
    if(c.kind!=='video'&&c.kind!=='audio')continue;const e=elFor(c);if(!e)continue;
    const tr=trackOf(c),lt=t-c.start;const active=(lt>=0&&lt<c.dur)||(c.kind==='video'&&inTransAsA(c,t));
    const m=media[c.mediaId];let srcT=c.in+lt*c.speed;if(m&&isFinite(m.dur))srcT=Math.min(srcT,m.dur-.04);srcT=Math.max(0,srcT);
    if(playing&&active&&!(tr&&tr.hidden&&c.kind==='video')){
      const rate=clamp(c.speed*(S.exporting?1:(S.rate||1)),.0625,16);if(e.playbackRate!==rate)e.playbackRate=rate;
      if(e.paused){try{e.currentTime=srcT}catch(_){}const pr=e.play();if(pr)pr.catch(()=>{})}else if(Math.abs(e.currentTime-srcT)>.3){try{e.currentTime=srcT}catch(_){}}
      setVol(e,clipGain(c,t),c.voiceFx);
    }else{
      if(!e.paused)e.pause();
      if(!playing&&active&&c.kind==='video'&&!e.seeking&&e.readyState>=1&&Math.abs(e.currentTime-srcT)>.035){try{e.currentTime=srcT}catch(_){}}
    }
  }
}
function pauseAll(){Object.values(els).forEach(e=>{if(!e.paused)e.pause()})}
