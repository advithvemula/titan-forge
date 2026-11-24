import {WEAPONS,TITANS} from './data.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {THREE,RoomEnvironment,TAU,rnd,lerp,glow,addMat,geo,rbox,cyl,sph,cone,facet,part,anchor,canvasTex,HEX,ARM,bolt,FX,SMOKE,hexRGB,boxUV} from './core.js';

export const PAINTS=[{id:'gunmetal',name:'Gunmetal',a:0x6a727c,b:0x8a929c,t:0xd9a41c},{id:'blackops',name:'Black ops',a:0x2e3237,b:0x454a51,t:0xb32020},
 {id:'desert',name:'Desert',a:0x9c8158,b:0xb89c70,t:0x2b2b2b},{id:'arctic',name:'Arctic',a:0xc4cad2,b:0xe2e6ea,t:0xe0402a},{id:'crimson',name:'Crimson',a:0x7a2222,b:0x9a312c,t:0xe8c26a},
 {id:'olive',name:'Olive drab',a:0x56603c,b:0x707a50,t:0xd9a41c},{id:'hazard',name:'Hazard',a:0xc0961c,b:0x33363b,t:0x111111},{id:'enemy',name:'Enemy',a:0x4e3432,b:0x684744,t:0xd9a41c,hidden:1},
 {id:'camo',name:'Jungle camo',a:0x3f4f2c,b:0x6b6a44,t:0x2b2b2b,lock:'Pass tier 10'},{id:'carbon',name:'Carbon',a:0x1d1f22,b:0x2e3136,t:0xff3a2a,r:.3,lock:'Premium tier 15'},
 {id:'digital',name:'Urban digital',a:0x5a6068,b:0x7c848e,t:0x111111,lock:'Pass tier 20'},{id:'cobalt',name:'Cobalt',a:0x1f3f8a,b:0x2f5ac0,t:0xffc23a,r:.25,lock:'Premium tier 25'},
 {id:'chrome',name:'Chrome',a:0xdfe4ea,b:0xb8bec6,t:0x222222,r:.08,m:1,lock:'Pass tier 30'},{id:'rosegold',name:'Rose gold',a:0xd49a8a,b:0xb87868,t:0x2a1a18,r:.18,m:1,lock:'Premium tier 35'},
 {id:'military',name:'Army issue',a:0x6b6a44,b:0x8a7d55,t:0xd9d9d9,lock:'Pass tier 40'},{id:'obsidian',name:'Obsidian',a:0x101014,b:0x2a1838,t:0xb04dff,r:.15,lock:'Premium tier 45'},
 {id:'gold',name:'Solid gold',a:0xd8a93a,b:0xb88a20,t:0x1a1200,r:.16,m:1,lock:'Pass tier 50'},
 {id:'neon',name:'Neon night',a:0x14121c,b:0xff2fa0,t:0x00f0ff,r:.3,lock:'Shop'},{id:'lava',name:'Lava flow',a:0x2a0d08,b:0xff5a1f,t:0xffd23a,r:.35,lock:'Shop'},{id:'ice',name:'Glacier',a:0xcfe9ff,b:0x7ab8e8,t:0x0b2a44,r:.12,m:.6,lock:'Shop'},
 {id:'titanium',name:'Titanium',a:0x9aa3ad,b:0xc6cdd4,t:0xffc23a,r:.14,m:1,lock:'Shop'},{id:'tiger',name:'Tiger stripe',a:0xe08a1e,b:0x1a1410,t:0xffffff,r:.4,lock:'Shop'},{id:'galaxy',name:'Galaxy',a:0x1b1040,b:0x5a2fb0,t:0xfff0ff,r:.2,m:.7,lock:'Shop'}];
export const GLOWS=[0x31c4ff,0x9cc9ff,0xff5a1f,0xff2a2a,0x4dff6a,0x9dff3a,0xb04dff,0xff2bd6,0xffc23a,0xffffff];
const pm=new Map();
export function paintMats(pid,enemy){let base=pm.get(pid);if(!base){const p=PAINTS.find(x=>x.id==pid)||PAINTS[0];
  const mk=(c,r=.42,m=.8)=>new THREE.MeshPhysicalMaterial({color:c,map:ARM.map,normalMap:ARM.nm,normalScale:new THREE.Vector2(1.1,1.1),roughness:r,metalness:m,envMapIntensity:1.9,clearcoat:.45,clearcoatRoughness:.22});
  base={armor:mk(p.a,p.r??.42,p.m??.8),armor2:mk(p.b,p.r??.42,p.m??.8),dark:mk(0x34373c,.5,.7),joint:new THREE.MeshStandardMaterial({color:0x141518,roughness:.45,metalness:.8,envMapIntensity:.7}),trim:new THREE.MeshStandardMaterial({color:p.t,roughness:.5,metalness:.3,envMapIntensity:.5})};for(const k of['armor','armor2','dark','joint','trim']){base[k+'V']=base[k].clone();base[k+'V'].vertexColors=true}pm.set(pid,base)}
 if(!enemy)return base;const e={...base,armor:base.armor.clone(),armorV:base.armorV.clone(),own:true};return e}
const RED=new THREE.MeshBasicMaterial({color:new THREE.Color(0xff2a18).multiplyScalar(3)});

