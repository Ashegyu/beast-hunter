import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {createBackup,readBackup} from '../dist/profile-backup.js';
// Rows hold one entry per chapter; tests spell out the first three and pad the rest.
const pad=(row,fill=0)=>[...row,...Array(g.STAGES.length-row.length).fill(fill)];
const prepared=()=>{const p=g.createProfile(1000);p.clearedStage=1;p.unlockedStage=2;p.stageProgress=pad([10,0,0]);p.bossMastery=pad([0,-1,-1],-1);return p;};
const advance=(s,t)=>{for(let left=t;left>1e-8;left-=.025)g.advanceGame(s,Math.min(left,.025));};
function clearWave(s){
 const stage=s.run.stage,wave=s.run.wave;s.player.invulnerable=999;s.barrels.length=0;
 advance(s,4);
 for(let n=0;n<g.MAX_ACTIVE_ENEMIES&&s.phase==='playing'&&s.run.stage===stage&&s.run.wave===wave;n++){
  for(const e of s.enemies.filter(e=>!e.dead))s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});
  advance(s,.05);
 }
 assert(!s.enemies.some(e=>!e.dead&&e.runStage===stage&&e.wave===wave));
}
test('v8 boss-only saves preserve earned state and start advanced campaigns at zero',()=>{
 const p=prepared();p.version=8;p.stageProgress=[10,0,0];p.bossMastery=[2,-1,-1];p.gold=713;delete p.difficultyProgress;
 const restored=g.restoreProfile(p,1000);assert.equal(restored.version,15);assert.deepEqual(restored.stageProgress,pad([10,0,0]));assert.deepEqual(restored.bossMastery,pad([2,-1,-1],-1));assert.deepEqual(restored.difficultyProgress,[pad([0,0,0]),pad([0,0,0])]);assert.equal(restored.gold,713);
 assert.equal(g.stageLimit(restored,1,1),1);assert.equal(g.stageLimit(restored,1,2),1);assert.deepEqual(g.restoreProfile(g.encodeProfile(restored,1000),1000),restored);
 assert.deepEqual(readBackup(createBackup(p,1000),1000).profile,restored);
});
test('advanced campaigns cannot skip checkpoints and record a full chapter independently',()=>{
 const p=prepared(),s=g.createGame(p);const before=JSON.stringify(s);
 for(const [chapter,stage,mode]of [[1,10,1],[1,2,1],[1,1,2],[2,1,1],[1,1,3],[1,0,1]])assert.equal(g.launch(s,chapter,stage,null,mode),false);
 assert.equal(JSON.stringify(s),before);assert(g.launch(s,1,1,null,1));
 for(let stage=1;stage<=10;stage++){
  for(let wave=1;wave<=g.stageWaveCount(stage);wave++)clearWave(s);
  assert.equal(g.completedStages(p,1,1),stage);assert.deepEqual(p.stageProgress,pad([10,0,0]));assert.equal(p.clearedStage,1);assert.equal(p.unlockedStage,2);
  if(stage<10){assert.equal(s.phase,'playing');assert.equal(s.difficulty,1);assert.equal(s.run.stage,stage+1);}
 }
 assert.equal(s.phase,'victory');assert.equal(p.bossMastery[0],1);assert.equal(g.stageLimit(p,1,2),1);assert.equal(g.completedStages(p,1,2),0);
 const receipt=g.encodeProfile(p,1000);advance(s,5);assert.equal(g.encodeProfile(p,1000),receipt,'victory is paid once');
 g.returnToCamp(s);assert(g.launch(s,1,1,null,2));for(let n=0;n<3;n++)clearWave(s);
 assert.equal(g.completedStages(p,1,2),1);assert.equal(g.completedStages(p,1,1),10);assert.equal(g.stageLimit(p,1,2),2);
 const loaded=readBackup(createBackup(p,1000),1000).profile;assert.deepEqual(loaded.difficultyProgress,[pad([10,0,0]),pad([1,0,0])]);assert(g.launch(g.createGame(loaded),1,2,null,2));assert.equal(g.launch(g.createGame(loaded),1,3,null,2),false);
});
test('advanced ordinary waves apply their health and damage multipliers without changing the roster',()=>{
 const p=prepared();p.bossMastery[0]=1;const runs=[0,1,2].map(mode=>{const s=g.createGame(structuredClone(p));assert(g.launch(s,1,1,null,mode));advance(s,1);return s;});
 for(const mode of [1,2]){const base=runs[0].enemies[0],enemy=runs[mode].enemies[0];assert.equal(enemy.species,base.species);assert.equal(enemy.maxHp,Math.round(base.maxHp*g.HUNT_MODES[mode].hp));assert.equal(enemy.damage,base.damage*g.HUNT_MODES[mode].damage);assert.equal(runs[mode].run.timeLimit,60);}
});
test('restore bounds advanced rows and backup rejects malformed version-nine progress',()=>{
 const p=prepared();p.bossMastery[0]=1;p.difficultyProgress=[pad([99,8,3]),pad([99,-4,8])];
 const restored=g.restoreProfile(p,1000);assert.deepEqual(restored.difficultyProgress,[pad([10,0,0]),pad([9,0,0])]);
 assert.throws(()=>createBackup(p,1000));const valid=prepared();valid.difficultyProgress=[pad([2,0,0]),pad([0,0,0])];assert.deepEqual(readBackup(createBackup(valid,1000),1000).profile.difficultyProgress,valid.difficultyProgress);
});
