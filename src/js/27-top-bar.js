/* ---------- top bar ---------- */
$('#logoMark').innerHTML=LOGO('tl');$('#undoBtn').innerHTML=ic('undo');$('#redoBtn').innerHTML=ic('redo');$('#menuBtn').innerHTML=ic('dots');
$('#exportBtn').innerHTML=ic('download')+'<span class="hide-m">Exporter</span>';$('#autoBtn').innerHTML=ic('wand')+'Assistant vidéo';$('#guideBtn').innerHTML=ic('grid');$('#scopeBtn').innerHTML=ic('scope');
$('#toStart').innerHTML=ic('skipB');$('#toEnd').innerHTML=ic('skipF');$('#stepB').innerHTML=ic('stepB');$('#stepF').innerHTML=ic('stepF');$('#loopBtn').innerHTML=ic('loop');$('#fsBtn').innerHTML=ic('max');
$('#undoBtn').onclick=undo;$('#redoBtn').onclick=redo;$('#exportBtn').onclick=()=>openExport();$('#autoBtn').onclick=()=>openAssistant();
$('#playBtn').onclick=togglePlay;$('#toStart').onclick=()=>{pause();setTime(0)};$('#toEnd').onclick=()=>{pause();setTime(projDur())};
$('#stepB').onclick=()=>{pause();setTime(S.t-1/30)};$('#stepF').onclick=()=>{pause();setTime(S.t+1/30)};
$('#loopBtn').onclick=e=>{S.loop=!S.loop;e.currentTarget.classList.toggle('on',S.loop)};
$('#fsBtn').onclick=()=>{try{const p=viewport.requestFullscreen?viewport.requestFullscreen():viewport.webkitRequestFullscreen&&viewport.webkitRequestFullscreen();if(p&&p.catch)p.catch(()=>toast('Plein écran indisponible ici'))}catch(e){toast('Plein écran indisponible ici')}};
document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement===viewport){viewport.style.width='100%';viewport.style.height='100%'}else fitViewport()});
$('#aspectSel').onchange=e=>setAspect(e.target.value);
$('#projName').oninput=e=>{P.name=e.target.value};$('#projName').onchange=()=>commit();
$('#menuBtn').onclick=e=>{
  const old=$('.menu');if(old){old.remove();return}
  const r=e.currentTarget.getBoundingClientRect();const m=document.createElement('div');m.className='menu';
  m.innerHTML=`<button data-m="wizard">${ic('wand')}Assistant vidéo</button><button data-m="auto">${ic('film')}Montage express</button><button data-m="demo">${ic('house')}Charger le projet exemple</button><button data-m="new">${ic('plus')}Nouveau projet vide</button><hr><button data-m="open">${ic('upload')}Ouvrir un projet .json</button><button data-m="save">${ic('download')}Enregistrer le projet .json</button><hr><button data-m="import">${ic('film')}Importer des médias</button><button data-m="srt">${ic('subs')}Importer des sous-titres .srt</button>`;
  document.body.appendChild(m);m.style.top=(r.bottom+6)+'px';m.style.right=Math.max(8,innerWidth-r.right)+'px';
  m.onclick=async ev=>{const b=ev.target.closest('[data-m]');if(!b)return;m.remove();const a=b.dataset.m;
    if(a==='auto')autoMontage();else if(a==='wizard')openAssistant();else if(a==='import')$('#fileIn').click();else if(a==='srt')$('#srtIn').click();else if(a==='open')$('#projIn').click();
    else if(a==='save')download(new Blob([projectJSON()],{type:'application/json'}),slug()+'.topclap.json');
    else if(a==='demo'){if(await confirmBox('Charger le projet exemple ?','La timeline actuelle sera remplacée. Vous pouvez annuler avec Ctrl+Z.','Charger')){buildDemo();commit();refreshAll()}}
    else if(a==='new'){if(await confirmBox('Nouveau projet ?','La timeline sera vidée. Vos médias importés restent disponibles.','Vider la timeline')){P.tracks=defaultTracks();P.clips=[];P.name='Nouveau projet';$('#projName').value=P.name;S.sel=null;S.t=0;commit();refreshAll()}}};
  setTimeout(()=>document.addEventListener('pointerdown',function h(ev){if(!m.contains(ev.target)&&ev.target!==$('#menuBtn')&&!$('#menuBtn').contains(ev.target)){m.remove()}document.removeEventListener('pointerdown',h)},{once:false}),0);
};
$('#fileIn').onchange=e=>{importFiles([...e.target.files]);e.target.value=''};
$('#srtIn').onchange=async e=>{const f=e.target.files[0];if(f)importSRT(await f.text());e.target.value=''};
$('#lutIn').onchange=async e=>{const f=e.target.files[0];if(f)await importLUTFile(f);e.target.value='';renderInspector()};
$('#guideBtn').onclick=e=>{const seq=['none','safe','thirds','both'];S.guides=seq[(seq.indexOf(S.guides)+1)%seq.length];e.currentTarget.classList.toggle('on',S.guides!=='none');renderGuides();toast({none:'Repères masqués',safe:'Zones sûres '+(P.aspect==='9:16'?'Reels / TikTok / Shorts':'titre et action'),thirds:'Règle des tiers',both:'Zones sûres + tiers'}[S.guides])};
$('#scopeBtn').onclick=e=>{S.scopes=!S.scopes;scopeBox.hidden=!S.scopes;e.currentTarget.classList.toggle('on',S.scopes);if(S.scopes)drawScopes()};
document.addEventListener('click',e=>{if(e.target.closest('#scopeX')){S.scopes=false;scopeBox.hidden=true;$('#scopeBtn').classList.remove('on')}});
$('#projIn').onchange=async e=>{const f=e.target.files[0];if(f)openProjectText(await f.text());e.target.value=''};
let dragDepth=0;
window.addEventListener('dragenter',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){dragDepth++;const d=$('#dropZone');if(d)d.classList.add('hot')}});
window.addEventListener('dragleave',()=>{dragDepth=Math.max(0,dragDepth-1);if(!dragDepth){const d=$('#dropZone');if(d)d.classList.remove('hot')}});
window.addEventListener('dragover',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault()});
window.addEventListener('drop',e=>{if(e.dataTransfer&&e.dataTransfer.files.length){e.preventDefault();dragDepth=0;const d=$('#dropZone');if(d)d.classList.remove('hot');importFiles([...e.dataTransfer.files])}});
document.addEventListener('keydown',e=>{
  const tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select'||e.target.isContentEditable)return;
  const mod=e.ctrlKey||e.metaKey;
  if(e.code==='Space'){e.preventDefault();togglePlay()}
  else if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}
  else if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo()}
  else if(mod&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateSel()}
  else if(mod&&e.key.toLowerCase()==='b'){e.preventDefault();splitAt()}
  else if(!mod&&e.key.toLowerCase()==='s'){splitAt()}
  else if(!mod&&e.key.toLowerCase()==='m'){addMarker(S.t,'Repère');commit();renderTimeline();toast('Marqueur ajouté')}
  else if(!mod&&e.key.toLowerCase()==='k'){pause()}
  else if(!mod&&e.key.toLowerCase()==='l'){if(S.playing&&S.rate>=1)S.rate=Math.min(4,(S.rate||1)*2);else{S.rate=1;play()}}
  else if(!mod&&e.key.toLowerCase()==='j'){pause();setTime(S.t-1)}
  else if(e.key==='Delete'||e.key==='Backspace'){if(S.sel){e.preventDefault();deleteSel()}}
  else if(e.key==='ArrowLeft'){e.preventDefault();pause();setTime(S.t-(e.shiftKey?1:1/30))}
  else if(e.key==='ArrowRight'){e.preventDefault();pause();setTime(S.t+(e.shiftKey?1:1/30))}
  else if(e.key==='Home'){pause();setTime(0)}else if(e.key==='End'){pause();setTime(projDur())}
  else if(e.key==='Escape'){select(null);closeSheet('panel');closeSheet('insp')}
});