/* ---------- decals ---------- */
const DEC={};
function decalMat(k){if(DEC[k])return DEC[k];const t=canvasTex(128,128,(g)=>{g.clearRect(0,0,128,128);
 if(k=='hazard'){g.save();g.beginPath();g.rect(8,40,112,48);g.clip();g.fillStyle='#e0a81e';g.fillRect(0,0,128,128);g.fillStyle='#151515';for(let x=-60;x<140;x+=20){g.beginPath();g.moveTo(x,88);g.lineTo(x+10,88);g.lineTo(x+58,40);g.lineTo(x+48,40);g.fill()}g.restore()}
 else if(k=='num'){g.fillStyle='rgba(240,240,240,.92)';g.font='bold 46px sans-serif';g.textAlign='center';g.fillText('Z-09',64,64);g.font='bold 20px sans-serif';g.fillText('TITAN',64,92)}
 else if(k=='x'){g.strokeStyle='rgba(235,235,235,.85)';g.lineWidth=12;g.beginPath();g.moveTo(30,30);g.lineTo(98,98);g.moveTo(98,30);g.lineTo(30,98);g.stroke()}
 else if(k=='rad'){g.fillStyle='#e8b81e';g.beginPath();g.arc(64,64,58,0,TAU);g.fill();g.fillStyle='#111';for(let i=0;i<3;i++){const a=i*TAU/3-Math.PI/2;g.beginPath();g.moveTo(64,64);g.arc(64,64,50,a-.52,a+.52);g.fill()}g.fillStyle='#e8b81e';g.beginPath();g.arc(64,64,14,0,TAU);g.fill();g.fillStyle='#111';g.beginPath();g.arc(64,64,9,0,TAU);g.fill()}
 else if(k=='bio'){g.strokeStyle='#e8b81e';g.lineWidth=9;for(let i=0;i<3;i++){const a=i*TAU/3-Math.PI/2;g.beginPath();g.arc(64+Math.cos(a)*22,64+Math.sin(a)*22,26,0,TAU);g.stroke()}g.beginPath();g.arc(64,64,12,0,TAU);g.stroke()}
 else if(k=='bolt'){g.fillStyle='#e8d84a';g.beginPath();g.moveTo(72,8);g.lineTo(30,72);g.lineTo(60,72);g.lineTo(50,120);g.lineTo(98,50);g.lineTo(68,50);g.closePath();g.fill()}
 else if(k=='flame'){const gr=g.createLinearGradient(0,120,0,10);gr.addColorStop(0,'#ff3a10');gr.addColorStop(1,'#ffc040');g.fillStyle=gr;g.beginPath();g.moveTo(64,8);g.bezierCurveTo(110,60,100,120,64,120);g.bezierCurveTo(28,120,18,60,64,8);g.fill()}
 else if(k=='wing'){g.fillStyle='#e8b81e';g.beginPath();g.moveTo(64,30);g.lineTo(120,70);g.lineTo(64,56);g.lineTo(8,70);g.closePath();g.fill()}});
 return DEC[k]=new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.6,metalness:.25,polygonOffset:true,polygonOffsetFactor:-4,depthWrite:false})}
function decal(par,k,x,y,z,ry=0,s=.8,rx=0,rz=0){const m=new THREE.Mesh(geo('dpl',()=>new THREE.PlaneGeometry(1,1)),decalMat(k));m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.scale.setScalar(s);par.add(m);return m}

/* ---------- arm weapons (all point along +z) ---------- */
function wGat(m,par,col,side,v){const M=m.mats,g=new THREE.Group();g.position.set(0,-.15,.6);par.add(g);
 part(facet(1.05,1.05,1.8,.2,.9,1),M.dark,0,0,0,g);part(facet(.65,.28,1.4,.08,.8,1),M.armor2,0,.65,-.1,g);part(rbox(.5,.08,1.2,.02),glow(col,2.2),0,.4,.2,g);
 const sp=new THREE.Group();sp.position.z=.9;g.add(sp);part(cyl(.52,.52,.42,16),M.armor2,0,0,.1,sp,Math.PI/2);
 for(let i=0;i<6;i++){const a=i/6*TAU;part(cyl(.085,.085,2.1,6),M.joint,Math.cos(a)*.28,Math.sin(a)*.28,1.15,sp,Math.PI/2)}
 part(cyl(.44,.44,.1,16),glow(col,2.6),0,0,.4,sp,Math.PI/2);part(cyl(.42,.42,.16,16),M.armor2,0,0,2.05,sp,Math.PI/2);part(cyl(.4,.4,.08,16),glow(col,1.8),0,0,1.1,sp,Math.PI/2);
 if(v=='acid')for(const s of[-1,1])part(cyl(.22,.22,1.1,10),glow(col,1.5),s*.62,.25,-.2,g,Math.PI/2);
 if(v=='arc')for(const z of[-.5,.1,.65])part(geo('tor6',()=>new THREE.TorusGeometry(.62,.06,6,22)),glow(col,3),0,0,z,g);
 m.spins.push(sp);m.muzzles[side].push(anchor(g,0,0,3.1))}
function wPlasma(m,par,col,side){const M=m.mats,g=new THREE.Group();g.position.set(0,-.15,.6);par.add(g);
 part(facet(.8,.85,3,.16,.85,1),M.armor,0,0,.55,g);part(facet(.5,.35,1.9,.08,.8,1),M.dark,0,.52,.3,g);for(const s of[-1,1])part(rbox(.06,.17,2.2,.02),glow(col,2.6),s*.42,0,.65,g);
 part(cyl(.34,.38,.45,12),M.dark,0,0,2.1,g,Math.PI/2);part(cyl(.3,.3,.08,16),glow(col,3.4),0,0,2.35,g,Math.PI/2);m.muzzles[side].push(anchor(g,0,0,2.6))}
