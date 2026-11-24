export const TITANS=[
{id:'vanguard',name:'Vanguard',tag:'Line-breaker',glow:0x31c4ff,img:'art/vanguard.jpg',hp:340,spd:9,cd:14,L:'v_rotary',R:'v_lance',paint:'gunmetal',stats:[.7,.6,.65,.9],
 desc:'Balanced assault titan. The rotary cannon shreds anything in front of it, and the hex shield becomes a full dome when it gets loud.',abil:'Aegis dome',abilTxt:'Invulnerable for 4 seconds'},
{id:'inferno',name:'Inferno',tag:'Close-quarters butcher',glow:0xff5a1f,img:'art/inferno.jpg',hp:410,spd:9.5,cd:8,L:'i_ember',R:'i_saw',paint:'blackops',stats:[.85,.65,.95,.3],
 desc:'Built to get close. Ember shells set targets burning, the saw grinds anything that touches you, and Blade Rush carves a line through the enemy.',abil:'Blade rush',abilTxt:'Dash forward and slice through everything in the path'},
{id:'tempest',name:'Tempest',tag:'Storm caller',glow:0x9cc9ff,img:'art/tempest.jpg',hp:290,spd:10.5,cd:12,L:'t_arc',R:'t_coil',paint:'gunmetal',stats:[.55,.85,.7,.7],
 desc:'Fast and fragile. The arc gun locks on by itself and chains between targets. Storm Call drops lightning on the whole arena.',abil:'Storm call',abilTxt:'Lightning strikes up to 8 enemies and stuns them'},
{id:'reactor',name:'Reactor',tag:'Walking meltdown',glow:0x4dff6a,img:'art/reactor.jpg',hp:440,spd:8,cd:13,L:'r_fission',R:'r_rad',paint:'olive',stats:[1,.4,.8,.75],
 desc:'Slow and heavily armoured: takes 25% less damage behind its radiation shield. Fission shells blow up everything around the impact.',abil:'Meltdown',abilTxt:'Massive radiation pulse that blasts enemies away'},
{id:'venom',name:'Venom',tag:'Bio-hazard',glow:0x9dff3a,glow2:0xb04dff,img:'art/venom.jpg',hp:310,spd:9.5,cd:11,L:'x_acid',R:'x_needle',paint:'blackops',stats:[.65,.65,.7,.8],
 desc:'Acid rounds poison everything they touch and the injector fires toxin needles. Toxic Cloud turns the ground into a slow death zone.',abil:'Toxic cloud',abilTxt:'Poison zone that damages and slows for 6 seconds'},
{id:'phantom',name:'Phantom',tag:'Sky hunter',glow:0xffc23a,img:null,hp:300,spd:10,cd:10,L:'p_rail',R:'p_smg',paint:'arctic',stats:[.6,.8,.85,1],
 desc:'Long-range hunter with a hover pack. The railgun punches through every enemy in a line, and Skyfall launches you into the air to crash down on a target.',abil:'Skyfall',abilTxt:'Leap into the sky and slam down where you aim'}];

