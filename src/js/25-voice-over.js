/* ---------- voice over ---------- */
let voiceRec=null;
async function recordVoice(){
  const btn=$('#recBtn');
  if(voiceRec){voiceRec.stop();return}
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const chunks=[];voiceRec=new MediaRecorder(stream);voiceRec.ondataavailable=e=>chunks.push(e.data);
    voiceRec.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());voiceRec=null;const blob=new Blob(chunks,{type:chunks[0]?.type||'audio/webm'});const id=uid();const m=await registerMedia(id,blob,{type:'audio',name:'Voix off '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});IDB.put(id,blob);
      const tr=P.tracks.find(t=>t.kind==='audio'&&t.name.startsWith('Voix'))||(()=>{const t={id:uid(),kind:'audio',name:'Voix off'};P.tracks.push(t);return t})();const c=newClip('audio',{mediaId:id,name:m.name,dur:m.dur||3});placeOnTrack(c,tr,S.t);commit();refreshAll();toast('Voix off ajoutée')};
    voiceRec.start();if(btn)btn.innerHTML=ic('pause')+'Arrêter l\'enregistrement';toast('Enregistrement en cours…');
  }catch(e){toast('Micro inaccessible dans cette fenêtre. Autorisez le micro ou ouvrez l\'appli hébergée.')}
}