function wBlade(m,par,col,side){const M=m.mats,g=new THREE.Group();g.position.set(0,-.15,.5);par.add(g);part(facet(.85,.95,1.6,.16),M.dark,0,0,0,g);part(cyl(.18,.18,1.7,10),M.joint,0,-.32,1,g,Math.PI/2);
 part(facet(.2,1,4.2,.05,1,.7),M.armor2,0,.32,2.75,g);part(rbox(.24,.13,4,.03),glow(col,3.4),0,.83,2.75,g);for(let i=0;i<10;i++)part(cone(.1,.36),glow(col,3.4),0,.95,.95+i*.39,g,-.5);part(cone(.22,.8),glow(col,3),0,.35,4.95,g,Math.PI/2);
 m.muzzles[side].push(anchor(g,0,-.32,1.9))}
function wSaw(m,par,col){const M=m.mats,g=new THREE.Group();g.position.set(0,-.15,.5);par.add(g);part(facet(.75,.85,1.7,.15),M.armor,0,0,0,g);const sp=new THREE.Group();sp.position.set(0,0,1.75);g.add(sp);
 part(cyl(1.25,1.25,.08,30),M.armor2,0,0,0,sp,0,0,Math.PI/2);part(geo('sawr',()=>new THREE.TorusGeometry(1.25,.07,6,30)),glow(col,3.2),0,0,0,sp,0,Math.PI/2);for(let i=0;i<14;i++){const a=i/14*TAU;part(cone(.11,.38),glow(col,3),0,Math.sin(a)*1.42,Math.cos(a)*1.42,sp,a+Math.PI/2)}
 part(cyl(.28,.28,.32,12),M.dark,0,0,0,sp,0,0,Math.PI/2);m.saws.push(sp)}
function wNuke(m,par,col,side){const M=m.mats,g=new THREE.Group();g.position.set(0,-.15,.6);par.add(g);part(cyl(.55,.6,2.8,14),M.armor,0,0,.7,g,Math.PI/2);for(const s of[-1,1])part(rbox(.12,.3,1.8,.04),glow(col,2.8),s*.56,0,.7,g);
 part(cyl(.46,.46,.12,16),glow(col,3.4),0,0,2.12,g,Math.PI/2);part(facet(.7,.45,1.1,.1),m.mats.trim,0,.6,-.1,g);m.muzzles[side].push(anchor(g,0,0,2.4))}
function wNeedle(m,par,col,side,c2){const M=m.mats,g=new THREE.Group();g.position.set(0,-.15,.55);par.add(g);part(facet(.85,.85,1.2,.15),M.dark,0,0,0,g);
 for(let i=0;i<3;i++){const y=(i-1)*.28;part(cyl(.12,.12,1.1,10),glow(i==1?(c2||col):col,2.2),0,y,1.05,g,Math.PI/2);part(cone(.07,.9),M.armor2,0,y,2.05,g,Math.PI/2)}m.muzzles[side].push(anchor(g,0,0,2.5))}
function wRail(m,par,col,side){const M=m.mats,g=new THREE.Group();g.position.set(0,-.15,.55);par.add(g);part(facet(.95,.95,1.5,.16),M.dark,0,0,0,g);
 for(const s of[-1,1])part(facet(.2,.34,4.6,.05,1,.8),M.armor2,s*.24,0,2.1,g);part(cyl(.11,.11,4.2,8),glow(col,2.2),0,0,2.1,g,Math.PI/2);for(let i=0;i<4;i++)part(geo('tor4',()=>new THREE.TorusGeometry(.34,.05,6,18)),glow(col,2.8),0,0,.9+i*.9,g);
 part(facet(.4,.5,.9,.08),M.armor,0,.55,.2,g);m.muzzles[side].push(anchor(g,0,0,4.5))}
const WMOD={autocannon:wNuke,shotgun:wPlasma,flamer:wBlade,napalm:wNuke,stormgun:(m,p,c,s)=>wGat(m,p,c,s,'arc'),ion:wRail,gamma:wRail,cluster:wNuke,spore:wNeedle,bile:(m,p,c,s)=>wGat(m,p,c,s,'acid'),smartgun:wPlasma,rotary:(m,p,c,s)=>wGat(m,p,c,s),acid:(m,p,c,s)=>wGat(m,p,c,s,'acid'),arc:(m,p,c,s)=>wGat(m,p,c,s,'arc'),plasma:wPlasma,ember:wBlade,saw:wSaw,fission:wNuke,needle:wNeedle,rail:wRail};

/* ---------- titan chassis ---------- */
export let MODEL=null;
export async function loadModels(url){const txt=await (await fetch(url)).text();const gltf=await new Promise((res,rej)=>new GLTFLoader().parse(txt,'',res,rej));const M={};
 gltf.scene.traverse(o=>{if(!o.name||M[o.name])return;const ms=o.isMesh?[o]:o.children.filter(c=>c.isMesh);if(!ms.length)return;M[o.name]=ms.map(me=>{const g=me.geometry,c=g.attributes.color;if(c){const n=c.count,f=new Float32Array(n*3);for(let i=0;i<n;i++){const v=Math.pow(Math.max(0,c.getX(i)),.45);const t=.5+.5*v;f[i*3]=f[i*3+1]=f[i*3+2]=t}g.setAttribute('color',new THREE.BufferAttribute(f,3))}return{g:boxUV(g,.5),mat:me.material.name}})});MODEL=M;return M}
function MB(k,par,M,col,c2){const L=MODEL&&MODEL[k];if(!L)return false;for(const p of L){const t=p.mat,mat=t=='ARMOR'?M.armorV:t=='ARMOR2'?M.armor2V:t=='DARK'?M.darkV:t=='JOINT'?M.jointV:t=='TRIM'?M.trimV:t=='RED'?RED:t=='GLOW2'?glow(c2||col,2.6):glow(col,2.6);
 const me=new THREE.Mesh(p.g,mat);me.castShadow=me.receiveShadow=!t.startsWith('GLOW');par.add(me)}return true}