const w=(name,desc,model,kind,o,bars,cost)=>({name,desc,model,kind,bars,cost,...o});
export const WEAPONS={
 v_rotary:w('Aegis rotary','Fast, accurate cannon fire at long range','rotary','proj',{rate:.075,dmg:9,sp:76,spread:.035,life:.75,sfx:'rotary'},[2,5,4],0),
 v_lance:w('Hardlight lance','Heavy energy bolt with a blast','plasma','proj',{rate:1.05,dmg:36,sp:58,life:1,proj:'orb',r:.6,splash:3.5,sfx:'plasma'},[4,1,4],0),
 v_burst:w('Bulwark rifle','Precise heavy rounds at long range','plasma','proj',{rate:.18,dmg:17,sp:90,spread:.01,life:.8,r:.35,sfx:'rotary'},[3,3,5],350),
 v_breach:w('Breacher shotgun','Wide blast of heavy slugs','plasma','proj',{rate:.55,dmg:11,n:7,sp:65,spread:.22,life:.45,sfx:'ember'},[5,2,2],400),
 v_rail:w('Sentinel railcannon','Beam through every enemy in a line','rail','beam',{rate:1.2,dmg:130,range:80,w:.45,sfx:'rail'},[5,1,5],700),
 i_ember:w('Ember scatter','Burning shells at short range','ember','proj',{rate:.45,dmg:9,n:8,sp:48,spread:.3,life:.42,proj:'ember',burn:1,sfx:'ember'},[4,2,1],0),
 i_saw:w('Hellsaw','Grinds anything that gets close; fires nothing','saw','melee',{},[5,5,0],0),
 i_flame:w("Dragon's breath",'Constant stream of fire','ember','proj',{rate:.06,dmg:4,n:2,sp:34,spread:.12,life:.45,proj:'ember',burn:1,sfx:'acid'},[2,5,1],350),
 i_napalm:w('Napalm mortar','Fire bombs that set the area burning','fission','proj',{rate:.9,dmg:40,sp:40,life:1.1,proj:'orb',r:.7,splash:5,burn:1,sfx:'fission'},[4,1,3],500),
 i_magma:w('Magma cannon','Molten shells that split into fire blasts','fission','proj',{rate:1,dmg:50,sp:38,life:1.2,proj:'orb',r:.75,splash:4,burn:1,cluster:1,sfx:'fission'},[5,1,3],750),
 t_arc:w('Arc caster','Auto-locking lightning that chains to 2 more','arc','chain',{rate:.2,dmg:26,chains:3,range:36,cone:.42,sfx:'arc'},[3,3,3],0),
 t_coil:w('Coil lance','Charged bolt that stuns on impact','plasma','proj',{rate:1,dmg:32,sp:60,life:1,proj:'orb',r:.6,splash:3.5,stun:1,sfx:'plasma'},[4,1,4],0),
 t_storm:w('Storm cannon','Wide-lock lightning that chains to 5','arc','chain',{rate:.32,dmg:18,chains:5,range:40,cone:.6,sfx:'arc'},[3,2,4],450),
 t_ion:w('Ion lance','Piercing beam that stuns all it hits','rail','beam',{rate:.8,dmg:70,range:70,w:.35,stun:1.2,sfx:'rail'},[4,2,5],600),
 t_tesla:w('Tesla repeater','Rapid sparks that jolt enemies','arc','proj',{rate:.09,dmg:8,sp:70,spread:.05,life:.6,stun:.15,sfx:'arc'},[2,5,3],400),
 r_fission:w('Fission cannon','Slow shells with a huge blast','fission','proj',{rate:.65,dmg:60,sp:42,life:1.3,proj:'orb',r:.7,splash:5.5,sfx:'fission'},[5,1,3],0),
 r_rad:w('Rad gatling','Irradiated rounds that keep hurting','rotary','proj',{rate:.085,dmg:7,sp:70,spread:.04,life:.75,poison:6,sfx:'rotary'},[2,5,4],0),
 r_gamma:w('Gamma ray','Rapid short beam that pierces','rail','beam',{rate:.12,dmg:12,range:26,w:.15,sfx:'arc'},[2,5,2],450),
 r_cluster:w('Cluster cannon','Shells that burst into 5 more blasts','fission','proj',{rate:.85,dmg:45,sp:40,life:1.2,proj:'orb',r:.7,splash:4,cluster:1,sfx:'fission'},[5,1,3],600),
 r_neutron:w('Neutron mortar','Very slow shell, enormous blast','fission','proj',{rate:1.6,dmg:120,sp:30,life:1.6,proj:'orb',r:.9,splash:9,sfx:'fission'},[5,1,3],800),
 x_acid:w('Acid gatling','Rapid rounds that poison','acid','proj',{rate:.08,dmg:5,sp:62,spread:.05,life:.8,poison:8,sfx:'acid'},[2,5,3],0),
 x_needle:w('Toxin injector','Needles loaded with heavy poison','needle','proj',{rate:.9,dmg:18,sp:50,life:1,proj:'needle',r:.5,poison:16,col2:1,sfx:'needle'},[3,2,3],0),
 x_spore:w('Spore launcher','Pods that poison everything in the blast','needle','proj',{rate:.7,dmg:20,sp:36,life:1.1,proj:'orb',r:.6,splash:4.5,poison:14,col2:1,sfx:'needle'},[3,2,3],400),
 x_bile:w('Bile sprayer','Short-range acid spray','acid','proj',{rate:.5,dmg:5,n:6,sp:44,spread:.2,life:.5,poison:10,sfx:'acid'},[3,3,1],350),
 x_hive:w('Hive launcher','Swarms of poison micro-missiles','needle','missile',{rate:.6,dmg:14,n:3,poison:10,sfx:'needle'},[3,2,4],650),
 p_rail:w('Phantom railgun','Instant beam through every enemy in a line','rail','beam',{rate:1.2,dmg:130,range:80,w:.45,sfx:'rail'},[5,1,5],0),
 p_smg:w('Whisper SMG','Quiet, very fast bullets','rotary','proj',{rate:.06,dmg:6,sp:80,spread:.06,life:.6,sfx:'acid'},[2,5,3],0),
 p_smart:w('Smart rifle','Self-guided micro-missiles','plasma','missile',{rate:.35,dmg:20,n:1,sfx:'needle'},[3,3,4],450),
 p_marks:w('Marksman carbine','Slow, very hard-hitting long shots','rail','proj',{rate:.5,dmg:48,sp:110,spread:0,life:.9,r:.4,sfx:'rail'},[4,2,5],500),
 p_star:w('Starfall cannon','Plasma star with a wide blast','plasma','proj',{rate:1.1,dmg:55,sp:50,life:1.2,proj:'orb',r:.8,splash:6,sfx:'plasma'},[5,1,4],750)};
