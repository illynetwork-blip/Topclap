/* ---------- pro tools 2: RGB curves, split screen, trend templates ---------- */

/* ===== curves (master + R, G, B), baked into a 3D LUT together with the selected LUT ===== */
const CURVE_ID=[[0,0],[1,1]];
const curvesActive=gr=>!!(gr&&gr.curves&&['m','r','g','b'].some(k=>{const p=gr.curves[k];return p&&(p.length!==2||p[0][0]!==0||p[0][1]!==0||p[1][0]!==1||p[1][1]!==1)}));
function curveFn(pts){
  const p=(pts&&pts.length>=2?pts:CURVE_ID).slice().sort((a,b)=>a[0]-b[0]);const n=p.length;
  const dx=[],dy=[],m=[];for(let i=0;i<n-1;i++){dx.push(p[i+1][0]-p[i][0]||1e-6);dy.push(p[i+1][1]-p[i][1]);m.push(dy[i]/dx[i])}
  const t=[m[0]];for(let i=1;i<n-1;i++)t.push(m[i-1]*m[i]<=0?0:(m[i-1]+m[i])/2);t.push(m[n-2]);
  for(let i=0;i<n-1;i++){if(m[i]===0){t[i]=0;t[i+1]=0}else{const a=t[i]/m[i],b=t[i+1]/m[i],h=a*a+b*b;if(h>9){const k=3/Math.sqrt(h);t[i]=k*a*m[i];t[i+1]=k*b*m[i]}}}
  return x=>{if(x<=p[0][0])return clamp(p[0][1]);if(x>=p[n-1][0])return clamp(p[n-1][1]);let i=0;while(i<n-2&&x>p[i+1][0])i++;const h=dx[i],s=(x-p[i][0])/h,s2=s*s,s3=s2*s;
    return clamp((2*s3-3*s2+1)*p[i][1]+(s3-2*s2+s)*h*t[i]+(-2*s3+3*s2)*p[i+1][1]+(s3-s2)*h*t[i+1])};
}
function sampleLUT(l,r,g,b){const n=l.n,f=v=>clamp(v)*(n-1);const x=f(r),y=f(g),z=f(b);const x0=Math.floor(x),y0=Math.floor(y),z0=Math.floor(z),x1=Math.min(n-1,x0+1),y1=Math.min(n-1,y0+1),z1=Math.min(n-1,z0+1),fx=x-x0,fy=y-y0,fz=z-z0;
  const at=(xx,yy,zz,k)=>l.data[(yy*(n*n)+zz*n+xx)*4+k]/255;const out=[0,0,0];
  for(let k=0;k<3;k++){const c00=at(x0,y0,z0,k)*(1-fx)+at(x1,y0,z0,k)*fx,c10=at(x0,y1,z0,k)*(1-fx)+at(x1,y1,z0,k)*fx,c01=at(x0,y0,z1,k)*(1-fx)+at(x1,y0,z1,k)*fx,c11=at(x0,y1,z1,k)*(1-fx)+at(x1,y1,z1,k)*fx;out[k]=(c00*(1-fy)+c10*fy)*(1-fz)+(c01*(1-fy)+c11*fy)*fz}return out}