const WBD={rotary:{p:[0,-.15,.6],mz:[0,0,3.1],sp:[0,0,.9],sk:'w_rotary__spin'},acid:{p:[0,-.15,.6],mz:[0,0,3.1],sp:[0,0,.9],sk:'w_rotary__spin'},arc:{p:[0,-.15,.6],mz:[0,0,3.1],sp:[0,0,.9],sk:'w_rotary__spin'},
 plasma:{p:[0,-.15,.6],mz:[0,0,2.6]},ember:{p:[0,-.15,.5],mz:[0,-.32,1.9]},saw:{p:[0,-.15,.5],sp:[0,0,1.75],sk:'w_saw__spin',saw:1},fission:{p:[0,-.15,.6],mz:[0,0,2.4]},needle:{p:[0,-.15,.55],mz:[0,0,2.5]},rail:{p:[0,-.15,.55],mz:[0,0,4.5]}};
function weaponB(m,par,k,col,side,c2){const d=WBD[k];if(!d||!MODEL['w_'+k])return WMOD[k]&&WMOD[k](m,par,col,side,c2);const g=new THREE.Group();g.position.set(...d.p);par.add(g);MB('w_'+k,g,m.mats,col,c2);
 if(d.sk){const sp=new THREE.Group();sp.position.set(...d.sp);g.add(sp);MB(d.sk,sp,m.mats,col,c2);(d.saw?m.saws:m.spins).push(sp)}if(d.mz)m.muzzles[side].push(anchor(g,...d.mz))}
function buildMechB(o){const col=o.glow,ch=o.chassis,lite=!!o.lite,M=paintMats(o.paint||'gunmetal',o.enemy),c2=o.glow2;
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);body.scale.setScalar(o.scale||1);
 const m={root,body,mats:M,legs:[],muzzles:{L:[],R:[]},spins:[],saws:[],pods:[],coils:[],exh:[],thr:[],phase:rnd(0,6),spinV:2,py:4.05,ty:4.7,col,scale:o.scale||1};
 const Gp=(par,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);par.add(g);return g},X=(k,par)=>{MB(k,par,M,col,c2);MB(ch+'__'+k,par,M,col,c2)};
 const pelvis=Gp(body,0,m.py,0);m.pelvis=pelvis;X('pelvis',pelvis);
 for(const s of[-1,1]){const S=s<0?'L':'R',hip=Gp(pelvis,s*1.2,-.1,0);X('hip'+S,hip);const knee=Gp(hip,0,-1.72,0);X('knee'+S,knee);const ank=Gp(knee,0,-1.9,0);X('ank'+S,ank);m.legs.push({hip,knee,ank,s})}
 const torso=Gp(body,0,m.ty,0);m.torso=torso;X('torso',torso);const chest=Gp(torso,0,0,0);chest.rotation.x=.12;m.chest=chest;X('chest',chest);const head=Gp(chest,0,1.82,.78);m.head=head;X('head',head);
 if(!lite)for(const s of[-1,1])m.exh.push(anchor(chest,s*.62,2.35,-1.4));
 for(const s of[-1,1]){const S=s<0?'L':'R',sh=Gp(chest,s*2.1,1.4,0);m['sh'+S]=sh;X('sh'+S,sh);
  if(!lite){const pod=Gp(sh,s*.1,1.08,-.1);X('pod'+S,pod);m.pods.push(anchor(pod,0,0,.75));X('bc'+S,Gp(chest,s*.72,2.05,-.65))}
  const arm=Gp(chest,s*2.28,.6,0);arm.rotation.x=-.12;X('arm'+S,arm);const fore=Gp(arm,0,-1.28,.25);X('fore'+S,fore);m['fore'+S]=fore;
  if(ch=='tempest')m.coils.push(anchor(sh,0,2,-.6));if(ch=='phantom')m.thr.push(anchor(chest,s*1.05,-.15,-2.3))}
 for(const side of['L','R']){const w=o[side],k=w&&WEAPONS[w]?WEAPONS[w].model:w;if(k)weaponB(m,m['fore'+side],k,col,side,c2)}
 extrasJS(m,o,col,ch,lite,M);return m}
export function buildMech(o){const tt=TITANS.find(x=>x.id==o.chassis);if(tt&&tt.base)o={...o,chassis:tt.base,scale:(o.scale||1)*(tt.scale||1)};if(MODEL&&MODEL.chest)return buildMechB(o);return buildMechP(o)}
function extrasJS(m,o,col,ch,lite,M){
 if(['vanguard','tempest','venom'].includes(ch)){const c=ch=='venom'?(o.glow2||col):col,h=new THREE.Mesh(geo('hexp',()=>new THREE.CircleGeometry(1.5,6)),addMat(c,.55,HEX));h.position.set(1.05,.3,.7);h.rotation.set(0,Math.PI/2-.45,Math.PI/6);h.scale.set(1,1.3,1);m.foreR.add(h);
  const e=new THREE.LineLoop(geo('hexe',()=>{const p=[];for(let i=0;i<6;i++){const a=i/6*TAU;p.push(new THREE.Vector3(Math.cos(a)*1.5,Math.sin(a)*1.5,0))}return new THREE.BufferGeometry().setFromPoints(p)}),new THREE.LineBasicMaterial({color:new THREE.Color(c).multiplyScalar(4)}));h.add(e);m.hex=h}
 if(!lite&&!o.enemy){const dk={reactor:'rad',inferno:'flame',tempest:'bolt',venom:'bio',phantom:'wing'}[ch]||'num';decal(m.shL,dk,-.75,-.1,.1,-Math.PI/2,.8);decal(m.shR,'num',.75,-.1,.1,Math.PI/2,.8);for(const L of m.legs)decal(L.hip,'x',L.s*.56,-.95,.05,L.s*Math.PI/2,.55)}
 if(o.shield){const h=new THREE.Mesh(geo('bsh',()=>new THREE.CircleGeometry(1,6)),addMat(0xff3020,.6,HEX));h.position.set(.6,.6,2.3);h.rotation.z=Math.PI/6;h.scale.set(2.2,2.6,1);m.foreL.add(h);m.bshield=h}
 if(o.mortar){part(cyl(.75,.85,3.6,14),M.dark,0,2.6,-1.7,m.chest,-.45);part(cyl(.6,.6,.12,14),glow(col,3),0,4.2,-.95,m.chest,-.45);m.mortar=anchor(m.chest,0,4.4,-.9)}}
