import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {itemPower} from '../dist/loot.js';
import {freezeCombat} from './combat-fixture.mjs';
function ticks(s,seconds,input={}){for(let i=0;i<Math.ceil(seconds/.025);i++)g.advanceGame(s,.025,input);}
function hunt(){const s=g.createGame(g.createProfile(1_000_000));assert.equal(g.launch(s,1),true);return freezeCombat(s);}
function dummy(s,dx=100,dy=0,hp=500){return{...s.enemies[0],id:s.nextId++,x:s.player.x+dx,y:s.player.y+dy,homeX:s.player.x+dx,homeY:s.player.y+dy,hp,maxHp:hp,speed:0,cooldown:999,action:'idle',actionTime:0,dead:false,boss:false,group:0,aggro:true};}
function gear(id,slot='weapon'){return{id,slot,rarity:1,tier:1,name:'시험 장비',affixes:slot==='weapon'?{damage:10,crit:5}:{hp:30,reduction:4}};}

test('version one migrates without losing progress; unsafe equipment and malformed saves are rejected',()=>{
  for(const raw of [null,'broken','{}',{version:9},[]])assert.deepEqual(g.restoreProfile(raw,1000),g.createProfile(1000));
  const old=g.createProfile(1000);old.version=1;old.gold=80;old.level=7;old.skills.edge=2;old.clearedStage=1;old.unlockedStage=2;delete old.inventory;delete old.equipment;
  const migrated=g.restoreProfile(old,1000);assert.equal(migrated.version,15);assert.equal(migrated.gold,80);assert.equal(migrated.level,7);assert.equal(migrated.skills.edge,2);assert.equal(migrated.unlockedStage,2);assert.deepEqual(migrated.inventory,[]);
  const p=g.restoreProfile({version:2,gold:Infinity,level:999,skills:{edge:99},forge:{blade:99},unlockedStage:3,lastSeenAt:1e9,inventory:[gear(5),gear(5),{...gear(9),slot:'bogus'}],equipment:{armor:5,weapon:5}},1000);
  assert.equal(p.gold,0);assert.equal(p.level,g.MAX_LEVEL);assert.equal(p.skills.edge,4);assert.equal(p.forge.blade,8);assert.equal(p.unlockedStage,1);assert.equal(p.lastSeenAt,1000);assert.equal(p.inventory.length,1);assert.equal(p.equipment.weapon,5);assert.equal(p.equipment.armor,null);assert.equal(p.nextItemId,6);
});
test('offline scouting requires a cleared boss, caps four hours, and claims once',()=>{
  const now=1e6,p=g.createProfile(now);assert.deepEqual(g.collectOffline(p,now+86400000),{minutes:0,gold:0,xp:0});p.clearedStage=1;p.lastSeenAt=now;
  assert.deepEqual(g.collectOffline(p,now+86400000),{minutes:240,gold:480,xp:240});assert.equal(p.level,1);assert.equal(p.xp,240);assert.equal(p.cores,0);assert.equal(g.collectOffline(p,now+86400000).gold,0);
});
test('random hunts queue warning markers without authored rooms or caches',()=>{const s=g.createGame();g.launch(s);assert.equal(s.spawns.length,16);assert.equal(s.enemies.length,0);assert.equal(s.encounters.length,0);assert.equal(s.caches.length,0);assert.equal(s.run.bossSpawned,false);});
test('three committed directional swings hit once, get stronger and reset after the chain window',()=>{
  const s=hunt(),e=dummy(s,95,0,2000),back=dummy(s,-95,0,2000);s.enemies=[e,back];
  const damages=[];for(let i=1;i<=3;i++){e.x=s.player.x+95;e.y=s.player.y;back.x=s.player.x-95;back.y=s.player.y;const hp=e.hp;assert.equal(g.attack(s,{x:1,y:0}),true);assert.equal(s.player.combo,i);ticks(s,g.COMBOS[i-1].duration+.12);damages.push(hp-e.hp);assert.equal(back.hp,2000);}
  assert.ok(damages[1]>=damages[0]);assert.ok(damages[2]>damages[1]);const hp=e.hp;ticks(s,.7);assert.equal(e.hp,hp);g.attack(s,{x:1,y:0});assert.equal(s.player.combo,1);
});
test('a buffered second swing locks its direction, and dodge cancels pending damage and consumes stamina',()=>{
  const s=hunt(),e=dummy(s);s.enemies=[e];g.attack(s,{x:1,y:0});ticks(s,.2);g.attack(s,{x:1,y:0});ticks(s,.2);assert.equal(s.player.combo,2);
  const fresh=hunt(),enemy=dummy(fresh);fresh.enemies=[enemy];g.attack(fresh);ticks(fresh,.05);assert.equal(g.dash(fresh,{x:1,y:0}),true);assert.equal(fresh.player.stamina<100,true);
  enemy.action='windup';enemy.actionTime=0;enemy.windup=.1;enemy.targetX=fresh.player.x;enemy.targetY=fresh.player.y;enemy.radius=200;
  const hp=fresh.player.hp;ticks(fresh,.15);assert.equal(fresh.player.hp,hp);assert.equal(enemy.hp,500);assert.ok(fresh.player.x>350);assert.equal(g.dash(fresh),false);assert.equal(fresh.player.combo,0);
});
test('heavy attack requires direction, windup and stamina; it no longer selects radial targets',()=>{
  const s=hunt(),front=dummy(s,150),back=dummy(s,-150),side=dummy(s,0,150);s.enemies=[front,back,side];
  assert.equal(g.thunder(s,{x:1,y:0}),true);assert.equal(s.player.action,'heavy');assert.equal(s.player.stamina,65);ticks(s,.2);assert.equal(front.hp,500);ticks(s,.2);
  assert.ok(front.hp<450);assert.equal(back.hp,500);assert.equal(side.hp,500);assert.equal(g.thunder(s),false);
  s.player.thunderCooldown=0;s.player.stamina=20;assert.equal(g.thunder(s),false);assert.equal(s.player.thunderCooldown,0);
});
test('monster telegraphs resolve their marked ellipse and hurt causes a flinch',()=>{
  const s=hunt(),e=dummy(s,50);s.enemies=[e];e.action='windup';e.windup=.5;e.targetX=s.player.x;e.targetY=s.player.y;
  const hp=s.player.hp;ticks(s,.4);assert.equal(s.player.hp,hp);ticks(s,.125);assert.ok(s.player.hp<hp);assert.equal(s.player.action,'hurt');
  const away=hunt(),miss=dummy(away,50);away.enemies=[miss];miss.action='windup';miss.windup=.1;miss.targetX=away.player.x;miss.targetY=away.player.y-90;miss.radius=100;ticks(away,.125);assert.equal(away.player.hp,away.player.maxHp);
});
test('level ups continue combat; permanent skill allocation is an explicit camp activity',()=>{
  const s=hunt();s.enemies=[];s.pickups=[{id:99,x:s.player.x,y:s.player.y,gold:4,xp:g.xpNeeded(1)+5,cores:1}];ticks(s,.05);
  assert.equal(s.profile.level,2);assert.equal(s.profile.xp,5);assert.equal(s.profile.skillPoints,1);assert.equal(s.phase,'playing');assert.equal(s.pickups.length,0);assert.equal(s.profile.gold,4);
  const time=s.run.time;ticks(s,.2);assert.ok(s.run.time>time);assert.equal(g.chooseUpgrade(s,'edge'),false);g.returnToCamp(s);assert.equal(g.upgradeOptions(s).length,6);assert.equal(g.chooseUpgrade(s,'edge'),true);assert.equal(s.profile.skills.edge,1);
});
test('no manual interaction is required by random waves',()=>{const s=g.createGame();g.launch(s);assert.equal(g.interactionTarget(s),null);assert.equal(g.interact(s),false);assert.equal(s.run.items,0);});
test('equipment changes combat stats, saves identity and only unequipped items can be salvaged',()=>{
  const s=g.createGame();s.profile.inventory=[gear(1),gear(2),gear(3,'armor')];const base=g.playerStats(s.profile);assert.equal(g.equipItem(s,1),true);assert.equal(g.playerStats(s.profile).damage,base.damage+10);assert.equal(g.salvageItem(s,1),false);
  assert.equal(g.salvageItem(s,2),true);assert.ok(s.profile.gold>0);assert.equal(g.equipItem(s,3),true);assert.equal(g.playerStats(s.profile).maxHp,base.maxHp+30);
  const loaded=g.restoreProfile(g.encodeProfile(s.profile,2000),2000);assert.equal(loaded.equipment.weapon,1);assert.equal(loaded.equipment.armor,3);assert.equal(loaded.inventory.length,2);
  g.launch(s);assert.equal(g.equipItem(s,3),false);s.paused=true;assert.equal(g.equipItem(s,3),true);
});
test('forge spends currencies atomically and capped skills convert remaining points',()=>{
  const s=g.createGame();s.profile.gold=100;assert.equal(g.upgradeForge(s,'core'),false);assert.equal(s.profile.gold,100);assert.equal(g.upgradeForge(s,'blade'),true);assert.equal(s.profile.gold,70);s.profile.cores=1;assert.equal(g.upgradeForge(s,'core'),true);assert.equal(s.profile.gold,10);assert.equal(g.upgradeForge(s,'bogus'),false);
  const p=g.createProfile();for(const[id,v]of Object.entries(g.UPGRADES))p.skills[id]=v.max;p.skillPoints=2;const camp=g.createGame(p);assert.equal(camp.profile.skillPoints,0);assert.equal(camp.profile.gold,70);
});
test('in-hunt training point conversion is included in earned gold exactly once',()=>{
 const p=g.createProfile();p.level=21;for(const[id,d]of Object.entries(g.UPGRADES))p.skills[id]=d.max;
 const s=g.createGame(p);g.launch(s);s.enemies=[];s.spawns=[];s.barrels=[];s.run.flow='break';s.run.timer=999;
 s.pickups=[{id:99,x:s.player.x,y:s.player.y,gold:4,xp:g.xpNeeded(21),cores:0}];const gold=p.gold;g.advanceGame(s,.025);
 assert.equal(p.level,22);assert.equal(p.gold-gold,39);assert.equal(s.run.gold,39);assert.equal(s.run.trainingGold,35);assert.equal(p.skillPoints,0);g.advanceGame(s,.1);assert.equal(s.run.gold,39);
});
test('pause freezes combat and defeat preserves collected progression',()=>{
  const s=hunt();s.paused=true;const before=JSON.stringify(s);g.advanceGame(s,.1,{x:1,attack:true});assert.equal(JSON.stringify(s),before);assert.equal(g.attack(s),false);s.paused=false;s.profile.gold=77;
  const e=dummy(s,50);s.enemies=[e];e.action='windup';e.windup=.1;e.targetX=s.player.x;e.targetY=s.player.y;e.damage=999;ticks(s,.125);assert.equal(s.phase,'defeat');assert.equal(g.thunder(s),false);g.returnToCamp(s);assert.equal(s.profile.gold,77);
});
test('a trained level-twenty auto build completes all chapter waves and bosses within the minute budgets; full bags protect equipment',()=>{
  const trained=g.createProfile(1000);trained.level=20;trained.skillBook=g.restoreSkillBook(null,20);trained.skillBook.loadout.active=['gather','dance'];trained.skillBook.loadout.passive=['surrounded','finisher',null];trained.skillBook.ranks.gather=1;trained.skillBook.ranks.dance=3;trained.skillBook.auto.ultimate='any';trained.skills.edge=4;trained.skills.haste=3;trained.skills.chain=3;trained.skillPoints=9;trained.inventory=[gear(1)];trained.equipment.weapon=1;const s=g.createGame(trained);s.lootRates={normal:1,elite:1,stage:1,boss:1};s.auto=true;
  for(let stage=1;stage<=3;stage++){assert.equal(g.launch(s,stage),true);for(let i=0;i<24000&&s.phase==='playing';i++)g.advanceGame(s,.05);assert.equal(s.phase,'victory','stage '+stage);assert.equal(s.run.rooms,g.STAGES_PER_CHAPTER);assert.ok(s.run.kills>=770&&s.run.kills<=776);assert.equal(s.run.stageItems,g.STAGES_PER_CHAPTER);assert.ok(s.run.monsterItems>=12);assert.equal(s.run.items,s.run.stageItems+s.run.monsterItems);assert.equal(s.profile.clearedStage,stage);assert.ok(s.enemies.length<20);
    g.returnToCamp(s);for(const slot of ['weapon','armor','charm']){let best=null;for(const item of s.profile.inventory)if(item.slot===slot&&(!best||itemPower(item)>itemPower(best)))best=item;if(best)g.equipItem(s,best.id);}for(const id of ['gather','dance'])while(g.upgradeSkill(s,id)){}for(const id of g.upgradeOptions(s))g.chooseUpgrade(s,id);for(const id of Object.keys(g.FORGE))g.upgradeForge(s,id);
  }
  assert.equal(s.profile.inventory.length,g.INVENTORY_LIMIT);assert.ok(s.profile.inventory.some(i=>i.id===s.profile.equipment.weapon));const p=g.restoreProfile(g.encodeProfile(s.profile,2000),2000);assert.equal(p.clearedStage,3);assert.equal(p.inventory.length,g.INVENTORY_LIMIT);
});