const u=(name,desc,fx,cd,cost,o={})=>({name,desc,fx,cd,cost,...o});
export const UTILS={
 v_repair:u('Field repair','Restores 35% armour over 4 s','repair',20,0),v_wall:u('Hardlight wall','Hex wall that blocks enemy fire for 8 s','wall',16,300),v_turret:u('Sentry turret','Auto-turret that shoots for 14 s','turret',24,500),
 i_repair:u('Coolant flush','Restores 35% armour over 4 s','repair',20,0),i_mines:u('Fire mines','6 mines that explode in flames','mines',14,300,{burn:1}),i_decoy:u('Smoke decoy','Hologram that draws enemy fire','decoy',18,450),
 t_repair:u('Static recharge','Restores 35% armour over 4 s','repair',20,0),t_emp:u('EMP burst','Stuns enemies near the aim point and wipes bullets','emp',16,300),t_turret:u('Ball lightning','Lightning turret that zaps enemies for 14 s','turret',24,500,{zap:1}),
 r_repair:u('Reactor vent','Restores 35% armour over 4 s','repair',20,0),r_wall:u('Lead wall','Thick shield wall for 8 s','wall',16,300),r_mines:u('Rad mines','6 mines that leave radiation','mines',14,450,{poison:12}),
 x_repair:u('Regen gel','Restores 35% armour over 4 s','repair',20,0),x_decoy:u('Toxic decoy','Hologram that draws enemy fire','decoy',18,300),x_emp:u('Nerve gas','Stuns enemies near the aim point','emp',16,450),
 p_repair:u('Nano repair','Restores 35% armour over 4 s','repair',20,0),p_decoy:u('Holo double','Hologram copy that draws enemy fire','decoy',18,300),p_turret:u('Drone turret','Gun drone that fires for 14 s','turret',24,500)};
const m=(name,desc,fx,cost,o={})=>({name,desc,fx,cost,...o});
export const MASS={
 v_air:m('Carpet bombing','A line of 14 bombs along your aim','airstrike',0),v_orb:m('Orbital lance','Sky laser that follows your aim','orbital',1200),
 i_fire:m('Firestorm','Fire bombs that leave the ground burning','airstrike',0,{burn:1}),i_nuke:m('Inferno nuke','Huge blast that wipes most of the arena','nuke',2000),
 t_thunder:m('Thunder god','Lightning column that follows your aim','orbital',0),t_sing:m('Singularity storm','Pulls enemies together, then implodes','blackhole',1500),
 r_nuke:m('Tactical nuke','Huge blast that wipes most of the arena','nuke',0),r_sing:m('Singularity','Pulls enemies together, then implodes','blackhole',1500),
 x_plague:m('Plague swarm','40 homing missiles that poison','swarm',0,{poison:12}),x_sing:m('Toxic singularity','Pulls enemies in, then bursts with poison','blackhole',1500,{poison:14}),
 p_swarm:m('Missile swarm','40 homing missiles at once','swarm',0),p_orb:m('Orbital laser','Sky laser that follows your aim','orbital',1200)};
const PFX={vanguard:'v_',inferno:'i_',tempest:'t_',reactor:'r_',venom:'x_',phantom:'p_'};

