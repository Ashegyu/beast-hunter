import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {rollItem,rollAncient,itemRollRanges,isPerfectRoll,rollItemAffixes,storeItem,gearDropPresentation} from '../dist/loot.js';
import {enhanceOwned,rerollOwned,resolveOwnedReroll} from '../dist/equipment-progression.js';
import {createBackup,readBackup} from '../dist/profile-backup.js';
function ordinary(rank=4,id=1){const choices=g.ITEM_CATALOG.filter(r=>r.tier===1);let n=0;return rollItem({id,tier:1,minimum:rank},()=>++n===1?.5/choices.length:n===2?0:.1);}
function profile(item=ordinary()){const p=g.createProfile(1000);p.inventory=[item];p.nextItemId=2;p.gold=1e8;p.cores=10000;for(const m of g.MATERIALS)p.materials[m.id]=100000;return p;}
function candidateMax(item){return Object.fromEntries(Object.entries(itemRollRanges(item)).map(([k,r])=>[k,r.max]));}
test('reroll changes only base stats; stored enhancement survives and future upgrades add from the new base',()=>{
 // 30 lies inside the Alpha 0.120 range of this family (restore lifts values below the minimum).
 const item=ordinary();item.affixes.damage=30;item.enhancement=10;let p=g.restoreProfile(profile(item),1000);p.equipment.weapon=1;
 const owned=p.inventory[0];assert.equal(owned.enhancementAffixes.damage,9);assert.equal(g.effectiveAffix(owned,'damage'),39);const bonuses=structuredClone(owned.enhancementAffixes);
 // Alpha 0.120: the maximum comes only from the 극옵 draw (first number below 1%), so roll with 0.
 const top=itemRollRanges(owned).damage.max;
 rerollOwned(p,1,()=>0);assert.equal(owned.affixes.damage,30);assert.deepEqual(owned.enhancementAffixes,bonuses);
 resolveOwnedReroll(p,1,true);assert.equal(owned.affixes.damage,top);assert.deepEqual(owned.enhancementAffixes,bonuses);assert.equal(g.effectiveAffix(owned,'damage'),top+9);assert.equal(g.equipmentBonuses(p).damage,top+9);
 assert.equal(enhanceOwned(p,1,()=>0).success,true);assert.equal(owned.affixes.damage,top);const added=Math.round((9+top*.03)*100)/100;assert.equal(owned.enhancementAffixes.damage,added);assert.equal(g.effectiveAffix(owned,'damage'),Math.round((top+added)*100)/100);
 const expected=structuredClone(p);for(let n=0;n<10;n++)p=readBackup(createBackup(p,1000),1000).profile;assert.deepEqual(p,expected);
});
test('stored enhancement sanitizes independently of base stats and cannot grow during restore or rejected rolls',()=>{
 const item=ordinary();item.enhancement=10;item.enhancementAffixes={damage:1e99,hp:NaN,speed:-4,crit:1.234,reduction:'5',unknown:999};const p=g.restoreProfile(profile(item),1000),clean=p.inventory[0];
 assert.equal(clean.enhancementAffixes.damage,45);// damage cap 150 × 10 levels × 3% (Alpha 0.120)assert.equal(clean.enhancementAffixes.hp,0);assert.equal(clean.enhancementAffixes.speed,0);assert.equal(clean.enhancementAffixes.crit,1.23);assert.equal(clean.enhancementAffixes.reduction,0);assert.equal(clean.enhancementAffixes.unknown,undefined);
 const before=structuredClone(clean);rerollOwned(p,1,()=>0);resolveOwnedReroll(p,1,false);assert.deepEqual(clean,before);
 const raw=structuredClone(p);raw.inventory[0].enhancement=0;assert.equal(g.restoreProfile(raw,1000).inventory[0].enhancementAffixes,undefined);
});
test('enhancement costs add refining ingredients at +11/+21 and gold rises at every level and decade',()=>{
 const expected=[[1,120,{refineStone:1}],[10,2100,{refineStone:2}],[11,5040,{refineStone:3,refineCrystal:1}],[20,16200,{refineStone:4,refineCrystal:2}],[21,35680,{refineStone:5,refineCrystal:3,refineEssence:1}],[30,72400,{refineStone:6,refineCrystal:4,refineEssence:2}]];
 for(const [target,gold,materials]of expected){const item=ordinary(4);item.enhancement=target-1;const cost=g.enhancementStatus(profile(item),1).cost;assert.equal(cost.gold,Math.round(gold*2.4));assert.deepEqual(cost.materials,materials);}
 for(let rarity=0;rarity<=6;rarity++)for(let tier=1;tier<=3;tier++){const item=ordinary();item.rarity=rarity;item.tier=tier;const p=profile(item);let previous=0;for(let target=1;target<=g.enhancementCap(rarity);target++){item.enhancement=target-1;const cost=g.enhancementStatus(p,1).cost;assert.ok(Number.isInteger(cost.gold)&&cost.gold>previous);previous=cost.gold;assert.equal(Object.keys(cost.materials).length,Math.ceil(target/10));}}
 const mythic=ordinary();mythic.enhancement=29;assert.equal(g.enhancementStatus(profile(mythic),1).cost.gold,173760);
});
test('missing any refining ingredient or gold blocks even guaranteed attempts without payment, pity or RNG changes',()=>{
 for(const target of [1,10,11,20,21,30]){
  const item=ordinary();item.enhancement=target-1;item.enhanceFailures=g.enhancementRule(target,4).attempts-1;const initial=profile(item),cost=g.enhancementStatus(initial,1).cost;
  for(const key of ['gold',...Object.keys(cost.materials)]){
   const p=structuredClone(initial);if(key==='gold')p.gold=cost.gold-1;else p.materials[key]=cost.materials[key]-1;const before=structuredClone(p);
   assert.equal(enhanceOwned(p,1,()=>{throw Error('unpayable attempt drew RNG');}).ok,false);assert.deepEqual(p,before);
  }
 }
});
test('one ordinary family spans normal to mythic; ancient has its own catalog and random ranges',()=>{
 const items=[0,1,2,3,4].map(rank=>ordinary(rank));assert.equal(new Set(items.map(i=>i.catalogId)).size,1);assert.equal(new Set(items.map(i=>i.artId)).size,1);
 for(let rank=0;rank<5;rank++){const i=items[rank];assert.equal(i.rarity,rank);assert.equal(g.ancientDefinition(i),null);for(const [k,r]of Object.entries(itemRollRanges(i))){assert.ok(i.affixes[k]>=r.min&&i.affixes[k]<=r.max);}}
 assert.ok(itemRollRanges(items[4]).damage.max>itemRollRanges(items[0]).damage.max);
 const ancient=rollAncient({id:9,tier:1},.525,()=>0);assert.ok(g.ancientDefinition(ancient));assert.ok(!g.ITEM_CATALOG.some(r=>r.id===ancient.catalogId));assert.equal(ancient.rarity,5);
 for(const [k,r]of Object.entries(itemRollRanges(ancient)))assert.equal(ancient.affixes[k],r.min);
});
test('range endpoints are reachable, numeric max defines perfect quality, and reroll never changes option kinds',()=>{
 for(let rank=0;rank<=5;rank++){
  const item=rank===5?rollAncient({id:1,tier:1},.5):ordinary(rank);
  // Alpha 0.120: an ordinary roll tops out one below each maximum; only the 1% 극옵 draw reaches it.
  const min=rollItemAffixes(item,()=>.5),high=rollItemAffixes(item,()=>.99999999),max=rollItemAffixes(item,()=>0);
  assert.deepEqual(Object.keys(min),Object.keys(item.affixes));assert.deepEqual(max,candidateMax(item));assert.deepEqual(high,Object.fromEntries(Object.entries(itemRollRanges(item)).map(([k,r])=>[k,r.max-1])));assert.equal(isPerfectRoll(item,max),true);assert.equal(isPerfectRoll(item,high),false);
  const changed={...max},key=Object.keys(changed).find(k=>itemRollRanges(item)[k].min<changed[k]);if(key){changed[key]--;assert.equal(isPerfectRoll(item,changed),false);}
 }
});
test('seven grade-specific caps and chance bands decline with decade drops and grade-specific failure policies',()=>{
 assert.deepEqual(g.ENHANCEMENT_CAPS,[5,10,15,20,30,40,50]);
 for(let grade=0;grade<=6;grade++){
  const cap=g.enhancementCap(grade);let previous=2;
  for(let target=1;target<=cap;target++){const r=g.enhancementRule(target,grade);assert.ok(r.chance<previous&&r.chance>0);assert.equal(r.attempts,grade===5&&target>=30||grade===6&&target>=40?null:Math.ceil(target/10)*10);previous=r.chance;}
  for(let boundary=11;boundary<cap;boundary+=10){const rate=t=>g.enhancementRule(t,grade).chance;assert.ok(rate(boundary-1)-rate(boundary)>rate(boundary-2)-rate(boundary-1));}
  assert.equal(g.enhancementRule(cap+1,grade),null);
 }
 assert.equal(g.enhancementRule(5,0).chance,.92);assert.equal(g.enhancementRule(10,1).chance,.779);assert.equal(g.enhancementRule(15,2).chance,.468);assert.equal(g.enhancementRule(20,3).chance,.336);assert.equal(g.enhancementRule(30,4).chance,.01);assert.equal(g.enhancementRule(40,5).chance,.005);assert.equal(g.enhancementRule(50,6).chance,.003);assert.equal(g.enhancementRule(22,4).chance,.1167);
 for(const value of [0,51,NaN,1.5])assert.equal(g.enhancementRule(value),null);for(const value of [-1,7,NaN,1.5])assert.equal(g.enhancementRule(1,value),null);
});
test('actual enhancement rolls respect the grade threshold at every decade boundary',()=>{
 for(let grade=0;grade<=6;grade++)for(const target of [1,10,11,20,21,30]){
  if(target>g.enhancementCap(grade))continue;const chance=g.enhancementRule(target,grade).chance;
  for(const [draw,success]of [[chance-1e-9,true],[chance,false]]){
   if(chance===1&&!success)continue;
   const item=grade===5?rollAncient({id:1,tier:1},.5):ordinary(Math.min(grade,4));item.rarity=grade;item.enhancement=target-1;const p=profile(item);
   const r=enhanceOwned(p,1,()=>draw);assert.equal(r.success,success);assert.equal(item.enhancement,success?target:target-1);
  }
 }
});
test('saved failures retain credit under longer guarantees and only the new final attempt is certain',()=>{
 for(const [level,oldFailures,limit]of [[9,4,10],[10,7,20],[20,9,30]]){
  const item=ordinary();item.enhancement=level;item.enhanceFailures=oldFailures;let p=g.restoreProfile(g.encodeProfile(profile(item),1000),1000);
  assert.equal(p.inventory[0].enhanceFailures,oldFailures);assert.equal(g.enhancementStatus(p,1).remaining,limit-oldFailures);assert.equal(g.enhancementStatus(p,1).guaranteed,false);
  p.inventory[0].enhanceFailures=limit-2;p=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(enhanceOwned(p,1,()=>.999999).success,false);
  p=g.restoreProfile(g.encodeProfile(p,1000),1000);const status=g.enhancementStatus(p,1);assert.equal(status.remaining,1);assert.equal(status.chance,1);
  assert.equal(enhanceOwned(p,1,()=>{throw Error('pity must not draw RNG');}).success,true);assert.equal(p.inventory[0].enhanceFailures,undefined);
 }
});
test('each item owns its fail count; thirtieth high-level attempt succeeds without RNG, charges once, resets and never loses a level',()=>{
 const a=ordinary(4),b=ordinary(3,2);a.enhancement=24;const p=profile(a);p.inventory.push(b);const base=structuredClone(a.affixes),initial=g.enhancementStatus(p,1),gold=p.gold,bank=structuredClone(p.materials);
 for(let i=0;i<29;i++){const r=enhanceOwned(p,1,()=>.999);assert.equal(r.success,false);assert.equal(a.enhancement,24);assert.equal(a.enhanceFailures,i+1);assert.equal(b.enhancement,undefined);assert.equal(b.enhanceFailures,undefined);}
 assert.equal(g.enhancementStatus(p,1).guaranteed,true);const r=enhanceOwned(p,1,()=>{throw Error('guaranteed attempt used RNG');});assert.equal(r.success,true);assert.equal(a.enhancement,25);assert.equal(a.enhanceFailures,undefined);assert.deepEqual(a.affixes,base);assert.equal(p.gold,gold-initial.cost.gold*30);for(const m of g.MATERIALS)assert.equal(p.materials[m.id],bank[m.id]-(initial.cost.materials[m.id]??0)*30);
});
test('max +30 is absorbing and effective stats are derived without inflating base rolls on reload',()=>{
 const i=ordinary();i.enhancement=29;i.enhanceFailures=29;const p=profile(i);assert.equal(enhanceOwned(p,1,()=>1).success,true);assert.equal(i.enhancement,30);
 const before=structuredClone(p);assert.equal(enhanceOwned(p,1,()=>{throw Error('cap RNG');}).ok,false);assert.deepEqual(p,before);
 p.equipment.weapon=1;for(const [k,v]of Object.entries(i.affixes))assert.equal(g.effectiveAffix(i,k),Math.round(v*190)/100);
 const loaded=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.deepEqual(loaded.inventory[0],i);assert.deepEqual(g.equipmentBonuses(loaded),g.equipmentBonuses(p));
});
test('invalid identity, insufficient resources, pending reroll and non-camp actions are atomic and consume no RNG',()=>{
 for(const mutate of [p=>p.gold=0,p=>p.materials.refineStone=0,p=>p.inventory=[]]){const p=profile();mutate(p);const before=structuredClone(p);assert.equal(enhanceOwned(p,1,()=>{throw Error('invalid RNG');}).ok,false);assert.deepEqual(p,before);}
 const p=profile(),s=g.createGame(p);s.phase='playing';s.paused=true;const before=structuredClone(p);assert.equal(g.enhanceItem(s,1).ok,false);assert.equal(g.rerollItem(s,1).ok,false);assert.equal(g.resolveItemReroll(s,1,true).ok,false);assert.deepEqual(p,before);
 const valid=profile();valid.inventory[0].enhancement=5;const snapshot=structuredClone(valid);assert.throws(()=>enhanceOwned(valid,1,()=>NaN),RangeError);assert.deepEqual(valid,snapshot);
});
test('mythic and ancient rerolls reserve a persisted candidate, preserve upgrade/pity, and charge once before an explicit choice',()=>{
 for(const item of [ordinary(4),rollAncient({id:1,tier:1},.5)]){
  item.enhancement=12;item.enhanceFailures=3;const p=profile(item),base=structuredClone(item.affixes),gold=p.gold,cost=g.rerollStatus(p,1).cost;
  const r=rerollOwned(p,1,()=>0);assert.equal(r.ok,true);assert.deepEqual(item.affixes,base);assert.equal(item.enhancement,12);assert.equal(item.enhanceFailures,3);assert.equal(p.gold,gold-cost.gold);
  const waiting=structuredClone(p);assert.equal(rerollOwned(p,1,()=>{throw Error('duplicate roll');}).ok,false);assert.equal(enhanceOwned(p,1,()=>{throw Error('pending enhancement');}).ok,false);assert.deepEqual(p,waiting);
  const restored=readBackup(createBackup(p,1000),1000).profile;assert.deepEqual(restored.inventory[0].rerollCandidate,item.rerollCandidate);assert.equal(g.itemProtection(restored,restored.inventory[0]),'수치작 결과 대기');
  assert.equal(resolveOwnedReroll(restored,1,true).ok,true);const final=restored.inventory[0];assert.deepEqual(final.affixes,candidateMax(item));assert.equal(final.perfect,true);assert.equal(final.enhancement,12);assert.equal(final.enhanceFailures,3);assert.equal(final.catalogId,item.catalogId);assert.equal(final.id,item.id);
  const applied=structuredClone(restored);assert.equal(resolveOwnedReroll(restored,1,true).ok,false);assert.deepEqual(restored,applied);
 }
});
test('keeping a roll retains old stats and spends no second fee; legendary reroll is rejected',()=>{
 const p=profile(),base=structuredClone(p.inventory[0].affixes);rerollOwned(p,1,()=>0);const gold=p.gold;assert.equal(resolveOwnedReroll(p,1,false).ok,true);assert.equal(p.gold,gold);assert.deepEqual(p.inventory[0].affixes,base);assert.equal(p.inventory[0].rerollCandidate,undefined);
 const low=profile(ordinary(3)),before=structuredClone(low);assert.equal(rerollOwned(low,1,()=>{throw Error('ineligible');}).ok,false);assert.deepEqual(low,before);
});
test('legacy stats survive migration and forged progression or candidates cannot exceed limits',()=>{
 const item=ordinary();delete item.rollVersion;item.affixes={damage:61,crit:24,hp:201};const old=profile(item);old.version=9;const migrated=g.restoreProfile(old,1000);assert.deepEqual(migrated.inventory[0].affixes,item.affixes);assert.equal(migrated.version,16);assert.equal(migrated.inventory[0].enhancement,undefined);
 const p=profile();p.inventory[0].enhancement=900;p.inventory[0].enhanceFailures=999;p.inventory[0].rerollCandidate={affixes:{damage:1e9}};const r=g.restoreProfile(p,1000).inventory[0];assert.equal(r.enhancement,30);assert.equal(r.enhanceFailures,undefined);assert.equal(r.rerollCandidate,undefined);
});
test('upgraded and pending gear survive automatic full-bag cleanup while manual ownership rules stay explicit',()=>{
 const p=profile(ordinary(0));p.inventory[0].enhancement=1;for(let id=2;id<=200;id++)p.inventory.push(ordinary(0,id));const upgraded=p.inventory[0];const drop=ordinary(4,201),result=storeItem(p,drop);assert.equal(result.kept,true);assert.ok(p.inventory.includes(upgraded));assert.equal(p.inventory.length,200);
 const s=g.createGame(p);assert.equal(g.salvageItem(s,1),true);assert.ok(!p.inventory.some(i=>i.id===1));
 const q=profile();rerollOwned(q,1,()=>.2);assert.equal(g.salvageItem(g.createGame(q),1),false);
});
test('workshop RNG is separate from combat/loot and persists through a 200-item pending-result backup',()=>{
 const p=profile();p.inventory=Array.from({length:200},(_,n)=>({...ordinary(4,n+1),enhancement:12,enhanceFailures:3}));p.nextItemId=201;const s=g.createGame(p),streams=[s.rng,s.lootRng,s.materialRng];
 for(const i of p.inventory)assert.equal(g.rerollItem(s,i.id).ok,true);assert.deepEqual([s.rng,s.lootRng,s.materialRng],streams);const r=readBackup(createBackup(p,1000),1000).profile;assert.equal(r.inventory.length,200);assert.equal(r.equipmentRng,p.equipmentRng);assert.deepEqual(r.inventory,p.inventory);
});
test('grade and perfect-drop size, duration, distinct patterns and colour increase independently of game RNG',()=>{
 let normal=0,perfect=0;for(let rank=0;rank<=6;rank++){const a=gearDropPresentation({rarity:rank}),b=gearDropPresentation({rarity:rank,perfect:true});assert.ok(a.size>normal&&b.size>perfect&&b.size>a.size);assert.ok(b.duration>a.duration);assert.ok(b.rays>a.rays);normal=a.size;perfect=b.size;}
 assert.equal(gearDropPresentation({rarity:3}).color,'#ffd94d');assert.equal(gearDropPresentation({rarity:5}).color,'#ff8b35');
});
test('the worst possible valid RNG reaches +30 within the published total attempt bound',()=>{
 const p=profile(),item=p.inventory[0];let attempts=0;
 while(g.enhancementLevel(item)<30){const before=g.enhancementLevel(item),r=enhanceOwned(p,1,()=>.999999);assert.equal(r.ok,true);assert.ok(g.enhancementLevel(item)>=before);attempts++;assert.ok(attempts<=600);}
 assert.equal(attempts,600);assert.equal(item.enhancement,30);assert.equal(item.enhanceFailures,undefined);
 for(const [key,value]of Object.entries(item.affixes))assert.ok(g.effectiveAffix({...item,enhancement:1},key)>value,'each first upgrade improves even a low base stat');
});
