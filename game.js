import {THREE,$,TAU,rnd,clamp,lerp,lerpA,angDiff,d2,TOUCH,G,stage,renderer,scene,camera,composer,glow,addMat,geo,cyl,sph,cone,facet,rbox,part,HEX,GLOWT,FX,SMOKE,hexRGB,sparks,smoke,flash,sprite,ring,bolt,beam,beamMesh,placeBeam,explode,updFX,auInit,AU,SFX,setMute,setMusic,dmgNum,updNums,clearNums,Q,setQuality,postTick,bakeEnv} from './core.js';
import {buildSoldier,buildJeep,buildAPC,buildTank,buildHeli,buildBattery,animMil} from './military.js';
import {loadModels,buildMech,buildDrone,buildGunship,buildSpider,animMech,disposeMech,snapshot,paintMats,PAINTS,GLOWS} from './mechs.js';
import {coversNear,addTempCover,ARENA,setArenaSize,W,buildArena,updateWorld,blockHit,pushOut,segBlocked,damageCover,placeSun,skyFollow,flashSky} from './world.js';
import {replaceProf,ARMORY,UTILS,MASS,TITANS,WEAPONS,WLIST,ET,BOSS_ORDER,ARENA_LIST,MISSIONS,LEVELS,PERKS,perks,levelOf,SHOP,prof,saveProf,tp,dailyCfg} from './data.js';

const _v=new THREE.Vector3(),_w=new THREE.Vector3();
const cssHex=h=>'#'+(h>>>0).toString(16).padStart(6,'0');
let state='loading',paused=false,sel=0,P=null,S=null,camMode='tactical',camYaw=Math.PI,camPitch=.2,menuA=0,tab='over',arenaSel='roof',modeSel='levels',killCam=null,stateT=0,locked=false,banT=0,vigT=0;
const walls=[],special={};let whiteT=0;
const enemies=[],shots=[],missiles=[],clouds=[],pickups=[],mines=[],marks=[],objs=[];
const K={},mouse={x:0,y:0,down:false,on:false};let autoFire=false,mStick=null,aStick=null;
const CH={god:false,one:false,unlock:false,inf:false,nocd:false,speed:false,ghost:false,freeze:false,slow:false};
const camT=new THREE.Vector3();
const aegis=new THREE.Mesh(new THREE.SphereGeometry(5.6,40,20),addMat(0x31c4ff,.5,(()=>{const t=HEX.clone();t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(6,3);t.needsUpdate=true;return t})()));aegis.visible=false;scene.add(aegis);

function arena(id,opt){setArenaSize(opt&&opt.size||625);if(opt&&opt.seed)withSeed(opt.seed,()=>buildArena(id,opt));else buildArena(id,opt);const v=P?P.m.root.visible:false;if(P)P.m.root.visible=false;aegis.visible=false;bakeEnv();if(P)P.m.root.visible=v}
const pLight=new THREE.PointLight(0xffffff,0,22,2);scene.add(pLight);
const QN={low:'Low',high:'High',ultra:'Ultra'};function cycleQ(){const o=['low','high','ultra'],l=o[(o.indexOf(Q.level)+1)%3];setQuality(l);renderQ();toast(`Graphics: ${QN[l]}${l=='ultra'?' (needs a strong graphics card)':''}`)}
function renderQ(){$('qBtn').innerHTML=`<i>⚙</i>GRAPHICS: ${QN[Q.level].toUpperCase()}`;if($('qBtn2'))$('qBtn2').textContent=`Cycle graphics: ${QN[Q.level]}`;document.querySelectorAll('[data-q]').forEach(x=>x.classList.toggle('on',x.dataset.q==Q.level))}
/* ================= hangar ================= */
function tcfg(i){const t=TITANS[i],p=tp(t.id),A=ARMORY[t.id],pick=(v,list,d)=>v&&list.includes(v)?v:d;return{L:pick(p.L,A.w,t.L),R:pick(p.R,A.w,t.R),U:pick(p.U,A.u,A.u[0]),X:pick(p.X,A.m,A.m[0]),paint:p.paint||t.paint,glow:p.glow??t.glow}}
function setAcc(h){document.documentElement.style.setProperty('--acc',cssHex(h));aegis.material.color.set(h).multiplyScalar(1.8)}
function previewMech(){if(P)disposeMech(P.m);const t=TITANS[sel],c=tcfg(sel),m=buildMech({chassis:t.id,L:c.L,R:c.R,glow:c.glow,glow2:t.glow2,paint:c.paint});scene.add(m.root);P={t,m,x:0,z:0,y:0,yaw:0,aimYaw:0,glow:c.glow,load:{L:c.L,R:c.R},dead:false};setAcc(c.glow)}
function renderRoster(){$('roster').innerHTML=TITANS.map((t,i)=>{const c=tcfg(i),ow=ownT(t);return`<button class="tcard${i==sel?' sel':''}" data-i="${i}" style="--c:${cssHex(c.glow)};background-image:url(${t.img||t.snap||''})"><i></i><b>${t.name}</b><span>${t.tag}</span>${ow?`<em>Lv ${levelOf(tp(t.id).xp)}</em>`:`<em class="lk">🔒 ${priceTxt(t.price)}</em>`}</button>`}).join('')}
const DK=k=>k=='w'?WEAPONS:k=='u'?UTILS:MASS;
const own=(k,id,t)=>!DK(k)[id].cost||!!prof.unl[t.id+':'+id]||!!(t.par&&t.par.some(q=>prof.unl[q+':'+id]));
const gbtn=(slot,k,id,cur,t)=>{const X=DK(k)[id],ok=own(k,id,t);return`<button class="wb${id==cur?' on':''}${ok?'':' locked'}" data-slot="${slot}" data-id="${id}" data-kind="${k}"><b>${ok?'':'🔒 '}${X.name}</b><span>${X.desc}</span>${k=='w'?`<div class="wbars"><i>DMG ${bars(X.bars[0])}</i><i>RATE ${bars(X.bars[1])}</i><i>RNG ${bars(X.bars[2])}</i></div>`:''}${ok?'':`<strong>Unlock · ${X.cost.toLocaleString()} scrap</strong>`}</button>`};
function renderBank(){$('bank').textContent=`Scrap bank ${(prof.bank||0).toLocaleString()}`;renderRank()}
let toastT;function toast(m){const e=$('toast');e.textContent=m;e.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('show'),2200)}
const bars=n=>`<u>${'<s class="f"></s>'.repeat(n)}${'<s></s>'.repeat(5-n)}</u>`;
const wbtn=(side,w,cur)=>{const X=WEAPONS[w];return`<button class="wb${w==cur?' on':''}" data-side="${side}" data-w="${w}"><b>${X.name}</b><span>${X.desc}</span><div class="wbars"><i>DMG ${bars(X.bars[0])}</i><i>RATE ${bars(X.bars[1])}</i><i>RNG ${bars(X.bars[2])}</i></div></button>`};
function renderTab(){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t==tab));const t=TITANS[sel],c=tcfg(sel),xp=tp(t.id).xp,lv=levelOf(xp),nx=LEVELS[lv],pv=LEVELS[lv-1];let h='';
 if(tab=='over')h=`<h2>${t.name}</h2><div class="tag">${t.tag}</div><div class="lvl"><div class="row"><b>Level ${lv}</b><span>${nx!=null?`${xp-pv} / ${nx-pv} XP`:'Max level'}</span></div><div class="bar"><i style="width:${nx!=null?(xp-pv)/(nx-pv)*100:100}%"></i></div></div><p class="desc">${t.desc}</p>
  ${['Armour','Speed','Damage','Range'].map((s,i)=>`<div class="st"><span>${s}</span><div><i style="width:${t.stats[i]*100}%"></i></div></div>`).join('')}
  <div class="load"><p><b>E</b><span><em>${t.abil}:</em> ${t.abilTxt}</span></p><p><b>ARMS</b><span><em>${WEAPONS[c.L].name}</em> + <em>${WEAPONS[c.R].name}</em></span></p><p><b>G</b><span><em>${UTILS[c.U].name}</em></span></p><p><b>X</b><span><em>${MASS[c.X].name}</em> (charges as you kill)</span></p></div>
  <div class="perks">${PERKS.map((p,i)=>i?`<span class="${lv>i?'got':''}">Lv ${i+1} · ${p}</span>`:'').join('')}</div>`;
 else if(tab=='load')h=`<p class="bankp">Scrap bank: <b>${(prof.bank||0).toLocaleString()}</b>. Scrap you collect in any mode is banked when the run ends. Each titan has its own armory, and unlocks belong to that titan.</p><h3>${t.name} armory · left arm</h3><div class="wgrid">${ARMORY[t.id].w.map(w=>gbtn('L','w',w,c.L,t)).join('')}</div><h3>Right arm</h3><div class="wgrid">${ARMORY[t.id].w.map(w=>gbtn('R','w',w,c.R,t)).join('')}</div><h3>Utility · G key</h3><div class="wgrid">${ARMORY[t.id].u.map(u=>gbtn('U','u',u,c.U,t)).join('')}</div><h3>Mass destruction · X key</h3><div class="wgrid">${ARMORY[t.id].m.map(u=>gbtn('X','m',u,c.X,t)).join('')}</div><button class="btn ghost sm" id="resetLoad">Factory loadout</button>`+modsHTML(t,c);
 else if(tab=='cores'){const co=coreOf(t.id);h=`<p class="bankp">Scrap bank: <b>${(prof.bank||0).toLocaleString()}</b>. Cores are permanent upgrades for ${t.name}. Each goes up to level 5.</p>`+CORES.map(([k,n,dsc])=>{const l=co[k],c=coreCost(l);return`<div class="core panel"><div><b>${n}</b><span>${dsc}</span><div class="pips">${[0,1,2,3,4].map(i=>`<i class="${i<l?'on':''}"></i>`).join('')}</div></div><button class="btn sm" data-core="${k}" ${l>=5?'disabled':''}>${l>=5?'MAX':`UPGRADE · ${c.toLocaleString()}`}</button></div>`}).join('')}
 else h=`<h3>Armour paint</h3><div class="sw">${PAINTS.filter(p=>!p.hidden).map(p=>{const lk=p.lock&&!(prof.skins||{})[p.id];return`<button class="swb${p.id==c.paint?' on':''}" data-paint="${p.id}" ${lk?`disabled title="${p.lock}"`:''} style="background:linear-gradient(135deg,${cssHex(p.a)} 50%,${cssHex(p.b)} 50%);${lk?'opacity:.45':''}"><span>${lk?'🔒 ':''}${p.name}</span></button>`}).join('')}</div><p class="desc">🔒 skins unlock from the season pass (PASS) or the SHOP.</p><div></div>
  <h3>Glow colour</h3><div class="sw">${GLOWS.map(g=>`<button class="swb glow${g==c.glow?' on':''}" data-glow="${g}" style="background:${cssHex(g)};box-shadow:0 0 14px ${cssHex(g)}" aria-label="Glow colour ${cssHex(g)}"></button>`).join('')}</div><button class="btn ghost sm" id="resetPaint">Factory paint</button>`;
 $('tabBody').innerHTML=h}
const MODES={levels:['LEVELS','Wave after wave · shop between levels'],open:['OPEN WORLD','Free roam · outposts · quests · events'],rush:['BOSS RUSH','All 4 bosses back to back · beat the clock'],defense:['DEFENCE','Protect your base core from the army'],trial:['TIME TRIAL','Race 10 checkpoints across the map']};const MK=Object.keys(MODES),kindOf=m=>m=='levels'?'endless':m;
function renderLaunch(){const a=ARENA_LIST.find(x=>x.id==arenaSel),M=MODES[modeSel];$('launch').innerHTML=`<button class="selMap" id="selMode"><small>SELECT MODE ⇄</small><b>${M[0]}</b><small style="font-size:11px">${M[1]}</small></button><button class="selMap" id="selMap"><small>SELECT MAP ⇄</small><b>${a.name}</b></button><button class="startB" id="deploy">START</button>`}
function renderHangar(){renderBank();renderRoster();renderTab();renderLaunch()}
$('menu').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;auInit();const t=TITANS[sel],p=tp(t.id);
 if(b.classList.contains('tcard')&&!ownT(TITANS[+b.dataset.i])){openStore('mechs');return}
 if(b.classList.contains('tcard')){if(+b.dataset.i!==sel){sel=+b.dataset.i;previewMech();renderHangar();SFX.ui()}}
 else if(b.id=='selMode'){modeSel=MK[(MK.indexOf(modeSel)+1)%MK.length];renderLaunch();SFX.ui()}
 else if(b.dataset.core){const co=coreOf(t.id),k=b.dataset.core,c=coreCost(co[k]);if(co[k]>=5)return;if((prof.bank||0)<c){toast(`Need ${(c-(prof.bank||0)).toLocaleString()} more scrap`);SFX.hit();return}prof.bank-=c;co[k]++;saveProf();renderTab();renderBank();SFX.level()}
 else if(b.id=='selMap'){const i=ARENA_LIST.findIndex(x=>x.id==arenaSel);arenaSel=ARENA_LIST[(i+1)%ARENA_LIST.length].id;arena(arenaSel);renderLaunch();SFX.ui()}
 else if(b.id=='rTog'){$('rDr').classList.toggle('open');SFX.ui()}
 else if(b.id=='dClose'){$('detail').classList.remove('open');SFX.ui()}
 else if(b.dataset.t){tab=b.dataset.t;renderTab();$('detail').classList.add('open');$('rDr').classList.remove('open');SFX.ui()}
 else if(b.dataset.slot){const{slot,id,kind}=b.dataset,X=DK(kind)[id];if(!own(kind,id,t)){if((prof.bank||0)>=X.cost){prof.bank-=X.cost;prof.unl[t.id+':'+id]=1;SFX.level();toast(`${X.name} unlocked`)}else{toast(`Need ${(X.cost-(prof.bank||0)).toLocaleString()} more scrap`);SFX.hit();return}}p[slot]=id;saveProf();if(kind=='w')previewMech();renderTab();renderBank();renderRoster();SFX.ui()}
 else if(b.dataset.paint){p.paint=b.dataset.paint;saveProf();previewMech();renderTab();SFX.ui()}
 else if(b.dataset.glow){p.glow=+b.dataset.glow;saveProf();previewMech();renderTab();renderRoster();SFX.ui()}
 else if(b.id=='resetLoad'){delete p.L;delete p.R;delete p.U;delete p.X;saveProf();previewMech();renderTab()}
 else if(b.id=='resetPaint'){delete p.paint;delete p.glow;saveProf();previewMech();renderTab();renderRoster()}
 else if(b.dataset.a){arenaSel=b.dataset.a;arena(arenaSel);renderLaunch();SFX.ui()}
 else if(b.id=='deploy'){if(!ownT(TITANS[sel])){openStore('mechs');return}startRun(kindOf(modeSel),{arena:arenaSel})}
 else if(b.dataset.m){$('rDr').classList.remove('open');const m=b.dataset.m;if(m=='store'){openStore()}else if(m=='ach'){renderAch();show('achOv')}else if(m=='spin'){renderSpin();show('spinOv')}else if(m=='fuse'){renderFuse();show('fuseOv')}else if(m=='trade'){renderTrade();show('tradeOv')}else if(m=='room'){openRoom()}else if(m=='base'){renderBase();show('baseOv')}else if(m=='lb'){lbLoad('score');show('lbOv')}else if(m=='clan'){clanLoad();show('clanOv')}else if(m=='save'){renderSave();show('saveOv')}else if(m=='online'){renderNet();show('netOv')}else if(m=='quests'){renderQuests();show('questsOv')}else if(m=='pass'){renderPass();show('passOv')}else if(m=='campaign'){renderCampaign();show('campaign')}else if(m=='daily'){renderDaily();show('daily')}else if(m=='records'){renderRecords();show('records')}SFX.ui()}});
function renderCampaign(){$('campT').textContent=`Piloting ${TITANS[sel].name} · ${Math.min(prof.camp,MISSIONS.length)} of ${MISSIONS.length} complete`;
 $('campList').innerHTML=MISSIONS.map((m,i)=>{const lock=i>prof.camp&&!CH.unlock,done=i<prof.camp;return(i==0?'<h3 class="misch">Chapter 1 · The seizure</h3>':m.ch==2&&!MISSIONS[i-1].ch?'<h3 class="misch">Chapter 2 · The Omega Engine</h3>':'')+`<button class="mis panel${lock?' lock':''}${done?' done':''}" data-mi="${i}" ${lock?'disabled':''}><b>${i+1}. ${m.n}</b><span>${m.brief}</span><em>${ARENA_LIST.find(a=>a.id==m.arena).name} · ${done?'Completed':lock?'Locked':'Ready'}</em></button>`}).join('')}
$('campList').addEventListener('click',e=>{const b=e.target.closest('.mis');if(!b||b.disabled)return;const i=+b.dataset.mi;playTalk(MISSIONS[i],()=>startRun('campaign',{arena:MISSIONS[i].arena,mission:MISSIONS[i],mIdx:i}))});
function renderDaily(){const d=dailyCfg(),t=TITANS[d.titan],b=prof.daily[d.key];
 $('dailyBody').innerHTML=`<p class="dk">${d.key}</p><div class="dgrid"><div class="panel"><span>Titan</span><b>${t.name}</b></div><div class="panel"><span>Arena</span><b>${ARENA_LIST.find(a=>a.id==d.arena).name}</b></div><div class="panel"><span>Modifier</span><b>${d.mod.name}</b><em>${d.mod.desc}</em></div></div><p>${b?`Your best today: <b>${b.score.toLocaleString()}</b> points, wave ${b.wave}.`:'No run yet today.'} Everyone gets the same titan with factory weapons. Endless waves.</p>`}
$('dailyGo').onclick=()=>{const d=dailyCfg();sel=d.titan;startRun('daily',{arena:d.arena,mod:d.mod,dkey:d.key,factory:true})};
function renderRecords(){setTimeout(()=>{const bs=prof.best||{};$('recBody').insertAdjacentHTML('afterbegin',`<div class="dgrid"><div class="panel"><span>Pilot rank</span><b>${RANKS[rankOf(prof.pxp||0)][0]}</b></div><div class="panel"><span>Best boss rush</span><b>${bs.rush?fmtT(bs.rush):'–'}</b></div><div class="panel"><span>Best time trial</span><b>${bs.trial?fmtT(bs.trial):'–'}</b></div></div>`)},0);const d=dailyCfg(),b=prof.daily[d.key];
 $('recBody').innerHTML=`<div class="scroll"><table><thead><tr><th>Titan</th><th>Level</th><th>Best wave</th><th>Best score</th><th>Best combo</th><th>Kills</th></tr></thead><tbody>${TITANS.map(t=>{const r=prof.rec[t.id]||{};return`<tr><td>${t.name}</td><td>${levelOf(tp(t.id).xp)}</td><td>${r.wave||'–'}</td><td>${r.score?r.score.toLocaleString():'–'}</td><td>${r.combo||'–'}</td><td>${r.kills||0}</td></tr>`}).join('')}</tbody></table></div>
 <div class="dgrid"><div class="panel"><span>Campaign</span><b>${Math.min(prof.camp,10)} / 10</b></div><div class="panel"><span>Total kills</span><b>${prof.kills.toLocaleString()}</b></div><div class="panel"><span>Today's daily</span><b>${b?b.score.toLocaleString():'–'}</b></div></div><p class="note">Records are saved in this browser.</p>`}
renderQP();for(const b of document.querySelectorAll('[data-back]'))b.onclick=()=>{show('menu');renderHangar()};
function show(id){for(const o of['menu','campaign','daily','records','shop','pauseOv','over','questsOv','passOv','netOv','saveOv','storeOv','achOv','spinOv','fuseOv','tradeOv','baseOv','lbOv','clanOv'])$(o).classList.toggle('hide',o!==id);const play=!id||id=='pauseOv'||id=='shop';$('hud').classList.toggle('hide',!play);
 $('reticle').classList.toggle('hide',!!id||TOUCH);document.body.classList.toggle('pilot',camMode=='pilot'&&!id)}

/* ================= runs ================= */
function clearField(){for(const e of enemies){disposeMech(e.m);dropBar(e);if(e.laser)scene.remove(e.laser);if(e.sweep)scene.remove(e.sweep.b)}enemies.length=0;for(const a of[shots,missiles])for(const s of a)scene.remove(s.mesh);shots.length=missiles.length=0;
 for(const a of[clouds,pickups,mines,marks])for(const c of a){scene.remove(c.mesh);}clouds.length=pickups.length=mines.length=marks.length=0;for(const o of objs){scene.remove(o.g);dropBar(o)}objs.length=0;walls.length=0;for(const k in special){const x=special[k];if(x)for(const m of[x.b,x.b2,x.s,x.mesh])if(m)scene.remove(m);special[k]=null}$('bossP').classList.add('hide');if(S&&S.pois){for(const d of S.pois.drops)scene.remove(d.g);for(const L of S.pois.lairs)scene.remove(L.g);for(const c of S.pois.cap)scene.remove(c.g);S.pois=null}if(S&&S.ev){if(S.ev.g)scene.remove(S.ev.g);S.ev=null}clearExtras();if(S&&S.obj&&S.obj.cps)for(const c of S.obj.cps)scene.remove(c.g);if(photo)togglePhoto();clearRemotes();if(mapOpen)toggleMap(false);clearNums();killCam=null;G.timeScale=1;aegis.visible=false}
function startRun(kind,opt){auInit();clearField();const t=TITANS[sel],c=opt.factory?{L:t.L,R:t.R,U:ARMORY[t.id].u[0],X:ARMORY[t.id].m[0],paint:t.paint,glow:t.glow}:tcfg(sel);if(P)disposeMech(P.m);
 const m=buildMech({chassis:t.id,L:c.L,R:c.R,glow:c.glow,glow2:t.glow2,paint:c.paint});scene.add(m.root);m.onStep=()=>SFX.step(.07);
 const sz=['endless','rush','defense','coop','pvp'].includes(kind)?100:625;W.destruct=kind=='open';if(W.id!==opt.arena||ARENA!==sz||(kind!='endless'&&kind!='open'))arena(opt.arena,{storm:(opt.mod&&opt.mod.storm)||(opt.mission&&opt.mission.storm),size:sz,seed:opt.seed});
 const xp0=tp(t.id).xp,lv=levelOf(xp0),pk=perks(lv),mod=opt.mod||null;
 S={kind,arena:opt.arena,mission:opt.mission||null,mIdx:opt.mIdx,mod,dkey:opt.dkey,wave:0,scrap:0,kills:0,score:0,combo:0,comboT:0,maxCombo:0,xp:0,xp0,up:{armor:0,dmg:0,rate:0,msl:0,boost:0,abil:0},spawnQ:[],spawnT:1,time:0,obj:null,cont:false,contT:2,cap:9,lvl:opt.mission?opt.mission.lvl:1,boss:null,ended:false,md:0,earned:0};
 const max=t.hp*(1+pk.armor)*(mod?.armor||1);
 P={t,m,x:0,z:10,y:0,vx:0,vz:0,yaw:Math.PI,aimYaw:Math.PI,ax:0,az:-10,hp:max,max,cdL:0,cdR:0,miL:0,miR:0,bch:pk.boost,bcd:0,bT:0,bx:0,bz:0,mcd:0,acd:0,abT:0,rushT:0,rx:0,rz:0,rushHit:new Set(),inv:0,ocd:0,ocT:0,en:100,enT:0,jam:0,spd:0,turboT:false,sky:null,dead:false,lv,pk,load:{L:c.L,R:c.R,U:c.U,X:c.X},glow:c.glow,lock:null,fireT:0,ucd:0,healT:0};$('abUtilN').textContent=UTILS[c.U].name.split(' ').pop().toUpperCase();
 setAcc(c.glow);camYaw=Math.PI;camPitch=.2;$('hName').textContent=t.name.toUpperCase();$('abName').textContent=t.abil.split(' ')[0].toUpperCase();$('abOver').classList.remove('hide');$('abMsl').classList.toggle('hide',!!mod?.nomsl);
 camT.set(P.x,0,P.z);state='play';paused=false;show(null);AU.level=1;
 setTimeout(()=>say('Systems online. Ready for battle.'),900);setTimeout(()=>banner('THE ARMY WANTS YOUR TITAN','They will try to seize it. Shift turbo · R overdrive (80 m/s)','#ffb020'),400);
 if(levelOf(tp(t.id).xp)>=LEVELS.length){P.evo=true;P.max*=1.2;P.m.root.scale.multiplyScalar(1.06);setTimeout(()=>banner('EVOLVED TITAN',t.name+' Mk II · +20% armour · +10% damage','#ffd23a'),5200)}
 {const co=coreOf(t.id);P.max*=1+.08*co.armor;P.hp=P.max;P.spdMul=1+.05*co.speed;P.enMax=100+20*co.energy+(hasGP('gp_energy')?50:0);P.en=P.enMax;P.coreD=1+.05*co.dmg}P.m.root.visible=!cock;
 setTimeout(renderQP,50);if(kind=='campaign')setupMission(opt.mission);
 else if(kind=='rush'){S.wave=5;S.obj={type:'rush',i:0,t:0,title:'Boss rush'};setTimeout(()=>banner('BOSS RUSH','Beat all 4 bosses as fast as you can','#ff2a18'),3000)}
 else if(kind=='defense'){objs.push(mkObj('core',0,-8));S.obj={type:'defense',title:'Defence'};setTimeout(()=>banner('DEFEND THE CORE','The army wants your base. Hold it.','#31c4ff'),3000);nextWave()}
 else if(kind=='trial')setupTrial();
 else if(kind=='coop'||kind=='pvp'){netBegin(kind)}
 else if(kind=='open'){setTimeout(()=>{if(S&&S.kind=='open')setupExtras()},50);S.heat=0;S.stars=0;S.huntT=20;S.calm=0;S.evT=rnd(70,110);S.capT=30;S.cont=false;setupPOIs();setTimeout(()=>banner('OPEN WORLD','No patrols · roam free · M map · ■ outposts · ● supplies · ◯ boss lairs','#ffd23a'),3200)}else{nextWave();if(mod)setTimeout(()=>banner('DAILY · '+mod.name.toUpperCase(),mod.desc),2600)}}
function waveQueue(w){const q=[],boss=w%5==0,mod=S.mod||{};let n=Math.round((boss?3+w:5+w*2)*(mod.count||1));if(boss)q.push(BOSS_ORDER[((w/5)-1)%4]);
 for(let i=0;i<n;i++){const t=mod.heavy?['tank','apc','riot','tank'][Math.random()*4|0]:pickType(w);q.push(t);if(t=='soldier')q.push('soldier','soldier')}return q}
function pickType(l){const r=Math.random();if(l<2)return r<.6?'soldier':r<.85?'drone':'rocket';if(r<.25)return'soldier';if(r<.38)return'drone';if(r<.5)return'rocket';if(r<.6)return'jeep';if(l>=3&&r<.68)return'sniper';if(l>=4&&r<.76)return'riot';if(l>=3&&r<.84)return'apc';if(l>=5&&r<.92)return'heli';return l>=4?'tank':'jeep'}
function nextWave(){if(S.wave>0&&!S.waveHurt&&S.kind!='open')stat('nodmg');S.waveHurt=false;S.wave++;prof.st=prof.st||{};prof.st.wave=Math.max(prof.st.wave||0,S.wave);S.spawnQ=S.kind=='campaign'?waveQueue(S.lvl+S.wave-1).slice(0,6+S.wave*3):waveQueue(S.wave);S.spawnT=1.2;const boss=S.spawnQ.some(t=>ET[t].boss);
 banner(boss?'TITAN WARNING':(S.kind=='campaign'?'WAVE ':'LEVEL ')+S.wave+(S.obj?.total?` OF ${S.obj.total}`:''),boss?`${ET[S.spawnQ[0]].name} inbound`:`${S.spawnQ.length} hostiles inbound`,boss?'#ff3b2e':null);state='play';show(null)}
function endWave(){const bonus=12+S.wave*4;S.scrap+=bonus;S.earned+=bonus;say('Area secure.');banner('LEVEL '+S.wave+' CLEARED',`+${bonus} scrap bonus`);state='clear';stateT=2.2;SFX.level()}
function openShop(){state='shop';$('shopT').textContent=`Level ${S.wave} cleared`;renderShop();show('shop');if(document.pointerLockElement)document.exitPointerLock()}
function renderShop(){$('shopS').textContent=`Scrap ${S.scrap}  ·  Armour ${Math.ceil(P.hp)} / ${Math.round(P.max)}  ·  Score ${S.score.toLocaleString()}`;
 $('shopG').innerHTML=SHOP.filter(s=>!(s.k=='msl'&&S.mod?.nomsl)).map(s=>{const l=S.up[s.k]||0,c=s.c(S.wave,l),mx=l>=s.max,full=s.k=='repair'&&P.hp>=P.max,dis=mx||full||S.scrap<c;
  return`<button class="item panel" data-k="${s.k}" ${dis?'disabled':''}><b>${s.n}</b><span>${s.d}</span>${s.k!='repair'?`<em>Level ${l} of ${s.max}</em>`:''}<strong>${mx?'Maxed':full?'Armour full':c+' scrap'}</strong></button>`}).join('');$('launchW').textContent=`LAUNCH WAVE ${S.wave+1}`}
$('shopG').addEventListener('click',e=>{const b=e.target.closest('.item');if(!b||b.disabled)return;const s=SHOP.find(x=>x.k==b.dataset.k),l=S.up[s.k]||0,c=s.c(S.wave,l);if(S.scrap<c)return;S.scrap-=c;
 if(s.k=='repair')P.hp=Math.min(P.max,P.hp+P.max*.5);else{S.up[s.k]=l+1;if(s.k=='armor')recalcMax()}SFX.ui();renderShop()});
$('launchW').onclick=nextWave;
function recalcMax(){const nm=P.t.hp*(1+P.pk.armor+.2*S.up.armor)*(S.mod?.armor||1);P.hp+=nm-P.max;P.max=nm}

/* ---------- campaign objectives ---------- */
const PATH=[[-48,46],[-26,26],[-6,20],[2,2],[18,-8],[26,-30],[48,-48]];
function clearCovers(x,z,r){for(const c of coversNear(x,z,r+20))if(Math.abs(c.x-x)<c.w/2+r&&Math.abs(c.z-z)<c.d/2+r){c.boom=null;damageCover(c,1e9)}}
function setupMission(M){S.obj={type:M.type};S.cont=M.type!='waves';S.cap=M.type=='boss'?6:9;banner(M.n.toUpperCase(),M.brief);
 if(M.type=='waves'){S.obj.total=M.waves;setTimeout(()=>{if(S&&state=='play'&&S.wave==0)nextWave()},2500)}
 else if(M.type=='gens'){const spots=[[-32,-8],[32,8],[-10,40],[12,-40],[40,-38]];for(let i=0;i<M.gens;i++){clearCovers(...spots[i],4);objs.push(mkObj('gen',...spots[i]))}}
 else if(M.type=='escort'){for(let i=0;i<3;i++){const o=mkObj('truck',PATH[0][0]-i*3,PATH[0][1]+i*3);o.delay=i*2.6;o.wp=1;objs.push(o)}P.x=-36;P.z=44;for(let i=0;i<PATH.length-1;i++)for(let k=0;k<=1;k+=.1)clearCovers(lerp(PATH[i][0],PATH[i+1][0],k),lerp(PATH[i][1],PATH[i+1][1],k),3.5)}
 else if(M.type=='defend'){clearCovers(0,0,7);objs.push(mkObj('core',0,0));S.obj.left=M.time;P.z=12}
 else if(M.type=='boss'){S.spawnQ=[M.boss];S.spawnT=2.5;S.contT=6}}
function mkObj(kind,x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const M=paintMats('blackops'),o={isObj:true,kind,x,z,g,dead:false,r:2.6,h:7};const lv=1+S.lvl*.12;
 if(kind=='gen'){part(facet(4.2,1.2,4.2,.3,.85,1),M.armor,0,.6,0,g);part(cyl(1.1,1.3,6,12),M.dark,0,4,0,g);part(cyl(.75,.75,5,12),glow(0xff6a20,2.4),0,4.2,0,g);o.rings=[];for(let i=0;i<3;i++){const r=part(geo('gring',()=>new THREE.TorusGeometry(1.6,.1,6,24)),glow(0xff3020,2.6),0,2.5+i*1.8,0,g,Math.PI/2);o.rings.push(r)}
  Object.assign(o,{hostile:true,hp:500*lv,r:2.6,h:7.5,col:0xff5a2a})}
 else if(kind=='truck'){const inner=new THREE.Group();g.add(inner);part(facet(2.8,2.4,2.8,.3,.85,1),M.armor2,0,1.6,2.6,inner);part(rbox(2.4,.5,.1,.05),glow(0xfff0d0,2.5),0,1.2,4.02,inner);part(facet(3,3,6.5,.2,1,1),paintMats('olive').armor,0,2,-2,inner);
  for(const x of[-1.3,1.3])for(const z of[-4,-1.5,2.6])part(cyl(.6,.6,.45,12),M.joint,x,.6,z,inner,0,0,Math.PI/2);part(rbox(1.5,.3,1.5,.05),glow(0x4dff6a,2.4),0,3.6,-2,inner);o.inner=inner;Object.assign(o,{friendly:true,hp:700,r:2.8,h:4,col:0x4dff6a,spd:3.6})}
 else if(kind=='core'){part(facet(7,1.4,7,.4,.8,1),M.armor,0,.7,0,g);part(cyl(1.6,2,3,12),M.dark,0,2.8,0,g);const s=part(sph(1.8,20),glow(0x31c4ff,2.2),0,5,0,g);o.rings=[];for(let i=0;i<2;i++)o.rings.push(part(geo('cring',()=>new THREE.TorusGeometry(2.8,.12,6,32)),glow(0x31c4ff,2.6),0,5,0,g,Math.PI/2+i*.6));Object.assign(o,{friendly:true,hp:2400,r:4.2,h:7,col:0x31c4ff})}
 else if(kind=='decoy'){const h=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,7,6,1,true),addMat(P.glow,.35,HEX));h.position.y=3.5;g.add(h);o.holo=h;o.rings=[0,1].map(i=>part(geo('dring',()=>new THREE.TorusGeometry(2,.08,6,24)),glow(P.glow,2.6),0,1+i*5,0,g,Math.PI/2));Object.assign(o,{friendly:true,hp:500,r:2.2,h:7,col:P.glow,t:7,temp:true})}
 else if(kind=='turret'){part(facet(2.4,.8,2.4,.2,.8,1),M.armor,0,.4,0,g);part(cyl(.3,.3,1.6,8),M.joint,0,1.6,0,g);const hd=new THREE.Group();hd.position.y=2.6;g.add(hd);part(facet(1.4,.9,1.6,.15),paintMats('gunmetal').armor2,0,0,0,hd);for(const s of[-1,1])part(cyl(.1,.1,1.6,6),M.joint,s*.3,0,1.2,hd,Math.PI/2);part(rbox(.6,.1,.06,.02),glow(P.glow,3),0,.2,.81,hd);o.head=hd;Object.assign(o,{friendly:true,hp:400,r:1.8,h:3.6,col:P.glow,t:14,temp:true,fcd:0})}
 else if(kind=='outpost'){const D=paintMats(W.id=='desert'?'desert':'olive',true);part(facet(9,3,9,.4,.85,1),D.armor,0,1.5,0,g);part(facet(5,2.4,5,.3,.8,1),D.armor2,0,4.2,0,g);part(cyl(.15,.15,9,6),D.dark,3.5,7,3.5,g);part(rbox(2,1.2,.05,.02),glow(0xff3020,2.6),3.5,10.5,3.5,g);
  for(const s of[-1,1])part(rbox(8,1.4,.6,.1),D.dark,0,.7,s*5.2,g);const hd=new THREE.Group();hd.position.y=6;g.add(hd);part(facet(1.8,1,2,.15),D.armor2,0,0,0,hd);part(cyl(.14,.14,2.4,8),D.dark,0,0,1.6,hd,Math.PI/2);o.head=hd;
  Object.assign(o,{hostile:true,outpost:true,hp:1500*lv,r:5,h:7,col:0xffb020,fcd:2,dep:6})}
 o.max=o.hp;o.bar=mkBar(o,o.col);return o}
