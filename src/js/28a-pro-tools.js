/* ---------- pro tools: LUTs, colour wheels, scopes, audio analysis, scenes, freeze frame, captions ---------- */

/* ===== LUT 3D (.cube) ===== */
function cubeToData(n,get){const data=new Uint8Array(n*n*n*4);for(let b=0;b<n;b++)for(let g=0;g<n;g++)for(let r=0;r<n;r++){const o=get(r/(n-1),g/(n-1),b/(n-1),r+g*n+b*n*n);const i=(g*(n*n)+b*n+r)*4;data[i]=clamp(o[0])*255;data[i+1]=clamp(o[1])*255;data[i+2]=clamp(o[2])*255;data[i+3]=255}return data}
function parseCube(txt){
  let n=0,mn=[0,0,0],mx=[1,1,1];const vals=[];
  for(const raw of txt.split(/\r?\n/)){const l=raw.trim();if(!l||l[0]==='#')continue;
    if(/^LUT_3D_SIZE/i.test(l)){n=parseInt(l.split(/\s+/)[1]);continue}
    if(/^DOMAIN_MIN/i.test(l)){mn=l.split(/\s+/).slice(1,4).map(Number);continue}
    if(/^DOMAIN_MAX/i.test(l)){mx=l.split(/\s+/).slice(1,4).map(Number);continue}
    if(/^[A-Z_]/i.test(l))continue;const p=l.split(/\s+/).map(Number);if(p.length>=3&&p.every(isFinite))vals.push(p)}
  if(!n||n<2||n>65||vals.length<n*n*n)throw new Error('Fichier .cube invalide (LUT 3D attendue)');
  return {n,data:cubeToData(n,(r,g,b,i)=>vals[i].slice(0,3).map((v,k)=>(v-mn[k])/((mx[k]-mn[k])||1)))};
}
function builtinLUTs(){
  const lum=(r,g,b)=>r*.2126+g*.7152+b*.0722,mix=(a,b,t)=>a+(b-a)*t,sc=t=>t*t*(3-2*t);
  const defs={
    'lut-teal-orange':['Teal & Orange',(r,g,b)=>{const L=lum(r,g,b),k=sc(L);return [mix(r*.9,r*1.12+.03,k),mix(g*1.02,g*1.0,k),mix(b*1.12+.04,b*.82,k)]}],
    'lut-film-warm':['Film chaud 2383',(r,g,b)=>{const c=[r,g,b].map(v=>sc(sc(v)*.85+v*.15));return [c[0]*1.05+.02,c[1]*.98+.015,c[2]*.86+.03]}],
    'lut-bleach':['Bleach bypass',(r,g,b)=>{const L=lum(r,g,b);return [r,g,b].map(v=>{const d=mix(v,L,.6);return sc(d)*.9+d*.1})}],
    'lut-day-night':['Nuit américaine',(r,g,b)=>{const L=lum(r,g,b);return [L*.35+r*.1,L*.45+g*.12,L*.75+b*.25].map(v=>v*.7)}],
    'lut-luxe-gold':['Luxe doré',(r,g,b)=>{const L=lum(r,g,b);return [r*1.06+.02*(1-L),g*1.01+.01,b*.88+.04*(1-L)].map(v=>mix(v,sc(v),.3))}],
    'lut-clean-white':['Blanc architecture',(r,g,b)=>{const L=lum(r,g,b),k=sc(clamp((L-.55)/.45));return [mix(r,1,k*.35),mix(g,1,k*.35),mix(b*1.02,1,k*.4)]}],
  };
  for(const id in defs){const [name,fn]=defs[id];LUTS[id]={id,name,n:17,data:cubeToData(17,fn),builtin:true}}
}
builtinLUTs();
async function importLUTFile(f){
  try{const txt=await f.text();const {n,data}=parseCube(txt);const id='lut-'+uid();LUTS[id]={id,name:f.name.replace(/\.cube$/i,''),n,data};
    media[id]={id,type:'lut',name:LUTS[id].name,blob:new Blob([txt],{type:'text/plain'})};IDB.put(id,media[id].blob);
    const c=selClip();if(c&&(isMedia(c)||c.kind==='adjust')){c.grade.lut=id;commit();refreshAll()}toast(`LUT « ${LUTS[id].name} » importée (${n}³)`);saveSoon();return id}
  catch(e){toast(e.message||'LUT illisible')}
}

