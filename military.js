import {THREE,TAU,rnd,glow,geo,rbox,cyl,sph,cone,facet,part,anchor} from './core.js';
import {paintMats} from './mechs.js';
// Military forces: low-poly but detailed procedural models. Every builder returns a mech-like record
// (root, body, mats, muzzles, pods) so the shared enemy code can drive it.
const SKIN=new THREE.MeshStandardMaterial({color:0x8a6a52,roughness:.8,metalness:0});
const VISOR=new THREE.MeshStandardMaterial({color:0x111318,roughness:.15,metalness:.9});
const TIRE=new THREE.MeshStandardMaterial({color:0x121212,roughness:.9,metalness:0});
const rec=(root,body,M,extra={})=>Object.assign({root,body,mats:M,legs:[],muzzles:{L:[],R:[]},spins:[],saws:[],pods:[],coils:[],exh:[],thr:[],rot:[],mil:true,phase:rnd(0,6),scale:1},extra);
export function milMats(desert){return paintMats(desert?'desert':'olive',true)}
export function buildSoldier(kind,desert){const M=milMats(desert),root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const legs=[];for(const s of[-1,1]){const hip=new THREE.Group();hip.position.set(s*.16,.95,0);body.add(hip);part(rbox(.2,.9,.24,.06),M.dark,0,-.45,0,hip);part(rbox(.24,.14,.34,.04),TIRE,0,-.9,.05,hip);legs.push(hip)}
 part(rbox(.55,.65,.32,.1),M.armor,0,1.3,0,body);part(rbox(.5,.3,.36,.06),M.armor2,0,1.38,.02,body);part(rbox(.4,.2,.25,.05),M.dark,0,.98,0,body);
 const head=new THREE.Group();head.position.y=1.82;body.add(head);part(sph(.16,10),SKIN,0,0,0,head);part(sph(.2,10),M.armor,0,.08,-.02,head);part(rbox(.26,.08,.08,.02),VISOR,0,.02,.15,head);
 for(const s of[-1,1])part(rbox(.14,.55,.14,.04),M.armor,s*.36,1.25,.1,body,-.6);
 const gun=new THREE.Group();gun.position.set(.1,1.25,.35);body.add(gun);let mz;
 if(kind=='rocket'){part(cyl(.13,.13,1.3,10),M.armor2,.15,.25,0,gun,Math.PI/2);part(cyl(.15,.15,.1,10),glow(0xff4020,2),.15,.25,.66,gun,Math.PI/2);mz=anchor(gun,.15,.25,.75)}
 else if(kind=='sniper'){part(rbox(.08,.1,1.5,.02),M.dark,0,0,.4,gun);part(cyl(.05,.05,.35,8),VISOR,0,.1,.2,gun,Math.PI/2);mz=anchor(gun,0,0,1.2)}
 else{part(rbox(.08,.14,.8,.02),M.dark,0,0,.2,gun);part(rbox(.06,.18,.08,.02),M.dark,0,-.1,.05,gun);mz=anchor(gun,0,0,.62)}
 let shield=null;if(kind=='riot'){shield=new THREE.Group();shield.position.set(-.1,1.1,.5);body.add(shield);part(rbox(1.1,1.7,.08,.03),new THREE.MeshStandardMaterial({color:0x223040,roughness:.1,metalness:.6,transparent:true,opacity:.75}),0,0,0,shield);part(rbox(1.12,.08,.1,.02),glow(0xff3020,2.4),0,.6,.02,shield);body.scale.setScalar(1.25)}
 return rec(root,body,M,{inf:true,legsI:legs,muzzles:{L:[mz],R:[]},head,bshield:shield})}
