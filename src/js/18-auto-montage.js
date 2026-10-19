/* ---------- auto montage ---------- */
async function autoMontage(){
  const ok=await confirmBox('Créer un montage automatique ?','Top Clap assemble vos photos et vidéos (ou les scènes de démo) avec mouvements de caméra, transitions, textes immobiliers et musique. La timeline actuelle est remplacée, vous pouvez annuler avec Ctrl+Z.','Créer le montage');if(!ok)return;
  pause();const vis=Object.values(media).filter(m=>m.type==='video'||m.type==='image');
  const items=vis.length?vis.slice(0,14):['villa','salon','facade','villa'].map(s=>({scene:s}));
  P.tracks=defaultTracks();P.clips=[];const [Tt,To,Tm,Ta]=P.tracks;
  const TR=['doors','fade','circle','push-l','dive','wipe-l','burn','blinds'],MO=['kb-in','drone','pan-l','kb-out','pan-r','tilt-up'];let t=0;
  items.forEach((it,i)=>{const kind=it.scene?'scene':it.type;const dur=kind==='video'?Math.min(it.dur||4,5):3.6;
    const c=newClip(kind,{mediaId:it.id,scene:it.scene,name:it.scene?SCENES[it.scene]:it.name,dur,filter:'clean',filterAmt:.7,fit:fitDefault(),fx:[{id:MO[i%MO.length],v:.75}]});
    if(i>0)c.trans={type:TR[(i-1)%TR.length],dur:.7};
    if(i===items.length-1&&kind!=='video'){c.immo.tw=1;c.immo.twAnim='in';c.dur=5.5}
    c.trackId=Tm.id;c.start=t;t+=c.dur;P.clips.push(c)});
  const total=t;
  const T=(tpl,start,dur,extra={})=>{const p=TEXT_TPL.find(x=>x.name===tpl).p;const c=newClip('text',{...p,start,dur,trackId:Tt.id,...extra});c.name=c.text.split('\n')[0].slice(0,28);P.clips.push(c)};
  T('Titre élégant',.4,Math.min(3.6,total*.25),{animOut:'fade',text:P.name+'\nVotre nouvelle adresse'});
  if(total>8)T('Prix',total*.3,Math.min(3.6,total*.2));
  if(total>12)T('Caractéristiques',total*.55,Math.min(3.8,total*.2));
  T('Contact',Math.max(0,total-3.4),3.4);
  const nv=newClip('text',{...TEXT_TPL.find(x=>x.name==='Nouveauté').p,start:.6,dur:Math.min(4,total*.3),trackId:To.id,name:'Nouveauté'});P.clips.push(nv);
  const mus=Object.values(media).find(m=>m.type==='audio'&&!m.demo)||ensureDemoMusic('ambient');
  P.clips.push(newClip('audio',{mediaId:mus.id,name:mus.name,trackId:Ta.id,start:0,dur:Math.min(total,mus.dur||total),fadeIn:.5,fadeOutA:2}));
  S.sel=null;S.t=0;commit();refreshAll();toast('Montage créé. Ctrl+Z pour revenir en arrière.');
}
