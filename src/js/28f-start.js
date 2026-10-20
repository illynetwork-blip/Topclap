/* ---------- start screen, project library, install as an app (PWA) ---------- */
let installEvt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;$$('[data-install]').forEach(b=>b.hidden=false)});
addEventListener('appinstalled',()=>{installEvt=null;$$('[data-install]').forEach(b=>b.hidden=true);toast('Top Clap est installé')});
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
async function installApp(){
  if(installEvt){installEvt.prompt();const r=await installEvt.userChoice.catch(()=>null);installEvt=null;if(r&&r.outcome==='accepted')toast('Installation en cours…');return}
  if(isIOS())return toast('Sur iPhone / iPad : touchez Partager puis « Sur l\'écran d\'accueil »');
  toast('Utilisez le menu du navigateur › « Installer l\'application » (Chrome, Edge). L\'appli doit être ouverte depuis son adresse en ligne.');
}
if(document.querySelector('link[rel=manifest]')&&'serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

/* project library */
function listProjects(){const st=projStore();return Object.entries(st.list||{}).map(([id,p])=>({id,...p})).sort((a,b)=>b.updated-a.updated)}
async function openProjectId(id){
  const st=projStore();const p=st.list&&st.list[id];if(!p)return toast('Projet introuvable');
  saveNow();pause();curProj=id;Object.assign(P,{markers:[],info:DEF_INFO(),brand:DEF_BRAND()},JSON.parse(JSON.stringify(p.P)));normalizeProject();
  P.clips=P.clips.filter(c=>!c.mediaId||media[c.mediaId]);hist.stack=[];hist.i=-1;S.sel=null;S.t=0;
  $('#aspectSel').value=P.aspect;$('#projName').value=P.name;setRes(S.pq);commit();refreshAll();closeStart();toast(`« ${P.name} » ouvert`);
}
function newProjectBlank(name='Nouveau projet'){saveNow();pause();curProj=uid();Object.assign(P,{name,aspect:P.aspect||'16:9',bg:'#000000',tracks:defaultTracks(),clips:[],markers:[],info:{...P.info},brand:{...P.brand}});
  hist.stack=[];hist.i=-1;S.sel=null;S.t=0;$('#projName').value=P.name;commit();refreshAll();saveNow()}
function newProjectDemo(){saveNow();pause();curProj=uid();buildDemo();hist.stack=[];hist.i=-1;commit();refreshAll();saveNow()}
function duplicateProject(id){const st=projStore();const p=st.list&&st.list[id];if(!p)return;const nid=uid();st.list[nid]={...JSON.parse(JSON.stringify(p)),name:p.name+' (copie)',updated:Date.now()};st.list[nid].P.name=st.list[nid].name;try{localStorage.setItem(PROJ_LS,JSON.stringify(st))}catch(e){toast('Mémoire du navigateur pleine')}renderStart()}
function deleteProject(id){const st=projStore();if(!st.list||!st.list[id])return;delete st.list[id];if(id===curProj){curProj=null}try{localStorage.setItem(PROJ_LS,JSON.stringify(st))}catch(e){}renderStart();if(!curProj)newProjectBlank()}

/* start screen */
const startEl=document.createElement('div');startEl.id='start';startEl.hidden=true;document.body.appendChild(startEl);
let delArmed=null;
function renderStart(){
  const ps=listProjects();const fmtD=t=>new Date(t).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  startEl.innerHTML=`<div class="st-in">
    <div class="st-hero"><div class="st-logo">${LOGO('st')}</div><div><div class="st-wm">Top <i>Clap</i></div><div class="st-sub">ÉDITEUR VIDÉO</div><p class="st-tag">Créez · Montez · Partagez — donnez vie à vos idées.</p></div></div>
    <div class="st-cta"><button class="btn pri st-go" data-st="go">${ic('play','f')}Démarrer</button>
      <button class="btn" data-install data-st="install" ${installEvt||isIOS()?'':'hidden'}>${ic('download')}Installer l'appli</button></div>
    <div class="st-grid">
      <button class="st-card" data-st="wizard">${ic('wand')}<b>Assistant vidéo</b><span>Annonce, Reel, YouTube… générés automatiquement</span></button>
      <button class="st-card" data-st="new">${ic('plus')}<b>Nouveau projet</b><span>Timeline vide, vos médias</span></button>
      <button class="st-card" data-st="import">${ic('upload')}<b>Importer</b><span>Vidéos, photos, musiques, .srt, .cube</span></button>
      <button class="st-card" data-st="rec">${ic('mic')}<b>Enregistrer</b><span>Caméra ou écran avec prompteur</span></button>
      <button class="st-card" data-st="demo">${ic('house')}<b>Projet exemple</b><span>Villa jour → nuit avec textes et musique</span></button>
    </div>
    <div class="st-h">Mes projets <small>${ps.length}</small></div>
    <div class="st-projects">${ps.length?ps.map(p=>`<div class="st-p${p.id===curProj?' cur':''}"><button class="st-open" data-open="${p.id}"><span class="st-th" style="${p.thumb?`background-image:url(${p.thumb})`:''}"></span><b>${esc(p.name)}</b><span>${p.aspect||''} · ${fmtT(p.dur||0).slice(0,5)} · ${fmtD(p.updated)}</span></button>
      <div class="st-act"><button class="mini" data-dup="${p.id}" title="Dupliquer" aria-label="Dupliquer">${ic('copy')}</button><button class="mini" data-del="${p.id}" title="Supprimer" aria-label="Supprimer">${ic('trash')}</button></div></div>`).join(''):'<p class="note">Vos projets apparaîtront ici. Ils sont enregistrés dans ce navigateur.</p>'}</div>
    <label class="tg st-show"><input type="checkbox" id="stShow" ${startPref()?'checked':''}>Afficher cet écran au démarrage</label>
  </div>`;
}
function startPref(){try{return localStorage.getItem('topclap-start')!=='0'}catch(e){return true}}
function openStart(){renderStart();startEl.hidden=false;pause()}
function closeStart(){startEl.hidden=true;fitViewport();req()}
startEl.addEventListener('click',async e=>{
  const b=e.target.closest('[data-st],[data-open],[data-dup],[data-del]');if(!b)return;
  if(b.dataset.open){if(b.dataset.open===curProj)return closeStart();return openProjectId(b.dataset.open)}
  if(b.dataset.dup)return duplicateProject(b.dataset.dup);
  if(b.dataset.del){if(delArmed===b.dataset.del){delArmed=null;return deleteProject(b.dataset.del)}delArmed=b.dataset.del;toast('Touchez à nouveau la corbeille pour supprimer ce projet');setTimeout(()=>{delArmed=null},3000);return}
  const a=b.dataset.st;
  if(a==='go')closeStart();
  else if(a==='install')installApp();
  else if(a==='wizard'){closeStart();openAssistant()}
  else if(a==='new'){newProjectBlank();closeStart();toast('Nouveau projet : importez vos médias')}
  else if(a==='import'){closeStart();$('#fileIn').click()}
  else if(a==='demo'){newProjectDemo();closeStart()}
  else if(a==='rec'){closeStart();openRecorder()}
});
startEl.addEventListener('change',e=>{if(e.target.id==='stShow'){try{localStorage.setItem('topclap-start',e.target.checked?'1':'0')}catch(err){}}});