export function buildJeep(desert){const M=milMats(desert),root=new THREE.Group(),body=new THREE.Group();root.add(body);
 part(facet(2.3,.8,4.4,.2,.9,1),M.armor,0,.95,0,body);part(facet(2.1,.45,1.6,.12,.8,1,-.1),M.armor2,0,1.55,.9,body);for(const x of[-1.05,1.05])for(const z of[-1.4,1.45])part(cyl(.48,.48,.38,14),TIRE,x,.5,z,body,0,0,Math.PI/2);
 for(const s of[-1,1])part(rbox(.08,1.1,.08,.02),M.dark,s*.95,1.85,.2,body);part(rbox(2,.08,1.2,.02),M.dark,0,2.4,-.1,body);
 const tur=new THREE.Group();tur.position.set(0,2.2,-.9);body.add(tur);part(cyl(.3,.35,.4,10),M.dark,0,0,0,tur);part(rbox(.2,.25,1.4,.03),M.joint,0,.1,.6,tur);part(rbox(.6,.5,.06,.02),M.armor2,0,.15,.2,tur);
 part(rbox(.5,.12,.06,.02),glow(0xfff0c0,2.5),-.7,1,2.21,body);part(rbox(.5,.12,.06,.02),glow(0xfff0c0,2.5),.7,1,2.21,body);
 return rec(root,body,M,{veh:true,tur,muzzles:{L:[anchor(tur,0,.1,1.35)],R:[]}})}
export function buildAPC(desert){const M=milMats(desert),root=new THREE.Group(),body=new THREE.Group();root.add(body);
 part(facet(3.4,1.7,7,.35,.85,1,.3),M.armor,0,1.65,0,body);part(facet(3.2,.4,2,.1,1,1),M.armor2,0,2.55,-1.6,body);for(const x of[-1.55,1.55])for(const z of[-2.6,-.9,.9,2.6])part(cyl(.62,.62,.5,14),TIRE,x,.62,z,body,0,0,Math.PI/2);
 for(let i=0;i<5;i++)part(rbox(3.45,.06,.08,.02),M.dark,0,1.2+i*.22,3.42,body);part(rbox(1.2,1,.08,.02),M.dark,0,1.6,-3.52,body);
 const tur=new THREE.Group();tur.position.set(0,2.75,.9);body.add(tur);part(facet(1.4,.6,1.6,.15),M.armor2,0,0,0,tur);part(cyl(.1,.1,1.8,8),M.joint,0,.05,1.4,tur,Math.PI/2);
 for(const x of[-1,1])part(rbox(.4,.12,.06,.02),glow(0xfff0c0,2.5),x,1.6,3.52,body);
 return rec(root,body,M,{veh:true,tur,muzzles:{L:[anchor(tur,0,.05,2.3)],R:[]}})}
export function buildTank(desert,scale=1,boss=false){const M=milMats(desert),root=new THREE.Group(),body=new THREE.Group();root.add(body);body.scale.setScalar(scale);
 part(facet(4.2,1.3,7.4,.35,.85,1,.25),M.armor,0,1.25,0,body);for(const s of[-1,1]){part(facet(1.1,1.2,7.8,.3,1,.85),M.dark,s*2.2,.75,0,body);for(let i=0;i<6;i++)part(cyl(.45,.45,.4,12),M.joint,s*2.2,.55,-3+i*1.2,body,0,0,Math.PI/2);part(facet(1.2,.18,7.6,.06),M.armor2,s*2.2,1.45,0,body)}
 const tur=new THREE.Group();tur.position.set(0,2.2,-.3);body.add(tur);part(facet(3,1.1,3.6,.3,.8,1,-.2),M.armor2,0,0,0,tur);part(rbox(1,.4,1.2,.08),M.armor,.7,.7,-.6,tur);
 const mz=[];const barrels=boss?[-.55,.55]:[0];for(const x of barrels){part(cyl(.2,.24,4.6,12),M.joint,x,.05,3.6,tur,Math.PI/2);part(cyl(.3,.3,.6,12),M.dark,x,.05,5.8,tur,Math.PI/2);mz.push(anchor(tur,x,.05,6.2))}
 part(cyl(.06,.06,1.2,6),M.joint,-.9,1.1,-1.2,tur);part(rbox(.5,.08,.06,.02),glow(boss?0xff2a18:0xff5020,2.6),-.8,.3,1.82,tur);
 const pods=boss?[anchor(tur,-1.5,.8,-1),anchor(tur,1.5,.8,-1)]:[];if(boss)for(const p of pods)part(facet(.9,.8,1.2,.12),M.armor,p.position.x,p.position.y,p.position.z,tur);
 return rec(root,body,M,{veh:true,tur,muzzles:{L:mz,R:[]},pods,scale})}