/* ===== colour wheels (lift / gamma / gain), DaVinci-style ===== */
const WHEEL_K={lift:.14,gamma:.45,gain:.4};
function wheelVec(name,w){const [a,r,m]=w;const h=a,base=[0,1,2].map(i=>Math.cos(h-i*2.0944));const mean=0;const k=WHEEL_K[name];return base.map(v=>(v-mean)*r*k+m*k)}
function drawWheel(cn,w){const g=cn.getContext('2d'),s=cn.width,R=s/2-6;g.clearRect(0,0,s,s);
  for(let i=0;i<72;i++){g.beginPath();g.moveTo(s/2,s/2);g.arc(s/2,s/2,R,(i-.6)/72*Math.PI*2,(i+.6)/72*Math.PI*2);g.closePath();
    const ang=i/72*Math.PI*2;const rgb=[0,1,2].map(k=>Math.round(128+100*Math.cos(ang-k*2.0944)));g.fillStyle=`rgb(${rgb})`;g.fill()}
  const gr=g.createRadialGradient(s/2,s/2,0,s/2,s/2,R);gr.addColorStop(0,'rgba(36,40,52,1)');gr.addColorStop(.92,'rgba(36,40,52,.15)');gr.addColorStop(1,'rgba(36,40,52,0)');g.fillStyle=gr;g.beginPath();g.arc(s/2,s/2,R,0,7);g.fill();
  g.strokeStyle='rgba(255,255,255,.18)';g.beginPath();g.moveTo(s/2-6,s/2);g.lineTo(s/2+6,s/2);g.moveTo(s/2,s/2-6);g.lineTo(s/2,s/2+6);g.stroke();
  const x=s/2+Math.cos(w[0])*w[1]*R,y=s/2-Math.sin(w[0])*w[1]*R;g.fillStyle='#fff';g.strokeStyle='#111';g.lineWidth=2;g.beginPath();g.arc(x,y,6,0,7);g.fill();g.stroke()}
function bindWheels(root,c){
  $$('canvas[data-wheel]',root).forEach(cn=>{const name=cn.dataset.wheel;const w=c.grade.wheels[name];drawWheel(cn,w);
    const set=(ev)=>{const r=cn.getBoundingClientRect(),R=r.width/2-6;const dx=ev.clientX-r.left-r.width/2,dy=-(ev.clientY-r.top-r.height/2);w[0]=Math.atan2(dy,dx);w[1]=clamp(Math.hypot(dx,dy)/R);c.grade[name]=wheelVec(name,w);drawWheel(cn,w);req()};
    cn.addEventListener('pointerdown',ev=>{cn.setPointerCapture(ev.pointerId);set(ev);const mv=e2=>set(e2);const up=()=>{cn.removeEventListener('pointermove',mv);cn.removeEventListener('pointerup',up);commit()};cn.addEventListener('pointermove',mv);cn.addEventListener('pointerup',up)});
    cn.addEventListener('dblclick',()=>{w[0]=0;w[1]=0;w[2]=0;c.grade[name]=[0,0,0];drawWheel(cn,w);commit();renderInspector()});
  });
}

