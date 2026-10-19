/* ---------- transition previews ---------- */
const TPA=document.createElement('canvas'),TPB=document.createElement('canvas');TPA.width=TPB.width=160;TPA.height=TPB.height=90;
TPA.getContext('2d').drawImage(SCN.villa,0,0,160,90);TPB.getContext('2d').drawImage(SCN.salon,0,0,160,90);
function drawTransPreviews(now){const p=((now/1000)%2.2)/1.6;const pp=clamp(p);for(const cn of transPreviews){const g=cn.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.filter='none';g.globalCompositeOperation='source-over';g.fillStyle='#000';g.fillRect(0,0,160,90);if(cn.dataset.tp==='none'){g.drawImage(pp<.5?TPA:TPB,0,0)}else compose(g,cn.dataset.tp,TPA,TPB,pp,160,90,1)}}
