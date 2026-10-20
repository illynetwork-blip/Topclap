/* ---------- vision (MediaPipe, Apache-2.0, runs on the device): person cut-out, automatic face blur, auto-reframe ----------
   Also: camera / screen recorder with teleprompter, emoji stickers. */
const MP_VER='1.0.1';
const MP_URL=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}/vision_bundle.mjs`;
const MP_WASM=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}/wasm`;
const MP_MODELS={
  seg:'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
  face:'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
};
const VIS={seg:null,face:null,loading:null,err:null,ts:0,cache:new Map(),
  async load(){
    if(this.seg&&this.face)return true;if(this.loading)return this.loading;
    this.loading=(async()=>{try{aiBusy('Chargement de la vision IA (MediaPipe)…');
      const mp=await withTimeout(import(MP_URL),20000);const fs=await mp.FilesetResolver.forVisionTasks(MP_WASM);
      const mk=async(cls,opts)=>{try{return await cls.createFromOptions(fs,{...opts,baseOptions:{...opts.baseOptions,delegate:'GPU'}})}catch(e){return cls.createFromOptions(fs,{...opts,baseOptions:{...opts.baseOptions,delegate:'CPU'}})}};
      this.seg=await mk(mp.ImageSegmenter,{baseOptions:{modelAssetPath:MP_MODELS.seg},runningMode:'VIDEO',outputConfidenceMasks:true,outputCategoryMask:false});
      this.face=await mk(mp.FaceDetector,{baseOptions:{modelAssetPath:MP_MODELS.face},runningMode:'VIDEO',minDetectionConfidence:.45});
      aiBusy('');req();return true}catch(e){aiBusy('');this.err=e;this.loading=null;toast('Vision IA indisponible ici (téléchargement bloqué). Ouvrez Top Clap depuis son adresse en ligne.');return false}})();
    return this.loading;
  },
  stamp(){this.ts=Math.max(this.ts+1,performance.now());return this.ts},
};
const visTmp=document.createElement('canvas'),visMask=document.createElement('canvas'),visBlur=document.createElement('canvas');
/* key so a still image is analysed once, a video once per displayed frame */
function visKey(c,src){return c.id+':'+(src.currentTime!=null?src.currentTime.toFixed(3):'img')}
function visAnalyse(c,src){
  const k=visKey(c,src);let r=VIS.cache.get(k);if(r)return r;r={};
  const sw=src.videoWidth||src.naturalWidth||src.width,sh=src.videoHeight||src.naturalHeight||src.height;
  try{
    if(c.bgRemove&&VIS.seg){const res=VIS.seg.segmentForVideo(src,VIS.stamp());const m=res.confidenceMasks&&res.confidenceMasks[0];
      if(m){const w=m.width,h=m.height,a=m.getAsFloat32Array();const id=new ImageData(w,h);for(let i=0;i<a.length;i++){const v=a[i];id.data[i*4+3]=v<.2?0:v>.75?255:Math.round((v-.2)/.55*255)}m.close&&m.close();r.mask=id}
      res.close&&res.close()}
    if(c.blurFaces&&VIS.face){const res=VIS.face.detectForVideo(src,VIS.stamp());r.faces=(res.detections||[]).map(d=>d.boundingBox).filter(Boolean).map(b=>({x:b.originX/sw,y:b.originY/sh,w:b.width/sw,h:b.height/sh}))}
  }catch(e){console.warn('vision',e)}
  if(VIS.cache.size>240)VIS.cache.delete(VIS.cache.keys().next().value);VIS.cache.set(k,r);return r;
}
/* returns the image to draw for a media clip after cut-out / face blur (or the input image untouched) */
function visionPass(c,src,img){
  if(!(c.bgRemove||c.blurFaces))return img;
  if(!VIS.seg||!VIS.face){if(!VIS.err)VIS.load();return img}
  const r=visAnalyse(c,src);const W=img.videoWidth||img.naturalWidth||img.width,H=img.videoHeight||img.naturalHeight||img.height;
  const k=Math.min(1,1280/Math.max(W,H)),w=Math.round(W*k),h=Math.round(H*k);
  if(visTmp.width!==w||visTmp.height!==h){visTmp.width=w;visTmp.height=h}
  const g=visTmp.getContext('2d');g.globalCompositeOperation='source-over';g.filter='none';g.clearRect(0,0,w,h);g.drawImage(img,0,0,w,h);
  if(r.faces&&r.faces.length){
    if(visBlur.width!==w||visBlur.height!==h){visBlur.width=w;visBlur.height=h}const b=visBlur.getContext('2d');b.filter=`blur(${Math.max(8,Math.round(w/45))}px)`;b.clearRect(0,0,w,h);b.drawImage(visTmp,0,0);b.filter='none';
    g.save();g.beginPath();for(const f of r.faces){const cx=(f.x+f.w/2)*w,cy=(f.y+f.h/2)*h;g.moveTo(cx+f.w*w*.75,cy);g.ellipse(cx,cy,f.w*w*.75,f.h*h*.9,0,0,Math.PI*2)}g.clip();g.drawImage(visBlur,0,0);g.restore();
  }
  if(r.mask){const m=r.mask;if(visMask.width!==m.width||visMask.height!==m.height){visMask.width=m.width;visMask.height=m.height}visMask.getContext('2d').putImageData(m,0,0);
    g.globalCompositeOperation='destination-in';g.imageSmoothingEnabled=true;g.drawImage(visMask,0,0,w,h);g.globalCompositeOperation='source-over'}
  return visTmp;
}
/* auto-reframe: follows the main face of a video with keyframes on X (for 9:16 / 1:1 / 4:5 crops of a 16:9 video) */
async function autoReframe(c){
  if(!c||c.kind!=='video'){toast('Sélectionnez une vidéo avec une personne');return}
  if(!(await VIS.load()))return;const m=media[c.mediaId];
  const v=document.createElement('video');v.muted=true;v.preload='auto';v.src=m.url;await once(v,'loadeddata');
  const [W,H]=baseWH();const [dw]=fitWH(m.w,m.h,W,H,'cover');const sc=kv(c,'scale',0)||1;const slack=(dw*sc-W)/(2*W);
  if(slack<.01){toast('La vidéo remplit déjà le cadre en largeur : passez au format 9:16 ou 1:1 d\'abord');return}
  const step=Math.max(.4,c.dur/40),pts=[];aiBusy('Suivi du sujet…');
  for(let t=0;t<=c.dur+.001;t+=step){v.currentTime=Math.min(m.dur-.05,c.in+t*c.speed);await once(v,'seeked',2500);
    try{const res=VIS.face.detectForVideo(v,VIS.stamp());const d=(res.detections||[]).sort((a,b)=>b.boundingBox.width*b.boundingBox.height-a.boundingBox.width*a.boundingBox.height)[0];
      if(d){const fx=(d.boundingBox.originX+d.boundingBox.width/2)/m.w;pts.push([t,clamp(.5-(fx-.5)*dw*sc/W,.5-slack,.5+slack)])}}catch(e){}}
  aiBusy('');if(!pts.length){toast('Aucun visage détecté dans ce plan');return}
  const sm=pts.map((p,i)=>{const a=pts.slice(Math.max(0,i-2),i+3);return [p[0],a.reduce((s,q)=>s+q[1],0)/a.length]});
  c.kf=c.kf||{};c.kf.x=[];let last=null;for(const [t,x] of sm){if(last===null||Math.abs(x-last)>.008||t>=c.dur-step){c.kf.x.push({t:+t.toFixed(3),v:+x.toFixed(4),e:'ease'});last=x}}
  commit();refreshAll();toast(`Recadrage automatique : ${c.kf.x.length} images clés sur le sujet`);
}

