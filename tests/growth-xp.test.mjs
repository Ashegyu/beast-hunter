import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
const profile=(level,xp=0)=>{const p=g.createProfile(1000);p.level=level;p.xp=xp;p.skillBook=g.restoreSkillBook(null,level);return p;};
function apply(p,xp){p.xp+=xp;while(p.level<50&&p.xp>=g.xpNeeded(p.level)){p.xp-=g.xpNeeded(p.level);p.level++;p.skillPoints++;}if(p.level===50)p.xp=0;}
function grant(p,base){const xp=g.growthXp(p,base);apply(p,xp);return xp;}
test('growth bands preserve tutorial and endgame, and the XP query never writes the profile',()=>{
 for(const [level,rate]of [[1,1],[4,1],[5,4],[19,4],[20,2],[39,2],[40,1],[50,1]]){
  const p=profile(level),before=JSON.stringify(p);assert.equal(g.growthXpMultiplier(level),rate);assert.equal(g.growthXp(p,9),9*rate);assert.equal(JSON.stringify(p),before);
 }
});
test('a large grant equals per-unit and partitioned grants across every growth boundary',()=>{
 for(const level of [1,4,5,18,19,20,38,39,40,49,50])for(const nearBoundary of [false,true]){
  const p=profile(level,nearBoundary&&level<50?g.xpNeeded(level)-1:0),batch=structuredClone(p),units=structuredClone(p),parts=structuredClone(p),base=1200;
  const earned=grant(batch,base);let unitXp=0;for(let i=0;i<base;i++)unitXp+=grant(units,1);
  let splitXp=0;for(const n of [17,240,1,942])splitXp+=grant(parts,n);
  assert.equal(earned,unitXp);assert.equal(earned,splitXp);assert.deepEqual(batch,units);assert.deepEqual(batch,parts);
 }
 const p=profile(19,g.xpNeeded(19)-1);assert.equal(grant(p,17),36);assert.equal(p.level,20);assert.equal(p.xp,35);
});
test('invalid and extreme grants stay finite and capped without per-point work',()=>{
 const p=profile(19),before=JSON.stringify(p);for(const n of [-100,NaN,Infinity,-Infinity,0])assert.equal(g.growthXp(p,n),0);
 const earned=g.growthXp(p,Number.MAX_SAFE_INTEGER);assert.ok(Number.isSafeInteger(earned));assert.ok(earned>0);assert.equal(JSON.stringify(p),before);
 const full=profile(49,g.xpNeeded(49)-1);grant(full,1e9);assert.equal(full.level,50);assert.equal(full.xp,0);
});
test('combat and scouting credit the same band-aware experience once, including boundary carry',()=>{
 const p=profile(19,g.xpNeeded(19)-1);p.clearedStage=1;p.unlockedStage=2;p.stageProgress=[10,0,0];const offline=structuredClone(p),s=g.createGame(p);g.launch(s);s.enemies=[];s.spawns=[];s.barrels=[];s.run.flow='break';s.run.timer=999;
 s.pickups=[{id:999,x:s.player.x,y:s.player.y,gold:0,xp:17,cores:0}];g.advanceGame(s,.025);const reward=g.collectOffline(offline,1000+17*60000);
 assert.equal(reward.xp,36);assert.equal(s.run.xp,reward.xp);assert.equal(s.run.xpBonus,19);assert.equal(p.level,offline.level);assert.equal(p.xp,offline.xp);assert.equal(p.skillPoints,offline.skillPoints);
 const before=g.encodeProfile(p,1000);g.advanceGame(s,.1);assert.equal(g.encodeProfile(p,1000),before);assert.equal(s.run.xp,36);assert.deepEqual(g.collectOffline(offline,1000+17*60000),{minutes:0,gold:0,xp:0});
 s.paused=true;const paused=JSON.stringify(s);g.advanceGame(s,.1);assert.equal(JSON.stringify(s),paused);
});
test('existing progress reloads without rescaling XP, retroactive levels or auto-equipped skills',()=>{
 for(const level of [4,5,19,20,39,40,49]){
  const p=profile(level,g.xpNeeded(level)-1);p.gold=91;p.skillBook.loadout.ultimate=[null];const restored=g.restoreProfile(g.encodeProfile(p,1000),1000);
  assert.equal(restored.level,p.level);assert.equal(restored.xp,p.xp);assert.equal(restored.gold,91);assert.deepEqual(restored.skillBook,p.skillBook);
  grant(restored,1);assert.equal(restored.level,level+1);assert.equal(restored.xp,g.growthXpMultiplier(level)-1);
 }
});