function objDamage(o,d){if(o.dead)return;o.hp-=d;o.acc=(o.acc||0)+d;if(o.hp<=0){o.dead=true;explode(o.x,3,o.z,2.4,o.col);scene.remove(o.g);dropBar(o);if(o.outpost){qProg('outpost');addSP(20);heat(12);S.scrap+=250;S.earned+=250;S.score+=800;S.xp+=80;capture(o);return}if(o.hostile){S.score+=500;S.xp+=60;banner(o.kind=='gen'?'GENERATOR DOWN':'TARGET DOWN',`${objs.filter(x=>x.hostile&&!x.dead).length} left`)}else if(!o.temp)banner(o.kind=='truck'?'TRUCK LOST':'CORE DESTROYED','','#ff3b2e')}}
function updObjs(dt){for(let i=objs.length-1;i>=0;i--)if(objs[i].dead&&objs[i].temp)objs.splice(i,1);for(const o of objs){if(o.dead)continue;
  if(o.temp){o.t-=dt;if(o.holo)o.holo.material.opacity=.3+.15*Math.sin(performance.now()*.01);if(o.t<=0){o.dead=true;scene.remove(o.g);dropBar(o);sparks(o.x,2,o.z,o.col,10,8);continue}
   if(o.kind=='turret'){const tg=nearest(o.x,o.z,32);if(tg){const a=Math.atan2(tg.x-o.x,tg.z-o.z);o.head.rotation.y=lerpA(o.head.rotation.y,a,Math.min(1,dt*10));if((o.fcd-=dt)<=0&&o.zap){o.fcd=.45;arcFire({x:o.x,y:3,z:o.z},a,o.col,dmgMul(),3,22,32,3.2)}else if(o.fcd<=0){o.fcd=.12;shoot({x:o.x+Math.sin(a)*1.6,y:2.6,z:o.z+Math.cos(a)*1.6,a:a+rnd(-.04,.04),sp:70,dmg:7*dmgMul(),life:.6,f:true,col:o.col,kind:'tracer'});SFX.rotary()}}}}if(o.rings)o.rings.forEach((r,i)=>r.rotation.z+=dt*(i%2?1:-1)*1.5);
  if(o.kind=='truck'&&!o.arrived&&state=='play'){if(o.delay>0){o.delay-=dt}else{const w=PATH[o.wp],dx=w[0]-o.x,dz=w[1]-o.z,dd=Math.hypot(dx,dz);if(dd<1){o.wp++;if(o.wp>=PATH.length){o.arrived=true;banner('TRUCK SAFE','')}}else{o.x+=dx/dd*o.spd*dt;o.z+=dz/dd*o.spd*dt;o.g.rotation.y=lerpA(o.g.rotation.y,Math.atan2(dx,dz),dt*3);for(const c of coversNear(o.x,o.z,30))if(Math.abs(c.x-o.x)<c.w/2+2.5&&Math.abs(c.z-o.z)<c.d/2+2.5){c.boom=null;damageCover(c,1e9)}}}o.g.position.set(o.x,0,o.z)}
  if(o.outpost&&!P.dead){const dd=Math.hypot(P.x-o.x,P.z-o.z);if(dd<75){const a=Math.atan2(P.x-o.x,P.z-o.z);o.head.rotation.y=lerpA(o.head.rotation.y,a,Math.min(1,dt*4));if((o.fcd-=dt)<=0){o.fcd=1.6;for(let i=0;i<4;i++)setTimeout(()=>{if(!o.dead&&S)eShoot({x:o.x+Math.sin(a)*2,y:6,z:o.z+Math.cos(a)*2},a+rnd(-.05,.05),46,6,0xffd070,'tracer')},i*90);SFX.rotary()}
   if((o.dep-=dt)<=0&&enemies.length<22){o.dep=rnd(10,15);const rr=Math.random(),grp=rr<.5?['rocket','soldier','soldier']:rr<.7?['jeep','soldier']:rr<.82?['apc']:rr<.92?['tank']:['heli'];for(const ty of grp)spawn(ty,{x:o.x+rnd(-7,7),z:o.z+rnd(7,10)*(Math.random()<.5?1:-1)})}}}
  if(o.acc>0&&(o.accT=(o.accT||0)-dt)<=0){dmgNum(o.x,o.h+1,o.z,o.acc,o.hostile?'#ffffff':'#ff6a5a');o.acc=0;o.accT=.25}updBar(o.bar,o.x,o.h+1.2,o.z,o.hp/o.max)}}
/* ---------- quests: new set every 30 minutes (real time) ---------- */
const QW=30*60*1000,QT=[{k:'outpost',c:[2,4],r:300,n:c=>`Destroy ${c} army outposts`},{k:'drop',c:[2,5],r:200,n:c=>`Collect ${c} supply drops`},{k:'inf',c:[15,30],r:200,n:c=>`Eliminate ${c} infantry`},{k:'veh',c:[3,6],r:250,n:c=>`Destroy ${c} army vehicles`},{k:'heli',c:[1,3],r:300,n:c=>`Shoot down ${c} helicopter${c>1?'s':''}`},{k:'boss',c:[1,1],r:500,n:()=>'Defeat a boss in its lair'},{k:'dist',c:[3,6],r:150,n:c=>`Travel ${c} km`},{k:'recon',c:[1,1],r:200,n:()=>'Recon: reach the marked zone ◆'}];
function seeded(s){return()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296}}
function quests(){const key=Math.floor(Date.now()/QW);if(!prof.quests||prof.quests.key!==key){const rn=seeded(key*7919+13),pool=QT.slice(),q=[];for(let i=0;i<3;i++){const t=pool.splice(Math.floor(rn()*pool.length),1)[0],c=Math.round(t.c[0]+rn()*(t.c[1]-t.c[0]));const o={k:t.k,c,p:0,r:t.r+Math.round(rn()*4)*25,done:false,n:t.n(c)};if(t.k=='recon'){const a=rn()*TAU,d=200+rn()*350;o.x=Math.cos(a)*d;o.z=Math.sin(a)*d}q.push(o)}prof.quests={key,q};saveProf();return{fresh:true,q}}return{fresh:false,q:prof.quests.q}}
function qLeft(){const ms=QW-Date.now()%QW,m=Math.floor(ms/60000),s=Math.floor(ms/1000)%60;return`${m}:${String(s).padStart(2,'0')}`}
function qProg(k,n=1){if(!S||S.kind!='open')return;for(const q of quests().q){if(q.done||q.k!=k)continue;q.p=Math.min(q.c,q.p+n);if(q.p>=q.c){q.done=true;S.scrap+=q.r;S.earned+=q.r;addSP(100);addCoins(10);stat('quests');SFX.level();banner('QUEST COMPLETE',`${q.n} · +${q.r} scrap`,'#5cff78');saveProf()}}
 const w=weekly();if(!w.done&&w.k==k){w.p=Math.min(w.c,w.p+n);if(w.p>=w.c){w.done=true;S.scrap+=w.r;S.earned+=w.r;addSP(500);addCoins(100);SFX.level();banner('WEEKLY QUEST COMPLETE',`+${w.r} scrap`,'#ffd23a');saveProf()}}}
let qT=0;function questTick(dt){if(!P.dead)qProg('dist',(P.spd||0)*dt/1000);for(const q of quests().q)if(q.k=='recon'&&!q.done&&(q.x-P.x)**2+(q.z-P.z)**2<15*15)qProg('recon');if((qT-=dt)<=0){qT=1;const r=quests();if(r.fresh)banner('NEW QUESTS','A fresh set of quests is ready','#5cff78');renderQP()}}
function qLine(q){return`<div class="ql${q.done?' done':''}"><span>${q.done?'✓':'◇'} ${q.n}</span><b>${q.k=='dist'?q.p.toFixed(1):q.p}/${q.c}</b></div>`}
function renderQP(){const el=$('questP');if(!el)return;const on=S&&S.kind=='open';el.classList.toggle('hide',!on);if(on){const w=weekly();el.innerHTML=`<div class="qh"><b>QUESTS</b><span>New in ${qLeft()}</span></div>`+quests().q.map(qLine).join('')+`<div class="qh" style="margin-top:4px"><b style="color:#ffd23a">WEEKLY</b><span>${wLeft()}</span></div>`+qLine(w)}}
function renderQuests(){const r=quests();$('questBody').innerHTML=`<p>Play <b>Open World</b> mode to complete quests. Progress is saved. A new set of quests arrives every 30 minutes. Next set in <b>${qLeft()}</b>.</p>`+(()=>{const w=weekly();return`<div class="qcard panel${w.done?' done':''}" style="border-color:#ffd23a"><b>${w.done?'✓ ':''}WEEKLY · ${w.n}</b><span>${w.k=='dist'?w.p.toFixed(1):w.p} / ${w.c}</span><em>+${w.r} scrap · +500 pass points · resets in ${wLeft()}</em></div>`})()+r.q.map(q=>`<div class="qcard panel${q.done?' done':''}"><b>${q.done?'✓ ':''}${q.n}</b><span>${q.k=='dist'?q.p.toFixed(1):q.p} / ${q.c}</span><em>+${q.r} scrap</em></div>`).join('')}
function poiSpot(min){for(let t=0;t<40;t++){const x=rnd(-ARENA+60,ARENA-60),z=rnd(-ARENA+60,ARENA-60);if(Math.hypot(x,z)>min&&!blockHit(x,z,1,8)&&!W.hazards.some(h=>Math.hypot(h.x-x,h.z-z)<h.r+9)&&!(W.dunes||[]).some(u=>Math.hypot(u.x-x,u.z-z)<u.r+8))return{x,z}}return{x:rnd(-550,550),z:rnd(-550,550)}}
function mkDrop(){const p=poiSpot(60),g=new THREE.Group();g.position.set(p.x,0,p.z);part(facet(2.2,1.6,2.2,.2,.85,1),paintMats('olive').armor,0,.8,0,g);part(rbox(2.3,.25,2.3,.05),glow(0x40e0ff,2.6),0,1.7,0,g);const beam=part(cyl(.25,.25,40,8),addMat(0x40e0ff,.25),0,20,0,g);scene.add(g);return{x:p.x,z:p.z,g,beam,t:0}}
function setupPOIs(){const P0={outposts:[],drops:[],lairs:[],cap:[]};S.pois=P0;for(let i=0;i<12;i++){const p=poiSpot(150),o=mkObj('outpost',p.x,p.z);objs.push(o);P0.outposts.push(o)}
 for(let i=0;i<9;i++)P0.drops.push(mkDrop());const ln=['goliath','hammer','battery','rival'];for(let i=0;i<4;i++){const a=i/4*TAU+.6,p={x:Math.cos(a)*480,z:Math.sin(a)*480},g=new THREE.Group();g.position.set(p.x,0,p.z);part(geo('lairR',()=>new THREE.TorusGeometry(25,.5,6,64)),glow(0xff2a18,2.2),0,.4,0,g,Math.PI/2);scene.add(g);P0.lairs.push({x:p.x,z:p.z,type:ln[i],g,done:false})}}
function updPOIs(dt){const Q=S.pois;questTick(dt);openTick(dt);extraTick(dt);for(const d of Q.drops){d.g.rotation.y+=dt;if(d.t>0){if((d.t-=dt)<=0){const n=mkDrop();scene.remove(d.g);Object.assign(d,n)}continue}
  if(!P.dead&&(d.x-P.x)**2+(d.z-P.z)**2<16){d.t=60;d.g.visible=false;qProg('drop');stat('drops');P.hp=P.max;P.en=P.enMax||100;S.scrap+=100;S.earned+=100;sparks(d.x,2,d.z,0x40e0ff,20,10);SFX.level();banner('SUPPLY DROP','+100 scrap · full repair','#40e0ff')}}
 for(const L of Q.lairs){if(L.done)continue;L.g.rotation.y+=dt*.2;if(!S.boss&&(L.x-P.x)**2+(L.z-P.z)**2<30*30){L.done=true;scene.remove(L.g);const e=spawn(L.type,{x:L.x+rnd(-10,10),z:L.z+rnd(-10,10)});e.lair=true;banner('BOSS LAIR',ET[L.type].name+' defends this sector','#ff2a18')}}}
let mapOpen=false;function toggleMap(v){if(!S||(state!='play'&&state!='clear'))return;mapOpen=v??!mapOpen;$('mapOv').classList.toggle('hide',!mapOpen);paused=mapOpen;if(mapOpen){drawMap();if(document.pointerLockElement)document.exitPointerLock()}}
function canTravel(){return S&&S.kind=='open'&&!S.boss}
function drawMap(){const cv=$('mapC'),c=cv.getContext('2d'),N=cv.width,k=N/(ARENA*2),tx=x=>(x+ARENA)*k,ty=z=>(z+ARENA)*k;c.fillStyle='#0c1118';c.fillRect(0,0,N,N);c.strokeStyle='rgba(255,255,255,.08)';for(let i=0;i<=10;i++){c.beginPath();c.moveTo(i*N/10,0);c.lineTo(i*N/10,N);c.moveTo(0,i*N/10);c.lineTo(N,i*N/10);c.stroke()}
 for(const o of W.covers||[])if(o.solid){c.fillStyle='#3a4352';c.fillRect(tx(o.x)-1,ty(o.z)-1,Math.max(2,o.w*k),Math.max(2,o.d*k))}
 const Q=S.pois;if(Q){for(const o of Q.outposts)if(!o.dead){c.fillStyle='#ffb020';c.fillRect(tx(o.x)-5,ty(o.z)-5,10,10)}for(const d of Q.drops)if(d.t<=0){c.fillStyle='#40e0ff';c.beginPath();c.arc(tx(d.x),ty(d.z),5,0,TAU);c.fill()}for(const L of Q.lairs)if(!L.done){c.strokeStyle='#ff2a18';c.lineWidth=3;c.beginPath();c.arc(tx(L.x),ty(L.z),11,0,TAU);c.stroke();c.fillStyle='#ff6a5a';c.font='bold 14px Oxanium,sans-serif';c.fillText(ET[L.type].name.toUpperCase(),tx(L.x)+14,ty(L.z)+5)}}
 for(const e of enemies)if(!e.dead){c.fillStyle=e.boss?'#ff2a18':'#ff5a4a';c.fillRect(tx(e.x)-2,ty(e.z)-2,4,4)}
 if(S.base&&!S.base.off){c.fillStyle='#31c4ff';c.beginPath();c.arc(tx(S.base.x),ty(S.base.z),9,0,TAU);c.fill();c.font='bold 14px Oxanium,sans-serif';c.fillText('HOME BASE',tx(S.base.x)+12,ty(S.base.z)+5)}
 if(Q)for(const o of Q.cap){c.fillStyle='#5cff78';c.fillRect(tx(o.x)-5,ty(o.z)-5,10,10)}if(S.ev){c.fillStyle='#d58cff';c.beginPath();c.arc(tx(S.ev.x),ty(S.ev.z),8,0,TAU);c.fill();c.font='bold 14px Oxanium,sans-serif';c.fillText('EVENT',tx(S.ev.x)+12,ty(S.ev.z)+5)}if(S.obj?.cps){const cp=S.obj.cps[S.obj.i];if(cp){c.strokeStyle='#40e0ff';c.lineWidth=3;c.beginPath();c.arc(tx(cp.x),ty(cp.z),9,0,TAU);c.stroke()}}
 for(const q of quests().q)if(q.k=='recon'&&!q.done){c.save();c.translate(tx(q.x),ty(q.z));c.rotate(Math.PI/4);c.fillStyle='#5cff78';c.fillRect(-7,-7,14,14);c.restore();c.fillStyle='#5cff78';c.font='bold 14px Oxanium,sans-serif';c.fillText('RECON',tx(q.x)+12,ty(q.z)+5)}
 c.save();c.translate(tx(P.x),ty(P.z));c.rotate(-P.aimYaw+Math.PI);c.fillStyle='#fff';c.beginPath();c.moveTo(0,-11);c.lineTo(7,8);c.lineTo(0,4);c.lineTo(-7,8);c.closePath();c.fill();c.restore();
 $('mapTip').textContent=canTravel()?'Click anywhere to call a drop-ship and fast travel there · M to close':S.kind!='open'?'Fast travel is only in Open World mode · M to close':'Fast travel is off during a boss fight · M to close'}
function fastTravel(x,z){if(!canTravel())return;x=clamp(x,-ARENA+10,ARENA-10);z=clamp(z,-ARENA+10,ARENA-10);for(let t=0;t<20&&blockHit(x,z,1,3);t++){x+=rnd(-20,20);z+=rnd(-20,20)}
 if(S.ev&&S.ev.ty=='convoy'){S.ev=null;S.evT=rnd(90,150)}for(const e of enemies){if(e.boss)continue;S.spawnQ.push(e.type);disposeMech(e.m);dropBar(e);e.dead=true}for(let i=enemies.length-1;i>=0;i--)if(enemies[i].dead)enemies.splice(i,1);
 flash(P.x,4,P.z,P.glow,600,.3);P.x=x;P.z=z;P.vx=P.vz=0;P.m.root.position.set(x,0,z);camT.set(x,0,z);ring(x,z,P.glow,1,10,.5);smoke(x,.5,z,8,1.4,.2);G.shake=.4;SFX.boost();toggleMap(false);banner('DROP-SHIP INSERTION',`${Math.round(x)} m E · ${Math.round(-z)} m N`)}
function missionCheck(dt){if(!S.obj||state!='play')return;const M=S.mission,o=S.obj;
 if(o.type=='gens'&&!objs.some(x=>x.hostile&&!x.dead))win();
 if(o.type=='escort'){const tr=objs.filter(x=>x.kind=='truck'&&!x.dead);if(!tr.length)lose('All trucks were destroyed');else if(tr.every(x=>x.arrived))win()}
 if(o.type=='defend'){o.left-=dt;if(objs.some(x=>x.kind=='core'&&x.dead))lose('The core was destroyed');else if(o.left<=0)win()}
 if(o.type=='boss'&&S.bossDown)win();
 if(o.type=='rush'){o.t+=dt;if(!enemies.length&&!S.spawnQ.length&&!o.wait){if(o.i>=4)win();else{o.wait=1;setTimeout(()=>{if(S&&S.obj===o&&state=='play'){spawn(BOSS_ORDER[o.i++]);o.wait=0}},o.i?2500:1500)}}}
 if(o.type=='defense'){if(objs.some(x=>x.kind=='core'&&x.dead))lose('The base core was destroyed');else if(state=='play'&&S.wave>0&&!S.spawnQ.length&&!enemies.length)endWave()}
 if(o.type=='trial'){o.t+=dt;const c=o.cps[o.i];if(c&&(c.x-P.x)**2+(c.z-P.z)**2<121){scene.remove(c.g);o.i++;ring(c.x,c.z,0x40e0ff,1,12,.5);SFX.level();if(o.i>=o.cps.length)win();else banner('CHECKPOINT '+o.i+' / '+o.cps.length,fmtT(o.t),'#40e0ff')}}
 if(o.type=='waves'&&S.wave>0&&!S.spawnQ.length&&!enemies.length){if(S.wave>=o.total)win();else{state='clear';stateT=3;banner('WAVE CLEARED','Next wave incoming')}}}
function objText(){if(!S.obj)return null;const o=S.obj;const bt=(prof.best||{})[S.kind];
 if(o.type=='rush')return[`Boss rush · ${o.i}/4 · ${fmtT(o.t)}${bt?` · best ${fmtT(bt)}`:''}`,o.i/4];
 if(o.type=='defense'){const c=objs.find(x=>x.kind=='core');return[`Defend the core · level ${S.wave}`,c?c.hp/c.max:0]}
 if(o.type=='trial')return[`Checkpoint ${Math.min(o.i+1,o.cps.length)}/${o.cps.length} · ${fmtT(o.t)}${bt?` · best ${fmtT(bt)}`:''}`,o.i/o.cps.length];if(o.type=='waves')return[`Survive · wave ${S.wave} of ${o.total}`,S.wave/o.total];
 if(o.type=='gens'){const all=objs.filter(x=>x.hostile),left=all.filter(x=>!x.dead).length;return[`Destroy generators · ${left} left`,1-left/all.length]}
 if(o.type=='escort'){const tr=objs.filter(x=>x.kind=='truck'),alive=tr.filter(x=>!x.dead),prog=alive.length?Math.max(...alive.map(x=>x.arrived?1:(x.wp-1)/(PATH.length-1))):0;return[`Escort trucks · ${alive.length} of 3 alive`,prog]}
 if(o.type=='defend'){const c=objs.find(x=>x.kind=='core');return[`Protect the core · ${Math.max(0,Math.ceil(o.left))} s · core ${Math.max(0,Math.round(c.hp/c.max*100))}%`,1-o.left/S.mission.time]}
 if(o.type=='boss')return[S.boss?`Destroy the ${ET[S.boss.type].name}`:'Boss incoming…',S.boss?1-S.boss.hp/S.boss.max:0]}
function win(){if(state!='play'&&state!='clear')return;state='won';stateT=killCam?3.4:2.4;banner(S.mission?'MISSION COMPLETE':(S.obj?.title||'')+' COMPLETE',S.mission?.n||(S.obj?.t!=null?fmtT(S.obj.t):''));SFX.level()}
function lose(msg){if(state!='play'&&state!='clear')return;state='dying';stateT=2.4;S.lost=msg;banner('MISSION FAILED',msg,'#ff3b2e');SFX.alarm()}
function die(){if(state=='dying')return;if(P.av&&P.av.type!='pilot'){avExit(true);return}if(!P.av&&!P.ejected&&S&&!NET.inGame&&state=='play'&&S.kind!='pvp'){ejectPilot();return}if(P.av)avClear();if(NET.inGame&&S&&(S.kind=='coop'||S.kind=='pvp')){if(P.dead)return;P.dead=true;P.respawnT=S.kind=='pvp'?3:6;explode(P.x,3,P.z,2.6,P.glow);P.m.root.visible=false;if(S.kind=='pvp'){NET.deaths++;netSend({t:'dead'});banner('YOU WERE DOWNED',`${NET.kills} – ${NET.deaths} · respawning`,'#ff3b2e')}else banner('TITAN DOWN','Respawning in 6 seconds','#ff3b2e');return}state='dying';stateT=2.6;P.dead=true;explode(P.x,3,P.z,2.6,P.glow);setTimeout(()=>{if(state=='dying'&&P.dead)P.m.root.visible=false},150);if(document.pointerLockElement)document.exitPointerLock()}
function finishRun(won){if(S.ended)return;S.ended=true;setTimeout(()=>onlineAfterRun(won),300);stat('runs');stat('km',Math.round((S.dist||0)/100)/10);state='over';const t=P.t,pr=tp(t.id),lv0=levelOf(pr.xp);let bonus=0;if(won&&S.mission){bonus=150+S.mIdx*60}pr.xp+=Math.round((S.xp+bonus)*(hasGP('gp_vip')?1.25:1));const lv1=levelOf(pr.xp);
 const rec=prof.rec[t.id]||(prof.rec[t.id]={wave:0,score:0,combo:0,kills:0});rec.kills+=S.kills;rec.combo=Math.max(rec.combo,S.maxCombo);let nb=false;if(S.kind!='campaign'){nb=S.score>rec.score;rec.wave=Math.max(rec.wave,S.wave);rec.score=Math.max(rec.score,S.score)}
 if(S.kind=='daily'){const b=prof.daily[S.dkey];if(!b||S.score>b.score)prof.daily[S.dkey]={score:S.score,wave:S.wave}}
 if(won&&S.mission&&S.mIdx>=prof.camp)prof.camp=Math.min(MISSIONS.length,S.mIdx+1);const banked=S.earned*(hasGP('gp_scrap')?2:1)+0*stat('scrap',S.earned)+(won&&S.mission?100+S.mIdx*40:0);prof.bank=(prof.bank||0)+banked;saveProf();
 let title=S.mission?(won?'Mission complete':'Titan seized'):S.kind=='defense'?'Base overrun':S.kind=='pvp'?(won?`Duel won ${NET.kills}–${NET.deaths}`:`Duel lost ${NET.kills}–${NET.deaths}`):S.kind=='coop'?'Squad wiped out':'Titan seized';if(NET.inGame){NET.inGame=false;clearRemotes()}if(won&&!S.mission&&S.obj){title=`${S.obj.title} · ${fmtT(S.obj.t)}`;const bs=prof.best||(prof.best={});if(!bs[S.kind]||S.obj.t<bs[S.kind]){bs[S.kind]=S.obj.t;setTimeout(()=>toast('New best time!'),400)}}
 prof.pxp=(prof.pxp||0)+Math.round((S.xp+bonus)*(hasGP('gp_vip')?1.25:1));$('overH').textContent=title;
 $('overTxt').textContent=S.mission?(won?`${S.mission.n} cleared with ${t.name}.`:(S.lost||`${t.name} was destroyed.`)):`${t.name} fell on wave ${S.wave}.${nb?' New best score!':''}`;
 $('overStats').innerHTML=[['Score',S.score.toLocaleString()],[S.mission?'Kills':'Wave',S.mission?S.kills:S.wave],['Best combo',S.maxCombo],['XP gained',`+${S.xp+bonus}`],['Level',lv1>lv0?`${lv0} → ${lv1}`:lv1],['Scrap banked',`+${banked}`]].map(([a,b])=>`<div class="panel"><span>${a}</span><b>${b}</b></div>`).join('');
 const nx=won&&S.mission&&S.mIdx+1<MISSIONS.length;$('nextM').classList.toggle('hide',!nx);show('over');AU.level=0}
$('again').onclick=()=>{const k=S.kind;if(k=='coop'||k=='pvp'){toHangar();renderNet();show('netOv');return}if(k=='campaign')startRun('campaign',{arena:S.mission.arena,mission:S.mission,mIdx:S.mIdx});else if(k=='daily')$('dailyGo').onclick();else startRun(k,{arena:S.arena})};
$('nextM').onclick=()=>{const i=S.mIdx+1;playTalk(MISSIONS[i],()=>startRun('campaign',{arena:MISSIONS[i].arena,mission:MISSIONS[i],mIdx:i}))};
$('hangar').onclick=toHangar;$('quit').onclick=toHangar;$('resume').onclick=()=>setPause(false);$('pauseBtn').onclick=()=>setPause(!paused);
$('camBtn').onclick=()=>{toggleCam();setPause(false)};
$('resumeX').onclick=()=>setPause(false);$('mapBtn2').onclick=()=>{setPause(false);toggleMap(true)};$('tMap').onclick=()=>toggleMap();$('tCam').onclick=()=>toggleCam();
const sndUI=()=>{$('tSnd').textContent=AU.muted?'🔇':'🔊';$('sndBtn').textContent=AU.muted?'SOUND OFF':'SOUND ON'};$('tSnd').onclick=()=>{setMute(!AU.muted);sndUI()};$('sndBtn').onclick=()=>{setMute(!AU.muted);sndUI()};
document.querySelectorAll('.dtabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.dtabs button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('.tp').forEach(p=>p.classList.toggle('hide',p.dataset.p!=b.dataset.t))});
document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{setQuality(b.dataset.q);renderQ();document.querySelectorAll('[data-q]').forEach(x=>x.classList.toggle('on',x.dataset.q==Q.level))});$('musBtn').onclick=()=>{setMusic(!AU.musicOn);$('musBtn').textContent=AU.musicOn?'MUSIC ON':'MUSIC OFF'};
function toHangar(){if(NET.inGame){netSend({t:'quit'});NET.inGame=false;clearRemotes()}if(S&&!S.ended&&S.kills)finishRun(false);clearField();state='menu';paused=false;S=null;camMode='tactical';cock=false;document.body.classList.remove('cock','pilot');if(document.pointerLockElement)document.exitPointerLock();previewMech();show('menu');renderHangar();AU.level=0}
function setPause(v){if(state!='play'&&state!='clear')return;paused=v;show(v?'pauseOv':null);if(v&&document.pointerLockElement)document.exitPointerLock()}
function banner(t,s,c){if(NET&&NET.inGame&&NET.role=='host'&&S&&S.kind=='coop'&&!banner._r)netSend({t:'ban',b:t,s,c});const b=$('banner');b.querySelector('b').textContent=t;b.querySelector('span').textContent=s||'';b.style.setProperty('--bc',c||'var(--acc)');b.classList.add('show');banT=2.6}
function toggleCam(){if(camMode=='tactical'){camMode='pilot';cock=false;if(P)camYaw=P.aimYaw;banner('PILOT VIEW',TOUCH?'Right stick turns the camera':'Click to lock the mouse · V for cockpit view')}else if(!cock){cock=true;banner('COCKPIT VIEW','V to switch to tactical view')}else{camMode='tactical';cock=false;if(document.pointerLockElement)document.exitPointerLock();banner('TACTICAL VIEW','')}document.body.classList.toggle('pilot',camMode=='pilot');document.body.classList.toggle('cock',cock);if(P&&!P.dead)P.m.root.visible=!cock}

/* ================= combat helpers ================= */
const BAR_BG=new THREE.SpriteMaterial({color:0x000000,opacity:.65,transparent:true,depthWrite:false}),BAR_FG=new THREE.SpriteMaterial({color:new THREE.Color(0xff3020).multiplyScalar(2),depthWrite:false});
function mkBar(o,col){const bg=new THREE.Sprite(BAR_BG),fg=new THREE.Sprite(col?new THREE.SpriteMaterial({color:new THREE.Color(col).multiplyScalar(2),depthWrite:false}):BAR_FG);scene.add(bg,fg);return{bg,fg,w:Math.max(2.2,o.r*1.4)}}
function updBar(b,x,y,z,f){if(!b)return;f=clamp(f,.001,1);b.bg.position.set(x,y,z);b.bg.scale.set(b.w+.15,.36,1);b.fg.position.set(x,y,z);b.fg.scale.set(b.w*f,.24,1);b.fg.center.set(.5/f,.5)}
function dropBar(o){if(o.bar){scene.remove(o.bar.bg,o.bar.fg);o.bar=null}}
const SG={tracer:new THREE.BoxGeometry(.16,.16,2),ember:new THREE.SphereGeometry(.24,8,6),orb:new THREE.SphereGeometry(.6,14,10),bolt:new THREE.SphereGeometry(.34,10,8),needle:new THREE.BoxGeometry(.1,.1,1.4)};
function shoot(o){const mesh=new THREE.Mesh(SG[o.kind],glow(o.col,o.kind=='bolt'?3:4));if(o.kind=='bolt')mesh.scale.z=2.4;mesh.position.set(o.x,o.y,o.z);mesh.rotation.y=o.a;scene.add(mesh);
 const s={mesh,x:o.x,y:o.y,z:o.z,vx:Math.sin(o.a)*o.sp,vy:o.vy||0,vz:Math.cos(o.a)*o.sp,life:o.life,dmg:o.dmg,r:o.r||.3,f:o.f,col:o.col,kind:o.kind,splash:o.splash||0,poison:o.poison||0,burn:o.burn||0,stun:o.stun||0};shots.push(s);return s}