test('inherited object keys cannot masquerade as valid upgrade ids or item slots',()=>{
  const s=g.createGame();s.profile.gold=100;s.profile.skillPoints=1;const before=JSON.stringify(s);
  for(const id of ['constructor','toString','__proto__']){assert.equal(g.forgeCost(s.profile,id),null);assert.equal(g.upgradeForge(s,id),false);assert.equal(g.chooseUpgrade(s,id),false);}
  assert.equal(JSON.stringify(s),before);const p=g.restoreProfile({version:2,inventory:[{id:1,slot:'constructor',name:'invalid',affixes:{damage:99}},{id:2,slot:['weapon'],affixes:{damage:5}}]},1000);assert.deepEqual(p.inventory,[]);
});
test('whoosh is emitted at launch once, contact is emitted once, and early dodge cancels both',()=>{
  const s=hunt();s.enemies=[];s.barrels=[];g.attack(s,{x:1,y:0});assert.equal(s.effects.some(e=>e.type==='swing'),false);ticks(s,.05);assert.equal(s.effects.some(e=>e.type==='swing'),false);ticks(s,.025);assert.equal(s.effects.filter(e=>e.type==='swing').length,1);ticks(s,.075);assert.equal(s.effects.filter(e=>e.type==='swing').length,1);assert.equal(s.effects.filter(e=>e.type==='cleave').length,1);
  const canceled=hunt();canceled.enemies=[];canceled.barrels=[];g.attack(canceled,{x:1,y:0});ticks(canceled,.025);g.dash(canceled,{x:0,y:1});ticks(canceled,.2);assert.equal(canceled.effects.some(e=>['swing','cleave','impact'].includes(e.type)),false);
});
test('knockback feedback uses actual clamped displacement and freezes with combat time',()=>{
  const s=hunt();s.barrels=[];s.player.x=s.bounds.width-s.bounds.padding-110;const e=dummy(s,95);s.enemies=[e];const x=e.x;g.attack(s,{x:1,y:0});ticks(s,.1);assert.equal(e.x,s.bounds.width-s.bounds.padding);assert.equal(e.recoilX,x-e.x);assert.ok(e.hp<2000);
  s.paused=true;const before=JSON.stringify(s);ticks(s,.5);assert.equal(JSON.stringify(s),before);s.paused=false;
  const blocked=hunt();blocked.barrels=[];const b=dummy(blocked,95);Object.assign(b,{type:'bulwark',guard:100,guardMax:100,guardX:-1,guardY:0});blocked.enemies=[b];const bx=b.x;g.attack(blocked,{x:1,y:0});ticks(blocked,.1);assert.equal(b.x,bx);assert.equal(b.recoilX,0);assert.equal(b.hitGuarded,true);
});
test('fatal hits stop gameplay immediately while the death clock and transient effects finish',()=>{
  const s=hunt();s.enemies=[];s.barrels=[];s.player.hp=1;s.profile.gold=77;s.projectiles=[{id:99,x:s.player.x+20,y:s.player.y,vx:-300,vy:0,damage:10,ttl:1,friendly:false}];s.pickups=[{id:100,x:s.player.x,y:s.player.y,gold:999,xp:999,cores:99}];ticks(s,.025);
  assert.equal(s.phase,'defeat');assert.equal(s.player.action,'death');assert.equal(g.resultReady(s),false);assert.equal(s.effects.filter(e=>e.type==='playerDeath').length,1);const player={x:s.player.x,y:s.player.y,hp:s.player.hp,stamina:s.player.stamina},time=s.run.time,profile=JSON.stringify(s.profile);
  ticks(s,.5,{x:1,attack:true});assert.equal(g.resultReady(s),false);assert.equal(s.run.time,time);assert.equal(JSON.stringify(s.profile),profile);assert.deepEqual({x:s.player.x,y:s.player.y,hp:s.player.hp,stamina:s.player.stamina},player);assert.equal(s.pickups.length,1);assert.equal(g.attack(s),false);assert.equal(g.dash(s),false);
  s.paused=true;const before=JSON.stringify(s);ticks(s,.5);assert.equal(JSON.stringify(s),before);s.paused=false;ticks(s,.2);assert.equal(g.resultReady(s),true);assert.equal(s.player.actionTime,.64);assert.equal(s.effects.length,0);ticks(s,10);assert.equal(s.player.actionTime,.64);g.returnToCamp(s);assert.equal(s.profile.gold,77);assert.equal(s.player.action,'idle');assert.equal(s.player.queuedAim,null);
});
test('dash trail snapshots follow the resolved path, stay bounded and never replay the dash sound',()=>{
  const s=hunt();s.enemies=[];s.barrels=[];s.player.x=s.bounds.width-s.bounds.padding-10;g.dash(s,{x:1,y:0});ticks(s,.15);const trails=s.effects.filter(f=>f.type==='dashTrail');assert.equal(trails.length,2);assert.equal(s.effects.filter(f=>f.type==='dash').length,1);assert.ok(trails.every(f=>f.x<=s.bounds.width-s.bounds.padding&&f.heading===0));assert.ok(trails[1].actionTime>trails[0].actionTime);assert.equal(s.player.combo,0);
});
test('victory settles an interrupted windup without damage, regeneration or queued attacks',()=>{
  const s=hunt();s.enemies=[];s.barrels=[];g.attack(s,{x:1,y:0});const e=dummy(s,95);s.enemies=[e];s.phase='victory';s.player.queued=true;s.player.queuedAim={x:-1,y:0};const hp=e.hp,stamina=s.player.stamina,time=s.run.time,profile=JSON.stringify(s.profile);ticks(s,.6,{attack:true});assert.equal(s.player.action,'idle');assert.equal(s.player.queued,false);assert.equal(s.player.queuedAim,null);assert.equal(e.hp,hp);assert.equal(s.player.stamina,stamina);assert.equal(s.run.time,time);assert.equal(JSON.stringify(s.profile),profile);assert.equal(s.effects.some(e=>['cleave','swing'].includes(e.type)),false);assert.equal(g.resultReady(s),true);
});