/* ---- extra titans, each with its own armoury (weapons cloned from a base kind and re-tuned) ---- */
const XT=[
 ['wd_','warden','Warden','Fortress walker','vanguard',1.08,0xff3a6a,null,'crimson',470,8.5,14,[.9,.5,.7,.75],{scrap:25000},'A heavier Vanguard frame built to hold a line and soak up punishment.',
  [['flak','Flak repeater','Rapid shells with a small blast','v_rotary',{dmg:10,proj:'orb',r:.3,splash:1.5},0],['bastion','Bastion cannon','Slow, crushing energy shell','v_lance',{dmg:48,rate:1.3,splash:4.5},0],['guard','Guardian carbine','Accurate long-range bursts','v_burst',{dmg:20},450],['wreck','Wrecker rail','Beam through every enemy in a line','v_rail',{dmg:150},800]],
  [['fix','Bulwark repair','Restores 35% armour over 4 s','v_repair',0],['wall','Fortress wall','Hex wall that blocks enemy fire for 8 s','v_wall',350]],[['bomb','Siege barrage','A line of 14 bombs along your aim','v_air',0],['beam','Judgement beam','Sky laser that follows your aim','v_orb',1400]]],
 ['st_','striker','Striker','Hit and run','phantom',.95,0x00e5ff,null,'arctic',270,11.5,9,[.5,1,.85,.7],{scrap:30000},'The fastest frame in the hangar. Hits hard and is gone before they can turn their guns.',
  [['needle','Needle SMG','Very fast, light rounds','p_smg',{dmg:7,rate:.05},0],['scatter','Scatter blaster','Close-range burst of bolts','v_breach',{dmg:10,n:8},0],['seeker','Seeker darts','Small homing missiles','p_smart',{dmg:22},450],['lancer','Lancer carbine','Fast, precise heavy shots','p_marks',{dmg:52},750]],
  [['fix','Quick patch','Restores 35% armour over 4 s','p_repair',0],['ghost','Ghost decoy','Hologram that draws enemy fire','p_decoy',350]],[['swarm','Hornet swarm','40 homing missiles at once','p_swarm',0],['beam','Satellite strike','Sky laser that follows your aim','p_orb',1400]]],
 ['hy_','hydra','Hydra','Toxic artillery','venom',1.05,0xb04dff,0x9dff3a,'blackops',390,9,11,[.75,.6,.9,.85],{scrap:35000},'Spits poison over whole groups and then shells them from a distance.',
  [['spit','Venom spitter','Poison rounds at a fast rate','x_acid',{dmg:6},0],['mortar','Bile mortar','Lobbed shell that poisons a wide area','x_spore',{dmg:26,splash:5.5},0],['spray','Corrosive spray','Short, wide cone of acid','x_bile',{dmg:6,n:7},450],['brood','Brood launcher','Homing pods that poison','x_hive',{dmg:16,n:4},800]],
  [['fix','Hydra regen','Restores 35% armour over 4 s','x_repair',0],['gas','Choking gas','Stuns enemies near the aim point','x_emp',400]],[['plague','Hydra plague','40 homing missiles that poison','x_plague',0],['pit','Acid pit','Pulls enemies in, then bursts with poison','x_sing',1600]]],
 ['ic_','ironclad','Ironclad','Armoured siege engine','reactor',1.12,0xff8a30,null,'military',540,7.5,13,[1,.35,.85,.7],{scrap:40000},'Slow, thick armour and siege guns. Takes 25% less damage like the Reactor.',
  [['howitz','Howitzer','Heavy shell with a big blast','r_fission',{dmg:66},0],['chain','Chaingun','Steady heavy rounds','r_rad',{dmg:9,poison:0},0],['cluster','Shrapnel cannon','Shell that splits into blasts','r_cluster',{dmg:48},550],['quake','Quake mortar','Huge slow shell that flattens a district','r_neutron',{dmg:130},900]],
  [['fix','Field welder','Restores 35% armour over 4 s','r_repair',0],['wall','Steel wall','Thick shield wall for 8 s','r_wall',350]],[['nuke','Siege nuke','Huge blast that wipes most of the arena','r_nuke',0],['bomb','Artillery barrage','A line of 14 bombs along your aim','v_air',1200]]],
 ['bz_','blitz','Blitz','Lightning raider','tempest',1,0x7af7ff,null,'ice',300,11,11,[.55,.9,.75,.7],{scrap:45000},'A fast storm frame. Its lightning jumps between targets and stuns them.',
  [['zap','Zap gun','Auto-locking lightning that chains to 3','t_arc',{dmg:24,chains:4},0],['bolt','Bolt repeater','Fast stunning bolts','t_tesla',{dmg:9},0],['spark','Spark lance','Stunning energy bolt with a blast','t_coil',{dmg:36},450],['ion','Ion cutter','Stunning beam through a line','t_ion',{dmg:80},750]],
  [['fix','Capacitor dump','Restores 35% armour over 4 s','t_repair',0],['emp','Pulse bomb','Stuns enemies near the aim point and wipes bullets','t_emp',350]],[['storm','Thunderhead','Lightning column that follows your aim','t_thunder',0],['sing','Static vortex','Pulls enemies together, then implodes','t_sing',1500]]],
 ['sc_','scorch','Scorch','Flamethrower brute','inferno',1.05,0xff2a00,null,'lava',450,9.5,8,[.85,.65,.95,.3],{scrap:50000},'A heavier Inferno that burns everything at close range.',
  [['flame','Scorcher','Constant stream of fire','i_flame',{dmg:5},0],['buzz','Buzzsaw','Grinds anything that gets close','i_saw',{},0],['blast','Fire blaster','Burning shells at short range','i_ember',{dmg:11},450],['meteor','Meteor mortar','Molten shells that split into fire blasts','i_magma',{dmg:58},850]],
  [['fix','Heat sink','Restores 35% armour over 4 s','i_repair',0],['mines','Flame mines','6 mines that explode in flames','i_mines',350]],[['storm','Firewall','Fire bombs that leave the ground burning','i_fire',0],['nuke','Sunburst','Huge blast that wipes most of the arena','i_nuke',2000]]],
 ['sp_','specter','Specter','Stealth sniper','phantom',1,0xd58cff,null,'blackops',290,10.5,10,[.55,.8,.95,1],{scrap:60000},'A shadow-black sniper frame that hits from very long range.',
  [['snipe','Specter rail','Beam through every enemy in a line','p_rail',{dmg:145},0],['silence','Silenced SMG','Fast, quiet rounds','p_smg',{dmg:7},0],['mark','Death mark','Fast, precise heavy shots','p_marks',{dmg:56},500],['nova','Nova cannon','Big energy shell with a wide blast','p_star',{dmg:62},850]],
  [['fix','Shade repair','Restores 35% armour over 4 s','p_repair',0],['drone','Shadow drone','Gun drone that fires for 14 s','p_turret',450]],[['beam','Eclipse beam','Sky laser that follows your aim','p_orb',0],['swarm','Wraith swarm','40 homing missiles at once','p_swarm',1300]]],
 ['tn_','titano','Titano','Shop exclusive · colossus','reactor',1.32,0xffc23a,null,'titanium',760,7.5,12,[1,.35,1,.9],{coins:10000},'The biggest titan ever forged. Takes 25% less damage and its meltdown flattens everything nearby.',
  [['colossus','Colossus cannon','Gigantic shell with a huge blast','r_fission',{dmg:85,splash:7},0],['gat','Titan gatling','Heavy rounds at a high rate','v_rotary',{dmg:13},0],['quake','Earthshaker','Huge slow shell that flattens a district','r_neutron',{dmg:160},900],['rail','Titan rail','Beam through every enemy in a line','v_rail',{dmg:180},900]],
  [['fix','Titan repair','Restores 35% armour over 4 s','r_repair',0],['wall','Titan bulwark','Thick shield wall for 8 s','r_wall',400]],[['nuke','Titan nuke','Huge blast that wipes most of the arena','r_nuke',0],['sing','Collapse','Pulls enemies together, then implodes','r_sing',1600]]],
 ['lv_','leviathan','Leviathan','Shop exclusive · sea monster','venom',1.25,0x00ffb0,0x2f7bff,'galaxy',680,8.5,10,[.95,.5,.95,.85],{coins:10000},'A huge bio-frame from the deep. Its poison spreads through whole armies.',
  [['tide','Tide gatling','Poison rounds at a high rate','x_acid',{dmg:8},0],['kraken','Kraken spores','Lobbed shell that poisons a wide area','x_spore',{dmg:34,splash:6.5},0],['abyss','Abyss injector','Heavy toxin needle','x_needle',{dmg:30,poison:22},500],['school','Piranha pods','Homing pods that poison','x_hive',{dmg:20,n:5},900]],
  [['fix','Deep regen','Restores 35% armour over 4 s','x_repair',0],['ink','Ink cloud','Stuns enemies near the aim point','x_emp',450]],[['plague','Red tide','40 homing missiles that poison','x_plague',0],['sing','Maelstrom','Pulls enemies in, then bursts with poison','x_sing',1700]]],
 ['vk_','valkyrie','Valkyrie','Shop exclusive · sky queen','phantom',1.08,0xff4dd8,null,'neon',560,11,9,[.75,.95,.95,.95],{coins:10000},'A winged hunter that rules the sky and strikes from above.',
  [['spear','Valkyrie spear','Beam through every enemy in a line','p_rail',{dmg:160},0],['wing','Wing blasters','Fast, accurate energy rounds','p_smg',{dmg:9},0],['seek','Valhalla missiles','Homing missiles','p_smart',{dmg:28,n:2},500],['star','Starfall','Big energy shell with a wide blast','p_star',{dmg:70},900]],
  [['fix','Valkyrie mend','Restores 35% armour over 4 s','p_repair',0],['drone','Shield maiden drone','Gun drone that fires for 14 s','p_turret',450]],[['swarm','Ride of the Valkyries','40 homing missiles at once','p_swarm',0],['beam','Bifrost beam','Sky laser that follows your aim','p_orb',1500]]],
 ['jg_','juggernaut','Juggernaut','Shop exclusive · unstoppable','inferno',1.25,0xff7a00,null,'tiger',720,9,8,[1,.6,1,.35],{coins:10000},'Nothing stops it. Shreds anything close and sets the rest on fire.',
  [['shred','Shredder','Burning shells at short range','i_ember',{dmg:13,n:9},0],['grind','Megasaw','Grinds anything that gets close','i_saw',{},0],['hell','Hellfire mortar','Fire bombs that set the area burning','i_napalm',{dmg:52},550],['magma','Volcano cannon','Molten shells that split into fire blasts','i_magma',{dmg:66},900]],
  [['fix','Juggernaut vent','Restores 35% armour over 4 s','i_repair',0],['mines','Inferno mines','6 mines that explode in flames','i_mines',400]],[['storm','Scorched earth','Fire bombs that leave the ground burning','i_fire',0],['nuke','Doomsday','Huge blast that wipes most of the arena','i_nuke',2000]]],
 ['zs_','zeus','Zeus','Shop exclusive · god of thunder','tempest',1.2,0xfff27a,null,'gold',640,10,10,[.85,.8,1,.85],{coins:10000},'Commands the storm itself. Lightning chains through entire squads.',
  [['bolt','Thunderbolt','Auto-locking lightning that chains to 6','t_storm',{dmg:24,chains:6},0],['spear','Sky spear','Stunning energy bolt with a blast','t_coil',{dmg:44},0],['ion','Olympus beam','Stunning beam through a line','t_ion',{dmg:95},550],['tesla','Storm repeater','Fast stunning bolts','t_tesla',{dmg:11},900]],
  [['fix','Divine recharge','Restores 35% armour over 4 s','t_repair',0],['orb','Thunder orb','Lightning turret that zaps enemies for 14 s','t_turret',450]],[['storm','Wrath of Zeus','Lightning column that follows your aim','t_thunder',0],['sing','Eye of the storm','Pulls enemies together, then implodes','t_sing',1700]]],
 ['kj_','kaiju','Kaiju','Shop exclusive · monster','reactor',1.28,0x3dff9a,null,'camo',800,7.5,12,[1,.35,1,.75],{coins:10000},'A radioactive monster titan. It glows, it roars and it melts everything.',
  [['breath','Atomic breath','Short beam that melts at close range','r_gamma',{dmg:16},0],['spit','Rad cannon','Heavy shell with a big blast','r_fission',{dmg:70},0],['gat','Mutant gatling','Poison rounds at a high rate','r_rad',{dmg:9},550],['bomb','Neutron spit','Huge slow shell that flattens a district','r_neutron',{dmg:140},900]],
  [['fix','Mutation','Restores 35% armour over 4 s','r_repair',0],['mines','Glow mines','6 mines that leave radiation','r_mines',400]],[['nuke','Atomic roar','Huge blast that wipes most of the arena','r_nuke',0],['sing','Black sun','Pulls enemies together, then implodes','r_sing',1700]]],
 ['sr_','seraph','Seraph','Shop exclusive · guardian angel','vanguard',1.15,0xffffff,0xffd23a,'ice',660,9.5,12,[.9,.7,.9,.95],{coins:10000},'A shining guardian frame. Its dome protects it and its lances burn through armour.',
  [['halo','Halo rotary','Fast, accurate cannon fire at long range','v_rotary',{dmg:12},0],['lance','Holy lance','Heavy energy bolt with a blast','v_lance',{dmg:50},0],['judg','Judgement rifle','Precise heavy rounds at long range','v_burst',{dmg:24},550],['ray','Radiant ray','Beam through every enemy in a line','v_rail',{dmg:170},900]],
  [['fix','Grace','Restores 35% armour over 4 s','v_repair',0],['sentry','Angel sentry','Auto-turret that shoots for 14 s','v_turret',450]],[['beam','Heaven\'s light','Sky laser that follows your aim','v_orb',0],['bomb','Divine barrage','A line of 14 bombs along your aim','v_air',1300]]],
];
const ABOF={vanguard:['Aegis dome','Invulnerable for 4 seconds'],inferno:['Blade rush','Dash forward and slice through everything in the path'],tempest:['Storm call','Lightning strikes up to 8 enemies and stuns them'],reactor:['Meltdown','Massive radiation pulse that blasts enemies away'],venom:['Toxic cloud','Poison zone that damages and slows for 6 seconds'],phantom:['Skyfall','Leap into the sky and slam down where you aim']};
for(const[pf,id,name,tag,base,scale,glow,glow2,paint,hp,spd,cd,stats,price,desc,ws,us,ms]of XT){
 for(const[sf,nm,ds,bk,o,c]of ws){const b=WEAPONS[bk];WEAPONS[pf+sf]={...b,...o,name:nm,desc:ds,cost:c}}
 for(const[sf,nm,ds,bk,c]of us)UTILS[pf+sf]={...UTILS[bk],name:nm,desc:ds,cost:c};
 for(const[sf,nm,ds,bk,c]of ms)MASS[pf+sf]={...MASS[bk],name:nm,desc:ds,cost:c};
 PFX[id]=pf;const t={id,name,tag,glow,img:null,base,ab:base,scale,hp,spd,cd,L:pf+ws[0][0],R:pf+ws[1][0],paint,stats,price,desc,abil:ABOF[base][0],abilTxt:ABOF[base][1]};if(glow2)t.glow2=glow2;TITANS.push(t)}
