import {THREE,TAU,rnd,clamp,lerp,TOUCH,scene,hemi,moon,rim,canvasTex,glow,addMat,geo,rbox,cyl,sph,cone,facet,part,anchor,FX,SMOKE,sparks,smoke,sprite,ring,bolt,flash,ARM,G,SFX,GLOWT,explode} from './core.js';
export let ARENA=625;let FS=ARENA*2+6;const K=()=>(ARENA/625)**2;
export function setArenaSize(a){ARENA=a;FS=a*2+6;E=a-6}
const sky=new THREE.Mesh(new THREE.SphereGeometry(1100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{f:{value:0},top:{value:new THREE.Color()},hor:{value:new THREE.Color()},sun:{value:new THREE.Vector3(0,.15,-1)},sunC:{value:new THREE.Color(0)}},
 vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec3 vP;uniform float f;uniform vec3 top,hor,sunC,sun;void main(){float h=vP.y;vec3 c=mix(hor,top,smoothstep(-.05,.45,h));float s=max(dot(normalize(vP),normalize(sun)),0.);c+=sunC*(pow(s,600.)*10.+pow(s,10.)*.4);c+=vec3(.6,.65,.9)*f*smoothstep(-.1,.5,h);gl_FragColor=vec4(c,1.);}'}));
sky.renderOrder=-1;scene.add(sky);
const _c1=new THREE.Color(),_c2=new THREE.Color();
export const W={id:null,group:null,covers:[],hazards:[],marks:[],debris:[],anim:[],storm:false,strikeT:4,light:0,nextLight:6,lightning:false,onBoom:null,onStrike:null,sky};

/* ---------- textures & world materials ---------- */
const noiseFill=(g,w,h,base,amt)=>{g.fillStyle=base;g.fillRect(0,0,w,h);const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-.5)*amt;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n}g.putImageData(d,0,0)};
const TX={
 roof:()=>canvasTex(1024,1024,(g)=>{g.fillStyle='#101317';g.fillRect(0,0,1024,1024);for(let x=0;x<1024;x+=128)for(let y=0;y<1024;y+=128){const v=20+Math.random()*7|0;g.fillStyle=`rgb(${v},${v+3},${v+7})`;g.fillRect(x+3,y+3,122,122);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x+3,y+3,122,2);g.fillStyle='#0a0c0f';for(const[a,b]of[[12,12],[116,12],[12,116],[116,116]]){g.beginPath();g.arc(x+a,y+b,3,0,7);g.fill()}}},8),
 desert:()=>canvasTex(512,512,(g)=>{noiseFill(g,512,512,'#b48a5c',26);g.strokeStyle='rgba(90,60,30,.25)';g.lineWidth=2;for(let y=0;y<512;y+=14){g.beginPath();for(let x=0;x<=512;x+=8)g.lineTo(x,y+Math.sin(x*.04+y)*4);g.stroke()}for(let i=0;i<6;i++){const x=rnd(0,512),y=rnd(0,512),r=rnd(20,60),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(30,20,10,.5)');gr.addColorStop(1,'rgba(30,20,10,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}},10),
 street:()=>canvasTex(512,512,(g)=>{noiseFill(g,512,512,'#2b2c30',22);g.fillStyle='rgba(0,0,0,.3)';for(let i=0;i<10;i++){g.beginPath();g.ellipse(rnd(0,512),rnd(0,512),rnd(10,40),rnd(6,20),rnd(0,3),0,TAU);g.fill()}},8),
 harbour:()=>canvasTex(1024,1024,(g)=>{noiseFill(g,1024,1024,'#55585b',20);g.strokeStyle='rgba(20,20,20,.6)';g.lineWidth=3;for(let i=0;i<=1024;i+=128){g.beginPath();g.moveTo(i,0);g.lineTo(i,1024);g.moveTo(0,i);g.lineTo(1024,i);g.stroke()}
  for(let i=0;i<40;i++){const x=rnd(0,1024),y=rnd(0,1024),gr=g.createLinearGradient(x,y,x,y+rnd(30,90));gr.addColorStop(0,'rgba(120,60,20,.35)');gr.addColorStop(1,'rgba(120,60,20,0)');g.fillStyle=gr;g.fillRect(x,y,rnd(3,9),90)}g.fillStyle='rgba(225,180,30,.85)';g.fillRect(60,0,14,1024);g.fillRect(950,0,14,1024)},4)};
