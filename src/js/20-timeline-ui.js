/* ---------- timeline UI ---------- */
const tlBody=$('#tlBody'),tlHeads=$('#tlHeads'),tlScroll=$('#tlScroll');
const laneH=k=>isPhone()?({main:52,overlay:40,text:34,audio:38}[k]):({main:62,overlay:48,text:40,audio:46}[k]);
function clipBg(c){
  const m=media[c.mediaId];
  if(c.kind==='scene')return `background-image:url(${SCN_TH[c.scene]})`;
  if(c.kind==='image'&&m&&m.thumb)return `background-image:url(${m.thumb})`;
  if(c.kind==='video'&&m){const full=(m.dur/c.speed)*S.pps;if(m.strip)return `background-image:url(${m.strip});background-size:${full}px 100%;background-position:${-(c.in/c.speed)*S.pps}px 0;background-repeat:no-repeat`;if(m.thumb)return `background-image:url(${m.thumb})`}
  if(c.kind==='audio'&&m&&m.wave){const full=(m.dur/c.speed)*S.pps;return `background-image:url(${m.wave});background-size:${full}px 70%;background-position:${-(c.in/c.speed)*S.pps}px 50%`}
  if(c.kind==='color')return `background:linear-gradient(90deg,${c.c1},${c.c2})`;
  return '';
}
function clipLabel(c){if(c.kind==='text')return 'T  '+esc(c.text.replace(/\n/g,' · '));if(c.kind==='caption')return 'CC  '+esc(c.words.slice(0,8).map(w=>w.w).join(' '));return esc(c.name||c.kind)}
function renderTimeline(){
  const total=Math.max(projDur()+12,30),W=total*S.pps;
  const steps=[.5,1,2,5,10,15,30,60];const step=steps.find(s=>s*S.pps>=72)||60;
  let ticks='';for(let t=0;t<=total;t+=step){ticks+=`<div class="tick" style="left:${t*S.pps}px">${t>=60?Math.floor(t/60)+'m'+String(Math.round(t%60)).padStart(2,'0'):Math.round(t*10)/10+'s'}</div>`;if(step>=1&&step*S.pps>=140)ticks+=`<div class="tick mi" style="left:${(t+step/2)*S.pps}px"></div>`}
  let lanes='',heads='<div class="tl-corner"></div>';
  for(const tr of P.tracks){const h=laneH(tr.kind);const cs=P.clips.filter(c=>c.trackId===tr.id).sort((a,b)=>a.start-b.start);
    heads+=`<div class="tl-head" style="height:${h}px" data-track="${tr.id}"><span title="${esc(tr.name)}">${esc(tr.name)}</span>${tr.kind==='audio'?`<button data-tact="mute" class="${tr.muted?'off':''}" aria-label="Couper le son">${ic(tr.muted?'mute':'vol')}</button>`:`<button data-tact="hide" class="${tr.hidden?'off':''}" aria-label="Masquer la piste">${ic(tr.hidden?'eyeoff':'eye')}</button>`}${tr.kind!=='main'?`<button data-tact="del" aria-label="Supprimer la piste">${ic('x')}</button>`:''}</div>`;
    let inner='';
    cs.forEach((c,i)=>{const badges=[];if(c.fx.length)badges.push('fx '+c.fx.length);if(c.immo&&c.immo.tw>0)badges.push('nuit');if(c.immo&&c.immo.compare!=='off')badges.push('A/B');if(c.filter!=='none'&&isMedia(c))badges.push(FILTERS[c.filter].name);if(c.speed!==1)badges.push(c.speed+'×');if(c.role==='voice')badges.push('voix');if(c.duck>0)badges.push('ducking');if(c.key&&c.key.on)badges.push('key');if(c.grade&&c.grade.lut)badges.push('LUT');if(c.immo&&c.immo.parallax>0)badges.push('3D');
      inner+=`<div class="clip k-${c.kind}${c.id===S.sel?' sel':''}" data-id="${c.id}" style="left:${c.start*S.pps}px;width:${Math.max(4,c.dur*S.pps)}px;${clipBg(c)}"><div class="cb">${badges.slice(0,3).map(b=>`<i>${esc(b)}</i>`).join('')}</div><div class="cn">${clipLabel(c)}</div><div class="h h-l"></div><div class="h h-r"></div>${kfTimes(c).map(k=>`<s class="kfd" style="left:${k*S.pps}px"></s>`).join('')}</div>`;
      const prev=cs[i-1];if(prev&&Math.abs(prev.start+prev.dur-c.start)<.02&&isVisual(c))inner+=`<button class="junc${c.trans.type!=='none'?' on':''}" data-id="${c.id}" style="left:${c.start*S.pps}px" title="Transition : ${TRANSMAP[c.trans.type]}" aria-label="Transition">${ic('trans')}</button>`});
    if(!cs.length)inner=`<div class="tl-empty">${tr.kind==='audio'?'Glissez une musique ici':tr.kind==='text'?'Ajoutez un texte depuis l\'onglet Texte':'Glissez un média ici'}</div>`;
    lanes+=`<div class="lane" data-track="${tr.id}" data-kind="${tr.kind}" style="height:${h}px;width:${W}px">${inner}</div>`}
  tlHeads.innerHTML=heads;
  tlBody.style.width=W+'px';
  tlBody.innerHTML=`<div id="tlRuler" style="width:${W}px">${ticks}${(P.markers||[]).map((m,i)=>`<button class="mk" data-mk="${i}" style="left:${m.t*S.pps}px;--mc:${m.color||'#F2A65E'}" title="${esc(m.label||'Marqueur')} · ${fmtT(m.t)}"></button>`).join('')}</div>${lanes}<div id="tlPh" style="left:${S.t*S.pps}px"><div class="knob"></div></div>`;
  updateClock();
}
function renderTimelineSel(){$$('.clip',tlBody).forEach(e=>e.classList.toggle('sel',e.dataset.id===S.sel))}
tlHeads.addEventListener('click',e=>{const b=e.target.closest('button[data-tact]');if(!b)return;const tr=P.tracks.find(t=>t.id===b.closest('.tl-head').dataset.track);if(!tr)return;
  const a=b.dataset.tact;if(a==='mute')tr.muted=!tr.muted;else if(a==='hide')tr.hidden=!tr.hidden;else if(a==='del'){const n=P.clips.filter(c=>c.trackId===tr.id).length;if(n&&!confirmSync(n))return;P.clips=P.clips.filter(c=>c.trackId!==tr.id);P.tracks=P.tracks.filter(t=>t!==tr);if(S.sel&&!clipById(S.sel))S.sel=null}
  commit();refreshAll()});