const curveCache={};
function curveLUT(gr){
  const key=JSON.stringify([gr.curves,gr.lut,gr.lutAmt]);if(curveCache[key])return curveCache[key];
  const fm=curveFn(gr.curves.m),fr=curveFn(gr.curves.r),fg=curveFn(gr.curves.g),fb=curveFn(gr.curves.b);const base=gr.lut&&LUTS[gr.lut],amt=gr.lutAmt;
  const id='cv-'+Object.keys(curveCache).length;
  const lut={id,n:17,data:cubeToData(17,(r,g,b)=>{let o=[fr(fm(r)),fg(fm(g)),fb(fm(b))];if(base){const q=sampleLUT(base,o[0],o[1],o[2]);o=o.map((v,i)=>v+(q[i]-v)*amt)}return o})};
  curveCache[key]=lut;return lut;
}
let curveCh='m';
function drawCurves(cn,gr){
  const g=cn.getContext('2d'),W=cn.width,H=cn.height;g.clearRect(0,0,W,H);g.fillStyle='#0B1020';g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=1;for(let i=1;i<4;i++){g.beginPath();g.moveTo(W*i/4,0);g.lineTo(W*i/4,H);g.moveTo(0,H*i/4);g.lineTo(W,H*i/4);g.stroke()}
  g.strokeStyle='rgba(255,255,255,.15)';g.beginPath();g.moveTo(0,H);g.lineTo(W,0);g.stroke();
  const cols={m:'#EEF1FF',r:'#FF5D73',g:'#00E3A0',b:'#3FA2FF'};
  for(const k of ['r','g','b','m']){const pts=gr.curves[k];if(k!==curveCh&&!(pts&&pts.length>2))continue;const f=curveFn(pts);g.strokeStyle=cols[k];g.globalAlpha=k===curveCh?1:.35;g.lineWidth=k===curveCh?2:1.2;g.beginPath();for(let x=0;x<=W;x+=2){const y=H-f(x/W)*H;x?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}
  g.globalAlpha=1;(gr.curves[curveCh]||CURVE_ID).forEach(p=>{g.fillStyle='#fff';g.strokeStyle='#0B1020';g.lineWidth=2;g.beginPath();g.arc(p[0]*W,H-p[1]*H,5,0,7);g.fill();g.stroke()});
}
function bindCurves(root,c){
  const cn=$('#curveCv',root);if(!cn)return;const gr=c.grade;gr.curves=gr.curves||{m:CURVE_ID.map(p=>[...p]),r:CURVE_ID.map(p=>[...p]),g:CURVE_ID.map(p=>[...p]),b:CURVE_ID.map(p=>[...p])};drawCurves(cn,gr);
  $$('[data-cch]',root).forEach(b=>b.onclick=()=>{curveCh=b.dataset.cch;$$('[data-cch]',root).forEach(x=>x.classList.toggle('on',x===b));drawCurves(cn,gr)});
  const pos=e=>{const r=cn.getBoundingClientRect();return [clamp((e.clientX-r.left)/r.width),clamp(1-(e.clientY-r.top)/r.height)]};
  cn.addEventListener('pointerdown',e=>{cn.setPointerCapture(e.pointerId);const pts=gr.curves[curveCh];const [x,y]=pos(e);let i=pts.findIndex(p=>Math.hypot(p[0]-x,p[1]-y)<.06);
    if(i<0){pts.push([x,y]);pts.sort((a,b)=>a[0]-b[0]);i=pts.findIndex(p=>p[0]===x&&p[1]===y)}
    const mv=ev=>{const [nx,ny]=pos(ev);const lo=i>0?pts[i-1][0]+.01:0,hi=i<pts.length-1?pts[i+1][0]-.01:1;pts[i]=[i===0?0:i===pts.length-1?1:clamp(nx,lo,hi),ny];drawCurves(cn,gr);req()};
    const up=()=>{cn.removeEventListener('pointermove',mv);cn.removeEventListener('pointerup',up);commit()};cn.addEventListener('pointermove',mv);cn.addEventListener('pointerup',up)});
  cn.addEventListener('dblclick',e=>{const pts=gr.curves[curveCh];const [x,y]=pos(e);const i=pts.findIndex(p=>Math.hypot(p[0]-x,p[1]-y)<.06);if(i>0&&i<pts.length-1){pts.splice(i,1);drawCurves(cn,gr);commit();req()}});
  const rs=$('#curveReset',root);if(rs)rs.onclick=()=>{gr.curves[curveCh]=CURVE_ID.map(p=>[...p]);drawCurves(cn,gr);commit();req()};
  const pr=$('#curvePreset',root);if(pr)pr.onchange=()=>{const v=pr.value;const S_={contrast:[[0,0],[.25,.2],[.75,.82],[1,1]],soft:[[0,.04],[.5,.52],[1,.96]],fade:[[0,.12],[.5,.5],[1,.95]],bright:[[0,0],[.45,.56],[1,1]],dark:[[0,0],[.55,.45],[1,1]]}[v];if(S_){gr.curves.m=S_.map(p=>[...p]);curveCh='m';drawCurves(cn,gr);commit();req()}pr.value=''};
}

/* ===== split screen ===== */
function splitLayout(n,dir){
  if(n===2)return dir==='v'?[[.5,.25,1,.5],[.5,.75,1,.5]]:[[.25,.5,.5,1],[.75,.5,.5,1]];
  if(n===3)return dir==='v'?[[.5,1/6,1,1/3],[.5,.5,1,1/3],[.5,5/6,1,1/3]]:[[.25,.5,.5,1],[.75,.25,.5,.5],[.75,.75,.5,.5]];
  return [[.25,.25,.5,.5],[.75,.25,.5,.5],[.25,.75,.5,.5],[.75,.75,.5,.5]];
}
function splitScreen(n=2,dir){
  dir=dir||(P.aspect==='9:16'?'v':'h');const pool=Object.values(media).filter(m=>m.type==='image'||m.type==='video');
  const srcs=pool.length>=n?pool.slice(0,n).map(m=>({m})):[...pool.map(m=>({m})),...['villa','salon','facade','villa'].map(s=>({scene:s}))].slice(0,n);
  const [W,H]=baseWH();const cells=splitLayout(n,dir);const dur=4;
  srcs.forEach((s,i)=>{const [cx,cy,cw,ch]=cells[i];const sw=s.scene?1920:s.m.w||1920,sh=s.scene?1080:s.m.h||1080;const [dw,dh]=fitWH(sw,sh,W,H,'cover');
    const tr={id:uid(),kind:'overlay',name:'Écran partagé '+(i+1)};P.tracks.unshift(tr);
    const c=newClip(s.scene?'scene':s.m.type,{scene:s.scene,mediaId:s.m&&s.m.id,name:s.scene?SCENES[s.scene]:s.m.name,start:S.t,dur:s.m&&s.m.type==='video'?Math.min(dur,s.m.dur):dur,x:cx,y:cy,fit:'cover',filter:'clean',filterAmt:.6,trackId:tr.id,
      mask:{type:'rect',x:.5,y:.5,w:Math.min(1,cw*W/dw)*.985,h:Math.min(1,ch*H/dh)*.985,feather:.002,invert:false},trans:{type:'zoom-in',dur:.4}});
    c.fx=[{id:i%2?'kb-out':'kb-in',v:.5}];P.clips.push(c)});
  commit();refreshAll();toast(`Écran partagé ${n} vues ajouté à la tête de lecture`);
}

/* ===== trend templates (one click, then everything stays editable) ===== */
const TRENDS=[
  {id:'roomtour',name:'Room tour express',d:'Reel 20 s, une pièce toutes les 1,5 s, coupes sur le rythme, sous-titres',o:{goal:'reel',formats:['9:16'],dur:20,style:'dynamique',beat:true,captions:true}},
  {id:'price',name:'Devinez le prix',d:'Question en accroche, visite, prix révélé avec compteur à la fin',o:{goal:'annonce',formats:['9:16','16:9'],dur:30,style:'moderne',beat:true,captions:true},post:()=>{
    const t=P.clips.filter(c=>c.kind==='text');const h=t.sort((a,b)=>a.start-b.start)[0];if(h){h.text='Devinez le prix ?';h.animIn='pop'}
    const pc=t.find(c=>/€/.test(c.text));const d=projDur();if(pc){pc.start=Math.max(0,d-7);pc.dur=3.4;pc.animIn='count';pc.inDur=1.6;pc.x=.5;pc.y=.5;pc.size=96}}},
  {id:'top5',name:'Top 5 des atouts',d:'Compte à rebours 5 → 1 sur les points forts du bien',o:{goal:'annonce',formats:['9:16'],dur:30,style:'dynamique',beat:true,captions:false},post:()=>{
    const feats=[...(P.info.feats||[]),P.info.surface&&P.info.surface+' m²',P.info.bedrooms&&P.info.bedrooms+' chambres','Emplacement'].filter(Boolean).slice(0,5);const d=projDur()-4,step=Math.max(2,(d-3)/feats.length);
    const tr={id:uid(),kind:'text',name:'Top 5'};P.tracks.unshift(tr);
    feats.forEach((f,i)=>{P.clips.push(newClip('text',{text:`${feats.length-i}\n${f}`,start:2.5+i*step,dur:step-.2,font:'Bebas Neue',size:200,weight:400,sub:.32,animIn:'pop',inDur:.3,animOut:'fade',shadowBlur:30,shadowColor:'rgba(0,0,0,.55)',y:.42,trackId:tr.id,name:'Top '+(feats.length-i)}))})}},
  {id:'beforeafter',name:'Avant / Après',d:'Chaque photo comparée à sa version nuit ou HDR, volet animé',o:{goal:'avantapres',formats:['9:16','16:9'],dur:30,style:'moderne',beat:false,captions:false}},
  {id:'cine',name:'Visite cinématique',d:'60 s en 16:9, plans longs, bandes cinéma, voix off posée',o:{goal:'visite',formats:['16:9'],dur:60,style:'luxe',beat:false,captions:true},post:()=>{P.clips.filter(isMedia).forEach(c=>{if(!c.fx.some(f=>f.id==='letterbox'))c.fx.push({id:'letterbox',v:.7})})}},
  {id:'teaser',name:'Teaser 15 s',d:'Ultra court pour les stories et publicités',o:{goal:'reel',formats:['9:16','4:5'],dur:15,style:'dynamique',beat:true,captions:true}},
  {id:'youtube',name:'Visite YouTube complète',d:'90 s, chapitres, voix off, écran de fin',o:{goal:'youtube',formats:['16:9'],dur:90,style:'luxe',beat:false,captions:true}},
];
async function runTrend(id){
  const t=TRENDS.find(x=>x.id===id);if(!t)return;
  const ok=await confirmBox(`Modèle « ${t.name} »`,t.d+'. La timeline actuelle est remplacée (Ctrl+Z pour annuler). Les infos du bien et de l\'agence de l\'Assistant sont utilisées.','Créer');if(!ok)return;
  aiBusy('Création du modèle…');try{await generateVideo({...A_OPTS,...t.o,voice:A_OPTS.voice});if(t.post){t.post();commit();refreshAll()}aiBusy('');showAfterGen({...A_OPTS,...t.o})}catch(e){aiBusy('');toast('Erreur : '+(e.message||e))}
}