const texCache={};const tex=k=>texCache[k]||(texCache[k]=TX[k]());
const roughMap=canvasTex(512,512,(g)=>{g.fillStyle='rgb(170,170,170)';g.fillRect(0,0,512,512);for(let i=0;i<14;i++){const x=Math.random()*512,y=Math.random()*512,r=rnd(20,70),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgb(85,85,85)');gr.addColorStop(1,'rgba(170,170,170,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}},3);roughMap.colorSpace=THREE.NoColorSpace;
const concT=canvasTex(256,256,(g)=>noiseFill(g,256,256,'#8a8782',30));
const winTex=canvasTex(64,512,(g)=>{g.fillStyle='#000';g.fillRect(0,0,64,512);for(let y=4;y<512;y+=8)for(let x=4;x<64;x+=7){const r=Math.random();if(r<.32){g.fillStyle=r<.14?'#ffcf8a':r<.26?'#9fd2ff':'#ff8fd8';g.globalAlpha=rnd(.35,1);g.fillRect(x,y,4,4)}}g.globalAlpha=1});
const std=(o)=>new THREE.MeshStandardMaterial(Object.assign({roughness:.6,metalness:.4,envMapIntensity:.5},o));
const WM={metal:std({color:0x6a7078,map:ARM.map,normalMap:ARM.nm,roughness:.45,metalness:.75}),dark:std({color:0x2a2d32,map:ARM.map,roughness:.55,metalness:.6}),concrete:std({color:0x8a8782,map:concT,roughness:.9,metalness:.05}),
 crate:std({color:0x5c5f3e,map:ARM.map,normalMap:ARM.nm,roughness:.6,metalness:.5}),red:std({color:0x9a2a20,map:ARM.map,roughness:.5,metalness:.5}),sand:std({color:0xb08a5e,roughness:1,metalness:0}),tire:std({color:0x111111,roughness:.9,metalness:0}),
 city:new THREE.MeshStandardMaterial({color:0x0b0d12,roughness:.55,metalness:.5,emissive:0xffffff,emissiveMap:winTex,emissiveIntensity:1.25,envMapIntensity:.15}),glass:std({color:0x101820,roughness:.1,metalness:.9})};
const CONT=[0xa0342a,0x2a5a8a,0x2f7a46,0xc08a20,0x6a6a6a,0x8a3a6a].map(c=>std({color:c,map:ARM.map,normalMap:ARM.nm,roughness:.6,metalness:.6}));
const CARS=[0x8a1c1c,0x1c3a6a,0xd0d0d0,0x222222,0xc09020,0x2a6a4a].map(c=>std({color:c,roughness:.25,metalness:.85,envMapIntensity:1}));

/* ---------- weather ---------- */
const WN=TOUCH?1200:2400,wPos=new Float32Array(WN*6),wGeo=new THREE.BufferGeometry();wGeo.setAttribute('position',new THREE.BufferAttribute(wPos,3));
const wMat=new THREE.LineBasicMaterial({color:0x9fb2d0,transparent:true,opacity:.3}),weather=new THREE.LineSegments(wGeo,wMat);weather.frustumCulled=false;scene.add(weather);
let wv=[0,-55,0],wlen=1.3,wActive=WN;
function setWeather(kind){if(kind=='dust'){wv=[16,-1.5,4];wlen=.5;wMat.color.set(0xd9b080);wMat.opacity=.22;wActive=WN*.5|0}else if(kind=='storm'){wv=[-14,-72,4];wlen=1.6;wMat.color.set(0xa8b8d0);wMat.opacity=.36;wActive=WN}else{wv=[0,-55,0];wlen=1.3;wMat.color.set(0x9fb2d0);wMat.opacity=.3;wActive=WN*.85|0}
 const L=Math.hypot(...wv),n=wv.map(v=>v/L*wlen);for(let i=0;i<WN;i++){const x=rnd(-70,70),y=i<wActive?rnd(0,60):-999,z=rnd(-70,70);wPos.set([x,y,z,x+n[0],y+n[1],z+n[2]],i*6)}wGeo.attributes.position.needsUpdate=true}
function updWeather(dt,cx,cz){weather.position.set(cx,0,cz);const L=Math.hypot(...wv),n=wv.map(v=>v/L*wlen);for(let i=0;i<wActive;i++){const o=i*6;wPos[o]+=wv[0]*dt;wPos[o+1]+=wv[1]*dt;wPos[o+2]+=wv[2]*dt;
 if(wPos[o+1]<0||wPos[o]>70||wPos[o]<-70){const y=W.id=='desert'?rnd(0,25):rnd(40,60);wPos[o]=W.id=='desert'?-70+rnd(0,10):rnd(-70,70);wPos[o+1]=y;wPos[o+2]=rnd(-70,70);if(W.id!='desert'&&Math.random()<.04)FX.emit(cx+wPos[o],.05,cz+wPos[o+2],0,1.5,0,.18,.35,.5,.6,.8,.5)}
 wPos[o+3]=wPos[o]+n[0];wPos[o+4]=wPos[o+1]+n[1];wPos[o+5]=wPos[o+2]+n[2]}wGeo.attributes.position.needsUpdate=true}

/* ---------- cover objects ---------- */
const CK={ac:{w:5,d:4,h:3.2,hp:500},crate:{w:3,d:3,h:3,hp:180},barrel:{w:1.7,d:1.7,h:2.1,hp:40,boom:[7,60]},tank:{w:6,d:6,h:5,hp:650,boom:[13,90]},car:{w:2.7,d:5.4,h:1.9,hp:200,boom:[8,70]},
 container:{w:3.3,d:8,h:3.4,hp:900},barrier:{w:1.3,d:5,h:1.5,hp:350},pipe:{w:2.2,d:9,h:2.8,hp:600},dumpster:{w:2.4,d:4,h:2.3,hp:300}};
function coverMesh(k,w,d,h,rot){const g=new THREE.Group(),r=rot?Math.PI/2:0,inner=new THREE.Group();inner.rotation.y=r;g.add(inner);const W_=w,D_=d;
 switch(k){
 case 'ac':{part(facet(W_,h,D_,.2,.96,1),WM.metal,0,h/2,0,inner);part(rbox(W_*.8,.16,D_*.8,.06),WM.dark,0,h+.05,0,inner);const c=Math.random()<.5?0xff2bd6:0x2bf0ff;for(const s of[-1,1])part(rbox(W_*.7,.1,.06,.02),glow(c,2.2),0,h*.75,s*(D_/2+.01),inner);part(cyl(Math.min(W_,D_)*.28,Math.min(W_,D_)*.28,.2,16),WM.dark,0,h+.18,0,inner);part(cyl(Math.min(W_,D_)*.3,Math.min(W_,D_)*.3,.06,16),glow(0xffa040,1.2),0,h+.12,0,inner);break}
 case 'crate':{part(rbox(W_,h,D_,.08),WM.crate,0,h/2,0,inner);for(const y of[.25,.75])part(rbox(W_+.06,.15,D_+.06,.03),WM.dark,0,h*y,0,inner);break}
 case 'barrel':{part(cyl(.8,.8,h,14),WM.red,0,h/2,0,inner);for(const y of[.3,.7])part(cyl(.83,.83,.12,14),WM.dark,0,h*y,0,inner);part(cyl(.5,.5,.03,12),glow(0xffb020,1.2),0,h+.01,0,inner);break}
 case 'tank':{part(cyl(W_/2,W_/2,h,24),WM.metal,0,h/2,0,inner);part(cyl(W_/2-.2,W_/2,.5,24),WM.dark,0,h+.25,0,inner);part(rbox(W_*.6,.4,.1,.03),WM.red,0,h*.6,W_/2+.02,inner);break}
 case 'car':{const m=CARS[Math.random()*CARS.length|0];part(facet(2.6,.9,5.3,.25,.95,1),m,0,.75,0,inner);part(facet(2.2,.75,2.6,.25,.75,1,-.1),WM.glass,0,1.5,-.2,inner);
  for(const x of[-1.15,1.15])for(const z of[-1.6,1.6])part(cyl(.45,.45,.35,12),WM.tire,x,.45,z,inner,0,0,Math.PI/2);for(const x of[-.8,.8]){part(rbox(.5,.18,.06,.03),glow(0xfff0d0,2.5),x,.85,2.66,inner);part(rbox(.5,.15,.06,.03),glow(0xff2020,2.5),x,.9,-2.66,inner)}break}
 case 'container':{const m=CONT[Math.random()*CONT.length|0];part(rbox(W_,h,D_,.05),m,0,h/2,0,inner);for(let i=-3;i<=3;i++)part(rbox(.08,h*.9,.08,.02),WM.dark,W_/2+.03,h/2,i*D_/7,inner);break}
 case 'barrier':{part(facet(W_,h,D_,.1,.45,1),WM.concrete,0,h/2,0,inner);part(rbox(W_*.5,.12,D_*.98,.03),glow(0xff8020,1.2),0,h*.7,0,inner);break}
 case 'pipe':{for(const y of[.9,2])part(cyl(.5,.5,D_,14),WM.metal,0,y,0,inner,Math.PI/2);for(const z of[-D_/2+.5,D_/2-.5])part(rbox(W_,h,.3,.05),WM.dark,0,h/2,z,inner);break}
 case 'dumpster':{part(facet(W_,h,D_,.15,1.05,.95),CONT[2],0,h/2,0,inner);part(rbox(W_+.1,.1,D_+.1,.03),WM.dark,0,h,0,inner);break}}
 return g}
/* spatial grid so a 5 km map stays fast */
const CELL=40,grid=new Map(),gk=(i,j)=>i*100003+j;
function gAdd(c){c.cells=[];for(let i=Math.floor((c.x-c.w/2)/CELL);i<=Math.floor((c.x+c.w/2)/CELL);i++)for(let j=Math.floor((c.z-c.d/2)/CELL);j<=Math.floor((c.z+c.d/2)/CELL);j++){const k=gk(i,j);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(c);c.cells.push(k)}}
function gDel(c){for(const k of c.cells||[]){const a=grid.get(k);if(a){const i=a.indexOf(c);if(i>=0)a.splice(i,1)}}}
export function coversNear(x,z,r){const out=new Set();for(let i=Math.floor((x-r)/CELL);i<=Math.floor((x+r)/CELL);i++)for(let j=Math.floor((z-r)/CELL);j<=Math.floor((z+r)/CELL);j++){const a=grid.get(gk(i,j));if(a)for(const c of a)if(!c.dead)out.add(c)}return[...out]}
/* chunked instanced props: only chunks near the camera get drawn */
const CH=400,chunks=new Map(),_m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new THREE.Vector3(),_p=new THREE.Vector3(),_c=new THREE.Color();
const PK={
 ac:()=>[[facet(5,3.2,4,.2,.96,1),WM.metal,0,1.6,0],[rbox(4,.16,3.2,.06),WM.dark,0,3.25,0],[rbox(3.5,.1,4.04,.02),glow(0xff2bd6,2.2),0,2.4,0]],
 crate:()=>[[rbox(3,3,3,.08),WM.crate,0,1.5,0],[rbox(3.06,.15,3.06,.03),WM.dark,0,.75,0],[rbox(3.06,.15,3.06,.03),WM.dark,0,2.25,0]],
 barrel:()=>[[cyl(.8,.8,2.1,14),WM.red,0,1.05,0],[cyl(.83,.83,.12,14),WM.dark,0,1.4,0],[cyl(.5,.5,.03,12),glow(0xffb020,1.2),0,2.11,0]],
 tank:()=>[[cyl(3,3,5,24),WM.metal,0,2.5,0],[cyl(2.8,3,.5,24),WM.dark,0,5.25,0]],
 car:()=>[[facet(2.6,.9,5.3,.25,.95,1),'tint',0,.75,0],[facet(2.2,.75,2.6,.25,.75,1,-.1),WM.glass,0,1.5,-.2],[rbox(2,.18,5.36,.03),glow(0xfff0d0,2),0,.85,0]],
 container:()=>[[rbox(3.3,3.4,8,.05),'tint',0,1.7,0]],
 barrier:()=>[[facet(1.3,1.5,5,.1,.45,1),WM.concrete,0,.75,0],[rbox(.65,.12,4.9,.03),glow(0xff8020,1.2),0,1.05,0]],
 pipe:()=>[[cyl(.5,.5,9,14),WM.metal,0,.9,0,Math.PI/2],[cyl(.5,.5,9,14),WM.metal,0,2,0,Math.PI/2],[rbox(2.2,2.8,.3,.05),WM.dark,0,1.4,-4],[rbox(2.2,2.8,.3,.05),WM.dark,0,1.4,4]],
 dumpster:()=>[[facet(2.4,2.3,4,.15,1.05,.95),CONT[2],0,1.15,0]],
 post:()=>[[rbox(.2,1.5,.2,.05),WM.metal,0,.75,0]],
 lamp:()=>[[rbox(.3,7,.3,.08),WM.dark,0,3.5,0],[rbox(.5,.2,2.2,.05),WM.dark,0,7,.9],[rbox(.4,.08,1.6,.03),glow(0xffd8a0,3),0,6.88,1]],
 sign:()=>[[rbox(.15,8,4,.05),'glowtint',0,14,0]]};
const TINT=new THREE.MeshStandardMaterial({color:0xffffff,map:ARM.map,normalMap:ARM.nm,roughness:.45,metalness:.7,envMapIntensity:.8}),GTINT=new THREE.MeshBasicMaterial({color:0xffffff});
function chunk(kind,x,z){const ci=Math.floor(x/CH),cj=Math.floor(z/CH),key=kind+':'+ci+':'+cj;let c=chunks.get(key);if(c)return c;
 const parts=PK[kind]().map(([g,mat,px,py,pz,rx=0])=>{const im=new THREE.InstancedMesh(g,mat=='tint'?TINT:mat=='glowtint'?GTINT:mat,220);im.count=0;im.castShadow=im.receiveShadow=!(mat.isMeshBasicMaterial||mat=='glowtint');W.group.add(im);return{im,l:new THREE.Matrix4().compose(new THREE.Vector3(px,py,pz),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,0)),new THREE.Vector3(1,1,1)),tint:mat=='tint'||mat=='glowtint'}});
 c={parts,n:0};chunks.set(key,c);return c}