const tFromX=x=>(x-tlBody.getBoundingClientRect().left)/S.pps;
tlBody.addEventListener('pointerdown',e=>{
  const j=e.target.closest('.junc');if(j){select(j.dataset.id);setTab('trans',true);return}
  const mk=e.target.closest('.mk');if(mk){const m=P.markers[+mk.dataset.mk];if(m){pause();setTime(m.t)}e.stopPropagation();return}
  const el=e.target.closest('.clip');
  if(el){
    const c=clipById(el.dataset.id);if(!c)return;if(S.sel!==c.id)select(c.id);
    const mode=e.target.classList.contains('h-l')?'l':e.target.classList.contains('h-r')?'r':'m';
    const st={x:e.clientX,y:e.clientY,s:c.start,d:c.dur,in:c.in,track:c.trackId};let moved=false,targetTr=c.trackId;
    const pts=[0,S.t,...(P.markers||[]).map(m=>m.t),...P.clips.filter(o=>o!==c).flatMap(o=>[o.start,o.start+o.dur])];const thr=8/S.pps;
    const snapV=v=>{if(!S.snap)return [v,false];let best=v,bd=thr;for(const p of pts){const d=Math.abs(p-v);if(d<bd){bd=d;best=p}}return [best,best!==v]};
    const lanesEls=$$('.lane',tlBody);const origLane=el.parentElement;
    const mv=ev=>{const dx=(ev.clientX-st.x)/S.pps;if(!moved&&Math.abs(ev.clientX-st.x)<4&&Math.abs(ev.clientY-st.y)<4)return;moved=true;el.style.zIndex=4;
      const sp=c.speed;
      if(mode==='m'){let ns=Math.max(0,st.s+dx);const [a,sa]=snapV(ns);const [b2,sb]=snapV(ns+c.dur);ns=sa?a:sb?b2-c.dur:ns;c.start=Math.max(0,ns);
        const ln=lanesEls.find(l=>{const r=l.getBoundingClientRect();return ev.clientY>=r.top&&ev.clientY<r.bottom});
        if(ln){const tk=ln.dataset.kind;const ok=(c.kind==='audio')===(tk==='audio');if(ok){targetTr=ln.dataset.track;el.style.transform=`translateY(${ln.getBoundingClientRect().top-origLane.getBoundingClientRect().top}px)`}}}
      else if(mode==='l'){const mn=c.kind==='video'||c.kind==='audio'?st.s-st.in/sp:-1e9;let ns=clamp(st.s+dx,Math.max(0,mn),st.s+st.d-.1);ns=snapV(ns)[0];ns=clamp(ns,Math.max(0,mn),st.s+st.d-.1);c.start=ns;c.dur=st.d-(ns-st.s);if(c.kind==='video'||c.kind==='audio')c.in=Math.max(0,st.in+(ns-st.s)*sp)}
      else{let ne=snapV(st.s+st.d+dx)[0];c.dur=clamp(ne-c.start,.1,mediaMax(c))}
      el.style.left=c.start*S.pps+'px';el.style.width=Math.max(4,c.dur*S.pps)+'px';req();updateClock()};
    const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
      if(moved){const oldTr=trackOf(c);c.trackId=targetTr;packTrack(trackOf(c));if(oldTr&&oldTr.id!==targetTr)packTrack(oldTr);commit();refreshAll()}};
    window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);e.preventDefault();return;
  }
  if(e.target.closest('.lane')&&!e.target.closest('#tlRuler'))select(null);
  pause();setTime(tFromX(e.clientX));
  const mv=ev=>setTime(tFromX(ev.clientX));const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up)};
  window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);
});
tlBody.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('text/x-crep')){e.preventDefault();$$('.lane',tlBody).forEach(l=>l.classList.toggle('drop-hot',l.contains(e.target)))}});
tlBody.addEventListener('dragleave',()=>$$('.lane',tlBody).forEach(l=>l.classList.remove('drop-hot')));
tlBody.addEventListener('drop',e=>{const raw=e.dataTransfer.getData('text/x-crep');if(!raw)return;e.preventDefault();const d=JSON.parse(raw);const ln=e.target.closest('.lane');const t=Math.max(0,tFromX(e.clientX));
  let c;if(d.scene)c=newClip('scene',{scene:d.scene,name:SCENES[d.scene],dur:5,filter:'clean',filterAmt:.6,fx:[{id:'kb-in',v:.7}],fit:fitDefault()});else if(d.media){const m=media[d.media];if(!m)return;c=newClip(m.type,{mediaId:m.id,name:m.name,dur:m.type==='image'?4:Math.min(m.dur||5,60),filter:m.type==='audio'?'none':'clean',filterAmt:.6,fit:fitDefault()})}if(!c)return;
  let tr=ln?P.tracks.find(x=>x.id===ln.dataset.track):null;if(!tr||((c.kind==='audio')!==(tr.kind==='audio')))tr=c.kind==='audio'?(firstTrack('audio')||addTrack('audio')):firstTrack('main');
  placeOnTrack(c,tr,tr.kind==='main'&&S.magnet?t:t);packTrack(tr);S.sel=c.id;commit();refreshAll()});
