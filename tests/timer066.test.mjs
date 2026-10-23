import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function advance(s,seconds){for(let left=seconds;left>1e-8;left-=.025)g.advanceGame(s,Math.min(.025,left));}
function idle(s){s.enemies=[];s.spawns=[];s.barrels=[];s.run.flow='break';s.run.timer=999;s.player.invulnerable=999;return s;}
function fresh(stage=1,chapter=1,mode=0){
 const p=g.createProfile(1000);if(stage>1||chapter>1||mode){p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[1,1,1];p.difficultyProgress=[[9,9,9],[9,9,9]];}
 const s=g.createGame(p);assert.equal(g.launch(s,chapter,stage,null,mode),true);return s;
}
function actor(s,boss=false){
 const q=s.spawns[0];s.spawns=[{...q,type:boss?'bulwark':'skitter',boss,elite:false,delay:0,x:s.player.x+85,y:s.player.y}];s.barrels=[];s.player.invulnerable=999;
 g.advanceGame(s,.001);return s.enemies[0];
}
function shot(s,e){s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});}

test('all chapter encounters and boss modes start with explicit limits and the complete remaining roster',()=>{
 for(let chapter=1;chapter<=3;chapter++)for(let stage=1;stage<=10;stage++){
  const s=fresh(stage,chapter);assert.equal(s.run.timeLimit,60);assert.equal(s.run.timeRemaining,s.run.timeLimit);assert.equal(s.run.timedOut,false);
  const expected=g.battlePlan(stage).waves.reduce((n,w)=>n+w.skitter+w.spitter+w.bulwark,0);assert.equal(g.remainingMonsters(s),expected);assert.equal(s.run.stageQuota,expected);
 }
 for(let chapter=1;chapter<=3;chapter++)for(let mode=1;mode<=2;mode++){const s=fresh(10,chapter,mode);assert.equal(s.run.timeLimit,60);assert.equal(g.remainingMonsters(s),1);}
 const camp=g.createGame();assert.equal(g.remainingMonsters(camp),0);
});
test('spawns and wave breaks never inflate the remaining count; valid kills decrement exactly once',()=>{
 const s=fresh(),e=actor(s);assert.equal(g.remainingMonsters(s),56);shot(s,e);shot(s,e);g.advanceGame(s,.025);assert.equal(s.run.kills,1);assert.equal(s.run.stageKills,1);assert.equal(g.remainingMonsters(s),55);
 // Replayed stale identities cannot satisfy the current encounter quota.
 const stale={...e,id:s.nextId++,dead:false,hp:1,maxHp:1,action:'idle',actionTime:0,wave:s.run.wave+1,runStage:s.run.stage};s.enemies=[stale];shot(s,stale);s.hitStop=0;g.advanceGame(s,.025);assert.equal(s.run.stageKills,1);assert.equal(g.remainingMonsters(s),55);
 idle(s);s.run.timer=.05;const count=g.remainingMonsters(s);advance(s,.1);assert.equal(s.run.wave,2);assert.equal(g.remainingMonsters(s),count);assert.ok(s.spawns.length>0);
});
test('clock counts combat, warnings and breaks, freezes while paused or clearing, then resets for the next encounter',()=>{
 const s=fresh();g.advanceGame(s,.1);near(s.run.timeRemaining,59.9);s.paused=true;const snapshot=JSON.stringify(s);advance(s,3);assert.equal(JSON.stringify(s),snapshot);s.paused=false;
 idle(s);advance(s,.2);near(s.run.timeRemaining,59.7);
 s.run.flow='stageClear';s.run.timer=.05;advance(s,.025);near(s.run.timeRemaining,59.7);assert.equal(g.remainingMonsters(s),0);
 advance(s,.025);assert.equal(s.run.stage,2);near(s.run.timeRemaining,60);assert.equal(g.remainingMonsters(s),64);assert.equal(s.run.stageKills,0);
});
test('both pre-existing and newly created contact freezes consume the elapsed challenge budget',()=>{
 const s=idle(fresh());s.hitStop=.075;s.run.timeRemaining=1;g.advanceGame(s,.1);near(s.run.timeRemaining,.9);
 const hit=fresh(),e=actor(hit);e.hp=e.maxHp=1e6;e.speed=0;e.cooldown=999;assert.equal(g.attack(hit,{x:1,y:0}),true);hit.player.actionTime=hit.player.swing.impact-.01;hit.run.timeRemaining=1;g.advanceGame(hit,.1);
 assert.ok(e.hp<1e6);assert.ok(hit.hitStop>0);near(hit.run.timeRemaining,.9);
 hit.run.timeRemaining=.01;g.advanceGame(hit,.1);assert.equal(hit.phase,'defeat');assert.equal(hit.run.timeRemaining,0);
});
test('fractional deadline bounds movement and cancels pending damage, spawns, casts and held combos',()=>{
 const s=fresh(),e=actor(s);e.cooldown=999;e.speed=0;e.hp=e.maxHp=1e6;const x=s.player.x,hp=s.player.hp;s.run.timeRemaining=.04;assert.equal(g.attack(s,{x:1,y:0}),true);s.player.queued=true;s.player.queuedAim={x:1,y:0};
 s.spawns.push({id:s.nextId++,type:'skitter',x:500,y:500,delay:.5});g.advanceGame(s,.1,{x:1,attack:true});assert.equal(s.phase,'defeat');assert.equal(s.run.flow,'timeout');assert.equal(s.run.timeRemaining,0);assert.equal(s.run.timedOut,true);assert.equal(e.hp,1e6);assert.equal(s.player.hp,hp);assert.ok(s.player.x-x<20);
 assert.equal(s.player.action,'idle');assert.equal(s.player.swing,null);assert.equal(s.player.queued,false);assert.equal(s.player.queuedAim,null);assert.equal(s.spawns.length,0);assert.equal(s.projectiles.length,0);assert.equal(g.resultReady(s),true);assert.equal(g.attack(s),false);assert.equal(g.dash(s),false);assert.equal(g.useSkill(s,'crescent'),false);
 const gold=s.profile.gold,kills=s.run.kills;advance(s,10);assert.equal(s.profile.gold,gold);assert.equal(s.run.kills,kills);assert.equal(s.run.timeRemaining,0);
});
test('already expired budget cannot admit one more contact, and invalid elapsed values do nothing',()=>{
 const s=fresh(),e=actor(s);shot(s,e);s.run.timeRemaining=0;for(const dt of [0,-1,NaN,Infinity]){const before=JSON.stringify(s);g.advanceGame(s,dt,{attack:true});assert.equal(JSON.stringify(s),before);}
 g.advanceGame(s,.01,{attack:true});assert.equal(s.phase,'defeat');assert.equal(e.dead,false);assert.equal(s.run.stageKills,0);
});
test('final contact exactly on the deadline can complete a normal encounter or boss without timeout',()=>{
 for(const stage of [1,10]){
  const s=fresh(stage),e=actor(s,stage===10);s.run.wave=stage===10?1:3;e.wave=s.run.wave;e.runStage=stage;s.run.waveQuota=1;s.run.waveKills=0;s.run.stageKills=s.run.stageQuota-1;s.run.timeRemaining=.025;shot(s,e);g.advanceGame(s,.1);
  assert.equal(s.run.timedOut,false);assert.equal(s.run.rooms,1);if(stage===10){assert.equal(s.run.stageKills,s.run.stageQuota);assert.equal(g.remainingMonsters(s),0);assert.equal(s.phase,'victory');}else{assert.equal(s.phase,'playing');assert.equal(s.run.stage,2);assert.equal(s.run.stageKills,0);assert.equal(s.run.timeRemaining,60);assert.ok(s.enemies.some(e=>!e.dead));}
 }
});
test('timeout settles reserved gear once, preserves earned progression and grants no unfinished-stage rewards',()=>{
 const s=idle(fresh());s.profile.gold=77;s.profile.cores=4;s.profile.xp=17;s.run.gold=12;s.run.xp=17;
 const row=g.ITEM_CATALOG[0],item={id:s.profile.nextItemId++,catalogId:row.id,slot:row.slot,tier:row.tier,artId:row.artId,name:row.name,rarity:1,affixes:{...row.base}};s.profile.pendingLoot.push(item);s.pickups.push({id:s.nextId++,kind:'equipment',item,x:0,y:0},{id:s.nextId++,x:0,y:0,gold:99,xp:99,cores:99});
 const hp=s.player.hp;s.run.timeRemaining=.01;g.advanceGame(s,.1);assert.equal(s.phase,'defeat');assert.equal(s.player.hp,hp);assert.equal(s.profile.gold,77);assert.equal(s.profile.cores,4);assert.equal(s.profile.xp,17);assert.deepEqual(s.profile.stageProgress,[0,0,0]);assert.equal(s.profile.clearedStage,0);assert.equal(s.profile.unlockedStage,1);assert.equal(s.run.stageItems,0);assert.equal(s.run.rooms,0);assert.equal(s.profile.pendingLoot.length,0);assert.equal(s.profile.inventory.filter(i=>i.id===item.id).length,1);assert.equal(s.run.monsterItems,1);
 advance(s,1);g.returnToCamp(s);assert.equal(s.profile.inventory.filter(i=>i.id===item.id).length,1);assert.equal(s.profile.gold,77);assert.equal(s.profile.xp,17);assert.equal(g.launch(s),true);assert.equal(s.run.timedOut,false);assert.equal(s.run.timeRemaining,60);assert.equal(s.run.stageKills,0);assert.equal(s.run.monsterItems,0);
});
test('boss timeout does not award a kill, unlock or mastery, and a retry receives a fresh boss budget',()=>{
 const p=g.createProfile(1000);p.stageProgress=[9,0,0];p.bossMastery=[0,0,0];const s=g.createGame(p);g.launch(s,1,10);const progress=[...s.profile.stageProgress];s.run.timeRemaining=.01;g.advanceGame(s,.1);assert.equal(s.phase,'defeat');assert.equal(s.run.bossKilled,false);assert.equal(s.run.cores,0);assert.equal(s.run.rooms,0);assert.equal(g.remainingMonsters(s),1);assert.deepEqual(s.profile.stageProgress,progress);assert.deepEqual(s.profile.bossMastery,[0,0,0]);assert.equal(s.profile.unlockedStage,1);
 g.returnToCamp(s);assert.equal(g.launch(s,1,10),true);assert.equal(s.run.timeRemaining,60);assert.equal(g.remainingMonsters(s),1);assert.equal(s.spawns.length,1);
});