function inst(kind,x,z,ry=0,y=0,col=null,sy=1){const c=chunk(kind,x,z);if(c.n>=220)return null;const i=c.n++;_m.compose(_p.set(x,y,z),_q.setFromEuler(_e.set(0,ry,0)),_s.set(1,sy,1));
 for(const p of c.parts){p.im.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(_m,p.l));if(p.tint)p.im.setColorAt(i,_c.set(col||0xffffff));p.im.count=c.n;p.im.instanceMatrix.needsUpdate=true;if(p.im.instanceColor)p.im.instanceColor.needsUpdate=true}return{c,i}}
function finishChunks(){for(const c of chunks.values())for(const p of c.parts)p.im.computeBoundingSphere()}
const CCOL={car:[0x8a1c1c,0x1c3a6a,0xd0d0d0,0x222222,0xc09020,0x2a6a4a],container:[0xa0342a,0x2a5a8a,0x2f7a46,0xc08a20,0x6a6a6a,0x8a3a6a],sign:[0xff2bd6,0x2bf0ff,0xffb02b,0xff3355,0x9b5cff]};
function addCover(k,x,z,rot=false,ov){const c=Object.assign({},CK[k],ov||{});let w=c.w,d=c.d;if(rot)[w,d]=[d,w];
 if(Math.max(Math.abs(x),Math.abs(z))<60){const g=coverMesh(k,c.w,c.d,c.h,rot);g.position.set(x,0,z);g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});W.group.add(g);const cv={kind:k,x,z,w,d,h:c.h,hp:c.hp,max:c.hp,boom:c.boom,g,dead:false};W.covers.push(cv);gAdd(cv);return cv}
 const pal=CCOL[k],h=inst(k,x,z,rot?Math.PI/2:0,0,pal?pal[Math.random()*pal.length|0]:null);if(!h)return null;const cv={kind:k,x,z,w,d,h:c.h,hp:c.hp,max:c.hp,boom:c.boom,ih:h,dead:false};W.covers.push(cv);gAdd(cv);return cv}
function addSolid(x,z,w,d,h){const cv={kind:'solid',x,z,w,d,h,hp:1e12,max:1e12,solid:true,dead:false};W.covers.push(cv);gAdd(cv);return cv}
export function addTempCover(x,z,w,d,h,hp,g){g.position.set(x,0,z);W.group.add(g);const cv={kind:'wall',x,z,w,d,h,hp,max:hp,g,dead:false};W.covers.push(cv);gAdd(cv);return cv}
export function damageCover(c,d){if(c.dead||(c.solid&&!(W.destruct&&c.tim)))return;c.hp-=d;if(c.hp>0)return;c.dead=true;gDel(c);const i=W.covers.indexOf(c);if(i>=0)W.covers.splice(i,1);
 if(c.tim){_m.makeScale(0,0,0);c.tim.setMatrixAt(c.ti,_m);c.tim.instanceMatrix.needsUpdate=true;for(let k=0;k<14;k++)SMOKE.emit(c.x+rnd(-c.w/2,c.w/2),rnd(1,Math.min(c.h,30)),c.z+rnd(-c.d/2,c.d/2),rnd(-2,2),rnd(2,6),rnd(-2,2),5,4,.25,.23,.22,.6,-.2,2.5);sparks(c.x,4,c.z,0xffb040,24,16);flash(c.x,6,c.z,0xffa040,900,.3);G.shake=Math.max(G.shake,.8);SFX.boom(.25)}
 if(c.g)W.group.remove(c.g);if(c.ih){const z=new THREE.Matrix4().makeScale(0,0,0);for(const p of c.ih.c.parts){p.im.setMatrixAt(c.ih.i,z);p.im.instanceMatrix.needsUpdate=true}}
 const n=Math.min(14,4+(c.w*c.d*c.h/6|0));for(let k=0;k<n;k++){const s=rnd(.3,.8),m=new THREE.Mesh(geo('chunk',()=>new THREE.BoxGeometry(1,1,1)),c.kind=='car'?WM.dark:c.kind=='container'?CONT[0]:WM.metal);m.scale.set(s,s*rnd(.4,1),s);m.position.set(c.x+rnd(-c.w/2,c.w/2),rnd(.5,c.h),c.z+rnd(-c.d/2,c.d/2));m.castShadow=true;scene.add(m);
  W.debris.push({m,vx:rnd(-8,8),vy:rnd(5,14),vz:rnd(-8,8),rx:rnd(-6,6),rz:rnd(-6,6),t:rnd(2.5,4)})}
 smoke(c.x,c.h/2,c.z,8,1.5,.18);sparks(c.x,c.h/2,c.z,0xffb040,14,12);SFX.boom(.1);if(c.boom&&W.onBoom)W.onBoom(c)}