test('destination walking consumes only the remaining distance across speeds, substeps and hitstop',()=>{
  for(const elapsed of [1/60,.05,.1])for(let heading=0;heading<8;heading++){
    const s=hunt();s.enemies=[];s.barrels=[];s.profile.skills.haste=3;s.profile.inventory=[{id:99,slot:'charm',affixes:{speed:20}}];s.profile.equipment.charm=99;
    const p=s.player,angle=heading*Math.PI/4,destination={x:p.x+Math.cos(angle)*10,y:p.y+Math.sin(angle)*10};s.hitStop=.01;
    let previous=10;for(let i=0;i<15;i++){g.advanceGame(s,elapsed,{destination});const d=Math.hypot(destination.x-p.x,destination.y-p.y);assert.ok(d<=previous+1e-8);previous=d;}
    assert.ok(previous<1e-8);assert.equal(p.action,'idle');const before=JSON.stringify(s);s.paused=true;const paused=JSON.stringify(s);g.advanceGame(s,.1,{destination:{x:999,y:999}});assert.equal(JSON.stringify(s),paused);s.paused=false;assert.equal(JSON.stringify(s),before);
    const x=p.x;g.advanceGame(s,.025,{x:1,destination:{x:Infinity,y:0}});assert.ok(p.x>x);assert.equal(p.heading,0);
  }
  const s=hunt();s.enemies=[];s.barrels=[];const p=s.player,start=p.x;g.advanceGame(s,.1,{destination:{x:start+20,y:p.y},stopDistance:8});assert.ok(Math.abs(p.x-start-12)<1e-8);
});