function buildMechP(o){const col=o.glow,ch=o.chassis,lite=!!o.lite,M=paintMats(o.paint||'gunmetal',o.enemy);
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);body.scale.setScalar(o.scale||1);
 const m={root,body,mats:M,legs:[],muzzles:{L:[],R:[]},spins:[],saws:[],pods:[],coils:[],exh:[],thr:[],phase:rnd(0,6),spinV:2,py:4.05,ty:4.7,col,scale:o.scale||1};
 const pelvis=new THREE.Group();pelvis.position.y=m.py;body.add(pelvis);m.pelvis=pelvis;
 part(facet(2.1,.85,1.45,.22,.9,1),M.dark,0,0,0,pelvis);part(facet(1.1,.95,.42,.12,1,.6),M.armor2,0,-.15,.78,pelvis);
 for(const s of[-1,1]){const hip=new THREE.Group();hip.position.set(s*1.2,-.1,0);pelvis.add(hip);part(cyl(.44,.44,.62,12),M.joint,0,0,0,hip,0,0,Math.PI/2);
  part(facet(1.1,1.75,1.3,.24,1.05,.85),M.armor,0,-.85,0,hip);part(facet(1.15,.95,.38,.12,1,.8),M.armor2,0,-.55,.7,hip);
  if(!lite){part(cyl(.1,.1,1.4,8),M.joint,s*.58,-.85,-.42,hip,.2);if(!o.enemy)decal(hip,'x',s*.56,-.95,.05,s*Math.PI/2,.55)}
  const knee=new THREE.Group();knee.position.y=-1.72;hip.add(knee);part(cyl(.4,.4,.95,12),M.joint,0,0,0,knee,0,0,Math.PI/2);
  part(facet(.95,.95,.75,.2,.65,1,.18),M.armor2,0,.08,.6,knee,-.2);part(facet(1.2,1.8,1.3,.24,1,.8),M.armor,0,-.98,-.1,knee);part(facet(.9,1.25,.38,.12,1,.7),M.armor2,0,-.72,.58,knee);
  if(!lite){part(cyl(.12,.12,1.55,8),M.joint,0,-.95,-.88,knee);part(rbox(.62,.08,.06,.02),glow(col,2.4),0,-.55,.78,knee)}
  const ank=new THREE.Group();ank.position.y=-1.9;knee.add(ank);part(cyl(.32,.32,.85,10),M.joint,0,0,0,ank,0,0,Math.PI/2);
  part(facet(1.35,.48,1.45,.16,.85,1),M.dark,0,-.14,.15,ank);for(const tx of lite?[0]:[-.44,0,.44])part(facet(lite?1.2:.4,.38,1,.1,.8,1,.12),M.armor2,tx,-.17,1.15,ank);
  part(facet(.62,.36,.65,.1,.8,1),M.armor2,0,-.17,-.8,ank);m.legs.push({hip,knee,ank,s})}
 const torso=new THREE.Group();torso.position.y=m.ty;body.add(torso);m.torso=torso;const chest=new THREE.Group();chest.rotation.x=.12;torso.add(chest);m.chest=chest;
 part(facet(1.45,.95,1.25,.16,1,.85),M.dark,0,-.55,0,torso);for(let i=0;i<3;i++)part(facet(1.25-i*.1,.22,.3,.05),M.armor2,0,-.25-i*.26,.72,torso);
 part(facet(3.2,2.05,2.3,.36,1,.7,.1),M.armor,0,.8,0,chest);for(const s of[-1,1])part(facet(1.4,1.15,.52,.16,.9,1),M.armor2,s*.74,1,1.1,chest,.1,s*.18,0);
 part(facet(.95,.72,.42,.12,1,.8),M.armor2,0,.08,1,chest);part(cyl(.34,.34,.16,6),glow(col,3.2),0,.6,1.2,chest,Math.PI/2);
 for(const s of[-1,1])for(let i=0;i<3;i++)part(rbox(.4,.05,.05,.02),glow(col,2.4),s*.8,1.32-i*.15,1.38,chest,0,s*.18,0);
 const head=new THREE.Group();head.position.set(0,1.82,.78);chest.add(head);m.head=head;part(facet(1.08,.72,.98,.18,.72,1,.12),M.armor,0,0,0,head);
 part(facet(ch=='phantom'?1:.88,.18,.22,.05),glow(o.eye||col,3.6),0,.03,.5,head);part(facet(.52,.24,.26,.06,1,.7),M.dark,0,-.26,.46,head);
 part(facet(1.7,.6,1.25,.16,.8,1),M.armor2,0,1.5,.15,chest);part(facet(2.1,1.65,1.05,.22,.85,1),M.dark,0,.95,-1.35,chest);
 if(!lite)for(const s of[-1,1]){part(cyl(.18,.23,.75,10),M.joint,s*.62,1.95,-1.4,chest);m.exh.push(anchor(chest,s*.62,2.35,-1.4))}
 for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*2.1,1.4,0);chest.add(sh);m['sh'+(s<0?'L':'R')]=sh;
  part(facet(1.6,1.4,2.05,.3,.8,1),M.armor2,0,0,0,sh,0,0,-s*.12);part(facet(1.45,.32,1.65,.1,.9,1),M.armor,s*.1,-.62,0,sh);part(rbox(.8,.12,.1,.03),M.trim,s*.2,-.3,1.02,sh);
  if(!lite){if(!o.enemy)decal(sh,'hazard',s*.74,-.15,.1,s*Math.PI/2,.85,0,-s*.1);
   const pod=new THREE.Group();pod.position.set(s*.1,1.08,-.1);sh.add(pod);part(facet(1.2,1,1.2,.15),M.armor,0,0,0,pod);
   for(let i=0;i<6;i++){const x=(i%3-1)*.3,y=i<3?.2:-.2;part(cyl(.13,.13,.16,10),M.joint,x,y,.6,pod,Math.PI/2);part(sph(.1,8),RED,x,y,.67,pod)}m.pods.push(anchor(pod,0,0,.75));
   const bc=new THREE.Group();bc.position.set(s*.72,2.05,-.65);chest.add(bc);part(facet(.58,.58,1.1,.12),M.dark,0,0,0,bc);part(cyl(.11,.11,2.1,8),M.joint,0,.5,.75,bc,Math.PI/2-.55);part(cyl(.16,.16,.3,8),M.armor2,0,.95,1.6,bc,Math.PI/2-.55)}
  const arm=new THREE.Group();arm.position.set(s*2.28,.6,0);arm.rotation.x=-.12;chest.add(arm);part(facet(1,1.35,1.1,.2,1,.85),M.armor,0,-.45,0,arm);part(cyl(.35,.35,1.1,12),M.joint,0,-1.18,0,arm,0,0,Math.PI/2);
  if(!lite)part(cyl(.08,.08,1.15,8),M.joint,s*.38,-.72,.38,arm,.4);
  const fore=new THREE.Group();fore.position.set(0,-1.28,.25);arm.add(fore);part(facet(1,.95,1.35,.18),M.armor2,0,0,0,fore);m['fore'+(s<0?'L':'R')]=fore}
 for(const side of['L','R']){const w=o[side],k=w&&WEAPONS[w]?WEAPONS[w].model:w;if(k&&WMOD[k])WMOD[k](m,m['fore'+side],col,side,o.glow2)}
 if(['vanguard','tempest','venom'].includes(ch)){const c=ch=='venom'?(o.glow2||col):col,h=new THREE.Mesh(geo('hexp',()=>new THREE.CircleGeometry(1.5,6)),addMat(c,.55,HEX));h.position.set(1.05,.3,.7);h.rotation.set(0,Math.PI/2-.45,Math.PI/6);h.scale.set(1,1.3,1);m.foreR.add(h);
  const e=new THREE.LineLoop(geo('hexe',()=>{const p=[];for(let i=0;i<6;i++){const a=i/6*TAU;p.push(new THREE.Vector3(Math.cos(a)*1.5,Math.sin(a)*1.5,0))}return new THREE.BufferGeometry().setFromPoints(p)}),new THREE.LineBasicMaterial({color:new THREE.Color(c).multiplyScalar(4)}));h.add(e);m.hex=h}
 if(ch=='reactor'){const g=new THREE.Group();g.position.set(.9,-.1,.8);m.foreR.add(g);part(facet(.32,3.1,2,.15),M.armor,0,0,0,g);const hp=new THREE.Mesh(geo('hexp2',()=>new THREE.CircleGeometry(.6,6)),glow(col,2.8));hp.position.set(.18,.25,0);hp.rotation.y=Math.PI/2;g.add(hp);
  for(const y of[-1.15,1.15])part(rbox(.06,.38,1.6,.03),M.trim,.17,y,0,g);for(const y of[-.62,1])part(rbox(.05,.08,1.5,.02),glow(col,2.4),.18,y,0,g);if(!lite){decal(m.shL,'rad',-.75,-.1,.1,-Math.PI/2,.8);decal(m.chest,'rad',0,.08,1.23,0,.5)}}
 if(ch=='inferno'){for(const sh of[m.shL,m.shR]){const s=sh==m.shL?-1:1;for(let i=0;i<3;i++)part(cone(.16,1.1),glow(col,2.4),s*(.3+i*.3),.85,-.5+i*.3,sh,-.4,0,-s*.5)}for(const L of m.legs)part(cone(.15,.7),glow(col,2.2),0,.4,.8,L.knee,.9);
  for(let i=0;i<4;i++)part(cone(.14,.9),M.armor2,(i-1.5)*.45,1.9,-1.6,m.chest,-.9);if(!lite)decal(m.shL,'flame',-.75,-.1,.1,-Math.PI/2,.75)}
 if(ch=='tempest'){for(const sh of[m.shL,m.shR]){const c=new THREE.Group();c.position.set(0,.9,-.6);sh.add(c);part(cyl(.12,.12,1.2,8),M.joint,0,.4,0,c);for(let i=0;i<3;i++)part(geo('tor3',()=>new THREE.TorusGeometry(.28,.05,6,16)),glow(col,3),0,.1+i*.3,0,c,Math.PI/2);m.coils.push(anchor(c,0,1.1,0))}
  for(const s of[-1,1])part(cyl(.03,.03,1.2,5),M.joint,s*.35,.8,-.2,m.head,-.3);if(!lite)decal(m.shL,'bolt',-.75,-.1,.1,-Math.PI/2,.75)}
 if(ch=='venom'){const c2=o.glow2||col;for(const s of[-1,1]){part(cyl(.3,.3,1.2,12),glow(col,1.7),s*.6,1.9,-1.55,m.chest);part(cyl(.34,.34,.14,12),M.armor2,s*.6,2.55,-1.55,m.chest);part(cyl(.34,.34,.14,12),M.armor2,s*.6,1.28,-1.55,m.chest)}
  part(geo('tube',()=>new THREE.TorusGeometry(.7,.07,6,16,Math.PI)),glow(c2,1.6),0,2.6,-1.2,m.chest,0,0,0);part(facet(.88,.18,.22,.05),glow(c2,3.4),0,.03,.51,m.head);if(!lite)decal(m.shL,'bio',-.75,-.1,.1,-Math.PI/2,.8)}
 if(ch=='phantom'){for(const s of[-1,1]){const t=new THREE.Group();t.position.set(s*1.05,.9,-1.75);m.chest.add(t);part(facet(.75,1.7,.85,.16,.7,1),M.armor2,0,0,0,t,.45);part(cyl(.3,.24,.35,10),M.joint,0,-.95,-.4,t,.45);part(cyl(.22,.22,.06,10),glow(col,3),0,-1.12,-.48,t,.45);m.thr.push(anchor(t,0,-1.2,-.5));
   part(facet(.1,1.5,1.3,.04,.6,1),M.armor,s*1.5,1.2,-1.2,m.chest,0,0,s*.3)}part(facet(1.25,.32,1.15,.1,.8,1,.25),M.armor2,0,.42,-.05,m.head);if(!lite)decal(m.shL,'wing',-.75,-.1,.1,-Math.PI/2,.8)}
 if(!lite&&!o.enemy&&!['reactor','inferno','tempest','venom','phantom'].includes(ch))decal(m.shL,'num',-.75,-.1,.1,-Math.PI/2,.8);
 if(!lite&&!o.enemy)decal(m.shR,'num',.75,-.1,.1,Math.PI/2,.8);
 if(o.shield){const h=new THREE.Mesh(geo('bsh',()=>new THREE.CircleGeometry(1,6)),addMat(0xff3020,.6,HEX));h.position.set(.6,.6,2.3);h.rotation.z=Math.PI/6;h.scale.set(2.2,2.6,1);m.foreL.add(h);m.bshield=h}
 if(o.mortar){part(cyl(.75,.85,3.6,14),M.dark,0,2.6,-1.7,m.chest,-.45);part(cyl(.6,.6,.12,14),glow(col,3),0,4.2,-.95,m.chest,-.45);m.mortar=anchor(m.chest,0,4.4,-.9)}
 return m}