function cellList(x,z){return grid.get(gk(Math.floor(x/CELL),Math.floor(z/CELL)))}
export function blockHit(x,z,y,r=0){const a=cellList(x,z);if(!a)return null;for(const c of a)if(!c.dead&&y<c.h&&Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r)return c;return null}
export function pushOut(o,r){for(const c of coversNear(o.x,o.z,r+1)){const cx=clamp(o.x,c.x-c.w/2,c.x+c.w/2),cz=clamp(o.z,c.z-c.d/2,c.z+c.d/2),dx=o.x-cx,dz=o.z-cz,dd=Math.hypot(dx,dz);
 if(dd<r){if(dd<1e-4){const ox=(o.x-c.x)/(c.w/2),oz=(o.z-c.z)/(c.d/2);if(Math.abs(ox)>Math.abs(oz))o.x=c.x+Math.sign(ox||1)*(c.w/2+r);else o.z=c.z+Math.sign(oz||1)*(c.d/2+r)}else{o.x=cx+dx/dd*r;o.z=cz+dz/dd*r}}}
 o.x=clamp(o.x,-ARENA+r,ARENA-r);o.z=clamp(o.z,-ARENA+r,ARENA-r)}
export function segBlocked(x1,z1,x2,z2,minH=2){let best=null,bt=1;const L=Math.hypot(x2-x1,z2-z1);for(const c of coversNear((x1+x2)/2,(z1+z2)/2,L/2+2)){if(c.h<minH)continue;let t0=0,t1=1;const dx=x2-x1,dz=z2-z1;let ok=true;
 for(const[p,d,lo,hi]of[[x1,dx,c.x-c.w/2,c.x+c.w/2],[z1,dz,c.z-c.d/2,c.z+c.d/2]]){if(Math.abs(d)<1e-6){if(p<lo||p>hi){ok=false;break}}else{let a=(lo-p)/d,b=(hi-p)/d;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1){ok=false;break}}}
 if(ok&&t0<bt){bt=t0;best=c}}return best?{c:best,t:bt}:null}
/* free-standing solid towers, drawn instanced per chunk */
const towerSets=new Map();
function tower(x,z,w,d,h,y0,mat){const ci=Math.floor(x/CH),cj=Math.floor(z/CH),key=ci+':'+cj+':'+mat.uuid;let t=towerSets.get(key);if(!t){t={im:new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,500),n:0};t.im.count=0;t.im.castShadow=t.im.receiveShadow=true;W.group.add(t.im);towerSets.set(key,t)}
 if(t.n>=500)return;_m.compose(_p.set(x,y0+h/2,z),_q.identity(),_s.set(w,h,d));t.im.setMatrixAt(t.n++,_m);t.im.count=t.n;const cv=addSolid(x,z,w,d,y0+h);cv.tim=t.im;cv.ti=t.n-1;cv.hp=cv.max=Math.max(600,w*d*h*.12);
 if(Math.random()<.35){const ax=Math.random()<.5,sd=Math.random()<.5?1:-1;inst('sign',ax?x+sd*(w/2+.2):x+rnd(-w/4,w/4),ax?z+rnd(-d/4,d/4):z+sd*(d/2+.2),ax?0:Math.PI/2,rnd(0,Math.max(0,y0+h-24)),CCOL.sign[Math.random()*5|0])}}
