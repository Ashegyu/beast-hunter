import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {BOSS_LOOT,bossLootPool,rollItem,rollAncient} from '../dist/loot.js';import {ANCIENT_POWERS} from '../dist/ancient-powers.js';import {freezeCombat} from './combat-fixture.mjs';
const owned=(row,id=1)=>({id,slot:row.slot,tier:row.tier,catalogId:row.id,artId:row.artId,name:row.name,rarity:5,affixes:{}});
function arena(row){const p=g.createProfile();p.inventory=[owned(row)];p.equipment[row.slot==='earring'?'earringLeft':row.slot]=1;const s=g.createGame(p);g.launch(s);freezeCombat(s);s.run.flow='combat';s.run.waveQuota=1e6;s.run.waveKills=0;s.enemies=[];s.barrels=[];s.uniqueState.cooldowns={};s.uniqueState.cooldownKeys=[];s.uniqueState.ancientZones=[];s.run.ancientProcs=0;s.effects=[];s.player.invulnerable=999;s.player.hp=s.player.maxHp*.5;return s;}
function enemy(s,x=80,y=0){const e={id:s.nextId++,type:'skitter',elite:false,boss:false,x:s.player.x+x,y:s.player.y+y,hp:10000,maxHp:10000,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,guardMax:0,dead:false,group:null,wave:s.run.wave,runStage:s.run.stage,damage:20,radius:58,lookX:0,lookY:1};s.enemies.push(e);return e;}
function advance(s,time){for(let left=time;left>1e-8;left-=.025)g.advanceGame(s,Math.min(left,.025));}
function fire(s,row){const r=row.signature,p=s.player;switch(r.trigger){
 case 'normal':case 'finisher':case 'heavy':case 'counter':p.action='idle';p.attackCooldown=0;p.thunderCooldown=0;p.stamina=100;p.combo=r.trigger==='finisher'?2:0;p.comboWindow=.5;p.counterReady=r.trigger==='counter'?2:0;assert.ok(['heavy','counter'].includes(r.trigger)?g.thunder(s,{x:1,y:0}):g.attack(s,{x:1,y:0}));advance(s,p.swing.impact);break;
 case 'perfect':Object.assign(s.enemies[0],{action:'windup',windup:1,actionTime:.9,targetX:p.x,targetY:p.y});g.dash(s,{x:-1,y:0});break;
 case 'dash':g.dash(s,{x:-1,y:0});break;
 case 'hurt':case 'lowHp':p.invulnerable=0;if(r.trigger==='lowHp')p.hp=p.maxHp*.3;s.projectiles.push({id:s.nextId++,x:p.x,y:p.y,vx:1,vy:0,damage:5,ttl:1,friendly:false});advance(s,.025);break;
 case 'idle':advance(s,1.55);break;
 // Alpha 0.110 triggers that replace 파쇄/완벽 반격/정지 under auto combat.
 case 'skill':p.stamina=100;p.aimX=1;p.aimY=0;p.action='idle';s.skillRuntime.casting=null;s.skillRuntime.cooldowns.crescent=0;assert.ok(g.useSkill(s,'crescent',{x:1,y:0}));break;
 case 'crit':{s.profile.inventory[0].affixes={crit:99};const before=s.run.ancientProcs;for(let n=0;n<16&&s.run.ancientProcs===before;n++){p.action='idle';p.attackCooldown=0;p.stamina=100;p.combo=0;p.comboWindow=.5;g.attack(s,{x:1,y:0});advance(s,p.swing?.impact??.1);}break;}
 case 'kill':{const e=enemy(s,30,0);e.hp=1;p.action='idle';p.attackCooldown=0;p.stamina=100;p.combo=0;p.comboWindow=.5;g.attack(s,{x:1,y:0});advance(s,p.swing.impact);break;}
 case 'periodic':advance(s,.025);break;
 case 'pickup':s.pickups.push({id:s.nextId++,kind:'loot',x:p.x,y:p.y,age:1,gold:0,xp:0,cores:1});advance(s,.025);break;
 default:assert.fail(r.trigger);
}}
test('75 ancient identities have their own authored recipes and partitioned legacy source pools',()=>{
 // Alpha 0.110: the fifteen 0.97 parts have authored powers too, and no recipe uses a manual-only trigger.
 assert.equal(ANCIENT_POWERS.length,75);assert.equal(new Set(ANCIENT_POWERS.map(r=>r.name)).size,75);assert.equal(new Set(ANCIENT_POWERS.map(({id,name,index,color,description,...recipe})=>JSON.stringify(recipe))).size,75);
 assert.equal(new Set(ANCIENT_POWERS.map(r=>r.index)).size,75);assert.ok(ANCIENT_POWERS.every(r=>!['heavy','counter','idle'].includes(r.trigger)&&!r.thunderRefund));
 for(const row of g.ANCIENT_CATALOG)assert.equal(row.signature.id,row.id);
 assert.equal(new Set(BOSS_LOOT.flatMap(b=>b.items.map(r=>r.id))).size,75);
 for(const boss of BOSS_LOOT){assert.equal(boss.items.length,25);assert.equal(bossLootPool(boss.id,boss.tier),boss.items);for(const row of boss.items){assert.equal(row.signature.id,row.id);assert.equal(row.bossId,boss.id);assert.ok(Object.isFrozen(row.signature));const item=rollAncient({id:2,tier:boss.tier,bossId:boss.id},(boss.items.indexOf(row)+.5)/boss.items.length);assert.equal(item.catalogId,row.id);assert.equal(item.rarity,5);}}
 let calls=0;assert.throws(()=>rollItem({id:1,tier:1,bossId:'frost_king'},()=>++calls),RangeError);assert.equal(calls,0);assert.throws(()=>rollAncient({id:1,tier:2,bossId:'bad'},.5),RangeError);
});
for(const row of g.ANCIENT_CATALOG)test(row.id+' activates via '+row.signature.trigger+' with real combat effects',()=>{
 const s=arena(row);for(let n=0;n<4;n++)enemy(s,40+n*15,n*8);const beforeHp=s.player.hp,beforeEnemy=s.enemies.reduce((a,e)=>a+e.hp,0);
 const r=row.signature;if(r.cdr)s.skillRuntime.cooldowns.probe=10;if(r.execute)s.enemies[0].hp=s.enemies[0].maxHp*.01;
 fire(s,row);assert.ok(s.effects.some(f=>f.type==='ancientSig'&&f.ancientId===row.id),r.name);assert.equal(s.run.ancientProcs,1);assert.ok(s.uniqueState.cooldowns['ancient:'+row.id]>0);
 if(r.shots){assert.ok(s.projectiles.some(q=>q.ancientSpec?.ancient.id===row.id));advance(s,.4);}
 if(r.damage||r.bleed)assert.ok(s.enemies.reduce((a,e)=>a+e.hp,0)<beforeEnemy,r.name+' damage');
 if(r.chill)assert.ok(s.enemies.some(e=>e.chillRemaining>0),r.name+' chill');
 if(r.shield)assert.ok(s.uniqueState.ancientShields[row.slot]?.amount>0,r.name+' shield');
 if(r.ticks)assert.ok(s.uniqueState.ancientZones.length>0,r.name+' zone');
 if(r.cdr)assert.ok(s.skillRuntime.cooldowns.probe<10,r.name+' cooldown');
 if(r.fury)assert.equal(s.uniqueState.ancientBuffs.fury.value,r.fury);if(r.haste)assert.equal(s.uniqueState.ancientBuffs.haste.value,r.haste);
 if(r.invuln)assert.ok(s.player.invulnerable>0,r.name+' invulnerable');if(r.execute)assert.ok(s.enemies[0].dead,r.name+' execute');
 if(r.heal&&!['hurt','lowHp'].includes(r.trigger)&&!r.hpCost)assert.ok(s.player.hp>beforeHp,r.name+' healing');
 const procs=s.run.ancientProcs;fire(s,row);assert.equal(s.run.ancientProcs,procs,'cooldown excludes duplicate');
});
test('nonlethal sacrifices and affordability reserve no cooldown on failed proc',()=>{
 const row=g.ANCIENT_CATALOG.find(r=>r.signature.trigger==='periodic'&&r.signature.hpCost),s=arena(row);s.player.hp=s.player.maxHp*row.signature.hpCost;advance(s,.025);assert.equal(s.run.ancientProcs,0);assert.equal(s.uniqueState.cooldowns['ancient:'+row.id],undefined);s.player.hp+=1;advance(s,.025);assert.equal(s.run.ancientProcs,1);assert.ok(s.player.hp>0);
});
test('shield wholly absorbed hit has no hurt proc or lastDamage mutation and owner swap cancels banks',()=>{
 const row=g.ANCIENT_CATALOG.find(r=>r.signature.trigger==='hurt'),s=arena(row),p=s.player;enemy(s);s.uniqueState.ancientShields[row.slot]={amount:100,time:3,owner:1};p.invulnerable=0;const hp=p.hp,last=p.lastDamage;s.projectiles.push({id:100,x:p.x,y:p.y,vx:1,vy:0,damage:5,ttl:1,friendly:false});advance(s,.025);assert.equal(p.hp,hp);assert.equal(p.lastDamage,last);assert.equal(s.run.ancientProcs,0);s.paused=true;const other=g.ANCIENT_CATALOG.find(r=>r.slot===row.slot&&r.id!==row.id);s.profile.inventory.push(owned(other,2));g.equipItem(s,2);assert.equal(s.uniqueState.ancientShields[row.slot],null);
});
test('captured attack retains old signature after paused swap but cannot leave unowned zones',()=>{
 const row=g.ANCIENT_CATALOG.find(r=>r.slot==='weapon'&&r.signature.ticks&&r.signature.trigger==='normal'),s=arena(row);enemy(s);Object.assign(s.player,{action:'idle',attackCooldown:0,stamina:100,combo:0,comboWindow:.5});g.attack(s,{x:1,y:0});const snapshot=s.player.swing.unique;s.paused=true;const replacement=g.ANCIENT_CATALOG.find(r=>r.slot==='weapon'&&r.id!==row.id);s.profile.inventory.push(owned(replacement,2));g.equipItem(s,2);s.paused=false;advance(s,s.player.swing.impact);assert.equal(snapshot.ancient.id,row.id);assert.ok(s.effects.some(f=>f.ancientId===row.id));assert.equal(s.uniqueState.ancientZones.length,0);
});
test('spatial ticks pause and terminate at stage boundary without resetting signature cooldown',()=>{
 const row=g.ANCIENT_CATALOG.find(r=>r.signature.ticks&&r.signature.trigger==='dash'),s=arena(row);enemy(s);fire(s,row);const timer=s.uniqueState.ancientZones[0].timer;s.paused=true;advance(s,10);assert.equal(s.uniqueState.ancientZones[0].timer,timer);s.paused=false;s.run.wave=3;s.run.waveKills=s.run.waveQuota;s.enemies=[];advance(s,.025);assert.equal(s.run.flow,'combat');assert.equal(s.run.stage,2);assert.equal(s.uniqueState.ancientZones.length,0);assert.ok(s.uniqueState.cooldowns['ancient:'+row.id]>0);
});