export const ARMORY={};for(const k in PFX){const f=o=>Object.keys(o).filter(i=>i.startsWith(PFX[k]));ARMORY[k]={w:f(WEAPONS),u:f(UTILS),m:f(MASS)}}
export const WLIST=Object.keys(WEAPONS);

export const ET={
 drone:{name:'Military drone',r:1.3,hp:35,spd:12,sc:3,xp:5,touch:16},
 soldier:{name:'Soldier',r:.9,hp:28,spd:5,sc:2,xp:3,touch:0,fire:1.2,range:24,inf:1},
 rocket:{name:'Rocket trooper',r:.9,hp:40,spd:4.5,sc:4,xp:6,touch:0,fire:3.4,range:32,inf:1},
 sniper:{name:'Sniper',r:.9,hp:35,spd:4,sc:6,xp:10,touch:0,fire:4.4,range:50,inf:1},
 riot:{name:'Riot trooper',r:1.4,hp:180,spd:3.8,sc:8,xp:12,touch:6,fire:1.9,range:14,inf:1},
 jeep:{name:'Gun jeep',r:2.4,hp:140,spd:15,sc:8,xp:12,touch:12,fire:2.2,range:24,veh:1},
 apc:{name:'APC',r:3.2,hp:380,spd:7,sc:14,xp:20,touch:18,fire:1.6,range:30,veh:1},
 tank:{name:'Battle tank',r:3.6,hp:650,spd:5,sc:22,xp:32,touch:24,fire:3,range:42,veh:1},
 heli:{name:'Attack helicopter',r:3.2,hp:300,spd:14,sc:18,xp:26,touch:0,fire:2.6,range:34,fly:14},
 goliath:{name:'Goliath super-tank',boss:1,r:8,hp:3000,spd:3,sc:130,xp:240,touch:40,fire:1.6,range:44,veh:1},
 hammer:{name:'Hammer gunship',boss:1,r:6,hp:2600,spd:9,sc:130,xp:240,touch:0,fire:1.6,range:36,fly:20},
 battery:{name:'Artillery battery',boss:1,r:6,hp:3000,spd:2.2,sc:140,xp:260,touch:35,fire:1.9,range:50,veh:1},
 rival:{name:'Project Kraken',boss:1,r:2.9,hp:2400,spd:7,sc:150,xp:280,touch:20,fire:1.3,range:24}};
