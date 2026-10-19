/* ---------- AI: open-source models in the browser (Transformers.js, Piper) + optional self-hosted AI server ---------- */
const AI_CFG={
  tjs:'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/dist/transformers.min.js',
  piper:'https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.5/+esm',
};
const AI_BLOCKED='Les modèles IA se téléchargent depuis Hugging Face et jsDelivr. Cette fenêtre bloque ces téléchargements : ouvrez Crépuscule depuis GitHub Pages ou en local.';
/* Registry of every model wired into the app. where: 'browser' runs on the viewer's device, 'server' needs the optional AI server (server/). */
const MODELS=[
  {id:'whisper',where:'browser',name:'Whisper base (multilingue)',task:'Sous-titres et transcription mot à mot',repo:'onnx-community/whisper-base_timestamped',size:'≈ 80 Mo',license:'MIT',ok:true,url:'https://github.com/openai/whisper'},
  {id:'depth',where:'browser',name:'Depth Anything V2 Small',task:'Carte de profondeur → photo 3D / parallaxe',repo:'onnx-community/depth-anything-v2-small',size:'≈ 100 Mo',license:'Apache-2.0',ok:true,url:'https://github.com/DepthAnything/Depth-Anything-V2'},
  {id:'bg',where:'browser',name:'BiRefNet lite',task:'Détourage (personnes, objets, mobilier)',repo:'onnx-community/BiRefNet_lite-ONNX',size:'≈ 180 Mo',license:'MIT',ok:true,url:'https://github.com/ZhengPeng7/BiRefNet'},
  {id:'upscale',where:'browser',name:'Swin2SR ×2',task:'Agrandissement de photos basse résolution',repo:'Xenova/swin2SR-classical-sr-x2-64',size:'≈ 50 Mo',license:'Apache-2.0',ok:true,url:'https://github.com/mv-lab/swin2sr'},
  {id:'tts',where:'browser',name:'Piper (voix françaises)',task:'Voix off à partir d\'un texte',repo:'rhasspy/piper-voices · fr_FR',size:'≈ 60 Mo / voix',license:'MIT (moteur) · licence propre à chaque voix',ok:true,url:'https://github.com/rhasspy/piper'},
  {id:'llm',where:'browser',name:'Qwen3 0.6B',task:'Rédaction : accroches, descriptions, hashtags (WebGPU)',repo:'onnx-community/Qwen3-0.6B-ONNX',size:'≈ 500 Mo',license:'Apache-2.0',ok:true,url:'https://github.com/QwenLM/Qwen3'},
  {id:'s-whisper',where:'server',cap:'transcribe',name:'faster-whisper large-v3-turbo',task:'Transcription haute précision, longues vidéos',repo:'Systran/faster-whisper',size:'≈ 1,6 Go',license:'MIT',ok:true,url:'https://github.com/SYSTRAN/faster-whisper'},
  {id:'s-tts',where:'server',cap:'tts',name:'Chatterbox Multilingual',task:'Voix off naturelle FR, clonage de voix',repo:'ResembleAI/chatterbox',size:'≈ 2 Go',license:'MIT',ok:true,url:'https://github.com/resemble-ai/chatterbox'},
  {id:'s-edit',where:'server',cap:'image_edit',name:'Qwen-Image-Edit-2511',task:'Nuit photoréaliste, home staging virtuel, retouche',repo:'Qwen/Qwen-Image-Edit-2511',size:'≈ 40 Go (GPU 24 Go+ avec offload)',license:'Apache-2.0',ok:true,url:'https://github.com/QwenLM/Qwen-Image'},
  {id:'s-gen',where:'server',cap:'image_gen',name:'Z-Image Turbo',task:'Génération d\'images (fonds, ambiances, miniatures)',repo:'Tongyi-MAI/Z-Image-Turbo',size:'≈ 12 Go',license:'Apache-2.0',ok:true,url:'https://github.com/Tongyi-MAI/Z-Image'},
  {id:'s-flux',where:'server',cap:'image_gen',name:'FLUX.2 klein 4B',task:'Génération d\'images rapide',repo:'black-forest-labs/FLUX.2-klein-4B',size:'≈ 8 Go',license:'Apache-2.0',ok:true,url:'https://github.com/black-forest-labs/flux2'},
  {id:'s-wan5',where:'server',cap:'img2video',name:'Wan 2.2 TI2V-5B',task:'Photo → vidéo (mouvement drone, ambiance), texte → vidéo',repo:'Wan-AI/Wan2.2-TI2V-5B-Diffusers',size:'GPU 24 Go',license:'Apache-2.0',ok:true,url:'https://github.com/Wan-Video/Wan2.2'},
  {id:'s-wan14',where:'server',cap:'img2video',name:'Wan 2.2 I2V-A14B',task:'Photo → vidéo haute qualité 720p',repo:'Wan-AI/Wan2.2-I2V-A14B-Diffusers',size:'GPU 80 Go',license:'Apache-2.0',ok:true,url:'https://github.com/Wan-Video/Wan2.2'},
  {id:'s-ltx',where:'server',cap:'img2video',name:'LTX-2.3',task:'Vidéo + son synchronisé',repo:'Lightricks/LTX-2.3',size:'GPU 32 Go+',license:'LTX-2 Community (gratuit < 10 M$ de CA)',ok:'cond',url:'https://huggingface.co/Lightricks/LTX-2.3'},
  {id:'s-cog',where:'server',cap:'img2video',name:'CogVideoX-2B',task:'Texte → vidéo léger',repo:'THUDM/CogVideoX-2b',size:'GPU 12 Go+',license:'Apache-2.0',ok:true,url:'https://github.com/THUDM/CogVideo'},
  {id:'s-music',where:'server',cap:'music',name:'ACE-Step 1.5',task:'Musique sur mesure (style, durée, paroles)',repo:'ACE-Step/Ace-Step1.5',size:'GPU 8 Go+',license:'Apache-2.0',ok:true,url:'https://github.com/ace-step/ACE-Step'},
  {id:'s-demucs',where:'server',cap:'stems',name:'Demucs v4',task:'Séparer voix / musique / bruits',repo:'facebookresearch/demucs',size:'≈ 300 Mo',license:'MIT',ok:true,url:'https://github.com/facebookresearch/demucs'},
  {id:'s-dfn',where:'server',cap:'denoise',name:'DeepFilterNet 3',task:'Débruitage de la voix',repo:'Rikorose/DeepFilterNet',size:'≈ 10 Mo',license:'MIT / Apache-2.0',ok:true,url:'https://github.com/Rikorose/DeepFilterNet'},
  {id:'s-esrgan',where:'server',cap:'upscale',name:'Real-ESRGAN ×4',task:'Agrandissement ×4 photos et vidéos',repo:'xinntao/Real-ESRGAN',size:'≈ 70 Mo',license:'BSD-3-Clause',ok:true,url:'https://github.com/xinntao/Real-ESRGAN'},
  {id:'s-rembg',where:'server',cap:'remove_bg',name:'rembg + BiRefNet',task:'Détourage haute résolution',repo:'danielgatis/rembg',size:'≈ 900 Mo',license:'MIT',ok:true,url:'https://github.com/danielgatis/rembg'},
  {id:'s-llm',where:'server',cap:'llm',name:'Qwen3 / Mistral Small via Ollama',task:'Scripts, titres, descriptions, traductions',repo:'ollama/ollama',size:'5 à 20 Go',license:'Apache-2.0 (modèles) · MIT (Ollama)',ok:true,url:'https://github.com/ollama/ollama'},
  {id:'s-ffmpeg',where:'server',cap:'stabilize',name:'FFmpeg (vidstab, minterpolate, loudnorm)',task:'Stabilisation, ralenti fluide, volume normalisé, MP4 final',repo:'FFmpeg',size:'—',license:'LGPL / GPL',ok:true,url:'https://ffmpeg.org'},
];
const PIPER_VOICES=[['fr_FR-siwis-medium','Siwis (femme)'],['fr_FR-tom-medium','Tom (homme)'],['fr_FR-upmc-medium','UPMC (femme/homme)'],['fr_FR-gilles-low','Gilles (homme)'],['fr_FR-mls-medium','MLS (multi)']];