/* ===== scopes (histogram, waveform, vectorscope) ===== */
const scopeBox=document.createElement('div');scopeBox.id='scopes';scopeBox.hidden=true;
scopeBox.innerHTML='<div class="sc-h"><select id="scopeType" aria-label="Type de scope"><option value="wave">Forme d\'onde</option><option value="parade">Parade RVB</option><option value="hist">Histogramme</option><option value="vec">Vecteurscope</option></select><button class="mini" id="scopeX" aria-label="Fermer les scopes"></button></div><canvas id="scopeCv" width="300" height="170"></canvas>';
const scopeSmall=document.createElement('canvas');scopeSmall.width=160;scopeSmall.height=90;
function drawScopes(){
  if(!S.scopes)return;const t=$('#scopeType').value,cn=$('#scopeCv'),g=cn.getContext('2d'),W=cn.width,H=cn.height;
  const sg=scopeSmall.getContext('2d',{willReadFrequently:true});sg.drawImage(cv,0,0,160,90);const d=sg.getImageData(0,0,160,90).data;
  g.fillStyle='#0B0C11';g.fillRect(0,0,W,H);g.strokeStyle='rgba(255,255,255,.08)';for(let i=1;i<4;i++){g.beginPath();g.moveTo(0,H*i/4);g.lineTo(W,H*i/4);g.stroke()}
  g.globalCompositeOperation='lighter';
  if(t==='hist'){const bins=[new Array(64).fill(0),new Array(64).fill(0),new Array(64).fill(0)];for(let i=0;i<d.length;i+=4)for(let k=0;k<3;k++)bins[k][d[i+k]>>2]++;const mx=Math.max(...bins.flat())||1;
    ['#E5604F','#4FB96F','#5A86E8'].forEach((col,k)=>{g.fillStyle=col+'AA';g.beginPath();g.moveTo(0,H);bins[k].forEach((v,i)=>g.lineTo(i/63*W,H-v/mx*H*.95));g.lineTo(W,H);g.fill()})}
  else if(t==='wave'||t==='parade'){const cols=t==='parade'?['rgba(229,96,79,.35)','rgba(79,185,111,.35)','rgba(90,134,232,.35)']:['rgba(200,230,210,.28)'];
    for(let i=0;i<d.length;i+=4){const px=(i/4)%160;if(t==='wave'){const L=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255;g.fillStyle=cols[0];g.fillRect(px/160*W,H-L*H,1.6,1.6)}
      else for(let k=0;k<3;k++){g.fillStyle=cols[k];g.fillRect((k*W/3)+px/160*W/3,H-d[i+k]/255*H,1.2,1.2)}}}
  else{const cx=W/2,cy=H/2,R=H/2-8;g.globalCompositeOperation='source-over';g.strokeStyle='rgba(255,255,255,.18)';g.beginPath();g.arc(cx,cy,R,0,7);g.stroke();g.beginPath();g.moveTo(cx,cy);g.lineTo(cx-R*.55,cy-R*.75);g.stroke();
    g.globalCompositeOperation='lighter';for(let i=0;i<d.length;i+=8){const r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255;const cb=-.1687*r-.3313*gg+.5*b,cr=.5*r-.4187*gg-.0813*b;g.fillStyle=`rgba(${d[i]},${d[i+1]},${d[i+2]},.5)`;g.fillRect(cx+cb*R*1.8,cy-cr*R*1.8,1.6,1.6)}}
  g.globalCompositeOperation='source-over';
}