export const BOSS_ORDER=['goliath','hammer','battery','rival'];

export const ARENA_LIST=[{id:'roof',name:'Neon Rooftop',desc:'Rain-soaked skyscraper roof'},{id:'desert',name:'Desert Refinery',desc:'Burning oil pools, exploding fuel'},{id:'street',name:'Downtown Street',desc:'Wrecked cars explode when shot'},{id:'harbour',name:'Storm Harbour',desc:'Lightning strikes the pier'}];

export const MISSIONS=[
 {n:'First Drop',arena:'roof',type:'waves',waves:3,lvl:1,brief:'Army squads are storming the roof to seize your titan. Throw back three waves.'},
 {n:'Refinery Run',arena:'desert',type:'gens',gens:4,lvl:3,brief:'Destroy the 4 generators powering the army\'s EMP net before it locks your titan down.'},
 {n:'Convoy',arena:'street',type:'escort',lvl:4,brief:'Escort 3 resistance supply trucks through an army blockade. At least one must make it.'},
 {n:'Hold the Line',arena:'harbour',type:'defend',time:90,lvl:5,brief:'Protect your hidden reactor core from the army\'s seizure team for 90 seconds.'},
 {n:'Goliath',arena:'roof',type:'boss',boss:'goliath',lvl:5,brief:'The army rolled out its Goliath super-tank to drag your titan away. Destroy it.'},
 {n:'Scorched Earth',arena:'desert',type:'waves',waves:5,lvl:7,brief:'The army sends its whole armoured division. Survive five escalating waves.'},
 {n:'Hammer Down',arena:'street',type:'boss',boss:'hammer',lvl:9,brief:'The Hammer gunship is hunting you over the city. Bring it down.'},
 {n:'Storm Front',arena:'harbour',type:'gens',gens:5,lvl:10,storm:true,brief:'Knock out 5 army jammer towers while lightning hammers the pier.'},
 {n:'Big Guns',arena:'desert',type:'boss',boss:'battery',lvl:12,brief:'Silence the artillery battery before it shells you into submission.'},
 {n:'Mirror Match',arena:'roof',type:'boss',boss:'rival',lvl:15,brief:'The army stole your blueprints and built Project Kraken, a copy of your titan. Destroy it.'},
 {ch:2,n:'Ghost Signal',arena:'street',type:'waves',waves:4,lvl:16,brief:'A distress call from the city is a trap. Survive the ambush.',talk:[['📡','Commander Rao','Pilot, we picked up a resistance signal from the old city. It might be survivors.'],['🎖','General Vex','Survivors? No. Bait. And you took it.'],['🤖','Titan AI','Multiple hostiles closing in. Weapons free.']]},
 {ch:2,n:'Black Box',arena:'desert',type:'gens',gens:5,lvl:17,brief:'Wreck 5 relay towers that carry the army\'s titan-tracking data.',talk:[['🔧','Dr. Mira Sen','Kraken\'s wreck had a black box. The army tracks every titan through desert relay towers.'],['📡','Commander Rao','Then we go blind on them. Take the towers down.']]},
 {ch:2,n:'Exodus',arena:'harbour',type:'escort',lvl:18,brief:'Get the resistance engineers out of the harbour before the army closes the port.',talk:[['🔧','Dr. Mira Sen','My team is trapped at the docks. Without them, no more titan repairs.'],['🤖','Titan AI','Escort route plotted. Protect the trucks.']]},
 {ch:2,n:'Last Reactor',arena:'roof',type:'defend',time:120,lvl:19,brief:'Hold the rooftop reactor for 2 minutes while Mira copies the army files.',talk:[['🔧','Dr. Mira Sen','The army wants titan cores to power something called the Omega Engine.'],['🎖','General Vex','Your core will be the first one I harvest, pilot.'],['📡','Commander Rao','Hold that roof. Two minutes.']]},
 {ch:2,n:'Twin Hammers',arena:'street',type:'boss',boss:'hammer',lvl:20,brief:'A rebuilt Hammer gunship is levelling the city. Shoot it down.',talk:[['📡','Commander Rao','They rebuilt the Hammer. Bigger guns, thicker armour.'],['🤖','Titan AI','Aim for the rotors. Rear armour is weaker.']]},
 {ch:2,n:'Sandstorm',arena:'desert',type:'waves',waves:6,lvl:21,storm:true,brief:'Survive six waves of desert armour in a lightning sandstorm.',talk:[['🎖','General Vex','The desert is mine. Every tank I own is coming for you.'],['🤖','Titan AI','Storm detected. Visibility low. Stay sharp.']]},
 {ch:2,n:'Iron Curtain',arena:'harbour',type:'gens',gens:6,lvl:22,storm:true,brief:'Destroy 6 shield pylons guarding the army\'s naval yard.',talk:[['🔧','Dr. Mira Sen','The Omega Engine is being built inside the naval yard. Six pylons shield it.'],['📡','Commander Rao','Bring the curtain down.']]},
 {ch:2,n:'Siege of the Pier',arena:'harbour',type:'defend',time:150,lvl:23,brief:'Hold the pier for 2½ minutes while the resistance plants charges.',talk:[['📡','Commander Rao','Our demolition team needs time on the pier. Give it to them.'],['🎖','General Vex','Every soldier I have is on that pier. You will not leave it.']]},
 {ch:2,n:'Goliath Reborn',arena:'desert',type:'boss',boss:'goliath',lvl:25,brief:'Vex rides the rebuilt Goliath. Destroy it before it reaches the resistance camp.',talk:[['🎖','General Vex','I will finish this myself. Goliath, forward!'],['🤖','Titan AI','Massive armour signature. Target the rear plating.']]},
 {ch:2,n:'Kraken Prime',arena:'roof',type:'boss',boss:'rival',lvl:28,brief:'The final copy of your titan, powered by the Omega Engine. End the war.',talk:[['🔧','Dr. Mira Sen','They put the Omega Engine inside a new Kraken. It is a perfect copy of you, only stronger.'],['🎖','General Vex','If I can\'t have your titan, I will become it.'],['🤖','Titan AI','This ends tonight, pilot. All systems at maximum.']]}];

