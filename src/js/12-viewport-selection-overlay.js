/* ---------- viewport & selection overlay ---------- */
const viewport=$('#viewport'),stageBox=$('#stageBox'),selBox=$('#selBox');
function fitViewport(){
  const r=stageBox.getBoundingClientRect();const pad=isPhone()?20:28;const [bw,bh]=baseWH();
  const k=Math.min((r.width-pad)/bw,(r.height-pad)/bh);if(!(k>0))return;
  viewport.style.width=Math.floor(bw*k)+'px';viewport.style.height=Math.floor(bh*k)+'px';
}
new ResizeObserver(()=>{fitViewport();req()}).observe(stageBox);
function updateSelBox(){
  const c=selClip(),b=c&&bounds[c.id];
  if(!b||S.exporting||!isVisual(c)||c.kind==='color'){selBox.style.display='none';return}
  const k=viewport.clientWidth/cv.width;
  selBox.style.display='block';selBox.style.width=Math.max(8,b.w*k)+'px';selBox.style.height=Math.max(8,b.h*k)+'px';
  selBox.style.left=(b.cx*k-b.w*k/2)+'px';selBox.style.top=(b.cy*k-b.h*k/2)+'px';selBox.style.transform=`rotate(${b.rot}rad)`;
}
function hitTest(px,py){
  const order=P.tracks.filter(tr=>tr.kind!=='audio'&&!tr.hidden);
  for(const tr of order){const cs=P.clips.filter(c=>c.trackId===tr.id&&S.t>=c.start&&S.t<c.start+c.dur&&c.kind!=='color');
    for(const c of cs.reverse()){const b=bounds[c.id];if(!b)continue;const dx=px-b.cx,dy=py-b.cy,co=Math.cos(-b.rot),si=Math.sin(-b.rot);const lx=dx*co-dy*si,ly=dx*si+dy*co;if(Math.abs(lx)<=b.w/2&&Math.abs(ly)<=b.h/2)return c}}
  return null;
}
viewport.addEventListener('pointerdown',e=>{
  const r=cv.getBoundingClientRect(),k=cv.width/r.width;const px=(e.clientX-r.left)*k,py=(e.clientY-r.top)*k;
  const h=e.target.dataset&&e.target.dataset.h;let c=h?selClip():hitTest(px,py);
  if(!c){select(null);return}
  if(!h&&c.id!==S.sel)select(c.id);
  pause();
  const b=bounds[c.id]||{cx:c.x*cv.width,cy:c.y*cv.height};const lt0=S.t-c.start;const st={x:kv(c,'x',lt0),y:kv(c,'y',lt0),scale:kv(c,'scale',lt0),rot:kv(c,'rot',lt0),px,py,d0:Math.hypot(px-b.cx,py-b.cy)||1,a0:Math.atan2(py-b.cy,px-b.cx)};
  let moved=false;
  const mv=ev=>{const qx=(ev.clientX-r.left)*k,qy=(ev.clientY-r.top)*k;
    if(!moved&&Math.hypot(qx-px,qy-py)<3)return;moved=true;
    if(h==='sc'){setProp(c,'scale',clamp(st.scale*Math.hypot(qx-b.cx,qy-b.cy)/st.d0,.05,8))}
    else if(h==='ro'){let a=st.rot+(Math.atan2(qy-b.cy,qx-b.cx)-st.a0)*180/Math.PI;for(const s of [-180,-90,0,90,180])if(Math.abs(a-s)<4)a=s;setProp(c,'rot',Math.round(((a+540)%360)-180))}
    else{let nx=st.x+(qx-px)/cv.width,ny=st.y+(qy-py)/cv.height;if(Math.abs(nx-.5)<.01)nx=.5;if(Math.abs(ny-.5)<.01)ny=.5;setProp(c,'x',nx);setProp(c,'y',ny)}
    req();};
  const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);if(moved){commit();renderInspector()}};
  window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  e.preventDefault();
});
viewport.addEventListener('dblclick',()=>{const c=selClip();if(c&&c.kind==='text'){openInspector();setTimeout(()=>{const ta=$('#inspBody textarea');if(ta){ta.focus();ta.select()}},60)}});

/* guides: safe zones for Reels/TikTok/Shorts, rule of thirds */
const guideEl=document.createElement('div');guideEl.id='guides';viewport.appendChild(guideEl);
function renderGuides(){
  const g=S.guides;if(g==='none'){guideEl.innerHTML='';return}
  let h='';
  if(g==='thirds'||g==='both')h+='<i class="gd-v" style="left:33.33%"></i><i class="gd-v" style="left:66.66%"></i><i class="gd-h" style="top:33.33%"></i><i class="gd-h" style="top:66.66%"></i>';
  if(g==='safe'||g==='both'){if(P.aspect==='9:16')h+='<b class="gd-z" style="left:0;right:0;top:0;height:12%">Zone masquée (en-tête)</b><b class="gd-z" style="left:0;right:0;bottom:0;height:22%">Légende, boutons, compte</b><b class="gd-z" style="right:0;top:42%;width:13%;bottom:22%">Actions</b>';
    else h+='<b class="gd-s" style="inset:5%"></b><b class="gd-s" style="inset:10%;border-style:dotted"></b>'}
  guideEl.innerHTML=h;
}