function eShoot(p,a,sp,dmg,col=0xff3020,kind='bolt',vy=0){if(NET.inGame&&NET.role=='host')NET.esBuf.push([r1(p.x),r1(p.y),r1(p.z),r2(a),sp,col,kind,r2(vy)]);return shoot({x:p.x,y:p.y,z:p.z,a,sp,dmg,life:3,f:false,col,kind,vy})}
function emz(e){const L=[...e.m.muzzles.L,...e.m.muzzles.R];if(!L.length)return{x:e.x,y:e.y+3,z:e.z};L[e.mi++%L.length].getWorldPosition(_v);return{x:_v.x,y:_v.y,z:_v.z}}
const live=e=>!e.dead&&e.drop<=0&&!e.gone;
function hostiles(){const a=enemies.filter(live);for(const o of objs)if(o.hostile&&!o.dead&&(o.x-P.x)**2+(o.z-P.z)**2<160*160)a.push(o);return a}
function nearest(x,z,max=1e9,skip){let b=null,bd=max*max;for(const e of hostiles()){if(skip&&skip.has(e))continue;const d=(e.x-x)**2+(e.z-z)**2;if(d<bd){bd=d;b=e}}return b}
function hitT(t,d,src){if(t.isObj)objDamage(t,CH.one?1e6:d);else hitEnemy(t,d,src)}
function hitEnemy(e,d,src){if(e.dead||e.drop>0)return;if(e.pvp||e.net){netSend(e.pvp?{t:'hit',d:d*.6}:{t:'hit',id:e.nid,d});e.flash=.08;e.acc=(e.acc||0)+d;sparks(e.x,eHeight(e),e.z,0xffffff,3,6,.25);return}if(CH.one)d=1e6;{const dd=ET[e.type];if(P&&(dd.veh||e.boss)){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw),tx=P.x-e.x,tz=P.z-e.z,l=Math.hypot(tx,tz)||1;if((fx*tx+fz*tz)/l<-.45){d*=1.6;if(Math.random()<.2)sparks(e.x,eHeight(e)+1,e.z,0xffe040,6,8,.3)}}if((e.type=='heli'||e.type=='hammer')&&Math.random()<.12){d*=2.2;sparks(e.x,e.y+1.5,e.z,0xffe040,10,10,.3)}}e.hp-=d;e.flash=.08;e.acc+=d;if(src){if(src.poison){e.poison=Math.max(e.poison,3);e.pdps=Math.max(e.pdps,src.poison)}if(src.burn)e.burn=2.5;if(src.stun)e.stun=Math.max(e.stun,src.stun)}if(!e.bar&&!e.boss)e.bar=mkBar(e);if(e.hp<=0)killEnemy(e)}
const eHeight=e=>e.type=='drone'||ET[e.type].fly?e.y:ET[e.type].inf?1.4:ET[e.type].veh?2.2*(e.m.scale||1):2.6*(e.m.scale||1);
function killEnemy(e){if(e.dead)return;e.dead=true;const d=ET[e.type];S.kills++;prof.kills++;stat('kills');if(d.inf)stat('inf');if(d.veh)stat('veh');if(e.type=='heli'||e.type=='hammer')stat('heli');if(d.boss)stat('bosses');if(e.wboss){stat('wboss');S.wbDown=true}{const v=Math.round(d.sc*(S.mod?.scrap||1));S.scrap+=v;S.earned+=v}S.md=Math.min(100,S.md+d.xp*1.2);S.xp+=d.xp;S.combo++;S.comboT=3;S.maxCombo=Math.max(S.maxCombo,S.combo);
 const mult=Math.min(8,1+Math.floor(S.combo/5));S.score+=d.sc*10*mult;if(e.acc>0)dmgNum(e.x,eHeight(e)+2,e.z,e.acc,'#ffffff',e.acc>99);
 if(d.inf){sparks(e.x,1.2,e.z,0xffb040,6,6,.3);smoke(e.x,1,e.z,2,.6,.2)}else explode(e.x,eHeight(e),e.z,d.boss?3.4:e.type=='tank'||e.type=='apc'?2:e.type=='drone'?.9:1.4,0xff7a2a);if(e.laser)scene.remove(e.laser);if(e.sweep)scene.remove(e.sweep.b);dropBar(e);disposeMech(e.m);
 if(Math.random()<(d.boss?1:d.veh||e.type=='heli'?.3:.04))spawnPickup(e.x,e.z);addSP(d.boss?50:d.veh?2:1);if(d.boss&&!e.net)addCoins(5);heat(d.boss?20:d.inf?1:3);if(d.inf)qProg('inf');if(d.veh)qProg('veh');if(e.type=='heli'||e.type=='hammer')qProg('heli');if(e.lair){qProg('boss');S.scrap+=400;S.earned+=400;banner('LAIR CLEARED','+400 scrap')}if(d.boss){S.boss=null;S.bossDown=true;startKillCam(e)}checkLevel()}
function checkLevel(){const nl=levelOf(S.xp0+S.xp);if(nl>P.lv){P.lv=nl;P.pk=perks(nl);recalcMax();P.bch=Math.max(P.bch,1);banner('LEVEL UP',`${P.t.name} level ${nl}: ${PERKS[nl-1]}`);SFX.level()}}
function startKillCam(e){killCam={x:e.x,z:e.z,t:2.8,a:Math.atan2(camera.position.x-e.x,camera.position.z-e.z)};G.timeScale=.22;for(let i=0;i<7;i++)setTimeout(()=>explode(e.x+rnd(-4,4),rnd(2,8),e.z+rnd(-4,4),rnd(1.2,2.4)),i*200);banner('TITAN DOWN','',null)}
function spawnPickup(x,z){const mesh=new THREE.Mesh(geo('oct',()=>new THREE.OctahedronGeometry(.8)),glow(0xffc040,2.4));mesh.position.set(x,1.6,z);scene.add(mesh);pickups.push({mesh,x,z,t:14})}
function hurt(d){if((state!='play'&&state!='clear')||P.dead||CH.god)return;P.hurtT=4;S.waveHurt=true;if(P.hp<P.max*.3&&!P.av&&(P.lowT||0)<S.time){P.lowT=S.time+25;say('Armour critical.')}if(P.inv>0||(P.abT>0&&(P.t.ab||P.t.id)=='vanguard')){sparks(P.x,3,P.z,P.glow,4,8);return}if(P.t.id=='reactor')d*=.75;
 P.hp-=d;$('vig').style.opacity=Math.min(1,.35+d/30);vigT=.35;G.shake=Math.max(G.shake,.22);SFX.hit();if(P.hp<=0){P.hp=0;die()}}
function friendlyHit(x,z,r,d){netProxyHit(x,z,0,r+2.1,d);if(!P.dead&&(x-P.x)**2+(z-P.z)**2<(r+2.1)**2)hurt(d);for(const o of objs)if(o.friendly&&!o.dead&&(x-o.x)**2+(z-o.z)**2<(r+o.r)**2)objDamage(o,d)}
function splash(x,y,z,r,dmg,col,s,friendly=true){explode(x,y,z,s,col);if(friendly){for(const t of hostiles())if((t.x-x)**2+(t.z-z)**2<(r+t.r)**2)hitT(t,dmg)}else friendlyHit(x,z,r,dmg);
 for(const c of coversNear(x,z,r+20))if(Math.abs(c.x-x)<c.w/2+r*.6&&Math.abs(c.z-z)<c.d/2+r*.6)damageCover(c,dmg*.7)}
W.onBoom=c=>{const r=c.boom[0],dmg=c.boom[1];explode(c.x,1.5,c.z,r/5,0xff7a20);for(const e of enemies)if(live(e)&&d2(e,c)<(r+e.r)**2)hitEnemy(e,dmg);if(P&&!P.dead&&d2(P,c)<r*r)hurt(dmg*.5);
 setTimeout(()=>{for(const o of coversNear(c.x,c.z,r+22))if(!o.dead&&d2(o,c)<(r+2)**2)damageCover(o,dmg)},120)};
W.onStrike=(x,z,r)=>{if(!P||!S)return;if(!P.dead&&(x-P.x)**2+(z-P.z)**2<r*r)hurt(35);for(const e of enemies)if(live(e)&&(x-e.x)**2+(z-e.z)**2<(r+e.r)**2)hitEnemy(e,90);for(const c of coversNear(x,z,r+20))if(Math.abs(c.x-x)<c.w/2+r&&Math.abs(c.z-z)<c.d/2+r)damageCover(c,120)};
function mkMissile(x,y,z,vx,vy,vz,f,tg,dmg,delay=0){const mesh=new THREE.Group();part(cyl(.13,.13,1,8),f?paintMats('gunmetal').armor2:paintMats('enemy').armor2,0,0,0,mesh,Math.PI/2);part(cone(.13,.35),glow(0xff2a18,3),0,0,.65,mesh,Math.PI/2);const fl=new THREE.Mesh(sph(.22,8),glow(f?0xffb040:0xff4030,4));fl.position.z=-.6;mesh.add(fl);
 mesh.position.set(x,y,z);mesh.visible=delay<=0;scene.add(mesh);return{mesh,x,y,z,vx,vy,vz,f,tg,dmg,life:4.5,age:-delay,sp:f?44:22,turn:f?4.2:1.6}}

/* ================= player weapons ================= */
const rateMul=()=>(1+.1*S.up.rate)*(P.ocT>0?2:1);
const dmgMul=()=>(1+.15*S.up.dmg+P.pk.dmg)*(P.ocT>0?1.25:1)*(S.mod?.dmg||1)*(P.coreD||1)*(P.evo?1.1:1);
function aimFrom(p){const dx=P.ax-p.x,dz=P.az-p.z;return dx*dx+dz*dz<16?P.aimYaw:Math.atan2(dx,dz)}
function arcFire(p,a,c,dm,chains,d0,range,coneA){let best=null,bs=1e9;for(const e of hostiles()){const dx=e.x-p.x,dz=e.z-p.z,dd=Math.hypot(dx,dz);if(dd>range)continue;const da=angDiff(Math.atan2(dx,dz),a);if(da>coneA)continue;const sc=dd+da*40;if(sc<bs){bs=sc;best=e}}
 if(best){const hit=new Set([best]);let from=p,cur=best;for(let k=0;k<chains&&cur;k++){const to={x:cur.x,y:cur.isObj?4:eHeight(cur),z:cur.z};bolt(from,to,c,.8);bolt(from,to,0xffffff,.5,.08);sparks(to.x,to.y,to.z,c,4,8,.3);hitT(cur,(k?d0*.65:d0)*dm);from=to;cur=nearest(cur.x,cur.z,11,hit);if(cur)hit.add(cur)}}
 else bolt(p,{x:p.x+Math.sin(a)*14,y:p.y-1.5,z:p.z+Math.cos(a)*14},c,1.2,.08);flash(p.x,p.y,p.z,c,120,.1);SFX.arc()}
function railFire(p,a,c,dm,L,dmg,w,stun){const sx=Math.sin(a),sz=Math.cos(a);const bl=segBlocked(p.x,p.z,p.x+sx*L,p.z+sz*L,1);if(bl&&!bl.c.team){L*=bl.t;damageCover(bl.c,dmg*dm)}
 for(const t of hostiles()){const vx=t.x-p.x,vz=t.z-p.z,tt=vx*sx+vz*sz;if(tt<0||tt>L)continue;const px=vx-sx*tt,pz=vz-sz*tt;if(px*px+pz*pz<(t.r+.7)**2){hitT(t,dmg*dm);if(stun&&!t.isObj)t.stun=Math.max(t.stun,stun);sparks(t.x,3,t.z,c,6,10,.35)}}
 const e={x:p.x+sx*L,y:p.y,z:p.z+sz*L};beam(p,e,c,w,.3);beam(p,e,0xffffff,w*.33,.22);flash(p.x,p.y,p.z,c,w*600,.15)}
function fireW(W,p,a,c,dm){const col=W.col2&&P.t.glow2?P.t.glow2:c;
 if(W.kind=='proj'){let last;for(let i=0;i<(W.n||1);i++)last=shoot({...p,a:a+rnd(-(W.spread||0),W.spread||0),sp:W.sp*(W.n>1?rnd(.88,1.05):1),dmg:W.dmg*dm,life:W.life,f:true,col,kind:W.proj||'tracer',r:W.r||.3,splash:W.splash||0,poison:W.poison||0,burn:W.burn||0,stun:W.stun||0});if(W.cluster)last.cluster=1;
  if(W.n>1||W.splash)flash(p.x,p.y,p.z,col,W.splash?180:220,.12);else FX.emit(p.x,p.y,p.z,0,0,0,.05,1.6,...hexRGB(col).map(v=>v*3),1)}
 else if(W.kind=='beam'){railFire(p,a,col,dm,W.range,W.dmg,W.w,W.stun||0);if(W.dmg>60)G.shake=Math.max(G.shake,.18)}
 else if(W.kind=='chain')arcFire(p,a,col,dm,W.chains,W.dmg,W.range,W.cone);
 else if(W.kind=='missile')for(let i=0;i<(W.n||1);i++){const aa=a+(i-(W.n-1)/2)*.3,mm=mkMissile(p.x,p.y,p.z,Math.sin(aa)*24,1,Math.cos(aa)*24,true,nearest(P.ax,P.az,20),W.dmg*dm,i*.06);mm.poison=W.poison||0;missiles.push(mm)}
 (SFX[W.sfx]||SFX.rotary)()}
function fireArm(side){const W=modW(P.load[side]);if(!W||W.kind=='melee')return;const k='cd'+side;if(P[k]>0)return;P[k]=W.rate/rateMul();const mz=P.m.muzzles[side];if(!mz.length)return;P.m.root.updateMatrixWorld(true);
 mz[(P['mi'+side]++)%mz.length].getWorldPosition(_v);const p={x:_v.x,y:_v.y,z:_v.z};fireW(W,p,aimFrom(p),P.glow,dmgMul())}
function act(a){if(state!='play'||paused||!P||P.dead||P.sky)return;const t=P.t;auInit();if(a=='board'){boardToggle();return}if(P.av)return;if(a=='fin'){const e=finTarget();if(!e){toast('Get close to a weak or infantry enemy');return}e.fin=.9;e.finA=P.aimYaw;stat('fin');P.inv=1.2;G.timeScale=.35;finRT=.8;banner('FINISHER',ET[e.type].inf?'Stomped':'Thrown','#ffc23a');SFX.boost();return}if(a=='turbo'){P.turboT=!P.turboT;$('abTurbo').classList.toggle('on',P.turboT);return}if(a=='map'){toggleMap();return}
 if(a=='boost'&&P.bch>0){let dx=P.vx,dz=P.vz,l=Math.hypot(dx,dz);if(l<.5){dx=Math.sin(P.aimYaw);dz=Math.cos(P.aimYaw);l=1}P.bx=dx/l;P.bz=dz/l;P.bT=.24;P.inv=.3;P.bch--;if(P.bcd<=0)P.bcd=2.4*(1-.15*S.up.boost);SFX.boost()}
 if(a=='msl'&&P.mcd<=0&&!S.mod?.nomsl){const n=6+2*S.up.msl+P.pk.msl,used=new Set();P.m.root.updateMatrixWorld(true);for(let i=0;i<n;i++){const pod=P.m.pods[i%2]||P.m.pods[0];pod.getWorldPosition(_v);const tg=nearest(_v.x,_v.z,1e9,used.size<hostiles().length?used:null);if(tg)used.add(tg);
  const ya=P.aimYaw+(i%2?1:-1)*rnd(.6,1.4);missiles.push(mkMissile(_v.x,_v.y,_v.z,Math.sin(ya)*8,rnd(9,14),Math.cos(ya)*8,true,tg,45*dmgMul(),i*.05))}P.mcd=8;SFX.msl()}
 if(a=='util'&&P.ucd<=0)useUtil();if(a=='mass'&&S.md>=100)useMass();
 if(a=='over'&&P.ocd<=0&&!P.jam){P.ocT=P.pk.over?9:6;P.ocd=30;banner('OVERDRIVE','80 m/s and double fire rate');say('Overdrive engaged.');SFX.boost();SFX.level()}
 if(a=='jump'&&!P.sky&&P.en>=30&&!P.jam){P.en-=30;P.enT=1;let dx=P.vx,dz=P.vz,l=Math.hypot(dx,dz);if(l<1){dx=Math.sin(P.aimYaw);dz=Math.cos(P.aimYaw);l=1}const r=26+Math.min(30,l*.4);P.sky={t:0,dur:.95,x0:P.x,z0:P.z,x1:clamp(P.x+dx/l*r,-ARENA+3,ARENA-3),z1:clamp(P.z+dz/l*r,-ARENA+3,ARENA-3),jump:1,h:11};P.inv=.4;SFX.boost()}
 if(a=='abil'&&P.acd<=0){P.acd=t.cd*(1-.12*S.up.abil-P.pk.abil);const id=t.ab||t.id,dm=dmgMul(),c=P.glow;
  if(id=='vanguard'){P.abT=4;SFX.level()}
  else if(id=='inferno'){P.rushT=.38;P.rx=Math.sin(P.aimYaw);P.rz=Math.cos(P.aimYaw);P.rushHit.clear();P.inv=.5;SFX.boost();SFX.boom(.12)}
  else if(id=='tempest'){const tg=hostiles().filter(e=>d2(e,P)<46*46).sort((a,b)=>d2(a,P)-d2(b,P)).slice(0,8);flashSky(1);
   tg.forEach((e,i)=>setTimeout(()=>{if(e.dead)return;const y=e.isObj?3:eHeight(e);bolt({x:e.x+rnd(-4,4),y:70,z:e.z+rnd(-4,4)},{x:e.x,y,z:e.z},c,3.5,.25);bolt({x:e.x,y:60,z:e.z},{x:e.x,y,z:e.z},0xffffff,2.5,.2);sprite(e.x,y,e.z,c,3,10,.4);flash(e.x,6,e.z,c,600,.3);if(!e.isObj)e.stun=1.8;hitT(e,110*dm);SFX.thunder()},i*70));if(!tg.length)banner('NO TARGETS IN RANGE','');G.shake=.6}
  else if(id=='reactor'){ring(P.x,P.z,c,2,26,.8);ring(P.x,P.z,0xffffff,1,22,.5);sprite(P.x,3,P.z,c,6,30,.6,.8);flash(P.x,5,P.z,c,1500,.6);G.shake=1;SFX.boom(.3);
   for(const e of hostiles()){const dd=Math.sqrt(d2(e,P));if(dd<24+e.r){hitT(e,(160-dd*3)*dm);if(!e.isObj&&!e.dead){const k=(e.boss?2:8)/(dd||1);e.x+=(e.x-P.x)*k*.5;e.z+=(e.z-P.z)*k*.5;if(!ET[e.type].fly)pushOut(e,e.r)}}}
   for(const cv of coversNear(P.x,P.z,40))if(d2(cv,P)<20*20)damageCover(cv,120);const[r,g,b]=hexRGB(c);for(let i=0;i<60;i++){const a2=rnd(0,TAU);FX.emit(P.x,1,P.z,Math.cos(a2)*30,rnd(0,4),Math.sin(a2)*30,.7,1.2,r*3,g*3,b*3,1)}}
  else if(id=='venom'){const dx=P.ax-P.x,dz=P.az-P.z,l=Math.hypot(dx,dz)||1,r=Math.min(l,30),cx=P.x+dx/l*r,cz=P.z+dz/l*r,mesh=new THREE.Mesh(geo('disc',()=>new THREE.CircleGeometry(1,40)),addMat(c,.35,GLOWT));mesh.rotation.x=-Math.PI/2;mesh.position.set(cx,.1,cz);mesh.scale.setScalar(9.5);scene.add(mesh);clouds.push({mesh,x:cx,z:cz,r:9,t:6});ring(cx,cz,c,1,10,.4);SFX.fission()}
  else if(id=='phantom'){const dx=P.ax-P.x,dz=P.az-P.z,l=Math.hypot(dx,dz)||1,r=Math.min(l,26);P.sky={t:0,dur:1.15,x0:P.x,z0:P.z,x1:clamp(P.x+dx/l*r,-ARENA+3,ARENA-3),z1:clamp(P.z+dz/l*r,-ARENA+3,ARENA-3)};P.inv=1.4;SFX.boost()}}}

/* ================= utilities & mass destruction ================= */
function affect(x,z,r,burn,poison){for(const e of enemies)if(live(e)&&(e.x-x)**2+(e.z-z)**2<(r+e.r)**2){if(burn)e.burn=Math.max(e.burn,burn);if(poison){e.poison=Math.max(e.poison,3);e.pdps=Math.max(e.pdps,poison)}}}
function aimPt(max){const dx=P.ax-P.x,dz=P.az-P.z,l=Math.hypot(dx,dz)||1,r=Math.min(l,max);return{x:clamp(P.x+dx/l*r,-ARENA+2,ARENA-2),z:clamp(P.z+dz/l*r,-ARENA+2,ARENA-2)}}
function useUtil(){const U=UTILS[P.load.U];if(!U)return;const id=U.fx;P.ucd=U.cd*(1-P.pk.abil);const c=P.glow,dm=dmgMul();
 if(id=='repair'){P.healT=4;sprite(P.x,4,P.z,0x4dff6a,3,9,.5);SFX.level()}
 else if(id=='emp'){const p=aimPt(30);ring(p.x,p.z,0x9cc9ff,1,13,.5);sprite(p.x,2,p.z,0x9cc9ff,4,18,.4);flash(p.x,4,p.z,0x9cc9ff,800,.3);for(const e of hostiles())if(d2(e,p)<(12+e.r)**2){if(!e.isObj)e.stun=3;hitT(e,30*dm)}for(const s of shots)if(!s.f&&d2(s,p)<196)s.life=0;SFX.thunder()}
 else if(id=='mines'){for(let i=0;i<6;i++){const a=i/6*TAU,x=clamp(P.x+Math.cos(a)*5,-ARENA+2,ARENA-2),z=clamp(P.z+Math.sin(a)*5,-ARENA+2,ARENA-2),mesh=new THREE.Group();part(cyl(.6,.8,.4,10),paintMats('gunmetal').dark,0,.2,0,mesh);part(sph(.25,8),glow(c,4),0,.5,0,mesh);mesh.position.set(x,0,z);scene.add(mesh);mines.push({mesh,x,z,t:25,arm:.8,dmg:90*dm,f:true,burn:U.burn,poison:U.poison})}SFX.ui()}
 else if(id=='wall'){const ax=Math.abs(Math.cos(P.aimYaw))>Math.abs(Math.sin(P.aimYaw)),x=clamp(P.x+Math.sin(P.aimYaw)*6,-ARENA+3,ARENA-3),z=clamp(P.z+Math.cos(P.aimYaw)*6,-ARENA+3,ARENA-3),g=new THREE.Group(),h=new THREE.Mesh(new THREE.PlaneGeometry(9,4.5),addMat(c,.5,HEX));h.position.y=2.25;h.rotation.y=ax?0:Math.PI/2;g.add(h);part(rbox(ax?9:.5,.3,ax?.5:9,.1),paintMats('gunmetal').dark,0,.15,0,g);
  const cv=addTempCover(x,z,ax?9:1,ax?1:9,4.5,600,g);cv.team='p';walls.push({c:cv,t:8,m:h});SFX.level()}
 else if(id=='decoy'){const p=aimPt(14);objs.push(mkObj('decoy',p.x,p.z));SFX.ui()}
 else if(id=='turret'){const tu=mkObj('turret',clamp(P.x+Math.sin(P.aimYaw)*4,-ARENA+3,ARENA-3),clamp(P.z+Math.cos(P.aimYaw)*4,-ARENA+3,ARENA-3));tu.zap=U.zap;objs.push(tu);SFX.ui()}}
function useMass(){const M=MASS[P.load.X],id=M.fx;S.md=0;const dm=dmgMul(),c=P.glow;banner(M.name.toUpperCase(),'Mass destruction deployed');SFX.alarm();
 if(id=='airstrike'){const x0=P.x,z0=P.z,a=P.aimYaw;for(let i=0;i<14;i++)setTimeout(()=>{if(!S||S.ended)return;const x=clamp(x0+Math.sin(a)*(6+i*4.2),-ARENA+2,ARENA-2),z=clamp(z0+Math.cos(a)*(6+i*4.2),-ARENA+2,ARENA-2);splash(x,1,z,6.5,160*dm,M.burn?0xff5010:0xff8a2a,1.5);if(M.burn)affect(x,z,7,4,0)},400+i*110)}
 else if(id=='swarm'){P.m.root.updateMatrixWorld(true);const used=new Set();for(let i=0;i<40;i++){const pod=P.m.pods[i%2]||P.m.pods[0];if(pod)pod.getWorldPosition(_v);else _v.set(P.x,6,P.z);const tg=nearest(_v.x,_v.z,1e9,used.size<hostiles().length?used:null);if(tg)used.add(tg);const ya=rnd(0,TAU);const mm=mkMissile(_v.x,_v.y,_v.z,Math.sin(ya)*10,rnd(10,18),Math.cos(ya)*10,true,tg,55*dm,i*.04);mm.poison=M.poison||0;missiles.push(mm)}}
 else if(id=='orbital'){const p=aimPt(40);special.orb={x:p.x,z:p.z,t:4.5,b:beamMesh(c,.85),b2:beamMesh(0xffffff,.9)}}
 else if(id=='blackhole'){const p=aimPt(30),s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOWT,color:new THREE.Color(0xb04dff).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s.position.set(p.x,3,p.z);scene.add(s);special.bh={x:p.x,z:p.z,t:3.5,s,poison:M.poison||0}}
 else if(id=='nuke'){const p=aimPt(30),mesh=new THREE.Mesh(geo('ring',()=>new THREE.RingGeometry(.86,1,64)),addMat(0xff3020,.8));mesh.rotation.x=-Math.PI/2;mesh.position.set(p.x,.15,p.z);mesh.scale.setScalar(30);scene.add(mesh);special.nuke={x:p.x,z:p.z,t:2.4,mesh}}}
function updSpecial(dt){if(!P||!S)return;const dm=dmgMul();
 if(P.healT>0){P.healT-=dt;P.hp=Math.min(P.max,P.hp+P.max*.35/4*dt);if(Math.random()<.5)FX.emit(P.x+rnd(-2,2),rnd(1,6),P.z+rnd(-2,2),0,3,0,.6,.8,.6,3,.8,1)}
 for(let i=walls.length-1;i>=0;i--){const w=walls[i];w.t-=dt;w.m.material.opacity=w.t<2?.25+.25*Math.abs(Math.sin(w.t*12)):.5;if(w.t<=0||w.c.dead){if(!w.c.dead){w.c.boom=null;damageCover(w.c,1e9)}walls.splice(i,1)}}
 const o=special.orb;if(o){o.t-=dt;const dx=P.ax-o.x,dz=P.az-o.z,l=Math.hypot(dx,dz);if(l>.5){const s=Math.min(l,18*dt);o.x+=dx/l*s;o.z+=dz/l*s}placeBeam(o.b,{x:o.x,y:120,z:o.z},{x:o.x,y:0,z:o.z},2.4+Math.sin(performance.now()*.03)*.3);placeBeam(o.b2,{x:o.x,y:120,z:o.z},{x:o.x,y:0,z:o.z},.8);
  sparks(o.x,.5,o.z,P.glow,3,14,.5);if(Math.random()<.3)smoke(o.x,.5,o.z,1,1.5,.15);if(Math.random()<.15)ring(o.x,o.z,P.glow,1,7,.3);G.shake=Math.max(G.shake,.15);
  for(const e of hostiles())if(d2(e,o)<(6+e.r)**2)hitT(e,280*dt*dm);for(const c of coversNear(o.x,o.z,24))if(!c.team&&Math.abs(c.x-o.x)<c.w/2+4&&Math.abs(c.z-o.z)<c.d/2+4)damageCover(c,400*dt);
  if(o.t<=0){scene.remove(o.b,o.b2);special.orb=null}}
 const b=special.bh;if(b){b.t-=dt;b.s.scale.setScalar(5+Math.sin(performance.now()*.02)+(3.5-b.t)*2);for(let k=0;k<6;k++){const a=rnd(0,TAU),r=rnd(6,16);FX.emit(b.x+Math.cos(a)*r,rnd(1,5),b.z+Math.sin(a)*r,-Math.cos(a)*r*1.5,0,-Math.sin(a)*r*1.5,.6,.9,1.4,.4,2.5,1)}
  for(const e of enemies){if(!live(e))continue;const dx=b.x-e.x,dz=b.z-e.z,dd=Math.hypot(dx,dz);if(dd<26&&dd>1){const pull=(e.boss?4:16)*dt;e.x+=dx/dd*Math.min(pull,dd);e.z+=dz/dd*Math.min(pull,dd);e.stun=Math.max(e.stun,.2)}}
  if(b.t<=0){scene.remove(b.s);b.s.material.dispose();special.bh=null;sprite(b.x,3,b.z,0xb04dff,2,30,.6);flash(b.x,4,b.z,0xb04dff,2000,.5);splash(b.x,2,b.z,14,500*dm,b.poison?0x9dff3a:0xb04dff,3);if(b.poison)affect(b.x,b.z,16,0,b.poison);G.shake=1.2;flashSky(.6)}}
 const n=special.nuke;if(n){n.t-=dt;n.mesh.material.opacity=.4+.5*Math.abs(Math.sin(n.t*10));if(n.t<=0){scene.remove(n.mesh);n.mesh.material.dispose();special.nuke=null;
  explode(n.x,4,n.z,6,0xffd080);sprite(n.x,10,n.z,0xffffff,10,90,1.2);ring(n.x,n.z,0xffb040,4,60,1.2);ring(n.x,n.z,0xffffff,2,45,.9);smoke(n.x,2,n.z,40,5,.2);flashSky(1.5);G.shake=2.4;SFX.boom(.45);
  const wt=$('white');wt.style.transition='none';wt.style.opacity=1;requestAnimationFrame(()=>{wt.style.transition='opacity 1.4s';wt.style.opacity=0});
  for(const e of hostiles())if(d2(e,n)<(34+e.r)**2)hitT(e,900*dm*(e.boss?.5:1));for(const c of coversNear(n.x,n.z,50))if(!c.team&&d2(c,n)<900)damageCover(c,1e9);if(d2(P,n)<64)hurt(60)}}}

/* ================= player update ================= */
const ray=new THREE.Raycaster(),aimPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-3),ndc=new THREE.Vector2(),hitP=new THREE.Vector3();
function pilotAim(){camera.updateMatrixWorld();const o=camera.position,dir=_w.set(0,0,-1).applyQuaternion(camera.quaternion);let best=null,bt=1e9;
 for(const e of hostiles()){const cy=e.isObj?4:eHeight(e),vx=e.x-o.x,vy=cy-o.y,vz=e.z-o.z,t=vx*dir.x+vy*dir.y+vz*dir.z;if(t<6||t>110)continue;const px=o.x+dir.x*t-e.x,py=o.y+dir.y*t-cy,pz=o.z+dir.z*t-e.z;if(px*px+py*py+pz*pz<(e.r+1.6)**2&&t<bt){bt=t;best=e}}
 P.lock=best;if(best){P.ax=best.x;P.az=best.z;return}let t=dir.y<-.01?(3-o.y)/dir.y:85;if(t<0||t>95)t=85;P.ax=o.x+dir.x*t;P.az=o.z+dir.z*t;const dd=Math.hypot(P.ax-P.x,P.az-P.z);if(dd<8){P.ax=P.x+Math.sin(camYaw)*8;P.az=P.z+Math.cos(camYaw)*8}}
