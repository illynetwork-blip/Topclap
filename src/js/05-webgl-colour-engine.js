/* ---------- WebGL colour engine ---------- */
/* One fragment shader does: parallax 2.5D (depth), blur, RGB split, HDR, sky/window masks (Jour→Nuit, ciel, fenêtres),
   golden hour, hiver, primaries (lift/gamma/gain), LUT 3D, hue, matte, VHS, grain, vignette, chroma key, masks, before/after. */
const FRAG=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;uniform sampler2D u_t,u_lutT,u_depT;uniform vec2 u_px;uniform float u_time;
uniform float u_bright,u_contrast,u_sat,u_temp,u_tint,u_hue,u_fade,u_vig,u_grain,u_blur,u_rgb,u_scan,u_mirror,u_split;
uniform float u_tw,u_sky,u_glow,u_hdr,u_gold,u_winter,u_horizon;uniform vec3 u_lift,u_gain,u_gamma;
uniform float u_lutOn,u_lutN,u_lutAmt;uniform float u_keyOn,u_tol,u_soft,u_spill;uniform vec3 u_key;
uniform float u_mType,u_mFeather,u_mInv;uniform vec4 u_mRect;uniform float u_dOn,u_dPush;uniform vec2 u_dOff;
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
vec3 tx(vec2 uv){return texture2D(u_t,uv).rgb;}
vec2 cbcr(vec3 c){return vec2(-.1687*c.r-.3313*c.g+.5*c.b,.5*c.r-.4187*c.g-.0813*c.b);}
vec3 lut3(vec3 c){float n=u_lutN;float b=c.b*(n-1.);float b0=floor(b);float b1=min(b0+1.,n-1.);float f=b-b0;
 vec2 p=vec2((c.r*(n-1.)+.5)/(n*n),(c.g*(n-1.)+.5)/n);return mix(texture2D(u_lutT,p+vec2(b0/n,0.)).rgb,texture2D(u_lutT,p+vec2(b1/n,0.)).rgb,f);}
vec2 masks(vec2 uv){vec3 c=tx(uv);float L=lum(c);float mx=max(c.r,max(c.g,c.b));float mn=min(c.r,min(c.g,c.b));float s=mx>.001?(mx-mn)/mx:0.;
 float bl=c.b-max(c.r,c.g*.92);float vert=1.-smoothstep(u_horizon*.45,u_horizon,uv.y);
 float sk=max(smoothstep(.03,.16,bl)*smoothstep(.32,.62,L),smoothstep(.88,.97,L)*(1.-smoothstep(.08,.22,s)));
 float skyM=clamp(sk*vert*1.25,0.,1.);
 float win=(1.-skyM)*smoothstep(.02,.1,bl)*smoothstep(.12,.28,L)*(1.-smoothstep(.62,.82,L));
 return vec2(skyM,win);}