function finishTowers(){for(const t of towerSets.values()){t.im.instanceMatrix.needsUpdate=true;t.im.computeBoundingSphere()}}
const R=(a,b)=>rnd(a,b),OUT=(x,z,m=62)=>Math.max(Math.abs(x),Math.abs(z))>Math.min(m,ARENA*.62);
function freeAt(x,z,w,d){const rr=Math.max(w,d)/2;if(W.hazards.some(h=>Math.hypot(h.x-x,h.z-z)<h.r+rr+1.5))return false;if((W.dunes||[]).some(u=>Math.hypot(u.x-x,u.z-z)<u.r+rr+2))return false;return!coversNear(x,z,rr+3).some(c=>Math.abs(c.x-x)<(c.w+w)/2+2&&Math.abs(c.z-z)<(c.d+d)/2+2)}
function cluster(kinds,cx,cz,n,spread){for(let i=0;i<n;i++){const k=kinds[Math.random()*kinds.length|0],c=CK[k],rot=Math.random()<.5,w=rot?c.d:c.w,d=rot?c.w:c.d,x=clamp(cx+R(-spread,spread),-ARENA+6,ARENA-6),z=clamp(cz+R(-spread,spread),-ARENA+6,ARENA-6);if(OUT(x,z)&&freeAt(x,z,w,d))addCover(k,x,z,rot)}}
let E=ARENA-6;const rp=()=>R(-E,E);
const EXPAND={
 roof(){for(let x=-E+60;x<E;x+=160)for(let z=-E+60;z<E;z+=160){if(Math.random()<.35)continue;const px=x+R(-40,40),pz=z+R(-40,40),w=R(20,45),d=R(20,45);if(!OUT(px,pz,90))continue;tower(px,pz,w,d,R(40,220),-160,WM.city)}
  for(let i=0,n=Math.round(250*K());i<n;i++){const x=rp(),z=rp();if(OUT(x,z,90))cluster(['ac','crate','crate','barrier','ac'],x,z,R(3,7)|0,16)}
  for(let i=-E;i<=E;i+=8)for(const[x,z]of[[i,-ARENA-1.5],[i,ARENA+1.5],[-ARENA-1.5,i],[ARENA+1.5,i]])inst('post',x,z)},
 desert(){W.dunes=[];
  for(let i=0,n=Math.round(190*K());i<n;i++){const x=rp(),z=rp();if(!OUT(x,z,90))continue;if(freeAt(x,z,7,7))addCover('tank',x,z);cluster(['barrel','barrel','barrel','pipe','crate'],x,z,R(4,9)|0,14);
   if(i%3==0){const fx=x+R(-18,18),fz=z+R(-18,18);if(freeAt(fx,fz,9,9)){const m=new THREE.Mesh(geo('disc',()=>new THREE.CircleGeometry(1,40)),addMat(0xff5010,.55,GLOWT));m.rotation.x=-Math.PI/2;m.position.set(fx,.06,fz);m.scale.setScalar(5.5);W.group.add(m);W.hazards.push({type:'fire',x:fx,z:fz,r:4.3})}}
   if(i%4==0){const tx=x+R(-25,25),tz=z+R(-25,25);if(freeAt(tx,tz,4,4)){const h=R(20,45);tower(tx,tz,3,3,h,0,WM.metal);W.flares.push({x:tx,y:h+4,z:tz})}}}
  for(let i=0,n=Math.round(150*K());i<n;i++){const x=rp(),z=rp();if(!OUT(x,z,120))continue;const sx=R(30,70),sz=R(30,70),rr=Math.max(sx,sz)/2;if(coversNear(x,z,rr+4).length||W.hazards.some(h=>Math.hypot(h.x-x,h.z-z)<h.r+rr+2)||W.dunes.some(u=>Math.hypot(u.x-x,u.z-z)<u.r+rr))continue;const d=new THREE.Mesh(sph(1,16),WM.sand);d.position.set(x,-6,z);d.scale.set(sx,R(8,14),sz);W.group.add(d);W.dunes.push({x,z,r:rr})}},
 street(){const B=110,RW=12,N=Math.ceil(ARENA/B)+1;for(let i=-N;i<=N;i++)for(let j=-N;j<=N;j++){const cx=i*B,cz=j*B;if(Math.max(Math.abs(cx),Math.abs(cz))<B)continue;const half=(B-RW*2)/2,q=Math.random();
   if(q<.25)tower(cx,cz,half*2,half*2,R(30,160),0,WM.city);else if(q<.9){for(const sx of[-1,1])for(const sz of[-1,1])if(Math.random()<.85)tower(cx+sx*half/2,cz+sz*half/2,half-4,half-4,R(20,120),0,WM.city)}
   else cluster(['crate','dumpster','barrier','car'],cx,cz,8,half-4)}
  for(let i=-N;i<=N;i++){const rx=i*B+B/2;for(let t=-E;t<E;t+=R(14,40)){if(Math.random()<.55){const x=rx+(Math.random()<.5?-5:5),z=t;if(OUT(x,z)&&freeAt(x,z,3,6))addCover('car',x,z,false)}if(Math.random()<.55){const x=t,z=rx+(Math.random()<.5?-5:5);if(OUT(x,z)&&freeAt(x,z,6,3))addCover('car',x,z,true)}}
   for(let t=-E;t<E;t+=36){inst('lamp',rx-RW+.5,t,Math.PI/2);inst('lamp',t,rx-RW+.5,0)}}
  const dash=canvasTex(64,256,(g)=>{g.clearRect(0,0,64,256);g.fillStyle='rgba(235,235,235,.85)';g.fillRect(28,0,8,128)});dash.wrapT=THREE.RepeatWrapping;dash.repeat.set(1,FS/8);
  const dm=new THREE.MeshBasicMaterial({map:dash,transparent:true,depthWrite:false,color:0x9a9a9a});for(let i=-N;i<=N;i++){const rx=i*B+B/2;for(const ry of[0,Math.PI/2]){const m=new THREE.Mesh(new THREE.PlaneGeometry(.5,FS),dm);m.rotation.set(-Math.PI/2,0,ry);m.position.set(ry?0:rx,.03,ry?rx:0);W.group.add(m)}}},
 harbour(){for(let i=0,n=Math.max(2,Math.round(125*K()));i<n;i++){const cx=rp(),cz=rp();if(!OUT(cx,cz,90))continue;const rows=R(2,5)|0,cols=R(3,7)|0,rot=Math.random()<.5;for(let a=0;a<rows;a++)for(let b=0;b<cols;b++){if(Math.random()<.18)continue;const x=cx+(rot?b*4.2:a*12),z=cz+(rot?a*12:b*4.2);if(Math.abs(x)>E||Math.abs(z)>E||!freeAt(x,z,rot?8:3.3,rot?3.3:8))continue;
    const two=Math.random()<.35,cv=addCover('container',x,z,!rot,two?{h:6.8,hp:1800}:null);if(two&&cv&&cv.ih)inst('container',x,z,!rot?Math.PI/2:0,3.4,CCOL.container[Math.random()*6|0])}
   if(i%5==0){const g=new THREE.Group();g.position.set(cx+R(-20,20),0,cz+R(-20,20));g.rotation.y=R(0,3);for(const s2 of[-1,1])part(rbox(1.5,48,1.5,.1),WM.red,s2*6,20,0,g);part(rbox(14,2,2,.1),WM.red,0,44,0,g);part(rbox(2,2.5,60,.1),WM.red,0,48,10,g);part(sph(.5,8),glow(0xff2020,4),0,50,40,g);W.group.add(g);for(const s2 of[-1,1])addSolid(g.position.x+Math.cos(g.rotation.y)*s2*6,g.position.z-Math.sin(g.rotation.y)*s2*6,1.6,1.6,48)}
   cluster(['crate','crate','barrier'],cx+R(-30,30),cz+R(-30,30),R(2,5)|0,10)}
  for(let i=-E;i<=E;i+=10)for(const[x,z]of[[i,-ARENA-1.5],[i,ARENA+1.5],[-ARENA-1.5,i],[ARENA+1.5,i]])inst('post',x,z)}};
/* ---------- arenas ---------- */
const ARENAS={
 roof:{sky:[[.004,.006,.016],[.09,.035,.11]],sunC:0,fog:[0x0a0c14,.0045],hemi:[0x7088b0,0x0a0c10,1.1],moon:[0xb8c8ff,1.6,[25,45,12]],rim:0xff3a9a,weather:'rain',light:true},
 desert:{sky:[[.05,.04,.09],[.95,.42,.16]],sunC:0xffa040,sun:[-.6,.12,-1],fog:[0x6a3c22,.0042],hemi:[0xffc890,0x3a2414,1.15],moon:[0xffb070,2.6,[-40,30,-50]],rim:0xff7a30,weather:'dust'},
 street:{sky:[[.004,.006,.018],[.06,.04,.12]],sunC:0,fog:[0x0b0d16,.006],hemi:[0x6a7aa0,0x0a0c10,1],moon:[0xa8b8ff,1.3,[20,45,15]],rim:0x2bf0ff,weather:'rain',light:true},
 harbour:{sky:[[.01,.018,.022],[.07,.1,.11]],sunC:0,fog:[0x101a1e,.0065],hemi:[0x7a90a0,0x0a1012,1.05],moon:[0xc0d4e0,1.4,[30,45,-10]],rim:0x40ffd0,weather:'storm',light:true,storm:true}};
const MIST=canvasTex(128,128,(g)=>{for(let i=0;i<14;i++){const x=rnd(30,98),y=rnd(30,98),r=rnd(18,40),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128)}});
function mist(col,n=22,op=.09){for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:MIST,color:col,transparent:true,opacity:op,depthWrite:false}));const p={x:rnd(-80,80),z:rnd(-80,80),v:rnd(.6,1.6)};s.scale.set(rnd(18,30),rnd(5,8),1);s.position.y=rnd(.8,3);W.group.add(s);
 W.anim.push(dt=>{p.x+=p.v*dt;if(p.x>80)p.x=-80;s.position.x=(W.cx||0)+p.x;s.position.z=(W.cz||0)+p.z})}}