/* ===== audio analysis ===== */
async function decodeMono(m,sr=16000){
  if(m._mono&&m._monoSr===sr)return m._mono;if(!m.blob)throw new Error('Média sans fichier');
  const buf=await m.blob.arrayBuffer();const tmp=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,1,44100);
  let ab;try{ab=await tmp.decodeAudioData(buf)}catch(e){throw new Error('Aucune piste audio lisible dans ce fichier')}
  const len=Math.max(1,Math.ceil(ab.duration*sr));const oc=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,len,sr);const src=oc.createBufferSource();src.buffer=ab;src.connect(oc.destination);src.start();
  const r=await oc.startRendering();m._mono=r.getChannelData(0);m._monoSr=sr;return m._mono;
}
async function detectBeats(m){
  if(m.beats)return m.beats;const sr=11025,d=await decodeMono(m,sr),hop=256,win=512;const nF=Math.floor((d.length-win)/hop);if(nF<16)return (m.beats=[]);
  const en=new Float32Array(nF);for(let f=0;f<nF;f++){let s=0;for(let i=0;i<win;i++){const v=d[f*hop+i];s+=v*v}en[f]=Math.log(1e-6+s)}
  const on=new Float32Array(nF);for(let f=1;f<nF;f++)on[f]=Math.max(0,en[f]-en[f-1]);
  const mean=on.reduce((a,b)=>a+b,0)/nF;for(let f=0;f<nF;f++)on[f]=Math.max(0,on[f]-mean);
  const fps=sr/hop;let best=0,bestLag=fps*.5;
  for(let bpm=70;bpm<=170;bpm+=.5){const lag=60/bpm*fps;let s=0;for(let f=0;f+lag*2<nF;f+=1){s+=on[f]*(on[Math.round(f+lag)]+.5*on[Math.round(f+lag*2)])}s*=1+.15*Math.exp(-Math.pow((bpm-118)/40,2));if(s>best){best=s;bestLag=lag}}
  let bo=0,bs=-1;for(let o=0;o<bestLag;o++){let s=0;for(let k=o;k<nF;k+=bestLag)s+=on[Math.round(k)]||0;if(s>bs){bs=s;bo=o}}
  const beats=[];for(let k=bo;k<nF;k+=bestLag)beats.push(+(k/fps).toFixed(3));m.bpm=Math.round(60*fps/bestLag);m.beats=beats;return beats;
}
async function speechSegments(m,{thr=-38,minSil=.35,pad=.12}={}){
  const sr=16000,d=await decodeMono(m,sr),w=320,n=Math.floor(d.length/w);const db=new Float32Array(n);
  for(let i=0;i<n;i++){let s=0;for(let j=0;j<w;j++){const v=d[i*w+j];s+=v*v}db[i]=10*Math.log10(1e-10+s/w)}
  const sorted=[...db].sort((a,b)=>a-b);const ref=sorted[Math.floor(n*.97)]||0;const segs=[];let cur=null;
  for(let i=0;i<n;i++){const t=i*w/sr,on=db[i]>ref+thr;if(on){if(!cur)cur={s:t,e:t+w/sr};else cur.e=t+w/sr}else if(cur&&t-cur.e>minSil){segs.push(cur);cur=null}}
  if(cur)segs.push(cur);return segs.map(s=>({s:Math.max(0,s.s-pad),e:Math.min(d.length/sr,s.e+pad)})).filter(s=>s.e-s.s>.15);
}
async function removeSilences(c){
  const m=media[c.mediaId];if(!m||(c.kind!=='video'&&c.kind!=='audio')){toast('Sélectionnez une vidéo ou un audio parlé');return}
  toast('Analyse de la voix…');let segs;try{segs=await speechSegments(m)}catch(e){toast(e.message);return}
  const a=c.in,b=c.in+c.dur*c.speed;const parts=segs.map(s=>({s:Math.max(a,s.s),e:Math.min(b,s.e)})).filter(s=>s.e-s.s>.15);
  if(parts.length<=1&&parts[0]&&parts[0].e-parts[0].s>(b-a)*.95){toast('Aucun silence à couper');return}
  const removed=(b-a)-parts.reduce((x,p)=>x+p.e-p.s,0);let t=c.start;const tr=trackOf(c);
  P.clips=P.clips.filter(o=>o!==c);if(tr.kind!=='main'||!S.magnet)P.clips.filter(o=>o.trackId===tr.id&&o.start>c.start).forEach(o=>o.start-=removed/c.speed);
  parts.forEach((p,i)=>{const n=JSON.parse(JSON.stringify(c));n.id=uid();n.in=p.s;n.dur=(p.e-p.s)/c.speed;n.start=t;n.trans={type:'none',dur:.6};n.kf={};if(i>0)n.fadeIn=0;t+=n.dur;P.clips.push(n)});
  packTrack(tr);S.sel=null;commit();refreshAll();toast(`${parts.length} plans gardés, ${removed.toFixed(1)} s de silences retirés`);
}
async function normalizeClip(c){const m=media[c.mediaId];if(!m)return;try{const d=await decodeMono(m,16000);const a=Math.floor(c.in*16000),b=Math.min(d.length,Math.floor((c.in+c.dur*c.speed)*16000));let pk=0;for(let i=a;i<b;i++)pk=Math.max(pk,Math.abs(d[i]));if(pk<1e-4){toast('Clip silencieux');return}c.volume=+clamp(.89/pk,.05,2).toFixed(2);commit();renderInspector();toast(`Volume réglé à ${Math.round(c.volume*100)} % (crête −1 dB)`)}catch(e){toast(e.message)}}
async function beatMarkers(){
  const mc=P.clips.find(c=>c.kind==='audio'&&c.role!=='voice');if(!mc){toast('Ajoutez d\'abord une musique');return null}
  const m=media[mc.mediaId];toast('Détection du rythme…');let beats;try{beats=await detectBeats(m)}catch(e){toast(e.message);return null}
  const abs=beats.map(b=>mc.start+(b-mc.in)/mc.speed).filter(t=>t>=mc.start&&t<=mc.start+mc.dur);
  P.markers=(P.markers||[]).filter(k=>k.color!=='#9D8DF4');abs.forEach((t,i)=>{if(i%2===0)addMarker(t,'Temps',' #9D8DF4'.trim())});
  commit();renderTimeline();toast(`${m.bpm} BPM · ${abs.length} temps détectés`);return abs;
}
async function cutToBeat(minDur=1.2,maxDur=3.6){
  const beats=await beatMarkers();if(!beats||beats.length<4)return;const tr=firstTrack('main');
  const cs=P.clips.filter(c=>c.trackId===tr.id&&c.kind!=='color').sort((a,b)=>a.start-b.start);if(!cs.length)return;
  const t0=cs[0].start,span=cs.reduce((a,c)=>a+c.dur,0),target=clamp(span/cs.length,minDur,maxDur);let t=t0,bi=0;
  for(const c of cs){c.start=t;const want=t+target;while(bi<beats.length-1&&Math.abs(beats[bi+1]-want)<=Math.abs(beats[bi]-want))bi++;
    let end=beats[bi];if(end==null||end<=t+.4||end-t>target*1.6)end=t+target;const dur=clamp(Math.min(end-t,mediaMax(c)),.4,30);c.dur=+dur.toFixed(3);t+=c.dur;c.trans.dur=Math.min(c.trans.dur,c.dur*.4);bi++}
  P.clips.filter(c=>c.trackId===tr.id&&c.kind==='color').forEach(c=>{c.start=t;t+=c.dur});
  commit();refreshAll();toast('Coupes calées sur le rythme de la musique');
}
/* ===== scene detection ===== */
async function detectScenes(m,onProg){
  const v=document.createElement('video');v.muted=true;v.preload='auto';v.src=m.url;await once(v,'loadeddata');
  const cn=document.createElement('canvas');cn.width=64;cn.height=36;const g=cn.getContext('2d',{willReadFrequently:true});const step=m.dur>120?.5:.25;let prev=null,last=0;const cuts=[];
  for(let t=0;t<m.dur;t+=step){v.currentTime=t;await once(v,'seeked',2500);g.drawImage(v,0,0,64,36);const d=g.getImageData(0,0,64,36).data;const h=new Float32Array(48);
    for(let i=0;i<d.length;i+=4){h[d[i]>>4]++;h[16+(d[i+1]>>4)]++;h[32+(d[i+2]>>4)]++}
    if(prev){let s=0;for(let k=0;k<48;k++)s+=Math.abs(h[k]-prev[k]);s/=(64*36*3*2);if(s>.32&&t-last>.8){cuts.push(t);last=t}}prev=h;onProg&&onProg(t/m.dur)}
  return cuts;
}
async function splitScenes(c){
  const m=media[c.mediaId];if(!m||c.kind!=='video'){toast('Sélectionnez une vidéo');return}
  toast('Détection des plans…');const cuts=(await detectScenes(m)).map(t=>c.start+(t-c.in)/c.speed).filter(t=>t>c.start+.3&&t<c.start+c.dur-.3);
  if(!cuts.length){toast('Aucun changement de plan détecté');return}
  let cur=c;for(const t of cuts){const b=JSON.parse(JSON.stringify(cur));b.id=uid();b.start=t;b.in=cur.in+(t-cur.start)*cur.speed;b.dur=cur.start+cur.dur-t;b.trans={type:'none',dur:.6};b.kf={};cur.dur=t-cur.start;P.clips.push(b);cur=b}
  commit();refreshAll();toast(`${cuts.length+1} plans détectés et découpés`);
}