export function buildHeli(desert,scale=1,boss=false){const M=milMats(desert),root=new THREE.Group(),body=new THREE.Group();root.add(body);body.scale.setScalar(scale);
 part(facet(2.2,2,6,.6,.75,1,.3),M.armor,0,0,0,body);part(facet(1.4,1.1,1.8,.3,.7,1,.4),new THREE.MeshStandardMaterial({color:0x101820,roughness:.1,metalness:.9}),0,.4,2.6,body);
 part(facet(.7,.7,6,.2,.8,1),M.armor2,0,.3,-5.5,body);part(facet(.15,1.8,1.2,.05),M.armor,0,1,-8.3,body);
 const rot=[];const mr=new THREE.Group();mr.position.y=1.5;body.add(mr);part(cyl(.25,.25,.6,8),M.joint,0,0,0,mr);for(let i=0;i<4;i++)part(rbox(11,.06,.5,.02),M.dark,0,.3,0,mr,0,i*Math.PI/4);rot.push({o:mr,ax:'y',s:26});
 if(boss){const r2=new THREE.Group();r2.position.set(0,1.6,-6);body.add(r2);for(let i=0;i<3;i++)part(rbox(11,.06,.5,.02),M.dark,0,.3,0,r2,0,i*Math.PI/3);rot.push({o:r2,ax:'y',s:-26})}
 else{const tr=new THREE.Group();tr.position.set(.35,1,-8.3);body.add(tr);for(let i=0;i<2;i++)part(rbox(.06,2,.25,.02),M.dark,0,0,0,tr,i*Math.PI/2);rot.push({o:tr,ax:'x',s:40})}
 const pods=[];for(const s of[-1,1]){part(facet(2.4,.12,.8,.04),M.armor2,s*1.6,-.3,.4,body);const p=new THREE.Group();p.position.set(s*2.6,-.55,.4);body.add(p);part(cyl(.32,.32,1.6,10),M.dark,0,0,0,p,Math.PI/2);part(cyl(.26,.26,.05,10),glow(0xff3020,2),0,0,.82,p,Math.PI/2);pods.push(anchor(p,0,0,.9))}
 const gun=anchor(body,0,-.9,3.2);part(cyl(.1,.1,1,6),M.joint,0,-.9,2.8,body,Math.PI/2);part(sph(.18,8),glow(0xff2020,3),0,-1,-8.6,body);
 return rec(root,body,M,{heli:true,rot,pods,muzzles:{L:[gun],R:[]},scale})}
export function buildBattery(desert){const M=milMats(desert),root=new THREE.Group(),body=new THREE.Group();root.add(body);body.scale.setScalar(1.6);
 part(facet(3.2,1.4,9,.3,.9,1),M.armor,0,1.3,0,body);part(facet(3,1.8,2.4,.25,.85,1),M.armor2,0,2.3,3.4,body);for(const x of[-1.5,1.5])for(const z of[-3.2,-1.6,1.8,3.4])part(cyl(.65,.65,.5,14),TIRE,x,.65,z,body,0,0,Math.PI/2);
 const tur=new THREE.Group();tur.position.set(0,2.3,-1.6);body.add(tur);part(facet(2.6,1.2,3,.25),M.armor2,0,0,0,tur);const bar=new THREE.Group();bar.position.set(0,.4,.6);bar.rotation.x=-.75;tur.add(bar);part(cyl(.32,.38,7,14),M.joint,0,0,3.4,bar,Math.PI/2);part(cyl(.45,.45,.8,14),M.dark,0,0,6.8,bar,Math.PI/2);
 for(const s of[-1,1])part(rbox(.3,.3,3,.05),M.dark,s*1.8,.4,-5.5,body);
 const pods=[anchor(tur,-1.2,.8,-1),anchor(tur,1.2,.8,-1)];
 return rec(root,body,M,{veh:true,tur,mortar:anchor(bar,0,0,7.3),muzzles:{L:[anchor(bar,0,0,7.3)],R:[]},pods,scale:1.6})}
export function animMil(m,sp,dt){m.phase+=dt*(1+sp*1.2);if(m.inf){const s=Math.sin(m.phase*1.6)*Math.min(1,sp/3);m.legsI[0].rotation.x=s*.7;m.legsI[1].rotation.x=-s*.7;m.body.position.y=Math.abs(Math.cos(m.phase*1.6))*.06*Math.min(1,sp/3)}
 for(const r of m.rot)r.o.rotation[r.ax]+=dt*r.s;if(m.veh&&sp>.5)m.body.position.y=Math.sin(m.phase*8)*.03}
