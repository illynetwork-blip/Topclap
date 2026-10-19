/* ---------- automation: video assistant, scripts, social texts, thumbnails ---------- */
const GOALS=[
  ['annonce','Annonce immobilière','Photos et vidéos du bien → annonce rythmée avec prix, atouts et contact'],
  ['reel','Reel / Short / TikTok','Vertical, accroche en 1 s, coupes sur le rythme, sous-titres animés'],
  ['visite','Visite guidée','Plans longs et doux, effet drone, voix off descriptive'],
  ['youtube','Vidéo YouTube','16:9, intro, chapitres, écran de fin'],
  ['avantapres','Avant / Après','Chaque photo comparée à sa version retouchée (nuit, HDR, ciel)'],
  ['facecam','Face caméra','Votre vidéo parlée : silences coupés, sous-titres, musique en fond'],
];
const STYLES={
  luxe:{name:'Luxe',title:'Playfair Display',body:'Montserrat',filter:'luxe',fa:.55,lut:'lut-luxe-gold',la:.45,trans:['fade','doors','dive','burn','fade'],motion:['kb-in','drone','pan-l','kb-out','orbit'],music:'ambient',cap:'luxe',accent:'#F2C38B'},
  moderne:{name:'Moderne',title:'Outfit',body:'Lexend',filter:'clean',fa:.8,lut:'lut-clean-white',la:.35,trans:['push-l','wipe-l','zoom-in','slide-u','blinds'],motion:['kb-in','pan-r','tilt-up','drone','pan-l'],music:'pulse',cap:'boxed',accent:'#F2A65E'},
  chaleureux:{name:'Chaleureux',title:'Lora',body:'Nunito',filter:'golden',fa:.5,lut:'lut-film-warm',la:.35,trans:['fade','circle','curtain','fade'],motion:['kb-in','pan-l','kb-out','pan-r'],music:'ambient',cap:'classic',accent:'#E9B872'},
  dynamique:{name:'Dynamique',title:'Bebas Neue',body:'Poppins',filter:'hdr',fa:.5,lut:'lut-teal-orange',la:.35,trans:['whip','zoom-in','push-l','glitch','flash'],motion:['pulse','kb-in','pan-l','drone','shake'],music:'pulse',cap:'karaoke',accent:'#FFD23F'},
};
const FEATS=['Piscine','Jardin','Terrasse','Vue mer','Vue dégagée','Garage','Parking','Balcon','Ascenseur','Cave','Climatisation','Cheminée','Calme','Proche commerces','Proche écoles','Plain-pied','Rénové','Neuf','Domotique','Panneaux solaires'];
const A_OPTS={goal:'annonce',formats:['16:9','9:16'],dur:30,style:'luxe',voice:'tts',voiceId:'fr_FR-siwis-medium',captions:true,twilight:true,beat:true,logo:true,useAI:true};