export function buildDrone(){const root=new THREE.Group(),body=new THREE.Group();root.add(body);const M=paintMats('enemy',true);
 part(facet(1.5,.6,1.5,.22,.8,1),M.armor,0,0,0,body);part(facet(.85,.38,.85,.12,.7,1),M.dark,0,.45,0,body);part(sph(.2,10),glow(0xff2a18,4),0,0,.78,body);const rot=[];
 for(let i=0;i<4;i++){const a=i*TAU/4+TAU/8,x=Math.cos(a)*1.2,z=Math.sin(a)*1.2;part(rbox(1.05,.12,.2,.05),M.dark,x*.5,.05,z*.5,body,0,-a,0);rot.push(part(geo('rot',()=>new THREE.TorusGeometry(.48,.035,6,20)),glow(0xff5a2a,2),x,.18,z,body,Math.PI/2))}
 return{root,body,mats:M,rot,drone:true,legs:[],muzzles:{L:[],R:[]},spins:[],saws:[],pods:[],coils:[],exh:[],thr:[]}}
export function buildGunship(){const root=new THREE.Group(),body=new THREE.Group();root.add(body);const M=paintMats('enemy',true);
 part(facet(2.3,1.1,5,.35,.7,1,.2),M.armor,0,0,0,body);part(facet(1.3,.6,1.6,.15,.7,1),glow(0xff3020,1.4),0,.45,1.3,body);part(facet(.8,.6,2.4,.15,.6,1),M.dark,0,.2,-2.8,body);
 const rot=[];for(const s of[-1,1]){part(facet(3.2,.2,1.4,.06,1,1),M.armor2,s*2,0,0,body);part(cyl(.55,.55,1.4,12),M.dark,s*3.5,0,0,body,Math.PI/2);const r=part(geo('rot2',()=>new THREE.TorusGeometry(.95,.05,6,24)),glow(0xff4020,2.4),s*3.5,.2,0,body,Math.PI/2);rot.push(r);part(sph(.15,8),RED,s*4.4,0,0,body)}
 const mz=[anchor(body,-.6,-.6,2.6),anchor(body,.6,-.6,2.6)];for(const a of mz)part(cyl(.1,.1,.9,6),M.joint,a.position.x,a.position.y,2.2,body,Math.PI/2);
 return{root,body,mats:M,rot,gunship:true,legs:[],muzzles:{L:mz,R:[]},spins:[],saws:[],pods:[],coils:[],exh:[],thr:[]}}
