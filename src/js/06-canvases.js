/* ---------- canvases ---------- */
const cv=$('#cv'),ctx=cv.getContext('2d');
const L1=document.createElement('canvas'),L2=document.createElement('canvas');
const hasFilter='filter' in ctx;
function setRes(scale){const [bw,bh]=baseWH();const w=Math.round(bw*scale/2)*2,h=Math.round(bh*scale/2)*2;for(const c of [cv,L1,L2]){c.width=w;c.height=h}fitViewport();req()}
