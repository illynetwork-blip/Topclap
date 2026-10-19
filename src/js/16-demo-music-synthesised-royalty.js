/* ---------- demo music (synthesised, royalty-free) ---------- */
function synthMusic(kind){
  const sr=22050,dur=32,n=sr*dur,d=new Float32Array(n);const f=m=>440*Math.pow(2,(m-69)/12);
  const ch=kind==='pulse'?[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]:[[57,60,64,67],[53,57,60,64],[48,52,55,59],[55,59,62,65]];
  const bar=kind==='pulse'?2.4:4,beat=60/100;
  for(let i=0;i<n;i++){const t=i/sr,ci=Math.floor(t/bar)%4,lt=t%bar,env=Math.min(1,lt/.7)*Math.min(1,(bar-lt)/.5);let s=0;
    for(const m of ch[ci]){const fr=f(m);s+=Math.sin(6.2832*fr*t)*.5+Math.sin(6.2832*fr*2.003*t)*.1}
    s*=env*.085;s+=Math.sin(6.2832*f(ch[ci][0]-12)*t)*.13*env;
    if(kind==='pulse'){const bt=t%beat;s+=Math.sin(6.2832*(48+90*Math.exp(-bt*30))*bt)*Math.exp(-bt*9)*.55;const ht=(t+beat/2)%beat;s+=(rnd(i)*2-1)*Math.exp(-ht*70)*.09}
    else{const step=bar/8,k=Math.floor(lt/step),at=lt%step,m=ch[ci][k%ch[ci].length]+12;s+=Math.sin(6.2832*f(m)*t)*Math.exp(-at*3.2)*.07}
    d[i]=s*Math.min(1,t/1.5)*Math.min(1,(dur-t)/2.5)}
  let mx=0;for(let i=0;i<n;i++)mx=Math.max(mx,Math.abs(d[i]));for(let i=0;i<n;i++)d[i]=d[i]/mx*.8;
  const buf=new ArrayBuffer(44+n*2),dv=new DataView(buf);const ws=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i))};
  ws(0,'RIFF');dv.setUint32(4,36+n*2,true);ws(8,'WAVE');ws(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,sr,true);dv.setUint32(28,sr*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);ws(36,'data');dv.setUint32(40,n*2,true);
  for(let i=0;i<n;i++)dv.setInt16(44+i*2,clamp(d[i],-1,1)*32767,true);
  return {blob:new Blob([buf],{type:'audio/wav'}),data:d,dur};
}
const DEMO_MUSIC={ambient:'Ambiance douce',pulse:'Pulse moderne'};
function ensureDemoMusic(kind,id){
  const ex=Object.values(media).find(m=>m.demo===kind);if(ex)return ex;
  const r=synthMusic(kind);id=id||('demo-'+kind);const url=URL.createObjectURL(r.blob);
  media[id]={id,type:'audio',name:DEMO_MUSIC[kind],demo:kind,url,blob:r.blob,dur:r.dur,wave:waveImg(r.data)};return media[id];
}