function scriptFor(o){
  const I=P.info,B=P.brand,feats=(I.feats||[]).slice(0,4);const lf=feats.map(f=>f.toLowerCase());
  const nums=[I.surface&&`${I.surface} m² habitables`,I.bedrooms&&`${I.bedrooms} chambres`,I.baths&&`${I.baths} salles de bain`].filter(Boolean).join(', ');
  const hook=o.goal==='reel'?`Cette ${I.type.toLowerCase()} à ${I.city} va vous faire rêver.`:o.goal==='youtube'?`Bienvenue dans cette ${I.type.toLowerCase()} d'exception à ${I.city}. Suivez la visite.`:`Découvrez cette ${I.type.toLowerCase()} d'exception à ${I.city}.`;
  const body=[nums?nums.charAt(0).toUpperCase()+nums.slice(1)+'.':'',lf.length?`Elle offre ${lf.slice(0,-1).join(', ')}${lf.length>1?' et ':''}${lf.at(-1)}.`:'',I.area?`Au calme, ${I.area}.`:''].filter(Boolean).join(' ');
  const cta=`Prix : ${I.price}. Contactez ${B.agency}${B.phone?' au '+B.phone:''}.`;
  return o.goal==='reel'?`${hook} ${nums?nums+'.':''} ${lf.length?lf.slice(0,3).join(', ')+'.':''} ${I.price}. Lien en bio !`.replace(/\s+/g,' ').trim():`${hook} ${body} ${cta}`.replace(/\s+/g,' ').trim();
}
async function visualPool(){
  const items=Object.values(media).filter(m=>m.type==='video'||m.type==='image').map(m=>({m}));
  const pool=items.length?items:['villa','salon','facade'].map(s=>({scene:s}));
  for(const it of pool){let src=null;if(it.scene)src=SCN[it.scene];else if(it.m.type==='image')src=it.m.el;else if(it.m.thumb){src=new Image();src.src=it.m.thumb;try{await src.decode()}catch(e){}}it.a=src?analyzeImage(src):{sky:0,bright:.5,exterior:false}}
  return pool;
}
async function generateVideo(o){
  pause();const st=STYLES[o.style]||STYLES.luxe,I=P.info,B=P.brand;
  if(o.formats&&o.formats[0]&&o.formats[0]!==P.aspect){P.aspect=o.formats[0];$('#aspectSel').value=P.aspect;setRes(S.pq)}
  if(o.goal==='facecam')return generateFacecam(o,st);
  const pool=await visualPool();
  const ext=pool.filter(p=>p.a.exterior).sort((a,b)=>(b.a.sky+b.a.bright)-(a.a.sky+a.a.bright)),int=pool.filter(p=>!p.a.exterior);
  let order=[...(ext[0]?[ext[0]]:[]),...int,...ext.slice(1)];if(!order.length)order=pool.slice();
  const avg={annonce:3,reel:1.7,visite:4.6,youtube:5,avantapres:4.5}[o.goal]||3;const endDur=o.goal==='reel'?2.5:3.5;
  const n=clamp(Math.round((o.dur-endDur)/avg),2,30);
  if(order.length>n)order=[order[0],...order.slice(1,n-1),order[order.length-1]].slice(0,n);
  const finalExt=ext[0]&&o.twilight&&o.goal!=='avantapres';if(finalExt&&order[order.length-1]!==ext[0]&&order.length<n+1)order.push(ext[0]);
  if(order.length<n&&o.goal!=='visite'&&o.goal!=='avantapres'){const last=finalExt?order.pop():null;const base=order.slice();while(order.length<n-(last?1:0))order.push(base[order.length%base.length]);if(last)order.push(last)}
  const per=clamp((o.dur-endDur)/order.length,1.1,9);
  P.tracks=defaultTracks();P.clips=[];P.markers=[];const [Tt,To,Tm,Ta]=P.tracks;let t=0;
  order.forEach((it,i)=>{const kind=it.scene?'scene':it.m.type;let dur=per;if(kind==='video')dur=Math.min(per*1.3,it.m.dur||per);
    const c=newClip(kind,{mediaId:it.m&&it.m.id,scene:it.scene,name:it.scene?SCENES[it.scene]:it.m.name,dur:+dur.toFixed(2),filter:st.filter,filterAmt:st.fa,fit:P.aspect==='16:9'?'cover':(it.a.exterior?'cover':'cover'),
      fx:[{id:st.motion[i%st.motion.length],v:o.goal==='visite'?.55:.75}],x:order.indexOf(it)!==i?(i%2?.45:.55):.5,grade:{lut:st.lut,lutAmt:st.la}});
    if(P.aspect==='9:16'&&kind!=='video'){c.fx=[{id:i%2?'pan-r':'pan-l',v:.9}]}
    if(i>0)c.trans={type:st.trans[(i-1)%st.trans.length],dur:o.goal==='reel'?.35:.7};
    if(o.goal==='avantapres'){c.immo.compare='slide';if(it.a.exterior){c.immo.tw=1}else{c.immo.hdr=.6;c.adj.bright=.08}c.dur=Math.max(c.dur,4)}
    if(i===order.length-1&&finalExt&&kind!=='video'){c.immo.tw=1;c.immo.twAnim='in';c.dur=Math.max(c.dur,4.5);c.trans={type:'fade',dur:.9}}
    else if(it.a.exterior&&o.goal!=='avantapres'&&kind!=='video')c.immo.sky=.5;
    c.trackId=Tm.id;c.start=t;t+=c.dur;P.clips.push(c);addMarker(c.start,c.name,'#5677B2')});
  const endC=newClip('color',{c1:'#11131A',c2:'#2B3352',name:'Écran de fin',dur:endDur,trans:{type:'fade',dur:.6}});endC.trackId=Tm.id;endC.start=t;P.clips.push(endC);t+=endDur;const total=t;
  const T=(text,start,dur,p)=>{const c=newClip('text',{...p,text,start,dur,trackId:Tt.id});c.name=text.split('\n')[0].slice(0,28);P.clips.push(c);return c};
  const hookTxt=o.goal==='reel'?`${I.type.toUpperCase()} · ${I.city.toUpperCase()}`:`${I.type} ${I.feats&&I.feats[0]?'avec '+I.feats[0].toLowerCase():''}\n${I.city}`;
  T(hookTxt,.2,Math.min(3,per*1.4),{font:st.title,size:o.goal==='reel'?120:104,weight:700,sub:.42,animIn:o.goal==='reel'?'pop':'letters',inDur:o.goal==='reel'?.35:1.2,shadowBlur:28,shadowColor:'rgba(0,0,0,.5)',y:P.aspect==='9:16'?.32:.5});
  const nv=newClip('text',{...TEXT_TPL.find(x=>x.name==='Nouveauté').p,text:'À VENDRE',bg:st.accent,start:.3,dur:Math.min(3.5,total*.3),trackId:To.id,name:'À vendre'});P.clips.push(nv);
  if(total>8)T(`${I.price}\n${I.type} ${I.rooms?I.rooms+' pièces · ':''}${I.surface?I.surface+' m²':''}`,total*.28,Math.min(3.4,total*.18),{font:st.body,size:70,weight:700,sub:.42,color:'#1C1B19',bg:'#F4EFE6',bgA:1,pad:34,radius:16,animIn:'count',inDur:1.2,x:P.aspect==='16:9'?.27:.5,y:P.aspect==='9:16'?.62:.78});
  if(total>12)T([I.bedrooms&&I.bedrooms+' ch',I.baths&&I.baths+' sdb',I.surface&&I.surface+' m²',...(I.feats||[]).slice(0,2).map(f=>f.toLowerCase())].filter(Boolean).join(' · '),total*.5,Math.min(3.6,total*.2),{font:st.body,size:46,weight:400,bg:'#000000',bgA:.55,pad:22,radius:40,animIn:'slide-up',y:P.aspect==='9:16'?.62:.86});
  if(total>20&&I.land)T(`${I.land} m²\nde terrain`,total*.7,3,{font:'Bebas Neue',size:150,weight:400,sub:.3,animIn:'count',inDur:1,shadowBlur:24,shadowColor:'rgba(0,0,0,.5)'});
  T(`${B.agency}\n${B.phone||''}${B.web?'\n'+B.web:''}`.trim(),total-endDur+.2,endDur-.2,{font:st.body,size:76,weight:700,sub:.55,bg:'#11131A',bgA:0,animIn:'zoom',inDur:.6,animOut:'none'});
  T('Prenez rendez-vous',total-endDur+.5,endDur-.5,{font:st.title,size:48,weight:700,color:st.accent,y:.3,animIn:'fade',animOut:'none'});
  const logo=B.logo&&media[B.logo];if(logo&&o.logo){const lc=newClip('image',{mediaId:logo.id,name:'Logo',start:0,dur:total,fit:'contain',scale:.14,x:.9,y:.1,opacity:.9});lc.trackId=To.id;lc.autofit=false;P.clips.push(lc);
    const tr2={id:uid(),kind:'overlay',name:'Logo'};P.tracks.splice(1,0,tr2);lc.trackId=tr2.id}
  const music=Object.values(media).find(m=>m.type==='audio'&&!m.demo&&m.role!=='voice')||ensureDemoMusic(st.music);
  const mc=newClip('audio',{mediaId:music.id,name:music.name,trackId:Ta.id,start:0,dur:Math.min(total,music.dur||total),fadeIn:.3,fadeOutA:2,volume:.9});P.clips.push(mc);
  S.sel=null;S.t=0;commit();refreshAll();
  if(o.beat&&(o.goal==='reel'||o.style==='dynamique'))await cutToBeat(o.goal==='reel'?1.1:1.6,o.goal==='reel'?3:4.5);
  const script=o.script||scriptFor(o);
  if(o.voice==='tts'&&o.goal!=='avantapres'){const vc=await aiTTS(script,o.voiceId,.6);
    if(vc){if(o.captions){let segs=null;try{segs=(await speechSegments(media[vc.mediaId],{thr:-40,minSil:.25,pad:.05})).map(s=>({s:vc.start+s.s,e:vc.start+s.e}))}catch(e){}addCaptionClip(wordsFromText(script,vc.start,vc.start+vc.dur,segs),'Sous-titres',st.cap)}
      const end=vc.start+vc.dur+1;if(end>projDur()-.5){const d=end-projDur()+.5;endC.dur+=d;P.clips.filter(c=>c.start>=endC.start-.01&&c.kind==='text').forEach(c=>c.dur+=d);mc.dur=Math.min(mc.dur+d,music.dur||mc.dur+d)}
      commit();refreshAll()}
    else if(o.captions){addCaptionClip(wordsFromText(script,.6,total-endDur),'Texte à l\'écran',st.cap);commit();refreshAll()}}
  else if(o.captions&&o.goal==='reel'){addCaptionClip(wordsFromText(script,.6,total-endDur),'Texte à l\'écran',st.cap);commit();refreshAll()}
  toast('Vidéo générée ✓ Ajustez librement, puis exportez');return true;
}
async function generateFacecam(o,st){
  const vids=Object.values(media).filter(m=>m.type==='video');if(!vids.length){toast('Importez d\'abord votre vidéo face caméra');return false}
  P.tracks=defaultTracks();P.clips=[];P.markers=[];const [Tt,To,Tm,Ta]=P.tracks;let t=0;
  vids.forEach(m=>{const c=newClip('video',{mediaId:m.id,name:m.name,dur:m.dur,role:'voice',voiceFx:true,filter:'clean',filterAmt:.5,fit:P.aspect==='16:9'?'cover':'cover'});c.trackId=Tm.id;c.start=t;t+=c.dur;P.clips.push(c)});
  commit();refreshAll();
  for(const c of P.clips.filter(c=>c.kind==='video').slice()){S.sel=c.id;await removeSilences(c)}
  const vc=P.clips.filter(c=>c.kind==='video').sort((a,b)=>a.start-b.start);
  if(o.captions&&vc[0]){for(const c of vc)await aiTranscribe(c,'french').catch(()=>{})}
  const total=projDur();const music=ensureDemoMusic(st.music);P.clips.push(newClip('audio',{mediaId:music.id,name:music.name,trackId:Ta.id,start:0,dur:Math.min(total,music.dur),volume:.35,duck:.75,fadeOutA:2}));
  const c=newClip('text',{text:P.info.type+' à '+P.info.city,font:st.title,size:90,weight:700,animIn:'pop',inDur:.4,start:.2,dur:2.6,y:.18,bg:'#11131A',bgA:.6,pad:24,radius:14,trackId:To.id});c.name='Accroche';P.clips.push(c);
  S.sel=null;commit();refreshAll();toast('Face caméra prêt : silences coupés, sous-titres et musique ajoutés');return true;
}

