/* ---------- media import ---------- */
const once=(el,ev,ms=8000)=>new Promise(res=>{let done=false;const f=()=>{if(!done){done=true;res()}};el.addEventListener(ev,f,{once:true});el.addEventListener('error',f,{once:true});setTimeout(f,ms)});
async function registerMedia(id,blob,meta){
  if(meta.type==='lut'){try{const {n,data}=parseCube(await blob.text());LUTS[id]={id,name:meta.name,n,data};media[id]={...meta,id,blob}}catch(e){}return media[id]}
  const url=URL.createObjectURL(blob);const m={...meta,id,url,blob};media[id]=m;
  if(m.type==='image'){const img=new Image();img.src=url;try{await img.decode()}catch(e){await once(img,'load')}m.el=img;m.w=img.naturalWidth;m.h=img.naturalHeight;m.thumb=thumbOf(img).toDataURL('image/jpeg',.8)}
  else if(m.type==='video'){const v=document.createElement('video');v.muted=true;v.preload='auto';v.playsInline=true;v.src=url;await once(v,'loadeddata');
    if(!isFinite(v.duration)){v.currentTime=1e7;await once(v,'seeked',3000);v.currentTime=0;await once(v,'seeked',3000)}
    m.dur=isFinite(v.duration)?v.duration:10;m.w=v.videoWidth;m.h=v.videoHeight;m.thumb=thumbOf(v).toDataURL('image/jpeg',.75);genStrip(m,v)}
  else if(m.type==='audio'){const a=document.createElement('audio');a.preload='metadata';a.src=url;await once(a,'loadedmetadata');m.dur=isFinite(a.duration)?a.duration:30;
    try{const buf=await blob.arrayBuffer();const oc=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,44100,44100);const ab=await oc.decodeAudioData(buf);m.dur=ab.duration;m.wave=waveImg(ab.getChannelData(0))}catch(e){}}
  renderPanelIf('media','audio');return m;
}
async function genStrip(m,v){
  const n=10,fw=96,fh=54;const c=document.createElement('canvas');c.width=n*fw;c.height=fh;const g=c.getContext('2d');
  for(let i=0;i<n;i++){v.currentTime=Math.min(m.dur-.05,(i+.5)/n*m.dur);await once(v,'seeked',2500);try{const r=Math.max(fw/v.videoWidth,fh/v.videoHeight);g.drawImage(v,i*fw+(fw-v.videoWidth*r)/2,(fh-v.videoHeight*r)/2,v.videoWidth*r,v.videoHeight*r)}catch(e){}}
  m.strip=c.toDataURL('image/jpeg',.7);renderTimeline();
}
function waveImg(data){const n=600,c=document.createElement('canvas');c.width=n;c.height=48;const g=c.getContext('2d');const step=Math.max(1,Math.floor(data.length/n));g.fillStyle='rgba(200,255,235,.75)';
  let mx=0.0001;const pk=[];for(let i=0;i<n;i++){let p=0;for(let j=i*step;j<(i+1)*step&&j<data.length;j+=4)p=Math.max(p,Math.abs(data[j]));pk.push(p);mx=Math.max(mx,p)}
  pk.forEach((p,i)=>{const h=Math.max(1,p/mx*44);g.fillRect(i,24-h/2,1,h)});return c.toDataURL()}
function kindOfFile(f){const t=f.type||'',n=f.name.toLowerCase();if(t.startsWith('video')||/\.(mp4|webm|mov|m4v|mkv)$/.test(n))return'video';if(t.startsWith('image')||/\.(png|jpe?g|webp|gif|avif|bmp)$/.test(n))return'image';if(t.startsWith('audio')||/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(n))return'audio';if(/\.(srt|vtt)$/.test(n))return'srt';if(/\.cube$/.test(n))return'lut';if(/\.json$/.test(n))return'project';return null}
async function importFiles(files){
  let added=0;
  for(const f of files){const k=kindOfFile(f);
    if(k==='srt'){importSRT(await f.text(),S.capStyle||'karaoke');continue}
    if(k==='lut'){await importLUTFile(f);continue}
    if(k==='project'){openProjectText(await f.text());continue}
    if(!k){toast(`Format non pris en charge : ${f.name}`);continue}
    const id=uid();toast(`Import de ${f.name}…`);
    const m=await registerMedia(id,f,{type:k,name:f.name});IDB.put(id,f);addMediaToTimeline(m,false);added++;
  }
  if(added){commit();refreshAll();toast(added>1?`${added} médias ajoutés à la timeline`:'Média ajouté à la timeline')}
}