export const MODS=[
 {id:'glass',name:'Glass cannon',desc:'+60% damage, half armour',dmg:1.6,armor:.5},
 {id:'swarm',name:'Swarm',desc:'Twice the enemies, half their health',count:2,ehp:.5},
 {id:'nomsl',name:'Dry racks',desc:'No missiles, +30% damage',nomsl:1,dmg:1.3},
 {id:'heavy',name:'Heavy metal',desc:'Only heavy enemies, 50% more scrap',heavy:1,scrap:1.5},
 {id:'storm',name:'Lightning storm',desc:'Lightning strikes the arena all game',storm:1},
 {id:'turbo',name:'Overclocked',desc:'Enemies move 35% faster',speed:1.35}];

export const LEVELS=[0,250,700,1400,2400,3800,5600,8000];
export const PERKS=['','+10% armour','Double boost (2 charges)','+10% damage','Overdrive lasts 9 seconds instead of 6','+2 missiles per salvo','Ability recharges 20% faster','Ascendant: +20% armour and self-repair'];
export function perks(lv){return{armor:(lv>=2?.1:0)+(lv>=8?.2:0),boost:lv>=3?2:1,dmg:lv>=4?.1:0,over:lv>=5,msl:lv>=6?2:0,abil:lv>=7?.2:0,regen:lv>=8?3:0}}
export function levelOf(xp){let l=1;for(let i=1;i<LEVELS.length;i++)if(xp>=LEVELS[i])l=i+1;return l}

