/* ---------- panels ---------- */
const TABS=[['auto','Auto','wand'],['media','Médias','film'],['text','Texte','type'],['shapes','Formes','shapes'],['fx','Effets','sparkles'],['trans','Transitions','trans'],['filters','Filtres','filter'],['immo','Immo IA','house'],['ai','Modèles IA','cpu'],['audio','Audio','music'],['insp','Réglages','sliders']];
function renderRail(){$('#rail').innerHTML=TABS.map(([k,n,i])=>`<button data-tab="${k}" class="${k==='insp'?'rail-insp':''}${S.tab===k?' act':''}">${ic(i)}<span>${n}</span></button>`).join('')}
$('#rail').addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(!b)return;const k=b.dataset.tab;
  if(k==='insp'){$('#insp').classList.contains('open')?closeSheet('insp'):openInspector();return}
  if(isPhone()&&S.tab===k&&$('#panel').classList.contains('open')){closeSheet('panel');return}
  setTab(k,true)});
function setTab(k,open){S.tab=k;renderRail();renderPanel();if(open&&isPhone()){closeSheet('insp');$('#panel').classList.add('open')}}
function openInspector(){if(isDesk())return;if(isPhone())closeSheet('panel');$('#insp').classList.add('open');renderInspector()}
function closeSheet(w){$('#'+w).classList.remove('open')}
document.addEventListener('click',e=>{const x=e.target.closest('[data-close]');if(x)closeSheet(x.dataset.close)});
function renderPanelIf(...tabs){if(tabs.includes(S.tab))renderPanel()}
function needSel(fn,visualOnly=true){const c=selClip();if(!c||(visualOnly&&!isVisual(c))){toast('Sélectionnez d\'abord un clip dans la timeline');return null}return fn(c)}
const transPreviews=[];
function renderPanel(){
  const tab=TABS.find(t=>t[0]===S.tab);$('#panelTitle').textContent=tab?tab[1]:'';const b=$('#panelBody');transPreviews.length=0;const c=selClip();let h='';
  if(S.tab==='media'){
    const ms=Object.values(media).filter(m=>m.type==='video'||m.type==='image'||(m.type==='audio'&&!m.demo));
    h+=`<div class="drop" id="dropZone">${ic('upload')}<div>Glissez vos vidéos, photos ou musiques ici</div><button class="btn pri" data-act="import">${ic('plus')}Importer des fichiers</button></div>`;
    h+=`<div class="grp">Vos médias</div>`+(ms.length?`<div class="grid2">${ms.map(m=>`<button class="tile" draggable="true" data-media="${m.id}"><span class="th" style="${m.thumb?`background-image:url(${m.thumb})`:m.wave?`background-image:url(${m.wave});background-size:100% 60%;background-color:#15302A`:''}"></span><span class="badge">${m.type==='video'?fmtT(m.dur).slice(0,5):m.type==='audio'?'AUDIO':'PHOTO'}</span><span class="rm" data-rm="${m.id}" role="button" aria-label="Retirer">${ic('x')}</span><span class="tl">${esc(m.name)}</span></button>`).join('')}</div>`:`<p class="note">Aucun média importé pour l'instant. Vos fichiers restent sur votre appareil : rien n'est envoyé sur un serveur.</p>`);
    h+=`<div class="grp">Scènes de démonstration</div><div class="grid2">${Object.entries(SCENES).map(([k,n])=>`<button class="tile" draggable="true" data-scene="${k}"><span class="th" style="background-image:url(${SCN_TH[k]})"></span><span class="tl">${n}<small>Image de synthèse</small></span></button>`).join('')}</div>`;
    h+=`<div class="grp">Fonds de couleur</div><div class="grid3">${COLORS.map(([a,z,n],i)=>`<button class="tile" data-color="${i}"><span class="th" style="background:linear-gradient(135deg,${a},${z})"></span><span class="tl">${n}</span></button>`).join('')}</div>`;
  }
  else if(S.tab==='text'){
    h+=`<button class="btn pri wide" data-act="addtext">${ic('plus')}Ajouter un texte</button>`;
    h+=`<div class="grp">Modèles immobilier</div><div class="grid2">${TEXT_TPL.map((t,i)=>{const p={...DEF_TEXT(),...t.p};const fs=Math.max(11,Math.min(22,p.size/5));return `<button class="tpl" data-tpl="${i}"><div class="pv"><span style="font-family:'${p.font}',sans-serif;font-weight:${p.weight};font-style:${p.italic?'italic':'normal'};color:${p.color};font-size:${fs}px;letter-spacing:${p.ls/4}px;${p.bgA?`background:${p.bg};padding:4px 8px;border-radius:${p.radius/3}px`:''};${p.shadowBlur?`text-shadow:0 0 ${p.shadowBlur/3}px ${p.shadowColor}`:''}">${esc(p.text.split('\n')[0])}</span></div><div class="tl">${t.name}</div></button>`}).join('')}</div>`;
    h+=`<div class="grp">Émojis & stickers</div><div class="emo">${EMOJIS.map(e=>`<button data-emoji="${e}" aria-label="Ajouter ${e}">${e}</button>`).join('')}</div>`;
    h+=`<div class="grp">Sous-titres</div><button class="btn wide" data-act="srt">${ic('subs')}Importer un fichier .srt / .vtt</button><p class="note">Les répliques deviennent des sous-titres animés mot à mot. Sous-titres automatiques et styles : onglet Auto.</p>`;
    h+=`<div class="grp">Polices (${FONTS.length})</div><p class="note">${c&&c.kind==='text'?'Touchez une police pour l\'appliquer au texte sélectionné.':'Touchez une police pour créer un texte avec.'}</p><div class="grid2">${FONTS.map(([f])=>`<button class="font-btn${c&&c.kind==='text'&&c.font===f?' act':''}" data-font="${esc(f)}" style="font-family:'${f}',sans-serif">${esc(f)}</button>`).join('')}</div>`;
  }
  else if(S.tab==='shapes'){
    h+=`<p class="note">Formes et pictos pour les annonces. Ils s'ajoutent sur la piste d'incrustation à la position de la tête de lecture.</p><div class="grid2">${SHAPES.map(([k,n])=>`<button class="fxi" data-shape="${k}"><span class="ico">${shapeIcon(k)}</span><div><b>${n}</b></div></button>`).join('')}</div>`;
  }
  else if(S.tab==='fx'){
    const cats=[...new Set(FX.map(f=>f.cat))];
    h+=c&&isVisual(c)?`<p class="note">Appliqué à <b>${esc(c.name||c.kind)}</b>. Touchez à nouveau pour retirer.</p>`:`<p class="note">Sélectionnez un clip pour lui appliquer un effet.</p>`;
    for(const cat of cats)h+=`<div class="grp">${cat}</div><div class="grid2">${FX.filter(f=>f.cat===cat).map(f=>`<button class="fxi${c&&c.fx.some(x=>x.id===f.id)?' act':''}" data-fx="${f.id}"><span class="ico">${ic(f.ic)}</span><div><b>${f.name}</b><span>${f.d}</span></div></button>`).join('')}</div>`;
  }
  else if(S.tab==='trans'){
    h+=c&&isVisual(c)?`<p class="note">Transition d'entrée de <b>${esc(c.name||c.kind)}</b>${c.trans.type!=='none'?` : ${TRANSMAP[c.trans.type]}`:''}. Sur la piste principale, elle enchaîne avec le clip précédent.</p>`:`<p class="note">Sélectionnez un clip, ou touchez le losange entre deux clips dans la timeline.</p>`;
    h+=`<div class="grid2">${TRANS.map(([k,n])=>`<button class="tile${c&&c.trans.type===k?' act':''}" data-trans="${k}"><canvas class="th" width="160" height="90" data-tp="${k}"></canvas><span class="tl">${n}</span></button>`).join('')}</div>`;
    if(c&&isVisual(c))h+=`<div class="grp">Durée</div><div class="row"><label for="trDur">Durée</label><input type="range" id="trDur" min="0.2" max="2.5" step="0.05" value="${c.trans.dur}"><output>${c.trans.dur.toFixed(2)}s</output></div><button class="btn wide" data-act="transall">Appliquer à toute la piste principale</button>`;
  }
  else if(S.tab==='filters'){
    h+=c&&isMedia(c)?`<p class="note">Filtre de <b>${esc(c.name)}</b>.</p><div class="row"><label for="fAmt">Intensité</label><input type="range" id="fAmt" min="0" max="1" step="0.01" value="${c.filterAmt}"><output>${Math.round(c.filterAmt*100)}%</output></div>`:`<p class="note">Sélectionnez une photo ou une vidéo pour appliquer un filtre.</p>`;
    h+=`<div class="grid2">${Object.entries(FILTERS).map(([k,f])=>`<button class="tile${c&&c.filter===k?' act':''}" data-filter="${k}"><img class="th" alt="" src="${filterThumb(k)}"><span class="tl">${f.name}</span></button>`).join('')}</div>`;
    if(c&&isMedia(c))h+=`<button class="btn wide" style="margin-top:10px" data-act="filterall">Appliquer à tous les clips</button>`;
  }
  else if(S.tab==='immo'){
    h+=`<div class="hero-card"><b>Montage automatique</b><span class="note" style="margin:0">Photos et vidéos assemblées en annonce : mouvements drone, transitions, prix, caractéristiques et musique.</span><button class="btn pri" data-act="auto">${ic('wand')}Créer mon annonce</button></div>`;
    h+=`<div class="grp">Ambiance & lumière</div><div class="stack">${IMMO.map((m,i)=>`<button class="immo-card" data-immo="${i}"><img alt="" src="${immoThumb(m)}"><div><b>${m.name}</b><span>${m.d}</span></div></button>`).join('')}</div>`;
    h+=`<p class="note" style="margin-top:14px">Effets calculés en local dans votre navigateur (WebGL), sans serveur ni abonnement. Réglage fin dans <b>Réglages › Immo IA</b> : ligne d'horizon, intensité, animation.</p>`;
  }
  else if(S.tab==='audio'){
    const au=Object.values(media).filter(m=>m.type==='audio');
    h+=`<button class="btn pri wide" data-act="import">${ic('plus')}Importer une musique</button>`;
    h+=`<div class="grp">Musiques libres de droits</div><div class="stack">${Object.entries(DEMO_MUSIC).map(([k,n])=>`<button class="fxi" data-demomusic="${k}"><span class="ico">${ic('music')}</span><div><b>${n}</b><span>${k==='ambient'?'Accords doux, 32 s, visites calmes':'Tempo 100 BPM, 32 s, Reels dynamiques'}</span></div></button>`).join('')}</div>`;
    h+=`<div class="grp">Voix off</div><button class="btn wide" data-act="rec" id="recBtn">${ic('mic')}Enregistrer une voix off</button><p class="note">Nécessite l'accès au micro. Si votre navigateur le refuse ici, ouvrez l'appli depuis votre propre hébergement.</p>`;
    if(au.length)h+=`<div class="grp">Vos fichiers audio</div><div class="stack">${au.map(m=>`<button class="fxi" data-media="${m.id}"><span class="ico">${ic('vol')}</span><div><b>${esc(m.name)}</b><span>${fmtT(m.dur||0)}</span></div></button>`).join('')}</div>`;
  }
  else if(S.tab==='auto'){
    h+=`<div class="hero-card"><b>Assistant vidéo</b><span class="note" style="margin:0">Choisissez un objectif (annonce, Reel, YouTube, visite, avant/après, face caméra) : montage, textes, voix off, sous-titres, musique et formats sont générés pour vous.</span><button class="btn pri" data-auto="wizard">${ic('wand')}Lancer l'assistant</button></div>`;
    h+=`<div class="grp">Modèles tendance</div><div class="stack">${TRENDS.map(t=>`<button class="fxi" data-trend="${t.id}"><span class="ico">${ic('star')}</span><div><b>${t.name}</b><span>${t.d}</span></div></button>`).join('')}</div>`;
    h+=`<div class="grp">Contrôle</div><div class="stack"><button class="fxi" data-auto="tips"><span class="ico">${ic('star')}</span><div><b>Astuces et pièges à éviter</b><span>Rythme, formats, droits musicaux, obligations des annonces, IA, droit à l'image</span></div></button><button class="fxi" data-auto="check"><span class="ico">${ic('check')}</span><div><b>Vérifier ma vidéo</b><span>Accroche, sous-titres, zones masquées, droits musicaux, DPE, appel à l'action… avec corrections en un clic</span></div></button></div>`;
    h+=`<div class="grp">Montage automatique</div><div class="stack">${AUTO_TOOLS.filter(x=>x.g==='edit').map(autoBtn).join('')}</div>`;
    h+=`<div class="grp">Son</div><div class="stack">${AUTO_TOOLS.filter(x=>x.g==='audio').map(autoBtn).join('')}</div>`;
    h+=`<div class="grp">Sous-titres</div><div class="stack">${AUTO_TOOLS.filter(x=>x.g==='cap').map(autoBtn).join('')}</div>
      <div class="row r2"><label for="capStyle">Style</label><select id="capStyle">${Object.keys(CAPTION_STYLES).map(k=>`<option value="${k}" ${S.capStyle===k?'selected':''}>${{karaoke:'Karaoké (mot surligné)',boxed:'Encadré (mot en couleur)',pop:'Un mot à la fois',classic:'Classique',luxe:'Élégant'}[k]}</option>`).join('')}</select></div>
      <textarea class="ta" id="capScript" rows="3" placeholder="Collez ici un script ou un texte : il sera découpé et synchronisé avec la voix off ou réparti sur la durée."></textarea><button class="btn wide" data-auto="script2cap">Créer les sous-titres depuis ce texte</button>`;
    h+=`<div class="grp">Publication</div><div class="stack">${AUTO_TOOLS.filter(x=>x.g==='pub').map(autoBtn).join('')}</div>`;
  }
  else if(S.tab==='ai'){
    h+=`<p class="note">Tous les modèles ci-dessous sont open source. Ceux marqués <b>Navigateur</b> tournent sur votre appareil après un premier téléchargement mis en cache. Ceux marqués <b>Serveur</b> demandent le serveur IA fourni dans le dépôt (dossier <code>server/</code>, carte graphique conseillée).</p>`;
    h+=`<div class="grp">Outils IA</div><div class="stack">${AI_TOOLS.map(t=>{const srvOnly=t.where==='server';const n=t.task?ENGINES[t.task].filter(e=>e.avail()).length:0;const lab=srvOnly?(SRV.has(t.cap)?'Serveur ✓':'Serveur'):t.task?(n?n+' moteur'+(n>1?'s':''):'à configurer'):'Navigateur';return `<button class="fxi${srvOnly&&!SRV.has(t.cap)?' dis':''}" data-ai="${t.id}"><span class="ico">${ic(t.ic)}</span><div><b>${t.name}</b><span>${t.d}</span></div><em class="where ${srvOnly?'srv':'nav'}">${lab}</em></button>`}).join('')}</div>`;
    h+=enginesPanelHTML();
    h+=`<div class="grp">Serveur IA (optionnel)</div><div class="row r2"><label for="srvUrl">Adresse</label><input type="text" id="srvUrl" placeholder="http://localhost:8000" value="${esc(SRV.url)}"></div><div class="row r2"><label for="srvTok">Jeton</label><input type="text" id="srvTok" placeholder="facultatif" value="${esc(SRV.token)}"></div><button class="btn wide" data-ai="srv-test">${ic('server')}Connecter et tester</button><p class="note" id="srvStatus">${SRV.url?(Object.keys(SRV.caps).filter(k=>SRV.caps[k]).length?'Connecté · '+Object.keys(SRV.caps).filter(k=>SRV.caps[k]).join(', '):'Non vérifié'):'Non configuré'}</p>`;
    h+=`<div class="grp">Catalogue des modèles</div><div class="stack">${MODELS.map(mo=>`<a class="model" href="${mo.url}" target="_blank" rel="noopener"><div><b>${mo.name}</b><span>${mo.task}</span><small>${esc(mo.repo)} · ${mo.size} · ${mo.license}${mo.ok==='cond'?' (conditions)':mo.ok===false?' · non utilisable en France':''}</small></div><em class="where ${mo.where==='server'?'srv':mo.where==='cloud'?'auto':'nav'}">${mo.where==='server'?(SRV.has(mo.cap)?'Serveur ✓':'Serveur'):mo.where==='cloud'?'En ligne':(AI.state[mo.repo]||'Navigateur')}</em></a>`).join('')}</div>`;
  }
  b.innerHTML=h;
  if(S.tab==='trans')$$('canvas[data-tp]',b).forEach(cn=>transPreviews.push(cn));
}
function shapeIcon(k){const m={rect:'M4 6h16v12H4z',round:'M7 6h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z',circle:'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16z',frame:'M3 5h18v14H3z M6 8h12v8H6z',line:'M4 12h16',arrow:'M4 12h14 M13 7l5 5-5 5',tag:'M3 12l5-6h13v12H8z M8 12h.01',pin:'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z',stamp:'M4 7h16v10H4z M7 10h10 M7 14h6',ribbon:'M3 15L15 3h6L3 21z',house:IP.house,lowerbar:'M3 15h18v5H3z M3 15v5',progress:'M3 10h18v4H3z M3 10h10v4H3z'};return `<svg class="i" viewBox="0 0 24 24"><path d="${m[k]}"/></svg>`}
$('#panelBody').addEventListener('click',async e=>{
  const t=e.target;const rm=t.closest('[data-rm]');
  if(rm){e.stopPropagation();const id=rm.dataset.rm;const used=P.clips.some(c=>c.mediaId===id);if(used&&!await confirmBox('Retirer ce média ?','Les clips qui l\'utilisent seront aussi supprimés de la timeline.','Retirer'))return;P.clips=P.clips.filter(c=>c.mediaId!==id);URL.revokeObjectURL(media[id].url);delete media[id];IDB.del(id);if(S.sel&&!clipById(S.sel))S.sel=null;commit();refreshAll();return}
  const tr0=t.closest('[data-trend]');if(tr0){runTrend(tr0.dataset.trend);return}
  const em=t.closest('[data-emoji]');if(em){addEmoji(em.dataset.emoji);return}
  const au=t.closest('[data-auto],[data-ai]');if(au){runTool(au.dataset.auto||au.dataset.ai,au);return}
  const el=t.closest('[data-act],[data-media],[data-scene],[data-color],[data-tpl],[data-font],[data-shape],[data-fx],[data-trans],[data-filter],[data-immo],[data-demomusic]');if(!el)return;const d=el.dataset;
  if(d.act==='import')$('#fileIn').click();
  else if(d.act==='srt')$('#srtIn').click();
  else if(d.act==='addtext')addText({},'Texte');
  else if(d.act==='auto')autoMontage();
  else if(d.act==='rec')recordVoice();
  else if(d.act==='transall')needSel(c=>{const tr=firstTrack('main');P.clips.filter(o=>o.trackId===tr.id&&o.start>0.01).forEach(o=>o.trans={...c.trans});commit();refreshAll();toast('Transition appliquée à toute la piste principale')});
  else if(d.act==='filterall')needSel(c=>{P.clips.filter(isMedia).forEach(o=>{o.filter=c.filter;o.filterAmt=c.filterAmt});commit();refreshAll();toast('Filtre appliqué à tous les clips')});
  else if(d.media){const m=media[d.media];if(m){addMediaToTimeline(m);toast('Ajouté à la timeline')}}
  else if(d.scene)addScene(d.scene);
  else if(d.color){const [a,z,n]=COLORS[+d.color];addColor(a,z,'Fond '+n)}
  else if(d.tpl){const tp=TEXT_TPL[+d.tpl];addText({...tp.p},tp.name)}
  else if(d.font){const c=selClip();if(c&&c.kind==='text'){c.font=d.font;ensureFont(c.font,c.weight);commit();refreshAll()}else addText({font:d.font,text:d.font},d.font)}
  else if(d.shape)addShape(d.shape);
  else if(d.fx)needSel(c=>{const i=c.fx.findIndex(f=>f.id===d.fx);if(i>=0)c.fx.splice(i,1);else{c.fx.push({id:d.fx,v:.7});toast(`${FXMAP[d.fx].name} ajouté`)}commit();refreshAll()});
  else if(d.trans)needSel(c=>{c.trans={type:d.trans,dur:c.trans.dur||.6};const lt=Math.max(0,c.start-.3);if(!S.playing)setTime(lt);commit();refreshAll()});
  else if(d.filter)needSel(c=>{if(!isMedia(c)){toast('Les filtres s\'appliquent aux photos et vidéos');return}c.filter=d.filter;commit();refreshAll()});
  else if(d.immo)needSel(c=>{if(!isMedia(c)){toast('Sélectionnez une photo ou une vidéo du bien');return}IMMO[+d.immo].apply(c);commit();refreshAll();toast(IMMO[+d.immo].name+' appliqué')});
  else if(d.demomusic){const m=ensureDemoMusic(d.demomusic);addMediaToTimeline(m);toast(`« ${m.name} » ajoutée`)}
});
$('#panelBody').addEventListener('input',e=>{if(e.target.id==='capStyle'){S.capStyle=e.target.value;return}const c=selClip();if(!c)return;
  if(e.target.id==='trDur'){c.trans.dur=+e.target.value;e.target.nextElementSibling.textContent=c.trans.dur.toFixed(2)+'s';req()}
  if(e.target.id==='fAmt'){c.filterAmt=+e.target.value;e.target.nextElementSibling.textContent=Math.round(c.filterAmt*100)+'%';req()}});
