/* ---------- AI engines: every free AI, chosen automatically (or by hand) for each task ----------
   Auto order per task = best quality first among what is available:
   your own server (open models, private) → free cloud APIs (keys stored only in this browser) → free Hugging Face Spaces (ZeroGPU)
   → in-browser models → built-in fallback. If an engine fails (quota, network…), the next one is tried.
   Cloud engines run only after explicit consent, and only receive the text / image / audio of the current request. */
const KEYS_LS='topclap-keys',ENG_LS='topclap-engines';
const KEYS=(()=>{try{return JSON.parse(localStorage.getItem(KEYS_LS)||'{}')}catch(e){return {}}})();
const ENGP=(()=>{try{return JSON.parse(localStorage.getItem(ENG_LS)||'{}')}catch(e){return {}}})();
const saveKeys=()=>{try{localStorage.setItem(KEYS_LS,JSON.stringify(KEYS))}catch(e){}};
const saveEng=()=>{try{localStorage.setItem(ENG_LS,JSON.stringify(ENGP))}catch(e){}};
const hasKey=k=>!!(KEYS[k]&&String(KEYS[k]).trim());
const GRADIO_URL='https://cdn.jsdelivr.net/npm/@gradio/client@2.7.1/dist/browser.js';

/* free accounts that unlock engines: [key, name, where to get it, what it unlocks, country] */
const KEY_INFO=[
  ['groq','Groq','https://console.groq.com/keys','Whisper turbo (sous-titres), Qwen3 32B, Kimi K2, Llama. Gratuit avec quotas journaliers.','USA'],
  ['gemini','Google Gemini','https://aistudio.google.com/apikey','Texte et voix off. Offre gratuite à quotas ; Google peut utiliser les données de l\'offre gratuite.','USA'],
  ['openrouter','OpenRouter','https://openrouter.ai/keys','Accès aux modèles « :free » (DeepSeek, Qwen, GLM, Llama…). 50 requêtes/jour sans achat.','USA'],
  ['zhipu','Zhipu GLM (Z.ai / BigModel)','https://open.bigmodel.cn','IA chinoise gratuite : GLM-4.7-Flash (texte), CogView-3-Flash (images), CogVideoX-Flash (vidéo).','Chine'],
  ['siliconflow','SiliconFlow','https://cloud.siliconflow.cn','IA chinoise : modèles open source gratuits (Qwen, GLM, Kolors, SenseVoice). Vérification par téléphone.','Chine'],
  ['pollinations','Pollinations','https://enter.pollinations.ai','Images (FLUX, Seedream, Qwen-Image…), vidéo (Wan, Seedance…), voix, transcription. Crédits « pollen » limités.','International'],
  ['hf','Hugging Face','https://huggingface.co/settings/tokens','Facultatif : plus de temps GPU gratuit sur les Spaces (5 min/jour au lieu de 2).','USA'],
];
const TASKS={write:'Rédaction (scripts, titres, textes réseaux)',asr:'Sous-titres / transcription',tts:'Voix off',image:'Génération d\'images',edit:'Retouche photo par consigne',t2v:'Texte → vidéo',i2v:'Photo → vidéo',music:'Musique'};
/* default free Hugging Face Spaces (ZeroGPU), editable in the panel */
const SPACES={image:'black-forest-labs/FLUX.1-schnell',edit:'Qwen/Qwen-Image-Edit',i2v:'zerogpu-aoti/wan2-2-fp8da-aoti-faster',t2v:'zerogpu-aoti/wan2-2-fp8da-aoti',tts:'ResembleAI/Chatterbox-Multilingual-TTS',music:'ACE-Step/ACE-Step'};
const spaceOf=t=>(KEYS['space_'+t]||SPACES[t]||'').trim();
const WEB_STUDIOS=[
  ['Kling (Kuaishou)','https://klingai.com','Chine','Crédits quotidiens gratuits, 720p, clips 5–10 s'],
  ['Hailuo (MiniMax)','https://hailuoai.video','Chine','Crédits offerts à l\'inscription'],
  ['Vidu (Shengshu)','https://www.vidu.com','Chine','Crédits quotidiens'],
  ['Dreamina / Jimeng (ByteDance)','https://dreamina.capcut.com','Chine','Images et vidéo Seedance, crédits quotidiens'],
  ['Wan (Alibaba)','https://wan.video','Chine','Crédits quotidiens ; modèle aussi open source'],
  ['Qwen Chat (Alibaba)','https://chat.qwen.ai','Chine','Images et vidéos dans le chat, gratuit'],
  ['Google Flow / Veo','https://labs.google/flow','USA','Crédits mensuels selon le compte Google'],
  ['Luma Dream Machine','https://lumalabs.ai/dream-machine','USA','Rendus gratuits mensuels limités'],
  ['Pika','https://pika.art','USA','Crédits mensuels, filigrane'],
];

