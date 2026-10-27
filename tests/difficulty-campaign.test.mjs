import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {createBackup,readBackup} from '../dist/profile-backup.js';
import {openMode} from './mode-fixture.mjs';
// Rows hold one entry per chapter; tests spell out the first three and pad the rest.
const pad=(row,fill=0)=>[...row,...Array(g.STAGES.length-row.length).fill(fill)];
const prepared=()=>{const p=g.createProfile(1000);p.clearedStage=1;p.unlockedStage=2;p.stageProgress=pad([10,0,0]);p.bossMastery=pad([0,-1,-1],-1);return p;};
// Alpha 0.139: 정예 needs every chapter cleared on 일반 (mode-fixture.mjs).
const opened=()=>openMode(g,g.createProfile(1000),1,1);
const ALL=g.STAGES.map(()=>10);
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
 const restored=g.restoreProfile(p,1000);assert.equal(restored.version,16);assert.deepEqual(restored.stageProgress,pad([10,0,0]));assert.deepEqual(restored.bossMastery,pad([2,-1,-1],-1));assert.deepEqual(restored.difficultyProgress,[pad([0,0,0]),pad([0,0,0])]);assert.equal(restored.gold,713);
 assert.equal(g.stageLimit(restored,1,1),0,'0.139: 일반 60장 전에는 정예가 닫혀 있다');assert.equal(g.stageLimit(restored,1,2),0);assert.deepEqual(g.restoreProfile(g.encodeProfile(restored,1000),1000),restored);
 assert.deepEqual(readBackup(createBackup(p,1000),1000).profile,restored);
 // The earned 악몽 mastery of chapter 1 still counts once the campaign is done: 정예 2장 opens, 악몽 waits for every 정예 chapter.
 openMode(g,restored,1,1);assert.equal(g.stageLimit(restored,1,1),1);assert.equal(g.stageLimit(restored,2,1),1);assert.equal(g.stageLimit(restored,3,1),0);assert.equal(g.stageLimit(restored,1,2),0);
});
test('advanced campaigns cannot skip checkpoints and record a full chapter independently',()=>{
 const p=opened(),s=g.createGame(p);const before=JSON.stringify(s);
 for(const [chapter,stage,mode]of [[1,10,1],[1,2,1],[1,1,2],[2,1,1],[1,1,3],[1,0,1]])assert.equal(g.launch(s,chapter,stage,null,mode),false);
 assert.equal(JSON.stringify(s),before);assert(g.launch(s,1,1,null,1));
 for(let stage=1;stage<=10;stage++){
  for(let wave=1;wave<=g.stageWaveCount(stage);wave++)clearWave(s);
  assert.equal(g.completedStages(p,1,1),stage);assert.deepEqual(p.stageProgress,ALL);assert.equal(p.clearedStage,60);assert.equal(p.unlockedStage,60);
  if(stage<10){assert.equal(s.phase,'playing');assert.equal(s.difficulty,1);assert.equal(s.run.stage,stage+1);}
 }
 assert.equal(s.phase,'victory');assert.equal(p.bossMastery[0],1);assert.equal(g.stageLimit(p,2,1),1,'다음 정예 챕터가 열린다');assert.equal(g.stageLimit(p,1,2),0,'악몽은 정예 60장 뒤');assert.equal(g.completedStages(p,1,2),0);
 const receipt=g.encodeProfile(p,1000);advance(s,5);assert.equal(g.encodeProfile(p,1000),receipt,'victory is paid once');
 g.returnToCamp(s);p.bossMastery=p.bossMastery.map(()=>1);assert.equal(g.stageLimit(p,1,2),1);assert(g.launch(s,1,1,null,2));for(let n=0;n<3;n++)clearWave(s);
 assert.equal(g.completedStages(p,1,2),1);assert.equal(g.completedStages(p,1,1),10);assert.equal(g.stageLimit(p,1,2),2);
 const loaded=readBackup(createBackup(p,1000),1000).profile;assert.deepEqual(loaded.difficultyProgress,[pad([10,0,0]),pad([1,0,0])]);assert(g.launch(g.createGame(loaded),1,2,null,2));assert.equal(g.launch(g.createGame(loaded),1,3,null,2),false);
});
test('advanced ordinary waves apply their health and damage multipliers without changing the roster',()=>{
 const p=opened();p.bossMastery=p.bossMastery.map(()=>1);const runs=[0,1,2].map(mode=>{const s=g.createGame(structuredClone(p));assert(g.launch(s,1,1,null,mode));advance(s,1);return s;});
 for(const mode of [1,2]){const base=runs[0].enemies[0],enemy=runs[mode].enemies[0];assert.equal(enemy.species,base.species);const k=g.modeScale(1,mode);assert.equal(enemy.maxHp,Math.round(base.maxHp*k.hp));assert.ok(Math.abs(enemy.damage-base.damage*k.damage)<1e-6);assert.equal(runs[mode].run.timeLimit,60);}
});
test('restore bounds advanced rows and backup rejects malformed version-nine progress',()=>{
 const p=opened();p.bossMastery[0]=1;p.difficultyProgress=[pad([99,8,3]),pad([99,-4,8])];
 const restored=g.restoreProfile(p,1000);assert.deepEqual(restored.difficultyProgress,[pad([10,8,0]),pad([0,0,0])],'정예는 한 장씩, 악몽은 정예 60장 뒤');
 assert.throws(()=>createBackup(p,1000));const valid=opened();valid.difficultyProgress=[pad([2,0,0]),pad([0,0,0])];assert.deepEqual(readBackup(createBackup(valid,1000),1000).profile.difficultyProgress,valid.difficultyProgress);
});
test('0.139: 정예/악몽 continue the chapter curve, 악몽 gives no experience and keeps the fastest boss record',()=>{
 assert.deepEqual(g.modeScale(7,0),{hp:1,damage:1,reward:1,chapter:7});assert.equal(g.modeScale(1,1).chapter,60.5);assert.equal(g.modeScale(60,1).chapter,90);assert.equal(g.modeScale(1,2).chapter,90.5);assert.equal(g.modeScale(60,2).chapter,120);
 assert.ok(Math.abs(g.modeScale(1,1).hp-g.STAGES[59].hpScale/g.STAGES[0].hpScale)<.1*g.modeScale(1,1).hp,'정예 1장은 일반 60장 남짓');
 for(const d of [1,2])for(let c=2;c<=60;c++)assert.ok(g.modeChapter(c,d)>g.modeChapter(c-1,d)&&g.modeScale(c,d).hp*g.STAGES[c-1].hpScale>g.modeScale(c-1,d).hp*g.STAGES[c-2].hpScale,'계속 오른다 '+d+'-'+c);
 const p=openMode(g,g.createProfile(1000),2,1);p.bossMastery=p.bossMastery.map(()=>1);p.difficultyProgress=[g.STAGES.map(()=>10),pad([9])];p.level=150;
 const xp=mode=>{const q=structuredClone(p);if(!mode)q.difficultyProgress[1][0]=0;const s=g.createGame(q);assert.ok(g.launch(s,1,1,null,mode));s.enemies=[];s.spawns=[];s.player.invulnerable=999;s.pickups=[{id:9999,x:s.player.x,y:s.player.y,gold:5,xp:400,cores:0}];advance(s,.1);return {xp:q.xp,gold:q.gold};};
 assert.ok(xp(1).xp>=400,'정예는 경험치를 준다');assert.equal(xp(2).xp,0,'악몽은 경험치 없음');assert.ok(xp(2).gold>=5,'보상은 그대로');
 const kill=(q,wait)=>{const s=g.createGame(q);assert.ok(g.launch(s,1,10,null,2));s.spawns=[];s.barrels=[];s.run.bossSpawned=true;s.player.invulnerable=999;advance(s,wait);
  const e={id:s.nextId++,species:g.STAGES[0].bossSpecies,type:'bulwark',elite:false,boss:true,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];
  s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});advance(s,.05);assert.equal(s.phase,'victory');return s;};
 const first=kill(structuredClone(p),8);const record=first.profile.nightmareRecords[0];assert.ok(record>=8&&record<9,String(record));assert.equal(first.run.nightmareRecord.best,true);
 const slower=kill(structuredClone(first.profile),20);assert.equal(slower.profile.nightmareRecords[0],record);assert.equal(slower.run.nightmareRecord.best,false);
 const faster=kill(structuredClone(first.profile),3);assert.ok(faster.profile.nightmareRecords[0]<record);
 assert.equal(g.restoreProfile(g.encodeProfile(faster.profile,1000),1000).nightmareRecords[0],faster.profile.nightmareRecords[0]);
 assert.equal(g.restoreProfile({...JSON.parse(g.encodeProfile(p,1000)),nightmareRecords:pad([12.3])},1000).nightmareRecords[0],0,'악몽 보스를 못 잡은 챕터의 기록은 버린다');
});