const AI={lib:null,pipes:{},state:{},
  async load(){if(this.lib)return this.lib;try{this.lib=await withTimeout(import(AI_CFG.tjs),20000);this.lib.env.allowLocalModels=false;return this.lib}catch(e){throw new Error(AI_BLOCKED)}},
  async pipe(task,model,opts={}){
    const k=task+'|'+model;if(this.pipes[k])return this.pipes[k];const {pipeline}=await this.load();this.state[model]='Téléchargement…';aiUI();
    const mk=device=>pipeline(task,model,{device,...(opts.dtype?{dtype:opts.dtype}:{}),progress_callback:x=>aiProgress(model,x)});
    let p;try{p=await mk(opts.device||(navigator.gpu&&!opts.wasm?'webgpu':'wasm'))}catch(e){if(opts.device==='webgpu')throw e;try{p=await mk('wasm')}catch(e2){this.state[model]='Erreur';aiUI();throw new Error(/fetch|network|Failed/i.test(String(e2))?AI_BLOCKED:String(e2.message||e2))}}
    this.state[model]='Prêt';aiUI();this.pipes[k]=p;return p;
  }
};
let aiPill=null;
const withTimeout=(pr,ms)=>Promise.race([pr,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);
function aiProgress(model,x){
  if(!aiPill){aiPill=document.createElement('div');aiPill.className='ai-pill';document.body.appendChild(aiPill)}
  if(x.status==='progress'&&x.total){aiPill.textContent=`${model.split('/').pop()} · ${Math.round(x.loaded/x.total*100)} %`;aiPill.hidden=false}
  if(x.status==='ready'||x.status==='done'){aiPill.hidden=true}
}
function aiBusy(msg){if(!aiPill){aiPill=document.createElement('div');aiPill.className='ai-pill';document.body.appendChild(aiPill)}aiPill.textContent=msg;aiPill.hidden=!msg}
function aiUI(){if(S.tab==='ai')renderPanel()}
function srcCanvas(c,max=1024){
  const src=getSrc(c);if(!src)return null;const sw=src.videoWidth||src.naturalWidth||src.width,sh=src.videoHeight||src.naturalHeight||src.height;const k=Math.min(1,max/Math.max(sw,sh));
  const cn=document.createElement('canvas');cn.width=Math.round(sw*k);cn.height=Math.round(sh*k);cn.getContext('2d').drawImage(src,0,0,cn.width,cn.height);return cn;
}
const canvasBlob=(cn,type='image/png',q)=>new Promise(r=>cn.toBlob(r,type,q));

async function aiTranscribe(c,lang='french'){
  const m=media[c.mediaId];if(!m||(c.kind!=='video'&&c.kind!=='audio')){toast('Sélectionnez une vidéo ou un audio avec de la voix');return}
  if(SRV.has('transcribe'))return srvTranscribe(c,lang);
  try{aiBusy('Préparation de l\'audio…');const d=await decodeMono(m,16000);const a=Math.floor(c.in*16000),b=Math.min(d.length,Math.floor((c.in+c.dur*c.speed)*16000));const slice=d.slice(a,b);
    const asr=await AI.pipe('automatic-speech-recognition','onnx-community/whisper-base_timestamped',{wasm:true});aiBusy('Transcription en cours…');
    const out=await asr(slice,{return_timestamps:'word',chunk_length_s:30,stride_length_s:5,...(lang==='auto'?{}:{language:lang}),task:'transcribe'});
    const words=(out.chunks||[]).map(k=>({w:String(k.text).trim(),s:c.start+k.timestamp[0]/c.speed,e:c.start+(k.timestamp[1]??k.timestamp[0]+.3)/c.speed})).filter(w=>w.w);
    aiBusy('');if(!words.length){toast('Aucune parole détectée');return}
    addCaptionClip(words,'Sous-titres auto');if(c.kind==='video'||c.kind==='audio')c.role='voice';commit();refreshAll();toast(`${words.length} mots transcrits`);
  }catch(e){aiBusy('');toast(e.message||String(e))}
}
async function aiDepth(c){
  if(!isMedia(c)){toast('Sélectionnez une photo du bien');return}
  try{const cn=srcCanvas(c,768);if(!cn)throw new Error('Image indisponible');const lib=await AI.load();const est=await AI.pipe('depth-estimation','onnx-community/depth-anything-v2-small');aiBusy('Calcul de la profondeur…');
    const out=await est(await lib.RawImage.read(cn));const dc=out.depth.toCanvas();aiBusy('');
    if(c.kind==='scene')SCN_DEPTH[c.scene]=dc;else media[c.mediaId].depth=dc;c.immo.parallax=c.immo.parallax||.8;commit();refreshAll();toast('Photo 3D prête : profondeur calculée par Depth Anything');
  }catch(e){aiBusy('');toast(e.message||String(e))}
}
async function aiRemoveBg(c){
  if(!isMedia(c)||c.kind==='video'){toast('Sélectionnez une photo');return}
  if(SRV.has('remove_bg'))return serverImageTool(c,'/image/remove-bg',{},'Détouré',true);
  try{const cn=srcCanvas(c,1024);const lib=await AI.load();const seg=await AI.pipe('background-removal','onnx-community/BiRefNet_lite-ONNX',{dtype:'fp32'});aiBusy('Détourage…');
    const out=await seg(await lib.RawImage.read(cn));const blob=await canvasBlob(out.toCanvas());aiBusy('');await addOverlayFromBlob(blob,(c.name||'Photo')+' détourée',c);
  }catch(e){aiBusy('');toast(e.message||String(e))}
}
async function aiUpscale(c){
  if(c.kind!=='image'){toast('Sélectionnez une photo importée');return}
  if(SRV.has('upscale'))return serverImageTool(c,'/image/upscale',{scale:4},'×4');
  const m=media[c.mediaId];if(Math.max(m.w,m.h)>1400){toast('Photo déjà en bonne résolution (au-delà de 1400 px, utilisez le serveur IA)');return}
  try{const lib=await AI.load();const up=await AI.pipe('image-to-image','Xenova/swin2SR-classical-sr-x2-64');aiBusy('Agrandissement ×2…');
    const out=await up(await lib.RawImage.read(m.el.src));const blob=await canvasBlob(out.toCanvas(),'image/jpeg',.94);aiBusy('');await swapMedia(c,blob,'image',(m.name||'photo')+' ×2');
  }catch(e){aiBusy('');toast(e.message||String(e))}
}
async function aiTTS(text,voice='fr_FR-siwis-medium',at=S.t){
  text=(text||'').trim();if(!text){toast('Écrivez le texte de la voix off');return null}
  let blob;
  try{
    if(SRV.has('tts')){aiBusy('Synthèse vocale (serveur)…');blob=await SRV.call('/audio/tts',{text,lang:'fr'})}
    else{aiBusy('Chargement de la voix…');const tts=await withTimeout(import(AI_CFG.piper),20000).catch(()=>{throw new Error(AI_BLOCKED)});blob=await tts.predict({text,voiceId:voice},p=>{if(p&&p.total)aiBusy(`Voix ${Math.round(p.loaded/p.total*100)} %`)})}
  }catch(e){aiBusy('');toast(e.message||String(e));return null}
  aiBusy('');const id=uid();const m=await registerMedia(id,blob,{type:'audio',name:'Voix off IA'});IDB.put(id,blob);
  const tr=P.tracks.find(t=>t.kind==='audio'&&/^Voix/.test(t.name))||(()=>{const t={id:uid(),kind:'audio',name:'Voix off'};P.tracks.push(t);return t})();
  const c=newClip('audio',{mediaId:id,name:'Voix off IA',dur:m.dur||3,role:'voice',voiceFx:true,_script:text});placeOnTrack(c,tr,at);
  P.clips.filter(o=>o.kind==='audio'&&o.role!=='voice').forEach(o=>{if(!o.duck)o.duck=.7});return c;
}
async function aiWrite(prompt,fallback){
  try{
    if(SRV.has('llm')){const r=await SRV.call('/llm',{prompt},true);return (r.text||'').trim()||fallback}
    if(navigator.gpu){const gen=await AI.pipe('text-generation','onnx-community/Qwen3-0.6B-ONNX',{dtype:'q4f16',device:'webgpu'});aiBusy('Rédaction…');
      const out=await gen([{role:'system',content:'Tu es un rédacteur immobilier français. Réponds en français, sans préambule.'},{role:'user',content:prompt+' /no_think'}],{max_new_tokens:320,do_sample:false});
      aiBusy('');const t=String(out[0].generated_text.at(-1).content||'').replace(/<think>[\s\S]*?<\/think>/g,'').trim();return t||fallback}
  }catch(e){aiBusy('');console.warn(e)}
  return fallback;
}
async function addOverlayFromBlob(blob,name,ref){
  const id=uid();await registerMedia(id,blob,{type:'image',name});IDB.put(id,blob);const tr=firstTrack('overlay')||addTrack('overlay');
  const c=newClip('image',{mediaId:id,name,start:ref?ref.start:S.t,dur:ref?ref.dur:4,fit:'contain'});c.trackId=tr.id;P.clips.push(c);S.sel=c.id;commit();refreshAll();toast(name+' ajouté en incrustation');return c;
}
async function swapMedia(c,blob,type,name){
  const id=uid();const m=await registerMedia(id,blob,{type,name});IDB.put(id,blob);c.origMedia=c.origMedia||c.mediaId;
  if(c.kind==='scene'){c.kind=type;delete c.scene}c.kind=type;c.mediaId=id;c.in=0;if(type==='video')c.dur=Math.min(m.dur||c.dur,60);commit();refreshAll();toast(name+' prêt');return m;
}

/* ===== optional self-hosted AI server (server/ folder, FastAPI) ===== */
const SRV={url:'',token:'',caps:{},
  load(){try{const o=JSON.parse(localStorage.getItem('crepuscule-srv')||'{}');this.url=o.url||'';this.token=o.token||''}catch(e){}},
  save(){try{localStorage.setItem('crepuscule-srv',JSON.stringify({url:this.url,token:this.token}))}catch(e){}},
  has(cap){return !!(this.url&&this.caps&&this.caps[cap])},
  headers(){return this.token?{Authorization:'Bearer '+this.token}:{}},
  async health(){if(!this.url){this.caps={};return null}try{const r=await fetch(this.url.replace(/\/$/,'')+'/health',{headers:this.headers()});const j=await r.json();this.caps=j.capabilities||{};return j}catch(e){this.caps={};throw new Error('Serveur injoignable : vérifiez l\'adresse, le CORS et que le serveur tourne.')}},
  async call(path,data,json=false){
    const body=new FormData();for(const k in data){const v=data[k];if(v instanceof Blob)body.append(k,v,v.name||k);else body.append(k,typeof v==='object'?JSON.stringify(v):String(v))}
    const r=await fetch(this.url.replace(/\/$/,'')+path,{method:'POST',body,headers:this.headers()});
    if(!r.ok){let msg=r.status+' '+r.statusText;try{const j=await r.json();msg=j.detail||msg}catch(e){}throw new Error('Serveur IA : '+msg)}
    return json?r.json():r.blob();
  }
};
SRV.load();
async function srvTranscribe(c,lang){
  try{aiBusy('Transcription (serveur)…');const m=media[c.mediaId];const r=await SRV.call('/audio/transcribe',{file:m.blob,language:lang==='auto'?'':'fr',start:c.in,end:c.in+c.dur*c.speed},true);aiBusy('');
    const words=(r.words||[]).map(w=>({w:w.word.trim(),s:c.start+(w.start-c.in)/c.speed,e:c.start+(w.end-c.in)/c.speed})).filter(w=>w.w&&w.s>=c.start-.1);
    addCaptionClip(words,'Sous-titres auto');c.role='voice';commit();refreshAll();toast(`${words.length} mots transcrits (serveur)`);
  }catch(e){aiBusy('');toast(e.message)}
}
async function mediaBlobOf(c){if(c.kind==='scene'){return canvasBlob(SCN[c.scene],'image/jpeg',.92)}const m=media[c.mediaId];return m&&m.blob}
async function serverImageTool(c,path,fields,suffix,asOverlay){
  try{aiBusy('Traitement IA (serveur)…');const blob=await SRV.call(path,{file:await mediaBlobOf(c),...fields});aiBusy('');
    if(asOverlay)return addOverlayFromBlob(blob,(c.name||'Photo')+' '+suffix,c);
    const isVid=(blob.type||'').startsWith('video');return swapMedia(c,blob,isVid?'video':'image',(c.name||'Média')+' · '+suffix);
  }catch(e){aiBusy('');toast(e.message)}
}
async function serverAudioTool(c,path,fields,label){
  try{aiBusy(label+'…');const blob=await SRV.call(path,{file:media[c.mediaId].blob,...fields});aiBusy('');
    const id=uid();const m=await registerMedia(id,blob,{type:'audio',name:label});IDB.put(id,blob);
    const tr=firstTrack('audio')||addTrack('audio');const a=newClip('audio',{mediaId:id,name:label,start:c.start,dur:Math.min(m.dur||c.dur,c.dur),in:c.in,role:c.role||'voice'});a.trackId=tr.id;P.clips.push(a);if(c.kind==='video')c.volume=0;commit();refreshAll();toast(label+' ajouté');
  }catch(e){aiBusy('');toast(e.message)}
}
const IMG_PROMPTS={
  night:'Transform this daytime real estate photo into a professional twilight (dusk) photograph: deep blue sky with a warm orange horizon, every interior light on with warm glow through the windows, exterior lights and pool lights on. Keep the architecture, framing and materials exactly identical.',
  sky:'Replace the sky with a clear bright blue sky with a few soft white clouds. Keep everything else identical.',
  staging_modern:'Virtually stage this empty room with modern, elegant furniture: sofa, rug, coffee table, plants, warm lighting. Keep walls, windows, floor and perspective identical. Photorealistic real estate photography.',
  staging_scandi:'Virtually stage this empty room in Scandinavian style: light wood, white and beige textiles, plants, natural light. Keep the room architecture identical. Photorealistic.',
  declutter:'Remove all clutter, personal items and boxes from this room, leaving it clean and tidy. Keep furniture, walls and perspective identical.',
  lawn:'Make the lawn lush and green and the garden well maintained. Keep the house identical.',
};
