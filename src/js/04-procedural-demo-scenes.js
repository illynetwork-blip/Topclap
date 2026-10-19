/* ---------- procedural demo scenes ---------- */
function rr(g,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function lg(g,x0,y0,x1,y1,stops){const gr=g.createLinearGradient(x0,y0,x1,y1);stops.forEach(([o,c])=>gr.addColorStop(o,c));return gr}
function cloud(g,x,y,s){g.save();g.fillStyle='rgb(250,252,255)';[[0,0,1],[.9,-.25,.8],[1.7,.05,.7],[-.8,.1,.7],[.4,-.45,.75]].forEach(([dx,dy,r])=>{g.beginPath();g.ellipse(x+dx*60*s,y+dy*60*s,70*s*r,48*s*r,0,0,7);g.fill()});g.restore()}
function tree(g,x,y,s,col){g.fillStyle='rgb(92,70,52)';g.fillRect(x-8*s,y-90*s,16*s,90*s);g.fillStyle=col;[[0,-150,70],[-50,-120,55],[50,-118,58],[-20,-190,50],[30,-175,48]].forEach(([dx,dy,r])=>{g.beginPath();g.arc(x+dx*s,y+dy*s,r*s,0,7);g.fill()})}
function windowGlass(g,x,y,w,h){g.fillStyle=lg(g,x,y,x,y+h,[[0,'rgb(98,128,160)'],[1,'rgb(72,100,132)']]);g.fillRect(x,y,w,h);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle='rgba(150,180,210,.35)';g.beginPath();g.moveTo(x+w*.15,y);g.lineTo(x+w*.4,y);g.lineTo(x+w*.1,y+h);g.lineTo(x-w*.15,y+h);g.fill();g.restore()}
function makeScene(kind){
  const c=document.createElement('canvas');c.width=1920;c.height=1080;const g=c.getContext('2d');
  if(kind==='villa'){
    g.fillStyle=lg(g,0,0,0,620,[[0,'rgb(64,132,214)'],[1,'rgb(204,226,245)']]);g.fillRect(0,0,1920,640);
    cloud(g,320,150,1.1);cloud(g,1500,110,.9);cloud(g,980,210,.6);
    g.fillStyle='rgb(132,152,140)';g.beginPath();g.moveTo(0,560);for(let x=0;x<=1920;x+=40)g.lineTo(x,540-Math.sin(x/260)*40-Math.sin(x/90)*8);g.lineTo(1920,700);g.lineTo(0,700);g.fill();
    g.fillStyle='rgb(98,130,98)';g.beginPath();g.moveTo(0,620);for(let x=0;x<=1920;x+=40)g.lineTo(x,600-Math.sin(x/180+1)*26);g.lineTo(1920,760);g.lineTo(0,760);g.fill();
    tree(g,180,700,1.5,'rgb(56,94,62)');tree(g,330,720,1.1,'rgb(64,104,66)');tree(g,1760,710,1.6,'rgb(56,94,62)');
    g.fillStyle=lg(g,0,740,0,1080,[[0,'rgb(102,156,76)'],[1,'rgb(72,122,54)']]);g.fillRect(0,740,1920,340);
    g.fillStyle='rgb(222,214,200)';g.fillRect(520,380,980,380);
    g.fillStyle='rgb(228,221,208)';g.fillRect(760,250,560,170);
    g.fillStyle='rgb(58,60,66)';g.fillRect(740,238,600,16);g.fillRect(500,368,1020,16);
    g.fillStyle='rgb(146,102,70)';g.fillRect(520,420,180,340);g.strokeStyle='rgba(60,38,24,.5)';g.lineWidth=3;for(let x=532;x<700;x+=18){g.beginPath();g.moveTo(x,420);g.lineTo(x,760);g.stroke()}
    windowGlass(g,730,470,470,270);g.fillStyle='rgb(40,42,46)';[730,885,1040,1195].forEach(x=>g.fillRect(x,470,6,270));g.fillRect(730,466,471,6);
    windowGlass(g,1240,500,200,150);g.fillStyle='rgb(40,42,46)';g.fillRect(1236,496,208,6);g.fillRect(1236,650,208,6);
    windowGlass(g,800,282,480,110);g.fillStyle='rgb(40,42,46)';[800,960,1120,1276].forEach(x=>g.fillRect(x,282,5,110));
    g.fillStyle='rgb(196,186,170)';g.fillRect(470,756,1080,40);
    g.fillStyle='rgb(232,226,214)';g.beginPath();g.moveTo(400,800);g.lineTo(1520,800);g.lineTo(1600,960);g.lineTo(320,960);g.fill();
    g.fillStyle=lg(g,0,812,0,945,[[0,'rgb(70,196,226)'],[1,'rgb(38,150,200)']]);g.beginPath();g.moveTo(428,814);g.lineTo(1492,814);g.lineTo(1562,944);g.lineTo(358,944);g.fill();
    g.strokeStyle='rgba(235,250,255,.55)';g.lineWidth=4;for(let i=0;i<9;i++){const y=830+i*13;g.beginPath();for(let x=440+i*-8;x<1480+i*8;x+=30)g.lineTo(x,y+Math.sin(x/37+i)*3);g.stroke()}
    tree(g,1580,780,1.0,'rgb(118,138,96)');
    g.fillStyle='rgb(150,140,128)';g.fillRect(1180,770,90,10);g.fillRect(1290,770,90,10);
  } else if(kind==='salon'){
    g.fillStyle='rgb(214,206,194)';g.fillRect(0,0,1920,780);
    g.fillStyle='rgb(200,192,180)';g.fillRect(0,0,1920,40);
    const wx=1080,wy=120,ww=700,wh=600;
    g.fillStyle=lg(g,0,wy,0,wy+wh,[[0,'rgb(86,152,224)'],[1,'rgb(198,224,246)']]);g.fillRect(wx,wy,ww,wh);
    cloud(g,wx+200,wy+130,.7);cloud(g,wx+520,wy+90,.5);
    g.fillStyle='rgb(96,140,86)';g.beginPath();g.moveTo(wx,wy+wh);for(let x=wx;x<=wx+ww;x+=20)g.lineTo(x,wy+wh-120-Math.sin(x/40)*20-Math.sin(x/13)*8);g.lineTo(wx+ww,wy+wh);g.fill();
    g.fillStyle='rgb(46,46,50)';g.fillRect(wx-14,wy-14,ww+28,14);g.fillRect(wx-14,wy+wh,ww+28,14);g.fillRect(wx-14,wy,14,wh);g.fillRect(wx+ww,wy,14,wh);g.fillRect(wx+ww/2-5,wy,10,wh);
    g.fillStyle='rgb(168,124,92)';g.fillRect(200,170,360,260);g.fillStyle='rgb(220,150,110)';g.beginPath();g.arc(330,300,90,0,7);g.fill();g.fillStyle='rgb(120,90,70)';g.fillRect(400,220,110,170);g.strokeStyle='rgb(60,52,46)';g.lineWidth=10;g.strokeRect(200,170,360,260);
    g.fillStyle=lg(g,0,780,0,1080,[[0,'rgb(152,112,80)'],[1,'rgb(118,84,58)']]);g.fillRect(0,780,1920,300);
    g.strokeStyle='rgba(70,46,30,.35)';g.lineWidth=2;for(let i=0;i<8;i++){const y=800+i*i*5+i*16;g.beginPath();g.moveTo(0,y);g.lineTo(1920,y);g.stroke()}
    g.fillStyle='rgb(206,196,180)';g.beginPath();g.moveTo(240,850);g.lineTo(1260,850);g.lineTo(1420,1040);g.lineTo(100,1040);g.fill();
    g.fillStyle='rgb(176,156,132)';rr(g,220,600,760,210,26);g.fill();rr(g,200,540,800,110,30);g.fill();
    g.fillStyle='rgb(160,140,118)';rr(g,190,600,90,220,24);g.fill();rr(g,920,600,90,220,24);g.fill();
    g.fillStyle='rgb(120,88,66)';rr(g,300,560,170,130,22);g.fill();g.fillStyle='rgb(208,192,160)';rr(g,500,566,170,124,22);g.fill();g.fillStyle='rgb(150,110,84)';rr(g,700,560,170,130,22);g.fill();
    g.fillStyle='rgb(70,58,50)';g.beginPath();g.ellipse(720,900,240,50,0,0,7);g.fill();g.fillRect(560,900,14,90);g.fillRect(866,900,14,90);
    g.fillStyle='rgb(240,232,214)';g.beginPath();g.ellipse(690,880,40,14,0,0,7);g.fill();
    g.strokeStyle='rgb(48,48,52)';g.lineWidth=8;g.beginPath();g.moveTo(1880-850,820);g.lineTo(1880-850,330);g.stroke();
    g.fillStyle='rgb(246,236,212)';g.beginPath();g.moveTo(985,250);g.lineTo(1075,250);g.lineTo(1100,340);g.lineTo(960,340);g.fill();
    g.fillStyle='rgb(150,100,80)';rr(g,1780,700,110,130,10);g.fill();
    g.fillStyle='rgb(70,120,66)';for(let i=0;i<9;i++){g.save();g.translate(1835,710);g.rotate(-1.3+i*.33);g.beginPath();g.ellipse(0,-120,26,110,0,0,7);g.fill();g.restore()}
  } else {
    g.fillStyle=lg(g,0,0,0,560,[[0,'rgb(70,140,220)'],[1,'rgb(200,224,246)']]);g.fillRect(0,0,1920,700);
    cloud(g,260,120,.8);cloud(g,1660,180,1);
    g.fillStyle='rgb(176,182,190)';g.fillRect(0,330,300,500);g.fillRect(1640,280,280,560);
    g.fillStyle='rgb(206,178,150)';g.fillRect(360,170,1200,690);
    g.fillStyle='rgb(176,148,120)';g.fillRect(340,150,1240,30);for(let r=0;r<6;r++)g.fillRect(360,284+r*96,1200,6);
    for(let r=0;r<5;r++)for(let col=0;col<7;col++){
      const x=420+col*160,y=200+r*104,w=96,h=74;g.fillStyle='rgb(244,238,228)';g.fillRect(x-6,y-6,w+12,h+12);
      if(rnd(r*7+col)<.22){g.fillStyle='rgb(150,128,110)';g.fillRect(x,y,w,h)}else windowGlass(g,x,y,w,h);
      g.fillStyle='rgb(52,52,56)';g.fillRect(x+w/2-2,y,4,h);if(r>0){g.fillRect(x-14,y+h-2,w+28,5);for(let k=0;k<7;k++)g.fillRect(x-12+k*(w+24)/6,y+h-22,3,22)}
    }
    g.fillStyle='rgb(44,82,72)';for(let i=0;i<4;i++){g.beginPath();g.moveTo(400+i*290,730);g.lineTo(640+i*290,730);g.lineTo(660+i*290,780);g.lineTo(380+i*290,780);g.fill()}
    g.fillStyle='rgb(60,58,56)';for(let i=0;i<4;i++)g.fillRect(420+i*290,780,200,80);
    g.fillStyle='rgb(172,166,156)';g.fillRect(0,860,1920,60);g.fillStyle=lg(g,0,920,0,1080,[[0,'rgb(86,86,92)'],[1,'rgb(64,64,70)']]);g.fillRect(0,920,1920,160);
    g.fillStyle='rgb(230,226,214)';for(let x=40;x<1920;x+=220)g.fillRect(x,1000,120,10);
    tree(g,260,870,1.3,'rgb(64,104,66)');tree(g,1660,870,1.4,'rgb(58,98,60)');
  }
  return c;
}
const SCN={};for(const k in SCENES)SCN[k]=makeScene(k);
function thumbOf(src,w=192,h=108){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');const sw=src.videoWidth||src.naturalWidth||src.width,sh=src.videoHeight||src.naturalHeight||src.height;const r=Math.max(w/sw,h/sh);try{g.drawImage(src,(w-sw*r)/2,(h-sh*r)/2,sw*r,sh*r)}catch(e){}return c}
const SCN_TH={};for(const k in SCN)SCN_TH[k]=thumbOf(SCN[k]).toDataURL('image/jpeg',.8);