test('assist keeps near-equal targets, switches for a clear improvement or invalidation and resets outside the hunt',()=>{
  const s=hunt();s.auto=true;s.barrels=[];s.player.attackCooldown=999;s.player.stamina=0;const right=dummy(s,80),left=dummy(s,-80);s.enemies=[right,left];
  for(let i=0;i<30;i++){right.x=s.player.x+80+(i%2?.3:0);left.x=s.player.x-80-(i%2?0:.3);g.advanceGame(s,.025);assert.equal(s.player.heading,0);assert.equal(s.assist.targetId,right.id);}
  right.x=s.player.x+300;g.advanceGame(s,.025);assert.equal(s.assist.targetId,left.id);
  left.dead=true;g.advanceGame(s,.025);assert.equal(s.assist.targetId,right.id);right.group=1;g.advanceGame(s,.025);assert.equal(s.assist.targetId,null);
  s.assist.evade={kind:'enemy',id:999};s.auto=false;g.advanceGame(s,.025,{y:-1});assert.equal(s.player.heading,6);assert.deepEqual(s.assist,{targetId:null,approaching:false,evade:null});
  assert.equal(Object.hasOwn(JSON.parse(g.encodeProfile(s.profile,2000)),'assist'),false);g.returnToCamp(s);g.launch(s,1);assert.deepEqual(s.assist,{targetId:null,approaching:false,evade:null});
});