function updPlayer(dt){const p=P,t=p.t;if(p.dead)return;if(p.av){updAvatar(p,dt);return}let ix=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0),iz=(K.KeyS||K.ArrowDown?1:0)-(K.KeyW||K.ArrowUp?1:0);
 if(mStick){const dx=mStick.x-mStick.ox,dy=mStick.y-mStick.oy,l=Math.hypot(dx,dy);if(l>8){ix=dx/Math.max(l,55);iz=dy/Math.max(l,55)}}if(GP.on&&(GP.lx||GP.ly)){ix=GP.lx;iz=GP.ly}
 let mx=ix,mz=iz;if(camMode=='pilot'){const fx=Math.sin(camYaw),fz=Math.cos(camYaw),rx=-Math.cos(camYaw),rz=Math.sin(camYaw);mx=fx*-iz+rx*ix;mz=fz*-iz+rz*ix}
 const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml}if(p.jam>0)p.jam-=dt;
 const turbo=!(p.jam>0)&&(K.ShiftLeft||K.ShiftRight||p.turboT||GP.turbo)&&ml>.1&&p.en>0;if(turbo){p.en=Math.max(0,p.en-16*dt*(hasGP('gp_energy')?.7:1)*(CH.inf?0:1));p.enT=1}else if((p.enT-=dt)<=0)p.en=Math.min(p.enMax||100,p.en+14*dt);
 const fast=turbo||(p.ocT>0&&!(p.jam>0));const top=(fast?80:t.spd*(p.spdMul||1)*(CH.speed?2:1))*(p.jam>0?.45:1);const k=1-Math.exp(-dt*(fast?3.2:9));p.vx+=(mx*top-p.vx)*k;p.vz+=(mz*top-p.vz)*k;let vx=p.vx,vz=p.vz;p.fast=fast;
 if(p.bT>0){p.bT-=dt;vx=p.bx*36;vz=p.bz*36;FX.emit(p.x-p.bx*2,3.5,p.z-p.bz*2,-p.bx*10+rnd(-3,3),rnd(-1,2),-p.bz*10+rnd(-3,3),.35,1.6,3,1.6,.5,1)}
 if(p.rushT>0){p.rushT-=dt;vx=p.rx*52;vz=p.rz*52;for(let i=0;i<4;i++)FX.emit(p.x+rnd(-1.5,1.5),rnd(1,5),p.z+rnd(-1.5,1.5),rnd(-2,2),rnd(1,4),rnd(-2,2),.5,1.4,3,1,.2,1);
  for(const e of hostiles())if(!p.rushHit.has(e)&&d2(e,p)<(e.r+4.5)**2){p.rushHit.add(e);hitT(e,150*dmgMul());if(!e.isObj)e.burn=3;sparks(e.x,3,e.z,p.glow,14,14,.4);SFX.boom(.1)}for(const c of coversNear(p.x,p.z,24))if(d2(c,p)<16)damageCover(c,300)}
 if(p.sky){const s=p.sky;s.t+=dt;const q=Math.min(1,s.t/s.dur);p.x=lerp(s.x0,s.x1,q);p.z=lerp(s.z0,s.z1,q);p.y=Math.sin(q*Math.PI)*(s.h||15);vx=vz=0;for(const a of p.m.thr){a.getWorldPosition(_v);FX.emit(_v.x,_v.y,_v.z,rnd(-1,1),-14,rnd(-1,1),.35,1.6,3,2,.6,1)}
  if(q>=1&&s.jump){p.y=0;p.sky=null;ring(p.x,p.z,p.glow,1,8,.4);smoke(p.x,.5,p.z,6,1.2,.2);SFX.step(.2);G.shake=.3}
  else if(q>=1){p.y=0;p.sky=null;const dm=dmgMul();ring(p.x,p.z,p.glow,2,22,.6);sprite(p.x,2,p.z,p.glow,5,22,.5);flash(p.x,3,p.z,p.glow,1200,.5);G.shake=1.1;SFX.boom(.3);smoke(p.x,.5,p.z,14,2,.2);
   for(const e of hostiles())if(d2(e,p)<(10+e.r)**2){hitT(e,170*dm);if(!e.isObj)e.stun=1}for(const c of coversNear(p.x,p.z,30))if(d2(c,p)<100)damageCover(c,250)}}
 else{const vs=Math.hypot(vx,vz),n=Math.max(1,Math.ceil(vs*dt/1.2));for(let i=0;i<n;i++){p.x+=vx*dt/n;p.z+=vz*dt/n;if(vs>55)ramCovers(p);pushOut(p,2.2)}}p.spd=Math.hypot(vx,vz);S.dist=(S.dist||0)+p.spd*dt;
 if(p.spd>30){const bx=-vx/p.spd,bz=-vz/p.spd;for(let i=0;i<3;i++)FX.emit(p.x+bx*3+rnd(-1,1),rnd(2,5),p.z+bz*3+rnd(-1,1),bx*20,rnd(-1,1),bz*20,.3,1.4,...hexRGB(p.glow).map(v=>v*2.5),1);if(Math.random()<.4)FX.emit(p.x+rnd(-12,12),rnd(1,6),p.z+rnd(-12,12),bx*90,0,bz*90,.15,.5,1.5,1.5,1.6,.8)}
 const sp=Math.hypot(p.vx,p.vz);if(sp>.6&&!p.sky)p.yaw=lerpA(p.yaw,Math.atan2(p.vx,p.vz),1-Math.exp(-dt*7));
 if(camMode=='pilot'){if(!locked&&mouse.on&&!TOUCH){const nx=mouse.x/stage.clientWidth*2-1,ny=mouse.y/stage.clientHeight*2-1;if(Math.abs(nx)>.3)camYaw-=Math.sign(nx)*(Math.abs(nx)-.3)*2.6*dt;camPitch=lerp(camPitch,clamp(.15+ny*.45,-.15,.55),dt*3)}
  if(aStick){const dx=aStick.x-aStick.ox,dy=aStick.y-aStick.oy;camYaw-=clamp(dx/55,-1.5,1.5)*2.2*dt;camPitch=clamp(camPitch+clamp(dy/55,-1,1)*.8*dt,-.15,.55)}if(GP.on){camYaw-=GP.rx*2.4*dt;camPitch=clamp(camPitch+GP.ry*.9*dt,-.15,.55)}pilotAim()}
 else if(aStick){const dx=aStick.x-aStick.ox,dy=aStick.y-aStick.oy;if(Math.hypot(dx,dy)>10){const a=Math.atan2(dx,dy);p.ax=p.x+Math.sin(a)*16;p.az=p.z+Math.cos(a)*16}}
 else if(mouse.on){ndc.set(mouse.x/stage.clientWidth*2-1,-(mouse.y/stage.clientHeight)*2+1);ray.setFromCamera(ndc,camera);if(ray.ray.intersectPlane(aimPlane,hitP)){p.ax=hitP.x;p.az=hitP.z}}
 if(GP.on&&camMode!='pilot'&&(GP.rx||GP.ry)){const a=Math.atan2(GP.rx,GP.ry);p.ax=p.x+Math.sin(a)*18;p.az=p.z+Math.cos(a)*18}
 p.autoT=null;if(TOUCH&&setOn('autoaim')&&!aStick&&camMode!='pilot'){const h=nearest(p.x,p.z,45);if(h){p.ax=h.x;p.az=h.z;p.autoT=h}}
 p.aimYaw=lerpA(p.aimYaw,Math.atan2(p.ax-p.x,p.az-p.z),1-Math.exp(-dt*16));
 for(const c of['cdL','cdR','mcd','acd','abT','inv','ocd','ocT','ucd'])if(p[c]>0)p[c]-=dt;
 if(p.bch<p.pk.boost&&(p.bcd-=dt)<=0){p.bch++;p.bcd=p.bch<p.pk.boost?2.4*(1-.15*S.up.boost):0}
 if(p.pk.regen&&p.hp<p.max)p.hp=Math.min(p.max,p.hp+p.pk.regen*dt);
 const firing=(mouse.down||autoFire||GP.fire||!!p.autoT||(aStick&&Math.hypot(aStick.x-aStick.ox,aStick.y-aStick.oy)>10))&&p.rushT<=0&&!p.sky&&state!='won';
 const m=p.m;m.root.position.set(p.x,p.y,p.z);m.root.rotation.y=p.yaw;m.torso.rotation.y=p.aimYaw-p.yaw;m.spinV=lerp(m.spinV,firing?28:2,dt*5);animMech(m,p.bT>0||p.rushT>0||p.sky?0:Math.min(sp,12),dt);m.body.rotation.x=lerp(m.body.rotation.x,p.spd>20?.22:0,dt*5);
 p.firing=firing;if(firing){fireArm('L');fireArm('R')}
 const melee=['L','R'].filter(k=>WEAPONS[p.load[k]]?.kind=='melee').length;if(melee){const dm=dmgMul()*melee;for(const e of hostiles())if(d2(e,p)<(e.r+4.4)**2){hitT(e,60*dt*dm);if(Math.random()<.4)sparks(e.x+(p.x-e.x)*.3,2.5,e.z+(p.z-e.z)*.3,0xffa040,2,10,.25)}}
 if(p.ocT>0&&Math.random()<.5)FX.emit(p.x+rnd(-1.5,1.5),rnd(1,6),p.z+rnd(-1.5,1.5),0,2,0,.4,.8,...hexRGB(p.glow).map(v=>v*3),1);
 aegis.visible=(t.ab||t.id)=='vanguard'&&p.abT>0;if(aegis.visible){aegis.position.set(p.x,3.4,p.z);aegis.rotation.y+=dt*.6;aegis.material.opacity=.35+Math.sin(performance.now()*.01)*.12}
 for(const h of W.hazards)if(h.type=='fire'&&d2(h,p)<h.r*h.r&&!p.sky){hurt(16*dt);if(Math.random()<.2)sparks(p.x,1,p.z,0xff7a20,2,6)}
 if(Math.random()<dt*3)FX.emit(p.x+rnd(-.6,.6),.15,p.z+rnd(-.6,.6),rnd(-1,1),.5,rnd(-1,1),.4,.5,.4,.5,.7,.6)}

/* ================= enemies ================= */
function pickTarget(e){if(CH.ghost)return e.home||(e.home={x:e.x+rnd(-30,30),z:e.z+rnd(-30,30),y:0,dead:false});if(NET.inGame&&S.kind=='coop'){const c=[...NET.remotes.values()].filter(r=>!r.dead);if(!P.dead)c.push(P);if(c.length){c.sort((a,b)=>d2(a,e)-d2(b,e));return c[0]}}const dec=objs.find(o=>o.kind=='decoy'&&!o.dead);if(dec&&Math.random()<(ET[e.type].boss?.4:.85))return dec;if(ET[e.type].boss)return P;const fr=objs.filter(o=>o.friendly&&!o.dead&&!o.arrived);if(fr.length&&Math.random()<.55){fr.sort((a,b)=>d2(a,e)-d2(b,e));return fr[0]}return P}
function spawn(type,at){const d=ET[type],fly=!!d.fly||type=='drone';let x,z,tries=0;
 if(at){x=at.x;z=at.z}else do{const a=rnd(0,TAU),r=rnd(36,58);x=clamp(P.x+Math.cos(a)*r,-ARENA+6,ARENA-6);z=clamp(P.z+Math.sin(a)*r,-ARENA+6,ARENA-6)}while(tries++<25&&((x-P.x)**2+(z-P.z)**2<30*30||blockHit(x,z,1,d.r)));
 const ec=0xff2a18,des=W.id=='desert';let m;
 switch(type){case'drone':m=buildDrone();break;case'soldier':case'rocket':case'sniper':case'riot':m=buildSoldier(type,des);break;case'jeep':m=buildJeep(des);break;case'apc':m=buildAPC(des);break;
  case'tank':m=buildTank(des);break;case'heli':m=buildHeli(des);break;case'goliath':m=buildTank(des,2.2,true);break;case'hammer':m=buildHeli(des,2,true);break;case'battery':m=buildBattery(des);break;
  default:m=buildMech({chassis:P.t.id,L:P.load.L,R:P.load.R,glow:ec,glow2:0xff8020,paint:des?'desert':'olive',scale:1.15,enemy:true})}
 scene.add(m.root);const lv=S.kind=='campaign'||S.kind=='open'?S.lvl:Math.max(1,S.wave),mod=S.mod||{},hm=(1+(lv-1)*.13)*(mod.ehp||1)*(d.boss?Math.max(1,Math.pow(lv/5,1.1)):1);
 const e={type,m,x,z,y:d.fly||(type=='drone'?3.2:0),r:d.r,hp:d.hp*hm,max:d.hp*hm,spd:d.spd*(mod.speed||1),drop:type=='rival'?1.3:0,fcd:rnd(.8,(d.fire||1)+1),yaw:0,aimYaw:0,stun:0,poison:0,pdps:0,burn:0,slow:0,side:Math.random()<.5?1:-1,pat:0,flash:0,dead:false,mi:0,tgt:P,tgtT:0,acc:0,accT:0,boss:!!d.boss,orb:rnd(0,TAU),bar:null,lvl:lv,charge:0,aimT:0,depT:rnd(4,8),ramT:0};
 if(fly&&!at){const a=Math.atan2(x-P.x,z-P.z);e.x=P.x+Math.sin(a)*70;e.z=P.z+Math.cos(a)*70}
 if(d.boss){S.boss=e;$('bossP').classList.remove('hide');$('bossName').textContent=d.name.toUpperCase();SFX.alarm();if(!S.netGuest&&!killCam)bossIntro(e,d.name);say('Warning. Hostile titan detected.');if(m.legs.length)m.onStep=()=>{SFX.step(.16);G.shake=Math.max(G.shake,.08)}}
 m.root.position.set(e.x,e.drop>.1?36:e.y,e.z);enemies.push(e);return e}
function attack(e,T,dd){const d=ET[e.type],dm=1+e.lvl*.06;e.m.root.updateMatrixWorld(true);const ang=p=>Math.atan2(T.x-p.x,T.z-p.z);
 switch(e.type){
 case'soldier':{e.burst={n:3,int:.12,t:0,fn:()=>{const q=emz(e);eShoot(q,ang(q)+rnd(-.07,.07),40,3.5*dm,0xffd070,'tracer');SFX.rotary()}};break}
 case'rocket':{const p=emz(e),mm=mkMissile(p.x,p.y,p.z,Math.sin(ang(p))*14,2,Math.cos(ang(p))*14,false,T,18*dm);mm.sp=24;mm.turn=1;missiles.push(mm);SFX.msl();break}
 case'riot':{const p=emz(e);for(let i=-2;i<=2;i++)eShoot(p,ang(p)+i*.12,30,4*dm,0xffd070,'tracer');SFX.ember();break}
 case'jeep':{e.burst={n:8,int:.08,t:0,fn:()=>{const q=emz(e);eShoot(q,ang(q)+rnd(-.08,.08),44,3.5*dm,0xffd070,'tracer');SFX.rotary()}};break}
 case'apc':{e.burst={n:6,int:.1,t:0,fn:()=>{const q=emz(e);eShoot(q,ang(q)+rnd(-.06,.06),44,5*dm,0xffd070,'tracer');SFX.rotary()}};break}
 case'tank':{const p=emz(e),s=eShoot(p,ang(p),36,22*dm,0xff8a30,'orb');s.splash=4;s.r=.6;flash(p.x,p.y,p.z,0xffa040,300,.15);smoke(p.x,p.y,p.z,3,.8);SFX.fission();break}
 case'heli':{if(Math.random()<.5)e.burst={n:10,int:.07,t:0,fn:()=>{const q=emz(e),tt=Math.hypot(T.x-q.x,T.z-q.z)/44;eShoot(q,ang(q)+rnd(-.07,.07),44,4*dm,0xffd070,'tracer',(2.5-q.y)/Math.max(.2,tt));SFX.rotary()}};
  else for(let i=0;i<4;i++){const pod=e.m.pods[i%2];pod.getWorldPosition(_v);missiles.push(mkMissile(_v.x,_v.y,_v.z,rnd(-3,3),-2,rnd(-3,3),false,T,14*dm,i*.15))}break}
 case'goliath':{e.pat=(e.pat+1)%4;
  if(e.pat==0){for(const mz of e.m.muzzles.L){mz.getWorldPosition(_v);const s=eShoot({x:_v.x,y:_v.y,z:_v.z},ang(_v),40,30*dm,0xff8a30,'orb');s.splash=6;s.r=.8}G.shake=.5;SFX.fission();flash(e.x,6,e.z,0xffa040,800,.2)}
  else if(e.pat==1){const p=emz(e),s=eShoot(p,ang(p),34,10*dm,0x9cc9ff,'orb');s.emp=1;s.splash=5;s.r=.8;banner('EMP SHELL','They are trying to jam your titan','#9cc9ff');SFX.laser()}
  else if(e.pat==2){for(let i=0;i<8;i++){const pod=e.m.pods[i%2];pod.getWorldPosition(_v);missiles.push(mkMissile(_v.x,_v.y,_v.z,rnd(-6,6),12,rnd(-6,6),false,T,15*dm,i*.1))}}
  else{for(let i=0;i<20;i++)eShoot({x:e.x,y:3,z:e.z},i/20*TAU,20,9*dm,0xffd070,'tracer')}break}
 case'hammer':{e.pat=(e.pat+1)%4;
  if(e.pat==0)e.burst={n:24,int:.05,t:0,fn:()=>{const q=emz(e),tt=Math.hypot(T.x-q.x,T.z-q.z)/46;eShoot(q,ang(q)+rnd(-.08,.08),46,6*dm,0xffd070,'tracer',(2.5-q.y)/Math.max(.2,tt));SFX.rotary()}};
  else if(e.pat==1){for(let i=0;i<10;i++){const pod=e.m.pods[i%2];pod.getWorldPosition(_v);missiles.push(mkMissile(_v.x,_v.y,_v.z,rnd(-5,5),-3,rnd(-5,5),false,T,15*dm,i*.12))}}
  else if(e.pat==2){banner('TROOPS DEPLOYED','The Hammer dropped a seizure team','#ff6a5a');for(let i=0;i<4;i++)spawn(i<3?'soldier':'riot',{x:clamp(e.x+rnd(-8,8),-ARENA+4,ARENA-4),z:clamp(e.z+rnd(-8,8),-ARENA+4,ARENA-4)})}
  else{const p=emz(e),s=eShoot(p,ang(p),30,10*dm,0x9cc9ff,'orb',(2.5-p.y)/Math.max(.2,Math.hypot(T.x-p.x,T.z-p.z)/30));s.emp=1;s.splash=5;s.r=.8;SFX.laser()}break}
 case'raider':{const p=emz(e);eShoot(p,ang(p)+rnd(-.05,.05),30,9*dm);SFX.bolt();break}
 case'bearer':{const p=emz(e);for(let i=-2;i<=2;i++)eShoot(p,ang(p)+i*.12,26,7*dm);SFX.bolt();break}
 case'jugg':{const p=emz(e),a=ang(p);for(let i=-1;i<=1;i++)eShoot(p,a+i*.16,26,12*dm);if(Math.random()<.35)for(const pod of e.m.pods){pod.getWorldPosition(_v);missiles.push(mkMissile(_v.x,_v.y,_v.z,rnd(-4,4),10,rnd(-4,4),false,T,14*dm))}break}
 case'gunship':{e.burst={n:4,int:.13,t:0,fn:()=>{const p=emz(e),tt=Math.hypot(T.x-p.x,T.z-p.z)/30;eShoot(p,ang(p)+rnd(-.06,.06),30,8*dm,0xff5020,'bolt',(2.5-p.y)/Math.max(.2,tt));SFX.bolt()}};break}
 case'sniper':{if(!segBlocked(e.x,e.z,T.x,T.z,2.5)){e.aimT=1.5;e.aimTgt=T;e.laser=beamMesh(0xff2020,.5);SFX.laser()}else e.fcd=1;break}
 case'warlord_old':{e.pat=(e.pat+1)%4;const c={x:e.x,y:4.5,z:e.z};
  if(e.pat==0)for(let i=0;i<22;i++)eShoot(c,i/22*TAU+e.lvl,17,11*dm);
  else if(e.pat==1){const p=emz(e),a=ang(p);for(let i=-3;i<=3;i++)eShoot(p,a+i*.11,32,13*dm,0xff6a20)}
  else if(e.pat==2){for(let i=0;i<6;i++){const pod=e.m.pods[i%2];pod.getWorldPosition(_v);missiles.push(mkMissile(_v.x,_v.y,_v.z,rnd(-6,6),12,rnd(-6,6),false,T,15*dm,i*.12))}}
  else if(dd<16){ring(e.x,e.z,0xff3b2e,2,16,.5);sprite(e.x,1,e.z,0xff5a2a,4,16,.4);G.shake=.9;SFX.boom(.25);friendlyHit(e.x,e.z,14,26*dm);if(!P.dead&&d2(P,e)<256){P.vx+=(P.x-e.x)/dd*40;P.vz+=(P.z-e.z)/dd*40}}else e.fcd=.2;break}
 case'spider':{e.pat=(e.pat+1)%4;const a=Math.atan2(T.x-e.x,T.z-e.z);
  if(e.pat==0){e.sweep={t:2.2,a0:a+1.1,a1:a-1.1,b:beamMesh(0xff2020,.9)};SFX.laser()}
  else if(e.pat==1){for(let i=0;i<5;i++){const x=clamp(lerp(e.x,T.x,rnd(.3,.9))+rnd(-6,6),-ARENA+2,ARENA-2),z=clamp(lerp(e.z,T.z,rnd(.3,.9))+rnd(-6,6),-ARENA+2,ARENA-2),mesh=new THREE.Group();part(cyl(.6,.8,.4,10),paintMats('enemy').dark,0,.2,0,mesh);part(sph(.25,8),glow(0xff2020,4),0,.5,0,mesh);mesh.position.set(x,0,z);scene.add(mesh);mines.push({mesh,x,z,t:9,arm:1,dmg:24*dm})}}
  else if(e.pat==2){e.charge=1.1;e.cx=Math.sin(a);e.cz=Math.cos(a);SFX.boost()}
  else{const p=emz(e),aa=ang(p);for(let i=-3;i<=3;i++)eShoot(p,aa+i*.1,30,12*dm,0xff6a20)}break}
 case'battery':{e.pat=(e.pat+1)%3;
  if(e.pat==0){if(e.m.mortar){e.m.mortar.getWorldPosition(_v);sprite(_v.x,_v.y,_v.z,0xff6a20,3,8,.4);smoke(_v.x,_v.y,_v.z,6,1.5)}SFX.fission();for(let i=0;i<7;i++){const x=clamp(T.x+(i?rnd(-9,9):0),-ARENA+2,ARENA-2),z=clamp(T.z+(i?rnd(-9,9):0),-ARENA+2,ARENA-2),mesh=new THREE.Mesh(geo('ring',()=>new THREE.RingGeometry(.86,1,64)),addMat(0xff3020,.8));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.12,z);mesh.scale.setScalar(4.5);scene.add(mesh);marks.push({mesh,x,z,t:1.6+i*.08,r:4.5,dmg:26*dm})}}
  else if(e.pat==1){const p=emz(e),aa=ang(p);for(let i=-4;i<=4;i++)eShoot(p,aa+i*.09,28,12*dm,0xff6a20)}
  else for(let i=0;i<8;i++){const pod=e.m.pods[i%2];pod.getWorldPosition(_v);missiles.push(mkMissile(_v.x,_v.y,_v.z,rnd(-6,6),12,rnd(-6,6),false,T,14*dm,i*.1))}break}
 case'rival':{e.pat=(e.pat+1)%4;
  if(e.pat==0)e.burst={n:14,int:.08,t:0,fn:()=>{const p=emz(e);eShoot(p,ang(p)+rnd(-.06,.06),36,6*dm,0xff5020,'tracer');SFX.rotary()}};
  else if(e.pat==1){e.charge=.35;const a=ang(e)+Math.PI/2*e.side;e.cx=Math.sin(a);e.cz=Math.cos(a);e.side*=-1;SFX.boost();setTimeout(()=>{if(e.dead)return;const p=emz(e),aa=ang(p);for(let i=-2;i<=2;i++)eShoot(p,aa+i*.12,30,10*dm,0xff6a20)},380)}
  else if(e.pat==2){for(let i=0;i<8;i++){const pod=e.m.pods[i%2]||e.m.pods[0];if(!pod)break;pod.getWorldPosition(_v);missiles.push(mkMissile(_v.x,_v.y,_v.z,rnd(-6,6),12,rnd(-6,6),false,T,13*dm,i*.08))}}
  else if(dd<16){ring(e.x,e.z,0xff3b2e,2,15,.5);flash(e.x,4,e.z,0xff3020,900,.4);G.shake=.7;SFX.boom(.2);friendlyHit(e.x,e.z,13,28*dm)}else e.fcd=.2;break}}}
function updEnemy(e,dt){const d=ET[e.type],m=e.m;if(e.pvp)return;if(CH.freeze&&!e.net&&!e.fin)return;if(e.net){netEnemyMove(e,dt);return}
 if(e.fin>0){e.fin-=dt;e.x+=Math.sin(e.finA)*dt*14;e.z+=Math.cos(e.finA)*dt*14;const y=Math.sin((1-e.fin/.9)*Math.PI)*9;m.root.position.set(e.x,y,e.z);m.root.rotation.x+=dt*9;m.root.rotation.z+=dt*5;if(e.fin<=0){explode(e.x,1,e.z,1.6,0xffa040);G.shake=.7;SFX.boom(.2);for(const o of enemies)if(o!==e&&live(o)&&d2(o,e)<64)hitEnemy(o,120*dmgMul());hitEnemy(e,1e7)}return}
 if(m.mats.own){const em=m.mats.armor.emissive;if(m.mats.armorV)queueMicrotask(()=>m.mats.armorV.emissive.copy(em));if(e.flash>0){e.flash-=dt;em.setRGB(1,1,1)}else if(e.poison>0)em.setRGB(.05,.3,.02);else if(e.burn>0)em.setRGB(.35,.08,0);else if(e.stun>0)em.setRGB(.15,.2,.4);else em.setRGB(0,0,0)}
 if(e.drop>0){e.drop-=dt;const y=e.drop>0?36*Math.pow(e.drop/1.3,2):0;m.root.position.set(e.x,y,e.z);FX.emit(e.x+rnd(-1,1),y+.5,e.z+rnd(-1,1),rnd(-2,2),-14,rnd(-2,2),.3,1.4,3,1.2,.4,1);
  if(e.drop<=0){ring(e.x,e.z,0xff6a2a,1,d.boss?14:6,.45);smoke(e.x,.5,e.z,8,1.2,.15);G.shake=Math.max(G.shake,.2+(d.boss?.9:0));SFX.boom(.08)}return}
 if(e.poison>0){e.poison-=dt;hitEnemy(e,e.pdps*dt*dmgMul());if(Math.random()<.3)FX.emit(e.x,e.y+rnd(1,4),e.z,0,2,0,.6,.6,.6,3,.4,1)}
 if(e.burn>0){e.burn-=dt;hitEnemy(e,10*dt*dmgMul());if(Math.random()<.5)FX.emit(e.x+rnd(-1,1),e.y+rnd(1,4),e.z+rnd(-1,1),0,3,0,.5,.8,3,1.2,.2,1)}
 if(e.acc>0&&(e.accT-=dt)<=0){dmgNum(e.x,eHeight(e)+2,e.z,e.acc,e.poison>0?'#a8ff4a':e.burn>0?'#ffa040':'#ffffff',e.acc>99);e.acc=0;e.accT=.22}
 if(e.dead)return;if(e.slow>0)e.slow-=dt;if((e.tgtT-=dt)<=0){e.tgtT=1.5;e.tgt=pickTarget(e)}const T=e.tgt&&!e.tgt.dead&&!e.tgt.arrived?e.tgt:P;
 for(const h of W.hazards)if(h.type=='fire'&&!d.fly&&d2(h,e)<h.r*h.r)e.burn=Math.max(e.burn,1);
 const dx=T.x-e.x,dz=T.z-e.z,dd=Math.hypot(dx,dz)||1,ux=dx/dd,uz=dz/dd;let mx=0,mz=0,spd=e.spd*(e.slow>0?.5:1);
 if(e.stun>0){e.stun-=dt;if(Math.random()<.3)sparks(e.x,eHeight(e),e.z,0xa9d0ff,1,6,.3)}
 else if(e.charge>0){e.charge-=dt;mx=e.cx;mz=e.cz;spd=e.type=='spider'?24:30;FX.emit(e.x,1,e.z,rnd(-2,2),2,rnd(-2,2),.4,2,3,.8,.3,1);if(!P.dead&&d2(e,P)<(e.r+2.4)**2&&!e.hitP){e.hitP=1;hurt(30);P.vx+=e.cx*30;P.vz+=e.cz*30}if(e.charge<=0)e.hitP=0}
 else if(e.aimT>0||e.sweep){}
 else if(e.type=='drone'){mx=ux;mz=uz}
 else if(e.type=='heli'||e.type=='hammer'||e.type=='jeep'){e.orb+=dt*(e.type=='jeep'?.6:.45)*e.side;const R2=e.type=='hammer'?28:e.type=='jeep'?18:22,tx=T.x+Math.sin(e.orb)*R2-e.x,tz=T.z+Math.cos(e.orb)*R2-e.z,l=Math.hypot(tx,tz)||1;mx=tx/l;mz=tz/l;if(l<2)mx=mz=0}
 else{const R=d.range;if(dd>R){mx=ux;mz=uz}else if(dd<R*.5){mx=-ux;mz=-uz}else{mx=-uz*e.side*.75;mz=ux*e.side*.75;if(Math.random()<dt*.3)e.side*=-1}}
 e.x+=mx*spd*dt;e.z+=mz*spd*dt;if(!d.fly&&e.type!='drone')pushOut(e,e.r);else{e.x=clamp(e.x,-ARENA-30,ARENA+30);e.z=clamp(e.z,-ARENA-30,ARENA+30)}
 e.aimYaw=lerpA(e.aimYaw,Math.atan2(dx,dz),1-Math.exp(-dt*(e.sweep?0:5)));if(mx||mz)e.yaw=lerpA(e.yaw,Math.atan2(mx,mz),1-Math.exp(-dt*6));
 if(e.burst){e.burst.t-=dt;if(e.burst.t<=0){e.burst.fn();e.burst.n--;e.burst.t=e.burst.int;if(e.burst.n<=0)e.burst=null}}
 else if(e.stun<=0&&d.fire&&e.aimT<=0&&!e.sweep&&e.charge<=0&&(e.fcd-=dt)<=0&&dd<d.range+20){e.fcd=d.fire*rnd(.85,1.2);attack(e,T,dd)}
 if(e.aimT>0){e.aimT-=dt;m.root.updateMatrixWorld(true);const p=emz(e),A=e.aimTgt&&!e.aimTgt.dead?e.aimTgt:P,tgt={x:A.x,y:2.8,z:A.z};placeBeam(e.laser,p,tgt,.05+(1.5-e.aimT)*.03);
  if(e.aimT<=0){scene.remove(e.laser);e.laser.material.dispose();e.laser=null;const bl=segBlocked(p.x,p.z,tgt.x,tgt.z,2.5);if(bl){damageCover(bl.c,60);beam(p,{x:lerp(p.x,tgt.x,bl.t),y:p.y,z:lerp(p.z,tgt.z,bl.t)},0xff3020,.3,.25)}else{beam(p,tgt,0xff3020,.35,.3);if(A===P)hurt(32*(1+e.lvl*.06));else if(A.isObj)objDamage(A,40)}SFX.rail();e.fcd=d.fire}}
 if(e.sweep){const s=e.sweep;s.t-=dt;const a=lerp(s.a1,s.a0,Math.max(0,s.t)/2.2);m.root.updateMatrixWorld(true);const p=emz(e),end={x:p.x+Math.sin(a)*44,y:.5,z:p.z+Math.cos(a)*44},bl=segBlocked(p.x,p.z,end.x,end.z,2);if(bl){end.x=lerp(p.x,end.x,bl.t);end.z=lerp(p.z,end.z,bl.t)}placeBeam(s.b,p,end,.35);e.aimYaw=a;
  if(Math.random()<.5)sparks(end.x,.5,end.z,0xff4020,2,8,.3);const L=Math.hypot(end.x-p.x,end.z-p.z);for(const t of[P,...objs.filter(o=>o.friendly&&!o.dead)]){if(t===P&&P.dead)continue;const vx=t.x-p.x,vz=t.z-p.z,tt=vx*Math.sin(a)+vz*Math.cos(a);if(tt<0||tt>L)continue;const px=vx-Math.sin(a)*tt,pz=vz-Math.cos(a)*tt;if(px*px+pz*pz<(t===P?2.4:t.r)**2){if(t===P)hurt(50*dt);else objDamage(t,60*dt)}}
  if(s.t<=0){scene.remove(s.b);s.b.material.dispose();e.sweep=null}}
 if(e.type=='apc'&&(e.depT-=dt)<=0&&enemies.length<22&&dd<70){e.depT=rnd(9,13);for(let i=0;i<3;i++)spawn(i?'soldier':'rocket',{x:clamp(e.x-Math.sin(e.yaw)*5+rnd(-2,2),-ARENA+4,ARENA-4),z:clamp(e.z-Math.cos(e.yaw)*5+rnd(-2,2),-ARENA+4,ARENA-4)})}
 if(d.inf&&!P.dead&&!P.sky&&d2(e,P)<(e.r+2.3)**2){sparks(e.x,1,e.z,0x8a2a20,10,6,.35);SFX.hit();killEnemy(e);return}
 if(d.veh&&!P.dead&&P.spd>28&&d2(e,P)<(e.r+2.6)**2&&(e.ramT-=dt)<=0){e.ramT=.6;hitEnemy(e,(e.boss?60:120)*dmgMul());sparks(e.x,2,e.z,0xffb040,16,14);G.shake=.6;SFX.boom(.15);banner('RAMMED','','#ffc23a')}
 if(d.touch&&dd<e.r+2.1&&T===P){hurt(d.touch*(1+e.lvl*.04)*(e.type=='drone'?1:dt*3));if(e.type=='drone'){e.hp=0;killEnemy(e);return}}
 if(e.type=='drone'){for(const o of objs)if(o.friendly&&!o.dead&&d2(o,e)<(o.r+1.5)**2){objDamage(o,30);e.hp=0;killEnemy(e);return}}
 if(m.mil){const fl=!!d.fly;e.y=fl?d.fly+Math.sin(performance.now()*.002+e.x)*.6:0;m.root.position.set(e.x,e.y,e.z);if(m.inf){m.root.rotation.y=e.aimYaw}else if(m.heli){m.root.rotation.y=e.aimYaw;m.body.rotation.x=.12;m.body.rotation.z=-mx*.15}else{m.root.rotation.y=e.yaw;if(m.tur)m.tur.rotation.y=e.aimYaw-e.yaw}
  animMil(m,mx||mz?spd:0,dt);if(m.veh&&(mx||mz)&&Math.random()<.2)SMOKE.emit(e.x-Math.sin(e.yaw)*3*m.scale,.5,e.z-Math.cos(e.yaw)*3*m.scale,0,1,0,1,1.4,.25,.22,.2,.4,-.3,1.5)}
 else if(m.drone||m.gunship){e.y=(d.fly||3.2)+Math.sin(performance.now()*.004+e.x)*.4;m.root.position.set(e.x,e.y,e.z);m.root.rotation.y=e.aimYaw;m.body.rotation.x=.2;m.body.rotation.z=mx*.2;animMech(m,0,dt)}
 else{m.root.position.set(e.x,0,e.z);if(m.spider){m.root.rotation.y=e.yaw;m.tur.rotation.y=e.aimYaw-e.yaw;animMech(m,mx||mz?spd:0,dt)}else{m.root.rotation.y=e.yaw;m.torso.rotation.y=e.aimYaw-e.yaw;m.spinV=lerp(m.spinV,e.burst||e.fcd<.6?22:2,dt*4);animMech(m,e.stun>0?0:spd*(mx||mz?1:0),dt)}}
 if(e.bar)updBar(e.bar,e.x,eHeight(e)+(e.type=='drone'?1.5:3*(m.scale||1)),e.z,e.hp/e.max)}