/* ===== social texts ===== */
function chaptersText(){const ms=(P.markers||[]).filter(m=>m.label&&m.color!=='#9D8DF4');const list=ms.length?ms:P.clips.filter(c=>c.kind==='text').map(c=>({t:c.start,label:c.name}));const seen=new Set();
  const f=t=>{const m=Math.floor(t/60),s=Math.floor(t%60);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`};
  const rows=[{t:0,label:'Introduction'},...list].filter(m=>{const k=f(m.t);if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>a.t-b.t);return rows.map(m=>`${f(m.t)} ${m.label}`).join('\n')}
function socialTexts(){
  const I=P.info,B=P.brand;const city=I.city||'';const tag=s=>'#'+s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]/g,'').toLowerCase();
  const tags=[tag('immobilier'),tag(city),tag(I.type),tag(I.type+'avendre'),tag('visitevirtuelle'),tag('immo'),tag('realestate'),...(I.feats||[]).slice(0,3).map(tag),tag(B.agency)].filter((v,i,a)=>v.length>2&&a.indexOf(v)===i);
  const nums=[I.surface&&I.surface+' m²',I.rooms&&I.rooms+' pièces',I.bedrooms&&I.bedrooms+' chambres',I.land&&I.land+' m² de terrain'].filter(Boolean).join(' · ');
  const feats=(I.feats||[]).join(' · ');
  return {
    youtube:{label:'YouTube',title:`${I.type} ${I.feats&&I.feats[0]?'avec '+I.feats[0].toLowerCase()+' ':''}à ${city} – ${I.price} | Visite complète`,body:`Visite complète de cette ${I.type.toLowerCase()} à ${city}${I.area?' ('+I.area+')':''}.\n\n${nums}\n${feats}\nPrix : ${I.price}${I.dpe?' · DPE '+I.dpe:''}\n\nChapitres :\n${chaptersText()}\n\n📞 ${B.agency} – ${B.phone}${B.web?'\n🌐 '+B.web:''}\n\n${tags.slice(0,8).join(' ')}`,tags:tags.map(t=>t.slice(1)).join(', ')},
    instagram:{label:'Instagram / Reels',body:`✨ ${I.type} à ${city} ✨\n\n${nums}\n${feats}\n💶 ${I.price}\n\n📩 Visite sur rendez-vous : ${B.phone}\n\n${tags.join(' ')}`},
    facebook:{label:'Facebook',body:`🏡 NOUVEAUTÉ – ${I.type} à ${city}\n\n${nums}. ${feats}.\nPrix : ${I.price}.\n\nVisite et renseignements : ${B.agency}, ${B.phone}.${B.web?' '+B.web:''}`},
    tiktok:{label:'TikTok',body:`POV : tu visites cette ${I.type.toLowerCase()} à ${city} 😍 ${I.price} ${tags.slice(0,6).join(' ')}`},
  };
}
async function openSocial(){
  const tx=socialTexts();
  const m=modal(`<h3>Textes pour les réseaux</h3><p class="note">Générés à partir des infos du bien et des chapitres de la timeline. Modifiez-les puis copiez.</p>
    ${Object.entries(tx).map(([k,v])=>`<div class="grp">${v.label}</div>${v.title?`<input class="ta" style="min-height:0;height:36px" id="so_${k}_t" value="${esc(v.title)}">`:''}<textarea class="ta" id="so_${k}" rows="6">${esc(v.body)}</textarea>${v.tags?`<input class="ta" style="min-height:0;height:36px" id="so_${k}_g" value="${esc(v.tags)}">`:''}<div class="mrow" style="margin-top:0"><button class="btn" data-copy="${k}">Copier</button></div>`).join('')}
    <div class="mrow"><button class="btn" data-x="ai">${ic('wand')}Réécrire avec l'IA</button><button class="btn" data-x="srt">${ic('subs')}Exporter les sous-titres .srt</button><span class="sp"></span><button class="btn pri" data-x="close">Fermer</button></div>`);
  m.addEventListener('click',async e=>{const b=e.target.closest('[data-copy],[data-x]');if(!b)return;
    if(b.dataset.copy){const k=b.dataset.copy;const parts=[$('#so_'+k+'_t',m),$('#so_'+k,m),$('#so_'+k+'_g',m)].filter(Boolean).map(x=>x.value);const txt=parts.join('\n\n');try{await navigator.clipboard.writeText(txt);toast('Copié')}catch(err){const ta=$('#so_'+k,m);ta.focus();ta.select();toast('Sélectionné : faites Ctrl+C')}}
    else if(b.dataset.x==='close')m.parentElement.remove();
    else if(b.dataset.x==='srt'){const cc=P.clips.find(c=>c.kind==='caption');if(!cc){toast('Aucun sous-titre dans le projet');return}download(new Blob([P.clips.filter(c=>c.kind==='caption').map(captionsToSRT).join('\n')],{type:'text/plain'}),slug()+'-sous-titres.srt')}
    else if(b.dataset.x==='ai'){const ta=$('#so_instagram',m);b.disabled=true;const r=await aiWrite(`Réécris ce texte d'annonce Instagram pour qu'il soit plus accrocheur (max 120 mots, emojis sobres, garde les hashtags) :\n${ta.value}`,null);b.disabled=false;if(r)ta.value=r;else toast('IA indisponible ici : texte modèle conservé')}});
}

/* ===== thumbnail / cover ===== */
function renderThumb(kind,title,sub,badge){
  const [w,h]=kind==='cover'?[1080,1920]:[1280,720];const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  const r=Math.max(w/cv.width,h/cv.height);g.drawImage(cv,(w-cv.width*r)/2,(h-cv.height*r)/2,cv.width*r,cv.height*r);
  const gr=g.createLinearGradient(0,h*.35,0,h);gr.addColorStop(0,'rgba(10,11,16,0)');gr.addColorStop(1,'rgba(10,11,16,.88)');g.fillStyle=gr;g.fillRect(0,0,w,h);
  const u=Math.min(w,h)/720,acc=P.brand.color||'#F2A65E';g.textBaseline='alphabetic';g.textAlign='left';
  const lines=title.toUpperCase().split('\n');g.font=`900 ${kind==='cover'?118:96}px "Montserrat","Onest",sans-serif`;
  let y=h-(kind==='cover'?420:120)*u-(lines.length-1)*96*u;g.lineJoin='round';
  lines.forEach(l=>{g.lineWidth=14*u;g.strokeStyle='rgba(0,0,0,.6)';g.strokeText(l,48*u,y);g.fillStyle='#fff';g.fillText(l,48*u,y);y+=(kind==='cover'?126:100)*u});
  if(sub){g.font=`700 ${44*u}px "Montserrat","Onest",sans-serif`;g.fillStyle=acc;g.fillText(sub,52*u,y+4*u)}
  if(badge){g.font=`900 ${52*u}px "Montserrat","Onest",sans-serif`;const bw=g.measureText(badge).width+56*u;g.fillStyle=acc;rr(g,w-bw-40*u,40*u,bw,88*u,16*u);g.fill();g.fillStyle=pickInk(acc);g.fillText(badge,w-bw-12*u,100*u)}
  return c;
}
function openThumb(){
  pause();const I=P.info;const m=modal(`<h3>Miniature & couverture</h3><p class="note">Image de l'instant affiché dans l'aperçu (déplacez la tête de lecture pour choisir).</p>
    <div class="row"><label for="thT">Titre</label><textarea class="ta" id="thT" rows="2" style="min-height:0">${esc(I.type+' '+(I.feats&&I.feats[0]?'+ '+I.feats[0]:'')+'\n'+I.city)}</textarea></div>
    <div class="row"><label for="thS">Sous-titre</label><input class="ta" style="min-height:0;height:34px" id="thS" value="${esc((I.surface?I.surface+' m² · ':'')+(I.bedrooms?I.bedrooms+' chambres':''))}"></div>
    <div class="row"><label for="thB">Pastille</label><input class="ta" style="min-height:0;height:34px" id="thB" value="${esc(I.price)}"></div>
    <div class="row"><label for="thK">Format</label><select id="thK"><option value="yt">Miniature YouTube 1280×720</option><option value="cover">Couverture Reels/TikTok 1080×1920</option></select></div>
    <img id="thPrev" alt="Aperçu de la miniature" style="width:100%;border-radius:10px;margin-top:8px;background:#000">
    <div class="mrow"><button class="btn" data-x="close">Fermer</button><button class="btn pri" data-x="dl">${ic('download')}Télécharger PNG</button></div>`);
  const upd=()=>{const c=renderThumb($('#thK',m).value,$('#thT',m).value,$('#thS',m).value,$('#thB',m).value);$('#thPrev',m).src=c.toDataURL('image/jpeg',.85);return c};upd();
  m.addEventListener('input',upd);m.addEventListener('change',upd);
  m.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;if(b.dataset.x==='close')m.parentElement.remove();else upd().toBlob(bl=>download(bl,slug()+($('#thK',m).value==='cover'?'-couverture':'-miniature')+'.png'),'image/png')});
}