test('assist exits a windup once, waits outside its boundary and interrupts that wait for an incoming shot',()=>{
  const s=hunt();s.auto=true;s.barrels=[];s.player.attackCooldown=999;s.player.stamina=0;const e=dummy(s,50);e.action='windup';e.actionTime=0;e.windup=2;e.targetX=s.player.x;e.targetY=s.player.y;s.enemies=[e];
  let previous=s.player.x;for(let i=0;i<48;i++){g.advanceGame(s,.025);assert.ok(s.player.x<=previous+1e-8);previous=s.player.x;}
  assert.equal(e.action,'windup');assert.ok(Math.abs(s.player.x-e.targetX)>=e.radius+95);const waiting=s.player.x;ticks(s,.1);assert.equal(s.player.x,waiting);
  s.player.attackCooldown=0;assert.equal(g.attack(s,{x:1,y:0}),true);s.player.actionTime=.17;s.player.attackHit=true;s.player.queued=true;s.player.queuedAim={x:1,y:0};ticks(s,.25);assert.equal(s.player.queued,false);assert.equal(s.player.queuedAim,null);assert.equal(s.player.action,'idle');assert.equal(s.player.combo,1);assert.equal(s.player.x,waiting);
  s.player.stamina=100;s.player.dashCooldown=0;s.projectiles=[{id:999,x:s.player.x+30,y:s.player.y,vx:-300,vy:0,ttl:1,damage:9,friendly:false}];g.advanceGame(s,.025);assert.equal(s.player.action,'dash');assert.ok(s.player.invulnerable>0);
  s.projectiles=[];e.action='idle';e.cooldown=999;ticks(s,.4);assert.equal(s.assist.evade,null);assert.ok(s.player.x>waiting);
});