async function cloudConsent(name){
  if(KEYS.cloudOK===true)return true;if(KEYS.cloudOK===false)return false;
  const ok=await confirmBox('Utiliser les IA gratuites en ligne ?',`Pour ce traitement, Top Clap peut envoyer le texte, l'image ou l'audio concerné à un service gratuit en ligne (${name}…). Rien d'autre n'est envoyé. Vous pourrez changer ce choix dans Modèles IA › Moteurs.`,'Autoriser');
  KEYS.cloudOK=ok;saveKeys();return ok;
}
const stripThink=t=>String(t||'').replace(/<think>[\s\S]*?<\/think>/g,'').trim();
const SYS_FR='Tu es un rédacteur vidéo et immobilier français. Réponds en français, sans préambule.';
async function postJSON(url,body,headers={}){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});if(!r.ok){let m=r.status+'';try{m=r.status+' '+(await r.text()).slice(0,160)}catch(e){}throw new Error(m)}return r.json()}
async function getJSON(url,headers={}){const r=await fetch(url,{headers});if(!r.ok)throw new Error(r.status+'');return r.json()}
async function fetchBlob(url,headers={}){const r=await fetch(url,{headers});if(!r.ok)throw new Error('Téléchargement '+r.status);return r.blob()}
const blobToDataURL=b=>new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b)});
function pcmToWav(b64,rate=24000){const bin=atob(b64);const n=bin.length;const buf=new ArrayBuffer(44+n),dv=new DataView(buf);const ws=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i))};
  ws(0,'RIFF');dv.setUint32(4,36+n,true);ws(8,'WAVE');ws(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,rate,true);dv.setUint32(28,rate*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);ws(36,'data');dv.setUint32(40,n,true);
  for(let i=0;i<n;i++)dv.setUint8(44+i,bin.charCodeAt(i));return new Blob([buf],{type:'audio/wav'})}
function floatToWav(d,sr){const n=d.length,buf=new ArrayBuffer(44+n*2),dv=new DataView(buf);const ws=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i))};
  ws(0,'RIFF');dv.setUint32(4,36+n*2,true);ws(8,'WAVE');ws(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,sr,true);dv.setUint32(28,sr*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);ws(36,'data');dv.setUint32(40,n*2,true);
  for(let i=0;i<n;i++)dv.setInt16(44+i*2,clamp(d[i],-1,1)*32767,true);return new Blob([buf],{type:'audio/wav'})}
/* the audio of a clip, cut to its in/out, as a 16 kHz WAV (for transcription APIs) */
async function clipWav(c){const m=media[c.mediaId];const d=await decodeMono(m,16000);const a=Math.floor(c.in*16000),b=Math.min(d.length,Math.floor((c.in+c.dur*c.speed)*16000));return {wav:floatToWav(d.slice(a,b),16000),dur:(b-a)/16000,m}}
/* APIs that return only text: spread the words over the detected speech */
async function textToWords(text,c,dur){let segs=null;try{segs=(await speechSegments(media[c.mediaId],{thr:-40,minSil:.25,pad:.05})).map(s=>({s:s.s-c.in,e:s.e-c.in})).filter(s=>s.e>0&&s.s<dur)}catch(e){}return wordsFromText(text,0,dur,segs)}
const chat=(base,key,model,p,extra={})=>postJSON(base+'/chat/completions',{model,messages:[{role:'system',content:SYS_FR},{role:'user',content:p}],...extra},{Authorization:'Bearer '+key}).then(j=>stripThink(j.choices[0].message.content));
const aspectOf=(w,h)=>w>h*1.2?'16:9':h>w*1.2?'9:16':'1:1';