export function buildSpider(col){const root=new THREE.Group(),body=new THREE.Group();root.add(body);body.position.y=3.6;const M=paintMats('enemy',true);
 part(facet(5.6,1.9,6.2,.55,.75,1),M.armor,0,0,0,body);part(facet(3.6,1,3.6,.3,.7,1),M.armor2,0,1.25,-.5,body);for(let i=0;i<6;i++)part(sph(.18,8),glow(col,4),(i%3-1)*.5,.2+(i<3?.25:-.1),3.05,body);
 const tur=new THREE.Group();tur.position.set(0,1.75,.6);body.add(tur);part(facet(2.5,1.15,2.5,.3,.8,1),M.armor,0,0,0,tur);const mz=[];for(const s of[-1,1]){part(cyl(.2,.22,3.2,10),M.joint,s*.65,0,2.1,tur,Math.PI/2);mz.push(anchor(tur,s*.65,0,3.8))}
 part(rbox(1.7,.2,.1,.03),glow(col,3.4),0,.2,1.26,tur);const legs=[];
 for(let i=0;i<6;i++){const s=i<3?-1:1,k=i%3,base=s*(Math.PI/2)+(k-1)*.75*-s;const g=new THREE.Group();g.position.set(s*2.4,-.2,(k-1)*2.2);body.add(g);g.rotation.y=(s<0?Math.PI:0)+(k-1)*.55*s;
  const up=new THREE.Group();g.add(up);part(facet(3.6,.65,.75,.18),M.armor2,1.8,0,0,up);const kn=new THREE.Group();kn.position.x=3.6;up.add(kn);part(cyl(.32,.32,.85,10),M.joint,0,0,0,kn,Math.PI/2);part(facet(.6,5.4,.6,.16,1,.5),M.armor,0,-2.6,0,kn);
  up.rotation.z=.45;kn.rotation.z=-.45-.45;legs.push({g,up,kn,ph:i%2?0:Math.PI})}
 return{root,body,tur,mats:M,legs,spider:true,muzzles:{L:mz,R:[]},spins:[],saws:[],pods:[anchor(body,-1.5,1.5,-1),anchor(body,1.5,1.5,-1)],coils:[],exh:[],thr:[],phase:0}}