/* ================= main update ================= */
function bulletBlocked(s,e){if(e.type!='riot'||e.stun>0)return false;return angDiff(Math.atan2(-s.vx,-s.vz),e.aimYaw)<1.05}
function update(dt,rdt){adminTick(dt);if(finRT>0&&(finRT-=rdt)<=0&&!killCam)G.timeScale=1;updFX(dt);FX.update(dt);SMOKE.update(dt);updNums(rdt);updateWorld(dt,camT.x,camT.z,P?P.x:0,P?P.z:0,state=='play'&&!!S);
 if(banT>0&&(banT-=rdt)<=0)$('banner').classList.remove('show');if(vigT>0&&(vigT-=rdt)<=0)$('vig').style.opacity=0;
 if(state=='menu'||state=='loading'){animMech(P.m,0,dt);P.m.spinV=3;P.m.torso.rotation.y=Math.sin(performance.now()*.0007)*.35;return}
 if(state=='shop'||state=='over')return;S.time+=dt;if(S.comboT>0&&(S.comboT-=dt)<=0)S.combo=0;
 if(state=='dying'){if(Math.random()<.3)smoke(P.x,1,P.z,1,1.5);if((stateT-=rdt)<=0)return finishRun(false)}
 if(state=='won'&&(stateT-=rdt)<=0)return finishRun(true);
 if(state=='clear'&&(stateT-=dt)<=0){if(S.kind=='campaign'||S.kind=='coop')nextWave();else openShop();return}
 if(state!='dying')updPlayer(dt);
 if(state=='play'&&!S.netGuest&&S.kind!='pvp'){if(S.spawnQ.length&&enemies.length<22&&(S.spawnT-=dt)<=0){spawn(S.spawnQ.shift());S.spawnT=Math.max(.35,1.3-S.wave*.07)}
  if(S.cont&&enemies.length<S.cap&&(S.contT-=dt)<=0){spawn(pickType(S.lvl));S.contT=rnd(1.6,3.2)/(1+S.lvl*.04)}}
 for(const e of enemies)updEnemy(e,dt);
 for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++){const a=enemies[i],b=enemies[j];if(a.drop>0||b.drop>0||!!ET[a.type].fly!==!!ET[b.type].fly)continue;const dx=b.x-a.x,dz=b.z-a.z,dd=Math.hypot(dx,dz)||1,mn=a.r+b.r;if(dd<mn){const o=(mn-dd)/2;a.x-=dx/dd*o;a.z-=dz/dd*o;b.x+=dx/dd*o;b.z+=dz/dd*o}}
 for(let i=enemies.length-1;i>=0;i--)if(enemies[i].dead)enemies.splice(i,1);
 updObjs(dt);if(S.pois)updPOIs(dt);
 for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.life-=dt;s.x+=s.vx*dt;s.z+=s.vz*dt;s.y=Math.max(.6,s.y+s.vy*dt);s.mesh.position.set(s.x,s.y,s.z);let hit=false;
  if(s.kind=='orb')FX.emit(s.x,s.y,s.z,rnd(-1,1),rnd(-1,1),rnd(-1,1),.3,1,...hexRGB(s.col).map(v=>v*2.5),1);if(s.kind=='ember'&&Math.random()<.5)FX.emit(s.x,s.y,s.z,0,1,0,.2,.6,3,1.2,.3,1);
  const c=blockHit(s.x,s.z,s.y,s.r*.5);if(c&&!(s.f&&c.team)){damageCover(c,s.dmg*(s.f?1:.4));hit=true}
  else if(s.vis){}
  else if(s.f){for(const t of hostiles()){if((s.x-t.x)**2+(s.z-t.z)**2<(t.r+s.r)**2){if(!t.isObj&&bulletBlocked(s,t)){sparks(s.x,s.y,s.z,0xff5040,5,8,.3);SFX.hit()}else hitT(t,s.dmg,s);hit=true;break}}}
  else{if(!P.dead&&(s.x-P.x)**2+(s.z-P.z)**2<(2.1+s.r)**2&&s.y<P.y+8){hurt(s.dmg);hit=true}else for(const o of objs)if(o.friendly&&!o.dead&&(s.x-o.x)**2+(s.z-o.z)**2<(o.r+s.r)**2){objDamage(o,s.dmg);hit=true;break}if(!hit&&netProxyHit(s.x,s.z,s.y,2.1+s.r,s.dmg))hit=true}
  if(hit||s.life<=0){if(s.emp&&!s.f&&!P.dead&&(s.x-P.x)**2+(s.z-P.z)**2<(s.splash+2)**2){P.jam=3;SFX.laser();say('Systems jammed.')}if(s.splash){splash(s.x,s.y,s.z,s.splash,s.dmg*.6,s.col,s.splash/5,s.f);if(s.f&&(s.burn||s.poison))for(const e of enemies)if(live(e)&&(e.x-s.x)**2+(e.z-s.z)**2<(s.splash+e.r)**2){if(s.burn)e.burn=4;if(s.poison){e.poison=Math.max(e.poison,3);e.pdps=Math.max(e.pdps,s.poison)}}if(s.cluster){const x0=s.x,z0=s.z,dmg=s.dmg*.5,col=s.col;for(let k=0;k<5;k++)setTimeout(()=>{if(S&&!S.ended)splash(x0+rnd(-6,6),1,z0+rnd(-6,6),3,dmg,col,.6)},120+k*90)}}else if(hit)sparks(s.x,s.y,s.z,s.col,5,9,.3);scene.remove(s.mesh);shots.splice(i,1)}}
 for(let i=missiles.length-1;i>=0;i--){const m=missiles[i];m.age+=dt;if(m.age<0)continue;m.mesh.visible=true;m.life-=dt;let tx,ty=2.5,tz;
  if(m.f){if(!m.tg||m.tg.dead)m.tg=nearest(m.x,m.z);if(m.tg){tx=m.tg.x;tz=m.tg.z;ty=m.tg.isObj?4:eHeight(m.tg)}else{tx=P.ax;tz=P.az;ty=0}}else{const T=m.tg&&!m.tg.dead?m.tg:P;tx=T.x;tz=T.z;ty=T===P?P.y+2.5:3}
  const dx=tx-m.x,dy=ty-m.y,dz=tz-m.z,dl=Math.hypot(dx,dy,dz)||1,st=Math.min(1,(m.age<.3?.4:m.turn)*dt);m.vx+=(dx/dl*m.sp-m.vx)*st;m.vy+=(dy/dl*m.sp-m.vy)*st;m.vz+=(dz/dl*m.sp-m.vz)*st;
  if(m.age<.3)m.vy-=10*dt;m.x+=m.vx*dt;m.y+=m.vy*dt;m.z+=m.vz*dt;m.mesh.position.set(m.x,m.y,m.z);_v.set(m.x+m.vx,m.y+m.vy,m.z+m.vz);m.mesh.lookAt(_v);
  SMOKE.emit(m.x,m.y,m.z,rnd(-.5,.5),rnd(-.5,.5),rnd(-.5,.5),.8,.9,.35,.35,.37,.5,-.5,1.5);FX.emit(m.x,m.y,m.z,0,0,0,.08,.9,3,1.5,.4,1);
  let boom=m.life<=0||m.y<.3||!!blockHit(m.x,m.z,m.y);if(!boom){if(m.f)boom=hostiles().some(e=>(m.x-e.x)**2+(m.z-e.z)**2<(e.r+.8)**2&&m.y<(e.isObj?8:eHeight(e)+4));else boom=(!P.dead&&(m.x-P.x)**2+(m.z-P.z)**2<6&&m.y<P.y+7)||objs.some(o=>o.friendly&&!o.dead&&d2(o,m)<o.r*o.r)||netNear(m.x,m.z,6)}
  if(boom){if(m.f){splash(m.x,m.y,m.z,4,m.dmg,m.poison?0x9dff3a:0xffa040,.7);if(m.poison)affect(m.x,m.z,5,0,m.poison)}else splash(m.x,m.y,m.z,4,m.dmg,0xff4030,.7,false);scene.remove(m.mesh);missiles.splice(i,1)}}
 for(let i=clouds.length-1;i>=0;i--){const c=clouds[i];c.t-=dt;c.mesh.material.opacity=.35*Math.min(1,c.t);for(let k=0;k<3;k++){const a=rnd(0,TAU),r=Math.sqrt(Math.random())*c.r,g=Math.random()<.5;FX.emit(c.x+Math.cos(a)*r,.3,c.z+Math.sin(a)*r,0,rnd(1,3),0,1.2,rnd(1,2.5),g?.6:1.2,g?2.2:.4,g?.3:1.6,.7)}
  for(const e of enemies)if(live(e)&&d2(e,c)<(c.r+e.r)**2){hitEnemy(e,50*dt*dmgMul());e.slow=.3;e.poison=Math.max(e.poison,1.5);e.pdps=Math.max(e.pdps,8)}if(c.t<=0){scene.remove(c.mesh);c.mesh.material.dispose();clouds.splice(i,1)}}
 for(let i=pickups.length-1;i>=0;i--){const k=pickups[i];k.t-=dt;k.mesh.rotation.y+=dt*2;k.mesh.position.y=1.8+Math.sin(performance.now()*.004)*.3;k.mesh.visible=k.t>3||Math.sin(k.t*20)>0;
  if(!P.dead&&d2(k,P)<9){P.hp=Math.min(P.max,P.hp+P.max*.25);sparks(k.x,2,k.z,0xffc040,16,10);SFX.level();k.t=0}if(k.t<=0){scene.remove(k.mesh);pickups.splice(i,1)}}
 for(let i=mines.length-1;i>=0;i--){const k=mines[i];k.t-=dt;k.arm-=dt;k.mesh.children[1].visible=Math.sin(k.t*(k.t<2?30:10))>0;const trig=k.f?(k.arm<=0&&enemies.some(e=>live(e)&&!ET[e.type].fly&&d2(e,k)<(e.r+2.5)**2)):(k.arm<=0&&!P.dead&&d2(k,P)<12);if(trig||k.t<=0){splash(k.x,1,k.z,5,k.dmg,k.f?P.glow:0xff4020,.8,!!k.f);if(k.f&&(k.burn||k.poison))affect(k.x,k.z,6,k.burn?4:0,k.poison||0);scene.remove(k.mesh);mines.splice(i,1)}}
 for(let i=marks.length-1;i>=0;i--){const k=marks[i];k.t-=dt;k.mesh.material.opacity=.4+.5*Math.abs(Math.sin(k.t*12));if(k.t<=0){scene.remove(k.mesh);k.mesh.material.dispose();marks.splice(i,1);splash(k.x,1,k.z,k.r,k.dmg,0xff6a20,1,false)}}
 updSpecial(dt);
 if(S.boss&&!S.boss.dead)$('bossFill').style.width=Math.max(0,S.boss.hp/S.boss.max*100)+'%';else $('bossP').classList.add('hide');
 if(S.obj)missionCheck(dt);else if(S.kind!='open'&&S.kind!='pvp'&&!S.netGuest&&state=='play'&&!S.spawnQ.length&&!enemies.length&&S.wave>0)endWave();
 AU.level=S.boss?2:1}

/* ================= camera & hud ================= */
function updCamera(rdt){const k=1-Math.exp(-rdt*5);{const f=48+(P&&S&&!P.dead?clamp(((P.spd||0)-12)/68,0,1)*20:0);if(Math.abs(camera.fov-f)>.1){camera.fov=lerp(camera.fov,f,1-Math.exp(-rdt*4));camera.updateProjectionMatrix()}}
 if(state=='menu'||state=='loading'||!S){menuA+=rdt*.22;const r=clamp(15/Math.min(1,camera.aspect*1.25),15,30);camera.position.set(Math.sin(menuA)*r,5.6+Math.sin(menuA*.7),Math.cos(menuA)*r);camera.lookAt(0,stage.clientWidth<820?3:4,0);camT.set(0,0,0)}
 else if(killCam){killCam.a+=rdt*.5;camera.position.set(killCam.x+Math.sin(killCam.a)*18,8,killCam.z+Math.cos(killCam.a)*18);camera.lookAt(killCam.x,3,killCam.z);camT.set(killCam.x,0,killCam.z)}
 else if(camMode=='pilot'){const fx=Math.sin(camYaw),fz=Math.cos(camYaw),rx=-Math.cos(camYaw),rz=Math.sin(camYaw),cp=Math.cos(camPitch),spn=Math.sin(camPitch);if(cock){camera.position.set(P.x+fx*1.4,P.y+7.6,P.z+fz*1.4)}else{_v.set(P.x-fx*12+rx*2.6,P.y+7+camPitch*3,P.z-fz*12+rz*2.6);camera.position.lerp(_v,1-Math.exp(-rdt*14))}
  camera.lookAt(camera.position.x+fx*cp*20,camera.position.y-spn*20,camera.position.z+fz*cp*20);camT.set(P.x,0,P.z)}
 else{const lx=clamp((P.ax-P.x)*.22,-9,9),lz=clamp((P.az-P.z)*.22,-9,9);_v.set(P.x+lx,0,P.z+lz);camT.lerp(_v,k);const z=S.boss?1.18:1;camera.position.set(camT.x,30*z+P.y*.5,camT.z+21*z);camera.lookAt(camT.x,2+P.y*.4,camT.z)}
 if(G.shake){camera.position.x+=rnd(-1,1)*G.shake;camera.position.y+=rnd(-1,1)*G.shake;camera.position.z+=rnd(-1,1)*G.shake}G.shake*=Math.exp(-rdt*6);if(G.shake<.01)G.shake=0;
 skyFollow(camera.position);placeSun(camT.x,camT.z)}
let hudF=0;const mini=$('mini'),mctx=mini.getContext('2d');
function drawMini(){const c=mctx,S=200,Rr=170,k=S/2/Rr,cx=S/2,cy=S/2,tx=x=>cx+(x-P.x)*k,ty=z=>cy+(z-P.z)*k;c.clearRect(0,0,S,S);c.save();c.beginPath();c.arc(cx,cy,S/2-1,0,TAU);c.clip();c.fillStyle='rgba(8,11,16,.85)';c.fillRect(0,0,S,S);
 c.strokeStyle='rgba(255,255,255,.08)';c.lineWidth=1;for(let i=-4;i<=4;i++){c.beginPath();c.moveTo(cx+i*25,0);c.lineTo(cx+i*25,S);c.moveTo(0,cy+i*25);c.lineTo(S,cy+i*25);c.stroke()}
 let n=0;for(const o of coversNear(P.x,P.z,Rr)){if(n++>500)break;c.fillStyle=o.solid?'#4a5466':o.team?cssHex(P.glow):'#2e3540';c.fillRect(tx(o.x)-o.w*k/2,ty(o.z)-o.d*k/2,Math.max(1.5,o.w*k),Math.max(1.5,o.d*k))}
 c.strokeStyle='#ffa040';c.lineWidth=2;c.strokeRect(tx(-ARENA),ty(-ARENA),ARENA*2*k,ARENA*2*k);
 for(const h of W.hazards)if(Math.abs(h.x-P.x)<Rr&&Math.abs(h.z-P.z)<Rr){c.fillStyle='rgba(255,90,20,.7)';c.beginPath();c.arc(tx(h.x),ty(h.z),h.r*k+1,0,TAU);c.fill()}
 const dot=(x,z,r,col)=>{let X=tx(x),Y=ty(z);const dx=X-cx,dy=Y-cy,d=Math.hypot(dx,dy),m=S/2-6;if(d>m){X=cx+dx/d*m;Y=cy+dy/d*m}c.fillStyle=col;c.beginPath();c.arc(X,Y,r,0,TAU);c.fill()};
 for(const o of objs)if(!o.dead&&(!o.outpost||Math.abs(o.x-P.x)<Rr*1.6&&Math.abs(o.z-P.z)<Rr*1.6))dot(o.x,o.z,o.outpost?5:4,o.hostile?'#ffb020':'#5cff78');if(S.pois){for(const d of S.pois.drops)if(d.t<=0&&Math.abs(d.x-P.x)<Rr*1.6&&Math.abs(d.z-P.z)<Rr*1.6)dot(d.x,d.z,4,'#40e0ff');for(const L of S.pois.lairs)if(!L.done&&Math.abs(L.x-P.x)<Rr*2&&Math.abs(L.z-P.z)<Rr*2)dot(L.x,L.z,6,'#ff2a18');for(const q of quests().q)if(q.k=='recon'&&!q.done)dot(q.x,q.z,6,'#5cff78');for(const o of S.pois.cap)dot(o.x,o.z,5,'#5cff78')}if(S.ev)dot(S.ev.x,S.ev.z,6,'#d58cff');if(S.base&&!S.base.off)dot(S.base.x,S.base.z,7,'#31c4ff');for(const v of S.parked||[])dot(v.x,v.z,3,'#9cff9c');if(S.obj?.cps&&S.obj.cps[S.obj.i])dot(S.obj.cps[S.obj.i].x,S.obj.cps[S.obj.i].z,6,'#40e0ff');for(const k2 of pickups)dot(k2.x,k2.z,3,'#ffc040');for(const e of enemies)if(!e.dead)dot(e.x,e.z,e.boss?6:3,e.boss?'#ff2a18':'#ff5a4a');
 c.restore();c.save();c.translate(cx,cy);c.rotate(-P.aimYaw+Math.PI);c.fillStyle='#fff';c.beginPath();c.moveTo(0,-8);c.lineTo(5,6);c.lineTo(0,3);c.lineTo(-5,6);c.closePath();c.fill();c.restore();
 c.strokeStyle=cssHex(P.glow);c.lineWidth=2;c.beginPath();c.arc(cx,cy,S/2-1,0,TAU);c.stroke();$('miniTxt').textContent=`${Math.round(P.x)} m E · ${Math.round(-P.z)} m N`}
function updHud(){if(!P||!S||(hudF++)%2)return;if(hudF%6==1)drawMini();$('hpFill').style.width=(P.hp/P.max*100)+'%';$('hpTxt').textContent=`${Math.ceil(P.hp)} / ${Math.round(P.max)}`;$('hLv').textContent='Lv '+P.lv;
 $('wTxt').textContent=S.mission?S.mission.n.toUpperCase():S.kind=='coop'?`CO-OP · LEVEL ${S.wave} · ${NET.remotes.size+1} PILOTS`:S.kind=='pvp'?`DUEL · ${NET.kills} – ${NET.deaths} · FIRST TO 5`:S.kind=='open'?'OPEN WORLD '+'★'.repeat(S.stars||0)+'☆'.repeat(5-(S.stars||0)):S.obj&&!S.mission?S.obj.title.toUpperCase()+(S.kind=='defense'?' · LEVEL '+S.wave:''):(S.kind=='daily'?'DAILY · ':'')+'LEVEL '+S.wave;$('sTxt').textContent=`Score ${S.score.toLocaleString()} · Scrap ${S.scrap} · Hostiles ${enemies.length+S.spawnQ.length}${autoFire?' · AUTO':''}`;
 const mult=Math.min(8,1+Math.floor(S.combo/5));$('combo').classList.toggle('show',S.combo>=3);$('combo').innerHTML=`<b>${S.combo}</b> COMBO <i>x${mult}</i>`;
 const ot=objText();$('objP').classList.toggle('hide',!ot);if(ot){$('objTxt').textContent=ot[0];$('objFill').style.width=clamp(ot[1],0,1)*100+'%'}
 const ab=[[$('abBoost'),P.bch>0?0:P.bcd/(2.4*(1-.15*S.up.boost)),P.bT>0,P.pk.boost>1?`×${P.bch}`:null],[$('abMsl'),P.mcd/8,false],[$('abAbil'),P.acd/(P.t.cd*(1-.12*S.up.abil-P.pk.abil)),P.abT>0||P.rushT>0||!!P.sky],[$('abOver'),P.ocd/30,P.ocT>0],[$('abUtil'),P.ucd/(UTILS[P.load.U].cd*(1-P.pk.abil)),P.healT>0],[$('abMass'),1-S.md/100,!!(special.orb||special.bh||special.nuke)]];$('abMass').querySelector('span').textContent=S.md>=100?'X · READY':`X · ${S.md|0}%`;
 for(const[el,f,on,extra]of ab){el.firstElementChild.style.height=clamp(f,0,1)*100+'%';el.classList.toggle('ready',f<=0);el.classList.toggle('on',!!on);if(extra!==undefined&&el.dataset.a=='boost')el.querySelector('span').textContent=TOUCH?'':(extra?`SPACE ${extra}`:'SPACE')}
 $('enFill').style.width=P.en/(P.enMax||100)*100+'%';$('abFin').classList.toggle('ready',!!finTarget());$('abBoard').classList.toggle('hide',!(P.av&&P.av.type!='pilot')&&!nearVehicle());$('abBoard').querySelector('b').textContent=P.av&&P.av.type!='pilot'?'EXIT':'BOARD';{const tm=$('avTimer');if(P.av&&P.av.type=='pilot'){tm.classList.remove('hide');tm.textContent=`EJECTED · reach the green drop beacon · ${Math.ceil(P.av.t)} s`}else tm.classList.add('hide')}if(cock){$('ckSpd').textContent=Math.round(P.spd||0);$('ckHp').textContent=Math.round(P.hp/P.max*100);$('ckEn').textContent=Math.round(P.en/(P.enMax||100)*100);$('ckHd').textContent=String(Math.round(((Math.PI-camYaw)*180/Math.PI%360+360)%360)).padStart(3,'0')}$('enFill').classList.toggle('on',!!P.fast);$('jamW').classList.toggle('show',P.jam>0);$('spdT').textContent=Math.round(P.spd||0)+' m/s';
 $('warn').classList.toggle('show',enemies.some(e=>e.aimT>0&&e.aimTgt===P));$('reticle').classList.toggle('lock',!!P.lock)}

/* ================= input ================= */
const cv=renderer.domElement;
cv.addEventListener('pointerdown',e=>{auInit();if(e.pointerType=='touch'){document.body.classList.add('touchmode');const s={id:e.pointerId,ox:e.clientX,oy:e.clientY,x:e.clientX,y:e.clientY};if(e.clientX<stage.clientWidth/2){if(!mStick)mStick=s}else if(!aStick)aStick=s}
 else{mouse.on=true;mouse.x=e.clientX;mouse.y=e.clientY;if(e.button==0)mouse.down=true;if(camMode=='pilot'&&state=='play'&&!locked&&cv.requestPointerLock){try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(_){}}}try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener('pointermove',e=>{if(mStick&&e.pointerId==mStick.id){mStick.x=e.clientX;mStick.y=e.clientY}else if(aStick&&e.pointerId==aStick.id){aStick.x=e.clientX;aStick.y=e.clientY}else if(e.pointerType!='touch'){mouse.on=true;mouse.x=e.clientX;mouse.y=e.clientY}});
addEventListener('mousemove',e=>{if(locked&&camMode=='pilot'){camYaw-=e.movementX*.0028;camPitch=clamp(camPitch+e.movementY*.0022,-.15,.6)}else if(camMode!='pilot')$('reticle').style.transform=`translate(${e.clientX}px,${e.clientY}px)`});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===cv;if(!locked&&camMode=='pilot'&&state=='play'&&!paused)setPause(true)});
const pup=e=>{if(mStick&&e.pointerId==mStick.id)mStick=null;else if(aStick&&e.pointerId==aStick.id)aStick=null;else mouse.down=false};
cv.addEventListener('pointerup',pup);cv.addEventListener('pointercancel',pup);cv.addEventListener('contextmenu',e=>e.preventDefault());
$('mapC').addEventListener('pointerdown',e=>{const r=e.target.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*ARENA*2-ARENA,z=(e.clientY-r.top)/r.height*ARENA*2-ARENA;fastTravel(x,z)});$('mapX').onclick=()=>toggleMap(false);
$('abil').addEventListener('pointerdown',e=>{const b=e.target.closest('.ab');if(b){e.preventDefault();act(b.dataset.a)}});
$('camHint').onclick=()=>toggleCam();
let cheatBuf='';
addEventListener('keydown',e=>{if(e.key&&e.key.length==1){cheatBuf=(cheatBuf+e.key.toLowerCase()).slice(-10);if(cheatBuf.endsWith('adv6789')){cheatBuf='';adminOn();$('cheat').classList.toggle('hide');renderCheat();SFX.level()}}
 K[e.code]=true;const g=state=='play'||state=='clear';if(g&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(state=='menu'){if(e.code=='Enter'&&!e.target.closest?.('button'))startRun(kindOf(modeSel),{arena:arenaSel});return}
 if(e.code=='KeyH'&&!e.repeat){togglePhoto();return}if(e.code=='KeyB'&&!e.repeat)act('board');if(photo){if(e.code=='Space')snapPhoto();if(e.code=='Escape')togglePhoto();return}if(e.code=='KeyT'&&!e.repeat)act('fin');
 if(e.repeat)return;if(e.code=='Space')act('boost');if(e.code=='KeyQ')act('msl');if(e.code=='KeyE')act('abil');if(e.code=='KeyR')act('over');if(e.code=='KeyG')act('util');if(e.code=='KeyX')act('mass');if(e.code=='KeyV'&&g)toggleCam();
 if(e.code=='KeyF'&&g)autoFire=!autoFire;if(e.code=='KeyM')toggleMap();if(e.code=='KeyK'){setMute(!AU.muted);$('tSnd').textContent=AU.muted?'🔇':'🔊'}if(e.code=='KeyC')act('jump');if(e.code=='KeyN')setMusic(!AU.musicOn);if((e.code=='KeyP'||e.code=='Escape')&&g)setPause(!paused)});
addEventListener('keyup',e=>{K[e.code]=false});addEventListener('blur',()=>{for(const k in K)K[k]=false;mouse.down=false;if(state=='play')setPause(true)});

/* ================= cheat panel (secret) ================= */
/* ================= admin panel ================= */
let cTab='player';
function cBtn(k,t,on){return`<button class="btn ghost sm${on?' on':''}" data-c="${k}">${t}</button>`}
function renderCheat(){document.querySelectorAll('.chtabs button').forEach(b=>b.classList.toggle('on',b.dataset.ct==cTab));const inRun=!!S&&state!='menu';let h='';
 if(cTab=='player')h=`<h5>Toggles</h5>${cBtn('god',`God mode: ${CH.god?'ON':'OFF'}`,CH.god)}${cBtn('one',`One-hit kills: ${CH.one?'ON':'OFF'}`,CH.one)}${cBtn('inf',`Infinite energy: ${CH.inf?'ON':'OFF'}`,CH.inf)}${cBtn('nocd',`No cooldowns: ${CH.nocd?'ON':'OFF'}`,CH.nocd)}${cBtn('speed',`Double walk speed: ${CH.speed?'ON':'OFF'}`,CH.speed)}${cBtn('ghost',`Enemies ignore you: ${CH.ghost?'ON':'OFF'}`,CH.ghost)}
  <h5>Instant${inRun?'':' (start a run first)'}</h5>${cBtn('heal','Full repair')}${cBtn('md','Fill mass destruction')}${cBtn('maxup','Max all run upgrades')}${cBtn('over','Start overdrive now')}${cBtn('respawn','Revive if downed')}`;
 else if(cTab=='eco')h=`<h5>Currency</h5>${cBtn('scrap','+99,999 scrap')}${cBtn('coins','+10,000 Forge Coins')}
  <h5>Unlocks</h5>${cBtn('titans','Unlock all titans')}${cBtn('skins','Unlock all skins')}${cBtn('gps','Unlock all gamepasses')}${cBtn('gear','Unlock all gear')}${cBtn('bundles','Unlock everything in the shop')}${cBtn('unlock','Unlock all missions')}
  <h5>Progress</h5>${cBtn('levels','Max all titan levels')}${cBtn('cores','Max all cores')}${cBtn('rank','Max pilot rank')}${cBtn('pass','Max season pass + premium')}${cBtn('newq','New set of quests now')}${cBtn('doneq','Complete current quests')}${cBtn('login','Show daily login again')}`;
 else if(cTab=='world')h=`<h5>Time and weather</h5>${cBtn('slow',`Slow motion: ${CH.slow?'ON':'OFF'}`,CH.slow)}${cBtn('freeze',`Freeze enemies: ${CH.freeze?'ON':'OFF'}`,CH.freeze)}${cBtn('day','Skip to day / night')}${cBtn('storm',`Storm: ${W.storm?'ON':'OFF'}`,W.storm)}
  <h5>Battle${inRun?'':' (start a run first)'}</h5>${cBtn('clear','Destroy all enemies')}${cBtn('wave','Skip 5 waves')}${cBtn('stars5','Wanted ★★★★★')}${cBtn('stars0','Clear wanted level')}${cBtn('event','Start a random event')}
  <h5>Teleport${inRun?'':' (start a run first)'}</h5>${cBtn('tpc','Map centre')}${cBtn('tpl','Nearest boss lair')}${cBtn('tpo','Nearest outpost')}${cBtn('tpr','Random spot')}`;
 else if(cTab=='spawn')h=`<h5>Spawn next to you${inRun?'':' (start a run first)'}</h5>`+Object.keys(ET).filter(k=>k!='pvp').map(k=>cBtn('sp:'+k,(ET[k].boss?'👑 ':'')+ET[k].name)).join('');
 else h=`<h5>Danger zone</h5>${cBtn('reset','Reset ALL progress (asks twice)')}${cBtn('hideadm','Hide the admin button')}<p style="grid-column:1/-1;color:#fff;margin:0">Make a save code under SAVE / LOAD first if you might want your progress back.</p>`;
 $('cheatBody').innerHTML=h}
function cMsg(t){$('cheatMsg').textContent=t}
let resetAsk=0;
$('cheat').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.ct){cTab=b.dataset.ct;renderCheat();return}const k=b.dataset.c;if(!k)return;if(k=='close'){$('cheat').classList.add('hide');return}
 const run=!!S&&!!P&&P.max&&state!='menu'&&state!='over',need=()=>{if(!run){cMsg('Start a run first.');return false}return true},refresh=()=>{saveProf();renderBank();renderRank();if(state=='menu')renderHangar()};
 if(['god','one','inf','nocd','speed','ghost','freeze'].includes(k)){CH[k]=!CH[k];if(k=='ghost')for(const en of enemies)en.home=null}
 else if(k=='slow'){CH.slow=!CH.slow;G.timeScale=CH.slow?.4:1}
 else if(k=='heal'){if(need())P.hp=P.max}else if(k=='md'){if(need())S.md=100}else if(k=='maxup'){if(need()){for(const s of SHOP)if(s.k!='repair')S.up[s.k]=s.max;recalcMax();P.hp=P.max}}
 else if(k=='over'){if(need()){P.ocd=0;act('over')}}else if(k=='respawn'){if(need()&&P.dead&&NET.inGame)P.respawnT=0;else if(run)cMsg('You are not downed.')}
 else if(k=='scrap'){if(S)S.scrap+=99999;prof.bank=(prof.bank||0)+99999;refresh()}else if(k=='coins'){addCoins(10000);refresh()}
 else if(k=='titans'){for(const t of TITANS)(prof.titans||(prof.titans={}))[t.id]=1;refresh()}
 else if(k=='skins'){for(const p of PAINTS)if(p.lock)(prof.skins||(prof.skins={}))[p.id]=1;refresh()}
 else if(k=='gps'){for(const g of GPASS)(prof.gp||(prof.gp={}))[g.id]=1;refresh()}
 else if(k=='bundles'){for(const t of TITANS)(prof.titans||(prof.titans={}))[t.id]=1;for(const p of PAINTS)if(p.lock)(prof.skins||(prof.skins={}))[p.id]=1;for(const g of GPASS)(prof.gp||(prof.gp={}))[g.id]=1;refresh()}
 else if(k=='gear'){for(const D of[WEAPONS,UTILS,MASS])for(const id in D)prof.unl[id]=1;for(const tt of TITANS)for(const k2 of['w','u','m'])for(const id of ARMORY[tt.id][k2])prof.unl[tt.id+':'+id]=1;refresh()}
 else if(k=='unlock'){CH.unlock=true;prof.camp=Math.max(prof.camp,MISSIONS.length-1);refresh()}
 else if(k=='levels'){for(const t of TITANS)tp(t.id).xp=Math.max(tp(t.id).xp,LEVELS[LEVELS.length-1]);refresh()}
 else if(k=='cores'){for(const t of TITANS){const c=coreOf(t.id);for(const x of['armor','speed','energy','dmg'])c[x]=5}refresh()}
 else if(k=='rank'){prof.pxp=Math.max(prof.pxp||0,RANKS[RANKS.length-1][1]);refresh()}else if(k=='pass'){prof.sp=Math.max(prof.sp||0,5000);prof.passPrem=1;refresh()}
 else if(k=='newq'){prof.quests=null;quests();renderQP();refresh()}else if(k=='doneq'){for(const q of quests().q)q.done=true,q.p=q.c;const w=weekly();w.done=true;w.p=w.c;renderQP();refresh()}
 else if(k=='login'){if(prof.login)prof.login.claimed=false;prof.login=prof.login||null;if(prof.login)prof.login.d=-1;checkLogin()}
 else if(k=='day'){W.tod=(W.tod||0)+.5}else if(k=='storm'){W.storm=!W.storm}
 else if(k=='clear'){if(need())for(const en of[...enemies])if(live(en)&&!en.pvp&&!en.net)killEnemy(en)}
 else if(k=='wave'){if(need()){if(S.kind=='endless'||S.kind=='coop'||S.kind=='defense'){S.wave+=5;cMsg('Skipped to level '+S.wave+'. Clear this level to continue.')}else cMsg('Only in Levels, Defence and co-op.')}}
 else if(k=='stars5'||k=='stars0'){if(need()){if(S.kind=='open'){S.heat=k=='stars5'?130:0;S.calm=20}else cMsg('Only in Open World.')}}
 else if(k=='event'){if(need()){if(S.kind=='open'){if(S.ev)endEvent(0);startEvent()}else cMsg('Only in Open World.')}}
 else if(k.startsWith('tp')){if(need()){let x=0,z=0;if(k=='tpl'||k=='tpo'){const L=k=='tpl'?(S.pois?.lairs||[]).filter(l=>!l.done):(S.pois?.outposts||[]).filter(o=>!o.dead);if(!L.length){cMsg('Nothing like that on this map.');return}L.sort((a,b)=>d2(a,P)-d2(b,P));x=L[0].x+(k=='tpl'?50:25);z=L[0].z}else if(k=='tpr'){x=rnd(-ARENA+40,ARENA-40);z=rnd(-ARENA+40,ARENA-40)}
  for(let t=0;t<20&&blockHit(x,z,1,3);t++){x+=rnd(-15,15);z+=rnd(-15,15)}P.x=x;P.z=z;P.vx=P.vz=0;P.m.root.position.set(x,0,z);camT.set(x,0,z);ring(x,z,P.glow,1,10,.5)}}
 else if(k.startsWith('sp:')){if(need()){const ty=k.slice(3);if(ET[ty].boss&&S.boss){cMsg('Finish the current boss first.');return}const a=P.aimYaw;spawn(ty,{x:clamp(P.x+Math.sin(a)*30,-ARENA+5,ARENA-5),z:clamp(P.z+Math.cos(a)*30,-ARENA+5,ARENA-5)})}}
 else if(k=='hideadm'){prof.admin=0;saveProf();$('admBtn').classList.add('hide');$('cheat').classList.add('hide');toast('Admin button hidden · type adv6789 to bring it back');return}
 else if(k=='reset'){if(++resetAsk<2){cMsg('Press RESET again to wipe everything.');return}resetAsk=0;if(S&&state!='menu')toHangar();replaceProf({});renderHangar();renderQ();renderRank();cMsg('All progress was reset.')}
 if(k!='reset')resetAsk=0;if(!$('cheatMsg').textContent||!k.startsWith('tp'))cMsg('Done: '+(b.textContent.split(':')[0]));renderCheat();if(state=='shop')renderShop()});