/* ===== quick image analysis (exterior/interior, brightness) ===== */
function analyzeImage(src){
  const cn=document.createElement('canvas');cn.width=64;cn.height=36;const g=cn.getContext('2d',{willReadFrequently:true});try{g.drawImage(src,0,0,64,36)}catch(e){return {sky:0,bright:.5}}
  const d=g.getImageData(0,0,64,36).data;let sky=0,top=0,lum=0;
  for(let y=0;y<36;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255,L=r*.2126+gg*.7152+b*.0722;lum+=L;
    if(y<14){top++;const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);if((b-Math.max(r,gg*.92)>.05&&L>.35)||(L>.88&&(mx-mn)/mx<.12))sky++}}
  return {sky:sky/top,bright:lum/(64*36),exterior:sky/top>.22};
}

/* ===== freeze frame ===== */
async function freezeFrame(){
  const c=selClip();if(!c||c.kind!=='video'){toast('Sélectionnez une vidéo et placez la tête de lecture');return}
  const e=elFor(c);if(!e||e.readyState<2){toast('Image pas encore prête, réessayez');return}
  const cn=document.createElement('canvas');cn.width=e.videoWidth;cn.height=e.videoHeight;cn.getContext('2d').drawImage(e,0,0);
  const blob=await new Promise(r=>cn.toBlob(r,'image/jpeg',.92));const id=uid();const m=await registerMedia(id,blob,{type:'image',name:'Arrêt sur image'});IDB.put(id,blob);
  const t=S.t;if(t>c.start+.05&&t<c.start+c.dur-.05){S.sel=c.id;splitAt(true)}
  const tr=trackOf(c);const at=t;P.clips.filter(o=>o.trackId===tr.id&&o.start>=at-.01).forEach(o=>o.start+=2);
  const f=newClip('image',{mediaId:id,name:'Arrêt sur image',dur:2,fit:c.fit,filter:c.filter,filterAmt:c.filterAmt,adj:{...c.adj},fx:[{id:'kb-in',v:.4}]});f.trackId=tr.id;f.start=at;P.clips.push(f);packTrack(tr);S.sel=f.id;commit();refreshAll();toast('Arrêt sur image de 2 s inséré');
}

