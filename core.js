import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ConvexGeometry} from 'three/addons/geometries/ConvexGeometry.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
export {THREE,RoomEnvironment};

export const $=id=>document.getElementById(id);
export const TAU=Math.PI*2,rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
export const lerpA=(a,b,t)=>{const d=((b-a+Math.PI*3)%TAU)-Math.PI;return a+d*t};
export const angDiff=(a,b)=>Math.abs(((a-b+Math.PI*3)%TAU)-Math.PI);
export const d2=(a,b)=>(a.x-b.x)**2+(a.z-b.z)**2;
export const TOUCH=matchMedia('(pointer:coarse)').matches;
export const G={shake:0,timeScale:1};

/* ---------- renderer ---------- */
export const stage=$('stage');
export const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,TOUCH?1.25:1.6));
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
export const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0a0c14,.0045);
export const camera=new THREE.PerspectiveCamera(48,1,.1,1500);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
export const hemi=new THREE.HemisphereLight(0x7088b0,0x0a0c10,1.1);scene.add(hemi);
export const moon=new THREE.DirectionalLight(0xb8c8ff,1.6);moon.castShadow=true;moon.shadow.mapSize.set(TOUCH?1024:2048,TOUCH?1024:2048);
Object.assign(moon.shadow.camera,{left:-44,right:44,top:44,bottom:-44,near:1,far:160});moon.shadow.bias=-.0004;moon.shadow.normalBias=.04;scene.add(moon,moon.target);
export const rim=new THREE.DirectionalLight(0xff3a9a,.7);rim.position.set(-60,30,-80);scene.add(rim);
export const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const gtao=new GTAOPass(scene,camera,256,256);gtao.enabled=false;composer.addPass(gtao);
export const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.8,.55,.8);composer.addPass(bloom);
const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},amt:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float time,amt;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){vec2 c=vUv-.5;float d=dot(c,c);vec2 off=c*d*.012*amt;vec3 col=vec3(texture2D(tDiffuse,vUv+off).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-off).b);
 col*=1.-d*.85*amt;float l=dot(col,vec3(.2126,.7152,.0722));col=mix(vec3(l),col,1.15);col=col*vec3(1.03,1.,1.05)+vec3(0.,.003,.012)*(1.-clamp(l,0.,1.));col+=(h(vUv*900.+fract(time))-.5)*.011*amt;gl_FragColor=vec4(max(col,0.),1.);}`});
composer.addPass(grade);composer.addPass(new OutputPass());const smaa=new SMAAPass(256,256);composer.addPass(smaa);
export const Q={level:(()=>{try{return localStorage.getItem('tf3d_q')||(TOUCH?'low':'high')}catch(e){return TOUCH?'low':'high'}})()};
export function setQuality(l){Q.level=l;try{localStorage.setItem('tf3d_q',l)}catch(e){}const dpr=devicePixelRatio||1;renderer.setPixelRatio(l=='low'?Math.min(dpr,1):l=='high'?Math.min(dpr,1.6):Math.min(dpr,2));
 smaa.enabled=l!='low';gtao.enabled=l=='ultra';grade.uniforms.amt.value=l=='low'?.6:1;const sm=l=='low'?1024:l=='high'?2048:4096;if(moon.shadow.mapSize.x!==sm){moon.shadow.mapSize.set(sm,sm);if(moon.shadow.map){moon.shadow.map.dispose();moon.shadow.map=null}}resize()}
export function postTick(t){grade.uniforms.time.value=t}
let envRT=null;const fill=new THREE.Group();{const m=new THREE.MeshBasicMaterial({color:new THREE.Color(0xc8d4ff).multiplyScalar(1.6),side:THREE.DoubleSide});for(let i=0;i<6;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(260,90),m),a=i/6*TAU;p.position.set(Math.cos(a)*420,140,Math.sin(a)*420);p.lookAt(0,40,0);fill.add(p)}const top=new THREE.Mesh(new THREE.PlaneGeometry(500,500),m);top.position.y=600;top.rotation.x=Math.PI/2;fill.add(top)}
export function bakeEnv(){scene.add(fill);scene.position.y=-6;scene.updateMatrixWorld(true);const rt=pmrem.fromScene(scene,.03,1,1300);scene.remove(fill);scene.position.y=0;scene.updateMatrixWorld(true);if(envRT)envRT.dispose();envRT=rt;scene.environment=rt.texture}
export const PU={value:600};
export function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h||!composer)return;renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();PU.value=h*renderer.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360))}
new ResizeObserver(resize).observe(stage);

/* ---------- textures ---------- */
export function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep)}t.anisotropy=8;return t}
export const HEX=canvasTex(256,256,(g)=>{g.fillStyle='#000';g.fillRect(0,0,256,256);g.strokeStyle='#fff';g.lineWidth=3;const R=21,h=R*Math.sqrt(3);
 for(let col=-1;col<14;col++)for(let row=-1;row<10;row++){const cx=col*R*1.5,cy=row*h+(col%2?h/2:0);g.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;g.lineTo(cx+Math.cos(a)*R*.9,cy+Math.sin(a)*R*.9)}g.closePath();g.stroke()}
 const gr=g.createRadialGradient(128,128,20,128,128,130);gr.addColorStop(0,'rgba(255,255,255,.12)');gr.addColorStop(1,'rgba(255,255,255,.5)');g.fillStyle=gr;g.fillRect(0,0,256,256)});
export const GLOWT=canvasTex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128)});
export function normalFromHeight(hc,str=3){const w=hc.width,h=hc.height,src=hc.getContext('2d').getImageData(0,0,w,h).data,o=document.createElement('canvas');o.width=w;o.height=h;const og=o.getContext('2d'),od=og.createImageData(w,h),D=od.data;
 const H=(x,y)=>src[((((y+h)%h)*w)+((x+w)%w))*4]/255;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(H(x+1,y)-H(x-1,y))*str,dy=(H(x,y+1)-H(x,y-1))*str,l=Math.hypot(dx,dy,1),i=(y*w+x)*4;D[i]=(-dx/l*.5+.5)*255;D[i+1]=(dy/l*.5+.5)*255;D[i+2]=(1/l*.5+.5)*255;D[i+3]=255}
 og.putImageData(od,0,0);const t=new THREE.CanvasTexture(o);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
/* armour plating: panel lines, rivets, vents, stencils, wear, grime */
export const ARM=(()=>{const S=512,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),hc=document.createElement('canvas');hc.width=hc.height=S;const hg=hc.getContext('2d');
 g.fillStyle='#a6a6a6';g.fillRect(0,0,S,S);hg.fillStyle='#808080';hg.fillRect(0,0,S,S);
 const id=g.getImageData(0,0,S,S);for(let i=0;i<id.data.length;i+=4){const n=(Math.random()-.5)*16;id.data[i]+=n;id.data[i+1]+=n;id.data[i+2]+=n}g.putImageData(id,0,0);
 const rects=[];(function split(x,y,w,h,d){if(d>3||w<70||h<70||(d>1&&Math.random()<.3)){rects.push([x,y,w,h]);return}if(w>h){const k=w*rnd(.35,.65);split(x,y,k,h,d+1);split(x+k,y,w-k,h,d+1)}else{const k=h*rnd(.35,.65);split(x,y,w,k,d+1);split(x,y+k,w,h-k,d+1)}})(0,0,S,S,0);
 for(const[x,y,w,h]of rects){const v=rnd(-1,1);g.fillStyle=v>0?`rgba(255,255,255,${v*.07})`:`rgba(0,0,0,${-v*.1})`;g.fillRect(x+2,y+2,w-4,h-4);
  g.strokeStyle='rgba(18,18,20,.9)';g.lineWidth=3;g.strokeRect(x+1.5,y+1.5,w-3,h-3);g.strokeStyle='rgba(255,255,255,.2)';g.lineWidth=1;g.strokeRect(x+4.5,y+4.5,w-9,h-9);
  hg.strokeStyle='#000';hg.lineWidth=4;hg.strokeRect(x+1.5,y+1.5,w-3,h-3);hg.strokeStyle='#a0a0a0';hg.lineWidth=2;hg.strokeRect(x+5,y+5,w-10,h-10);
  if(Math.random()<.6)for(const[a,b]of[[9,9],[w-9,9],[9,h-9],[w-9,h-9]]){g.fillStyle='#626262';g.beginPath();g.arc(x+a,y+b,3.2,0,TAU);g.fill();hg.fillStyle='#fff';hg.beginPath();hg.arc(x+a,y+b,3.2,0,TAU);hg.fill()}
  if(Math.random()<.2&&w>90&&h>64)for(let i=0;i<5;i++){const yy=y+h/2-20+i*9;g.fillStyle='#2b2b2d';g.fillRect(x+w*.22,yy,w*.56,4);hg.fillStyle='#000';hg.fillRect(x+w*.22,yy,w*.56,4)}
  if(Math.random()<.14&&w>110){g.fillStyle='rgba(235,235,235,.6)';g.font='bold 20px sans-serif';g.fillText(['Z-09','TITAN','MK-IV','07','A-12','X-09'][Math.random()*6|0],x+12,y+h-14)}
  if(Math.random()<.1){g.fillStyle='rgba(222,168,30,.85)';g.fillRect(x+10,y+10,Math.min(60,w-20),6)}}
 g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=1;for(let i=0;i<180;i++){const x=Math.random()*S,y=Math.random()*S;g.beginPath();g.moveTo(x,y);g.lineTo(x+rnd(-14,14),y+rnd(-4,4));g.stroke()}
 for(let i=0;i<40;i++){const x=Math.random()*S,y=Math.random()*S,r=rnd(10,50),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(30,25,20,.28)');gr.addColorStop(1,'rgba(30,25,20,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
 return{map,nm:normalFromHeight(hc,3.2)}})();

/* ---------- materials & geometry ---------- */
const GM=new Map();
export function glow(hex,i=2.6){const k=hex+'_'+i;if(!GM.has(k))GM.set(k,new THREE.MeshBasicMaterial({color:new THREE.Color(hex).multiplyScalar(i)}));return GM.get(k)}
export function addMat(col,op=.6,map=null){return new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(1.8),map,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})}
const GC=new Map();
export const geo=(k,f)=>{if(!GC.has(k))GC.set(k,f());return GC.get(k)};
export function boxUV(g,s=.5){g=g.index?g.toNonIndexed():g;const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let u,v;if(ax>=ay&&ax>=az){u=p.getZ(i);v=p.getY(i)}else if(ay>=az){u=p.getX(i);v=p.getZ(i)}else{u=p.getX(i);v=p.getY(i)}uv[i*2]=u*s+.31;uv[i*2+1]=v*s+.17}
 g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g}
export const rbox=(w,h,d,r=.12)=>geo(`r${w},${h},${d},${r}`,()=>boxUV(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2-.01,h/2-.01,d/2-.01))));
export const cyl=(a,b,h,s=12)=>geo(`c${a},${b},${h},${s}`,()=>boxUV(new THREE.CylinderGeometry(a,b,h,s)));
export const sph=(r,s=10)=>geo(`s${r},${s}`,()=>new THREE.SphereGeometry(r,s,Math.max(6,s*.7|0)));
export const cone=(r,h)=>geo(`k${r},${h}`,()=>new THREE.ConeGeometry(r,h,8));
/* faceted armour plate: chamfered box, optional top/bottom taper and forward slant */
export function facet(w,h,d,c=.15,tt=1,tb=1,sl=0){return geo(`f${w},${h},${d},${c},${tt},${tb},${sl}`,()=>{const pts=[],hw=w/2,hh=h/2,hd=d/2;c=Math.min(c,hw*.45,hh*.45,hd*.45);
 for(const sx of[-1,1])for(const sy of[-1,1])for(const sz of[-1,1]){const t=sy>0?tt:tb,zo=sy>0?sl:0,P=(x,y,z)=>pts.push(new THREE.Vector3(x*t,y,z*t+zo));
  P(sx*hw,sy*(hh-c),sz*(hd-c));P(sx*(hw-c),sy*hh,sz*(hd-c));P(sx*(hw-c),sy*(hh-c),sz*hd)}
 return boxUV(new ConvexGeometry(pts))})}
export function part(g,mat,x,y,z,par,rx=0,ry=0,rz=0){const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=m.receiveShadow=true;par.add(m);return m}
export function anchor(par,x,y,z){const o=new THREE.Object3D();o.position.set(x,y,z);par.add(o);return o}

/* ---------- particles ---------- */
export class PSys{constructor(n,blend){this.n=n;this.i=0;this.p=new Float32Array(n*3).fill(-999);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.s=new Float32Array(n);this.l=new Float32Array(n);this.m=new Float32Array(n);this.b=new Float32Array(n);this.gr=new Float32Array(n);this.g=new Float32Array(n);this.a=new Float32Array(n);
 const Gm=new THREE.BufferGeometry();Gm.setAttribute('position',new THREE.BufferAttribute(this.p,3));Gm.setAttribute('pcol',new THREE.BufferAttribute(this.c,4));Gm.setAttribute('size',new THREE.BufferAttribute(this.s,1));
 this.pts=new THREE.Points(Gm,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:blend,uniforms:{u:PU},
  vertexShader:'attribute float size;attribute vec4 pcol;varying vec4 vC;uniform float u;void main(){vC=pcol;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*u/-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC.rgb,vC.a*a);}'}));this.pts.frustumCulled=false;scene.add(this.pts)}
 emit(x,y,z,vx,vy,vz,life,size,r,g,b,a=1,grav=0,grow=0){const k=this.i;this.i=(k+1)%this.n;const p=this.p,v=this.v,c=this.c;p[k*3]=x;p[k*3+1]=y;p[k*3+2]=z;v[k*3]=vx;v[k*3+1]=vy;v[k*3+2]=vz;this.l[k]=this.m[k]=life;this.b[k]=size;this.gr[k]=grow;this.g[k]=grav;this.a[k]=a;c[k*4]=r;c[k*4+1]=g;c[k*4+2]=b;c[k*4+3]=a}
 update(dt){const P=this.p,V=this.v,dr=Math.exp(-2.2*dt);for(let k=0;k<this.n;k++){if(this.l[k]<=0)continue;this.l[k]-=dt;if(this.l[k]<=0){P[k*3+1]=-999;this.s[k]=0;continue}const f=this.l[k]/this.m[k];V[k*3+1]-=this.g[k]*dt;V[k*3]*=dr;V[k*3+2]*=dr;
  P[k*3]+=V[k*3]*dt;P[k*3+1]+=V[k*3+1]*dt;P[k*3+2]+=V[k*3+2]*dt;this.s[k]=this.b[k]*(1+this.gr[k]*(1-f));this.c[k*4+3]=this.a[k]*f}
  const A=this.pts.geometry.attributes;A.position.needsUpdate=A.pcol.needsUpdate=A.size.needsUpdate=true}}
export const FX=new PSys(TOUCH?2000:4000,THREE.AdditiveBlending),SMOKE=new PSys(TOUCH?800:1600,THREE.NormalBlending);
export const hexRGB=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
export function sparks(x,y,z,col,n,sp=12,size=.35){const[r,g,b]=hexRGB(col);for(let i=0;i<n;i++){const a=rnd(0,TAU),e=rnd(-.3,1),s=rnd(.3,1)*sp;FX.emit(x,y,z,Math.cos(a)*s,e*s,Math.sin(a)*s,rnd(.25,.6),size*rnd(.6,1.3),r*3,g*3,b*3,1,18)}}
export function smoke(x,y,z,n,s=1,dark=.12){for(let i=0;i<n;i++)SMOKE.emit(x+rnd(-1,1)*s,y+rnd(0,1)*s,z+rnd(-1,1)*s,rnd(-1.5,1.5),rnd(1,3.5),rnd(-1.5,1.5),rnd(.9,1.8),rnd(1.5,3)*s,dark,dark,dark+.02,.55,-.5,1.6)}
const LP=[];for(let i=0;i<5;i++){const l=new THREE.PointLight(0xffffff,0,34,2);scene.add(l);LP.push({l,t:0,d:1,I:0})}let lpI=0;
export function flash(x,y,z,col,I,d){const o=LP[lpI++%LP.length];o.l.position.set(x,y,z);o.l.color.set(col);o.I=I;o.t=o.d=d}
const fx=[];
export function sprite(x,y,z,col,s0,s1,d,op=1){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOWT,color:new THREE.Color(col).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op}));m.position.set(x,y,z);m.scale.setScalar(s0);scene.add(m);fx.push({o:m,t:d,d,s0,s1,op});return m}
export function ring(x,z,col,s0,s1,d,y=.2){const m=new THREE.Mesh(geo('ring',()=>new THREE.RingGeometry(.86,1,64)),addMat(col,.9));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.scale.setScalar(s0);scene.add(m);fx.push({o:m,t:d,d,s0,s1,op:.9});return m}
export function bolt(a,b,col,jit=1.1,d=.13){const pts=[],n=12;for(let i=0;i<=n;i++){const t=i/n,j=(i==0||i==n)?0:jit;pts.push(new THREE.Vector3(lerp(a.x,b.x,t)+rnd(-j,j),lerp(a.y,b.y,t)+rnd(-j,j),lerp(a.z,b.z,t)+rnd(-j,j)))}
 const L=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:new THREE.Color(col).multiplyScalar(5),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(L);fx.push({o:L,t:d,d,line:true,op:1})}
const BG=new THREE.CylinderGeometry(1,1,1,8,1,true);const _up=new THREE.Vector3(0,1,0),_dir=new THREE.Vector3();
export function beamMesh(col,op=.9){const m=new THREE.Mesh(BG,addMat(col,op));m.frustumCulled=false;scene.add(m);return m}
export function placeBeam(m,a,b,w){_dir.set(b.x-a.x,b.y-a.y,b.z-a.z);const L=_dir.length()||.001;m.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);m.quaternion.setFromUnitVectors(_up,_dir.normalize());m.scale.set(w,L,w)}
export function beam(a,b,col,w=.3,d=.25){const m=beamMesh(col);placeBeam(m,a,b,w);fx.push({o:m,t:d,d,op:.9,w,beam:true})}
export function updFX(dt){for(const o of LP){if(o.t>0){o.t-=dt;o.l.intensity=Math.max(0,o.I*o.t/o.d)}else o.l.intensity=0}
 for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.t-=dt;const k=1-f.t/f.d;if(f.s1)f.o.scale.setScalar(lerp(f.s0,f.s1,1-Math.pow(1-k,2)));if(f.beam){const s=f.w*Math.max(.05,f.t/f.d);f.o.scale.x=f.o.scale.z=s}
  f.o.material.opacity=f.op*Math.max(0,f.t/f.d);if(f.t<=0){scene.remove(f.o);f.o.material.dispose();if(f.line)f.o.geometry.dispose();fx.splice(i,1)}}}
export function explode(x,y,z,s=1,col=0xff8a2a){sprite(x,y,z,0xfff0c0,s*2,s*9,.35);sprite(x,y,z,col,s*3,s*7,.6,.8);ring(x,z,col,s,s*11,.5);sparks(x,y,z,0xffb040,18*s|0,16*s);sparks(x,y,z,col,10*s|0,10*s,.5);smoke(x,y,z,8*s|0,s*1.2);flash(x,y+2,z,col,300*s,.4);G.shake=Math.max(G.shake,.25*s);SFX.boom(.05+.05*Math.min(s,3))}

/* ---------- audio: sfx + procedural music ---------- */
export const AU={ctx:null,muted:false,musicOn:true,level:0,step:0,next:0};
let master,sfxG,musG,NB;
export function auInit(){if(AU.ctx)return;try{const C=new (window.AudioContext||window.webkitAudioContext)();AU.ctx=C;master=C.createGain();master.gain.value=AU.muted?0:1;master.connect(C.destination);
 const comp=C.createDynamicsCompressor();comp.connect(master);sfxG=C.createGain();sfxG.gain.value=.9;sfxG.connect(comp);musG=C.createGain();musG.gain.value=AU.musicOn?.3:0;musG.connect(comp);
 const n=C.sampleRate*1.5;NB=C.createBuffer(1,n,C.sampleRate);const ch=NB.getChannelData(0);for(let i=0;i<n;i++)ch[i]=Math.random()*2-1;AU.next=C.currentTime+.1;setInterval(sched,25)}catch(e){}}
export function setMute(v){AU.muted=v;if(master)master.gain.value=v?0:1}
export function setMusic(v){AU.musicOn=v;if(musG)musG.gain.value=v?.3:0}
export function tone(f,d,type='square',v=.03,f2,dest,t0){const C=AU.ctx;if(!C)return;const t=t0||C.currentTime,o=C.createOscillator(),g=C.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2!==0)o.frequency.exponentialRampToValueAtTime(f2||Math.max(30,f*.4),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(dest||sfxG);o.start(t);o.stop(t+d+.02)}
export function noise(v,d,freq=900,type='lowpass',rate=1,dest,t0,q=.7){const C=AU.ctx;if(!C||!NB)return;const t=t0||C.currentTime,s=C.createBufferSource();s.buffer=NB;s.playbackRate.value=rate;const f=C.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=C.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f).connect(g).connect(dest||sfxG);s.start(t,Math.random()*.3);s.stop(t+d+.05)}
let lastSfx={};const thr=(k,ms)=>{const n=performance.now();if(n-(lastSfx[k]||0)<ms)return true;lastSfx[k]=n;return false};
export const SFX={
 boom:(v=.15)=>{if(thr('boom',40))return;noise(v,1.1,600,'lowpass',.7);tone(70,.6,'sine',v*.9,30)},
 step:(v=.1)=>{tone(62,.22,'sine',v,32);noise(v*.5,.12,260)},
 rotary:()=>{if(thr('rot',60))return;noise(.06,.06,2400,'bandpass',1.4,undefined,undefined,1.2);tone(150,.04,'square',.012)},
 plasma:()=>{tone(900,.25,'sine',.05,120);noise(.04,.2,1800,'bandpass')},
 ember:()=>{noise(.13,.25,1200,'lowpass',1.2);tone(120,.2,'sawtooth',.03,50)},
 arc:()=>{tone(rnd(1000,1500),.09,'sawtooth',.02,300);noise(.04,.08,4000,'highpass')},
 fission:()=>{tone(110,.45,'sawtooth',.06,35);noise(.1,.4,500)},
 acid:()=>{if(thr('acid',70))return;noise(.05,.06,3000,'bandpass',1.6);tone(260,.04,'square',.01)},
 needle:()=>tone(1400,.15,'triangle',.03,500),
 rail:()=>{tone(2200,.5,'sawtooth',.05,80);noise(.12,.4,3000,'highpass');tone(60,.4,'sine',.08,30)},
 hit:()=>{if(thr('hit',60))return;tone(180,.1,'square',.04,90)},
 ui:()=>tone(660,.1,'triangle',.04),
 bolt:()=>{if(thr('bolt',50))return;tone(320,.1,'square',.015)},
 msl:()=>{noise(.06,.5,1500,'bandpass',1.2);tone(400,.5,'sawtooth',.02,150)},
 thunder:()=>noise(.2,2.4,240,'lowpass',.45),
 boost:()=>{noise(.12,.4,900,'bandpass',.9);tone(200,.35,'sawtooth',.04,520)},
 level:()=>{const C=AU.ctx;if(!C)return;[523,659,784,1046].forEach((f,i)=>tone(f,.3,'triangle',.06,0,undefined,C.currentTime+i*.1))},
 alarm:()=>{const C=AU.ctx;if(!C)return;for(let i=0;i<3;i++)tone(440,.25,'square',.035,0,undefined,C.currentTime+i*.35)},
 laser:()=>tone(1800,.6,'sine',.02,1700)};
const mf=n=>440*Math.pow(2,(n-69)/12),PROG=[45,41,43,40],CH=[[0,3,7],[0,4,7],[0,4,7],[0,4,7]];
function sched(){const C=AU.ctx;if(!C)return;const spb=60/(AU.level>=2?132:108)/4;if(AU.next<C.currentTime-.5)AU.next=C.currentTime;while(AU.next<C.currentTime+.12){playStep(AU.step,AU.next,spb);AU.step=(AU.step+1)%64;AU.next+=spb}}
function playStep(s,t,spb){if(!AU.musicOn)return;const L=AU.level,bar=s>>4,i=s&15,root=PROG[bar],C=AU.ctx;
 if(L>=1){if(i==0||i==8||(L>=2&&(i==6||i==11)))tone(150,.28,'sine',.5,38,musG,t);if(i==4||i==12)noise(.25,.16,1700,'bandpass',1,musG,t,.9);if(L>=2||i%2==0)noise(i%4==2?.08:.04,.04,7000,'highpass',1,musG,t);
  if([0,3,6,8,11,14].includes(i)){const o=C.createOscillator(),f=C.createBiquadFilter(),g=C.createGain();o.type='sawtooth';o.frequency.value=mf(root-12);f.type='lowpass';f.frequency.setValueAtTime(L>=2?900:500,t);f.frequency.exponentialRampToValueAtTime(140,t+spb*1.6);g.gain.setValueAtTime(.16,t);g.gain.exponentialRampToValueAtTime(.0001,t+spb*1.7);o.connect(f).connect(g).connect(musG);o.start(t);o.stop(t+spb*1.8)}}
 if(i==0)for(const iv of CH[bar])for(const dt of[-4,4]){const o=C.createOscillator(),g=C.createGain(),f=C.createBiquadFilter();o.type='sawtooth';o.frequency.value=mf(root+12+iv);o.detune.value=dt;f.type='lowpass';f.frequency.value=L?700:1100;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(L?.012:.02,t+.6);g.gain.linearRampToValueAtTime(.0001,t+spb*16);o.connect(f).connect(g).connect(musG);o.start(t);o.stop(t+spb*16+.1)}
 if(L>=2&&i%2==0){const iv=CH[bar][(i/2)%3]+((i/2)%4==3?12:0);tone(mf(root+24+iv),spb*1.6,'square',.025,0,musG,t)}}

/* ---------- floating damage numbers ---------- */
const numsEl=$('nums'),nums=[],_p=new THREE.Vector3();
export function dmgNum(x,y,z,v,col='#ffffff',big=false){if(nums.length>40||v<1)return;const el=document.createElement('span');el.textContent=Math.round(v);el.style.color=col;if(big)el.className='big';numsEl.appendChild(el);nums.push({el,x,y,z,t:.9,vy:rnd(2.5,4),ox:rnd(-14,14)})}
export function updNums(dt){const W=stage.clientWidth,H=stage.clientHeight;for(let i=nums.length-1;i>=0;i--){const n=nums[i];n.t-=dt;n.y+=n.vy*dt;_p.set(n.x,n.y,n.z).project(camera);
 if(n.t<=0||_p.z>1){n.el.remove();nums.splice(i,1);continue}n.el.style.transform=`translate(${(_p.x*.5+.5)*W+n.ox}px,${(-_p.y*.5+.5)*H}px) translate(-50%,-50%)`;n.el.style.opacity=Math.min(1,n.t*2.5)}}
export function clearNums(){for(const n of nums)n.el.remove();nums.length=0}