void main(){vec2 uv=v;if(u_mirror>.5&&uv.x>.5)uv.x=1.-uv.x;
 if(u_dOn>.5){float d=u_dOn>1.5?texture2D(u_depT,uv).r:(.15+.85*smoothstep(.2,1.,uv.y));
  if(u_dPush>.5)uv=uv+(uv-.5)*(d-.35)*u_dOff.x;else uv=uv+u_dOff*(d-.5);uv=clamp(uv,.001,.999);}
 vec3 c;
 if(u_blur>.01){vec3 a=vec3(0.);float r=u_blur*16.;for(int i=0;i<12;i++){float an=float(i)*.5236;a+=tx(uv+vec2(cos(an),sin(an))*u_px*r);a+=tx(uv+vec2(cos(an+.26),sin(an+.26))*u_px*r*.5);}c=a/24.;}else c=tx(uv);
 if(u_rgb>.001){vec2 o=vec2(u_rgb*u_px.x*14.,0.);c.r=tx(uv+o).r;c.b=tx(uv-o).b;}
 vec3 orig=c;float alpha=texture2D(u_t,uv).a;
 if(u_keyOn>.5){float kd=distance(cbcr(orig),cbcr(u_key));alpha*=smoothstep(u_tol,u_tol+u_soft,kd);float sp=(1.-smoothstep(u_tol,u_tol+u_soft*3.,kd))*u_spill;c=mix(c,vec3(lum(c)),sp);}
 if(u_hdr>.001){vec3 b=vec3(0.);for(int i=0;i<8;i++){float an=float(i)*.785;b+=tx(uv+vec2(cos(an),sin(an))*u_px*9.);}b/=8.;c=c+(c-b)*u_hdr*1.6;float L0=lum(c);c=mix(c,c*(1.+u_hdr*.35*(1.-L0)),.6);c=mix(vec3(lum(c)),c,1.+u_hdr*.25);}
 if(u_tw+u_sky+u_glow>.001){vec2 m=masks(uv);float halo=0.;
  if(u_tw+u_glow>.001){for(int i=0;i<8;i++){float an=float(i)*.785;halo+=masks(uv+vec2(cos(an),sin(an))*u_px*14.).y;}halo/=8.;}
  float L=lum(c);
  if(u_sky>.001){vec3 sb=mix(vec3(.16,.42,.86),vec3(.66,.83,.97),smoothstep(0.,u_horizon,uv.y));
   float cl=noise(uv*vec2(5.,9.)+3.)*.6+noise(uv*vec2(11.,19.))*.3+noise(uv*vec2(23.,37.))*.1;cl=smoothstep(.55,.85,cl);sb=mix(sb,vec3(.98),cl*.8);c=mix(c,sb*(.9+.2*L),m.x*u_sky);}
  vec3 warm=mix(vec3(1.,.72,.38),vec3(.25,.85,1.),smoothstep(.68,.82,uv.y));
  if(u_glow>.001)c+=warm*(m.y*.55+halo*.25)*u_glow;
  if(u_tw>.001){float y=uv.y/max(u_horizon,.2);vec3 skyN=mix(vec3(.05,.07,.24),vec3(.34,.2,.48),smoothstep(0.,.5,y));skyN=mix(skyN,vec3(.98,.5,.3),smoothstep(.45,1.,y));
   vec3 g=c*vec3(.34,.38,.56)*(.65+.35*L);vec3 night=mix(g,skyN*(.82+.36*L),m.x);night+=warm*(m.y*1.35+halo*.55);night+=vec3(.06,.03,0.)*halo;c=mix(c,night,u_tw);}}
 if(u_gold>.001)c=mix(c,c*vec3(1.12,.98,.78)+vec3(.04,.015,0.),u_gold);
 if(u_winter>.001){float Lw=lum(c);c=mix(c,mix(vec3(Lw),c,.45)*vec3(.94,1.,1.08)+vec3(.05),u_winter);}
 c+=u_bright*.35;c=(c-.5)*(1.+u_contrast)+.5;float L2=lum(c);c=mix(vec3(L2),c,1.+u_sat);
 c.r+=u_temp*.09;c.b-=u_temp*.09;c.g+=u_tint*.06;
 if(abs(u_hue)>.001){mat3 toY=mat3(.299,.596,.211,.587,-.274,-.523,.114,-.322,.312);mat3 toR=mat3(1.,1.,1.,.956,-.272,-1.106,.621,-.647,1.703);vec3 q=toY*c;float h=atan(q.z,q.y)+u_hue*3.14159;float ch=length(q.yz);q.y=ch*cos(h);q.z=ch*sin(h);c=toR*q;}
 c=c*u_gain+u_lift*(1.-c);c=pow(max(c,0.),1./max(vec3(.2),1.+u_gamma));c=mix(c,(c-.5)*.82+.56,u_fade);
 if(u_lutOn>.5)c=mix(c,lut3(clamp(c,0.,1.)),u_lutAmt);
 if(u_scan>.001){c*=1.-u_scan*.22*(.5+.5*sin(uv.y/u_px.y*1.6));c+=u_scan*.05*vec3(noise(vec2(uv.y*300.,u_time*20.)));}
 if(u_grain>.001)c+=(hash(uv*vec2(731.,513.)+fract(u_time*7.)*61.)-.5)*u_grain*.16;
 if(u_vig>.001){float d=distance(v,vec2(.5));c*=1.-u_vig*smoothstep(.28,.82,d);}
 if(u_split>-.5&&v.x<u_split)c=orig;
 if(u_mType>.5){float a=1.;vec2 q=(v-u_mRect.xy)/max(u_mRect.zw*.5,vec2(.001));float f=max(u_mFeather,.001);
  if(u_mType<1.5)a=1.-smoothstep(1.-f*3.,1.+f,max(abs(q.x),abs(q.y)));else if(u_mType<2.5)a=1.-smoothstep(1.-f*3.,1.+f,length(q));else a=smoothstep(u_mRect.y-f,u_mRect.y+f,v.y);
  if(u_mInv>.5)a=1.-a;alpha*=a;}
 gl_FragColor=vec4(clamp(c,0.,1.),alpha);}`;
const GLX=(()=>{
  try{
    const c=document.createElement('canvas');c.width=2;c.height=2;
    const gl=c.getContext('webgl',{premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false});if(!gl)return null;
    const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o};
    const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 v;void main(){v=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}'));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const mkTex=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);[[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE],[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR]].forEach(([k,v])=>gl.texParameteri(gl.TEXTURE_2D,k,v));return t};
    const tex=mkTex(),empty=mkTex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([128,128,128,255]));
    const lutTex={},depTex=new WeakMap();
    const U={};['t','lutT','depT','px','time','bright','contrast','sat','temp','tint','hue','fade','vig','grain','blur','rgb','scan','mirror','split','tw','sky','glow','hdr','gold','winter','horizon','lift','gain','gamma',
      'lutOn','lutN','lutAmt','keyOn','tol','soft','spill','key','mType','mFeather','mInv','mRect','dOn','dPush','dOff'].forEach(n=>U[n]=gl.getUniformLocation(pr,'u_'+n));
    gl.uniform1i(U.t,0);gl.uniform1i(U.lutT,1);gl.uniform1i(U.depT,2);
    const F1=['bright','contrast','sat','temp','tint','hue','fade','vig','grain','blur','rgb','scan','mirror','split','tw','sky','glow','hdr','gold','winter','horizon','lutAmt','keyOn','tol','soft','spill','mType','mFeather','mInv','dPush'];
    return {c,gl,run(src,w,h,p,time,ex={}){
      w=Math.max(2,Math.round(w));h=Math.max(2,Math.round(h));
      if(c.width!==w||c.height!==h){c.width=w;c.height=h}
      gl.viewport(0,0,w,h);
      gl.activeTexture(gl.TEXTURE1);
      if(ex.lut){let t=lutTex[ex.lut.id];if(!t){t=lutTex[ex.lut.id]=mkTex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,ex.lut.n*ex.lut.n,ex.lut.n,0,gl.RGBA,gl.UNSIGNED_BYTE,ex.lut.data)}else gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1f(U.lutOn,1);gl.uniform1f(U.lutN,ex.lut.n)}
      else{gl.bindTexture(gl.TEXTURE_2D,empty);gl.uniform1f(U.lutOn,0);gl.uniform1f(U.lutN,2)}
      gl.activeTexture(gl.TEXTURE2);
      if(ex.depth){let t=depTex.get(ex.depth);if(!t){t=mkTex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,ex.depth);depTex.set(ex.depth,t)}else gl.bindTexture(gl.TEXTURE_2D,t)}
      else gl.bindTexture(gl.TEXTURE_2D,empty);
      gl.uniform1f(U.dOn,p.dOn?(ex.depth?2:1):0);gl.uniform2f(U.dOff,p.dOff[0],p.dOff[1]);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
      const sw=src.videoWidth||src.naturalWidth||src.width,sh=src.videoHeight||src.naturalHeight||src.height;
      gl.uniform2f(U.px,1/sw,1/sh);gl.uniform1f(U.time,time||0);
      for(const k of F1)gl.uniform1f(U[k],p[k]);
      gl.uniform3fv(U.lift,p.lift);gl.uniform3fv(U.gain,p.gain);gl.uniform3fv(U.gamma,p.gamma);gl.uniform3fv(U.key,p.key);gl.uniform4fv(U.mRect,p.mRect);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return c;
    }};
  }catch(e){console.warn('WebGL indisponible',e);return null}
})();
const PKEYS=['bright','contrast','sat','temp','tint','hue','fade','vig','grain','blur','rgb','scan','tw','sky','glow','hdr','gold','winter'];
function baseParams(){return {bright:0,contrast:0,sat:0,temp:0,tint:0,hue:0,fade:0,vig:0,grain:0,blur:0,rgb:0,scan:0,mirror:0,split:-1,tw:0,sky:0,glow:0,hdr:0,gold:0,winter:0,horizon:.62,
  lift:[0,0,0],gain:[1,1,1],gamma:[0,0,0],lutAmt:1,keyOn:0,tol:.16,soft:.1,spill:.6,key:[0,.69,.25],mType:0,mFeather:.08,mInv:0,mRect:[.5,.5,.6,.6],dOn:0,dPush:0,dOff:[0,0]}}
function addPreset(p,key,k=1){const f=FILTERS[key];if(!f||key==='none')return;for(const n of PKEYS)if(f[n])p[n]+=f[n]*k;if(f.lift)p.lift=p.lift.map((v,i)=>v+f.lift[i]*k);if(f.gain)p.gain=p.gain.map((v,i)=>v*(1+(f.gain[i]-1)*k))}
function glitchBurst(lt){return (Math.sin(lt*7.3)+Math.sin(lt*11.7+1))>1.35?1:0}
const hexRGB=h=>{h=toHex(h);return [1,3,5].map(i=>parseInt(h.substr(i,2),16)/255)};
function clipParams(c,lt){
  const p=baseParams();addPreset(p,c.filter,c.filterAmt);
  for(const k in c.adj)p[k]+=c.adj[k];
  const im=c.immo,prog=clamp(lt/c.dur);let tw=im.tw;
  if(im.twAnim==='in')tw*=ease.inOut(clamp((prog-.12)/.76));else if(im.twAnim==='out')tw*=1-ease.inOut(clamp((prog-.12)/.76));
  p.tw+=tw;p.sky+=im.sky;p.glow+=im.glow;p.hdr+=im.hdr;p.gold+=im.gold;p.winter+=im.winter;p.horizon=im.horizon;
  if(im.compare==='static')p.split=im.splitPos;else if(im.compare==='slide')p.split=.06+.88*(.5-.5*Math.cos(prog*Math.PI*2));
  if(im.parallax>0){const a=im.parallax,e=ease.inOut(prog);p.dOn=1;
    if(im.parDir==='push'){p.dPush=1;p.dOff=[-.22*a*e,0]}else if(im.parDir==='left')p.dOff=[.07*a*(e*2-1),0];else if(im.parDir==='right')p.dOff=[-.07*a*(e*2-1),0];else p.dOff=[0,.06*a*(e*2-1)]}
  const gr=c.grade;if(gr){for(let i=0;i<3;i++){p.lift[i]+=gr.lift[i];p.gain[i]*=1+gr.gain[i];p.gamma[i]+=gr.gamma[i]}if(gr.lut&&LUTS[gr.lut]){p.lutAmt=gr.lutAmt}}
  const ky=c.key;if(ky&&ky.on){p.keyOn=1;p.key=hexRGB(ky.color);p.tol=ky.tol;p.soft=ky.soft;p.spill=ky.spill}
  const mk=c.mask;if(mk&&mk.type!=='none'){p.mType={rect:1,ellipse:2,linear:3}[mk.type]||0;p.mRect=[mk.x,mk.y,mk.w,mk.h];p.mFeather=mk.feather;p.mInv=mk.invert?1:0}
  for(const f of c.fx){const v=f.v;switch(f.id){
    case'grain':p.grain+=v;break;case'vignette':p.vig+=v;break;case'blur':p.blur+=v;break;case'rgb':p.rgb+=v;break;case'mirror':p.mirror=1;break;
    case'vhs':p.scan+=v;p.rgb+=v*.35;p.grain+=v*.45;p.sat-=.15*v;p.fade+=.1*v;break;case'glitch':p.rgb+=v*glitchBurst(lt)*1.4;break;}}
  return p;
}
function glExtras(c){const ex={};const gr=c.grade;if(gr&&gr.lut&&LUTS[gr.lut])ex.lut=LUTS[gr.lut];if(c.immo&&c.immo.parallax>0){const m=media[c.mediaId];const d=c.kind==='scene'?SCN_DEPTH[c.scene]:m&&m.depth;if(d)ex.depth=d}return ex}
function needsGL(p,ex={}){if(p.split>-.5||p.mirror||p.keyOn||p.mType||p.dOn||ex.lut)return true;for(const k of PKEYS)if(Math.abs(p[k])>.001)return true;return p.lift.some(v=>v!==0)||p.gain.some(v=>v!==1)||p.gamma.some(v=>v!==0)}
const LUTS={};   // id -> {id,name,n,data:Uint8Array}
const SCN_DEPTH={};
