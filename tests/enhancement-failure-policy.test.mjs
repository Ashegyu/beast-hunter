import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {rollAncient} from '../dist/loot.js';
import {enhanceOwned,rerollOwned,resolveOwnedReroll} from '../dist/equipment-progression.js';
import {createBackup,readBackup} from '../dist/profile-backup.js';
function fixture(grade=5,target=40,failures=0){
 const row=g.CRAFTED_CATALOG[0],item=grade===5?rollAncient({id:1,tier:1},.5):{id:1,catalogId:row.id,artId:row.artId,slot:row.slot,tier:row.tier,rarity:6,name:row.name,affixes:{...row.base},rollVersion:1};
 item.enhancement=target-1;if(failures)item.enhanceFailures=failures;
 const p=g.createProfile(1000);p.inventory=[item];p.nextItemId=2;p.gold=1e8;p.cores=1000;for(const m of g.MATERIALS)p.materials[m.id]=100000;return g.restoreProfile(p,1000);
}
test('ancient +30 and crafted +40 switch policy by target; preceding targets still guarantee success',()=>{
 for(const [grade,target,mode,attempts]of [[5,29,'guaranteed',30],[5,30,'incremental',null],[6,39,'guaranteed',40],[6,40,'none',null]]){
  const p=fixture(grade,target,999),s=g.enhancementStatus(p,1);assert.equal(s.mode,mode);assert.equal(s.attempts,attempts);assert.equal(s.guaranteed,mode==='guaranteed');assert.equal(s.remaining,attempts?1:null);
  let draws=0;const r=enhanceOwned(p,1,()=>{draws++;return .999999;});assert.equal(draws,attempts?0:1);assert.equal(r.success,mode==='guaranteed');
 }
});
test('every ancient correction stack adds 0.1 percentage point up to 20 while the base rate stays unchanged',()=>{
 for(let target=30;target<=40;target++)for(let failures=0;failures<=25;failures++){
  const p=fixture(5,target,failures),s=g.enhancementStatus(p,1),base=g.enhancementRule(target,5).chance;
  assert.equal(s.chance,Math.round((base+Math.min(failures,20)*.001)*10000)/10000);assert.equal(s.baseChance,base);assert.equal(s.failures,Math.min(failures,20));assert.equal(s.guaranteed,false);
 }
 assert.equal(g.enhancementStatus(fixture(5,30,20),1).chance,.05);assert.equal(g.enhancementStatus(fixture(5,40,20),1).chance,.025);
});
test('ancient still draws after 100 failures, caps state at 20, charges exactly once and never lowers stats',()=>{
 const p=fixture(),item=p.inventory[0],before=structuredClone(p),cost=g.enhancementStatus(p,1).cost;let draws=0;
 for(let n=1;n<=100;n++){const r=enhanceOwned(p,1,()=>{draws++;return .99999;});assert.equal(r.success,false);assert.equal(item.enhanceFailures,Math.min(n,20));assert.match(r.reason,/확률 보정/);assert.doesNotMatch(r.reason,/보장까지/);}
 assert.equal(draws,100);assert.equal(item.enhancement,39);assert.deepEqual(item.affixes,before.inventory[0].affixes);assert.deepEqual(item.enhancementAffixes,before.inventory[0].enhancementAffixes);assert.equal(p.gold,before.gold-100*cost.gold);
 for(const m of g.MATERIALS)assert.equal(p.materials[m.id],before.materials[m.id]-100*(cost.materials[m.id]??0));
});
test('actual random threshold uses the corrected chance, and a successful new target starts with zero correction',()=>{
 for(const [draw,success]of [[.014999,true],[.015,false]]){const p=fixture(5,40,10);assert.equal(enhanceOwned(p,1,()=>draw).success,success);}
 const p=fixture(5,30,20),other=structuredClone(p.inventory[0]);other.id=2;p.inventory.push(other);p.nextItemId=3;
 assert.equal(enhanceOwned(p,1,()=>.04).success,true);assert.equal(p.inventory[0].enhanceFailures,undefined);assert.equal(p.inventory[1].enhanceFailures,20);assert.equal(g.enhancementStatus(p,1).chance,g.enhancementRule(31,5).chance);
 const atLimit=fixture(5,40,20);assert.equal(enhanceOwned(atLimit,1,()=>.025).success,false);assert.equal(atLimit.inventory[0].enhanceFailures,20);
});
test('crafted +40 through +50 have no correction, no guaranteed attempt and no persisted failure counter',()=>{
 for(let target=40;target<=50;target++){
  const p=fixture(6,target,999);p.gold=1e12;assert.equal(p.inventory[0].enhanceFailures,undefined);let draws=0;
  for(let n=0;n<60;n++){const s=g.enhancementStatus(p,1);assert.equal(s.chance,s.baseChance);assert.equal(s.failures,0);assert.equal(s.guaranteed,false);assert.equal(s.remaining,null);const r=enhanceOwned(p,1,()=>{draws++;return .99999;});assert.equal(r.success,false);assert.equal(p.inventory[0].enhanceFailures,undefined);assert.match(r.reason,/확률 보정·보장 없음/);}
  assert.equal(draws,60);assert.equal(p.inventory[0].enhancement,target-1);
 }
});
test('save and backup preserve correction, clamp legacy ancient failures and discard crafted legacy pity',()=>{
 for(const [grade,target,failures,expected]of [[5,29,999,29],[5,30,29,20],[5,40,14,14],[6,39,999,39],[6,40,39,undefined],[6,50,49,undefined]]){
  let p=fixture(grade,target,failures);assert.equal(p.inventory[0].enhanceFailures,expected);const before=structuredClone(p);
  for(let n=0;n<5;n++)p=readBackup(createBackup(p,1000),1000).profile;assert.deepEqual(p,before);
 }
 for(const grade of [5,6]){const p=fixture(grade,g.enhancementCap(grade),20);p.inventory[0].enhancement=g.enhancementCap(grade);assert.equal(g.restoreProfile(p,1000).inventory[0].enhanceFailures,undefined);}
});
test('unpayable, pending and non-camp attempts preserve correction, resources and RNG',()=>{
 for(const grade of [5,6]){
  const p=fixture(grade,grade===5?40:50,20),cost=g.enhancementStatus(p,1).cost;
  for(const key of ['gold',...Object.keys(cost.materials)]){const q=structuredClone(p);if(key==='gold')q.gold=cost.gold-1;else q.materials[key]=cost.materials[key]-1;const before=structuredClone(q);assert.equal(enhanceOwned(q,1,()=>{throw Error('blocked RNG');}).ok,false);assert.deepEqual(q,before);}
  const pending=structuredClone(p);pending.inventory[0].rerollCandidate={affixes:{...pending.inventory[0].affixes}};const before=structuredClone(pending);assert.equal(enhanceOwned(pending,1,()=>{throw Error('pending RNG');}).ok,false);assert.deepEqual(pending,before);
  const s=g.createGame(p);s.phase='playing';s.paused=true;const saved=structuredClone(p);assert.equal(g.enhanceItem(s,1).ok,false);assert.deepEqual(p,saved);
 }
});
test('reroll acceptance and rejection preserve ancient correction and accumulated enhancement bonuses',()=>{
 for(const accept of [true,false]){let p=fixture(5,40,20);const before=structuredClone(p.inventory[0]);assert.equal(rerollOwned(p,1,()=>.999999).ok,true);p=readBackup(createBackup(p,1000),1000).profile;assert.equal(resolveOwnedReroll(p,1,accept).ok,true);assert.equal(p.inventory[0].enhanceFailures,20);assert.deepEqual(p.inventory[0].enhancementAffixes,before.enhancementAffixes);assert.equal(g.enhancementStatus(p,1).chance,.025);}
});
