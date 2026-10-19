/* ---------- demo project ---------- */
function buildDemo(){
  P.name='Villa Les Oliviers';$('#projName').value=P.name;P.tracks=defaultTracks();P.clips=[];const [Tt,To,Tm,Ta]=P.tracks;
  const add=(c,tr,start)=>{c.trackId=tr.id;c.start=start;P.clips.push(c);return c};
  add(newClip('scene',{scene:'villa',name:'Villa piscine',dur:5,filter:'clean',filterAmt:.8,fx:[{id:'kb-in',v:.8}]}),Tm,0);
  add(newClip('scene',{scene:'salon',name:'Salon lumineux',dur:4.5,filter:'luxe',filterAmt:.6,fx:[{id:'drone',v:.6}],trans:{type:'doors',dur:.8}}),Tm,5);
  add(newClip('scene',{scene:'villa',name:'Villa — le soir',dur:6,fx:[{id:'kb-out',v:.6}],immo:{tw:1,twAnim:'in'},trans:{type:'fade',dur:1}}),Tm,9.5);
  add(newClip('scene',{scene:'facade',name:'Façade de nuit',dur:4.5,fx:[{id:'pan-l',v:.7}],immo:{tw:.9,glow:.4},trans:{type:'circle',dur:.7}}),Tm,15.5);
  const T=(tpl,start,dur,extra={})=>{const p=TEXT_TPL.find(x=>x.name===tpl).p;const c=newClip('text',{...p,dur,...extra});c.name=c.text.split('\n')[0].slice(0,28);return add(c,Tt,start)};
  T('Titre élégant',.4,4,{animOut:'fade'});T('Prix',5.6,3.6);T('Caractéristiques',10.2,4.6);T('Contact',16.2,3.8);
  add(newClip('text',{...TEXT_TPL.find(x=>x.name==='Nouveauté').p,dur:4,name:'Nouveauté'}),To,.8);
  const m=ensureDemoMusic('ambient');add(newClip('audio',{mediaId:m.id,name:m.name,dur:20,fadeIn:.5,fadeOutA:2}),Ta,0);
  S.t=1.6;S.sel=null;
}
function normalizeProject(){
  if(!ASPECTS[P.aspect])P.aspect='16:9';if(!Array.isArray(P.tracks)||!P.tracks.length)P.tracks=defaultTracks();P.markers=P.markers||[];P.info={...DEF_INFO(),...(P.info||{})};P.brand={...DEF_BRAND(),...(P.brand||{})};
  P.clips=(P.clips||[]).map(c=>{const d=newClip(c.kind);const gr={...DEF_GRADE(),...(c.grade||{})};gr.wheels={...DEF_GRADE().wheels,...(gr.wheels||{})};return Object.assign(d,c,{adj:{...DEF_ADJ(),...(c.adj||{})},immo:{...DEF_IMMO(),...(c.immo||{})},grade:gr,key:{...DEF_KEY(),...(c.key||{})},mask:{...DEF_MASK(),...(c.mask||{})},kf:c.kf||{},trans:{type:'none',dur:.6,...(c.trans||{})},fx:c.fx||[]})}).filter(c=>P.tracks.some(t=>t.id===c.trackId));
}
