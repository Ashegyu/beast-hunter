import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {waveComposition} from '../dist/battle-plans.js';
const chapterKills=g.BATTLE_PLANS.reduce((sum,p)=>sum+p.waves.reduce((n,w,i)=>n+waveComposition(p.id,i+1).length,0),0);
export function advance(s,seconds){for(let i=0;i<Math.ceil(seconds/.025);i++)g.advanceGame(s,.025);}
export function clearWave(s){
  const wave=s.run.wave,stage=s.run.stage;s.player.invulnerable=100;s.barrels.length=0;
  advance(s,Math.max(4,g.battlePlan(s.run.stage).minimumTime+.1));
  // Overlapping bodies can intercept a point projectile aimed at another actor.
  // Re-aim through real collision handling until this bounded wave is cleared.
  for(let attempt=0;attempt<g.MAX_ACTIVE_ENEMIES&&s.run.stage===stage&&s.run.wave===wave&&(s.spawns.length||s.enemies.some(e=>!e.dead));attempt++){
    for(const e of s.enemies.filter(e=>!e.dead))s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e6,ttl:1,friendly:true});
    advance(s,.05);
  }
  assert.ok(!s.enemies.some(e=>!e.dead&&e.runStage===stage&&e.wave===wave));
}
test('spawn warning, deterministic seed, random replay and stage locks',()=>{
  const a=g.createGame(g.createProfile(1000)),b=g.createGame(g.createProfile(1000));
  assert.equal(g.launch(a,1,2),false);assert.equal(g.launch(a,2),false);
  g.launch(a);g.launch(b);assert.deepEqual(a.spawns,b.spawns);assert.equal(a.enemies.length,0);assert.equal(a.spawns.length,16);
  assert.ok(a.spawns.every(q=>q.delay>=g.SPAWN_WARNING&&Math.hypot(q.x-a.player.x,q.y-a.player.y)>=170));
  advance(a,.7);assert.equal(a.enemies.length,0);advance(a,.1);assert.equal(a.enemies.length,1);
  const positions=b.spawns.map(q=>[q.x,q.y]);g.returnToCamp(b);g.launch(b);assert.notDeepEqual(b.spawns.map(q=>[q.x,q.y]),positions);
});
test('three complete waves award exactly one checkpoint and pause freezes automatic transition',()=>{
  const s=g.createGame();g.launch(s);
  for(let wave=1;wave<=3;wave++){assert.equal(s.run.wave,wave);clearWave(s);if(wave<3){assert.equal(s.run.flow,'combat');assert.equal(s.run.wave,wave+1);assert.ok(s.enemies.some(e=>!e.dead));}}
  assert.equal(s.run.flow,'combat');assert.equal(s.run.stage,2);assert.equal(s.run.kills,56);assert.equal(s.run.stageItems,1);assert.ok(s.run.monsterItems>=1);assert.equal(s.profile.stageProgress[0],1);
  const before=JSON.stringify(s);s.paused=true;advance(s,5);s.paused=false;assert.equal(JSON.stringify(s),before);
  assert.ok(s.enemies.some(e=>!e.dead));
  assert.equal(s.run.stage,2);assert.equal(s.run.wave,1);assert.equal(s.run.waveQuota,19);assert.equal(s.run.stageItems,1);assert.ok(s.run.monsterItems>=1);
  const p=g.restoreProfile(g.encodeProfile(s.profile));assert.equal(g.stageLimit(p,1),2);const retry=g.createGame(p);assert.equal(g.launch(retry,1,2),true);assert.equal(g.launch(g.createGame(p),1,3),false);
});
test('30 substages retain chapter identity and only final bosses unlock the next chapter',()=>{
  const s=g.createGame();
  for(let chapter=1;chapter<=3;chapter++){
    g.returnToCamp(s);assert.equal(g.launch(s,chapter),true);
    for(let stage=1;stage<=g.STAGES_PER_CHAPTER;stage++){
      for(let wave=1;wave<=g.stageWaveCount(stage);wave++){
        assert.equal(s.run.stage,stage);assert.equal(s.run.wave,wave);assert.equal(s.run.bossSpawned,stage===g.STAGES_PER_CHAPTER);
        assert.ok(s.spawns.every(q=>q.boss===(stage===g.STAGES_PER_CHAPTER)));
        clearWave(s);
        if(wave<g.stageWaveCount(stage))assert.ok(s.enemies.some(e=>!e.dead));
      }
      if(stage<g.STAGES_PER_CHAPTER){assert.equal(s.phase,'playing');assert.equal(s.profile.clearedStage,chapter-1);}
    }
    assert.equal(s.phase,'victory');assert.equal(s.run.kills,chapterKills);assert.equal(s.run.rooms,g.STAGES_PER_CHAPTER);assert.equal(s.run.stageItems,g.STAGES_PER_CHAPTER);assert.ok(s.run.monsterItems>=12);assert.equal(s.run.items,s.run.stageItems+s.run.monsterItems);assert.equal(s.profile.pendingLoot.length,0);assert.equal(s.profile.stageProgress[chapter-1],g.STAGES_PER_CHAPTER);
    assert.equal(s.profile.unlockedStage,chapter+1);assert.ok(s.enemies.length<20);
    const reward=s.profile.gold;advance(s,5);assert.equal(s.profile.gold,reward);
  }
});
test('pending or living enemies cannot be skipped and death cancels stage advance',()=>{
  const s=g.createGame();g.launch(s);s.run.waveKills=4;advance(s,.1);assert.equal(s.run.flow,'combat');advance(s,3);assert.equal(s.run.flow,'combat');
  s.player.hp=1;s.player.invulnerable=0;s.projectiles.push({id:s.nextId++,x:s.player.x,y:s.player.y,vx:0,vy:0,damage:999,ttl:1,friendly:false});advance(s,.1);assert.equal(s.phase,'defeat');advance(s,20);assert.equal(s.run.stage,1);assert.deepEqual(s.profile.stageProgress,g.STAGES.map(()=>0));
});
test('v1/v2 migration and v3 sanitization preserve gear and cap forged checkpoints',()=>{
  for(const version of [1,2,3,4]){const p=g.createProfile(1000);p.version=version;p.clearedStage=1;p.unlockedStage=2;p.gold=73;p.stageProgress=[999,999,999];p.inventory=[{id:1,slot:'weapon',tier:1,rarity:0,name:'검',affixes:{damage:8}}];p.equipment.weapon=1;
    const restored=g.restoreProfile(p,1000);assert.deepEqual(restored.stageProgress.slice(0,3),[10,8,0]);assert.equal(restored.gold,73);assert.equal(restored.equipment.weapon,1);assert.equal(g.stageLimit(restored,3),0);}
});
test('corner spawns stay reachable, safely spaced, and concurrency remains bounded',()=>{
  for(const [x,y] of [[80,80],[3520,80],[80,2200],[3520,2200]]){
    const s=g.createGame();g.launch(s);s.player.x=x;s.player.y=y;s.enemies=[];s.spawns=[];s.barrels=[];s.run.waveKills=s.run.waveQuota;
    advance(s,1.7);assert.equal(s.run.wave,2);
    assert.ok(s.spawns.every(q=>q.x>=80&&q.x<=3520&&q.y>=80&&q.y<=2200&&Math.hypot(q.x-x,q.y-y)>=170));
    const pending=s.spawns[0];s.enemies=[];s.spawns=Array.from({length:g.MAX_ACTIVE_ENEMIES+2},(_,i)=>({...pending,id:s.nextId++,delay:0,x:200+i*100,y:1000}));
    advance(s,.1);assert.equal(s.enemies.filter(e=>!e.dead).length,g.MAX_ACTIVE_ENEMIES);assert.equal(s.spawns.length,2);
  }
});
test('a stale boss cannot complete a new stage and duplicate contacts award only one kill',()=>{
  const s=g.createGame();s.profile.stageProgress[0]=9;g.launch(s,1,10);s.run.wave=1;s.run.bossSpawned=true;s.run.waveQuota=1;s.spawns=[{id:s.nextId++,x:700,y:1100,type:'bulwark',boss:true,delay:0}];advance(s,.025);
  const boss=s.enemies[0];boss.wave=2;s.barrels=[];s.player.invulnerable=99;
  for(let i=0;i<2;i++)s.projectiles.push({id:s.nextId++,x:boss.x,y:boss.y,vx:0,vy:0,damage:1e6,ttl:1,friendly:true});
  advance(s,.1);assert.equal(s.run.kills,1);assert.equal(s.run.waveKills,0);assert.equal(s.phase,'playing');assert.equal(s.profile.clearedStage,0);assert.equal(s.profile.unlockedStage,1);
});
