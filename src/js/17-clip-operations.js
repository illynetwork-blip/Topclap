/* ---------- clip operations ---------- */
function placeOnTrack(c,tr,start){c.trackId=tr.id;c.start=Math.max(0,start);P.clips.push(c)}
function addMediaToTimeline(m,doCommit=true){
  if(m.type==='audio'){const tr=firstTrack('audio')||addTrack('audio');const c=newClip('audio',{mediaId:m.id,name:m.name,dur:Math.min(m.dur||10,Math.max(projDur(),m.dur>0?Math.min(m.dur,60):10))});placeOnTrack(c,tr,trackEnd(tr)>0?S.t:0);if(c.dur>m.dur)c.dur=m.dur;S.sel=c.id}
  else{const tr=firstTrack('main')||addTrack('main');const c=newClip(m.type,{mediaId:m.id,name:m.name,dur:m.type==='video'?Math.min(m.dur||5,60):4,filter:'clean',filterAmt:.6,fit:fitDefault()});if(m.type==='image')c.fx=[{id:'kb-in',v:.7}];placeOnTrack(c,tr,trackEnd(tr));S.sel=c.id}
  if(doCommit){commit();refreshAll()}
}
const fitDefault=()=>P.aspect==='16:9'?'cover':'blurfill';
function addScene(k){const tr=firstTrack('main')||addTrack('main');const c=newClip('scene',{scene:k,name:SCENES[k],dur:5,filter:'clean',filterAmt:.6,fx:[{id:'kb-in',v:.7}],fit:fitDefault()});placeOnTrack(c,tr,trackEnd(tr));select(c.id,false);commit();refreshAll();toast(`« ${SCENES[k]} » ajoutée`)}
function addColor(c1,c2,name){const tr=firstTrack('main')||addTrack('main');const c=newClip('color',{c1,c2,name,dur:3});placeOnTrack(c,tr,trackEnd(tr));select(c.id,false);commit();refreshAll()}
function addText(props={},name){const tr=firstTrack('text')||addTrack('text');const c=newClip('text',{dur:3.5,...props});c.name=name||c.text.split('\n')[0].slice(0,28);placeFree(c,tr);select(c.id,false);commit();refreshAll();if(isPhone())openInspector();return c}
function addShape(shape){const presets={stamp:{w:520,h:200,fill:'#D8433B',label:'VENDU',rot:-12},ribbon:{w:620,h:90,fill:'#D8433B',label:'EXCLUSIVITÉ',rot:-35,x:.14,y:.17},tag:{w:420,h:150,fill:'#F4EFE6',label:'485 000 €',labelColor:'#1C1B19'},pin:{w:120,h:170,fill:'#E5604F'},house:{w:180,h:170,fill:'#FFFFFF'},lowerbar:{w:900,h:120,fill:'#11131A',label:'Quartier Mazarin · 5 min du centre',labelColor:'#FFFFFF',x:.38,y:.82},line:{w:600,h:60,fill:'#FFFFFF'},arrow:{w:360,h:120,fill:'#6C5CE7'},frame:{w:1600,h:860,fill:'#FFFFFF',sw:10},circle:{w:260,h:260,fill:'#6C5CE7'},rect:{w:600,h:300,fill:'#11131A'},round:{w:560,h:200,fill:'#6C5CE7',label:'NOUVEAU',labelColor:'#FFFFFF'}};
  const tr=firstTrack('overlay')||addTrack('overlay');const c=newClip('shape',{shape,dur:3.5,name:SHAPES.find(s=>s[0]===shape)[1],...(presets[shape]||{})});c.trans={type:'zoom-in',dur:.4};placeFree(c,tr);select(c.id,false);commit();refreshAll()}
function placeFree(c,tr){let s=S.t;const busy=P.clips.filter(o=>o.trackId===tr.id);const clash=o=>s<o.start+o.dur-.01&&s+c.dur>o.start+.01;
  if(busy.some(clash)){const nt={id:uid(),kind:tr.kind,name:tr.kind==='text'?'Textes '+(P.tracks.filter(x=>x.kind==='text').length+1):'Incrustations '+(P.tracks.filter(x=>x.kind==='overlay').length+1)};P.tracks.splice(P.tracks.indexOf(tr),0,nt);tr=nt}
  placeOnTrack(c,tr,s)}
function addTrack(kind){const names={main:'Vidéo',overlay:'Incrustations',text:'Textes',audio:'Audio'};const tr={id:uid(),kind:kind==='main'&&firstTrack('main')?'overlay':kind,name:names[kind]+' '+(P.tracks.filter(t=>t.kind===kind).length+1)};
  if(tr.kind==='audio')P.tracks.push(tr);else P.tracks.unshift(tr);return tr}
function packTrack(tr){if(!tr||tr.kind!=='main'||!S.magnet)return;let t=0;P.clips.filter(c=>c.trackId===tr.id).sort((a,b)=>a.start-b.start).forEach(c=>{c.start=t;t+=c.dur})}
function splitAt(){
  let c=selClip();const t=S.t;
  if(!c||!(t>c.start+.05&&t<c.start+c.dur-.05)){c=P.clips.find(o=>{const tr=trackOf(o);return tr&&tr.kind==='main'&&t>o.start+.05&&t<o.start+o.dur-.05})}
  if(!c){toast('Placez la tête de lecture sur un clip pour le couper');return}
  const b=JSON.parse(JSON.stringify(c));b.id=uid();b.start=t;b.in=c.in+(t-c.start)*c.speed;b.dur=c.start+c.dur-t;b.trans={type:'none',dur:.6};
  const off=t-c.start;if(b.kf)for(const p in b.kf){const ks=b.kf[p];const v0=kv(c,p,off);b.kf[p]=[{t:0,v:v0,e:'ease'},...ks.filter(k=>k.t>off+.01).map(k=>({...k,t:+(k.t-off).toFixed(3)}))]}
  if(c.kind==='caption'){b.words=c.words.filter(w=>w.e>off).map(w=>({...w,s:Math.max(0,w.s-off),e:w.e-off}));c.words=c.words.filter(w=>w.s<off);c._g=null;b._g=null}
  c.dur=t-c.start;if(c.kind==='text'){c.animOut='none';b.animIn='none'}
  P.clips.push(b);S.sel=b.id;commit();refreshAll();toast('Clip coupé')
}
function deleteSel(){const c=selClip();if(!c)return;P.clips=P.clips.filter(o=>o!==c);const e=els[c.id];if(e)e.pause();S.sel=null;packTrack(trackOf(c)||P.tracks.find(t=>t.id===c.trackId));commit();refreshAll()}
function duplicateSel(){const c=selClip();if(!c)return;const b=JSON.parse(JSON.stringify(c));b.id=uid();const tr=trackOf(c);
  if(tr.kind==='main'){P.clips.filter(o=>o.trackId===tr.id&&o.start>=c.start+c.dur-.01).forEach(o=>o.start+=c.dur);b.start=c.start+c.dur}else b.start=c.start+c.dur;
  P.clips.push(b);S.sel=b.id;packTrack(tr);commit();refreshAll()}
function select(id,refresh=true){S.sel=id;if(refresh){renderTimelineSel();renderInspector();if(S.tab==='trans'||S.tab==='filters'||S.tab==='fx')renderPanel()}req()}
