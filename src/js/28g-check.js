/* ---------- "Vérifier ma vidéo": automatic pre-publication audit with one-click fixes ---------- */
function videoChecks(){
  const out=[],add=(lvl,title,detail,fix,fixLabel='Corriger')=>out.push({lvl,title,detail,fix,fixLabel});
  const d=projDur(),vert=P.aspect==='9:16',main=firstTrack('main');
  const mains=P.clips.filter(c=>main&&c.trackId===main.id).sort((a,b)=>a.start-b.start);
  const texts=P.clips.filter(c=>c.kind==='text'||c.kind==='caption'||(c.kind==='shape'&&c.label));
  const voices=P.clips.filter(isVoice),musics=P.clips.filter(c=>c.kind==='audio'&&c.role!=='voice');
  // 1. duration
  if(vert){if(d>90)add('warn','Vidéo verticale longue',`${Math.round(d)} s. Pour les Reels, Shorts et TikTok, 15 à 45 s retiennent mieux l'attention.`,null);else add('ok','Durée adaptée au format vertical',`${Math.round(d)} s`)}
  else if(P.aspect==='16:9'&&d<30)add('info','Vidéo YouTube courte','Moins de 30 s en 16:9 : pensez à une version 9:16 pour les Shorts.',()=>openExport(['16:9','9:16']),'Exporter les 2 formats');
  // 2. hook
  const hook=texts.some(c=>c.start<1.5);if(!hook)add('warn','Pas d\'accroche dans les 2 premières secondes','Un texte fort dès le début (lieu, prix, question) retient le spectateur.',()=>{const tr=firstTrack('text')||addTrack('text');const c=newClip('text',{text:`${P.info.type||'Bien'} à ${P.info.city||''}`.trim(),start:.1,dur:2.5,size:96,animIn:'pop',inDur:.35,shadowBlur:24,shadowColor:'rgba(0,0,0,.5)',y:vert?.3:.5,trackId:tr.id,name:'Accroche'});P.clips.push(c)});else add('ok','Accroche présente dès le début');
  // 3. captions
  const caps=P.clips.some(c=>c.kind==='caption');if(voices.length&&!caps)add('warn','Voix sans sous-titres','Beaucoup de vidéos sont regardées sans le son : sous-titrez la voix.',async()=>{for(const v of voices)await aiTranscribe(v,'french')},'Sous-titrer');
  else if(!caps&&vert)add('info','Pas de texte animé','Sur mobile, un texte à l\'écran aide à comprendre sans le son.',null);
  // 4. safe zones
  if(vert){const bad=[];renderFrame(S.t);for(const c of texts){const W=cv.width,H=cv.height;const y=kv(c,'y',0)*H;if(y>H*.8||y<H*.1)bad.push(c)}
    if(bad.length)add('warn',`${bad.length} texte(s) sous l'interface TikTok / Reels`,'Le bas (légende, boutons) et le haut de l\'écran sont masqués par l\'application.',()=>bad.forEach(c=>{const y=kv(c,'y',0);c.y=y>.8?.7:.2;if(c.kf)delete c.kf.y}),'Remonter les textes');else add('ok','Textes dans la zone visible')}
  // 5. long static shots
  const lim=vert?5:8,longS=mains.filter(c=>c.dur>lim&&!c.fx.some(f=>['kb-in','kb-out','pan-l','pan-r','tilt-up','drone','orbit','pulse'].includes(f.id))&&!(c.immo&&c.immo.parallax>0)&&c.kind!=='video');
  if(longS.length)add('warn',`${longS.length} plan(s) fixe(s) de plus de ${lim} s`,'Ajoutez du mouvement ou coupez plus court pour garder le rythme.',()=>longS.forEach(c=>c.fx.push({id:'kb-in',v:.7})),'Ajouter un mouvement');
  // 6. gaps
  let gaps=0;for(let i=1;i<mains.length;i++)if(mains[i].start-(mains[i-1].start+mains[i-1].dur)>.05)gaps++;if(mains.length&&mains[0].start>.05)gaps++;
  if(gaps)add('err',`${gaps} trou(s) noir(s) sur la piste principale`,'Écran noir entre deux plans.',()=>{const m=S.magnet;S.magnet=true;packTrack(main);S.magnet=m},'Combler');
  // 7. call to action
  const endTxt=texts.some(c=>c.start+c.dur>d-3.5&&/\d{2}[\s.]?\d{2}|contact|rendez|appel|lien|bio|visite/i.test(c.text||c.label||''));
  if(!endTxt)add('warn','Pas d\'appel à l\'action à la fin','Terminez par le contact, un lien ou « visite sur rendez-vous ».',()=>{const tr=firstTrack('text')||addTrack('text');P.clips.push(newClip('text',{text:`${P.brand.agency||'Votre agence'}\n${P.brand.phone||''}`.trim(),start:Math.max(0,d-3),dur:3,size:72,weight:700,sub:.55,bg:'#0F172A',bgA:.75,pad:36,radius:18,animIn:'zoom',trackId:tr.id,name:'Contact'}))},'Ajouter le contact');
  else add('ok','Appel à l\'action présent');
  // 8. audio
  if(!musics.length&&!voices.length&&!P.clips.some(c=>c.kind==='video'))add('warn','Vidéo sans son','Une musique augmente fortement la rétention.',()=>{const m=ensureDemoMusic(vert?'pulse':'ambient');const tr=firstTrack('audio')||addTrack('audio');P.clips.push(newClip('audio',{mediaId:m.id,name:m.name,trackId:tr.id,start:0,dur:Math.min(d,m.dur),fadeOutA:2}))},'Ajouter une musique');
  if(voices.length&&musics.some(c=>!c.duck))add('warn','La musique couvre la voix','Activez le ducking pour baisser la musique pendant la voix.',()=>musics.forEach(c=>c.duck=.7),'Activer le ducking');
  const imported=musics.filter(c=>{const m=media[c.mediaId];return m&&!m.demo&&!/IA/.test(m.name)});
  if(imported.length)add('info','Droits de la musique importée','YouTube, Instagram et TikTok détectent les musiques protégées (coupure du son, démonétisation). Utilisez une musique dont vous avez les droits, les musiques intégrées ou la musique IA.',null);
  // 9. low-res media
  const short=Math.min(...baseWH());const low=P.clips.filter(c=>c.kind==='image'&&media[c.mediaId]&&Math.min(media[c.mediaId].w,media[c.mediaId].h)<short*.6);
  if(low.length)add('warn',`${low.length} photo(s) en basse résolution`,'Elles paraîtront floues en 1080p.',()=>{S.sel=low[0].id;setTab('ai',true);toast('Utilisez « Agrandir la photo » sur chaque photo signalée')},'Ouvrir l\'agrandissement');
  // 10. readability
  const small=texts.filter(c=>c.kind==='text'&&c.size<36);if(small.length)add('warn',`${small.length} texte(s) trop petit(s) pour un mobile`,'Taille minimale conseillée : 40.',()=>small.forEach(c=>c.size=44),'Agrandir');
  const fast=texts.filter(c=>c.kind==='text'&&c.dur<Math.max(1.2,(c.text||'').length/16));if(fast.length)add('warn',`${fast.length} texte(s) affiché(s) trop peu de temps`,'Comptez environ 1 s pour 15 caractères.',()=>fast.forEach(c=>c.dur=Math.max(1.5,(c.text||'').length/14)),'Allonger');
  // 11. real estate obligations (France)
  const re=P.info&&(P.info.price||P.info.type);
  if(re){if(!P.info.dpe)add('err','Classe énergie (DPE) manquante','Les annonces de vente ou de location doivent indiquer la classe énergie du logement. Renseignez-la et affichez-la.',()=>{S.sel=null;renderInspector();openInspector();toast('Renseignez le DPE dans « Le bien »')},'Renseigner');
    else if(!texts.some(c=>/DPE|classe/i.test(c.text||'')))add('warn','DPE non affiché dans la vidéo',`Classe ${P.info.dpe} renseignée mais absente de l'image.`,()=>{const tr=firstTrack('overlay')||addTrack('overlay');P.clips.push(newClip('text',{text:`DPE ${P.info.dpe}`,start:Math.max(0,d*.3),dur:Math.min(6,d*.4),size:40,weight:700,bg:'#0F172A',bgA:.7,pad:16,radius:10,x:.86,y:vert?.62:.12,animIn:'fade',trackId:tr.id,name:'DPE'}))},'Afficher le DPE');
    if(texts.some(c=>/€/.test(c.text||''))&&!texts.some(c=>/honoraires|FAI|charge/i.test(c.text||'')))add('info','Prix affiché sans mention des honoraires','Indiquez si les honoraires sont inclus (« honoraires charge vendeur » ou montant TTC à la charge de l\'acquéreur).',null);
    if(!P.brand.phone||/^04 00/.test(P.brand.phone))add('info','Coordonnées de l\'agence à compléter','Le téléphone affiché est un exemple.',()=>{S.sel=null;renderInspector();openInspector()},'Compléter')}
  if(re&&/^[FG]$/i.test(P.info.dpe||'')&&!texts.some(c=>/consommation énergétique excessive/i.test(c.text||'')))add('err','Mention « Logement à consommation énergétique excessive » absente',`DPE ${P.info.dpe.toUpperCase()} : cette mention est obligatoire dans l'annonce, en caractères au moins aussi grands que le texte.`,()=>{const tr=firstTrack('overlay')||addTrack('overlay');P.clips.push(newClip('text',{text:'Logement à consommation énergétique excessive',start:Math.max(0,d*.3),dur:Math.min(6,d*.4),size:40,weight:700,bg:'#0F172A',bgA:.75,pad:16,radius:10,y:vert?.66:.9,animIn:'fade',trackId:tr.id,name:'Mention DPE'}))},'Ajouter la mention');
  // 11b. AI-generated or AI-edited media must be disclosed
  const ai=P.clips.filter(c=>c.aiGen||c.origMedia);
  if(ai.length&&!texts.some(c=>/IA|intelligence artificielle|virtuel|retouch|non contractuel/i.test(c.text||'')))add('warn',`${ai.length} média(s) généré(s) ou retouché(s) par IA`,'Signalez-le : mention à l\'écran (« Mise en scène virtuelle », « Image retouchée par IA ») et case « contenu IA » sur YouTube, TikTok et Instagram. Un rendu qui change l\'état réel du bien peut être une pratique commerciale trompeuse.',()=>{const tr=firstTrack('overlay')||addTrack('overlay');ai.forEach(c=>P.clips.push(newClip('text',{text:'Image retouchée par IA · non contractuelle',start:c.start,dur:c.dur,size:28,weight:600,bg:'#0F172A',bgA:.6,pad:10,radius:8,x:.5,y:vert?.12:.94,animIn:'none',animOut:'none',trackId:tr.id,name:'Mention IA'})))},'Ajouter la mention');
  // 12. delivery
  add('info','Réglages de mise en ligne','Export 1080p 30 i/s. Le serveur IA peut finaliser en MP4 à −14 LUFS (volume recommandé par YouTube, Instagram et TikTok).',null);
  return out;
}
function openCheck(){
  pause();const list=videoChecks();const score=Math.max(0,100-list.filter(x=>x.lvl==='err').length*20-list.filter(x=>x.lvl==='warn').length*8);
  const ico={ok:'check',warn:'flag',err:'x',info:'sparkles'};
  const m=modal(`<h3>Vérifier ma vidéo</h3><p class="note">Contrôle automatique avant publication (${P.aspect}, ${fmtT(projDur())}).</p>
    <div class="ck-score"><b>${score}</b><span>/100</span><div class="prog"><i style="width:${score}%"></i></div></div>
    <div class="ck-list">${list.map((x,i)=>`<div class="ck ${x.lvl}"><span class="ck-i">${ic(ico[x.lvl])}</span><div><b>${esc(x.title)}</b>${x.detail?`<span>${esc(x.detail)}</span>`:''}</div>${x.fix?`<button class="btn" data-fix="${i}">${esc(x.fixLabel)}</button>`:''}</div>`).join('')}</div>
    <div class="mrow"><button class="btn" data-x="close">Fermer</button>${list.some(x=>x.fix&&x.lvl!=='info'&&x.lvl!=='ok')?'<button class="btn pri" data-x="all">Tout corriger</button>':''}</div>`);
  m.addEventListener('click',async e=>{const b=e.target.closest('[data-fix],[data-x]');if(!b)return;
    if(b.dataset.x==='close'){m.parentElement.remove();return}
    const run=async x=>{try{await x.fix()}catch(err){console.warn(err)}};
    if(b.dataset.x==='all'){for(const x of list)if(x.fix&&(x.lvl==='warn'||x.lvl==='err')&&!/Sous-titrer|Renseigner|Compléter|agrandissement/i.test(x.fixLabel))await run(x)}
    else await run(list[+b.dataset.fix]);
    commit();refreshAll();m.parentElement.remove();openCheck();});
}