function adminOn(){if(!prof.admin){prof.admin=1;saveProf();toast('Admin button unlocked · it stays on screen')}$('admBtn').classList.remove('hide')}
$('admBtn').addEventListener('click',e=>{e.stopPropagation();const h=$('cheat').classList.toggle('hide');if(!h){if(document.pointerLockElement)document.exitPointerLock();renderCheat()}SFX.ui()});
$('admBtn').addEventListener('pointerdown',e=>e.stopPropagation());
function adminTick(dt){if(!P||!S)return;if(CH.inf){P.en=P.enMax||100}if(CH.nocd){for(const k in P)if(/cd$/.test(k)&&typeof P[k]=='number'&&P[k]>0)P[k]=0;if(S.md<100)S.md=100}
 if(P.hurtT>0)P.hurtT-=dt;else if(hasGP('gp_repair')&&!P.dead&&P.hp<P.max)P.hp=Math.min(P.max,P.hp+P.max*.02*dt)}

/* ================= shop: coins, gamepasses, skins, mechs, bundles ================= */
const GPASS=[{id:'gp_scrap',name:'2× Scrap',icon:'⚙',desc:'Double all scrap you bank at the end of every run.',price:5000},{id:'gp_vip',name:'VIP Pilot',icon:'👑',desc:'+25% titan and pilot XP, plus a gold VIP badge in the lobby.',price:5000},{id:'gp_energy',name:'Overclock',icon:'⚡',desc:'+50 max energy, and turbo drains 30% slower.',price:5000},{id:'gp_repair',name:'Nano-repair',icon:'🛠',desc:'Armour repairs itself 2% a second when you stop taking hits.',price:5000},{id:'gp_pass',name:'Double pass points',icon:'⭐',desc:'Earn season pass points twice as fast.',price:5000}];
const SKINSHOP=[['neon',2500],['lava',2500],['ice',2500],['titanium',2500],['tiger',2500],['galaxy',2500]];
const EXCL=()=>TITANS.filter(t=>t.price&&t.price.coins);
const BUNDLES=[{id:'b_starter',name:'Starter bundle',icon:'🎁',desc:'Warden titan + Lava flow skin + 10,000 scrap.',price:5000,items:['t:warden','s:lava','scrap:10000'],worth:7500},
 {id:'b_titano',name:'Titano bundle',icon:'🦾',desc:'Titano titan + Titanium skin + Nano-repair gamepass.',price:15000,items:['t:titano','s:titanium','g:gp_repair'],worth:17500},
 {id:'b_skins',name:'Collector bundle',icon:'🎨',desc:'All 6 shop skins.',price:12500,items:SKINSHOP.map(s=>'s:'+s[0]),worth:15000},
 {id:'b_war',name:'Warlord bundle',icon:'🏆',desc:'All 5 gamepasses.',price:20000,items:GPASS.map(g=>'g:'+g.id),worth:25000},
 {id:'b_excl',name:'Legends collection',icon:'👑',desc:'All 7 shop-exclusive titans: Titano, Leviathan, Valkyrie, Juggernaut, Zeus, Kaiju and Seraph.',price:60000,items:TITANS.filter(t=>t.price&&t.price.coins).map(t=>'t:'+t.id),worth:70000}];
const COINPACKS=[[100,6000],[500,25000],[1200,50000],[5000,200000]];
const hasGP=id=>!!(prof.gp&&prof.gp[id]);
function addCoins(n){prof.coins=(prof.coins||0)+n;if($('coinChip'))$('coinChip').textContent='🪙 '+prof.coins.toLocaleString()}
function ownT(t){return!t.price||!!(prof.titans&&prof.titans[t.id])||CH.unlock}
function priceTxt(p){return p.coins?`🪙 ${p.coins.toLocaleString()}`:`${p.scrap.toLocaleString()} scrap`}
function ownItem(it){const[k,v]=it.split(':');if(k=='t')return ownT(TITANS.find(t=>t.id==v));if(k=='s')return!!(prof.skins&&prof.skins[v]);if(k=='g')return hasGP(v);return false}
function grantItem(it){const[k,v]=it.split(':');if(k=='t')(prof.titans||(prof.titans={}))[v]=1;else if(k=='s')(prof.skins||(prof.skins={}))[v]=1;else if(k=='g')(prof.gp||(prof.gp={}))[v]=1;else if(k=='scrap')prof.bank=(prof.bank||0)+(+v)}
let stTab='featured',stAsk=null;
function openStore(tab){if(tab)stTab=tab;renderStore();show('storeOv')}
function card(o){return`<div class="sti${o.big?' big':''}"><div class="pic" style="${o.bg||''}">${o.icon||''}</div>${o.tag?`<span class="tag">${o.tag}</span>`:''}<b>${o.name}</b><span>${o.desc}</span>${o.save?`<span class="save">${o.save}</span>`:''}${o.owned?`<button class="btn owned" disabled>✓ OWNED</button>`:`<button class="btn" data-buy="${o.buy}">${o.label}</button>`}</div>`}
function mechCard(t,big){return card({big,bg:`background-image:url(${t.img||t.snap||''})`,tag:t.tag.toUpperCase(),name:t.name,desc:`${t.desc} Armour ${t.hp} · speed ${t.spd}.`,owned:ownT(t),buy:'t:'+t.id,label:'BUY · '+priceTxt(t.price)})}
function renderStore(){document.querySelectorAll('.sttabs button').forEach(b=>b.classList.toggle('on',b.dataset.st==stTab));$('storeBal').textContent=`🪙 ${(prof.coins||0).toLocaleString()} · ${(prof.bank||0).toLocaleString()} scrap`;$('storeConfirm').classList.add('hide');let h='';
 const bundle=b=>{const owned=b.items.filter(x=>!x.startsWith('scrap')).every(ownItem);return card({icon:b.icon,tag:'BUNDLE',name:b.name,desc:b.desc,save:`Save ${Math.max(0,Math.round((1-b.price/b.worth)*100))}% vs buying separately`,owned,buy:'b:'+b.id,label:`BUY · 🪙 ${b.price.toLocaleString()}`})};
 const gp=g=>card({icon:g.icon,tag:'GAMEPASS · PERMANENT',name:g.name,desc:g.desc,owned:hasGP(g.id),buy:'g:'+g.id,label:`BUY · 🪙 ${g.price}`});
 const sk=([id,pr])=>{const p=PAINTS.find(x=>x.id==id);return card({bg:`background:linear-gradient(135deg,${cssHex(p.a)} 0 45%,${cssHex(p.b)} 45% 80%,${cssHex(p.t)} 80%)`,tag:'MECH SKIN',name:p.name,desc:'Works on every titan. Equip it under PAINT.',owned:!!(prof.skins&&prof.skins[id]),buy:'s:'+id,label:`BUY · 🪙 ${pr}`})};
 if(stTab=='featured')h=mechCard(TITANS.find(t=>t.id=='titano'),true)+BUNDLES.map(bundle).join('');
 else if(stTab=='excl')h=EXCL().map(t=>mechCard(t,false)).join('')+bundle(BUNDLES[4]);
 else if(stTab=='mechs')h=TITANS.filter(t=>t.price&&t.price.scrap).map(t=>mechCard(t,false)).join('');
 else if(stTab=='passes')h=GPASS.map(gp).join('')+bundle(BUNDLES[3]);
 else if(stTab=='skins')h=SKINSHOP.map(sk).join('')+bundle(BUNDLES[2]);
 else if(stTab=='crates')h=CRATES.map(c=>card({icon:c.icon,tag:'MYSTERY CRATE',name:c.name,desc:c.desc,buy:'',label:'',owned:false}).replace('data-buy=""',`data-crate="${c.id}"`).replace('></button>',`>OPEN · 🪙 ${c.price.toLocaleString()}</button>`)).join('');
 else h=COINPACKS.map(([c,s])=>card({icon:'🪙',tag:'COIN PACK',name:`${c.toLocaleString()} Forge Coins`,desc:`Trade ${s.toLocaleString()} scrap for ${c.toLocaleString()} coins.`,buy:'c:'+c,label:`TRADE · ${s.toLocaleString()} SCRAP`})).join('');
 $('storeBody').innerHTML=h}
function buyInfo(key){const[k,v]=key.split(':');
 if(k=='t'){const t=TITANS.find(x=>x.id==v);return{name:t.name,coins:t.price.coins||0,scrap:t.price.scrap||0,items:[key]}}
 if(k=='g'){const g=GPASS.find(x=>x.id==v);return{name:g.name,coins:g.price,scrap:0,items:[key]}}
 if(k=='s'){const s=SKINSHOP.find(x=>x[0]==v);return{name:PAINTS.find(p=>p.id==v).name+' skin',coins:s[1],scrap:0,items:[key]}}
 if(k=='b'){const b=BUNDLES.find(x=>x.id==v);return{name:b.name,coins:b.price,scrap:0,items:b.items}}
 if(k=='c'){const p=COINPACKS.find(x=>x[0]==+v);return{name:`${p[0]} Forge Coins`,coins:0,scrap:p[1],items:[],give:p[0]}}}
$('storeOv').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.st){stTab=b.dataset.st;renderStore();SFX.ui();return}
 if(b.dataset.buy){const I=buyInfo(b.dataset.buy);const cost=[I.coins?`🪙 ${I.coins.toLocaleString()}`:'',I.scrap?`${I.scrap.toLocaleString()} scrap`:''].filter(Boolean).join(' + ');
  if((prof.coins||0)<I.coins){toast(`Need ${(I.coins-(prof.coins||0)).toLocaleString()} more Forge Coins · trade scrap under GET COINS`);SFX.hit();return}
  if((prof.bank||0)<I.scrap){toast(`Need ${(I.scrap-(prof.bank||0)).toLocaleString()} more scrap`);SFX.hit();return}
  stAsk=I;$('stcText').textContent=`Buy ${I.name} for ${cost}?`;$('storeConfirm').classList.remove('hide');$('storeConfirm').scrollIntoView({block:'nearest'});return}
 if(b.id=='stcNo'){stAsk=null;$('storeConfirm').classList.add('hide');return}
 if(b.dataset.crate){openCrate(b.dataset.crate);return}
 if(b.id=='stcYes'&&stAsk){const I=stAsk;stAsk=null;prof.coins=(prof.coins||0)-I.coins;prof.bank=(prof.bank||0)-I.scrap;for(const it of I.items)grantItem(it);if(I.give)prof.coins+=I.give;saveProf();renderBank();renderRank();renderRoster();SFX.level();toast(`${I.name} is yours!`);renderStore()}});

/* ================= loop & boot ================= */
let last=performance.now();
/* ================= meta systems: rank, pass, login, weekly, cores ================= */
const DAY=864e5,fmtT=s=>`${Math.floor(s/60)}:${(s%60).toFixed(1).padStart(4,'0')}`;
const RANKS=[['Recruit',0],['Private',400],['Corporal',1200],['Sergeant',3000],['Lieutenant',6000],['Captain',10000],['Major',16000],['Colonel',25000],['General',40000],['Warlord',60000]];
function rankOf(x){let i=0;while(i+1<RANKS.length&&x>=RANKS[i+1][1])i++;return i}
function renderRank(){const el=$('rankChip');if(!el)return;if($('coinChip'))$('coinChip').textContent='🪙 '+(prof.coins||0).toLocaleString();const x=prof.pxp||0,i=rankOf(x),n=RANKS[i+1];el.innerHTML=`<b>${hasGP('gp_vip')?'<span style="color:#ffd23a">👑 VIP</span> ':''}🎖 ${RANKS[i][0].toUpperCase()}</b><span>Pilot rank ${i+1}${n?` · ${x-RANKS[i][1]} / ${n[1]-RANKS[i][1]}`:' · max'}</span>`}
const PASS_T=50,SKIN_F={10:'camo',20:'digital',30:'chrome',40:'military',50:'gold'},SKIN_P={15:'carbon',25:'cobalt',35:'rosegold',45:'obsidian'};
function passTier(){return Math.min(PASS_T,Math.floor((prof.sp||0)/100))}
function addSP(n){n*=hasGP('gp_pass')?2:1;const t0=passTier();prof.sp=(prof.sp||0)+n;const t1=passTier();if(t1>t0&&state!='menu')banner('PASS TIER '+t1,'Claim rewards in the lobby under PASS','#ffd23a')}
function passReward(n,prem){const s=prem?SKIN_P[n]:SKIN_F[n];return s?{skin:s}:{scrap:prem?150+n*20:50+n*10}}
function claimPass(n,prem){const c=prof.passC||(prof.passC={}),k=(prem?'p':'f')+n;if(c[k]||n>passTier()||(prem&&!prof.passPrem))return;c[k]=1;const r=passReward(n,prem);if(r.skin){(prof.skins||(prof.skins={}))[r.skin]=1;toast(`Skin unlocked: ${PAINTS.find(p=>p.id==r.skin).name} · find it under PAINT`)}else{prof.bank=(prof.bank||0)+r.scrap;toast(`+${r.scrap} scrap`)}SFX.level();saveProf();renderPass();renderBank()}
function renderPass(){const t=passTier(),sp=prof.sp||0,c=prof.passC||{};
 $('passHead').innerHTML=`<div class="ph"><b>SEASON 1 · TIER ${t} / ${PASS_T}</b><span>${t<PASS_T?`${sp%100} / 100 points to tier ${t+1}`:'Pass complete'}</span></div><div class="bar"><i style="width:${t<PASS_T?sp%100:100}%"></i></div><p>Earn pass points from quests (+100), the weekly quest (+500), daily logins (+50), outposts (+20), bosses (+50) and every kill.</p>${prof.passPrem?'<b class="prem">★ PREMIUM TRACK ACTIVE</b>':`<button class="btn" id="buyPrem">UNLOCK PREMIUM TRACK · 5,000 SCRAP</button>`}`;
 $('passGrid').innerHTML=Array.from({length:PASS_T},(_,i)=>{const n=i+1,cell=prem=>{const r=passReward(n,prem),k=(prem?'p':'f')+n,got=c[k],can=n<=t&&(!prem||prof.passPrem)&&!got,lbl=r.skin?'🎨 '+PAINTS.find(p=>p.id==r.skin).name:'⚙ '+r.scrap+' scrap';return`<button class="pc${prem?' pr':''}${got?' got':''}${can?' can':''}" data-pass="${n}" data-prem="${prem?1:0}" ${can?'':'disabled'}>${got?'✓ ':''}${prem?'★ ':''}${lbl}</button>`};return`<div class="pt${n<=t?' on':''}"><em>${n}</em>${cell(false)}${cell(true)}</div>`}).join('');
 const g=$('passGrid'),first=g.querySelector('.pc.can');if(first)first.scrollIntoView({inline:'center',block:'nearest'})}
$('passOv').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.pass)claimPass(+b.dataset.pass,b.dataset.prem=='1');else if(b.id=='buyPrem'){if((prof.bank||0)<5000){toast(`Need ${(5000-(prof.bank||0)).toLocaleString()} more scrap`);SFX.hit();return}prof.bank-=5000;prof.passPrem=1;saveProf();renderBank();renderPass();SFX.level()}});
const loginR=n=>n==7?1000:100*n;
function checkLogin(){const today=Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/DAY),L=prof.login||{};if(L.d===today&&L.claimed)return;if(L.d!==today){const streak=L.d===today-1?(L.s%7)+1:1;prof.login={d:today,s:streak,claimed:false};saveProf()}
 const C=prof.login;$('loginBody').innerHTML=[1,2,3,4,5,6,7].map(n=>`<div class="ld${n<C.s?' past':''}${n==C.s?' now':''}"><em>DAY ${n}</em><b>${n==7?'🎁':'⚙'} ${loginR(n)}</b></div>`).join('');$('loginOv').classList.remove('hide')}
$('loginClaim').onclick=()=>{const L=prof.login;if(L&&!L.claimed){L.claimed=true;prof.bank=(prof.bank||0)+loginR(L.s);addSP(50);addCoins(L.s==7?100:10);saveProf();renderBank();SFX.level();toast(`Day ${L.s} reward: +${loginR(L.s)} scrap · +50 pass points`)}$('loginOv').classList.add('hide')};
const WQ=[{k:'outpost',c:25,n:'Destroy 25 army outposts'},{k:'inf',c:250,n:'Eliminate 250 infantry'},{k:'veh',c:50,n:'Destroy 50 army vehicles'},{k:'boss',c:4,n:'Defeat 4 lair bosses'},{k:'dist',c:40,n:'Travel 40 km'},{k:'heli',c:15,n:'Shoot down 15 helicopters'}];
function weekly(){const key=Math.floor(Date.now()/(7*DAY));if(!prof.weekly||prof.weekly.key!==key){const t=WQ[key%WQ.length];prof.weekly={key,k:t.k,c:t.c,p:0,r:2500,n:t.n,done:false};saveProf()}return prof.weekly}
function wLeft(){const ms=7*DAY-Date.now()%(7*DAY);return`${Math.floor(ms/DAY)}d ${Math.floor(ms/36e5)%24}h`}
const CORES=[['armor','Armour core','+8% max armour per level'],['speed','Servo core','+5% walking speed per level'],['energy','Capacitor core','+20 max energy per level'],['dmg','Weapon core','+5% damage per level']];
function coreOf(id){const c=prof.cores||(prof.cores={});return c[id]||(c[id]={armor:0,speed:0,energy:0,dmg:0})}
const coreCost=l=>(l+1)*400;

/* ================= open world: wanted level, captures, events ================= */
function heat(n){if(!S||S.kind!='open')return;S.heat=Math.min(140,(S.heat||0)+n);S.calm=12}
const HUNT=[[],['soldier','soldier','rocket'],['jeep','soldier','rocket'],['apc','jeep'],['tank','heli'],['tank','heli','apc']];
function capture(o){stat('outposts');const g=new THREE.Group();g.position.set(o.x,0,o.z);part(cyl(.15,.15,10,6),paintMats('gunmetal').dark,0,5,0,g);part(rbox(2.4,1.4,.05,.02),glow(P.glow,2.6),1.25,9.2,0,g);part(geo('capR',()=>new THREE.TorusGeometry(14,.25,6,48)),glow(0x5cff78,2),0,.3,0,g,Math.PI/2);scene.add(g);S.pois.cap.push({x:o.x,z:o.z,g});banner('OUTPOST CAPTURED','+250 scrap · stand in the green ring to repair · earns scrap over time','#5cff78')}
function startEvent(){const ty=['convoy','crash','plane'][Math.random()*3|0],a=rnd(0,TAU),r=ty=='convoy'?rnd(80,110):rnd(160,300),x=clamp(P.x+Math.cos(a)*r,-ARENA+30,ARENA-30),z=clamp(P.z+Math.sin(a)*r,-ARENA+30,ARENA-30),ev={ty,x,z,t:120,g:null,list:[]};
 if(ty=='convoy'){['jeep','apc','tank','jeep'].forEach((u,i)=>ev.list.push(spawn(u,{x:clamp(x+i*9,-ARENA+5,ARENA-5),z})));banner('ARMY CONVOY','Destroy all 4 vehicles for +300 scrap','#d58cff')}
 else{const g=new THREE.Group();g.position.set(x,0,z);if(ty=='crash'){part(facet(6,2.2,3,.3,.8,1),paintMats('olive',true).armor,0,1.1,0,g,0,.4,.3);part(rbox(9,.3,.5,.05),paintMats('olive',true).dark,0,2.6,0,g,0,1.1,0)}else{part(facet(2.4,2,2.4,.2,.85,1),paintMats('desert').armor,0,1,0,g);part(rbox(2.5,.25,2.5,.05),glow(0xd58cff,2.6),0,2.1,0,g)}
  part(cyl(.3,.3,60,6),addMat(0xd58cff,.25),0,30,0,g);scene.add(g);ev.g=g;
  banner(ty=='crash'?'CRASHED HELICOPTER':'SUPPLY PLANE DROP',ty=='crash'?'Loot the wreck within 2 minutes · +250 scrap':'Reach the crate before the army · +200 scrap & full repair','#d58cff');
  if(ty=='plane')for(let i=0;i<4;i++)spawn(i<3?'soldier':'jeep',{x:clamp(x+rnd(-25,25),-ARENA+5,ARENA-5),z:clamp(z+rnd(-25,25),-ARENA+5,ARENA-5)})}
 S.ev=ev}
function endEvent(r,msg){const ev=S.ev;if(ev.g)scene.remove(ev.g);S.ev=null;S.evT=rnd(120,200);if(r){S.scrap+=r;S.earned+=r;addSP(30);SFX.level();banner('EVENT COMPLETE',msg,'#d58cff')}else banner('EVENT EXPIRED','','#888')}
function openTick(dt){
 if((S.calm-=dt)<=0)S.heat=Math.max(0,S.heat-dt*1.2);const st=Math.min(5,Math.floor(S.heat/22));if(st>S.stars)banner('WANTED '+'★'.repeat(st),st>=5?'Maximum alert':'The army is hunting you','#ff3b2e');S.stars=st;
 if(st>=1&&(S.huntT-=dt)<=0&&enemies.length<16){S.huntT=34-st*5;for(const u of HUNT[st])spawn(u)}
 if(st>=5&&!S.krak&&!S.boss){S.krak=true;banner('KRAKEN DEPLOYED','The army sent its own titan after you','#ff2a18');spawn('rival')}
 if(S.pois.cap.length){if((S.capT-=dt)<=0){S.capT=30;const v=10*S.pois.cap.length;S.scrap+=v;S.earned+=v;toast(`+${v} scrap from captured outposts`)}for(const o of S.pois.cap)if((o.x-P.x)**2+(o.z-P.z)**2<196&&!P.dead){P.hp=Math.min(P.max,P.hp+30*dt);P.en=Math.min(P.enMax||100,P.en+20*dt)}}
 if(!S.ev){if((S.evT-=dt)<=0)startEvent()}else{const ev=S.ev;if(ev.ty=='convoy'){if(ev.list.every(e=>e.dead))endEvent(300,'Convoy destroyed · +300 scrap')}else{ev.t-=dt;if(ev.g){ev.g.rotation.y+=dt*.3;if(Math.random()<.3)SMOKE.emit(ev.x+rnd(-1,1),2,ev.z+rnd(-1,1),0,3,0,2,2.5,.1,.1,.1,.4,-.3,1.5)}const near=(ev.x-P.x)**2+(ev.z-P.z)**2;
  if(ev.ty=='crash'&&!ev.guard&&near<3600){ev.guard=1;for(let i=0;i<3;i++)spawn('soldier',{x:clamp(ev.x+rnd(-15,15),-ARENA+5,ARENA-5),z:clamp(ev.z+rnd(-15,15),-ARENA+5,ARENA-5)})}
  if(near<100&&!P.dead){if(ev.ty=='plane'){P.hp=P.max;P.en=P.enMax||100}endEvent(ev.ty=='crash'?250:200,ev.ty=='crash'?'Wreck looted · +250 scrap':'Crate secured · +200 scrap & repair')}else if(ev.t<=0)endEvent(0)}}}

/* ================= modes: time trial ================= */
function setupTrial(){const cps=[];let px=0,pz=0;for(let i=0;i<10;i++){let x,z,t=0;do{const a=rnd(0,TAU),r=rnd(110,190);x=clamp(px+Math.cos(a)*r,-ARENA+40,ARENA-40);z=clamp(pz+Math.sin(a)*r,-ARENA+40,ARENA-40)}while(t++<30&&blockHit(x,z,1,10));px=x;pz=z;
 const g=new THREE.Group();g.position.set(x,0,z);part(geo('cpR',()=>new THREE.TorusGeometry(9,.6,8,40)),glow(0x40e0ff,2.6),0,9,0,g);part(cyl(.3,.3,40,6),addMat(0x40e0ff,.25),0,20,0,g);g.lookAt(px,0,pz);scene.add(g);cps.push({x,z,g})}
 for(const c of cps)c.g.rotation.y=Math.atan2(c.x,c.z);S.obj={type:'trial',i:0,t:0,cps,title:'Time trial'};setTimeout(()=>banner('TIME TRIAL','Hit 10 checkpoints in order · Shift for turbo','#40e0ff'),3000)}

/* ================= combat extras ================= */
let finRT=0;
function finTarget(){if(!P||P.dead||!S)return null;let b=null,bd=64;for(const e of enemies){if(e.dead||e.boss||e.drop>0||e.fin)continue;const dd=d2(e,P);if(dd<bd&&(ET[e.type].inf||e.hp<e.max*.35)){bd=dd;b=e}}return b}
function ramCovers(p){for(const c of coversNear(p.x,p.z,40)){if(c.dead||c.team)continue;if(Math.abs(c.x-p.x)<c.w/2+3&&Math.abs(c.z-p.z)<c.d/2+3){if(c.solid&&!(W.destruct&&c.tim))continue;damageCover(c,1e9);G.shake=Math.max(G.shake,.5);SFX.boom(.08)}}}

/* ================= gamepad ================= */
const GP={on:false,lx:0,ly:0,rx:0,ry:0,fire:false,turbo:false,prev:[]};
addEventListener('gamepadconnected',()=>toast('Controller connected'));
function pollPad(){const pads=navigator.getGamepads?navigator.getGamepads():[];let g=null;for(const p of pads)if(p&&p.connected){g=p;break}if(!g){GP.on=false;return}GP.on=true;const dz=v=>Math.abs(v||0)<.18?0:v;GP.lx=dz(g.axes[0]);GP.ly=dz(g.axes[1]);GP.rx=dz(g.axes[2]);GP.ry=dz(g.axes[3]);
 const B=i=>!!(g.buttons[i]&&(g.buttons[i].pressed||g.buttons[i].value>.4)),press=i=>B(i)&&!GP.prev[i];GP.fire=B(7);GP.turbo=B(6)||B(10);
 if(photo){if(press(0))snapPhoto();if(press(1))togglePhoto();photo.yaw-=GP.rx*.04;photo.pitch=clamp(photo.pitch+GP.ry*.03,-.2,1.3)}
 else if(state=='menu'){if(press(0)&&$('loginOv').classList.contains('hide'))startRun(kindOf(modeSel),{arena:arenaSel});else if(press(0))$('loginClaim').onclick()}
 else if(state=='over'){if(press(0))$('again').onclick();if(press(1))toHangar()}
 else if(state=='shop'){if(press(0))$('launchW').click()}
 else{if(press(9))setPause(!paused);if(!paused){if(press(0))act('boost');if(press(1))act('jump');if(press(2))act('msl');if(press(3))act('abil');if(press(4))act('util');if(press(5))act('over');if(press(8))act('mass');if(press(11))act('fin');if(press(12))toggleMap();if(press(14))act('board');if(press(13))toggleCam()}}
 GP.prev=g.buttons.map((b,i)=>B(i))}

/* ================= photo mode + cockpit ================= */
let photo=null,snapReq=false,cock=false,phP=null;
function togglePhoto(){if(photo){photo=null;paused=false;document.body.classList.remove('photo');$('photoUI').classList.add('hide');if(P&&!P.dead)P.m.root.visible=!cock;return}
 if(!S||(state!='play'&&state!='clear'))return;if(document.pointerLockElement)document.exitPointerLock();show(null);photo={yaw:Math.atan2(camera.position.x-P.x,camera.position.z-P.z),pitch:.3,dist:18};paused=true;P.m.root.visible=true;document.body.classList.add('photo');$('photoUI').classList.remove('hide')}
function photoCam(){const p=photo,cp=Math.cos(p.pitch);camera.position.set(P.x+Math.sin(p.yaw)*cp*p.dist,P.y+3+Math.sin(p.pitch)*p.dist,P.z+Math.cos(p.yaw)*cp*p.dist);camera.lookAt(P.x,P.y+4,P.z)}
function snapPhoto(){snapReq=true;SFX.ui()}
cv.addEventListener('pointerdown',e=>{if(photo){phP={x:e.clientX,y:e.clientY};e.stopImmediatePropagation()}},true);
addEventListener('pointermove',e=>{if(photo&&phP){photo.yaw-=(e.clientX-phP.x)*.006;photo.pitch=clamp(photo.pitch+(e.clientY-phP.y)*.004,-.2,1.3);phP={x:e.clientX,y:e.clientY}}});addEventListener('pointerup',()=>phP=null);
cv.addEventListener('wheel',e=>{if(photo){photo.dist=clamp(photo.dist+e.deltaY*.02,6,60);e.preventDefault()}},{passive:false});
$('phIn').onclick=()=>{if(photo)photo.dist=Math.max(6,photo.dist-3)};$('phOut').onclick=()=>{if(photo)photo.dist=Math.min(60,photo.dist+3)};$('phSnap').onclick=snapPhoto;$('phExit').onclick=togglePhoto;$('phClose').onclick=()=>$('photoPrev').classList.add('hide');
$('photoBtn').onclick=()=>{setPause(false);togglePhoto()};

/* ================= online play (PeerJS) ================= */
function withSeed(seed,fn){const R0=Math.random;let s=(seed>>>0)||1;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};try{fn()}finally{Math.random=R0}}
const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}]};
const NET_SERVERS=[{name:'PeerJS Cloud',desc:'0.peerjs.com · free public server'},{name:'Titan Forge server',desc:'Your own server · up to 10,000 players · also runs leaderboards and clans'}];const SRV_OVR=(()=>{try{const v=new URLSearchParams(location.search).get('server');if(!v)return null;const m=v.match(/^([^:/]+)(?::(\d+))?(\/.*)?$/);return m?{host:m[1],port:+(m[2]||443),path:m[3]||'/',secure:!m[2]||m[2]=='443'}:null}catch(e){return null}})();
const NET={peer:null,conns:[],role:null,mode:null,code:null,inGame:false,players:[],remotes:new Map(),ens:new Map(),sendT:0,wT:0,nid:0,esBuf:[],kills:0,deaths:0,slot:0};
const netCfg=()=>{const n=prof.net||(prof.net={srv:0,name:'',custom:{host:'',port:'',path:'/',secure:true}});if(window.TF_HOSTED&&!n.srv2){n.srv2=window.TF_HOSTED;n.srv=1}return n};
function srvOpts(){if(SRV_OVR)return{...SRV_OVR,debug:0,config:ICE};const n=netCfg();if(n.srv==1&&n.srv2){try{const u=new URL(n.srv2);return{host:u.hostname,port:+(u.port||(u.protocol=='https:'?443:80)),path:'/tforge',secure:u.protocol=='https:',debug:0,config:ICE}}catch(e){}}return{debug:0}}
function netStatus(t){$('netStat').textContent=t}
function myCfg(){const t=TITANS[sel],c=tcfg(sel);return{chassis:t.id,L:c.L,R:c.R,glow:c.glow,glow2:t.glow2,paint:c.paint,name:(netCfg().name||'Pilot').slice(0,14),titan:t.name}}
function rcode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=A[Math.random()*A.length|0];return s}
function netReset(){for(const c of NET.conns)try{c.close()}catch(e){}if(NET.peer)try{NET.peer.destroy()}catch(e){}Object.assign(NET,{peer:null,conns:[],role:null,mode:null,code:null,inGame:false,players:[]});clearRemotes()}
function openPeer(id,cb,order){if(typeof Peer=='undefined'){netStatus('The PeerJS library did not load. Check your internet connection.');return}
 if(!order)order=[0,0];const i=order.shift();if(i==null){netStatus('Could not reach the PeerJS server. Check your internet connection and try again. Inside claude.ai online play is blocked: use the downloaded HTML file.');return}
 const o=srvOpts();const sname=SRV_OVR?SRV_OVR.host:NET_SERVERS[netCfg().srv==1&&netCfg().srv2?1:0].name;netStatus(`Connecting to ${sname}…`);let done=false;const p=id?new Peer(id,o):new Peer(o);
 const fail=()=>{if(done)return;done=true;clearTimeout(to);try{p.destroy()}catch(e){}openPeer(id,cb,order)},to=setTimeout(fail,8000);
 p.on('open',()=>{if(done)return;done=true;clearTimeout(to);NET.peer=p;netStatus(`Connected via ${sname}`);cb(p)});
 p.on('error',err=>{const t=err&&err.type;if(!done){if(t=='unavailable-id'){done=true;clearTimeout(to);p.destroy();netStatus('That room code is busy, try again.');return}fail();return}
  if(t=='peer-unavailable')netStatus('No room with that code. Check the code and that the host is waiting in the room.');else if(t!='network'||!NET.inGame)netStatus('Network problem: '+t)});
 p.on('disconnected',()=>{try{p.reconnect()}catch(e){}})}
function hostRoom(mode){netReset();NET.role='host';NET.mode=mode;NET.code=rcode();
 openPeer('tforge-'+NET.code,p=>{NET.players=[{id:p.id,...myCfg()}];renderNet();netStatus(mode=='pvp'?'Room open. Waiting for 1 opponent…':'Room open. Up to 3 friends can join.');
  p.on('connection',c=>{const max=NET.mode=='pvp'?1:3;if(NET.conns.length>=max||NET.inGame){c.on('open',()=>{c.send({t:'full'});setTimeout(()=>c.close(),400)});return}setupConn(c)})})}