function searchlights(n,col,r0,r1){for(let i=0;i<n;i++){const g=new THREE.Group(),a=rnd(0,TAU),r=rnd(r0,r1);g.position.set(Math.cos(a)*r,rnd(20,60),Math.sin(a)*r);const c=new THREE.Mesh(new THREE.ConeGeometry(7,180,20,1,true),addMat(col,.05));c.position.y=90;const piv=new THREE.Group();piv.add(c);g.add(piv);W.group.add(g);
 const sp=rnd(.2,.45)*(Math.random()<.5?1:-1),ph=rnd(0,TAU);W.anim.push(dt=>{const t=performance.now()*.001;piv.rotation.z=Math.sin(t*sp+ph)*.55;piv.rotation.x=Math.cos(t*sp*.8+ph)*.4})}}
function floor(k,size,rep){const t=tex(k);const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshStandardMaterial({map:t,roughnessMap:roughMap,roughness:k=='desert'?1:.95,metalness:k=='desert'?0:k=='harbour'?.3:.55,envMapIntensity:k=='desert'?.2:.5}));
 m.rotation.x=-Math.PI/2;m.receiveShadow=true;W.group.add(m);if(rep&&t.repeat){t.repeat.set(rep,rep)}return m}
function city(n,rMin,rMax,hMin,hMax,base=-160,avoid=0){const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),WM.city,n),o=new THREE.Object3D();const signs=[0xff2bd6,0x2bf0ff,0xffb02b,0xff3355,0x9b5cff];
 for(let k=0;k<n;k++){let x,z,r;do{const a=rnd(0,TAU);r=rnd(rMin,rMax);x=Math.cos(a)*r;z=Math.sin(a)*r}while(Math.max(Math.abs(x),Math.abs(z))<avoid);const w=rnd(14,40),d=rnd(14,40),h=rnd(hMin,hMax);o.position.set(x,base+h/2,z);o.scale.set(w,h,d);o.updateMatrix();im.setMatrixAt(k,o.matrix);
  if(r<rMin+150&&Math.random()<.35){const c=signs[Math.random()*5|0],sw=rnd(3,9),sh=rnd(8,24),s=new THREE.Mesh(new THREE.PlaneGeometry(sw,sh),glow(c,1.8)),ax=Math.abs(x)>Math.abs(z);
   s.position.set(ax?x-Math.sign(x)*(w/2+.3):x+rnd(-w/3,w/3),clamp(rnd(base+20,base+h-sh),base+sh,base+h-sh/2),ax?z+rnd(-d/3,d/3):z-Math.sign(z)*(d/2+.3));s.rotation.y=ax?(x>0?-Math.PI/2:Math.PI/2):(z>0?Math.PI:0);W.group.add(s)}}
 W.group.add(im)}
function flyers(n,y0,y1){for(let i=0;i<n;i++){const g=new THREE.Group();part(rbox(2.6,.7,1.1,.25),WM.dark,0,0,0,g);part(rbox(.15,.25,.9,.05),glow(0xff3340,3),-1.3,0,0,g);part(rbox(.15,.2,.8,.05),glow(0xfff0d0,3),1.3,0,0,g);W.group.add(g);
 const c={r:rnd(110,300),y:rnd(y0,y1),a:rnd(0,TAU),s:rnd(.04,.11)*(Math.random()<.5?1:-1)};W.anim.push(dt=>{c.a+=c.s*dt;g.position.set(Math.cos(c.a)*c.r,c.y,Math.sin(c.a)*c.r);g.rotation.y=-c.a+(c.s>0?-Math.PI/2:Math.PI/2)})}}
