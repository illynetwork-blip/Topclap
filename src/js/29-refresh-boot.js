/* ---------- refresh & boot ---------- */
function refreshAll(){renderTimeline();renderInspector();renderPanel();updUndo();renderGuides();req()}
async function boot(){
  renderRail();renderTlBar();updateTransport();stageBox.appendChild(scopeBox);$('#scopeX').innerHTML=ic('x');S.capStyle='karaoke';
  let st=projStore();
  if(!st.list){try{const old=JSON.parse(localStorage.getItem(LS_KEY)||'null');if(old&&old.P){const id=uid();st={current:id,list:{[id]:{name:old.P.name,updated:Date.now(),aspect:old.P.aspect,P:old.P}},media:old.media,S:old.S}}}catch(e){}}
  for(const m of st.media||[]){if(m.demo){ensureDemoMusic(m.demo,m.id);continue}const blob=await IDB.get(m.id);if(blob){try{await registerMedia(m.id,blob,{type:m.type,name:m.name})}catch(e){}}}
  const cur=st.list&&st.current&&st.list[st.current];
  if(cur&&cur.P&&cur.P.clips){
    curProj=st.current;Object.assign(P,cur.P);normalizeProject();const before=P.clips.length;P.clips=P.clips.filter(c=>!c.mediaId||media[c.mediaId]);
    if(st.S){S.pps=st.S.pps||60;S.magnet=st.S.magnet!==false;S.snap=st.S.snap!==false}
    if(before!==P.clips.length)setTimeout(()=>toast('Certains médias n\'ont pas été retrouvés : réimportez-les.'),800);
    if(!P.clips.length&&!before)buildDemo();
  }else{curProj=uid();buildDemo()}
  if(isPhone()){S.pq=.4;S.pps=40}
  $('#aspectSel').value=P.aspect;$('#projName').value=P.name;setRes(S.pq);renderTlBar();
  commit();refreshAll();
  if(document.fonts){document.fonts.addEventListener&&document.fonts.addEventListener('loadingdone',req);document.fonts.ready.then(req)}
  requestAnimationFrame(tick);
  const hsh=location.hash.replace('#','');
  if(hsh==='assistant')openAssistant();else if(hsh==='nouveau'){newProjectBlank()}else if(startPref())openStart();
}
addEventListener('resize',()=>{fitViewport();renderTimeline()});
boot();
