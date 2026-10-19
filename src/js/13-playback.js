/* ---------- playback ---------- */
let lastNow=0,scopeTick=0;
function play(){if(S.playing)return;ensureAudio();if(S.t>=projDur()-.02)S.t=0;S.playing=true;lastNow=performance.now();updateTransport()}
function pause(){S.rate=1;if(!S.playing)return;S.playing=false;pauseAll();updateTransport();req()}
function togglePlay(){S.playing?pause():play()}
function setTime(t){S.t=clamp(t,0,projDur());if(S.playing){syncMedia(S.t,true)}req();inspFollow()}
function tick(now){
  if(S.playing){const dt=Math.min(.1,(now-lastNow)/1000);lastNow=now;S.t+=dt*(S.exporting?1:(S.rate||1));const d=projDur();
    if(S.t>=d){if(S.exporting){S.t=d;finishExport()}else if(S.loop){S.t=0;pauseAll()}else{S.t=d;pause()}}
    syncMedia(S.t,S.playing);dirty=true}
  if(dirty){dirty=false;if(!S.playing)syncMedia(S.t,false);renderFrame(S.t);updateSelBox();updateClock()}
  if(S.tab==='trans'&&transPreviews.length)drawTransPreviews(now);
  if(S.scopes&&(++scopeTick%6===0))drawScopes();
  requestAnimationFrame(tick);
}
function updateClock(){
  $('#tc').innerHTML=`<b>${fmtT(S.t)}</b> / ${fmtT(projDur())}`;
  const ph=$('#tlPh');if(ph){ph.style.left=(S.t*S.pps)+'px';
    if(S.playing){const sc=$('#tlScroll'),x=S.t*S.pps+96;if(x>sc.scrollLeft+sc.clientWidth-60||x<sc.scrollLeft+96)sc.scrollLeft=x-140}}
}
function updateTransport(){$('#playBtn').innerHTML=ic(S.playing?'pause':'play','f');$('#playBtn').setAttribute('aria-label',S.playing?'Pause':'Lecture')}