$('#panelBody').addEventListener('change',e=>{if(e.target.id==='trDur'||e.target.id==='fAmt'){commit();renderInspector()}});
$('#panelBody').addEventListener('dragstart',e=>{const el=e.target.closest('[data-media],[data-scene]');if(!el)return;e.dataTransfer.setData('text/x-crep',JSON.stringify(el.dataset.media?{media:el.dataset.media}:{scene:el.dataset.scene}));e.dataTransfer.effectAllowed='copy'});

/* thumbnails rendered through the real engine */
const thumbCache={};
const SMALL={};for(const k in SCN){const c=document.createElement('canvas');c.width=320;c.height=180;c.getContext('2d').drawImage(SCN[k],0,0,320,180);SMALL[k]=c}
function filterThumb(k){if(thumbCache['f'+k])return thumbCache['f'+k];const p=baseParams();addPreset(p,k,1);thumbCache['f'+k]=engineThumb(SMALL.villa,p);return thumbCache['f'+k]}
function immoThumb(m){if(thumbCache['i'+m.name])return thumbCache['i'+m.name];const p=baseParams();Object.assign(p,m.p||{});if(m.p&&m.p.preset)addPreset(p,m.p.preset,1);thumbCache['i'+m.name]=engineThumb(SMALL[m.scene||'villa'],p,m.post);return thumbCache['i'+m.name]}
function engineThumb(src,p,post){const c=document.createElement('canvas');c.width=192;c.height=108;const g=c.getContext('2d');let img=src;if(GLX&&needsGL(p)){try{img=GLX.run(src,320,180,p,1)}catch(e){}}g.drawImage(img,0,0,192,108);if(post)post(g,192,108);return c.toDataURL('image/jpeg',.85)}
const IMMO=[
 {name:'Jour → Nuit',d:'Ciel crépusculaire, façade bleutée, fenêtres et piscine éclairées.',p:{tw:1},apply:c=>{c.immo.tw=1;c.immo.twAnim='none'}},
 {name:'Coucher de soleil animé',d:'La scène passe progressivement du jour à la nuit pendant le clip.',p:{tw:.6},apply:c=>{c.immo.tw=1;c.immo.twAnim='in';if(c.dur<4.5)c.dur=Math.min(5,mediaMax(c))}},
 {name:'Ciel bleu parfait',d:'Remplace un ciel terne par un ciel bleu avec nuages doux.',scene:'facade',p:{sky:1},apply:c=>{c.immo.sky=1}},
 {name:'Golden hour',d:'Lumière chaude de fin de journée, idéale pour les extérieurs.',p:{gold:1,temp:.2},apply:c=>{c.immo.gold=1;c.filter='golden';c.filterAmt=.6}},
 {name:'HDR immobilier',d:'Détails dans les ombres et hautes lumières, intérieurs lumineux.',scene:'salon',p:{hdr:.7,bright:.06,sat:.1},apply:c=>{c.immo.hdr=.7;c.filter='clean';c.filterAmt=.8}},
 {name:'Fenêtres allumées',d:'Ajoute une lueur chaleureuse derrière les vitres.',scene:'facade',p:{glow:1,bright:-.08},apply:c=>{c.immo.glow=1}},
 {name:'Avant / Après',d:'Volet animé qui compare la photo d\'origine et la version retouchée.',p:{tw:1,split:.5},apply:c=>{c.immo.compare='slide';if(!c.immo.tw&&!c.immo.sky&&!c.immo.hdr&&c.filter==='none'){c.immo.tw=1}}},
 {name:'Hiver enneigé',d:'Ambiance froide et flocons pour les chalets et biens de montagne.',p:{winter:1},post:(g,w,h)=>{g.fillStyle='#fff';for(let i=0;i<60;i++){g.globalAlpha=.5+rnd(i)*.5;g.beginPath();g.arc(rnd(i+1)*w,rnd(i+2)*h,.8+rnd(i+3)*1.6,0,7);g.fill()}g.globalAlpha=1},apply:c=>{c.immo.winter=1;if(!c.fx.some(f=>f.id==='snow'))c.fx.push({id:'snow',v:.7})}},
 {name:'Drone cinématique',d:'Approche aérienne lente avec bandes cinéma et lumière chaude.',p:{temp:.15,contrast:.12,vig:.25},apply:c=>{c.fx=c.fx.filter(f=>!['kb-in','kb-out','pan-l','pan-r','tilt-up','orbit'].includes(f.id));if(!c.fx.some(f=>f.id==='drone'))c.fx.push({id:'drone',v:.8});if(!c.fx.some(f=>f.id==='letterbox'))c.fx.push({id:'letterbox',v:.7});c.filter='cinema';c.filterAmt=.6}},
 {name:'Photo 3D (parallaxe)',d:'Effet 3D : le premier plan bouge plus que le fond. Encore plus réaliste avec la profondeur IA (onglet Modèles IA).',p:{temp:.05},apply:c=>{c.immo.parallax=.8;c.immo.parDir='push';c.fx=c.fx.filter(f=>!['kb-in','kb-out','pan-l','pan-r','tilt-up','drone'].includes(f.id))}},
 {name:'Heure bleue',d:'Juste après le coucher du soleil : ciel profond, lumières intérieures.',p:{tw:.65,glow:.6},apply:c=>{c.immo.tw=.65;c.immo.glow=.6}},
];
