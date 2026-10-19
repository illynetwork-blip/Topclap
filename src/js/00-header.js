/* =========================================================================
   Top Clap — éditeur vidéo open source (MIT)
   Un seul fichier : rendu Canvas 2D + WebGL, export MediaRecorder.
   ========================================================================= */
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,10);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease={inOut:p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2,out:p=>1-Math.pow(1-p,3),in:p=>p*p*p,back:p=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2)}};
const rnd=n=>{const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x)};
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const fmtT=t=>{t=Math.max(0,t);const m=Math.floor(t/60),s=t-m*60;return String(m).padStart(2,'0')+':'+s.toFixed(2).padStart(5,'0')};
const isPhone=()=>matchMedia('(max-width:759px)').matches;
const isDesk=()=>matchMedia('(min-width:1200px)').matches;