/* ---- provider helpers ---- */
const ZBASE=()=>(KEYS.zhipuBase||'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/,'');
const SFBASE=()=>(KEYS.siliconflowBase||'https://api.siliconflow.cn/v1').replace(/\/$/,'');
const PBASE='https://gen.pollinations.ai';
const pAuth=()=>({Authorization:'Bearer '+KEYS.pollinations});
async function zhipuVideo(prompt,imageBlob){
  const body={model:KEYS.zhipuVideo||'cogvideox-flash',prompt};if(imageBlob)body.image_url=await blobToDataURL(imageBlob);
  const j=await postJSON(ZBASE()+'/videos/generations',body,{Authorization:'Bearer '+KEYS.zhipu});const id=j.id||j.task_id;if(!id)throw new Error('Zhipu : pas d\'identifiant de tâche');
  for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,5000));aiBusy(`Vidéo Zhipu CogVideoX… ${i*5} s`);
    const s=await getJSON(ZBASE()+'/async-result/'+id,{Authorization:'Bearer '+KEYS.zhipu});
    if(s.task_status==='SUCCESS'){const u=(s.video_result||[])[0];if(!u||!u.url)throw new Error('Zhipu : vidéo absente');return fetchBlob(u.url)}
    if(s.task_status==='FAIL')throw new Error('Zhipu : génération refusée')}
  throw new Error('Zhipu : délai dépassé');
}
let gemModels=null;
async function geminiModel(kind){
  const pref=kind==='tts'?KEYS.geminiTts:KEYS.geminiModel;if(pref)return pref;
  if(!gemModels){try{const j=await getJSON('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key='+encodeURIComponent(KEYS.gemini));gemModels=(j.models||[]).map(m=>m.name.replace('models/',''))}catch(e){gemModels=[]}}
  if(kind==='tts')return gemModels.find(n=>/flash.*tts/.test(n))||gemModels.find(n=>/tts/.test(n))||'gemini-2.5-flash-preview-tts';
  return gemModels.includes('gemini-flash-latest')?'gemini-flash-latest':(gemModels.find(n=>/^gemini-[\d.]+-flash$/.test(n))||'gemini-flash-latest');
}
let orFree=null;
async function openrouterModel(){
  if(KEYS.openrouterModel)return KEYS.openrouterModel;if(orFree)return orFree;
  const j=await getJSON('https://openrouter.ai/api/v1/models');const free=(j.data||[]).map(m=>m.id).filter(id=>/:free$/.test(id));
  const rank=id=>{const o=['deepseek','qwen','glm','z-ai','kimi','moonshot','llama','gemma','mistral'];const i=o.findIndex(k=>id.includes(k));return i<0?99:i};
  orFree=free.sort((a,b)=>rank(a)-rank(b))[0];if(!orFree)throw new Error('OpenRouter : aucun modèle gratuit listé');return orFree;
}