test('assist leaves an armed core, waits for its fuse and never steps back into the same blast',()=>{
  const s=hunt();s.auto=true;s.enemies=[];s.player.stamina=0;const p=s.player,core={id:999,x:p.x,y:p.y,status:'armed',fuse:2,radius:205};s.barrels=[core];
  let previous=p.x;for(let i=0;i<70;i++){g.advanceGame(s,.025);assert.ok(p.x>=previous-1e-8);previous=p.x;}
  assert.equal(core.status,'armed');assert.ok(Math.abs(p.x-core.x)>=core.radius+60);const hp=p.hp;const x=p.x;ticks(s,.4);assert.equal(core.status,'spent');assert.equal(p.hp,hp);assert.equal(p.x,x);assert.equal(s.assist.evade,null);
});

test('skitter contact dispatches only at windup completion and applies its damage once',()=>{
  const s=hunt();s.barrels=[];const e=dummy(s,50);e.action='windup';e.actionTime=0;e.windup=.48;e.targetX=s.player.x;e.targetY=s.player.y;s.enemies=[e];const hp=s.player.hp;
  ticks(s,.45);assert.equal(s.player.hp,hp);assert.equal(s.effects.some(f=>f.type==='skitterStrike'),false);ticks(s,.05);assert.equal(e.action,'attack');assert.ok(s.player.hp<hp);assert.equal(s.effects.filter(f=>f.type==='skitterStrike').length,1);const hitHp=s.player.hp;ticks(s,.3);assert.equal(s.player.hp,hitHp);
});