function joinRoom(code){code=(code||'').toUpperCase().trim();if(code.length!=5){netStatus('Enter the 5-letter room code.');return}netReset();NET.role='guest';NET.code=code;
 openPeer('tforge-g-'+rcode()+rcode(),p=>{netStatus('Joining room '+code+'…');const c=p.connect('tforge-'+code,{reliable:true});setupConn(c)})}
function setupConn(c){c.on('open',()=>{NET.conns.push(c);c.send({t:'hi',id:NET.peer.id,cfg:myCfg()});if(NET.role=='guest')netStatus('Joined room '+NET.code+'. Waiting for the host to start…')});
 c.on('data',d=>{try{onNet(c,d)}catch(e){console.warn(e)}});
 c.on('close',()=>{NET.conns=NET.conns.filter(x=>x!==c);if(NET.role=='host'){NET.players=NET.players.filter(p=>p.id!==c.peer);dropRemote(c.peer);netBroadcastLobby();toast('A pilot left the room')}else{toast('Disconnected from the host');if(NET.inGame&&S&&!S.ended)finishRun(false);NET.role=null;NET.conns=[]}renderNet()});
 c.on('error',()=>{})}
function netSend(m,except){if(!NET.peer)return;for(const c of NET.conns)if(c!==except&&c.open)try{c.send(m)}catch(e){}}
function netTo(id,m){if(NET.role=='host'){const c=NET.conns.find(x=>x.peer==id);if(c&&c.open)c.send(m)}}
function netBroadcastLobby(){if(NET.role!='host')return;netSend({t:'lobby',mode:NET.mode,code:NET.code,players:NET.players});renderNet()}
function onNet(c,d){const host=NET.role=='host';
 switch(d.t){
 case'hi':if(host){NET.players=NET.players.filter(p=>p.id!==d.id);NET.players.push({id:d.id,...d.cfg});netBroadcastLobby()}else{NET.players=NET.players.filter(p=>p.id!==d.id);NET.players.push({id:d.id,...d.cfg})}break;
 case'cfg':{const p=NET.players.find(x=>x.id==d.id);if(p)Object.assign(p,d.cfg);else NET.players.push({id:d.id,...d.cfg});if(host)netSend(d,c);break}
 case'lobby':NET.mode=d.mode;NET.players=d.players;renderNet();break;
 case'full':netStatus('That room is full or already playing.');break;
 case'start':netStart(d);break;
 case'p':if(host)netSend(d,c);netRemote(d);break;
 case'w':if(!host)netWorld(d);break;
 case'es':if(!host)for(const a of d.l)shoot({x:a[0],y:a[1],z:a[2],a:a[3],sp:a[4],dmg:0,life:3,f:false,col:a[5],kind:a[6],vy:a[7],vis:true});break;
 case'hit':if(!S||!NET.inGame)break;if(S.kind=='pvp'){if(!P.dead)hurt(d.d)}else if(host){const e=enemies.find(x=>x.nid===d.id);if(e)hitEnemy(e,d.d)}break;
 case'dmg':if(S&&NET.inGame&&!P.dead)hurt(d.d);break;
 case'ban':if(S&&NET.inGame)banner(d.b,d.s,d.c);break;
 case'dead':if(host)netSend(d,c);if(S&&S.kind=='pvp'){NET.kills++;banner('OPPONENT DOWN',`${NET.kills} – ${NET.deaths} · first to 5`,'#5cff78');SFX.level();if(NET.kills>=5){netSend({t:'end',win:NET.peer.id});setTimeout(()=>finishRun(true),1500)}}break;
 case'end':if(host)netSend(d,c);if(S&&NET.inGame&&!S.ended){if(S.kind=='pvp')finishRun(d.win==NET.peer.id);else finishRun(false)}break;
 case'quit':if(host)netSend(d,c);dropRemote(d.id||c.peer);if(S&&S.kind=='pvp'&&NET.inGame&&!S.ended){banner('OPPONENT LEFT','You win the duel','#5cff78');NET.kills=Math.max(NET.kills,5);setTimeout(()=>finishRun(true),1200)}break}}
function renderNet(){const n=netCfg();$('netName').value=n.name||'';$('srvList').innerHTML=NET_SERVERS.map((s,i)=>`<button class="srvb${(n.srv||0)==i?' on':''}" data-srv="${i}"><b>${i+1}. ${s.name}</b><span>${s.desc}</span></button>`).join('')+((n.srv||0)==1?`<div class="rowb"><input id="srv2In" placeholder="https://your-server.onrender.com" value="${(n.srv2||'').replace(/"/g,'')}" style="flex:1"><button class="btn ghost" id="srv2Save">SAVE ADDRESS</button></div>`:'');
 const inRoom=!!NET.role&&!!NET.peer;$('netLeave').hidden=!inRoom;$('netStart').hidden=!(NET.role=='host'&&(NET.mode=='coop'||NET.players.length>=2));
 $('netRoom').innerHTML=inRoom?`<div class="room"><h3>${NET.mode=='pvp'?'PvP duel':'Co-op'} room · ${ARENA_LIST.find(a=>a.id==arenaSel).name}</h3><div class="code">${NET.code}</div><p style="margin:4px 0;color:#fff">Share this code. ${NET.role=='host'?'You are the host.':'The host starts the match.'}</p><ul>${NET.players.map(p=>`<li>${p.id==NET.peer.id?'▶ ':''}${p.name||'Pilot'} · ${p.titan||''}</li>`).join('')}</ul></div>`:''}
$('netOv').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const n=netCfg();
 if(b.dataset.srv){n.srv=+b.dataset.srv;saveProf();renderNet();return}if(b.id=='srv2Save'){let v=$('srv2In').value.trim();if(v&&!/^https?:\/\//.test(v))v='https://'+v;n.srv2=v;saveProf();renderNet();netStatus(v?'Server address saved.':'Server address cleared.');if(v)fetch(v).then(r=>r.json()).then(j=>netStatus(j.game=='titan-forge'?`Server is online · ${j.players} of ${j.max.toLocaleString()} players connected`:'That address is not a Titan Forge server.')).catch(()=>netStatus('Could not reach that server yet. It may be waking up.'));return}
 if(b.id=='hostCoop')hostRoom('coop');else if(b.id=='hostPvp')hostRoom('pvp');else if(b.id=='joinBtn')joinRoom($('joinCode').value);
 else if(b.id=='netLeave'){netReset();renderNet();netStatus('Left the room.')}else if(b.id=='netStart'){const seed=(Math.random()*1e9)|0;const m={t:'start',mode:NET.mode,arena:arenaSel,seed,order:NET.players.map(p=>p.id)};netSend(m);netStart(m)}});
$('netName').addEventListener('change',()=>{netCfg().name=$('netName').value.trim();saveProf()});

function netStart(m){NET.mode=m.mode;NET.kills=NET.deaths=0;NET.slot=Math.max(0,m.order.indexOf(NET.peer.id));arenaSel=m.arena;netSend({t:'cfg',id:NET.peer.id,cfg:myCfg()});
 startRun(m.mode=='pvp'?'pvp':'coop',{arena:m.arena,seed:m.seed});}
function netBegin(kind){NET.inGame=true;NET.ens.clear();NET.nid=0;S.netGuest=kind=='coop'&&NET.role=='guest';S.cont=false;
 if(kind=='pvp'){const sx=NET.slot?1:-1;P.x=sx*45;P.z=0;P.yaw=P.aimYaw=sx>0?-Math.PI/2:Math.PI/2;P.ax=P.x-sx*10;P.az=0;setTimeout(()=>banner('PVP DUEL','First pilot to 5 takedowns wins','#ff3b2e'),2600)}
 else{P.x=(NET.slot-1.5)*8;P.z=10;if(!S.netGuest)nextWave();setTimeout(()=>banner('CO-OP','Fight the army together · downed pilots respawn','#5cff78'),2600)}
 P.m.root.position.set(P.x,0,P.z);camT.set(P.x,0,P.z)}
function getRemote(id){let r=NET.remotes.get(id);if(r)return r;const cfg=NET.players.find(p=>p.id==id)||{chassis:'vanguard',L:'v_rotary',R:'v_lance',glow:0xffffff,paint:'gunmetal',name:'Pilot'};
 const m=buildMech({chassis:cfg.chassis,L:cfg.L,R:cfg.R,glow:cfg.glow,glow2:cfg.glow2,paint:cfg.paint});scene.add(m.root);
 r={id,m,cfg,x:0,z:0,y:0,yaw:0,aim:0,tx:0,tz:0,ty:0,tyaw:0,taim:0,hp:1,max:1,dead:false,fire:false,fT:0,spd:0,init:false};
 if(S&&S.kind=='pvp'){r.rec={type:'pvp',m,x:0,z:0,y:0,r:2.6,hp:1,max:1,pvp:true,dead:false,drop:0,yaw:0,aimYaw:0,stun:0,poison:0,pdps:0,burn:0,slow:0,flash:0,acc:0,accT:0,boss:false,bar:null,nid:-1,isPlayer:true};enemies.push(r.rec)}
 NET.remotes.set(id,r);return r}
function netRemote(d){if(!S||!NET.inGame||d.id==NET.peer.id)return;const r=getRemote(d.id),s=d.s;r.tx=s[0];r.tz=s[1];r.ty=s[2];r.tyaw=s[3];r.taim=s[4];r.hp=s[5];r.max=s[6];r.dead=!!s[7];r.fire=!!s[8];r.spd=s[9];if(!r.init){r.init=true;r.x=r.tx;r.z=r.tz;r.yaw=r.tyaw;r.aim=r.taim}}
function dropRemote(id){const r=NET.remotes.get(id);if(!r)return;disposeMech(r.m);if(r.rec){r.rec.dead=true;dropBar(r.rec)}NET.remotes.delete(id)}
function clearRemotes(){for(const id of[...NET.remotes.keys()])dropRemote(id);NET.ens.clear()}
function updRemotes(dt){const k=1-Math.exp(-dt*12);for(const r of NET.remotes.values()){r.x+=(r.tx-r.x)*k;r.z+=(r.tz-r.z)*k;r.y+=(r.ty-r.y)*k;r.yaw=lerpA(r.yaw,r.tyaw,k);r.aim=lerpA(r.aim,r.taim,k);
 const m=r.m;m.root.visible=!r.dead;m.root.position.set(r.x,r.y,r.z);m.root.rotation.y=r.yaw;m.torso.rotation.y=r.aim-r.yaw;animMech(m,Math.min(r.spd,12),dt);
 if(r.rec){Object.assign(r.rec,{x:r.x,z:r.z,y:r.y,yaw:r.yaw,aimYaw:r.aim,hp:r.hp,max:r.max,gone:r.dead});if(!r.rec.bar)r.rec.bar=mkBar(r.rec,0xff3b2e);updBar(r.rec.bar,r.x,9,r.z,r.dead?.001:r.hp/r.max);if(r.rec.acc>0&&(r.rec.accT-=dt)<=0){dmgNum(r.x,9,r.z,r.rec.acc,'#ffffff');r.rec.acc=0;r.rec.accT=.25}}
 if(r.fire&&!r.dead&&(r.fT-=dt)<=0){r.fT=.13;m.root.updateMatrixWorld(true);for(const side of['L','R'])for(const mz of m.muzzles[side].slice(0,1)){mz.getWorldPosition(_v);shoot({x:_v.x,y:_v.y,z:_v.z,a:r.aim+rnd(-.03,.03),sp:75,dmg:0,life:.6,f:true,col:r.cfg.glow||0xffffff,kind:'tracer',vis:true})}}}}
function netProxyHit(x,z,y,rad,dmg){if(!NET.inGame||NET.role!='host'||!S||S.kind!='coop')return false;for(const r of NET.remotes.values())if(!r.dead&&(x-r.x)**2+(z-r.z)**2<rad*rad&&y<r.y+8){netTo(r.id,{t:'dmg',d:dmg});return true}return false}
function netNear(x,z,d2v){if(!NET.inGame||NET.role!='host')return false;for(const r of NET.remotes.values())if(!r.dead&&(x-r.x)**2+(z-r.z)**2<d2v)return true;return false}
function netWorld(m){if(!S||!S.netGuest)return;S.wave=m.wave;const seen=new Set();
 for(const a of m.en){const[id,type,x,z,y,yaw,aim,hp,max]=a;seen.add(id);let e=NET.ens.get(id);if(!e){e=spawn(type,{x,z});e.net=true;e.nid=id;e.drop=0;e.x=x;e.z=z;NET.ens.set(id,e)}e.tx=x;e.tz=z;e.ty=y;e.tyaw=yaw;e.taim=aim;e.hp=hp;e.max=max}
 for(const[id,e]of NET.ens)if(!seen.has(id)){NET.ens.delete(id);if(!e.dead){e.hp=0;killEnemy(e)}}}
function netEnemyMove(e,dt){const k=1-Math.exp(-dt*10),m=e.m,ox=e.x,oz=e.z;e.x+=((e.tx??e.x)-e.x)*k;e.z+=((e.tz??e.z)-e.z)*k;e.y+=((e.ty??e.y)-e.y)*k;e.yaw=lerpA(e.yaw,e.tyaw??e.yaw,k);e.aimYaw=lerpA(e.aimYaw,e.taim??e.aimYaw,k);
 const sp=Math.hypot(e.x-ox,e.z-oz)/Math.max(dt,1e-3);m.root.position.set(e.x,e.y,e.z);
 if(m.mil){m.root.rotation.y=m.inf||m.heli?e.aimYaw:e.yaw;if(m.tur)m.tur.rotation.y=e.aimYaw-e.yaw;animMil(m,sp,dt)}else if(m.torso){m.root.rotation.y=e.yaw;m.torso.rotation.y=e.aimYaw-e.yaw;animMech(m,Math.min(sp,12),dt)}else{m.root.rotation.y=e.aimYaw}
 if(m.mats.own){const em=m.mats.armor.emissive;if(e.flash>0){e.flash-=dt;em.setRGB(1,1,1)}else em.setRGB(0,0,0)}
 if(!e.boss&&e.hp<e.max){if(!e.bar)e.bar=mkBar(e);updBar(e.bar,e.x,eHeight(e)+2.5,e.z,e.hp/e.max)}
 if(e.acc>0&&(e.accT-=dt)<=0){dmgNum(e.x,eHeight(e)+2,e.z,e.acc,'#ffffff');e.acc=0;e.accT=.25}}
function netTick(dt){if((NET.sendT-=dt)<=0){NET.sendT=1/15;netSend({t:'p',id:NET.peer.id,s:[r1(P.x),r1(P.z),r1(P.y||0),r2(P.yaw),r2(P.aimYaw),Math.round(P.hp),Math.round(P.max),P.dead?1:0,P.firing&&!P.dead?1:0,Math.round(P.spd||0)]})}
 if(NET.role=='host'&&S.kind=='coop'){if((NET.wT-=dt)<=0){NET.wT=.1;netSend({t:'w',wave:S.wave,en:enemies.filter(e=>!e.dead&&!e.pvp).map(e=>{if(e.nid==null)e.nid=++NET.nid;return[e.nid,e.type,r1(e.x),r1(e.z),r1(e.y||0),r2(e.yaw||0),r2(e.aimYaw||0),Math.round(e.hp),Math.round(e.max)]})})}
  if(NET.esBuf.length){netSend({t:'es',l:NET.esBuf.splice(0,40)});NET.esBuf.length=0}
  if(P.dead&&NET.remotes.size&&[...NET.remotes.values()].every(r=>r.dead)&&!S.ended){netSend({t:'end'});finishRun(false);return}if(P.dead&&!NET.remotes.size&&!S.ended){netSend({t:'end'});finishRun(false);return}}
 updRemotes(dt);
 if(P.dead&&(P.respawnT-=dt)<=0){P.dead=false;P.hp=P.max;P.inv=2.5;P.en=P.enMax||100;if(S.kind=='pvp'){const sx=NET.slot?1:-1;P.x=sx*rnd(30,60);P.z=rnd(-40,40)}else{const al=[...NET.remotes.values()].find(r=>!r.dead);if(al){P.x=al.x+rnd(-8,8);P.z=al.z+rnd(-8,8)}}P.m.root.visible=!cock;P.m.root.position.set(P.x,0,P.z);ring(P.x,P.z,P.glow,1,10,.5);banner('BACK IN THE FIGHT','','#5cff78')}}

/* ================= save & load ================= */
const SLOTS=3,slotKey=i=>'tf3d_slot'+i;
function readSlot(i){try{return JSON.parse(localStorage.getItem(slotKey(i)))}catch(e){return null}}
function saveSummary(p){const ri=rankOf(p.pxp||0);return`${RANKS[ri][0]} · ${(p.bank||0).toLocaleString()} scrap · mission ${Math.min((p.camp||0)+1,MISSIONS.length)}/${MISSIONS.length} · pass tier ${Math.min(50,Math.floor((p.sp||0)/100))}`}
const encSave=()=>btoa(unescape(encodeURIComponent(JSON.stringify({v:1,game:'titan-forge',at:Date.now(),prof}))));
function decSave(txt){txt=(txt||'').trim();let o;try{o=JSON.parse(txt)}catch(e){try{o=JSON.parse(decodeURIComponent(escape(atob(txt.replace(/\s+/g,'')))))}catch(e2){return null}}if(o&&o.game=='titan-forge'&&o.prof&&typeof o.prof=='object')return o.prof;if(o&&o.t&&o.unl)return o;return null}
let saveAsk=null;
function askSave(text,fn){saveAsk=fn;$('scText').textContent=text;$('saveConfirm').classList.remove('hide')}
function saveStat(t){$('saveStat').textContent=t}
function renderSave(){$('saveConfirm').classList.add('hide');const inRun=!!S&&state!='menu';
 $('slotList').innerHTML=Array.from({length:SLOTS},(_,k)=>{const i=k+1,s=readSlot(i);return`<div class="slot"><div><b>Slot ${i}${s?' · '+new Date(s.at).toLocaleString([],{dateStyle:'medium',timeStyle:'short'}):''}</b><span>${s?saveSummary(s.prof):'Empty'}</span></div><button class="btn" data-save="${i}">SAVE</button><button class="btn ghost" data-load="${i}" ${s?'':'disabled'}>LOAD</button></div>`}).join('');
 saveStat(inRun?'Scrap earned in the current run is added to your bank when the run ends, so save after the run to include it.':'')}