/* ---- generic adapter for any Gradio Space: finds the right endpoint and fills its inputs by type ---- */
async function gradioRun(space,{image,prompt,seconds,lang}){
  if(!space)throw new Error('Aucun Space configuré');
  const g=await withTimeout(import(GRADIO_URL),20000).catch(()=>{throw new Error(AI_BLOCKED)});
  const cl=await withTimeout(g.Client.connect(space,hasKey('hf')?{token:KEYS.hf}:{}),90000);
  const api=await cl.view_api();const named=api.named_endpoints||{};
  const comp=p=>String(p.component||'').toLowerCase();const route=KEYS['route_'+space];
  const score=([n,e])=>{const ps=e.parameters||[];let s=0;const hasImg=ps.some(p=>comp(p)==='image');const hasTxt=ps.some(p=>comp(p)==='textbox');
    if(image)s+=hasImg?6:-20;else if(hasImg&&!ps.find(p=>comp(p)==='image').parameter_has_default)s-=6;if(prompt)s+=hasTxt?4:-10;
    if(/gen|infer|predict|run|synth|edit|create|video|music|tts/i.test(n))s+=2;if(/lambda|example|clear|update|random|upload|change|load/i.test(n))s-=5;return s};
  const ep=route&&named[route]?[route,named[route]]:Object.entries(named).sort((a,b)=>score(b)-score(a))[0];
  if(!ep)throw new Error(space+' : aucune API utilisable');
  const args={};let usedImg=false,usedTxt=false;
  for(const p of ep[1].parameters||[]){const c=comp(p),name=p.parameter_name||p.label;const pt=JSON.stringify(p.python_type||p.type||'');
    if(c==='image'&&image&&!usedImg){args[name]=g.handle_file(image);usedImg=true;continue}
    if(c==='textbox'&&prompt&&!usedTxt){args[name]=prompt;usedTxt=true;continue}
    if(c==='dropdown'&&lang&&/'fr'/.test(pt)){args[name]='fr';continue}
    if(c==='dropdown'&&lang&&/French/.test(pt)){args[name]=(pt.match(/'(French[^']*)'/)||[0,'French'])[1];continue}
    if((c==='slider'||c==='number')&&seconds&&/dur|second|length|durée/i.test(p.label||name)){args[name]=seconds;continue}
    if(p.parameter_has_default)args[name]=p.parameter_default;else if(c!=='state')args[name]=null}
  aiBusy(`${space.split('/').pop()} : file d'attente GPU gratuite…`);
  const res=await withTimeout(cl.predict(ep[0],args),600000);
  const find=v=>{if(!v)return null;if(typeof v==='string')return /^https?:\/\//.test(v)?v:null;if(v.url)return v.url;if(v.video)return find(v.video);if(Array.isArray(v)){for(const x of v){const u=find(x);if(u)return u}return null}
    if(typeof v==='object')for(const k of Object.keys(v)){const u=find(v[k]);if(u)return u}return null};
  const url=find(res&&res.data);if(!url)throw new Error(space+' : aucun fichier renvoyé');
  return fetchBlob(url,hasKey('hf')?{Authorization:'Bearer '+KEYS.hf}:{});
}

/* ---- the engines ---- origin: local | cloud | space | browser ; cn: Chinese model or provider */
const ENGINES={
  write:[
    {id:'srv',name:'Votre serveur · Ollama (Qwen3, DeepSeek, GLM, Kimi…)',origin:'local',cn:true,avail:()=>SRV.has('llm'),run:async p=>(await SRV.call('/llm',{prompt:p},true)).text},
    {id:'groq',name:'Groq · Qwen3 32B (Alibaba)',origin:'cloud',cn:true,avail:()=>hasKey('groq'),run:p=>chat('https://api.groq.com/openai/v1',KEYS.groq,KEYS.groqModel||'qwen/qwen3-32b',p+' /no_think',{temperature:.6})},
    {id:'zhipu',name:'Zhipu · GLM-4.7-Flash (gratuit)',origin:'cloud',cn:true,avail:()=>hasKey('zhipu'),run:async p=>{try{return await chat(ZBASE(),KEYS.zhipu,KEYS.zhipuModel||'glm-4.7-flash',p)}catch(e){return chat(ZBASE(),KEYS.zhipu,'glm-4-flash-250414',p)}}},
    {id:'gemini',name:'Google Gemini Flash',origin:'cloud',avail:()=>hasKey('gemini'),run:async p=>{const m=await geminiModel('text');const j=await postJSON(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(KEYS.gemini)}`,{systemInstruction:{parts:[{text:SYS_FR}]},contents:[{role:'user',parts:[{text:p}]}]});return (j.candidates[0].content.parts||[]).map(x=>x.text||'').join('')}},
    {id:'openrouter',name:'OpenRouter · meilleur modèle gratuit (DeepSeek, Qwen…)',origin:'cloud',cn:true,avail:()=>hasKey('openrouter'),run:async p=>{const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+KEYS.openrouter,'X-Title':'Top Clap'},body:JSON.stringify({model:await openrouterModel(),messages:[{role:'system',content:SYS_FR},{role:'user',content:p}]})});if(!r.ok)throw new Error('OpenRouter '+r.status);const j=await r.json();return stripThink(j.choices[0].message.content)}},
    {id:'siliconflow',name:'SiliconFlow · Qwen (gratuit)',origin:'cloud',cn:true,avail:()=>hasKey('siliconflow'),run:p=>chat(SFBASE(),KEYS.siliconflow,KEYS.siliconflowModel||'Qwen/Qwen2.5-7B-Instruct',p)},
    {id:'pollinations',name:'Pollinations · texte',origin:'cloud',avail:()=>hasKey('pollinations'),run:async p=>{const j=await postJSON(PBASE+'/v1/chat/completions',{...(KEYS.pollText?{model:KEYS.pollText}:{}),messages:[{role:'system',content:SYS_FR},{role:'user',content:p}]},pAuth());return stripThink(j.choices[0].message.content)}},
    {id:'browser',name:'Navigateur · Qwen3 0.6B (Alibaba, WebGPU)',origin:'browser',cn:true,avail:()=>!!navigator.gpu,run:async p=>{const gen=await AI.pipe('text-generation','onnx-community/Qwen3-0.6B-ONNX',{dtype:'q4f16',device:'webgpu'});const out=await gen([{role:'system',content:SYS_FR},{role:'user',content:p+' /no_think'}],{max_new_tokens:320,do_sample:false});return stripThink(out[0].generated_text.at(-1).content)}},
  ],
  asr:[
    {id:'srv',name:'Votre serveur · faster-whisper large-v3-turbo',origin:'local',avail:()=>SRV.has('transcribe'),run:async(c,lang)=>{const m=media[c.mediaId];const r=await SRV.call('/audio/transcribe',{file:m.blob,language:lang==='auto'?'':'fr',start:c.in,end:c.in+c.dur*c.speed},true);return (r.words||[]).map(w=>({w:w.word.trim(),s:w.start-c.in,e:w.end-c.in}))}},
    {id:'groq',name:'Groq · Whisper large-v3-turbo',origin:'cloud',avail:()=>hasKey('groq'),run:async(c,lang)=>{const {wav}=await clipWav(c);const fd=new FormData();fd.append('file',wav,'audio.wav');fd.append('model','whisper-large-v3-turbo');fd.append('response_format','verbose_json');fd.append('timestamp_granularities[]','word');if(lang!=='auto')fd.append('language','fr');
      const r=await fetch('https://api.groq.com/openai/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+KEYS.groq},body:fd});if(!r.ok)throw new Error('Groq '+r.status);const j=await r.json();return (j.words||[]).map(w=>({w:String(w.word).trim(),s:w.start,e:w.end}))}},
    {id:'siliconflow',name:'SiliconFlow · SenseVoice (Alibaba)',origin:'cloud',cn:true,avail:()=>hasKey('siliconflow'),run:async(c)=>{const {wav,dur}=await clipWav(c);const fd=new FormData();fd.append('file',wav,'audio.wav');fd.append('model',KEYS.siliconflowAsr||'FunAudioLLM/SenseVoiceSmall');
      const r=await fetch(SFBASE()+'/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+KEYS.siliconflow},body:fd});if(!r.ok)throw new Error('SiliconFlow '+r.status);const j=await r.json();return textToWords(String(j.text||'').replace(/<\|[^|]*\|>/g,''),c,dur)}},
    {id:'pollinations',name:'Pollinations · Whisper large-v3',origin:'cloud',avail:()=>hasKey('pollinations'),run:async(c,lang)=>{const {wav,dur}=await clipWav(c);const fd=new FormData();fd.append('file',wav,'audio.wav');fd.append('model','openai/whisper-large-v3');fd.append('response_format','verbose_json');fd.append('timestamp_granularities[]','word');if(lang!=='auto')fd.append('language','fr');
      const r=await fetch(PBASE+'/v1/audio/transcriptions',{method:'POST',headers:pAuth(),body:fd});if(!r.ok)throw new Error('Pollinations '+r.status);const j=await r.json();if(j.words&&j.words.length)return j.words.map(w=>({w:String(w.word).trim(),s:w.start,e:w.end}));return textToWords(j.text||'',c,dur)}},
    {id:'browser',name:'Navigateur · Whisper base (OpenAI, local)',origin:'browser',avail:()=>true,run:async(c,lang)=>{const m=media[c.mediaId];const d=await decodeMono(m,16000);const a=Math.floor(c.in*16000),b=Math.min(d.length,Math.floor((c.in+c.dur*c.speed)*16000));
      const asr=await AI.pipe('automatic-speech-recognition','onnx-community/whisper-base_timestamped',{wasm:true});aiBusy('Transcription en cours…');const out=await asr(d.slice(a,b),{return_timestamps:'word',chunk_length_s:30,stride_length_s:5,...(lang==='auto'?{}:{language:lang}),task:'transcribe'});
      return (out.chunks||[]).map(k=>({w:String(k.text).trim(),s:k.timestamp[0],e:k.timestamp[1]??k.timestamp[0]+.3}))}},
  ],
  tts:[
    {id:'srv',name:'Votre serveur · Chatterbox (clonage de voix)',origin:'local',avail:()=>SRV.has('tts'),run:async(t)=>SRV.call('/audio/tts',{text:t,lang:'fr'})},
    {id:'space',name:'Space Hugging Face · Chatterbox multilingue',origin:'space',avail:()=>!!spaceOf('tts'),run:async(t)=>{const parts=t.match(/[^.!?]{1,280}[.!?]?/g)||[t];const blobs=[];for(const s of parts)blobs.push(await gradioRun(spaceOf('tts'),{prompt:s.trim(),lang:'fr'}));return blobs.length===1?blobs[0]:concatAudio(blobs)}},
    {id:'gemini',name:'Google Gemini TTS',origin:'cloud',avail:()=>hasKey('gemini'),run:async(t)=>{const m=await geminiModel('tts');const j=await postJSON(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(KEYS.gemini)}`,{contents:[{parts:[{text:'Lis ce texte en français, ton chaleureux et professionnel : '+t}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:KEYS.geminiVoice||'Kore'}}}}});
      const part=j.candidates[0].content.parts.find(p=>p.inlineData);const rate=+(String(part.inlineData.mimeType).match(/rate=(\d+)/)||[0,24000])[1];return pcmToWav(part.inlineData.data,rate)}},
    {id:'pollinations',name:'Pollinations · voix neuronales',origin:'cloud',avail:()=>hasKey('pollinations'),run:async(t)=>{const r=await fetch(PBASE+'/v1/audio/speech',{method:'POST',headers:{'Content-Type':'application/json',...pAuth()},body:JSON.stringify({input:t,voice:KEYS.pollVoice||'ff_siwis',response_format:'mp3'})});if(!r.ok)throw new Error('Pollinations '+r.status);return r.blob()}},
    {id:'browser',name:'Navigateur · Piper (voix françaises locales)',origin:'browser',avail:()=>true,run:async(t,voice)=>{const tts=await withTimeout(import(AI_CFG.piper),20000).catch(()=>{throw new Error(AI_BLOCKED)});return tts.predict({text:t,voiceId:voice||'fr_FR-siwis-medium'},p=>{if(p&&p.total)aiBusy(`Voix ${Math.round(p.loaded/p.total*100)} %`)})}},
  ],
  image:[
    {id:'srv',name:'Votre serveur · Z-Image / Qwen-Image / FLUX.2 klein',origin:'local',cn:true,avail:()=>SRV.has('image_gen'),run:async(p,w,h)=>SRV.call('/image/generate',{prompt:p,width:w,height:h})},
    {id:'pollinations',name:'Pollinations · FLUX, Seedream, Qwen-Image…',origin:'cloud',avail:()=>hasKey('pollinations'),run:async(p,w,h)=>fetchBlob(`${PBASE}/image/${encodeURIComponent(p)}?width=${w}&height=${h}&seed=${Math.floor(Math.random()*1e6)}${KEYS.pollImg?'&model='+encodeURIComponent(KEYS.pollImg):''}`,pAuth())},
    {id:'space',name:'Space Hugging Face · FLUX.1 schnell',origin:'space',avail:()=>!!spaceOf('image'),run:async(p)=>gradioRun(spaceOf('image'),{prompt:p})},
    {id:'zhipu',name:'Zhipu · CogView-3-Flash (gratuit)',origin:'cloud',cn:true,avail:()=>hasKey('zhipu'),run:async(p,w,h)=>{const j=await postJSON(ZBASE()+'/images/generations',{model:KEYS.zhipuImg||'cogview-3-flash',prompt:p,size:w>h?'1440x720':h>w?'720x1440':'1024x1024'},{Authorization:'Bearer '+KEYS.zhipu});return fetchBlob(j.data[0].url)}},
    {id:'siliconflow',name:'SiliconFlow · Kolors (Kuaishou)',origin:'cloud',cn:true,avail:()=>hasKey('siliconflow'),run:async(p,w,h)=>{const j=await postJSON(SFBASE()+'/images/generations',{model:KEYS.siliconflowImg||'Kwai-Kolors/Kolors',prompt:p,image_size:w>h?'1024x576':h>w?'576x1024':'1024x1024',batch_size:1},{Authorization:'Bearer '+KEYS.siliconflow});return fetchBlob((j.images||j.data)[0].url)}},
  ],
  edit:[
    {id:'srv',name:'Votre serveur · Qwen-Image-Edit-2511',origin:'local',cn:true,avail:()=>SRV.has('image_edit'),run:async(img,p)=>SRV.call('/image/edit',{file:img,prompt:p})},
    {id:'space',name:'Space Hugging Face · Qwen-Image-Edit (Alibaba)',origin:'space',cn:true,avail:()=>!!spaceOf('edit'),run:async(img,p)=>gradioRun(spaceOf('edit'),{image:img,prompt:p})},
  ],
  t2v:[
    {id:'zhipu',name:'Zhipu · CogVideoX-Flash (gratuit)',origin:'cloud',cn:true,avail:()=>hasKey('zhipu'),run:async(p)=>zhipuVideo(p)},
    {id:'pollinations',name:'Pollinations · Wan, Seedance, Veo…',origin:'cloud',cn:true,avail:()=>hasKey('pollinations'),run:async(p,asp)=>fetchBlob(`${PBASE}/video/${encodeURIComponent(p)}?model=${encodeURIComponent(KEYS.pollVideo||'wan')}&duration=5&aspectRatio=${encodeURIComponent(asp||'16:9')}`,pAuth())},
    {id:'space',name:'Space Hugging Face · Wan 2.2 T2V (Alibaba)',origin:'space',cn:true,avail:()=>!!spaceOf('t2v'),run:async(p)=>gradioRun(spaceOf('t2v'),{prompt:p,seconds:5})},
  ],
  i2v:[
    {id:'srv',name:'Votre serveur · Wan 2.2 (Alibaba) / CogVideoX / LTX',origin:'local',cn:true,avail:()=>SRV.has('img2video'),run:async(img,p)=>SRV.call('/video/image-to-video',{file:img,prompt:p,seconds:5})},
    {id:'space',name:'Space Hugging Face · Wan 2.2 I2V rapide (Alibaba)',origin:'space',cn:true,avail:()=>!!spaceOf('i2v'),run:async(img,p)=>gradioRun(spaceOf('i2v'),{image:img,prompt:p,seconds:5})},
    {id:'zhipu',name:'Zhipu · CogVideoX-Flash (gratuit)',origin:'cloud',cn:true,avail:()=>hasKey('zhipu'),run:async(img,p)=>zhipuVideo(p,img)},
  ],
  music:[
    {id:'srv',name:'Votre serveur · ACE-Step 1.5',origin:'local',cn:true,avail:()=>SRV.has('music'),run:async(p,sec)=>SRV.call('/audio/music',{prompt:p,seconds:sec})},
    {id:'space',name:'Space Hugging Face · ACE-Step',origin:'space',cn:true,avail:()=>!!spaceOf('music'),run:async(p,sec)=>gradioRun(spaceOf('music'),{prompt:p,seconds:Math.min(240,sec)})},
    {id:'pollinations',name:'Pollinations · musique',origin:'cloud',avail:()=>hasKey('pollinations'),run:async(p,sec)=>{const r=await fetch(PBASE+'/v1/audio/speech',{method:'POST',headers:{'Content-Type':'application/json',...pAuth()},body:JSON.stringify({input:p,model:KEYS.pollMusic||'stability-ai/stable-audio-3-medium',instrumental:true,seconds:Math.min(180,Math.ceil(sec)),response_format:'mp3'})});if(!r.ok)throw new Error('Pollinations '+r.status);return r.blob()}},
  ],
};
/* join several audio blobs (long text read sentence by sentence) */
async function concatAudio(blobs){
  const ctx=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,1,24000);const bufs=[];for(const b of blobs)bufs.push(await ctx.decodeAudioData(await b.arrayBuffer()));
  const sr=bufs[0].sampleRate,gap=Math.round(sr*.12),n=bufs.reduce((a,b)=>a+b.length+gap,0);const out=new Float32Array(n);let o=0;for(const b of bufs){out.set(b.getChannelData(0),o);o+=b.length+gap}return floatToWav(out,sr);
}
const ORDER={origin:{local:0,cloud:1,space:2,browser:3}};
function engineList(task){const list=ENGINES[task]||[];const pref=ENGP[task]||'auto';if(pref!=='auto'){const e=list.find(x=>x.id===pref);return e?[e,...list.filter(x=>x!==e&&x.origin==='browser')]:list}return list}
async function runEngine(task,label,...args){
  let lastErr=null,tried=0;
  for(const e of engineList(task)){
    if(!e.avail())continue;
    if((e.origin==='cloud'||e.origin==='space')&&!(await cloudConsent(e.name.split(' ·')[0])))continue;
    tried++;
    try{aiBusy(`${label} · ${e.name.split(' (')[0]}`);const r=await e.run(...args);if(r&&(!(r instanceof Blob)||r.size>100)&&(!Array.isArray(r)||r.length)){aiBusy('');ENG_LAST[task]=e.name;return r}throw new Error('réponse vide')}
    catch(err){lastErr=err;console.warn(task,e.id,err);toast(`${e.name.split(' ·')[0]} indisponible (${String(err.message||err).slice(0,60)}), moteur suivant…`)}
  }
  aiBusy('');
  if(!tried)toast(`${TASKS[task]||label} : aucun moteur disponible. Ajoutez une clé gratuite ou autorisez les services en ligne dans Modèles IA › Moteurs.`);
  else if(lastErr)toast(`${TASKS[task]||label} : tous les moteurs ont échoué (${String(lastErr.message||lastErr).slice(0,120)})`);
  return null;
}
const ENG_LAST={};
function enginesPanelHTML(){
  const tag=e=>e.cn?' · IA chinoise':'';
  const opt=t=>`<div class="row r2"><label for="eng_${t}">${TASKS[t]}</label><select id="eng_${t}"><option value="auto">Automatique (meilleur disponible)</option>${ENGINES[t].map(e=>`<option value="${e.id}" ${ENGP[t]===e.id?'selected':''}>${esc(e.name)}${tag(e)}${e.avail()?'':' — à configurer'}</option>`).join('')}</select></div>${ENG_LAST[t]?`<p class="note" style="margin:-2px 0 6px 104px">Dernier utilisé : ${esc(ENG_LAST[t])}</p>`:''}`;
  return `<div class="grp">Moteurs IA (choix automatique)</div><p class="note">En automatique, Top Clap prend le meilleur moteur disponible : votre serveur, puis les services gratuits en ligne (avec vos clés), puis les Spaces Hugging Face gratuits, puis les modèles du navigateur. Si un moteur échoue ou dépasse son quota, il passe au suivant.</p>
    ${Object.keys(TASKS).map(opt).join('')}
    <label class="tg" style="margin:8px 0"><input type="checkbox" id="eng_cloud" ${KEYS.cloudOK?'checked':''}>Autoriser les services gratuits en ligne</label>
    <div class="grp">Comptes gratuits (clés facultatives)</div><p class="note">Chaque clé débloque des moteurs gratuits plus puissants. Elles restent dans ce navigateur et ne partent que vers le service concerné.</p>
    ${KEY_INFO.map(([k,n,url,d,co])=>`<div class="row r2"><label for="key_${k}">${n}</label><input type="password" id="key_${k}" autocomplete="off" placeholder="Coller la clé" value="${esc(KEYS[k]||'')}"></div><p class="note" style="margin:-4px 0 8px 104px">${esc(co)} · ${esc(d)} <a href="${url}" target="_blank" rel="noopener">Créer un compte</a></p>`).join('')}
    <div class="row r2"><label for="key_zhipuBase">Zhipu</label><select id="key_zhipuBase"><option value="https://open.bigmodel.cn/api/paas/v4" ${!KEYS.zhipuBase||/bigmodel/.test(KEYS.zhipuBase)?'selected':''}>BigModel (Chine)</option><option value="https://api.z.ai/api/paas/v4" ${/z\.ai/.test(KEYS.zhipuBase||'')?'selected':''}>Z.ai (international)</option></select></div>
    <div class="row r2"><label for="key_siliconflowBase">SiliconFlow</label><select id="key_siliconflowBase"><option value="https://api.siliconflow.cn/v1" ${!/\.com/.test(KEYS.siliconflowBase||'')?'selected':''}>siliconflow.cn (Chine)</option><option value="https://api.siliconflow.com/v1" ${/\.com/.test(KEYS.siliconflowBase||'')?'selected':''}>siliconflow.com (international)</option></select></div>
    <div class="grp">Spaces Hugging Face gratuits (GPU partagé)</div><p class="note">Aucune clé nécessaire (environ 2 min de GPU/jour, 5 min avec un compte gratuit). Remplaçable par n'importe quel Space Gradio : Top Clap détecte ses entrées automatiquement.</p>
    ${Object.keys(SPACES).map(t=>`<div class="row r2"><label for="key_space_${t}">${TASKS[t].split(' (')[0]}</label><input type="text" id="key_space_${t}" placeholder="${SPACES[t]}" value="${esc(KEYS['space_'+t]||'')}"></div>`).join('')}
    <div class="grp">Studios vidéo IA gratuits (web)</div><p class="note">Crédits gratuits quotidiens, souvent avec filigrane et usage commercial limité en version gratuite. Le prompt est copié, collez-le sur le site puis importez la vidéo ici.</p>
    <div class="stack">${WEB_STUDIOS.map(([n,u,co,d])=>`<a class="model" href="${u}" target="_blank" rel="noopener" data-studio="1"><div><b>${esc(n)}</b><span>${esc(d)}</span></div><em class="where ${co==='Chine'?'srv':'nav'}">${co}</em></a>`).join('')}</div>`;
}
$('#panelBody').addEventListener('change',e=>{const t=e.target;if(!t.id)return;
  if(t.id.startsWith('eng_')&&t.id!=='eng_cloud'){ENGP[t.id.slice(4)]=t.value;saveEng();toast('Moteur enregistré')}
  else if(t.id==='eng_cloud'){KEYS.cloudOK=t.checked;saveKeys()}
  else if(t.id.startsWith('key_')){KEYS[t.id.slice(4)]=t.value.trim();if(t.id==='key_gemini')gemModels=null;if(t.id==='key_openrouter')orFree=null;saveKeys();renderPanel();toast('Enregistré dans ce navigateur')}});
$('#panelBody').addEventListener('click',e=>{const a=e.target.closest('[data-studio]');if(!a)return;const p=lastPrompt||'';if(p&&navigator.clipboard)navigator.clipboard.writeText(p).then(()=>toast('Prompt copié : collez-le sur le site'),()=>{})});
let lastPrompt='';