/* ===== captions ===== */
function captionTrack(){let tr=P.tracks.find(t=>t.name==='Sous-titres');if(!tr){tr={id:uid(),kind:'text',name:'Sous-titres'};P.tracks.unshift(tr)}return tr}
function wordsFromText(text,t0,t1,segs){
  const ws=text.replace(/\s+/g,' ').trim().split(' ').filter(Boolean);if(!ws.length)return [];
  let spans=segs&&segs.length?segs.map(s=>({s:Math.max(t0,s.s),e:Math.min(t1,s.e)})).filter(s=>s.e-s.s>.1):[{s:t0,e:t1}];if(!spans.length)spans=[{s:t0,e:t1}];
  const total=spans.reduce((a,s)=>a+s.e-s.s,0),wl=ws.map(w=>Math.max(2,w.length)+1),sum=wl.reduce((a,b)=>a+b,0);
  const out=[];let acc=0;const at=x=>{let r=x*total;for(const s of spans){const L=s.e-s.s;if(r<=L)return s.s+r;r-=L}return spans[spans.length-1].e};
  ws.forEach((w,i)=>{const a=acc/sum;acc+=wl[i];const b=acc/sum;out.push({w,s:+at(a).toFixed(3),e:+at(b).toFixed(3)})});return out;
}
function addCaptionClip(words,name='Sous-titres',style){
  if(!words.length){toast('Aucun mot à afficher');return null}
  const tr=captionTrack();const start=Math.max(0,words[0].s-.05),end=words[words.length-1].e+.3;
  const c=newClip('caption',{name,start,dur:end-start,trackId:tr.id,y:P.aspect==='16:9'?.84:P.aspect==='9:16'?.68:.8,words:words.map(w=>({w:w.w,s:+(w.s-start).toFixed(3),e:+(w.e-start).toFixed(3)}))});
  if(style)Object.assign(c,CAPTION_STYLES[style]||{});
  P.clips=P.clips.filter(o=>!(o.trackId===tr.id&&o.kind==='caption'&&o.start<end&&o.start+o.dur>start));P.clips.push(c);return c;
}
const CAPTION_STYLES={
  karaoke:{style:'karaoke',font:'Montserrat',weight:900,color:'#FFFFFF',hl:'#FFD23F',stroke:'#000000',sw:8,upper:true,maxWords:3,bgA:0},
  boxed:{style:'boxed',font:'Poppins',weight:700,color:'#FFFFFF',hl:'#6C5CE7',stroke:'#000000',sw:0,upper:true,maxWords:4,bgA:0},
  pop:{style:'pop',font:'Bebas Neue',weight:400,size:110,color:'#FFFFFF',hl:'#FFFFFF',stroke:'#000000',sw:10,upper:true,maxWords:1,bgA:0},
  classic:{style:'classic',font:'Lexend',weight:700,size:54,color:'#FFFFFF',hl:'#FFFFFF',stroke:'#000000',sw:0,upper:false,maxWords:8,bg:'#000000',bgA:.6},
  luxe:{style:'karaoke',font:'Playfair Display',weight:700,size:66,color:'#F4EFE6',hl:'#F2C38B',stroke:'#000000',sw:0,upper:false,maxWords:5,bgA:0},
};