/* ===== wizard ===== */
function openAssistant(){
  pause();const I=P.info,B=P.brand,o=A_OPTS;const nMedia=Object.values(media).filter(m=>m.type==='video'||m.type==='image').length;
  const m=modal(`<h3>Assistant vidéo</h3><p class="note">${nMedia?`${nMedia} média(s) importé(s) seront utilisés.`:'Aucun média importé : les scènes de démonstration seront utilisées. Importez vos photos et vidéos avant pour un résultat réel.'} Tout reste modifiable après génération.</p>
   <div class="grp">Objectif</div><div class="grid2 wz-goals">${GOALS.map(([k,n,d])=>`<label class="wz-card"><input type="radio" name="wzGoal" value="${k}" ${o.goal===k?'checked':''}><b>${n}</b><span>${d}</span></label>`).join('')}</div>
   <div class="grp">Formats</div><div class="chip-row">${[['16:9','YouTube 16:9'],['9:16','Reels · Shorts · TikTok 9:16'],['1:1','Facebook 1:1'],['4:5','Instagram 4:5']].map(([k,n])=>`<label class="tg chip"><input type="checkbox" name="wzFmt" value="${k}" ${o.formats.includes(k)?'checked':''}>${n}</label>`).join('')}</div>
   <div class="row"><label for="wzDur">Durée</label><select id="wzDur">${[15,30,45,60,90].map(d=>`<option ${o.dur===d?'selected':''} value="${d}">${d} s</option>`).join('')}</select></div>
   <div class="row"><label for="wzStyle">Style</label><select id="wzStyle">${Object.entries(STYLES).map(([k,s])=>`<option value="${k}" ${o.style===k?'selected':''}>${s.name}</option>`).join('')}</select></div>
   <div class="grp">Le bien</div><div class="wz-form">
    ${[['type','Type'],['city','Ville'],['area','Quartier / situation'],['price','Prix'],['surface','Surface (m²)'],['rooms','Pièces'],['bedrooms','Chambres'],['baths','Salles de bain'],['land','Terrain (m²)'],['dpe','DPE']].map(([k,n])=>`<label>${n}<input id="wi_${k}" value="${esc(I[k]||'')}"></label>`).join('')}</div>
   <div class="chip-row">${FEATS.map(f=>`<label class="tg chip"><input type="checkbox" name="wzFeat" value="${esc(f)}" ${(I.feats||[]).includes(f)?'checked':''}>${f}</label>`).join('')}</div>
   <div class="grp">Agence</div><div class="wz-form">${[['agency','Nom'],['phone','Téléphone'],['web','Site web']].map(([k,n])=>`<label>${n}<input id="wb_${k}" value="${esc(B[k]||'')}"></label>`).join('')}<label>Couleur<input type="color" id="wb_color" value="${toHex(B.color)}"></label></div>
   <div class="row"><label for="wbLogo">Logo</label><select id="wbLogo"><option value="">Aucun</option>${Object.values(media).filter(x=>x.type==='image').map(x=>`<option value="${x.id}" ${B.logo===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
   <div class="grp">Automatisations</div><div class="stack">
    <label class="tg"><input type="checkbox" id="wzVoice" ${o.voice==='tts'?'checked':''}>Voix off générée (IA, voix française)</label>
    <div class="row"><label for="wzVoiceId">Voix</label><select id="wzVoiceId">${PIPER_VOICES.map(([k,n])=>`<option value="${k}" ${o.voiceId===k?'selected':''}>${n}</option>`).join('')}</select></div>
    <label class="tg"><input type="checkbox" id="wzCaps" ${o.captions?'checked':''}>Sous-titres animés mot à mot</label>
    <label class="tg"><input type="checkbox" id="wzTw" ${o.twilight?'checked':''}>Dernier plan extérieur : passage jour → nuit</label>
    <label class="tg"><input type="checkbox" id="wzBeat" ${o.beat?'checked':''}>Couper les plans sur le rythme de la musique</label>
    <label class="tg"><input type="checkbox" id="wzLogo" ${o.logo?'checked':''}>Logo en filigrane</label></div>
   <div class="grp">Script de la voix off</div><textarea class="ta" id="wzScript" rows="4"></textarea><div class="mrow" style="margin-top:0"><button class="btn" data-x="tpl">Modèle</button><button class="btn" data-x="aiscript">${ic('wand')}Rédiger avec l'IA</button></div>
   <div class="mrow"><button class="btn" data-x="close">Annuler</button><button class="btn pri" data-x="go">${ic('wand')}Générer la vidéo</button></div>`);
  const read=()=>{o.goal=($('input[name=wzGoal]:checked',m)||{}).value||'annonce';o.formats=$$('input[name=wzFmt]:checked',m).map(x=>x.value);if(!o.formats.length)o.formats=[P.aspect];o.dur=+$('#wzDur',m).value;o.style=$('#wzStyle',m).value;
    for(const k of ['type','city','area','price','surface','rooms','bedrooms','baths','land','dpe'])I[k]=$('#wi_'+k,m).value.trim();I.feats=$$('input[name=wzFeat]:checked',m).map(x=>x.value);
    for(const k of ['agency','phone','web'])B[k]=$('#wb_'+k,m).value.trim();B.color=$('#wb_color',m).value;B.logo=$('#wbLogo',m).value||null;
    o.voice=$('#wzVoice',m).checked?'tts':'none';o.voiceId=$('#wzVoiceId',m).value;o.captions=$('#wzCaps',m).checked;o.twilight=$('#wzTw',m).checked;o.beat=$('#wzBeat',m).checked;o.logo=$('#wzLogo',m).checked;o.script=$('#wzScript',m).value.trim()};
  const fillScript=()=>{read();$('#wzScript',m).value=scriptFor(o)};fillScript();
  m.addEventListener('change',e=>{if(e.target.name==='wzGoal'){const g=e.target.value;if(g==='reel'){$$('input[name=wzFmt]',m).forEach(x=>x.checked=x.value==='9:16');$('#wzDur',m).value='30';$('#wzStyle',m).value='dynamique'}else if(g==='youtube'){$$('input[name=wzFmt]',m).forEach(x=>x.checked=x.value==='16:9');$('#wzDur',m).value='90'}else if(g==='visite'){$('#wzDur',m).value='60'}fillScript()}});
  m.addEventListener('click',async e=>{const b=e.target.closest('[data-x]');if(!b)return;const x=b.dataset.x;
    if(x==='close')m.parentElement.remove();
    else if(x==='tpl')fillScript();
    else if(x==='aiscript'){read();b.disabled=true;const base=scriptFor(o);const r=await aiWrite(`Écris un script de voix off de ${Math.round(o.dur*2.3)} mots maximum pour une vidéo ${GOALS.find(g=>g[0]===o.goal)[1]} d'un bien immobilier. Infos : ${JSON.stringify(P.info)}. Agence : ${P.brand.agency}, ${P.brand.phone}. Ton ${STYLES[o.style].name.toLowerCase()}, phrases courtes, termine par un appel à l'action.`,null);b.disabled=false;
      if(r)$('#wzScript',m).value=r;else{$('#wzScript',m).value=base;toast('IA de rédaction indisponible ici : modèle de script utilisé')}}
    else if(x==='go'){read();m.parentElement.remove();aiBusy('Génération de la vidéo…');try{const ok=await generateVideo({...o});aiBusy('');if(ok)showAfterGen(o)}catch(err){aiBusy('');console.error(err);toast('Erreur pendant la génération : '+(err.message||err))}}});
}
function showAfterGen(o){
  const m=modal(`<h3>Votre vidéo est prête</h3><p class="note">${fmtT(projDur())} · ${P.clips.length} éléments · format ${P.aspect}. Relisez-la dans l'aperçu, ajustez si besoin, puis exportez.</p>
    <div class="stack"><button class="btn pri" data-x="exp">${ic('download')}Exporter ${o.formats.length>1?'les '+o.formats.length+' formats':'la vidéo'}</button><button class="btn" data-x="soc">${ic('share')}Textes pour les réseaux</button><button class="btn" data-x="th">${ic('image')}Miniature / couverture</button><button class="btn" data-x="close">Continuer le montage</button></div>`);
  m.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;m.parentElement.remove();if(b.dataset.x==='exp')openExport(o.formats);else if(b.dataset.x==='soc')openSocial();else if(b.dataset.x==='th')openThumb()});
}