/* camera / screen recorder with teleprompter (Edits / CapCut style) */
let recStream=null,recM=null,recChunks2=[],promptT=0;
async function openRecorder(){
  pause();const m=modal(`<h3>Enregistrer</h3><p class="note">Caméra ou écran, avec prompteur. La vidéo est ajoutée à la timeline et ses sous-titres peuvent être générés ensuite.</p>
    <div class="rec-wrap"><video id="recV" autoplay muted playsinline></video><div class="prompter" id="recP" hidden><div id="recPT"></div></div><span class="rec-dot" id="recDot" hidden>● REC <b id="recTime">0:00</b></span></div>
    <div class="row r2"><label for="recSrc">Source</label><select id="recSrc"><option value="user">Caméra avant</option><option value="environment">Caméra arrière</option><option value="screen">Écran</option></select></div>
    <textarea class="ta" id="recScript" rows="3" placeholder="Texte du prompteur (facultatif)">${esc(typeof scriptFor==='function'?scriptFor(A_OPTS):'')}</textarea>
    <div class="row"><label for="recSpeed">Vitesse prompteur</label><input type="range" id="recSpeed" min="10" max="120" value="40"><output>40</output></div>
    <div class="mrow"><button class="btn" data-x="close">Fermer</button><button class="btn" data-x="start">${ic('play')}Activer</button><button class="btn pri" data-x="rec" disabled>${ic('mic')}Enregistrer</button></div>`);
  const v=$('#recV',m),P_=$('#recP',m),PT=$('#recPT',m);
  const stop=()=>{if(recM&&recM.state!=='inactive')recM.stop();if(recStream)recStream.getTracks().forEach(t=>t.stop());recStream=null;cancelAnimationFrame(promptT)};
  m.addEventListener('input',e=>{if(e.target.id==='recSpeed')e.target.nextElementSibling.textContent=e.target.value});
  m.addEventListener('click',async e=>{const b=e.target.closest('[data-x]');if(!b)return;const x=b.dataset.x;
    if(x==='close'){stop();m.parentElement.remove();return}
    if(x==='start'){stop();const src=$('#recSrc',m).value;
      try{recStream=src==='screen'?await navigator.mediaDevices.getDisplayMedia({video:true,audio:true}):await navigator.mediaDevices.getUserMedia({video:{facingMode:src,width:{ideal:1920},height:{ideal:1080}},audio:{echoCancellation:true,noiseSuppression:true}})}
      catch(err){toast('Caméra ou écran inaccessible : autorisez l\'accès, ou ouvrez Top Clap depuis son adresse en ligne.');return}
      v.srcObject=recStream;$('[data-x=rec]',m).disabled=false;const txt=$('#recScript',m).value.trim();P_.hidden=!txt;PT.textContent=txt;PT.style.transform='translateY(0)';return}
    if(x==='rec'){
      if(recM&&recM.state==='recording'){recM.stop();b.innerHTML=ic('mic')+'Enregistrer';return}
      recChunks2=[];const mime=pickMime()||'';try{recM=new MediaRecorder(recStream,mime?{mimeType:mime}:{})}catch(err){recM=new MediaRecorder(recStream)}
      recM.ondataavailable=ev=>{if(ev.data.size)recChunks2.push(ev.data)};
      recM.onstop=async()=>{$('#recDot',m).hidden=true;cancelAnimationFrame(promptT);if(!recChunks2.length)return;const blob=new Blob(recChunks2,{type:(recM.mimeType||'video/webm').split(';')[0]});
        const id=uid();const med=await registerMedia(id,blob,{type:'video',name:'Enregistrement '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});IDB.put(id,blob);addMediaToTimeline(med);const nc=selClip();if(nc){nc.role='voice';nc.voiceFx=true}commit();toast('Enregistrement ajouté. Onglet Auto › « Couper les silences » puis « Sous-titres ».')};
      recM.start(500);b.innerHTML=ic('pause')+'Arrêter';$('#recDot',m).hidden=false;const t0=performance.now(),speed=+$('#recSpeed',m).value;
      const tick=()=>{const s=(performance.now()-t0)/1000;$('#recTime',m).textContent=Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');PT.style.transform=`translateY(${-s*speed}px)`;promptT=requestAnimationFrame(tick)};tick();}
  });
}

/* emoji stickers */
const EMOJIS=['🏡','🔑','📍','✨','🔥','💎','🌅','🌙','🏊','🌳','📞','⭐','✅','❤️','👉','😍','🎉','💰','🛏️','🛁','🚗','☀️','🌊','⛰️'];
function addEmoji(e){addText({text:e,font:'Montserrat',size:180,weight:400,animIn:'pop',inDur:.35,animOut:'fade',x:.82,y:.22,autofit:true},'Émoji '+e)}