test('skitter flinch cancels its windup and death remains presentation-only with one reward',()=>{
  const s=hunt();s.barrels=[];const e=dummy(s,50);e.action='windup';e.actionTime=0;e.windup=.48;e.targetX=s.player.x;e.targetY=s.player.y;s.enemies=[e];g.attack(s,{x:1,y:0});ticks(s,.1);assert.equal(e.action,'hurt');ticks(s,.2);assert.equal(s.effects.some(f=>f.type==='skitterStrike'),false);
  e.hp=1;g.attack(s,{x:1,y:0});ticks(s,.35);assert.equal(e.dead,true);assert.equal(s.effects.filter(f=>f.type==='skitterDeath').length,1);assert.equal(s.run.kills,1);const hp=s.player.hp;
  ticks(s,.2);const gold=s.profile.gold,xp=s.profile.xp;s.phase='defeat';s.player.action='death';s.player.hp=0;s.player.actionTime=0;const time=s.run.time,clock=e.actionTime;ticks(s,.5);assert.ok(e.actionTime>clock);assert.equal(s.run.time,time);assert.equal(s.profile.gold,gold);assert.equal(s.profile.xp,xp);assert.equal(s.run.kills,1);
  s.paused=true;const paused=e.actionTime;ticks(s,.5);assert.equal(e.actionTime,paused);assert.ok(hp>0);
});