tlScroll.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(S.pps*(e.deltaY<0?1.15:.87))}},{passive:false});
function setZoom(p){const sc=tlScroll,tAt=(sc.scrollLeft+sc.clientWidth/2-96)/S.pps;S.pps=clamp(p,8,400);renderTimeline();sc.scrollLeft=tAt*S.pps-sc.clientWidth/2+96;const z=$('#zoomR');if(z)z.value=Math.log(S.pps);saveSoon()}
function renderTlBar(){
  $('#tlBar').innerHTML=`
  <button class="btn icon ghost" data-a="split" title="Couper (S)" aria-label="Couper">${ic('scissors')}</button>
  <button class="btn icon ghost" data-a="dup" title="Dupliquer (Ctrl+D)" aria-label="Dupliquer">${ic('copy')}</button>
  <button class="btn icon ghost" data-a="del" title="Supprimer (Suppr)" aria-label="Supprimer">${ic('trash')}</button>
  <span class="div"></span>
  <button class="btn icon ghost ${S.magnet?'on':''}" data-a="magnet" title="Piste principale magnétique" aria-label="Magnétique">${ic('magnet')}</button>
  <button class="btn icon ghost ${S.snap?'on':''}" data-a="snap" title="Aimantation des bords" aria-label="Aimantation">${ic('snap')}</button>
  <span class="div"></span>
  <button class="btn ghost" data-a="addv" title="Ajouter une piste vidéo">${ic('layers')}<span class="hide-m">Piste</span></button>
  <button class="btn ghost" data-a="addt" title="Ajouter une piste texte">${ic('type')}<span class="hide-m">Piste</span></button>
  <button class="btn ghost" data-a="adda" title="Ajouter une piste audio">${ic('music')}<span class="hide-m">Piste</span></button>
  <span class="sp"></span>
  <button class="btn ghost show-nd" data-a="insp" title="Réglages du clip">${ic('sliders')}<span class="hide-m">Réglages</span></button>
  <button class="btn icon ghost" data-a="zout" aria-label="Dézoomer">${ic('zout')}</button>
  <input type="range" id="zoomR" min="${Math.log(8)}" max="${Math.log(400)}" step="0.01" value="${Math.log(S.pps)}" aria-label="Zoom timeline">
  <button class="btn icon ghost" data-a="zin" aria-label="Zoomer">${ic('zin')}</button>`;
}
$('#tlBar').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
  if(a==='split')splitAt();else if(a==='dup')duplicateSel();else if(a==='del')deleteSel();
  else if(a==='magnet'){S.magnet=!S.magnet;b.classList.toggle('on',S.magnet);if(S.magnet){packTrack(firstTrack('main'));commit();refreshAll()}toast(S.magnet?'Piste principale magnétique activée':'Piste principale libre')}
  else if(a==='snap'){S.snap=!S.snap;b.classList.toggle('on',S.snap)}
  else if(a==='addv'){addTrack('overlay');commit();refreshAll()}else if(a==='addt'){addTrack('text');commit();refreshAll()}else if(a==='adda'){addTrack('audio');commit();refreshAll()}
  else if(a==='insp'){$('#insp').classList.contains('open')?closeSheet('insp'):openInspector()}
  else if(a==='zin')setZoom(S.pps*1.3);else if(a==='zout')setZoom(S.pps/1.3)});
$('#tlBar').addEventListener('input',e=>{if(e.target.id==='zoomR')setZoom(Math.exp(+e.target.value))});
let delTrackArmed=0;function confirmSync(n){const now=Date.now();if(now-delTrackArmed<3000){delTrackArmed=0;return true}delTrackArmed=now;toast(`Cette piste contient ${n} clip(s). Cliquez à nouveau sur × pour la supprimer.`);return false}
function addMarker(t=S.t,label='',color='#F2A65E'){P.markers=P.markers||[];if(P.markers.some(m=>Math.abs(m.t-t)<.05))return;P.markers.push({t:+t.toFixed(3),label,color});P.markers.sort((a,b)=>a.t-b.t)}
tlBody.addEventListener('dblclick',e=>{const mk=e.target.closest('.mk');if(!mk)return;P.markers.splice(+mk.dataset.mk,1);commit();renderTimeline();toast('Marqueur supprimé')});
