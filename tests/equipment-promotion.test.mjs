import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {rollItem,rollAncient,promotionPreview,storeItem} from '../dist/loot.js';
import {enhanceOwned,promoteOwned} from '../dist/equipment-progression.js';import {createBackup,readBackup} from '../dist/profile-backup.js';
function item(grade,id=1){if(grade===5)return rollAncient({id,tier:1},.5);if(grade===6){const r=g.CRAFTED_CATALOG[0];return {id,catalogId:r.id,artId:r.artId,slot:r.slot,tier:r.tier,rarity:6,name:r.name,affixes:{...r.base},rollVersion:1};}let n=0;return rollItem({id,tier:1,minimum:grade},()=>++n===1?.5/36:n===2?0:.1);}
function profile(i){const p=g.createProfile(1000);p.inventory=[i];p.nextItemId=2;p.gold=1e8;p.cores=1000;for(const m of g.MATERIALS)p.materials[m.id]=100000;return p;}
test('every grade reaches exactly its cap, then rejects further enhancement without payment or RNG',()=>{
 for(let grade=0;grade<=6;grade++){const i=item(grade),cap=g.enhancementCap(grade);i.enhancement=cap-1;if(grade<5)i.enhanceFailures=g.enhancementRule(cap,grade).attempts-1;else if(grade===5)i.enhanceFailures=20;const p=profile(i);
  let draws=0;assert.equal(enhanceOwned(p,1,()=>{draws++;return 0;}).success,true);assert.equal(draws,grade>=5?1:0);assert.equal(i.enhancement,cap);const before=structuredClone(p);assert.equal(enhanceOwned(p,1,()=>{throw Error('capped RNG');}).ok,false);assert.deepEqual(p,before);
  for(const [key,v]of Object.entries(i.affixes))assert.ok(Math.abs(g.effectiveAffix(i,key)-Math.round(v*(100+cap*3))/100)<1e-9);
  const loaded=readBackup(createBackup(p,1000),1000).profile;assert.deepEqual(loaded.inventory[0],i);assert.equal(g.enhancementLevel(loaded.inventory[0]),cap);
 }
});
test('normal through mythic worst-case attempt totals remain bounded',()=>{
 const limits=[41,100,200,300,600];for(let grade=0;grade<=4;grade++){const i=item(grade),p=profile(i);p.gold=1e12;let attempts=0;
  while(g.enhancementLevel(i)<g.enhancementCap(grade)){assert.equal(enhanceOwned(p,1,()=>.999999).ok,true);assert.ok(++attempts<=limits[grade]);}
  assert.equal(attempts,limits[grade]);assert.equal(i.enhanceFailures,undefined);
 }
});
test('four promotions keep identity, ownership and base quality while resetting enhancement and charging once',()=>{
 for(let grade=0;grade<4;grade++){const i=item(grade);i.enhancement=g.enhancementCap(grade);i.enhanceFailures=3;const p=profile(i);p.equipment[i.slot]=i.id;p.favoriteItemIds=[i.id];p.savedBuilds=[{name:'내 장비',equipment:{weapon:i.slot==='weapon'?i.id:null,armor:null,charm:null}},null,null];
  const original=i,identity=[i.id,i.catalogId,i.artId,i.slot,i.tier],before=structuredClone(p),status=g.promotionStatus(p,1);assert.equal(status.ok,true);
  const r=promoteOwned(p,1);assert.equal(r.ok,true);assert.equal(p.inventory[0],original);assert.deepEqual([i.id,i.catalogId,i.artId,i.slot,i.tier],identity);assert.equal(i.rarity,grade+1);assert.equal(g.enhancementLevel(i),0);assert.equal(i.enhancementAffixes,undefined);assert.equal(i.enhanceFailures,undefined);assert.equal(i.promotionCount,1);
  assert.deepEqual(p.equipment,before.equipment);assert.deepEqual(p.favoriteItemIds,before.favoriteItemIds);assert.deepEqual(p.savedBuilds,before.savedBuilds);assert.equal(p.nextItemId,before.nextItemId);assert.equal(p.gold,before.gold-status.cost.gold);for(const m of g.MATERIALS)assert.equal(p.materials[m.id],before.materials[m.id]-(status.cost.materials[m.id]??0));
  assert.equal(Object.keys(i.affixes).length,[2,3,4,5][grade]);for(const [key,range]of Object.entries(g.itemRollRanges(i)))assert.ok(i.affixes[key]>=range.min&&i.affixes[key]<=range.max);
  const after=structuredClone(p);assert.equal(promoteOwned(p,1).ok,false);assert.deepEqual(p,after);assert.deepEqual(g.restoreProfile(g.encodeProfile(p,1000),1000).inventory[0],i);
 }
});
test('promotion preserves minimum and maximum roll quality, including each new option and perfect flag',()=>{
 for(let grade=0;grade<4;grade++)for(const endpoint of ['min','max']){const i=item(grade);for(const [key,r]of Object.entries(g.itemRollRanges(i)))i.affixes[key]=r[endpoint];const before=structuredClone(i),next=promotionPreview(i);assert.deepEqual(i,before);
  for(const [key,r]of Object.entries(g.itemRollRanges(next)))assert.equal(next.affixes[key],r[endpoint]);assert.equal(g.isPerfectRoll(next),endpoint==='max');assert.equal(!!next.perfect,endpoint==='max');
 }
});
test('promotion gates invalid ownership, low levels, pending results and each missing resource atomically',()=>{
 for(const patch of [{catalogId:'bad'},{artId:'bad'},{tier:99},{slot:'armor'}]){const i=item(0);i.enhancement=5;Object.assign(i,patch);const p=profile(i),before=structuredClone(p);assert.equal(promoteOwned(p,1).ok,false);assert.deepEqual(p,before);}
 for(let grade=0;grade<4;grade++){const i=item(grade);i.enhancement=g.enhancementCap(grade);const p=profile(i),status=g.promotionStatus(p,1);
  for(const mutate of [q=>q.gold=status.cost.gold-1,q=>q.inventory[0].enhancement--,q=>q.inventory[0].rerollCandidate={affixes:{...i.affixes}},q=>q.inventory=[],...Object.entries(status.cost.materials).map(([key,n])=>q=>q.materials[key]=n-1)]){const q=structuredClone(p);mutate(q);const before=structuredClone(q);assert.equal(promoteOwned(q,1).ok,false);assert.deepEqual(q,before);}
 }
 for(const grade of [4,5,6]){const i=item(grade);i.enhancement=g.enhancementCap(grade);const p=profile(i),before=structuredClone(p);assert.equal(promotionPreview(i),null);assert.equal(promoteOwned(p,1).ok,false);assert.deepEqual(p,before);}
});
test('camp promotion refreshes equipped effects and stats; paused combat never promotes or changes random streams',()=>{
 const i=item(1);i.enhancement=10;const p=profile(i);p.equipment.weapon=1;const s=g.createGame(p),streams=[s.rng,s.lootRng,s.materialRng,s.refiningRng,s.promotionRng,p.equipmentRng];
 s.phase='playing';s.paused=true;const before=structuredClone(p);assert.equal(g.promoteItem(s,1).ok,false);assert.deepEqual(p,before);s.phase='camp';assert.equal(g.promoteItem(s,1).ok,true);assert.equal(i.rarity,2);assert.deepEqual(s.loadout,g.uniqueLoadout(p));assert.equal(s.player.maxHp,g.playerStats(p).maxHp);assert.deepEqual([s.rng,s.lootRng,s.materialRng,s.refiningRng,s.promotionRng,p.equipmentRng],streams);
});
test('legacy out-of-range levels and new progression metadata restore within each grade cap',()=>{
 for(let grade=0;grade<=6;grade++){const i=item(grade);i.enhancement=999;i.enhanceFailures=999;i.promotionCount=999;const p=g.restoreProfile(profile(i),1000),clean=p.inventory[0];assert.equal(clean.enhancement,g.enhancementCap(grade));assert.equal(clean.enhanceFailures,undefined);assert.equal(clean.promotionCount,grade>0&&grade<5?Math.min(4,grade):undefined);assert.deepEqual(g.restoreProfile(g.encodeProfile(p,1000),1000),p);}
});
test('promoted +0 equipment stays protected from automatic overflow cleanup',()=>{
 const i=item(0);i.enhancement=5;const p=profile(i);promoteOwned(p,1);const L=g.INVENTORY_LIMIT;for(let id=2;id<=L;id++)p.inventory.push(item(0,id));assert.equal(storeItem(p,item(4,L+1)).kept,true);assert.ok(p.inventory.includes(i));assert.equal(p.inventory.length,L);assert.equal(g.salvageItem(g.createGame(p),1),true);
});
