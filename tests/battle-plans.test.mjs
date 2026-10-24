import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {BATTLE_PLANS,waveComposition} from '../dist/battle-plans.js';
function stage(n,seed=0,view=null){const p=g.createProfile(1000);p.stageProgress[0]=9;p.hunts=seed;const s=g.createGame(p);assert.ok(g.launch(s,1,n,view));return s;}
function advance(s,seconds){for(let t=0;t<seconds;t+=.025)g.advanceGame(s,.025);}
function shootAll(s){s.player.invulnerable=100;s.barrels=[];for(let i=0;i<g.MAX_ACTIVE_ENEMIES&&(s.spawns.length||s.enemies.some(e=>!e.dead));i++){for(const e of s.enemies.filter(e=>!e.dead))s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e6,ttl:1,friendly:true});advance(s,.025);}}
test('ten authored encounters ramp density, mix roles and reserve the final stage for one boss',()=>{
  assert.equal(BATTLE_PLANS.length,10);assert.equal(g.STAGES_PER_CHAPTER,10);assert.equal(new Set(BATTLE_PLANS.map(p=>p.formation)).size,8);
  let previous=0;
  for(let n=1;n<=9;n++){
    assert.equal(g.stageWaveCount(n),3);const plan=g.battlePlan(n);assert.ok(plan.interval>=.065&&plan.interval<=.11);let total=0;
    for(let w=1;w<=3;w++){const a=waveComposition(n,w),b=waveComposition(n,w);assert.ok(a.length>=16&&a.length<=40);assert.ok(a.filter(e=>e.elite).length<=1);assert.ok(a.every(e=>!e.boss));assert.equal(new Set(a.map(e=>e.type)).size,n===9?1:3);total+=a.length;a[0].type='bad';assert.notEqual(b[0].type,'bad');}
    assert.ok(total>previous);previous=total;
  }
  assert.deepEqual(waveComposition(10,1),[{type:'bulwark',boss:true,elite:false}]);assert.deepEqual(waveComposition(10,2),[]);assert.equal(g.stageWaveCount(10),1);assert.equal(g.battlePlan(10).barrels,0);
  assert.deepEqual([1,2,3].map(w=>waveComposition(7,w).find(a=>a.elite).type),['skitter','spitter','bulwark']);
  assert.throws(()=>{BATTLE_PLANS[0].waves[0].skitter=99;},TypeError);
});
test('crossfire authored headings face opposite sides and positions vary across hunts',()=>{
  const s=stage(2),a=s.spawns.filter(q=>q.type==='spitter');assert.ok(Math.abs(Math.cos(a[0].heading-a[1].heading)+1)<1e-9);assert.equal(s.spawns.length,19);
  const before=s.spawns.map(q=>[q.x,q.y]);g.returnToCamp(s);g.launch(s,1,2);assert.notDeepEqual(s.spawns.map(q=>[q.x,q.y]),before);
});
test('survival moves straight to the next living pack after a clear, with no minimum survival wait',()=>{
 const s=stage(4);assert.equal(g.battlePlan(4).minimumTime,0);s.player.invulnerable=100;advance(s,4);
 assert.equal(s.enemies.filter(e=>!e.dead).length,25);const wave=s.run.wave;
 for(let i=0;i<32&&s.run.wave===wave;i++){for(const e of s.enemies.filter(e=>!e.dead))s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e6,ttl:1,friendly:true});advance(s,.025);}
 assert.equal(s.run.wave,2);assert.equal(s.run.flow,'combat');assert.ok(s.enemies.some(e=>!e.dead));assert.ok(s.run.waveTime<.1);
 s.paused=true;const snapshot=JSON.stringify(s);advance(s,10);assert.equal(JSON.stringify(s),snapshot);
});
test('survival retry resets timer and reservations without granting a checkpoint',()=>{
  const s=stage(4);advance(s,2);g.returnToCamp(s);g.launch(s,1,4);assert.equal(s.run.waveTime,0);assert.equal(s.run.waveKills,0);assert.equal(s.spawns.length,25);assert.equal(s.profile.stageProgress[0],9);
});
test('immediate elite reinforcements preserve species and guard without a blocking warning',()=>{
 const s=stage(3);s.spawns=[];s.enemies=[];s.run.wave=2;s.run.waveKills=s.run.waveQuota;s.player.invulnerable=100;advance(s,.025);
 assert.equal(s.run.wave,3);assert.ok(s.enemies.some(e=>!e.dead));advance(s,4);
 const elite=s.enemies.find(e=>e.elite);assert.equal(elite.type,'bulwark');// Stage 3 of chapter 1 fields that stage's bulwark (Alpha 0.107 lineups); elites keep its own guard.
 assert.equal(elite.species,g.STAGES[0].stages[2].bulwark);assert.equal(elite.guard,elite.guardMax);assert.ok(elite.maxHp>s.enemies.find(e=>e.type==='bulwark'&&!e.elite).maxHp);
});
test('dense reservations stay reachable and distinct on narrow views across 100 seeds',()=>{
  for(let seed=0;seed<100;seed++)for(const n of [3,6,9]){const s=stage(n,seed,{width:360,height:640});
    for(let i=0;i<s.spawns.length;i++){const q=s.spawns[i];assert.ok(Math.hypot(q.x-s.player.x,q.y-s.player.y)>=170);for(let j=0;j<i;j++)assert.ok(Math.hypot(q.x-s.spawns[j].x,q.y-s.spawns[j].y)>1,'overlapping reservation seed '+seed);}
  }
});
test('delayed arrivals follow movement until their warning begins, then keep the marked point',()=>{
  const s=stage(9),q=s.spawns.find(q=>!q.elite&&q.delay>1.5),original={x:q.x,y:q.y};s.player.invulnerable=100;s.player.x=1700;s.player.y=1160;
  while(!q.locked)advance(s,.025);assert.ok(Math.hypot(q.x-original.x,q.y-original.y)>500);assert.ok(Math.hypot(q.x-s.player.x,q.y-s.player.y)<550);
  const marked={x:q.x,y:q.y};s.player.x+=200;advance(s,.3);assert.equal(q.x,marked.x);assert.equal(q.y,marked.y);assert.ok(s.spawns.includes(q));
});
test('all three chapters and all replay modes launch a boss with no adds or props',()=>{
 for(let chapter=1;chapter<=3;chapter++)for(let mode=0;mode<=2;mode++){
  const p=g.createProfile();p.clearedStage=3;p.unlockedStage=3;p.bossMastery=[2,2,2];p.difficultyProgress=[[9,9,9],[9,9,9]];const s=g.createGame(p);assert.ok(g.launch(s,chapter,10,null,mode));assert.equal(s.spawns.length,1);assert.ok(s.spawns[0].boss);assert.equal(s.barrels.length,0);advance(s,1.4);assert.equal(s.enemies.length,1);assert.equal(s.enemies[0].species,g.STAGES[chapter-1].bossSpecies);s.player.invulnerable=100;advance(s,20);assert.equal(s.enemies.filter(e=>!e.dead).length,1);assert.equal(s.spawns.length,0);assert.equal(s.run.wave,1);
 }
});
test('legacy checkpoints migrate once and current ten-stage saves retain gear, materials and progression',()=>{
 for(let version=1;version<=7;version++)for(let completed=0;completed<=4;completed++){
  const p=g.createProfile(1000);p.version=version;p.clearedStage=1;p.unlockedStage=2;p.stageProgress=[5,completed,0];p.gold=75;p.level=12;p.materials.root=4;
  const a=g.restoreProfile(p,1000);assert.equal(a.version,14);assert.deepEqual(a.stageProgress.slice(0,3),[10,completed*2,0]);assert.equal(a.stageProgress.length,g.STAGES.length);assert.equal(a.gold,75);assert.equal(a.level,12);assert.equal(a.materials.root,version>=7?4:0);assert.equal(g.stageLimit(a,2),completed*2+1);assert.deepEqual(g.restoreProfile(g.encodeProfile(a,1000),1000),a);
 }
 const p=g.createProfile(1000);p.stageProgress[0]=9;assert.equal(g.stageLimit(g.restoreProfile(p,1000),1),10);
});
