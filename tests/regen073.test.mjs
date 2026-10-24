import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
const ALWAYS=Object.freeze({normal:1,elite:1,stage:1,boss:1});// Alpha 0.115: drops are rolls; force them where a test needs one.
function arena(){const s=g.createGame(g.createProfile(1000));g.launch(s);s.enemies=[];s.barrels=[];s.player.invulnerable=999;s.lootRates=ALWAYS;return s;}
function actor(s,delay=0){return {id:s.nextId++,type:'skitter',species:'forest_wolf',x:s.player.x+220,y:s.player.y,delay,warning:.75,locked:true};}
function kill(s,e){s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e6,ttl:1,friendly:true});g.advanceGame(s,.025);}
test('last live kill pulls a delayed reservation forward within the same update without changing the roster',()=>{
 const s=arena();s.spawns=[actor(s),actor(s,10)];s.run.waveQuota=2;s.run.stageQuota=2;g.advanceGame(s,.001);const e=s.enemies[0];const before=s.run.timeRemaining;
 s.paused=true;const paused=JSON.stringify(s);g.advanceGame(s,.1);assert.equal(JSON.stringify(s),paused);s.paused=false;
 kill(s,e);assert.equal(s.run.wave,1);assert.equal(s.run.kills,1);assert.equal(s.spawns.length,0);assert.equal(s.enemies.filter(e=>!e.dead).length,1);assert.equal(g.remainingMonsters(s),1);assert.ok(s.run.timeRemaining<before);
 g.advanceGame(s,.05);assert.equal(s.enemies.filter(e=>!e.dead).length,1);assert.equal(s.run.kills,1);
});
test('a final wave kill starts six members of the next pack immediately with the same minute budget',()=>{
 const s=arena();s.spawns=[actor(s)];s.run.waveQuota=1;g.advanceGame(s,.001);const e=s.enemies[0],before=s.run.timeRemaining;kill(s,e);
 assert.equal(s.run.wave,2);assert.equal(s.run.flow,'combat');assert.equal(s.enemies.filter(e=>!e.dead).length,6);assert.ok(s.spawns.length>0);assert.equal(s.run.kills,1);assert.ok(s.run.timeRemaining<before);assert.equal(s.run.timeLimit,60);
 assert.ok(s.enemies.filter(e=>!e.dead).every(e=>Math.hypot(e.x-s.player.x,e.y-s.player.y)>=170));
});
test('stage transition settles earned gear once, carries receipts and starts combat at sixty seconds',()=>{
 const s=arena();s.run.wave=3;s.run.stageQuota=s.run.waveQuota=1;s.spawns=[actor(s)];s.profile.lootPity=9;g.advanceGame(s,.001);kill(s,s.enemies[0]);
 assert.equal(s.run.stage,2);assert.equal(s.run.wave,1);assert.equal(s.run.flow,'combat');assert.equal(s.run.timeRemaining,60);assert.equal(s.enemies.filter(e=>!e.dead).length,6);assert.equal(s.profile.stageProgress[0],1);assert.equal(s.run.stageItems,1);assert.equal(s.run.monsterItems,1);assert.equal(s.profile.pendingLoot.length,0);assert.equal(s.profile.inventory.length,2);
 assert.ok(s.effects.some(f=>f.type==='loot'&&f.stageReward));assert.deepEqual(s.effects.filter(f=>f.type==='stageClear').map(f=>({chapterId:f.chapterId,stage:f.stage})),[{chapterId:1,stage:1}]);const gold=s.profile.gold,cores=s.profile.cores;g.advanceGame(s,.05);assert.equal(s.profile.gold,gold);assert.equal(s.profile.cores,cores);assert.equal(s.run.stageItems,1);
});