function applyLoad(p,label){if(S&&state!='menu')toHangar();replaceProf(JSON.parse(JSON.stringify(p)));renderHangar();renderQ();renderRank();renderSave();saveStat(`Loaded ${label}.`);toast('Save loaded');SFX.level()}
$('saveOv').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.save){const i=+b.dataset.save,write=()=>{try{localStorage.setItem(slotKey(i),JSON.stringify({at:Date.now(),prof}));renderSave();saveStat(`Saved to slot ${i}.`);toast('Game saved');SFX.ui()}catch(err){saveStat('This browser would not store the save. Use COPY SAVE CODE instead.')}};readSlot(i)?askSave(`Overwrite slot ${i}?`,write):write()}
 else if(b.dataset.load){const i=+b.dataset.load,s=readSlot(i);if(s)askSave(`Load slot ${i}? Your current progress is replaced unless you save it first.`,()=>applyLoad(s.prof,'slot '+i))}
 else if(b.id=='scYes'){const f=saveAsk;saveAsk=null;$('saveConfirm').classList.add('hide');if(f)f()}else if(b.id=='scNo'){saveAsk=null;$('saveConfirm').classList.add('hide')}
 else if(b.id=='expCopy'){const c=encSave();$('impText').value=c;(navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).then(()=>saveStat('Save code copied. Keep it somewhere safe.'),()=>{$('impText').select();saveStat('Copy the code from the box below.')})}
 else if(b.id=='expFile'){const blob=new Blob([JSON.stringify({v:1,game:'titan-forge',at:Date.now(),prof},null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`titan-forge-save-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();saveStat('Save file downloaded. If nothing downloaded, use COPY SAVE CODE instead.')}
 else if(b.id=='impCode'){if($('impText').value.trim().toLowerCase()=='adv6789'){$('impText').value='';adminOn();saveStat('Admin button unlocked.');return}const p=decSave($('impText').value);if(!p){saveStat('That is not a valid Titan Forge save code.');return}askSave('Load this save code? Your current progress is replaced.',()=>applyLoad(p,'the save code'))}});
$('impFile').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const p=decSave(await f.text());if(!p){saveStat('That file is not a Titan Forge save.');return}askSave(`Load ${f.name}? Your current progress is replaced.`,()=>applyLoad(p,f.name))});
$('saveBtn2').onclick=()=>{renderSave();show('saveOv')};
$('saveBack').addEventListener('click',e=>{if(S&&state!='menu'){e.stopImmediatePropagation();show('pauseOv')}},true);

/* ================= achievements ================= */
const ACH_DEF=[['kills','⚔','Titan slayer','Defeat {n} enemies',[100,500,1000,5000]],['inf','🪖','Boots on the ground','Defeat {n} infantry',[50,250,1000]],['veh','🚙','Scrap dealer','Destroy {n} army vehicles',[25,100,500]],['heli','🚁','Air defence','Shoot down {n} helicopters',[10,50,200]],
 ['bosses','👑','Boss hunter','Defeat {n} bosses',[1,10,50]],['outposts','🚩','Conqueror','Capture {n} outposts',[5,25,100]],['drops','📦','Supply runner','Collect {n} supply drops',[10,50]],['quests','📜','Quest master','Complete {n} quests',[10,50,200]],
 ['runs','🎮','Veteran','Play {n} runs',[10,50,250]],['wave','🌊','Wave rider','Reach level {n} in Levels mode',[10,20,30]],['km','🛣','Road warrior','Travel {n} km',[10,100,500]],['scrap','⚙','Scrap baron','Bank {n} scrap in total',[50000,250000,1000000]],
 ['titans','🤖','Collector','Own {n} titans',[5,10,20]],['skins','🎨','Fashionista','Own {n} unlockable skins',[5,15]],['fin','💥','Finisher','Do {n} finishers',[10,100]],['crates','🎁','Crate cracker','Open {n} crates',[5,25]],
 ['spins','🎡','Lucky pilot','Spin the lucky wheel {n} times',[7,30]],['wboss','🌋','World saver','Defeat {n} world bosses',[1,5]],['nodmg','🛡','Untouchable','Clear {n} level without taking damage',[1]],['rank','🎖','Top brass','Reach pilot rank {n} (General)',[9]]];
const ACH=[];for(const[k,ic,nm,ds,tiers]of ACH_DEF)tiers.forEach((n,i)=>ACH.push({id:k+i,k,ic,name:nm+(tiers.length>1?' '+['I','II','III','IV'][i]:''),desc:ds.replace('{n}',n.toLocaleString()),n,coins:[10,25,50,100][i]||10,scrap:[500,2000,5000,15000][i]||500}));
function statVal(k){const st=prof.st||{};if(k=='titans')return TITANS.filter(t=>ownT(t)).length;if(k=='skins')return Object.keys(prof.skins||{}).length;if(k=='rank')return rankOf(prof.pxp||0)+1;return st[k]||0}
function stat(k,n=1){const st=prof.st||(prof.st={});st[k]=(st[k]||0)+n;if(!stat.t){stat.t=setTimeout(()=>{stat.t=0;checkAch()},600)}return 0}
function checkAch(){const a=prof.ach||(prof.ach={});for(const x of ACH)if(!a[x.id]&&statVal(x.k)>=x.n){a[x.id]=1;toast(`🏅 Achievement unlocked: ${x.name}`);SFX.level()}saveProf()}
function renderAch(){checkAch();const a=prof.ach||{},c=prof.achC||{},done=ACH.filter(x=>a[x.id]).length;$('achHead').textContent=`${done} / ${ACH.length} unlocked · claim rewards for each one`;
 $('achBody').innerHTML=ACH.map(x=>{const v=Math.min(statVal(x.k),x.n),ok=a[x.id];return`<div class="ach${ok?' done':' lock'}"><i>${x.ic}</i><div><b>${x.name}</b><span>${x.desc}</span><div class="bar"><i style="width:${v/x.n*100}%"></i></div><span>${typeof v=='number'?v.toLocaleString():v} / ${x.n.toLocaleString()} · 🪙 ${x.coins} + ${x.scrap.toLocaleString()} scrap</span></div>${ok?(c[x.id]?'<button class="btn ghost" disabled>✓</button>':`<button class="btn" data-ach="${x.id}">CLAIM</button>`):''}</div>`}).join('')}
$('achOv').addEventListener('click',e=>{const b=e.target.closest('[data-ach]');if(!b)return;const x=ACH.find(q=>q.id==b.dataset.ach),c=prof.achC||(prof.achC={});if(c[x.id])return;c[x.id]=1;addCoins(x.coins);prof.bank=(prof.bank||0)+x.scrap;saveProf();renderBank();renderRank();SFX.level();renderAch()});

/* ================= lucky spin ================= */
const WHEEL=[['500 scrap',{scrap:500},'#3a4352'],['25 coins',{coins:25},'#8a6a10'],['2,000 scrap',{scrap:2000},'#2c5a7a'],['100 coins',{coins:100},'#a07a10'],['5,000 scrap',{scrap:5000},'#3a6a3a'],['Random skin',{skin:1},'#7a2c8a'],['1,000 scrap',{scrap:1000},'#4a3a62'],['250 coins',{coins:250},'#c08a10']];
let spinRot=0,spinning=false;
const today=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/DAY);
function drawWheel(){const c=$('wheel'),x=c.getContext('2d'),N=WHEEL.length,R=200;x.clearRect(0,0,420,420);x.save();x.translate(210,210);for(let i=0;i<N;i++){const a0=i/N*TAU-Math.PI/2-Math.PI/N,a1=a0+TAU/N;x.beginPath();x.moveTo(0,0);x.arc(0,0,R,a0,a1);x.closePath();x.fillStyle=WHEEL[i][2];x.fill();x.strokeStyle='#ffd23a';x.lineWidth=3;x.stroke();x.save();x.rotate(a0+TAU/N/2);x.fillStyle='#fff';x.font='bold 19px Oxanium,sans-serif';x.textAlign='right';x.fillText(WHEEL[i][0],R-14,7);x.restore()}x.beginPath();x.arc(0,0,26,0,TAU);x.fillStyle='#111';x.fill();x.strokeStyle='#ffd23a';x.stroke();x.restore()}
function renderSpin(){drawWheel();const free=prof.spinD!==today();$('spinGo').textContent=free?'FREE DAILY SPIN':'SPIN AGAIN · 🪙 200';$('spinMsg').textContent=free?'You have a free spin today.':'Free spin used today. Come back tomorrow, or spin again for 200 coins.'}
$('spinGo').onclick=()=>{if(spinning)return;const free=prof.spinD!==today();if(!free){if((prof.coins||0)<200){toast('Need 200 Forge Coins');SFX.hit();return}prof.coins-=200}else prof.spinD=today();
 const N=WHEEL.length,w=[18,16,16,10,8,6,16,10],tot=w.reduce((a,b)=>a+b),r=Math.random()*tot;let i=0,acc=0;for(;i<N;i++){acc+=w[i];if(r<acc)break}i=Math.min(i,N-1);
 spinning=true;spinRot+=360*6+((360-i*360/N)-(spinRot%360)+360)%360;$('wheel').style.transform=`rotate(${spinRot}deg)`;$('spinMsg').textContent='Spinning…';SFX.boost();stat('spins');saveProf();
 setTimeout(()=>{spinning=false;const R=WHEEL[i][1];let msg='';if(R.scrap){prof.bank=(prof.bank||0)+R.scrap;msg=`+${R.scrap.toLocaleString()} scrap`}else if(R.coins){addCoins(R.coins);msg=`+${R.coins} Forge Coins`}else{const pool=PAINTS.filter(p=>p.lock&&!(prof.skins||{})[p.id]);if(pool.length){const p=pool[Math.random()*pool.length|0];(prof.skins||(prof.skins={}))[p.id]=1;msg=`New skin: ${p.name}`}else{addCoins(300);msg='You own every skin, so +300 coins instead'}}
  saveProf();renderBank();renderRank();SFX.level();renderSpin();$('spinMsg').textContent='🎉 '+msg},4300)};

/* ================= mystery crates ================= */
const CRATES=[{id:'std',name:'Standard crate',icon:'📦',price:1000,desc:'60% scrap (5k–20k) · 25% coins (500–1,500) · 15% a skin.'},{id:'leg',name:'Legendary crate',icon:'💎',price:5000,desc:'50% a skin · 15% a shop-exclusive titan · 35% coins (2k–6k).'}];
function openCrate(id){const c=CRATES.find(x=>x.id==id);if((prof.coins||0)<c.price){toast(`Need ${(c.price-(prof.coins||0)).toLocaleString()} more Forge Coins`);SFX.hit();return}prof.coins-=c.price;stat('crates');
 const r=Math.random(),skins=PAINTS.filter(p=>p.lock&&!(prof.skins||{})[p.id]),ex=TITANS.filter(t=>t.price&&t.price.coins&&!ownT(t));let msg;
 const giveSkin=()=>{if(!skins.length){addCoins(1000);return'You own every skin, so +1,000 coins'}const p=skins[Math.random()*skins.length|0];(prof.skins||(prof.skins={}))[p.id]=1;return`🎨 Skin: ${p.name}`};
 if(id=='std'){if(r<.6){const v=Math.round(rnd(5,20))*1000;prof.bank=(prof.bank||0)+v;msg=`⚙ ${v.toLocaleString()} scrap`}else if(r<.85){const v=Math.round(rnd(5,15))*100;addCoins(v);msg=`🪙 ${v.toLocaleString()} Forge Coins`}else msg=giveSkin()}
 else{if(r<.5)msg=giveSkin();else if(r<.65&&ex.length){const t=ex[Math.random()*ex.length|0];(prof.titans||(prof.titans={}))[t.id]=1;msg=`🤖 TITAN: ${t.name}!`}else{const v=Math.round(rnd(2,6))*1000;addCoins(v);msg=`🪙 ${v.toLocaleString()} Forge Coins`}}
 saveProf();renderBank();renderRank();renderRoster();renderStore();$('crateH').textContent='Opening '+c.name+'…';$('crateBox').textContent=c.icon;$('crateBox').classList.remove('open');$('crateMsg').textContent='';$('crateOk').hidden=true;$('crateOv').classList.remove('hide');SFX.boost();
 setTimeout(()=>{$('crateBox').classList.add('open');$('crateBox').textContent='✨';$('crateH').textContent='You got';$('crateMsg').textContent=msg;$('crateOk').hidden=false;SFX.level()},1600)}
$('crateOk').onclick=()=>$('crateOv').classList.add('hide');

/* ================= showroom ================= */
function ownedIdx(){return TITANS.map((t,i)=>i).filter(i=>ownT(TITANS[i]))}
function openRoom(){show('menu');document.body.classList.add('showroom');$('roomUI').classList.remove('hide');renderRoomCard()}
function renderRoomCard(){const t=TITANS[sel],p=tp(t.id),lv=levelOf(p.xp),evo=lv>=LEVELS.length;$('roomCard').innerHTML=`<b>${t.name}${evo?' <span class="evo">Mk II</span>':''}</b><span>${t.tag} · level ${lv} · armour ${Math.round(t.hp*(evo?1.2:1))} · speed ${t.spd} · ability: ${t.abil}</span><br><span>${ownedIdx().indexOf(sel)+1} of ${ownedIdx().length} titans you own</span>`}
function roomStep(d){const L=ownedIdx();let i=L.indexOf(sel);i=(i+d+L.length)%L.length;const card=document.querySelector(`.tcard[data-i="${L[i]}"]`);if(card)card.click();renderRoomCard()}
$('roomPrev').onclick=()=>roomStep(-1);$('roomNext').onclick=()=>roomStep(1);$('roomExit').onclick=()=>{document.body.classList.remove('showroom');$('roomUI').classList.add('hide')};

/* ================= trading ================= */
const tSum=s=>{let h=7;for(const ch of s)h=(h*31+ch.charCodeAt(0))%46655;return h.toString(36).toUpperCase().padStart(3,'0')};
function renderTrade(){const mine=PAINTS.filter(p=>p.lock&&(prof.skins||{})[p.id]);$('tradeSkin').innerHTML=mine.length?mine.map(p=>`<option value="${p.id}">${p.name}</option>`).join(''):'<option value="">You have no tradable skins yet</option>';$('tradeMsg').textContent=''}
$('tradeMake').onclick=()=>{const id=$('tradeSkin').value;if(!id||!(prof.skins||{})[id])return;const body=`TF-${id.toUpperCase()}-${rcode()}`;const code=body+'-'+tSum(body);delete prof.skins[id];saveProf();$('tradeOut').value=code;renderTrade();$('tradeMsg').textContent='Code made. The skin has left your account. Send the code to your friend.';(navigator.clipboard?navigator.clipboard.writeText(code):Promise.reject()).catch(()=>{})};
$('tradeRedeem').onclick=()=>{const code=$('tradeIn').value.trim().toUpperCase(),m=code.match(/^(TF-([A-Z]+)-[A-Z0-9]{5})-([A-Z0-9]{3})$/);if(!m||tSum(m[1])!==m[3]){$('tradeMsg').textContent='That trade code is not valid.';return}
 const id=m[2].toLowerCase(),p=PAINTS.find(x=>x.id==id&&x.lock);const used=prof.usedTrades||(prof.usedTrades={});if(!p||used[code]){$('tradeMsg').textContent=used[code]?'That code was already redeemed here.':'Unknown skin in that code.';return}
 used[code]=1;(prof.skins||(prof.skins={}))[id]=1;saveProf();$('tradeIn').value='';renderTrade();$('tradeMsg').textContent=`You received the ${p.name} skin!`;SFX.level()};

/* ================= titan fusion ================= */
function fuseName(a,b){return a.name.slice(0,Math.ceil(a.name.length/2))+b.name.slice(Math.floor(b.name.length/2)).toLowerCase()}
function addFusion(a,b){const A=TITANS.find(t=>t.id==a),Bt=TITANS.find(t=>t.id==b);if(!A||!Bt)return null;const id='fx_'+a+'_'+b;if(TITANS.some(t=>t.id==id))return TITANS.find(t=>t.id==id);
 const mix=(c1,c2)=>{const r=((c1>>16&255)+(c2>>16&255))>>1,g=((c1>>8&255)+(c2>>8&255))>>1,bl=((c1&255)+(c2&255))>>1;return r<<16|g<<8|bl};
 const t={id,name:fuseName(A,Bt),tag:`Fusion · ${A.name} × ${Bt.name}`,glow:mix(A.glow,Bt.glow),glow2:Bt.glow,img:null,base:A.base||A.id,ab:A.ab||A.id,scale:Math.max(A.scale||1,Bt.scale||1)*1.04,hp:Math.round((A.hp+Bt.hp)/2*1.15),spd:Math.round((A.spd+Bt.spd)/2*10)/10,cd:Math.min(A.cd,Bt.cd),L:A.L,R:Bt.L,paint:Bt.paint,stats:A.stats.map((v,i)=>Math.min(1,(v+Bt.stats[i])/2+.08)),price:{fusion:1},par:[a,b],desc:`A fusion of ${A.name} and ${Bt.name}. It carries both armouries and uses ${A.name}'s ${A.abil}.`,abil:A.abil,abilTxt:A.abilTxt};
 ARMORY[id]={w:[...new Set([...ARMORY[a].w,...ARMORY[b].w])],u:[...new Set([...ARMORY[a].u,...ARMORY[b].u])],m:[...new Set([...ARMORY[a].m,...ARMORY[b].m])]};TITANS.push(t);
 try{t.snap=snapshot({chassis:t.id,L:t.L,R:t.R,glow:t.glow,glow2:t.glow2,paint:t.paint,scale:1/t.scale})}catch(e){}return t}
for(const f of(prof.fusions||[]))addFusion(f[0],f[1]);
function renderFuse(){const L=TITANS.filter(t=>ownT(t)&&!t.par);const opt=L.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');const a=$('fuseA').value,b=$('fuseB').value;$('fuseA').innerHTML=opt;$('fuseB').innerHTML=opt;if(a)$('fuseA').value=a;if(b)$('fuseB').value=b;else if(L[1])$('fuseB').value=L[1].id;fusePrev()}
function fusePrev(){const A=TITANS.find(t=>t.id==$('fuseA').value),Bt=TITANS.find(t=>t.id==$('fuseB').value);if(!A||!Bt||A===Bt){$('fusePrev').innerHTML='<h3>Pick two different titans</h3>';return}const id='fx_'+A.id+'_'+Bt.id,ex=TITANS.some(t=>t.id==id);
 $('fusePrev').innerHTML=`<h3>${fuseName(A,Bt)}</h3><p style="margin:0">Armour ${Math.round((A.hp+Bt.hp)/2*1.15)} · speed ${Math.round((A.spd+Bt.spd)/2*10)/10} · ability ${A.abil} · ${new Set([...ARMORY[A.id].w,...ARMORY[Bt.id].w]).size} weapons${ex?' · <b style="color:#5cff78">already fused</b>':''}</p>`}
$('fuseA').onchange=fusePrev;$('fuseB').onchange=fusePrev;
$('fuseGo').onclick=()=>{const a=$('fuseA').value,b=$('fuseB').value;if(!a||!b||a==b){$('fuseMsg').textContent='Pick two different titans.';return}if(TITANS.some(t=>t.id=='fx_'+a+'_'+b)){$('fuseMsg').textContent='You already made that fusion.';return}
 if((prof.bank||0)<50000||(prof.coins||0)<2000){$('fuseMsg').textContent='You need 50,000 scrap and 2,000 Forge Coins.';SFX.hit();return}prof.bank-=50000;prof.coins-=2000;(prof.fusions||(prof.fusions=[])).push([a,b]);const t=addFusion(a,b);(prof.titans||(prof.titans={}))[t.id]=1;saveProf();renderBank();renderRank();renderRoster();fusePrev();$('fuseMsg').textContent=`${t.name} was born! Find it at the bottom of your titan list.`;SFX.level()};

/* ================= weapon mods ================= */
const MODS=[['scope','Precision scope','Faster shots, longer range, tighter spread',2000],['barrel','Heavy barrel','+15% damage',3000],['core','Elemental core','Adds burn, poison or stun',4000]];
const modOf=id=>(prof.mods||(prof.mods={}))[id]||(prof.mods[id]={});
function modW(id){const W=WEAPONS[id];if(!W||W.kind=='melee')return W;const m=(prof.mods||{})[id];if(!m||!(m.scope||m.barrel||m.core))return W;S.wc=S.wc||{};if(S.wc[id])return S.wc[id];const X={...W};
 if(m.barrel)X.dmg=(X.dmg||0)*1.15;if(m.scope){if(X.sp)X.sp*=1.25;if(X.life)X.life*=1.2;if(X.range)X.range*=1.2;if(X.spread)X.spread*=.6}if(m.core=='burn')X.burn=1;else if(m.core=='poison')X.poison=Math.max(X.poison||0,10);else if(m.core=='stun')X.stun=Math.max(X.stun||0,.4);return S.wc[id]=X}
function modsHTML(t,c){return`<h3>Weapon mods · ${t.name}</h3><p class="desc">Mods belong to the weapon and stay on it for every run.</p>`+['L','R'].map(sd=>{const id=c[sd],W=WEAPONS[id],m=modOf(id);if(!W||W.kind=='melee')return`<div class="core panel"><div><b>${sd=='L'?'Left':'Right'} arm · ${W?W.name:''}</b><span>Melee weapons can't take mods.</span></div></div>`;
 return`<div class="core panel"><div><b>${sd=='L'?'Left':'Right'} arm · ${W.name}</b><span>${MODS.map(([k,n])=>`${m[k]?'✓':'·'} ${n}${k=='core'&&m.core?' ('+m.core+')':''}`).join(' &nbsp; ')}</span></div><div style="display:flex;flex-direction:column;gap:4px">${MODS.map(([k,n,ds,c2])=>k=='core'?['burn','poison','stun'].map(el=>`<button class="btn sm${m.core==el?' ghost':''}" data-mod="${id}|core|${el}" ${m.core==el?'disabled':''}>${el.toUpperCase()} CORE · ${c2.toLocaleString()}</button>`).join(''):`<button class="btn sm" data-mod="${id}|${k}" ${m[k]?'disabled':''}>${m[k]?n+' ✓':n.toUpperCase()+' · '+c2.toLocaleString()}</button>`).join('')}</div></div>`}).join('')}
$('menu').addEventListener('click',e=>{const b=e.target.closest('[data-mod]');if(!b)return;e.stopPropagation();const[id,k,el]=b.dataset.mod.split('|'),c=MODS.find(x=>x[0]==k)[3];if((prof.bank||0)<c){toast(`Need ${(c-(prof.bank||0)).toLocaleString()} more scrap`);SFX.hit();return}prof.bank-=c;const m=modOf(id);if(k=='core')m.core=el;else m[k]=1;saveProf();renderBank();renderTab();SFX.level();toast('Mod installed')},true);

/* ================= avatars: ejected pilot & stolen vehicles ================= */
const AV={pilot:{spd:9,hp:60,r:1,rate:.13,dmg:7,sp:70,kind:'tracer',col:0xffd070,cam:1},jeep:{spd:34,hp:220,r:2.4,rate:.08,dmg:8,sp:74,kind:'tracer',col:0xffd070},tank:{spd:15,hp:650,r:3,rate:1.1,dmg:75,sp:48,kind:'orb',col:0xff8a30,splash:5}};
function avStart(type,mesh){const p=P,d=AV[type];p.av={type,m:mesh,fcd:0,t:25,yaw:p.yaw};p.thp=p.hp;p.tmax=p.max;p.hp=p.max=d.hp;p.m.root.visible=false;if(!mesh.parent)scene.add(mesh.root||mesh)}
function avClear(){const p=P;if(!p||!p.av)return;const av=p.av;p.av=null;if(av.type=='pilot'){scene.remove(av.m.root);if(av.beacon)scene.remove(av.beacon)}p.max=p.tmax||p.max;p.m.root.visible=!cock}
function avExit(destroyed){const p=P,av=p.av;if(!av)return;const r=av.m.root;if(destroyed){explode(p.x,1.5,p.z,2,0xff7a2a);scene.remove(r)}else{S.parked.push({type:av.type,m:av.m,x:p.x,z:p.z})}
 p.av=null;p.max=p.tmax;p.hp=p.thp;p.m.root.visible=!cock;let x=p.x+Math.sin(av.yaw+Math.PI/2)*6,z=p.z+Math.cos(av.yaw+Math.PI/2)*6;if(blockHit(x,z,1,2.2)){x=p.x;z=p.z}p.x=x;p.z=z;p.m.root.position.set(x,0,z);p.inv=1;banner(destroyed?'VEHICLE DESTROYED':'BACK IN YOUR TITAN','',destroyed?'#ff3b2e':'#5cff78')}
function nearVehicle(){if(!S||!S.parked||!P||P.av)return null;let b=null,bd=100;for(const v of S.parked){const dd=(v.x-P.x)**2+(v.z-P.z)**2;if(dd<bd){bd=dd;b=v}}return b}
function boardToggle(){if(P.av){if(P.av.type!='pilot')avExit(false);return}const v=nearVehicle();if(!v){toast('Walk up to a parked army jeep or tank and press B');return}S.parked.splice(S.parked.indexOf(v),1);P.x=v.x;P.z=v.z;avStart(v.type,v.m);P.av.yaw=v.m.root.rotation.y;banner(v.type=='tank'?'TANK STOLEN':'JEEP STOLEN','B to get back in your titan','#5cff78');SFX.boost()}
function ejectPilot(){const p=P;say('Ejecting. Get to the beacon.');p.ejected=true;explode(p.x,3,p.z,2.6,p.glow);G.shake=1;const m=buildSoldier('soldier',W.id=='desert');m.root.scale.setScalar(1.3);avStart('pilot',m);p.inv=1.5;
 let bx,bz,t=0;do{const a=rnd(0,TAU);bx=clamp(p.x+Math.cos(a)*40,-ARENA+8,ARENA-8);bz=clamp(p.z+Math.sin(a)*40,-ARENA+8,ARENA-8)}while(t++<20&&blockHit(bx,bz,1,3));
 const g=new THREE.Group();g.position.set(bx,0,bz);part(cyl(.5,.5,60,8),addMat(0x5cff78,.3),0,30,0,g);part(geo('capR',()=>new THREE.TorusGeometry(14,.25,6,48)),glow(0x5cff78,2),0,.3,0,g,Math.PI/2);scene.add(g);p.av.beacon=g;p.av.bx=bx;p.av.bz=bz;
 banner('PILOT EJECTED','Run to the green beacon in 25 seconds for a new titan','#ffd23a');SFX.alarm()}
function avAim(p){if(camMode=='pilot'){p.ax=p.x+Math.sin(camYaw)*30;p.az=p.z+Math.cos(camYaw)*30}else if(aStick){const dx=aStick.x-aStick.ox,dy=aStick.y-aStick.oy;if(Math.hypot(dx,dy)>10){const a=Math.atan2(dx,dy);p.ax=p.x+Math.sin(a)*16;p.az=p.z+Math.cos(a)*16}}
 else if(mouse.on){ndc.set(mouse.x/stage.clientWidth*2-1,-(mouse.y/stage.clientHeight)*2+1);ray.setFromCamera(ndc,camera);if(ray.ray.intersectPlane(aimPlane,hitP)){p.ax=hitP.x;p.az=hitP.z}}if(GP.on&&(GP.rx||GP.ry)){const a=Math.atan2(GP.rx,GP.ry);p.ax=p.x+Math.sin(a)*18;p.az=p.z+Math.cos(a)*18}}
function updAvatar(p,dt){const av=p.av,d=AV[av.type],m=av.m;let ix=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0),iz=(K.KeyS||K.ArrowDown?1:0)-(K.KeyW||K.ArrowUp?1:0);
 if(camMode=='pilot'){const f=-iz,s=ix;ix=Math.sin(camYaw)*f-Math.cos(camYaw)*s;iz=Math.cos(camYaw)*f+Math.sin(camYaw)*s}
 if(mStick){const dx=mStick.x-mStick.ox,dy=mStick.y-mStick.oy,l=Math.hypot(dx,dy);if(l>8){ix=dx/Math.max(l,55);iz=dy/Math.max(l,55)}}if(GP.on&&(GP.lx||GP.ly)){ix=GP.lx;iz=GP.ly}
 const l=Math.hypot(ix,iz);if(l>1){ix/=l;iz/=l}const k=1-Math.exp(-dt*(av.type=='pilot'?10:3));p.vx=(p.vx||0)+(ix*d.spd-(p.vx||0))*k;p.vz=(p.vz||0)+(iz*d.spd-(p.vz||0))*k;
 const vs=Math.hypot(p.vx,p.vz),n=Math.max(1,Math.ceil(vs*dt/1));for(let i=0;i<n;i++){p.x+=p.vx*dt/n;p.z+=p.vz*dt/n;p.x=clamp(p.x,-ARENA+2,ARENA-2);p.z=clamp(p.z,-ARENA+2,ARENA-2);if(av.type=='tank'&&vs>8)ramCovers(p);pushOut(p,d.r)}p.spd=vs;S.dist=(S.dist||0)+vs*dt;
 if(vs>1)av.yaw=lerpA(av.yaw,Math.atan2(p.vx,p.vz),Math.min(1,dt*(av.type=='pilot'?12:4)));avAim(p);const aim=Math.atan2(p.ax-p.x,p.az-p.z);p.aimYaw=aim;p.yaw=av.yaw;
 m.root.position.set(p.x,0,p.z);if(m.inf){m.root.rotation.y=aim}else{m.root.rotation.y=av.yaw;if(m.tur)m.tur.rotation.y=aim-av.yaw}animMil(m,vs,dt);
 if(av.type=='jeep'&&vs>18){for(const e of enemies)if(live(e)&&ET[e.type].inf&&d2(e,p)<12)killEnemy(e)}
 const firing=(mouse.down||autoFire||GP.fire||(aStick&&Math.hypot(aStick.x-aStick.ox,aStick.y-aStick.oy)>10))&&state!='won';
 if(firing&&(av.fcd-=dt)<=0){av.fcd=d.rate;const h=av.type=='tank'?2.6:av.type=='jeep'?2.2:1.6,mx=p.x+Math.sin(aim)*(av.type=='tank'?4:1.5),mz=p.z+Math.cos(aim)*(av.type=='tank'?4:1.5);const s={x:mx,y:h,z:mz,a:aim+rnd(-.03,.03),sp:d.sp,dmg:d.dmg*dmgMul(),life:av.type=='tank'?1.4:.8,f:true,col:d.col,kind:d.kind};if(d.splash){s.splash=d.splash;s.r=.6}shoot(s);if(av.type=='tank'){flash(mx,h,mz,0xffa040,300,.15);SFX.fission();G.shake=Math.max(G.shake,.25)}else SFX.rotary()}
 else if(!firing)av.fcd=Math.min(av.fcd,0);
 if(av.type=='pilot'){av.t-=dt;av.beacon.rotation.y+=dt;if((av.bx-p.x)**2+(av.bz-p.z)**2<64){scene.remove(av.beacon);scene.remove(m.root);p.av=null;p.max=p.tmax;p.hp=p.tmax*.5;p.m.root.visible=!cock;p.m.root.position.set(p.x,0,p.z);p.inv=2.5;ring(p.x,p.z,p.glow,1,12,.6);flash(p.x,6,p.z,p.glow,900,.3);banner('NEW TITAN DROPPED','Back in the fight at half armour','#5cff78');SFX.level()}else if(av.t<=0){p.hp=0;die()}}}

/* ================= open world extras: parked vehicles, home base, treasure, world boss ================= */
function setupExtras(){S.parked=[];const des=W.id=='desert';for(let i=0;i<10;i++){const type=i<6?'jeep':'tank',p=poiSpot(50),m=type=='jeep'?buildJeep(des):buildTank(des);m.root.position.set(p.x,0,p.z);m.root.rotation.y=rnd(0,TAU);scene.add(m.root);S.parked.push({type,m,x:p.x,z:p.z})}
 const B=baseInfo();let bx=-40,bz=-40;for(let t=0;t<40&&(coversNear(bx,bz,24).some(c=>!c.dead)||W.hazards.some(h=>Math.hypot(h.x-bx,h.z-bz)<h.r+22));t++){bx=rnd(-120,120);bz=rnd(-120,120)}const core=mkObj('core',bx,bz);core.base=true;core.max=core.hp=1500+B.lvl*700;objs.push(core);S.base={x:bx,z:bz,core,t:60,raid:150,off:false,tur:[]};
 for(let i=0;i<B.lvl;i++){const a=i/B.lvl*TAU,tu=mkObj('turret',bx+Math.cos(a)*14,bz+Math.sin(a)*14);tu.t=1e9;tu.hp=tu.max=900;objs.push(tu);S.base.tur.push(tu)}
 const g=new THREE.Group();g.position.set(bx,0,bz);part(geo('baseR',()=>new THREE.TorusGeometry(20,.3,6,64)),glow(0x31c4ff,2),0,.3,0,g,Math.PI/2);scene.add(g);S.base.g=g;
 S.treasure=[];for(let i=0;i<12;i++){const p=poiSpot(60),t=new THREE.Group();t.position.set(p.x,0,p.z);part(facet(1.4,1,1,.15,.85,1),paintMats('desert').armor2,0,.5,0,t);part(rbox(1.45,.12,1.05,.03),glow(0xffd23a,1.6),0,.75,0,t);scene.add(t);S.treasure.push({x:p.x,z:p.z,g:t})}
 const key=Math.floor(Date.now()/(30*6e4));S.wbT=prof.wbKey===key?-1:25;S.wbKey=key}
function clearExtras(){if(!S)return;for(const v of S.parked||[])scene.remove(v.m.root);S.parked=[];if(S.base&&S.base.g)scene.remove(S.base.g);for(const t of S.treasure||[])scene.remove(t.g);S.treasure=[];if(P&&P.av){if(P.av.beacon)scene.remove(P.av.beacon);if(P.av.m)scene.remove(P.av.m.root);P.av=null}}
const baseInfo=()=>{const lvl=(prof.base&&prof.base.lvl)||1;return{lvl,income:lvl*25,cost:lvl>=5?0:[0,20000,40000,80000,160000][lvl]}};
function renderBase(){const B=baseInfo();$('baseBody').innerHTML=`<h3>Base level ${B.lvl} / 5</h3><ul><li>${B.lvl} defence turret${B.lvl>1?'s':''}</li><li>Core armour ${(1500+B.lvl*700).toLocaleString()}</li><li>Income ${B.income} scrap a minute</li><li>Repair zone inside the blue ring</li></ul>${B.cost?`<p style="margin:0">Next level: +1 turret, more core armour, +25 scrap a minute.</p>`:'<p style="margin:0">Your base is fully upgraded.</p>'}`;$('baseUp').textContent=B.cost?`UPGRADE · ${B.cost.toLocaleString()} SCRAP`:'MAX LEVEL';$('baseUp').disabled=!B.cost}
$('baseUp').onclick=()=>{const B=baseInfo();if(!B.cost)return;if((prof.bank||0)<B.cost){toast(`Need ${(B.cost-(prof.bank||0)).toLocaleString()} more scrap`);SFX.hit();return}prof.bank-=B.cost;prof.base={lvl:B.lvl+1};saveProf();renderBank();renderBase();SFX.level();toast('Base upgraded')};
function extraTick(dt){if(!S.base)return;const Bs=S.base,B=baseInfo();
 if(!Bs.off){if(Bs.core.dead){Bs.off=true;banner('BASE OVERRUN','Your base is offline for the rest of this run','#ff3b2e');scene.remove(Bs.g)}else{if((Bs.t-=dt)<=0){Bs.t=60;S.scrap+=B.income;S.earned+=B.income;toast(`+${B.income} scrap from your base`)}
  if(!P.dead&&(P.x-Bs.x)**2+(P.z-Bs.z)**2<400){P.hp=Math.min(P.max,P.hp+40*dt);if(!P.av)P.en=Math.min(P.enMax||100,P.en+30*dt)}
  if((Bs.raid-=dt)<=0&&enemies.length<18){Bs.raid=rnd(200,260);banner('BASE UNDER ATTACK','The army is raiding your home base','#ff3b2e');SFX.alarm();const grp=['soldier','soldier','rocket','jeep','apc',S.stars>=3?'tank':'soldier'];for(const u of grp){const a=rnd(0,TAU);const e=spawn(u,{x:clamp(Bs.x+Math.cos(a)*60,-ARENA+5,ARENA-5),z:clamp(Bs.z+Math.sin(a)*60,-ARENA+5,ARENA-5)});e.tgt=Bs.core;e.tgtT=20}}}}
 for(let i=S.treasure.length-1;i>=0;i--){const t=S.treasure[i];t.g.rotation.y+=dt*.6;if(!P.dead&&(t.x-P.x)**2+(t.z-P.z)**2<16){scene.remove(t.g);S.treasure.splice(i,1);const r=Math.random();let msg;
  if(r<.6){const v=Math.round(rnd(5,20))*10;addCoins(v);msg=`🪙 ${v} Forge Coins`}else if(r<.9){const v=Math.round(rnd(1,5))*1000;S.scrap+=v;S.earned+=v;msg=`⚙ ${v.toLocaleString()} scrap`}else{const pool=PAINTS.filter(p=>p.lock&&!(prof.skins||{})[p.id]);if(pool.length){const p=pool[Math.random()*pool.length|0];(prof.skins||(prof.skins={}))[p.id]=1;msg=`🎨 Rare skin: ${p.name}`}else{addCoins(300);msg='🪙 300 Forge Coins'}}
  stat('crates');saveProf();sparks(t.x,1,t.z,0xffd23a,24,10);SFX.level();banner('TREASURE FOUND',msg,'#ffd23a')}}
 const key=Math.floor(Date.now()/(30*6e4));if(key!==S.wbKey){S.wbKey=key;S.wbT=prof.wbKey===key?-1:15}
 if(S.wbT>0&&(S.wbT-=dt)<=0&&!S.boss){S.wbT=-1;const a=rnd(0,TAU),e=spawn('goliath',{x:clamp(P.x+Math.cos(a)*70,-ARENA+10,ARENA-10),z:clamp(P.z+Math.sin(a)*70,-ARENA+10,ARENA-10)});e.wboss=true;e.hp=e.max=e.max*6;e.m.root.scale.multiplyScalar(1.6);e.r*=1.6;$('bossName').textContent='WORLD BOSS · OMEGA SIEGE ENGINE';$('bossCardName').textContent='OMEGA SIEGE ENGINE';setTimeout(()=>banner('WORLD BOSS','The Omega Siege Engine has arrived · a new one comes every 30 minutes','#ff2a18'),2700)}
 if(S.wbDown){S.wbDown=false;prof.wbKey=S.wbKey;S.scrap+=2000;S.earned+=2000;addCoins(100);saveProf();banner('WORLD BOSS DEFEATED','+2,000 scrap · +100 Forge Coins','#ffd23a')}}

/* ================= dialogue, boss intros, voice, settings ================= */
let talkQ=null,talkDone=null;
function playTalk(m,cb){if(!m||!m.talk){cb();return}talkQ=m.talk.slice();talkDone=cb;show(null);document.body.classList.add('talking');$('talkOv').classList.remove('hide');talkStep()}
function talkStep(){if(!talkQ.length){$('talkOv').classList.add('hide');document.body.classList.remove('talking');const f=talkDone;talkDone=null;if(f)f();return}const[face,who,txt]=talkQ.shift();$('talkFace').textContent=face;$('talkWho').textContent=who;$('talkTxt').textContent=txt;if(face=='🤖')say(txt);SFX.ui()}
$('talkNext').onclick=talkStep;$('talkSkip').onclick=()=>{talkQ=[];talkStep()};
let bossCam=null;
function bossIntro(e,name){bossCam={e,t:2.6,a:Math.atan2(camera.position.x-e.x,camera.position.z-e.z)};G.timeScale=.25;$('bossCardName').textContent=name.toUpperCase();const bc=$('bossCard');bc.classList.remove('hide');bc.style.animation='none';void bc.offsetWidth;bc.style.animation='';setTimeout(()=>bc.classList.add('hide'),2600)}
function bossCamUpd(rdt){const b=bossCam,e=b.e;b.t-=rdt;b.a+=rdt*.5;const r=22+(e.m.scale||1)*6,h=7+(e.m.scale||1)*3;camera.position.lerp(_v.set(e.x+Math.sin(b.a)*r,h,e.z+Math.cos(b.a)*r),1-Math.exp(-rdt*4));camera.lookAt(e.x,3+(e.m.scale||1)*2,e.z);if(b.t<=0||e.dead){bossCam=null;if(!killCam&&!CH.slow)G.timeScale=1}}
const setOn=k=>{const st=prof.set||{};return k=='autoaim'||k=='voice'?st[k]!==false:!!st[k]};
function setTog(k){const st=prof.set||(prof.set={});st[k]=!setOn(k);saveProf();renderSets()}
function renderSets(){$('voiceBtn').textContent='TITAN AI VOICE '+(setOn('voice')?'ON':'OFF');$('bigBtn').textContent='BIG TOUCH BUTTONS: '+(setOn('big')?'ON':'OFF');$('aimBtn').textContent='AUTO-AIM ON PHONES: '+(setOn('autoaim')?'ON':'OFF');document.body.classList.toggle('bigbtn',setOn('big'))}
$('voiceBtn').onclick=()=>setTog('voice');$('bigBtn').onclick=()=>setTog('big');$('aimBtn').onclick=()=>setTog('autoaim');renderSets();
let sayT=0;function say(t){if(!setOn('voice')||AU.muted||!window.speechSynthesis)return;const n=performance.now();if(n-sayT<2500)return;sayT=n;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.pitch=.55;u.rate=1.05;u.volume=.9;const v=speechSynthesis.getVoices().find(v=>/en/i.test(v.lang)&&/male|david|daniel|google uk/i.test(v.name));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){}}

/* ================= online: leaderboards & clans (needs the Titan Forge server) ================= */
const pid=()=>prof.pid||(prof.pid='p'+Math.random().toString(36).slice(2,12));
function apiBase(){const u=(netCfg().srv2||'').trim();return u?u.replace(/\/+$/,''):null}
async function api(path,body){const b=apiBase();if(!b)throw new Error('noserver');const r=await fetch(b+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j}
const noSrv='<p>Leaderboards and clans need the Titan Forge server. Put it online (free on Render), then enter its address under ONLINE → server 2. Inside claude.ai these features are blocked: use the downloaded HTML file.</p>';
let lbBoard='score';
async function lbLoad(b){lbBoard=b||lbBoard;document.querySelectorAll('[data-lb]').forEach(x=>x.classList.toggle('on',x.dataset.lb==lbBoard));if(!apiBase()){$('lbBody').innerHTML=noSrv;return}$('lbBody').innerHTML='<p>Loading…</p>';
 try{const L=await api('/api/lb?board='+lbBoard),me=pid(),fmt=v=>lbBoard=='rush'||lbBoard=='trial'?fmtT(v):Math.round(v).toLocaleString();$('lbBody').innerHTML=L.length?L.map((x,i)=>`<div class="lbrow${x.id==me?' me':''}"><b>#${i+1}</b><span>${x.name}${x.titan?' · '+x.titan:''}</span><b>${fmt(x.value)}</b></div>`).join(''):'<p>No scores yet. Be the first.</p>'}catch(e){$('lbBody').innerHTML=`<p>Could not reach the server (${e.message}). It may be waking up: try again in a minute.</p>`}}
$('lbOv').addEventListener('click',e=>{const b=e.target.closest('[data-lb]');if(b)lbLoad(b.dataset.lb)});
async function clanLoad(msg){const el=$('clanBody');if(!apiBase()){el.innerHTML=noSrv;return}el.innerHTML='<p>Loading…</p>';
 try{const top=await api('/api/clans');let mine=null;if(prof.clan){try{mine=await api('/api/clan/'+encodeURIComponent(prof.clan))}catch(e){prof.clan=null;saveProf()}}
  el.innerHTML=(msg?`<p style="color:#5cff78">${msg}</p>`:'')+(mine?`<div class="room"><h3>[${mine.tag}] ${mine.name}</h3><p style="margin:0">Clan bank ${mine.bank.toLocaleString()} scrap · clan war ${mine.war.toLocaleString()} points · ${mine.members.length}/30 pilots</p><ul>${mine.members.sort((a,b)=>b.war-a.war).map(m=>`<li>${m.role=='leader'?'👑 ':''}${m.name} · ${m.war} war points</li>`).join('')}</ul><div class="rowb"><input id="clanDon" placeholder="Scrap to donate" inputmode="numeric"><button class="btn" id="clanDonBtn">DONATE</button><button class="btn ghost" id="clanLeave">LEAVE CLAN</button></div></div>`
   :`<div class="room"><h3>Join or create a clan</h3><p style="margin:0">Clan war points come from your kills in every run.</p><div class="rowb"><input id="clanName" placeholder="Clan name" maxlength="20"><input id="clanTag" placeholder="Tag (4)" maxlength="4" style="width:110px"></div><div class="rowb"><button class="btn" id="clanCreate">CREATE</button><button class="btn ghost" id="clanJoin">JOIN BY NAME</button></div></div>`)
   +`<b class="nh">Clan war · top clans</b>`+(top.length?top.map((c,i)=>`<div class="lbrow${mine&&c.name==mine.name?' me':''}"><b>#${i+1}</b><span>[${c.tag}] ${c.name} · ${c.members.length} pilots</span><b>${c.war.toLocaleString()}</b></div>`).join(''):'<p>No clans yet.</p>')}catch(e){el.innerHTML=`<p>Could not reach the server (${e.message}). It may be waking up: try again in a minute.</p>`}}
$('clanOv').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||!b.id)return;const nm=(netCfg().name||'Pilot');try{
 if(b.id=='clanCreate'){const c=await api('/api/clan/create',{id:pid(),pname:nm,name:$('clanName').value,tag:$('clanTag').value});prof.clan=c.name;saveProf();clanLoad('Clan created.')}
 else if(b.id=='clanJoin'){const c=await api('/api/clan/join',{id:pid(),pname:nm,name:$('clanName').value});prof.clan=c.name;saveProf();clanLoad('Welcome to '+c.name+'.')}
 else if(b.id=='clanLeave'){await api('/api/clan/leave',{id:pid()});prof.clan=null;saveProf();clanLoad('You left the clan.')}
 else if(b.id=='clanDonBtn'){const v=Math.floor(+$('clanDon').value||0);if(v<=0||v>(prof.bank||0)){toast('Enter an amount you have in your bank');return}await api('/api/clan/donate',{id:pid(),name:prof.clan,amount:v});prof.bank-=v;saveProf();renderBank();clanLoad(`Donated ${v.toLocaleString()} scrap.`)}}catch(err){toast(err.message=='noserver'?'Add your Titan Forge server under ONLINE first':err.message)}});
function onlineAfterRun(won){if(!apiBase()||!S)return;const nm=netCfg().name||'Pilot',ti=P&&P.t?P.t.name:'',sub=(board,value)=>api('/api/lb',{id:pid(),name:nm,board,value,titan:ti}).catch(()=>{});
 if(S.score>0)sub('score',S.score);if(S.kind=='endless'&&S.wave>0)sub('wave',S.wave);if(won&&S.obj&&S.obj.t&&(S.kind=='rush'||S.kind=='trial'))sub(S.kind,Math.round(S.obj.t*10)/10);
 if(prof.clan&&S.kills>0)api('/api/clan/war',{id:pid(),name:prof.clan,points:Math.min(5000,S.kills)}).catch(()=>{})}

function loop(now){const rdt=Math.min(.05,(now-last)/1000);last=now;if(killCam&&(killCam.t-=rdt)<=0){killCam=null;G.timeScale=1}const dt=rdt*G.timeScale;
 pollPad();if(!paused&&P)update(dt,rdt);if(NET.inGame&&P&&S)netTick(rdt);postTick(now*.001);if(P){pLight.position.set(P.x,(P.y||0)+5,P.z);pLight.color.set(P.glow||0xffffff);pLight.intensity=P.dead?0:60}if(photo)photoCam();else if(bossCam&&!paused)bossCamUpd(rdt);else updCamera(paused?0:rdt);updHud();composer.render();if(snapReq){snapReq=false;try{const u=renderer.domElement.toDataURL('image/png');$('phImg').src=u;$('photoPrev').classList.remove('hide');const a=document.createElement('a');a.href=u;a.download='titan-forge-photo.png';document.body.appendChild(a);a.click();a.remove()}catch(e){toast('Could not capture the photo')}}requestAnimationFrame(loop)}
try{await loadModels('models/titans.json')}catch(e){console.warn('Blender models unavailable, using built-in titans',e)}
setQuality(Q.level);previewMech();arena('roof');renderQ();$('qBtn').onclick=cycleQ;$('qBtn2').onclick=cycleQ;TITANS[5].snap=snapshot({chassis:'phantom',L:'rail',R:'rotary',glow:0xffc23a,paint:'arctic'});for(const tt of TITANS)if(!tt.img&&!tt.snap)tt.snap=snapshot({chassis:tt.id,L:tt.L,R:tt.R,glow:tt.glow,glow2:tt.glow2,paint:tt.paint,scale:1/(tt.scale||1)});renderHangar();state='menu';show('menu');$('loading').classList.add('hide');requestAnimationFrame(loop);
checkLogin();renderRank();if(prof.admin)$('admBtn').classList.remove('hide');
window.__tf={die:()=>die(),get W(){return W},get state(){return state},get enemies(){return enemies.length},get S(){return S},get P(){return P},startRun:(k,o)=>startRun(k,o),setSel:i=>{sel=i;if(state=="menu")previewMech()},toggleCam,act,spawn:t=>spawn(t),get cam(){return camMode},CH};
