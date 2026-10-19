/* ---------- inspector ---------- */
const inspBody=$('#inspBody');
const R=(id,label,v,min,max,step,fmt,kf)=>`<div class="row${kf?' kfrow':''}"><label for="${id}">${label}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"><output data-fmt="${fmt||''}">${fmtV(v,fmt)}</output>${kf?kf:''}</div>`;
const SEL=(id,label,v,opts)=>`<div class="row r2"><label for="${id}">${label}</label><select id="${id}">${opts.map(([k,n])=>`<option value="${esc(k)}" ${String(v)===String(k)?'selected':''}>${esc(n)}</option>`).join('')}</select></div>`;
const COL=(id,label,v)=>`<div class="row r2"><label for="${id}">${label}</label><input type="color" id="${id}" value="${toHex(v)}"></div>`;
const TXT=(id,label,v)=>`<div class="row r2"><label for="${id}">${label}</label><input type="text" id="${id}" value="${esc(v||'')}"></div>`;
const TG=(id,label,v)=>`<label class="tg" style="margin:6px 0"><input type="checkbox" id="${id}" ${v?'checked':''}>${label}</label>`;
const sec=(title,body,open=true,id='')=>`<details class="sec" ${open?'open':''} ${id?`data-sec="${id}"`:''}><summary>${title}</summary>${body}</details>`;
const openSecs=new Set(['Temps','Texte','Sous-titres','Transformation','Forme','Fond','Audio']);
function renderInspector(){
  const c=selClip();let h='';
  if(!c){
    const I=P.info,B=P.brand;
    h+=sec('Projet',`${TXT('pName','Nom',P.name)}${SEL('pAspect','Format',P.aspect,Object.keys(ASPECTS).map(k=>[k,k]))}${COL('pBg','Fond',P.bg)}
      ${SEL('pPq','Aperçu',S.pq,[[.35,'Rapide'],[.5,'Standard'],[.75,'HD'],[1,'Pleine résolution']])}<p class="note">Durée totale : ${fmtT(projDur())} · ${P.clips.length} clips</p>`);
    h+=sec('Le bien (utilisé par l\'automatisation)',[['type','Type'],['city','Ville'],['area','Situation'],['price','Prix'],['surface','Surface m²'],['rooms','Pièces'],['bedrooms','Chambres'],['baths','Salles de bain'],['land','Terrain m²'],['dpe','DPE']].map(([k,n])=>TXT('i_'+k,n,I[k])).join(''),false);
    h+=sec('Marque',`${TXT('b_agency','Agence',B.agency)}${TXT('b_phone','Téléphone',B.phone)}${TXT('b_web','Site web',B.web)}${COL('b_color','Couleur',B.color)}
      ${SEL('b_logo','Logo',B.logo||'',[['','Aucun'],...Object.values(media).filter(m=>m.type==='image').map(m=>[m.id,m.name])])}`,false);
    h+=sec(`Marqueurs (${(P.markers||[]).length})`,`${(P.markers||[]).length?(P.markers.slice(0,40).map((m,i)=>`<div class="fx-applied"><span><button class="linkb" data-goto="${m.t}">${fmtT(m.t)}</button> ${esc(m.label||'')}</span><span></span><button class="mini" data-mkdel="${i}" aria-label="Supprimer le marqueur">${ic('x')}</button></div>`).join('')):'<p class="note">Touche M pour poser un marqueur à la tête de lecture.</p>'}<button class="btn wide" data-ia="mkadd">${ic('flag')}Ajouter un marqueur</button>`,false);
    h+=sec('Raccourcis clavier',`<div class="kbd"><kbd>Espace</kbd><span>Lecture / pause</span><kbd>J K L</kbd><span>Arrière / pause / avant (×2 en répétant)</span><kbd>S</kbd><span>Couper à la tête de lecture</span><kbd>M</kbd><span>Marqueur</span><kbd>Suppr</kbd><span>Supprimer le clip</span><kbd>Ctrl D</kbd><span>Dupliquer</span><kbd>Ctrl Z</kbd><span>Annuler</span><kbd>Ctrl Maj Z</kbd><span>Rétablir</span><kbd>← →</kbd><span>Image par image (Maj : 1 s)</span><kbd>Ctrl molette</kbd><span>Zoom timeline</span></div>`,false);
    h+=sec('À propos',`<p class="note">Top Clap est un logiciel libre (licence MIT). Le montage, les effets et l'export se font dans votre navigateur : vos fichiers ne quittent pas votre appareil.</p>`,false);
    inspBody.innerHTML=h;return;
  }
  const lt=clamp(S.t-c.start,0,c.dur);
  const kindL={video:'Vidéo',image:'Photo',scene:'Scène',text:'Texte',caption:'Sous-titres',shape:'Forme',color:'Fond',audio:'Audio',adjust:'Réglage'}[c.kind];
  h+=`<div class="insp-head" style="padding-left:0;padding-right:0"><span class="kind">${kindL}</span><input id="cName" value="${esc(c.name||'')}" aria-label="Nom du clip"><button class="mini" data-ia="dup" title="Dupliquer" aria-label="Dupliquer">${ic('copy')}</button><button class="mini" data-ia="del" title="Supprimer" aria-label="Supprimer">${ic('trash')}</button></div>`;
  const KB=p=>`<button class="kfb${kfAt(c,p,lt)>=0?' on':hasKf(c,p)?' has':''}" data-kf="${p}" title="Image clé à ${fmtT(S.t)}" aria-label="Image clé ${p}">${ic('diamond')}</button>`;
  let tm=`<div class="row r2"><label for="k_start">Début (s)</label><input type="number" id="k_start" step="0.1" min="0" value="${c.start.toFixed(2)}"></div><div class="row r2"><label for="k_dur">Durée (s)</label><input type="number" id="k_dur" step="0.1" min="0.1" value="${c.dur.toFixed(2)}"></div>`;
  if(c.kind==='video'||c.kind==='audio')tm+=R('k_speed','Vitesse',c.speed,.25,4,.05,'x');
  h+=sec('Temps',tm);
  if(c.kind==='text'){
    h+=sec('Texte',`<textarea class="ta" id="k_text" aria-label="Contenu du texte">${esc(c.text)}</textarea>
      ${SEL('k_font','Police',c.font,FONTS.map(([f])=>[f,f]))}${R('k_size','Taille',c.size,12,300,1,'')}${SEL('k_weight','Graisse',c.weight,[[400,'Normale'],[700,'Grasse'],[900,'Extra']])}
      ${COL('k_color','Couleur',c.color)}${SEL('k_align','Alignement',c.align,[['left','Gauche'],['center','Centré'],['right','Droite']])}
      ${R('k_sub','Lignes 2+',c.sub,.2,1.5,.01,'%')}${R('k_lh','Interligne',c.lh,.7,2.2,.01,'')}${R('k_ls','Espacement',c.ls,-4,40,.5,'')}
      <div class="chip-row">${TG('k_italic','Italique',c.italic)}${TG('k_upper','Majuscules',c.upper)}</div>`);
    h+=sec('Style',`${COL('k_stroke','Contour',c.stroke)}${R('k_sw','Épaisseur',c.sw,0,20,.5,'')}${COL('k_shadowColor','Ombre',c.shadowColor)}${R('k_shadowBlur','Flou ombre',c.shadowBlur,0,80,1,'')}${R('k_shadowY','Décalage',c.shadowY,-30,30,1,'')}${COL('k_bg','Fond',c.bg)}${R('k_bgA','Opacité fond',c.bgA,0,1,.01,'%')}${R('k_pad','Marge',c.pad,0,90,1,'')}${R('k_radius','Arrondi',c.radius,0,80,1,'')}`,false);
    h+=sec('Animation',`${SEL('k_animIn','Entrée',c.animIn,IN_ANIMS)}${R('k_inDur','Durée entrée',c.inDur,0,3,.05,'s')}${SEL('k_animOut','Sortie',c.animOut,OUT_ANIMS)}${R('k_outDur','Durée sortie',c.outDur,0,3,.05,'s')}`);
  }
  if(c.kind==='caption'){
    h+=sec('Sous-titres',`${SEL('k_style','Style',c.style,[['karaoke','Karaoké (mot surligné)'],['boxed','Encadré'],['pop','Un mot à la fois'],['classic','Classique']])}${R('k_maxWords','Mots par ligne',c.maxWords,1,10,1,'')}
      ${SEL('k_font','Police',c.font,FONTS.map(([f])=>[f,f]))}${R('k_size','Taille',c.size,20,200,1,'')}${SEL('k_weight','Graisse',c.weight,[[400,'Normale'],[700,'Grasse'],[900,'Extra']])}
      ${COL('k_color','Couleur',c.color)}${COL('k_hl','Mot actif',c.hl)}${COL('k_stroke','Contour',c.stroke)}${R('k_sw','Épaisseur',c.sw,0,20,.5,'')}${COL('k_bg','Fond',c.bg)}${R('k_bgA','Opacité fond',c.bgA,0,1,.01,'%')}
      <div class="chip-row">${TG('k_upper','Majuscules',c.upper)}</div>
      <textarea class="ta" id="cap_text" aria-label="Texte des sous-titres">${esc(c.words.map(w=>w.w).join(' '))}</textarea><p class="note">Corrigez le texte : les mots sont redistribués sur les mêmes temps. ${c.words.length} mots.</p>
      <button class="btn wide" data-ia="capsrt">${ic('download')}Exporter en .srt</button>`);
  }
  if(c.kind==='shape')h+=sec('Forme',`${SEL('k_shape','Type',c.shape,SHAPES)}${R('k_w','Largeur',c.w,10,1900,1,'')}${R('k_h','Hauteur',c.h,10,1900,1,'')}${COL('k_fill','Couleur',c.fill)}${COL('k_stroke','Contour',c.stroke)}${R('k_sw','Épaisseur',c.sw,0,30,.5,'')}${TXT('k_label','Texte',c.label)}${COL('k_labelColor','Couleur texte',c.labelColor)}${SEL('k_font','Police',c.font,FONTS.map(([f])=>[f,f]))}`);
  if(c.kind==='color')h+=sec('Fond',`${COL('k_c1','Couleur 1',c.c1)}${COL('k_c2','Couleur 2',c.c2)}${R('k_angle','Angle',c.angle,0,360,1,'°')}`);
  if(isVisual(c)&&c.kind!=='adjust'){
    let tf=`${R('k_x','Position X',kv(c,'x',lt),-.5,1.5,.001,'%',KB('x'))}${R('k_y','Position Y',kv(c,'y',lt),-.5,1.5,.001,'%',KB('y'))}${R('k_scale','Échelle',kv(c,'scale',lt),.05,4,.01,'%',KB('scale'))}${R('k_rot','Rotation',kv(c,'rot',lt),-180,180,1,'°',KB('rot'))}${R('k_opacity','Opacité',kv(c,'opacity',lt),0,1,.01,'%',KB('opacity'))}`;
    const nk=kfTimes(c).length;tf+=`<div class="chip-row kf-nav"><button class="btn" data-ia="kfprev" aria-label="Image clé précédente">${ic('stepB')}</button><span class="note" style="margin:0">${nk?nk+' image(s) clé':'◆ pour animer'}</span><button class="btn" data-ia="kfnext" aria-label="Image clé suivante">${ic('stepF')}</button>${nk?`<button class="btn" data-ia="kfclear">Effacer</button>`:''}</div>`;
    tf+=`${R('k_fadeOut','Fondu sortie',c.fadeOut,0,3,.05,'s')}${SEL('k_blend','Fusion',c.blend,BLENDS)}`;
    if(isMedia(c))tf+=SEL('k_fit','Cadrage',c.fit,[['cover','Remplir le cadre'],['contain','Adapter'],['blurfill','Adapter + fond flou']]);
    if(isGraphic(c))tf+=TG('k_autofit','Garder dans le cadre (tous formats)',c.autofit!==false);
    tf+=`<div class="pip">${[['full','Plein cadre'],['tl','↖'],['tr','↗'],['bl','↙'],['br','↘'],['center','Centre 50 %']].map(([k,n])=>`<button class="btn" data-pip="${k}">${n}</button>`).join('')}</div>`;
    h+=sec('Transformation',tf,openSecs.has('Transformation')&&c.kind!=='text'&&c.kind!=='caption');
  }
  if(isMedia(c)||c.kind==='adjust'){
    h+=sec('Filtre & couleur',`${SEL('k_filter','Filtre',c.filter,Object.entries(FILTERS).map(([k,f])=>[k,f.name]))}${R('k_filterAmt','Intensité',c.filterAmt,0,1,.01,'%')}
      ${R('a_bright','Luminosité',c.adj.bright,-1,1,.01,'±')}${R('a_contrast','Contraste',c.adj.contrast,-1,1,.01,'±')}${R('a_sat','Saturation',c.adj.sat,-1,1,.01,'±')}${R('a_temp','Température',c.adj.temp,-1,1,.01,'±')}${R('a_tint','Teinte',c.adj.tint,-1,1,.01,'±')}${R('a_hue','Couleur',c.adj.hue,-1,1,.01,'±')}${R('a_vig','Vignette',c.adj.vig,0,1,.01,'%')}${R('a_grain','Grain',c.adj.grain,0,1,.01,'%')}${R('a_fade','Fondu mat',c.adj.fade,0,1,.01,'%')}
      <button class="btn wide" data-ia="resetcol">Réinitialiser la couleur</button>`,c.kind==='adjust');
    const W3=n=>`<div class="wheel"><canvas data-wheel="${n}" width="104" height="104" aria-label="Roue ${n}"></canvas><span>${{lift:'Ombres',gamma:'Tons moyens',gain:'Hautes lumières'}[n]}</span><input type="range" id="w_${n}" min="-1" max="1" step="0.01" value="${c.grade.wheels[n][2]}" aria-label="Niveau ${n}"></div>`;
    h+=sec('Étalonnage pro',`<div class="wheels">${W3('lift')}${W3('gamma')}${W3('gain')}</div><p class="note">Faites glisser le point pour teinter, le curseur pour le niveau. Double-clic pour remettre à zéro.</p>
      ${SEL('g_lut','LUT 3D',c.grade.lut||'',[['','Aucune'],...Object.values(LUTS).map(l=>[l.id,l.name+(l.builtin?'':' (importée)')])])}${R('g_lutAmt','Intensité LUT',c.grade.lutAmt,0,1,.01,'%')}<button class="btn wide" data-ia="lutimp">${ic('upload')}Importer une LUT .cube</button>`,false);
  }
  if(isMedia(c)){
    h+=sec('Immo IA',`${R('m_tw','Jour → Nuit',c.immo.tw,0,1,.01,'%')}${SEL('m_twAnim','Animation',c.immo.twAnim,[['none','Fixe'],['in','Jour vers nuit'],['out','Nuit vers jour']])}${R('m_horizon','Ligne d\'horizon',c.immo.horizon,.15,1,.01,'%')}${R('m_sky','Ciel bleu',c.immo.sky,0,1,.01,'%')}${R('m_glow','Fenêtres allumées',c.immo.glow,0,1.5,.01,'%')}${R('m_hdr','HDR',c.immo.hdr,0,1,.01,'%')}${R('m_gold','Golden hour',c.immo.gold,0,1,.01,'%')}${R('m_winter','Hiver',c.immo.winter,0,1,.01,'%')}
      ${R('m_parallax','Photo 3D',c.immo.parallax,0,1.5,.01,'%')}${SEL('m_parDir','Mouvement 3D',c.immo.parDir,[['push','Avancer'],['left','Vers la gauche'],['right','Vers la droite'],['up','Vertical']])}
      ${SEL('m_compare','Avant / Après',c.immo.compare,[['off','Désactivé'],['static','Volet fixe'],['slide','Volet animé']])}${c.immo.compare==='static'?R('m_splitPos','Position volet',c.immo.splitPos,0,1,.01,'%'):''}<p class="note">Baissez la ligne d'horizon si une façade claire est prise pour du ciel.${c.immo.parallax>0&&!(media[c.mediaId]&&media[c.mediaId].depth)?' Profondeur estimée ; « Photo 3D (profondeur) » dans Modèles IA calcule la vraie.':''}</p>`,c.immo.tw>0||c.immo.sky>0||c.immo.compare!=='off'||c.immo.parallax>0);
    h+=sec('Incrustation (fond vert)',`${TG('y_on','Activer le chroma key',c.key.on)}${COL('y_color','Couleur à retirer',c.key.color)}${R('y_tol','Tolérance',c.key.tol,0,.5,.005,'')}${R('y_soft','Douceur',c.key.soft,0,.4,.005,'')}${R('y_spill','Anti-débordement',c.key.spill,0,1,.01,'%')}`,c.key.on);
    h+=sec('Masque',`${SEL('q_type','Forme',c.mask.type,[['none','Aucun'],['rect','Rectangle'],['ellipse','Ellipse'],['linear','Dégradé']])}${c.mask.type!=='none'?`${R('q_x','Centre X',c.mask.x,0,1,.005,'%')}${R('q_y','Centre Y',c.mask.y,0,1,.005,'%')}${c.mask.type!=='linear'?R('q_w','Largeur',c.mask.w,.02,2,.005,'%')+R('q_h','Hauteur',c.mask.h,.02,2,.005,'%'):''}${R('q_feather','Contour doux',c.mask.feather,0,.4,.005,'')}${TG('q_invert','Inverser',c.mask.invert)}`:''}`,c.mask.type!=='none');
  }
  if(isVisual(c)){
    h+=sec('Effets',(c.fx.length?c.fx.map((f,i)=>`<div class="fx-applied"><span>${FXMAP[f.id]?FXMAP[f.id].name:f.id}</span><input type="range" min="0" max="1" step="0.01" value="${f.v}" data-fxv="${i}" aria-label="Intensité ${FXMAP[f.id]?FXMAP[f.id].name:''}"><button class="mini" data-fxdel="${i}" aria-label="Retirer">${ic('x')}</button></div>`).join(''):'<p class="note">Aucun effet.</p>')+`<button class="btn wide" data-ia="gofx">${ic('plus')}Ajouter un effet</button>`,c.fx.length>0);
    if(c.kind!=='adjust')h+=sec('Transition d\'entrée',`${SEL('t_type','Type',c.trans.type,TRANS)}${R('t_dur','Durée',c.trans.dur,.2,2.5,.05,'s')}`,c.trans.type!=='none');
  }
  if(c.kind==='video'||c.kind==='audio')h+=sec('Audio',`${R('k_volume','Volume',c.volume,0,2,.01,'%')}${R('k_fadeIn','Fondu entrée',c.fadeIn,0,5,.1,'s')}${R('k_fadeOutA','Fondu sortie',c.fadeOutA,0,5,.1,'s')}
    ${SEL('k_role','Rôle',c.role,[['','Normal'],['voice','Voix (déclenche le ducking)'],['music','Musique']])}${c.role!=='voice'?R('k_duck','Ducking sous la voix',c.duck,0,1,.01,'%'):''}${TG('k_voiceFx','Voix claire (EQ + compresseur)',c.voiceFx)}
    <div class="chip-row"><button class="btn" data-ia="normalize">${ic('wave')}Normaliser</button><button class="btn" data-ia="silences">${ic('scissors')}Couper les silences</button><button class="btn" data-ia="transcribe">${ic('subs')}Sous-titrer</button></div>`);
  inspBody.innerHTML=h;
  bindWheels(inspBody,c);
}
const fmtV=(v,f)=>{v=+v;if(f==='%')return Math.round(v*100)+'%';if(f==='x')return v.toFixed(2)+'×';if(f==='s')return v.toFixed(2)+'s';if(f==='°')return Math.round(v)+'°';if(f==='±')return (v>0?'+':'')+Math.round(v*100);return Math.round(v*10)/10};
function toHex(c){if(/^#[0-9a-f]{6}$/i.test(c))return c;if(/^#[0-9a-f]{3}$/i.test(c))return '#'+[...c.slice(1)].map(x=>x+x).join('');const m=String(c).match(/rgba?\(([^)]+)\)/);if(m){const [r,g,b]=m[1].split(',').map(x=>parseFloat(x));return '#'+[r,g,b].map(x=>clamp(Math.round(x),0,255).toString(16).padStart(2,'0')).join('')}return '#000000'}
inspBody.addEventListener('toggle',e=>{const d=e.target;if(d.tagName==='DETAILS'){const t=d.querySelector('summary').textContent;d.open?openSecs.add(t):openSecs.delete(t)}},true);
inspBody.addEventListener('input',e=>{
  const t=e.target,id=t.id;const c=selClip();
  if(!c){if(id==='pName'){P.name=t.value;$('#projName').value=t.value}else if(id==='pBg'){P.bg=t.value;req()}
    else if(id.startsWith('i_'))P.info[id.slice(2)]=t.value;else if(id.startsWith('b_'))P.brand[id.slice(2)]=t.value||null;return}
  if(t.dataset.fxv!=null){c.fx[+t.dataset.fxv].v=+t.value;req();return}
  if(!id)return;const [pre,key]=id.split('_');let v=t.type==='checkbox'?t.checked:t.type==='range'||t.type==='number'?+t.value:t.value;
  if(t.type==='range'&&t.nextElementSibling&&t.nextElementSibling.tagName==='OUTPUT')t.nextElementSibling.textContent=fmtV(v,t.nextElementSibling.dataset.fmt);
  if(id==='cName'){c.name=t.value;renderTimeline();return}
  if(id==='cap_text'){const ws=t.value.trim().split(/\s+/).filter(Boolean);if(!ws.length)return;const s0=c.words.length?c.words[0].s:0,e0=c.words.length?c.words[c.words.length-1].e:c.dur;c.words=wordsFromText(ws.join(' '),s0,e0,c.words.length?captionSpans(c):null);c._g=null;req();return}
  if(pre==='k'){
    if(key==='weight'||key==='maxWords'){v=+v;c._g=null}
    if(key==='start'){if(isNaN(v))return;c.start=Math.max(0,v)}else if(key==='dur'){if(isNaN(v)||v<.1)return;c.dur=Math.min(v,mediaMax(c))}
    else if(key==='speed'){const oldSp=c.speed;c.speed=v;c.dur=Math.min(c.dur*oldSp/v,mediaMax(c))}
    else if(KF_PROPS.includes(key)&&hasKf(c,key))setKf(c,key,clamp(S.t-c.start,0,c.dur),v);
    else c[key]=v;
    if(['start','dur','speed','text','role','duck'].includes(key))renderTimeline();
    if(key==='font'||key==='weight')ensureFont(c.font,c.weight);
  }else if(pre==='a')c.adj[key]=v;else if(pre==='m')c.immo[key]=v;else if(pre==='t'){c.trans[key]=v;if(key==='type')renderTimeline()}
  else if(pre==='y')c.key[key]=v;else if(pre==='q')c.mask[key]=v;
  else if(pre==='g'){if(key==='lut')c.grade.lut=v||null;else c.grade[key]=v}
  else if(pre==='w'){const w=c.grade.wheels[key];w[2]=v;c.grade[key]=wheelVec(key,w)}
  req();
});
function captionSpans(c){const sp=[];c.words.forEach(w=>{const l=sp[sp.length-1];if(l&&w.s-l.e<.25)l.e=w.e;else sp.push({s:w.s,e:w.e})});return sp}
inspBody.addEventListener('change',e=>{const t=e.target;const c=selClip();
  if(!c){if(t.id==='pAspect')setAspect(t.value);else if(t.id==='pPq'){S.pq=+t.value;setRes(S.pq)}else commit();return}
  if(t.id==='k_start'||t.id==='k_dur'){packTrack(trackOf(c));refreshAll()}
  if(['m_compare','k_filter','k_shape','t_type','q_type','k_role','g_lut','m_parallax'].includes(t.id)){renderInspector();renderTimeline()}
  commit()});
inspBody.addEventListener('click',async e=>{
  const g=e.target.closest('[data-goto]');if(g){pause();setTime(+g.dataset.goto);return}
  const md=e.target.closest('[data-mkdel]');if(md){P.markers.splice(+md.dataset.mkdel,1);commit();renderTimeline();renderInspector();return}
  const b=e.target.closest('[data-ia],[data-fxdel],[data-kf],[data-pip]');if(!b)return;const c=selClip();
  if(b.dataset.ia==='mkadd'){addMarker(S.t,'Repère');commit();renderTimeline();renderInspector();return}
  if(!c)return;const lt=clamp(S.t-c.start,0,c.dur);
  if(b.dataset.fxdel!=null){c.fx.splice(+b.dataset.fxdel,1);commit();refreshAll();return}
  if(b.dataset.kf){const p=b.dataset.kf;const i=kfAt(c,p,lt);if(i>=0){c.kf[p].splice(i,1);if(!c.kf[p].length)delete c.kf[p]}else{if(!hasKf(c,p)&&lt>.05){setKf(c,p,0,c[p])}setKf(c,p,lt,kv(c,p,lt))}commit();renderInspector();renderTimeline();req();return}
  if(b.dataset.pip){const k=b.dataset.pip,set=(x,y,s)=>{['x','y','scale'].forEach(p=>{if(c.kf)delete c.kf[p]});c.x=x;c.y=y;c.scale=s};
    ({full:()=>set(.5,.5,1),tl:()=>set(.2,.2,.33),tr:()=>set(.8,.2,.33),bl:()=>set(.2,.8,.33),br:()=>set(.8,.8,.33),center:()=>set(.5,.5,.5)})[k]();commit();renderInspector();req();return}
  const a=b.dataset.ia;
  if(a==='del')deleteSel();else if(a==='dup')duplicateSel();
  else if(a==='resetcol'){c.adj=DEF_ADJ();c.filter='none';c.filterAmt=1;c.grade=DEF_GRADE();commit();refreshAll()}
  else if(a==='gofx')setTab('fx',true);
  else if(a==='lutimp')$('#lutIn').click();
  else if(a==='kfprev'||a==='kfnext'){const ts=kfTimes(c).map(x=>c.start+x);const n=a==='kfnext'?ts.find(x=>x>S.t+.01):[...ts].reverse().find(x=>x<S.t-.01);if(n!=null){pause();setTime(n);renderInspector()}}
  else if(a==='kfclear'){c.kf={};commit();renderInspector();renderTimeline();req()}
  else if(a==='normalize')normalizeClip(c);else if(a==='silences')removeSilences(c);else if(a==='transcribe')aiTranscribe(c,'french');
  else if(a==='capsrt')download(new Blob([captionsToSRT(c)],{type:'text/plain'}),slug()+'-sous-titres.srt');
});
function setAspect(a){P.aspect=a;$('#aspectSel').value=a;setRes(S.pq);commit();renderInspector();renderGuides();toast('Format '+a)}
let inspT=0;function inspFollow(){const c=selClip();if(!c||S.playing||!c.kf||!Object.keys(c.kf).length)return;clearTimeout(inspT);inspT=setTimeout(renderInspector,120)}
