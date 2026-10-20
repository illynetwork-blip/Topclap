/* ---------- automation & AI tool catalogue + dispatcher ---------- */
const AUTO_TOOLS=[
  {id:'montage',g:'edit',ic:'wand',name:'Montage express',d:'Assemble tous vos médias avec transitions, textes et musique'},
  {id:'beatcut',g:'edit',ic:'music',name:'Caler les coupes sur le rythme',d:'Détecte le tempo de la musique et ajuste chaque plan'},
  {id:'scenes',g:'edit',ic:'scissors',name:'Découper en plans',d:'Détecte les changements de plan dans la vidéo sélectionnée'},
  {id:'silences',g:'edit',ic:'wave',name:'Couper les silences',d:'Retire les blancs d\'une vidéo parlée (jump cuts)'},
  {id:'record',g:'edit',ic:'mic',name:'Enregistrer caméra / écran',d:'Avec prompteur défilant, ajouté directement à la timeline'},
  {id:'reframe-subject',g:'edit',ic:'max',name:'Recadrage auto sur la personne',d:'Suit le visage pour passer une vidéo 16:9 en vertical'},
  {id:'blurfaces',g:'edit',ic:'mask',name:'Flouter tous les visages',d:'Droit à l\'image : floute automatiquement les visages des vidéos et photos'},
  {id:'freeze',g:'edit',ic:'freeze',name:'Arrêt sur image',d:'Insère 2 s figées à la tête de lecture'},
  {id:'split2',g:'edit',ic:'layers',name:'Écran partagé 2 vues',d:'Deux plans côte à côte (ou l\'un sous l\'autre en vertical)'},
  {id:'split4',g:'edit',ic:'grid',name:'Écran partagé 4 vues',d:'Mosaïque de 4 plans'},
  {id:'adjust',g:'edit',ic:'layers',name:'Calque de réglage',d:'Étalonne et applique des effets à tout ce qui est dessous'},
  {id:'reframe',g:'edit',ic:'max',name:'Adapter au 9:16',d:'Passe en vertical : balayage auto des photos, fond flou des vidéos'},
  {id:'markers',g:'audio',ic:'flag',name:'Marqueurs sur les temps',d:'Place un repère sur chaque temps fort de la musique'},
  {id:'duck',g:'audio',ic:'vol',name:'Ducking automatique',d:'Baisse la musique quand la voix parle'},
  {id:'normalize',g:'audio',ic:'wave',name:'Normaliser le volume',d:'Ajuste le clip sélectionné à −1 dB crête'},
  {id:'voiceclear',g:'audio',ic:'mic',name:'Voix claire',d:'Coupe-bas, présence et compresseur sur le clip sélectionné'},
  {id:'transcribe',g:'cap',ic:'subs',name:'Sous-titres automatiques (Whisper)',d:'Transcription mot à mot de la vidéo ou de la voix sélectionnée'},
  {id:'srtcap',g:'cap',ic:'upload',name:'Importer .srt / .vtt',d:'Transforme un fichier de sous-titres en texte animé'},
  {id:'social',g:'pub',ic:'share',name:'Textes réseaux sociaux',d:'Titre, description, chapitres, hashtags par plateforme'},
  {id:'thumb',g:'pub',ic:'image',name:'Miniature YouTube / couverture',d:'Image de l\'instant avec titre et prix'},
  {id:'multi',g:'pub',ic:'download',name:'Exporter tous les formats',d:'16:9, 9:16, 1:1 et 4:5 à la suite'},
];
const AI_TOOLS=[
  {id:'ai-transcribe',where:'auto',task:'asr',ic:'subs',name:'Sous-titres automatiques',d:'Whisper, SenseVoice… → sous-titres mot à mot'},
  {id:'ai-tts',where:'auto',task:'tts',ic:'mic',name:'Voix off IA',d:'Texte → voix française (Chatterbox, Gemini, Piper…)'},
  {id:'s-gen',where:'auto',task:'image',ic:'image',name:'Générer une image',d:'FLUX, Qwen-Image, CogView, Kolors… : fond, ambiance, illustration'},
  {id:'s-t2v',where:'auto',task:'t2v',ic:'clap',name:'Texte → vidéo',d:'Wan 2.2, CogVideoX, Seedance… : plan vidéo à partir d\'une description'},
  {id:'s-i2v',where:'auto',task:'i2v',ic:'film',name:'Photo → vidéo',d:'Wan 2.2, CogVideoX : vrai mouvement de caméra sur une photo'},
  {id:'s-night',where:'auto',task:'edit',ic:'moon',name:'Nuit photoréaliste',d:'Qwen-Image-Edit : vraie photo crépusculaire'},
  {id:'s-staging',where:'auto',task:'edit',ic:'house',name:'Home staging virtuel',d:'Meuble une pièce vide (moderne ou scandinave)'},
  {id:'s-declutter',where:'auto',task:'edit',ic:'sparkles',name:'Désencombrer la pièce',d:'Retire objets et désordre'},
  {id:'s-editfree',where:'auto',task:'edit',ic:'wand',name:'Retouche par consigne',d:'« Remplace le ciel », « ajoute des fleurs »…'},
  {id:'s-music',where:'auto',task:'music',ic:'music',name:'Musique sur mesure',d:'ACE-Step, Stable Audio : morceau au style choisi'},
  {id:'ai-depth',ic:'layers',name:'Photo 3D (profondeur)',d:'Depth Anything : parallaxe réaliste sur une photo'},
  {id:'ai-bg',ic:'mask',name:'Détourer une photo',d:'BiRefNet : sujet sans fond, en incrustation'},
  {id:'ai-up',ic:'zin',name:'Agrandir la photo',d:'Swin2SR ×2 (ou Real-ESRGAN ×4 sur serveur)'},
  {id:'s-denoise',ic:'wave',where:'server',cap:'denoise',name:'Débruiter la voix',d:'DeepFilterNet sur la vidéo ou l\'audio sélectionné'},
  {id:'s-stems',ic:'layers',where:'server',cap:'stems',name:'Séparer voix et musique',d:'Demucs : isole la voix'},
  {id:'s-stab',ic:'max',where:'server',cap:'stabilize',name:'Stabiliser la vidéo',d:'FFmpeg vidstab'},
  {id:'s-slowmo',ic:'freeze',where:'server',cap:'stabilize',name:'Ralenti fluide 60 i/s',d:'Interpolation d\'images FFmpeg'},
];
const autoBtn=t=>`<button class="fxi" data-auto="${t.id}"><span class="ico">${ic(t.ic)}</span><div><b>${t.name}</b><span>${t.d}</span></div></button>`;
async function askText(title,label,def='',opts){return new Promise(res=>{const m=modal(`<h3>${esc(title)}</h3><p class="note">${esc(label)}</p>${opts?`<select class="ta" style="min-height:0;height:36px" id="askSel">${opts.map(([k,n])=>`<option value="${k}">${esc(n)}</option>`).join('')}</select>`:''}<textarea class="ta" id="askT" rows="4">${esc(def)}</textarea><div class="mrow"><button class="btn" data-c="0">Annuler</button><button class="btn pri" data-c="1">Valider</button></div>`);
  m.addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;const v=$('#askT',m).value,s=opts?$('#askSel',m).value:null;m.parentElement.remove();res(b.dataset.c==='1'?{text:v,opt:s}:null)})})}
