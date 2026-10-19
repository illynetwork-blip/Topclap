/* ---------- project state ---------- */
const DEF_ADJ=()=>({bright:0,contrast:0,sat:0,temp:0,tint:0,hue:0,vig:0,grain:0,fade:0});
const DEF_IMMO=()=>({tw:0,twAnim:'none',horizon:.62,sky:0,glow:0,hdr:0,gold:0,winter:0,compare:'off',splitPos:.5,parallax:0,parDir:'push'});
const DEF_GRADE=()=>({lift:[0,0,0],gamma:[0,0,0],gain:[0,0,0],wheels:{lift:[0,0,0],gamma:[0,0,0],gain:[0,0,0]},lut:null,lutAmt:1});
const DEF_KEY=()=>({on:false,color:'#00B140',tol:.16,soft:.1,spill:.6});
const DEF_MASK=()=>({type:'none',x:.5,y:.5,w:.6,h:.6,feather:.08,invert:false});
const DEF_TEXT=()=>({text:'Votre texte',font:'Montserrat',size:80,weight:700,italic:false,upper:false,color:'#FFFFFF',align:'center',lh:1.15,ls:0,sub:1,stroke:'#000000',sw:0,shadowColor:'rgba(0,0,0,.5)',shadowBlur:0,shadowY:0,bg:'#000000',bgA:0,pad:24,radius:12,animIn:'fade',inDur:.6,animOut:'fade',outDur:.4});
const DEF_CAPTION=()=>({words:[],style:'karaoke',font:'Montserrat',size:72,weight:900,color:'#FFFFFF',hl:'#FFD23F',stroke:'#000000',sw:8,upper:true,maxWords:3,bg:'#000000',bgA:0,y:.72});
const KF_PROPS=['x','y','scale','rot','opacity'];
function newClip(kind,o={}){
  const c={id:uid(),kind,trackId:null,start:0,dur:4,in:0,speed:1,name:'',x:.5,y:.5,scale:1,rot:0,opacity:1,blend:'source-over',fadeOut:0,fit:'cover',autofit:true,
    filter:'none',filterAmt:1,adj:DEF_ADJ(),immo:DEF_IMMO(),grade:DEF_GRADE(),key:DEF_KEY(),mask:DEF_MASK(),kf:{},fx:[],trans:{type:'none',dur:.6},
    volume:1,fadeIn:0,fadeOutA:0,role:'',duck:0,voiceFx:false};
  if(kind==='text')Object.assign(c,DEF_TEXT());
  if(kind==='caption')Object.assign(c,DEF_CAPTION());
  if(kind==='shape')Object.assign(c,{shape:'round',w:520,h:180,fill:'#F2A65E',stroke:'#FFFFFF',sw:0,label:'',labelColor:'#FFFFFF',font:'Montserrat'});
  if(kind==='color')Object.assign(c,{c1:'#141824',c2:'#2B3352',angle:135});
  if(kind==='adjust')Object.assign(c,{name:'Calque de réglage'});
  const {adj,immo,grade,key,mask,...rest}=o;Object.assign(c,rest);
  if(adj)Object.assign(c.adj,adj);if(immo)Object.assign(c.immo,immo);if(grade)Object.assign(c.grade,grade);if(key)Object.assign(c.key,key);if(mask)Object.assign(c.mask,mask);
  return c;
}
const DEF_INFO=()=>({type:'Villa',city:'Aix-en-Provence',area:'Quartier Mazarin',price:'1 250 000 €',surface:'260',rooms:'6',bedrooms:'5',baths:'4',land:'2 400',feats:['Piscine','Jardin','Terrasse','Garage'],dpe:'B',ref:''});
const DEF_BRAND=()=>({agency:'Votre agence',phone:'04 00 00 00 00',web:'',color:'#F2A65E',logo:null});
let P={name:'Villa Les Oliviers',aspect:'16:9',bg:'#000000',tracks:[],clips:[],markers:[],info:DEF_INFO(),brand:DEF_BRAND()};
const media={};      // id -> {id,type,name,url,el,dur,w,h,thumb,strip,wave,demo,depth,mono,beats}
const S={t:0,playing:false,sel:null,pps:60,magnet:true,snap:true,tab:'media',pq:.5,loop:false,exporting:false,guides:'none',scopes:false};
const bounds={};
let dirty=true;
const req=()=>{dirty=true};

function defaultTracks(){return [{id:uid(),kind:'text',name:'Textes'},{id:uid(),kind:'overlay',name:'Incrustations'},{id:uid(),kind:'main',name:'Principale'},{id:uid(),kind:'audio',name:'Musique'}]}
const trackOf=c=>P.tracks.find(t=>t.id===c.trackId);
const firstTrack=k=>P.tracks.find(t=>t.kind===k);
const clipById=id=>P.clips.find(c=>c.id===id);
const selClip=()=>S.sel?clipById(S.sel):null;
const isVisual=c=>c.kind!=='audio';
const isMedia=c=>['video','image','scene'].includes(c.kind);
const isGraphic=c=>['text','shape','caption'].includes(c.kind);
const projDur=()=>Math.max(1,...P.clips.map(c=>c.start+c.dur));
const trackEnd=tr=>Math.max(0,...P.clips.filter(c=>c.trackId===tr.id).map(c=>c.start+c.dur));
const baseWH=()=>ASPECTS[P.aspect]||ASPECTS['16:9'];
function mediaMax(c){const m=media[c.mediaId]; if((c.kind==='video'||c.kind==='audio')&&m&&isFinite(m.dur))return Math.max(.1,(m.dur-c.in)/c.speed); return Infinity}

/* keyframes: c.kf[prop] = [{t (local s), v, e:'ease'|'linear'|'hold'}] sorted by t */
function kv(c,prop,lt){
  const ks=c.kf&&c.kf[prop];if(!ks||!ks.length)return c[prop];
  if(lt<=ks[0].t)return ks[0].v;const last=ks[ks.length-1];if(lt>=last.t)return last.v;
  for(let i=0;i<ks.length-1;i++){const a=ks[i],b=ks[i+1];if(lt>=a.t&&lt<=b.t){if(a.e==='hold')return a.v;let p=(lt-a.t)/Math.max(1e-6,b.t-a.t);if(a.e!=='linear')p=ease.inOut(p);return a.v+(b.v-a.v)*p}}
  return c[prop];
}
const hasKf=(c,prop)=>!!(c.kf&&c.kf[prop]&&c.kf[prop].length);
function kfAt(c,prop,lt){const ks=c.kf&&c.kf[prop];return ks?ks.findIndex(k=>Math.abs(k.t-lt)<1/60):-1}
function setKf(c,prop,lt,v){c.kf=c.kf||{};const ks=c.kf[prop]||(c.kf[prop]=[]);const i=kfAt(c,prop,lt);if(i>=0)ks[i].v=v;else{ks.push({t:+lt.toFixed(3),v,e:'ease'});ks.sort((a,b)=>a.t-b.t)}}
function kfTimes(c){const s=new Set();for(const p in (c.kf||{}))(c.kf[p]||[]).forEach(k=>s.add(+k.t.toFixed(3)));return [...s].sort((a,b)=>a-b)}
function setProp(c,prop,v){if(hasKf(c,prop))setKf(c,prop,clamp(S.t-c.start,0,c.dur),v);else c[prop]=v}