export function animMech(m,sp,dt){if(m.spider)return animSpider(m,sp,dt);if(m.drone||m.gunship){for(const r of m.rot)r.rotation.z+=dt*30;return}
 const prev=Math.sin(m.phase);m.phase+=sp*dt*.55/(m.scale||1);const s=Math.sin(m.phase),c=Math.cos(m.phase),k=Math.min(1,sp/5),t=1-Math.exp(-dt*12);if(sp>1&&m.onStep&&(prev<0)!==(s<0))m.onStep();
 for(const L of m.legs){const q=L.s<0?1:-1;L.hip.rotation.x=lerp(L.hip.rotation.x,-s*q*.5*k,t);L.knee.rotation.x=lerp(L.knee.rotation.x,(.1+Math.max(0,c*q)*.75)*k+.06,t);L.ank.rotation.x=-(L.hip.rotation.x+L.knee.rotation.x)}
 const now=performance.now();m.pelvis.position.y=m.py-.1*k+Math.abs(c)*.13*k;m.torso.position.y=m.ty-.1*k+Math.abs(c)*.13*k+Math.sin(now*.002)*.04;m.torso.rotation.z=s*.03*k;
 for(const g of m.spins)g.rotation.z+=m.spinV*dt;for(const g of m.saws)g.rotation.x+=dt*14;if(m.hex)m.hex.material.opacity=.45+Math.sin(now*.004)*.12;
 if(m.coils.length&&Math.random()<dt*2.5){const a=m.coils[Math.random()*m.coils.length|0].getWorldPosition(new THREE.Vector3());bolt(a,{x:a.x+rnd(-1.5,1.5),y:a.y+rnd(-1,1),z:a.z+rnd(-1.5,1.5)},m.col,.4,.08)}
 if(m.exh.length&&Math.random()<dt*4){const a=m.exh[Math.random()*2|0].getWorldPosition(new THREE.Vector3());SMOKE.emit(a.x,a.y,a.z,rnd(-.3,.3),rnd(1.5,2.5),rnd(-.3,.3),1.4,1.1,.5,.52,.55,.3,-.3,1.4)}}
export function animSpider(m,sp,dt){m.phase+=dt*(1+sp*.9);for(const L of m.legs){const p=Math.sin(m.phase*2+L.ph),lift=Math.max(0,p);L.up.rotation.z=.45+lift*.35*Math.min(1,sp/2);L.g.rotation.y+=0;L.up.rotation.y=Math.cos(m.phase*2+L.ph)*.25*Math.min(1,sp/2)}m.body.position.y=3.6+Math.sin(m.phase*4)*.08}
export function disposeMech(m){if(!m)return;if(m.root.parent)m.root.parent.remove(m.root);if(m.mats.own){m.mats.armor.dispose();m.mats.armorV&&m.mats.armorV.dispose()}}

/* ---------- card portrait renderer ---------- */
let SR=null,SENV=null;
export function snapshot(o,w=420,h=236){try{if(!SR){SR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});SR.setSize(w,h);SR.toneMapping=THREE.ACESFilmicToneMapping;SENV=new THREE.PMREMGenerator(SR).fromScene(new RoomEnvironment(),.04).texture}
 const sc=new THREE.Scene();sc.environment=SENV;sc.add(new THREE.HemisphereLight(0x8090b0,0x101010,1.4));const dl=new THREE.DirectionalLight(0xffffff,2.5);dl.position.set(6,10,8);sc.add(dl);const bl=new THREE.DirectionalLight(o.glow,3);bl.position.set(-6,4,-6);sc.add(bl);
 const m=buildMech(o);m.root.rotation.y=-.55;sc.add(m.root);const cam=new THREE.PerspectiveCamera(30,w/h,.1,100);cam.position.set(0,5.4,19);cam.lookAt(0,4.4,0);SR.setClearColor(0x0b0e14,1);SR.render(sc,cam);return SR.domElement.toDataURL('image/jpeg',.85)}catch(e){return''}}