const isPhoto=x=>x.kind==='image'||x.kind==='scene';
async function aiEdit(c,prompt,suffix){lastPrompt=prompt;const blob=await runEngine('edit','Retouche IA',await mediaBlobOf(c),prompt);if(!blob)return;await swapMedia(c,blob,'image',(c.name||'Photo')+' · '+suffix);c.aiGen=true;commit();toast('Photo retouchée par IA : signalez-la comme telle dans l\'annonce')}
async function runTool(id,btn){
  const c=selClip();const need=(pred,msg)=>{if(!c||!pred(c)){toast(msg);return false}return true};
  const srvNeed=cap=>{if(!SRV.has(cap)){toast('Cet outil demande le serveur IA open source (dossier server/ du dépôt). Renseignez son adresse dans l\'onglet Modèles IA.');setTab('ai',true);return false}return true};
  switch(id){
    case'wizard':return openAssistant();
    case'check':return openCheck();
    case'split2':return splitScreen(2);
    case'split3':return splitScreen(3);
    case'split4':return splitScreen(4);
    case'montage':return autoMontage();
    case'beatcut':return cutToBeat();
    case'scenes':return need(x=>x.kind==='video','Sélectionnez une vidéo')&&splitScenes(c);
    case'silences':return need(x=>x.kind==='video'||x.kind==='audio','Sélectionnez une vidéo ou un audio parlé')&&removeSilences(c);
    case'freeze':return freezeFrame();
    case'record':return openRecorder();
    case'reframe-subject':return need(x=>x.kind==='video','Sélectionnez une vidéo avec une personne')&&autoReframe(c);
    case'blurfaces':{const list=P.clips.filter(isMedia);if(!list.length)return toast('Aucune photo ou vidéo');list.forEach(x=>x.blurFaces=true);commit();refreshAll();VIS.load();return toast('Floutage automatique des visages activé sur '+list.length+' plan(s)')}
    case'tips':return openTips();
    case'adjust':{const tr={id:uid(),kind:'overlay',name:'Réglages'};P.tracks.unshift(tr);const a=newClip('adjust',{start:0,dur:projDur(),trackId:tr.id,filter:'cinema',filterAmt:.6});P.clips.push(a);S.sel=a.id;commit();refreshAll();openInspector();return toast('Calque de réglage ajouté sur toute la vidéo')}
    case'reframe':{setAspect('9:16');P.clips.filter(isMedia).forEach(x=>{if(x.kind==='video'){x.fit='blurfill'}else{x.fit='cover';x.fx=x.fx.filter(f=>!['kb-in','kb-out','pan-l','pan-r'].includes(f.id));x.fx.push({id:Math.random()<.5?'pan-l':'pan-r',v:.9})}});commit();refreshAll();return toast('Projet passé en 9:16 avec balayage automatique')}
    case'markers':return beatMarkers();
    case'duck':{const music=P.clips.filter(x=>x.kind==='audio'&&x.role!=='voice');if(!music.length)return toast('Aucune musique dans le projet');if(!P.clips.some(isVoice)){const v=P.clips.filter(x=>x.kind==='video');v.forEach(x=>x.role='voice')}music.forEach(x=>x.duck=.7);commit();refreshAll();return toast('Ducking activé : la musique baisse sous la voix')}
    case'normalize':return need(x=>x.kind==='video'||x.kind==='audio','Sélectionnez un clip audio ou vidéo')&&normalizeClip(c);
    case'voiceclear':if(need(x=>x.kind==='video'||x.kind==='audio','Sélectionnez un clip audio ou vidéo')){c.voiceFx=!c.voiceFx;c.role='voice';commit();renderInspector();toast(c.voiceFx?'Voix claire activée':'Voix claire désactivée')}return;
    case'transcribe':case'ai-transcribe':return need(x=>x.kind==='video'||x.kind==='audio','Sélectionnez une vidéo ou un audio avec de la voix')&&aiTranscribe(c,'french');
    case'srtcap':return $('#srtIn').click();
    case'script2cap':{const txt=($('#capScript')||{}).value||'';if(!txt.trim())return toast('Collez d\'abord un texte');const voice=P.clips.find(isVoice);let words;
      if(voice&&media[voice.mediaId]){let segs=null;try{segs=(await speechSegments(media[voice.mediaId],{thr:-40,minSil:.25,pad:.05})).map(s=>({s:voice.start+(s.s-voice.in)/voice.speed,e:voice.start+(s.e-voice.in)/voice.speed}))}catch(e){}words=wordsFromText(txt,voice.start,voice.start+voice.dur,segs)}
      else words=wordsFromText(txt,.3,projDur()-.3);addCaptionClip(words,'Sous-titres',S.capStyle||'karaoke');commit();refreshAll();return toast(voice?'Texte synchronisé sur la voix off':'Texte réparti sur toute la durée')}
    case'social':return openSocial();
    case'thumb':return openThumb();
    case'multi':return openExport(['16:9','9:16','1:1','4:5']);
    case'ai-tts':{const r=await askText('Voix off IA','Texte à lire (voix française). Les musiques baisseront automatiquement sous la voix.',scriptFor(A_OPTS),PIPER_VOICES);if(!r)return;const vc=await aiTTS(r.text,r.opt);if(vc){commit();refreshAll();toast('Voix off ajoutée à la tête de lecture')}return}
    case'ai-depth':return need(isMedia,'Sélectionnez une photo')&&aiDepth(c);
    case'ai-bg':return need(x=>x.kind==='image'||x.kind==='scene','Sélectionnez une photo')&&aiRemoveBg(c);
    case'ai-up':return need(x=>x.kind==='image','Sélectionnez une photo importée')&&aiUpscale(c);
    case's-night':return need(isPhoto,'Sélectionnez une photo')&&aiEdit(c,IMG_PROMPTS.night,'nuit');
    case's-staging':{if(!need(isPhoto,'Sélectionnez la photo d\'une pièce'))return;const r=await askText('Home staging virtuel','Précisez le style ou gardez le texte proposé. Pensez à indiquer « mise en scène virtuelle » dans l\'annonce.',IMG_PROMPTS.staging_modern,[['m','Moderne'],['s','Scandinave']]);if(!r)return;return aiEdit(c,r.opt==='s'&&r.text===IMG_PROMPTS.staging_modern?IMG_PROMPTS.staging_scandi:r.text,'meublé')}
    case's-declutter':return need(isPhoto,'Sélectionnez une photo')&&aiEdit(c,IMG_PROMPTS.declutter,'rangé');
    case's-editfree':{if(!need(isPhoto,'Sélectionnez une photo'))return;const r=await askText('Retouche par consigne','Décrivez la modification (en anglais de préférence pour de meilleurs résultats).','Replace the grey sky with a clear blue sky. Keep everything else identical.');if(!r)return;return aiEdit(c,r.text,'retouchée')}
    case's-i2v':{if(!need(isPhoto,'Sélectionnez une photo'))return;const r=await askText('Photo → vidéo','Décrivez le mouvement (en anglais de préférence).','Slow cinematic drone push-in towards the house, gentle parallax, natural light, real estate video');if(!r)return;lastPrompt=r.text;
      const blob=await runEngine('i2v','Photo → vidéo',await mediaBlobOf(c),r.text);if(blob){await swapMedia(c,blob,'video',(c.name||'Photo')+' animée');c.aiGen=true}return}
    case's-t2v':{const r=await askText('Texte → vidéo','Décrivez le plan (en anglais de préférence). Les vidéos IA réalistes doivent être signalées comme telles sur les réseaux.','Aerial drone shot of a modern villa with a pool at golden hour, Provence, olive trees, cinematic, 4k');if(!r)return;lastPrompt=r.text;
      const blob=await runEngine('t2v','Texte → vidéo',r.text,P.aspect==='9:16'?'9:16':'16:9');if(blob){const idm=uid();const m=await registerMedia(idm,blob,{type:'video',name:'Vidéo IA'});IDB.put(idm,blob);addMediaToTimeline(m);const nc=selClip();if(nc)nc.aiGen=true;toast('Plan vidéo IA ajouté')}return}
    case's-music':{const r=await askText('Musique sur mesure','Style, ambiance, tempo (en anglais de préférence).','warm acoustic lounge, piano and soft guitar, 100 bpm, uplifting, real estate');if(!r)return;
      const blob=await runEngine('music','Musique',r.text,Math.ceil(projDur()));if(blob){const idm=uid();const m=await registerMedia(idm,blob,{type:'audio',name:'Musique IA'});IDB.put(idm,blob);addMediaToTimeline(m)}return}
    case's-gen':{const r=await askText('Générer une image','Décrivez l\'image (en anglais de préférence).','Luxury Provençal villa at golden hour, olive trees, pool, architectural photography');if(!r)return;lastPrompt=r.text;const [w,h]=baseWH();const k=1344/Math.max(w,h);
      const blob=await runEngine('image','Image',r.text,Math.round(w*k/16)*16,Math.round(h*k/16)*16);if(blob){const idm=uid();const m=await registerMedia(idm,blob,{type:'image',name:'Image IA'});IDB.put(idm,blob);addMediaToTimeline(m);const nc=selClip();if(nc)nc.aiGen=true}return}
    case's-denoise':return srvNeed('denoise')&&need(x=>x.kind==='video'||x.kind==='audio','Sélectionnez un clip avec de la voix')&&serverAudioTool(c,'/audio/denoise',{},'Voix débruitée');
    case's-stems':return srvNeed('stems')&&need(x=>x.kind==='video'||x.kind==='audio','Sélectionnez un clip audio ou vidéo')&&serverAudioTool(c,'/audio/stems',{stem:'vocals'},'Voix isolée');
    case's-stab':return srvNeed('stabilize')&&need(x=>x.kind==='video','Sélectionnez une vidéo')&&serverImageTool(c,'/video/stabilize',{},'stabilisée');
    case's-slowmo':return srvNeed('stabilize')&&need(x=>x.kind==='video','Sélectionnez une vidéo')&&serverImageTool(c,'/video/interpolate',{fps:60},'60 i/s');
    case'srv-test':{SRV.url=($('#srvUrl')||{}).value.trim();SRV.token=($('#srvTok')||{}).value.trim();SRV.save();const st=$('#srvStatus');if(st)st.textContent='Connexion…';try{const j=await SRV.health();toast(j?'Serveur IA connecté':'Adresse vide');}catch(e){toast(e.message)}renderPanel();return}
  }
}