function edgeGlow(col,E){for(let i=0;i<4;i++){const a=i*Math.PI/2,L=E*2,m=part(rbox(L,.08,.16,.03),glow(col,2.2),Math.sin(a)*(E-.4),.05,Math.cos(a)*(E-.4),W.group);m.rotation.y=a}}
function rails(E){const posts=new THREE.InstancedMesh(cyl(.09,.09,1.5,8),WM.metal,400),o=new THREE.Object3D();let k=0;for(let i=-E;i<=E&&k<396;i+=3)for(const[x,z]of[[i,-E],[i,E],[-E,i],[E,i]]){if(k>=400)break;o.position.set(x,.75,z);o.updateMatrix();posts.setMatrixAt(k++,o.matrix)}posts.count=k;W.group.add(posts);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;for(const y of[1.45,.8]){const m=part(rbox(E*2,.1,.1,.04),WM.metal,Math.sin(a)*E,y,Math.cos(a)*E,W.group);m.rotation.y=a}}}
const BUILD={
 roof(){floor('roof',FS,Math.round(FS/14.5));const b=new THREE.Mesh(new THREE.BoxGeometry(ARENA*2+6,160,ARENA*2+6),WM.city);b.position.y=-80.05;W.group.add(b);flyers(16,25,110);rails(ARENA+1.5);edgeGlow(0xffa040,ARENA+1.5);mist(0x8a8aa8);searchlights(5,0xbfd0ff,120,260);
  for(const[r0,r1,o]of[[10,10.25,.5],[6,6.12,.35]]){const m=new THREE.Mesh(new THREE.RingGeometry(r0,r1,96),addMat(0xffa040,o));m.rotation.x=-Math.PI/2;m.position.y=.03;W.group.add(m)}
  for(const[k,x,z,r]of[['ac',-22,-18],['ac',24,-20,1],['ac',-26,21],['crate',21,24],['crate',23,27.5],['barrier',0,-36,1],['barrier',0,36,1],['ac',-40,-2,1],['ac',40,2,1],['crate',-12,10],['crate',13,-7],['ac',-38,-38],['ac',38,38],['crate',30,-40],['crate',-30,40]])addCover(k,x,z,!!r)},
 desert(){const f=floor('desert',FS,Math.round(FS/13));for(let i=0;i<26;i++){const d=new THREE.Mesh(sph(1,16),WM.sand);const a=rnd(0,TAU),r=rnd(ARENA*2.4,520);d.position.set(Math.cos(a)*r,-8,Math.sin(a)*r);d.scale.set(rnd(40,90),rnd(14,30),rnd(40,90));W.group.add(d)}
  for(let i=0;i<14;i++){const a=rnd(0,TAU),r=rnd(ARENA*1.5+15,ARENA*1.5+100),x=Math.cos(a)*r,z=Math.sin(a)*r,h=rnd(20,55);part(cyl(rnd(3,6),rnd(3,6),h,16),WM.metal,x,h/2,z,W.group);part(cyl(1.5,1.5,1,10),glow(0xff8a30,1.5),x,h+.5,z,W.group);
   if(i%3==0){const fl=sprite(x,h+6,z,0xff7020,8,8,9999,1);W.anim.push(()=>{fl.scale.setScalar(9+Math.sin(performance.now()*.01+x)*2+Math.random()*2);if(Math.random()<.3)FX.emit(x+rnd(-1,1),h+3,z+rnd(-1,1),rnd(-1,1),rnd(6,10),rnd(-1,1),1,4,3,1.2,.3,.8)})}}
  for(let i=0;i<8;i++){const a=rnd(0,TAU),r=rnd(ARENA*1.45+10,ARENA*1.45+45);part(cyl(rnd(8,13),rnd(8,13),rnd(8,14),24),WM.metal,Math.cos(a)*r,5,Math.sin(a)*r,W.group)}
  for(const s of[-1,1]){part(facet(ARENA*2+8,2.2,3,.4,.6,1),WM.sand,0,1,s*(ARENA+3),W.group);part(facet(3,2.2,ARENA*2+8,.4,.6,1),WM.sand,s*(ARENA+3),1,0,W.group)}edgeGlow(0xff7a30,ARENA+.5);mist(0xd8a070,18,.08);
  for(const[x,z]of[[-20,-25],[25,15],[-28,24],[18,-30]]){const m=new THREE.Mesh(geo('disc',()=>new THREE.CircleGeometry(1,40)),addMat(0xff5010,.55,GLOWT));m.rotation.x=-Math.PI/2;m.position.set(x,.06,z);m.scale.setScalar(5.5);W.group.add(m);
   const oil=new THREE.Mesh(geo('disc',()=>new THREE.CircleGeometry(1,40)),new THREE.MeshStandardMaterial({color:0x050403,roughness:.05,metalness:.6}));oil.rotation.x=-Math.PI/2;oil.position.set(x,.04,z);oil.scale.setScalar(4.6);W.group.add(oil);W.hazards.push({type:'fire',x,z,r:4.3})}
  for(const[k,x,z,r]of[['tank',-38,-36],['tank',38,36],['pipe',0,-12,1],['pipe',-38,10],['pipe',40,-14],['barrel',-8,26],['barrel',-6,28.5],['barrel',-9.5,29],['barrel',30,-2],['barrel',32,-.5],['barrel',8,-40],['barrel',10,-41],['crate',12,30],['crate',-14,-40],['crate',-44,-12],['barrel',-32,-6],['crate',44,22]])addCover(k,x,z,!!r)},
 street(){floor('street',FS);const side=floor('harbour',420);side.position.y=-.06;side.material=side.material.clone();side.material.color.set(0x55555a);
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),WM.city,96),o=new THREE.Object3D();let k=0;for(const s of[-1,1])for(let i=-8;i<=8;i++){if(k>=92)break;const h=rnd(30,90),w=rnd(9,12);for(const[x,z]of[[i*11,s*(ARENA+9)],[s*(ARENA+9),i*11]]){if(Math.abs(i)<1)continue;o.position.set(x,h/2,z);o.scale.set(w,h,w);o.updateMatrix();im.setMatrixAt(k++,o.matrix)}}im.count=k;W.group.add(im);
  flyers(14,30,90);
  for(let i=-7;i<=7;i++)for(const[x,z,ry]of[[i*12,-(ARENA+2),0],[i*12,ARENA+2,Math.PI],[-(ARENA+2),i*12,Math.PI/2],[ARENA+2,i*12,-Math.PI/2]]){if(i==0)continue;const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;part(cyl(.12,.15,7,8),WM.dark,0,3.5,0,g);part(rbox(.3,.2,2,.05),WM.dark,0,7,.9,g);part(rbox(.25,.08,1.4,.03),glow(0xffd8a0,3),0,6.88,1,g);const cn=new THREE.Mesh(geo('lampc',()=>new THREE.ConeGeometry(2.6,7,16,1,true)),addMat(0xffd8a0,.07));cn.position.set(0,3.5,1);g.add(cn);W.group.add(g)}
  mist(0x7080a0,20,.08);searchlights(4,0xff7ad0,110,240);
  const signs=[0xff2bd6,0x2bf0ff,0xffb02b,0xff3355];for(let i=0;i<24;i++){const s=new THREE.Mesh(new THREE.PlaneGeometry(rnd(2,5),rnd(6,12)),glow(signs[i%4],1.8)),side=i%4,t=rnd(-ARENA+6,ARENA-6),d=ARENA+3.6;s.position.set(side==0?t:side==1?t:side==2?-d:d,rnd(8,26),side==0?-d:side==1?d:t);s.rotation.y=side==0?0:side==1?Math.PI:side==2?Math.PI/2:-Math.PI/2;W.group.add(s)}
  const spots=[[-20,-14,0],[16,-22,1],[-30,6,1],[26,10,0],[6,30,1],[-12,34,0],[36,-34,0],[-38,-30,1],[40,28,1],[-6,-4,0]];for(const[x,z,r]of spots)addCover('car',x,z,!!r);
  for(const[k,x,z,r]of[['barrier',-8,18],['barrier',12,-8,1],['barrier',30,-12],['barrier',-26,-30,1],['dumpster',-46,40],['dumpster',46,-42,1],['crate',22,40],['crate',-42,-8]])addCover(k,x,z,!!r)},
 harbour(){floor('harbour',FS,Math.round(FS/29));const wg=new THREE.PlaneGeometry(1200,1200,64,64);const water=new THREE.Mesh(wg,std({color:0x0a1a20,roughness:.12,metalness:.6,envMapIntensity:.8}));water.rotation.x=-Math.PI/2;water.position.y=-3.5;W.group.add(water);
  const base=wg.attributes.position.array.slice();let fr=0;W.anim.push(()=>{if((fr++)%2)return;const p=wg.attributes.position.array,t=performance.now()*.001;for(let i=0;i<p.length;i+=3){const x=base[i],y=base[i+1];p[i+2]=Math.sin(x*.035+t*1.3)*1.1+Math.cos(y*.05+t*1.7)*.8}wg.attributes.position.needsUpdate=true;wg.computeVertexNormals()});
  part(rbox(ARENA*2+6,6,ARENA*2+6,.3),WM.concrete,0,-3.02,0,W.group);for(let i=-ARENA;i<=ARENA;i+=10)for(const[x,z]of[[i,-ARENA-1.5],[i,ARENA+1.5],[-ARENA-1.5,i],[ARENA+1.5,i]])part(cyl(.45,.55,1.1,10),WM.dark,x,.55,z,W.group);edgeGlow(0xe0b020,ARENA+.6);
  for(let i=0;i<3;i++){const g=new THREE.Group(),a=i*.9-1.2;g.position.set(Math.sin(a)*(ARENA+75),0,-Math.cos(a)*(ARENA+75));g.rotation.y=-a;W.group.add(g);for(const s of[-1,1])part(rbox(1.5,48,1.5,.1),WM.red,s*6,20,0,g);part(rbox(14,2,2,.1),WM.red,0,44,0,g);part(rbox(2,2.5,60,.1),WM.red,0,48,10,g);part(rbox(4,3,4,.2),WM.dark,0,46,32,g);part(sph(.5,8),glow(0xff2020,4),0,50,40,g)}
  for(let i=0;i<40;i++){const a=rnd(-1.6,1.6),r=rnd(ARENA+30,ARENA+110);const cg=coverMesh('container',3.3,8,3.4,Math.random()<.5);cg.position.set(Math.sin(a)*r,(Math.random()*3|0)*3.4,-Math.cos(a)*r);cg.rotation.y=rnd(0,3);W.group.add(cg)}
  const lh=new THREE.Group();lh.position.set(ARENA+115,0,ARENA+35);W.group.add(lh);part(cyl(3,4,40,16),WM.concrete,0,20,0,lh);part(sph(2,12),glow(0xfff0c0,4),0,42,0,lh);const beamM=new THREE.Mesh(new THREE.ConeGeometry(14,160,24,1,true),addMat(0xfff0c0,.08));beamM.rotation.z=Math.PI/2;beamM.position.x=80;const bg=new THREE.Group();bg.position.y=42;bg.add(beamM);lh.add(bg);W.anim.push(dt=>bg.rotation.y+=dt*.5);
  mist(0x9ab0b8,26,.11);
  for(const[k,x,z,r]of[['container',-20,-14],['container',22,-20,1],['container',-30,22,1],['container',26,22],['container',0,-38,1],['container',-42,-36],['container',42,40],['crate',-8,14],['crate',10,4],['crate',-44,6],['crate',44,-6],['barrier',0,40,1]])addCover(k,x,z,!!r)}};