export const SHOP=[{k:'repair',n:'Field repair',d:'Restore half your armour',c:w=>15+w*3,max:999},{k:'armor',n:'Armour plating',d:'+20% max armour',c:(w,l)=>40+l*30,max:8},
 {k:'dmg',n:'Hardened rounds',d:'+15% damage on all weapons',c:(w,l)=>40+l*32,max:8},{k:'rate',n:'Auto-loader',d:'+10% fire rate',c:(w,l)=>45+l*35,max:6},
 {k:'msl',n:'Missile racks',d:'+2 missiles per salvo',c:(w,l)=>50+l*40,max:5},{k:'boost',n:'Jump jets',d:'Boost recharges 15% faster',c:(w,l)=>30+l*30,max:4},{k:'abil',n:'Core overclock',d:'Ability recharges 12% faster',c:(w,l)=>55+l*45,max:4}];

const KEY='tf3d_profile';
export const prof=(()=>{let p={};try{p=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}p.t=p.t||{};p.rec=p.rec||{};p.daily=p.daily||{};p.camp=p.camp||0;p.bank=p.bank||0;p.unl=p.unl||{};p.kills=p.kills||0;return p})();
export function replaceProf(o){for(const k of Object.keys(prof))delete prof[k];Object.assign(prof,o||{});prof.t=prof.t||{};prof.rec=prof.rec||{};prof.daily=prof.daily||{};prof.camp=prof.camp||0;prof.bank=prof.bank||0;prof.unl=prof.unl||{};prof.kills=prof.kills||0;saveProf()}
export function saveProf(){try{localStorage.setItem(KEY,JSON.stringify(prof))}catch(e){}}
export const tp=id=>prof.t[id]||(prof.t[id]={xp:0});
export function seeded(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export const todayKey=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export function dailyCfg(){const k=todayKey();let h=7;for(const c of k)h=(h*31+c.charCodeAt(0))>>>0;const r=seeded(h);r();return{key:k,titan:Math.floor(r()*TITANS.length),arena:ARENA_LIST[Math.floor(r()*4)].id,mod:MODS[Math.floor(r()*MODS.length)]}}
