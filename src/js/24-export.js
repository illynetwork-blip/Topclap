/* ---------- export ---------- */
let rec=null,recChunks=[],exportUI=null,exportRestore=null;
function pickMime(){if(!window.MediaRecorder)return null;for(const m of ['video/mp4;codecs=avc1.42E01F,mp4a.40.2','video/mp4;codecs=avc1,mp4a','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'])try{if(MediaRecorder.isTypeSupported(m))return m}catch(e){}return ''}
const PLATFORMS=[['16:9','YouTube · 16:9'],['9:16','Reels · Shorts · TikTok · 9:16'],['4:5','Instagram post · 4:5'],['1:1','Facebook · 1:1']];
function openExport(formats){
  pause();const mime=pickMime();const fmt=mime==null?'indisponible':mime.includes('mp4')?'MP4 (H.264)':mime?'WebM':'auto';const sel=formats&&formats.length?formats:[P.aspect];
  const m=modal(`<h3>Exporter</h3><p class="note">Rendu en temps réel dans votre navigateur (${fmtT(projDur())} par format). Gardez cet onglet visible pendant l'export.</p>
    <div class="grp">Formats</div><div class="chip-row">${PLATFORMS.map(([k,n])=>`<label class="tg chip"><input type="checkbox" name="exFmt" value="${k}" ${sel.includes(k)?'checked':''}>${n}</label>`).join('')}</div>
    <div class="row"><label for="exRes">Résolution</label><select id="exRes"><option value="0.6667">720p</option><option value="1" selected>1080p Full HD</option><option value="1.3334">1440p</option><option value="2">4K (exigeant)</option></select></div>
    <div class="row"><label for="exFps">Images/s</label><select id="exFps"><option>24</option><option selected>30</option><option>60</option></select></div>
    <div class="row"><label for="exQ">Qualité</label><select id="exQ"><option value="6">Standard</option><option value="12" selected>Haute</option><option value="24">Maximale</option></select></div>
    <div class="row"><label>Encodage</label><span>${fmt}${SRV.has('convert')?' · <label class="tg"><input type="checkbox" id="exSrv" checked>finaliser en MP4 + volume −14 LUFS (serveur)</label>':''}</span></div>
    <div id="exStage"></div>
    <div class="mrow"><button class="btn" data-x="png">${ic('image')}Image PNG</button><button class="btn" data-x="thumb">${ic('image')}Miniature</button><button class="btn" data-x="json">${ic('download')}Projet .json</button><span class="sp"></span><button class="btn" data-x="close">Fermer</button><button class="btn pri" data-x="go" ${mime==null?'disabled':''}>${ic('download')}Lancer l'export</button></div>`);
  exportUI=m;
  m.addEventListener('click',async e=>{const b=e.target.closest('[data-x],[data-dl]');if(!b)return;
    if(b.dataset.dl){const r=exportResults[+b.dataset.dl];if(r)download(r.blob,r.name);return}
    const x=b.dataset.x;
    if(x==='close'){if(S.exporting)cancelExport();m.parentElement.remove();exportUI=null}
    else if(x==='png'){renderFrame(S.t);cv.toBlob(bl=>bl&&download(bl,slug()+'-'+fmtT(S.t).replace(/[:.]/g,'')+'.png'),'image/png')}
    else if(x==='thumb'){openThumb()}
    else if(x==='json')download(new Blob([projectJSON()],{type:'application/json'}),slug()+'.crepuscule.json');
    else if(x==='go'){const fm=$$('input[name=exFmt]:checked',m).map(i=>i.value);if(!fm.length){toast('Choisissez au moins un format');return}runExportQueue(fm,+$('#exRes',m).value,+$('#exFps',m).value,+$('#exQ',m).value,mime,!!($('#exSrv',m)||{}).checked)}});
}
function slug(){return (P.name||'projet').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'projet'}
let exportResults=[];
async function runExportQueue(formats,scale,fps,mbps,mime,useSrv){
  const st=$('#exStage',exportUI);$('[data-x=go]',exportUI).disabled=true;exportResults=[];const orig=P.aspect;
  const list=()=>exportResults.map((r,i)=>`<div class="ex-row"><b>${r.label}</b><span>${(r.blob.size/1048576).toFixed(1)} Mo · ${r.ext.toUpperCase()}</span><button class="btn" data-dl="${i}">${ic('download')}Télécharger</button></div>`).join('');
  for(let i=0;i<formats.length;i++){
    const a=formats[i];if(!exportUI)break;st.innerHTML=`${list()}<div class="prog"><i id="exBar"></i></div><p class="note" id="exTxt">Format ${a} (${i+1}/${formats.length}) : préparation…</p>`;
    if(P.aspect!==a){P.aspect=a;$('#aspectSel').value=a}
    let blob=await renderToBlob(scale,fps,mbps,mime,(t,d)=>{const b=$('#exBar'),tx=$('#exTxt');if(b)b.style.width=(t/d*100)+'%';if(tx)tx.textContent=`Format ${a} (${i+1}/${formats.length}) · ${fmtT(t)} / ${fmtT(d)}`});
    if(!blob)break;let ext=(blob.type||'').includes('mp4')?'mp4':'webm';
    if(useSrv){try{const tx=$('#exTxt');if(tx)tx.textContent='Finalisation MP4 sur le serveur…';blob=await SRV.call('/video/convert',{file:blob,loudnorm:'-14'});ext='mp4'}catch(e){toast(e.message)}}
    exportResults.push({blob,ext,label:(PLATFORMS.find(p=>p[0]===a)||[a,a])[1],name:`${slug()}-${a.replace(':','x')}.${ext}`});
  }
  if(P.aspect!==orig){P.aspect=orig;$('#aspectSel').value=orig;setRes(S.pq)}
  if(!exportUI)return;const last=exportResults[exportResults.length-1];
  st.innerHTML=(last?`<video src="${URL.createObjectURL(last.blob)}" controls playsinline></video>`:'')+list()+`<p class="note">Si un téléchargement ne démarre pas, faites un clic droit sur la vidéo › Enregistrer la vidéo.</p>`;
  $('[data-x=go]',exportUI).disabled=false;toast(exportResults.length>1?`${exportResults.length} vidéos exportées`:'Export terminé');
}
let exportResolve=null;
function renderToBlob(scale,fps,mbps,mime,onProg){
  return new Promise(async resolve=>{
    ensureAudio();pause();exportRestore=S.pq;S.exporting=true;setRes(scale);const selBefore=S.sel;S.sel=null;renderTimelineSel();
    const stream=cv.captureStream(fps);if(exportDest)exportDest.stream.getAudioTracks().forEach(tk=>stream.addTrack(tk));
    recChunks=[];try{rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:mbps*1e6*scale*scale,audioBitsPerSecond:192000}:{})}catch(e){try{rec=new MediaRecorder(stream)}catch(e2){toast('Export impossible sur ce navigateur');S.exporting=false;setRes(exportRestore);return resolve(null)}}
    rec.ondataavailable=e=>{if(e.data&&e.data.size)recChunks.push(e.data)};
    rec.onstop=()=>{S.sel=selBefore;if(!recChunks.length)return resolve(null);const type=(rec.mimeType||mime||'video/webm').split(';')[0];resolve(new Blob(recChunks,{type}))};
    exportResolve=resolve;S.t=0;syncMedia(0,false);req();await new Promise(r=>setTimeout(r,500));
    rec.start(250);S.playing=true;lastNow=performance.now();updateTransport();
    const upd=()=>{if(!S.exporting)return;onProg&&onProg(S.t,projDur());requestAnimationFrame(upd)};upd();
  });
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.exporting)toast('Export en cours : revenez sur cet onglet, sinon la vidéo sera saccadée')});
function finishExport(){S.exporting=false;S.playing=false;pauseAll();updateTransport();try{rec&&rec.state!=='inactive'&&rec.stop()}catch(e){}setRes(exportRestore||S.pq)}
function cancelExport(){S.exporting=false;S.playing=false;pauseAll();recChunks=[];try{rec&&rec.state!=='inactive'&&rec.stop()}catch(e){}setRes(exportRestore||S.pq);updateTransport();if(exportResolve)exportResolve(null)}
let dlCap;const dlReady=(window.claude&&window.claude.use)?window.claude.use('downloads').then(d=>dlCap=d).catch(()=>dlCap=null):Promise.resolve(dlCap=null);
async function download(blob,name){
  await dlReady;
  if(dlCap){try{await dlCap.save({filename:name,data:blob});toast('Fichier enregistré');}catch(e){if(e&&e.code==='declined')return;if(e&&e.code==='rate_limited'){toast('Patientez un instant puis réessayez');return}if(e&&e.code==='rejected_extension'&&!/\.txt$/.test(name)){return download(blob,name.replace(/\.[^.]+$/,'')+'.txt')}toast('Téléchargement indisponible ici : clic droit sur la vidéo › Enregistrer')}return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove()},1000)}
function projectJSON(){return JSON.stringify({app:'crepuscule-studio',version:2,project:P,media:Object.values(media).map(m=>({id:m.id,type:m.type,name:m.name,demo:m.demo||null}))},null,1)}
function openProjectText(txt){try{const o=JSON.parse(txt);if(!o.project)throw 0;(o.media||[]).forEach(m=>{if(m.demo)ensureDemoMusic(m.demo,m.id)});Object.assign(P,o.project);normalizeProject();
  const missing=P.clips.filter(c=>c.mediaId&&!media[c.mediaId]).length;P.clips=P.clips.filter(c=>!c.mediaId||media[c.mediaId]);$('#aspectSel').value=P.aspect;$('#projName').value=P.name;setRes(S.pq);S.sel=null;commit();refreshAll();toast(missing?`Projet ouvert. ${missing} clip(s) sans média ont été retirés : réimportez vos fichiers.`:'Projet ouvert')}catch(e){toast('Ce fichier n\'est pas un projet Crépuscule valide')}}