export function buildArena(id,opt={}){if(W.group){scene.remove(W.group);W.group.traverse(o=>{if(o.isInstancedMesh)o.dispose()})}for(const d of W.debris)scene.remove(d.m);for(const k of W.marks)scene.remove(k.m);
 grid.clear();chunks.clear();towerSets.clear();W.flares=[];W.dunes=[];W.group=new THREE.Group();scene.add(W.group);W.covers=[];W.hazards=[];W.marks=[];W.debris=[];W.anim=[];W.id=id;const A=ARENAS[id];W.cfg=A;
 sky.material.uniforms.top.value.setRGB(...A.sky[0]);sky.material.uniforms.hor.value.setRGB(...A.sky[1]);sky.material.uniforms.sunC.value.set(A.sunC||0);if(A.sun)sky.material.uniforms.sun.value.set(...A.sun);
 scene.fog.color.set(A.fog[0]);scene.fog.density=A.fog[1];hemi.color.set(A.hemi[0]);hemi.groundColor.set(A.hemi[1]);hemi.intensity=A.hemi[2];W.hemiI=A.hemi[2];moon.color.set(A.moon[0]);moon.intensity=A.moon[1];W.moonOff=A.moon[2];rim.color.set(A.rim);
 W.A=A;W.tod=0;W.storm=!!(A.storm||opt.storm);W.strikeT=4;W.lightning=!!A.light||W.storm;setWeather(A.weather);BUILD[id]();EXPAND[id]();finishChunks();finishTowers()}
export function updateWorld(dt,cx,cz,fx,fz,active){W.cx=cx;W.cz=cz;updWeather(dt,cx,cz);
 for(const f of W.flares||[])if(Math.abs(f.x-cx)<160&&Math.abs(f.z-cz)<160&&Math.random()<.5)FX.emit(f.x+rnd(-1,1),f.y,f.z+rnd(-1,1),rnd(-1,1),rnd(6,10),rnd(-1,1),1,4,3,1.2,.3,.8);for(const f of W.anim)f(dt);
 for(let i=W.debris.length-1;i>=0;i--){const d=W.debris[i];d.t-=dt;d.vy-=30*dt;d.m.position.x+=d.vx*dt;d.m.position.y+=d.vy*dt;d.m.position.z+=d.vz*dt;d.m.rotation.x+=d.rx*dt;d.m.rotation.z+=d.rz*dt;if(d.m.position.y<.2){d.m.position.y=.2;d.vy*=-.3;d.vx*=.6;d.vz*=.6;d.rx*=.5;d.rz*=.5}if(d.t<=0){scene.remove(d.m);W.debris.splice(i,1)}}
 for(const h of W.hazards)if(h.type=='fire'&&Math.abs(h.x-cx)<150&&Math.abs(h.z-cz)<150&&Math.random()<dt*24){const a=rnd(0,TAU),r=Math.sqrt(Math.random())*h.r;FX.emit(h.x+Math.cos(a)*r,.3,h.z+Math.sin(a)*r,rnd(-.5,.5),rnd(3,6),rnd(-.5,.5),rnd(.5,1),rnd(1,2.2),3,rnd(.8,1.5),.2,.9);if(Math.random()<.2)SMOKE.emit(h.x+rnd(-2,2),3,h.z+rnd(-2,2),0,3,0,2.5,3,.08,.07,.06,.4,-.4,1.5)}
 for(const c of coversNear(cx,cz,110))if(c.hp<c.max*.5&&Math.random()<dt*2)SMOKE.emit(c.x+rnd(-1,1),c.h,c.z+rnd(-1,1),rnd(-.4,.4),2.5,rnd(-.4,.4),1.8,1.6,.1,.1,.11,.45,-.3,1.5);
 if(W.storm&&active&&(W.strikeT-=dt)<=0){W.strikeT=rnd(2.2,4);const x=clamp(fx+rnd(-14,14),-ARENA+3,ARENA-3),z=clamp(fz+rnd(-14,14),-ARENA+3,ARENA-3);const m=new THREE.Mesh(geo('ring',()=>new THREE.RingGeometry(.86,1,64)),addMat(0xbfd8ff,.8));m.rotation.x=-Math.PI/2;m.position.set(x,.12,z);m.scale.setScalar(4.5);scene.add(m);W.marks.push({m,x,z,t:1.4,r:4.5})}
 for(let i=W.marks.length-1;i>=0;i--){const k=W.marks[i];k.t-=dt;k.m.material.opacity=.4+.5*Math.abs(Math.sin(k.t*14));if(k.t<=0){scene.remove(k.m);k.m.material.dispose();W.marks.splice(i,1);bolt({x:k.x+rnd(-6,6),y:80,z:k.z+rnd(-6,6)},{x:k.x,y:0,z:k.z},0xbfd8ff,4,.3);bolt({x:k.x,y:70,z:k.z},{x:k.x,y:0,z:k.z},0xffffff,3,.25);sprite(k.x,1,k.z,0xbfd8ff,3,14,.4);flash(k.x,5,k.z,0xbfd8ff,900,.35);sparks(k.x,.5,k.z,0xbfd8ff,20,14);W.light=.8;SFX.thunder();if(W.onStrike)W.onStrike(k.x,k.z,k.r)}}
 if(W.lightning&&(W.nextLight-=dt)<=0){W.nextLight=rnd(7,18);W.light=1;setTimeout(SFX.thunder,300)}
 if(W.A){if(active)W.tod+=dt/360;const A=W.A,d=W.day=.5-.5*Math.cos(W.tod*TAU),u=sky.material.uniforms,mx=(a,b)=>a+(b-a)*d;
  u.top.value.setRGB(mx(A.sky[0][0],.16),mx(A.sky[0][1],.3),mx(A.sky[0][2],.62));u.hor.value.setRGB(mx(A.sky[1][0],.7),mx(A.sky[1][1],.74),mx(A.sky[1][2],.8));
  _c1.set(A.fog[0]);_c2.set(0x8c98a8);scene.fog.color.copy(_c1).lerp(_c2,d);scene.fog.density=A.fog[1]*(1-.45*d);_c1.set(A.hemi[0]);_c2.set(0xe4ecff);hemi.color.copy(_c1).lerp(_c2,d);W.hemiI=A.hemi[2]+1.1*d;
  _c1.set(A.moon[0]);_c2.set(0xfff0d8);moon.color.copy(_c1).lerp(_c2,d);moon.intensity=A.moon[1]+2.4*d;u.sunC.value.set(A.sunC||0).lerp(_c2.set(0xffe0a0),d*.6)}
 W.light=Math.max(-1,W.light-dt*2.5);const f=Math.max(0,W.light)*(Math.random()<.3?.3:1);sky.material.uniforms.f.value=f;hemi.intensity=(W.hemiI||1)+f*2.5}
export function placeSun(tx,tz){const o=W.moonOff||[25,45,12];moon.position.set(tx+o[0],o[1],tz+o[2]);moon.target.position.set(tx,0,tz)}
export function skyFollow(p){sky.position.copy(p)}
export function flashSky(v=1){W.light=v}
