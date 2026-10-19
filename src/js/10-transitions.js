/* ---------- transitions ---------- */
function compose(g,type,A,B,p,W,H,al=1){
  g.save();const e=ease.inOut(p);
  const dA=(x=0,y=0,a=1)=>{if(A){g.globalAlpha=a;g.drawImage(A,x,y)}};
  const dB=(x=0,y=0,a=1)=>{g.globalAlpha=a*al;g.drawImage(B,x,y)};
  const scaled=(cv2,s,a,r=0,isB=false)=>{if(!cv2)return;g.save();g.globalAlpha=a*(isB?al:1);g.translate(W/2,H/2);g.rotate(r);g.scale(s,s);g.drawImage(cv2,-W/2,-H/2);g.restore()};
  switch(type){
    case'fade':dA();dB(0,0,e);break;
    case'black':case'white':{const col=type==='black'?'#000':'#fff';if(A){if(p<.5){dA();g.globalAlpha=e*2>1?1:p*2;g.fillStyle=col;g.fillRect(0,0,W,H)}else{dB();g.globalAlpha=(1-p)*2;g.fillStyle=col;g.fillRect(0,0,W,H)}}else{g.fillStyle=col;g.globalAlpha=1-e;g.fillRect(0,0,W,H);dB(0,0,e)}break}
    case'slide-l':dA();dB(W*(1-e),0);break;case'slide-r':dA();dB(-W*(1-e),0);break;case'slide-u':dA();dB(0,H*(1-e));break;
    case'push-l':dA(-W*e,0);dB(W*(1-e),0);break;
    case'wipe-l':dA();g.beginPath();g.rect(W*(1-e),0,W*e+1,H);g.clip();dB();break;
    case'wipe-d':dA();g.beginPath();g.rect(0,0,W,H*e+1);g.clip();dB();break;
    case'zoom-in':dA();scaled(B,.55+.45*e,e,0,true);break;
    case'zoom-out':dB();scaled(A,1+e*.6,1-e);break;
    case'dive':scaled(A,1+e*1.8,1-ease.in(p));scaled(B,.82+.18*e,ease.out(p),0,true);break;
    case'circle':{dA();g.beginPath();g.arc(W/2,H/2,Math.hypot(W,H)/2*e+1,0,7);g.clip();dB();break}
    case'diamond':{dA();const r=(W+H)*.55*e;g.beginPath();g.moveTo(W/2,H/2-r);g.lineTo(W/2+r,H/2);g.lineTo(W/2,H/2+r);g.lineTo(W/2-r,H/2);g.closePath();g.clip();dB();break}
    case'blinds':{dA();const n=8,sw=W/n;g.beginPath();for(let i=0;i<n;i++)g.rect(i*sw,0,sw*e+.5,H);g.clip();dB();break}
    case'doors':{dB();if(A){g.save();g.beginPath();g.rect(0,0,W/2,H);g.clip();g.drawImage(A,-W/2*e,0);g.restore();g.save();g.beginPath();g.rect(W/2,0,W/2,H);g.clip();g.drawImage(A,W/2*e,0);g.restore();g.globalAlpha=.35*(1-Math.abs(p-.5)*2);g.fillStyle='#000';g.fillRect(W/2-W/2*e-3,0,6,H);g.fillRect(W/2+W/2*e-3,0,6,H)}break}
    case'curtain':dB();if(A)dA(0,-H*e);break;
    case'blur':{if(hasFilter){if(A){g.filter=`blur(${(e*24*W/1920).toFixed(1)}px)`;dA(0,0,1)}g.filter=`blur(${((1-e)*24*W/1920).toFixed(1)}px)`;dB(0,0,e);g.filter='none'}else{dA();dB(0,0,e)}break}
    case'whip':{const b=Math.sin(p*Math.PI)*36*W/1920;if(hasFilter)g.filter=`blur(${b.toFixed(1)}px)`;dA(-W*e,0);dB(W*(1-e),0);g.filter='none';break}
    case'spin':dA();scaled(B,e,e,(1-e)*-Math.PI,true);break;
    case'glitch':{const src=p<.5?A:B;if(!src){dB(0,0,e);break}const amp=Math.sin(p*Math.PI)*W*.06,seed=Math.floor(p*30);for(let i=0;i<16;i++){const y=i*H/16,h=H/16+1,dx=(rnd(seed*17+i)-.5)*amp*2;g.globalAlpha=src===B?al:1;g.drawImage(src,0,y,W,h,dx,y,W,h)}break}
    case'burn':{dA();dB(0,0,e);g.globalCompositeOperation='screen';const k=Math.sin(p*Math.PI);const gr=g.createRadialGradient(W*(.3+.4*p),H*.5,0,W*(.3+.4*p),H*.5,Math.max(W,H)*.8);gr.addColorStop(0,`rgba(255,200,120,${k})`);gr.addColorStop(.5,`rgba(255,90,40,${k*.6})`);gr.addColorStop(1,'rgba(120,20,0,0)');g.globalAlpha=1;g.fillStyle=gr;g.fillRect(0,0,W,H);break}
    case'flash':dA();dB(0,0,e);g.globalAlpha=Math.sin(p*Math.PI);g.fillStyle='#fff';g.fillRect(0,0,W,H);break;
    default:dB();
  }
  g.restore();
}
