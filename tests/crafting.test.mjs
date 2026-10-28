import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {MATERIAL_LIMIT,materialChance,rollMaterials} from '../dist/crafting.js';
import {rollItem,uniqueEffect,uniquePower,ITEM_CATALOG,ANCIENT_CATALOG} from '../dist/loot.js';
import {visualDesign,snapshotDesigns} from '../dist/equipment-visuals.js';import {freezeCombat} from './combat-fixture.mjs';
const prepare=()=>{const p=g.createProfile(1000);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.gold=100000;for(const m of g.MATERIALS)p.materials[m.id]=1000;return g.createGame(p);};
const advance=(s,t)=>{while(t>1e-8){const dt=Math.min(.025,t);g.advanceGame(s,dt);t-=dt;}};
function arena(s){g.launch(s);freezeCombat(s);s.run.flow='combat';s.run.waveQuota=1000;s.spawns=[];s.enemies=[];s.barrels=[];s.player.invulnerable=999;}
function enemy(s,opts={}){const e={id:s.nextId++,type:'skitter',boss:false,x:s.player.x+60,y:s.player.y,hp:1,maxHp:1000,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,lookX:0,lookY:1,...opts};s.enemies.push(e);return e;}
test('all twelve material chances have exact independent boundaries, extreme ingredients are boss-only (Alpha 0.122: 원질 핵 2%, 무명의 기원 0.3%)',()=>{
 assert.equal(g.MATERIALS.length,14);assert.equal(g.MATERIALS.at(-1).id,'sealShard');const origin=g.MATERIAL_BY_ID.origin,source=g.MATERIAL_BY_ID.source;assert.equal(origin.boss,.003);assert.equal(source.boss,.02);assert.equal(origin.normal+origin.elite+source.normal+source.elite,0);
 for(const m of g.MATERIALS)for(let tier=1;tier<=3;tier++)for(const role of ['normal','elite','boss']){const context={tier,boss:role==='boss',elite:role==='elite'},chance=materialChance(m,context);assert.ok(chance>=0&&chance<=1);if(chance){assert.ok(rollMaterials(context,()=>Math.max(0,chance-Number.EPSILON)).some(d=>d.id===m.id));assert.ok(!rollMaterials(context,()=>chance).some(d=>d.id===m.id));}else assert.ok(!rollMaterials(context,()=>0).some(d=>d.id===m.id));}
 const drops=rollMaterials({tier:1,boss:true},()=>0);assert.equal(drops.find(d=>d.id==='boneIron').amount,4);assert.ok(drops.some(d=>d.id==='root'));assert.ok(!drops.some(d=>d.id==='seal'||d.id==='tear'));
});
test('refining drops use their own RNG and do not consume legacy crafting rolls',()=>{
 for(const context of [{tier:1},{tier:2,elite:true},{tier:3,boss:true}]){
  let oldCalls=0,newCalls=0;const drops=rollMaterials(context,()=>{oldCalls++;return 0;},()=>{newCalls++;return .999999;},()=>.999999);
  assert.equal(oldCalls,g.MATERIALS.filter(m=>!m.refining&&!m.promotion&&materialChance(m,context)>0).length);assert.equal(newCalls,g.MATERIALS.filter(m=>m.refining&&materialChance(m,context)>0).length);
  assert.ok(drops.every(d=>!g.MATERIAL_BY_ID[d.id].refining||d.id==='refineStone'&&context.boss));
 }
 const old=g.createProfile(1000);delete old.materials.refineStone;delete old.materials.refineCrystal;delete old.materials.refineEssence;const clean=g.restoreProfile(old,1000);for(const m of g.MATERIALS.filter(m=>m.refining))assert.equal(clean.materials[m.id],0);
});
// Alpha 0.142 (사용자 결정): 강화 재료·승급석·검술서는 성장 던전에서만 나온다 — 사냥터 처치는 그 RNG를 아예 쓰지 않는다.
test('hunting drops no refining materials, promotion stones or skill pages even on a certain roll',()=>{
 for(const id of ['refineStone','refineCrystal','refineEssence','promotionStone','skillPage']){const row=g.MATERIAL_BY_ID[id];assert.equal(row.normal+row.elite+row.boss,0,id);assert.match(row.where,/에서만 획득/,id);}
 let old=0,refine=0,promote=0;const drops=rollMaterials({tier:1,elite:true},()=>{old++;return .999999;},()=>{refine++;return 0;},()=>{promote++;return 0;});assert.deepEqual(drops,[]);assert.equal(old,4);assert.equal(refine,0);assert.equal(promote,0);
 for(const context of [{tier:1},{tier:2,elite:true},{tier:3,boss:true}])assert.ok(rollMaterials(context,()=>.999999,()=>0,()=>0).every(d=>!['refineStone','refineCrystal','refineEssence','promotionStone','skillPage'].includes(d.id)));
 const s=prepare();arena(s);s.refiningRng=0;s.promotionRng=0;enemy(s,{elite:true});g.attack(s,{x:1,y:0});advance(s,.15);for(const key of ['refineStone','refineCrystal','refineEssence','promotionStone'])assert.equal(s.profile.pendingMaterials[key]??0,0,key);
});
test('six authored unique identities require multiple materials and never appear in any equipment drop path',()=>{
 assert.equal(g.CRAFTED_CATALOG.length,11);for(const row of g.CRAFTED_CATALOG){assert.ok(Object.keys(row.cost).length>=6);assert.equal(row.cost.origin,1);assert.ok(!ITEM_CATALOG.some(r=>r.id===row.id));assert.ok(!ANCIENT_CATALOG.some(r=>r.id===row.id));}
 for(const source of ['normal','elite','boss','stage'])for(const difficulty of [0,1,2])for(const minimum of [0,5,6,999])for(let n=0;n<200;n++){let seed=n+77;const item=rollItem({id:1,tier:n%3+1,source,difficulty,minimum},()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;});assert.ok(item.rarity<=5);assert.equal(g.craftedDefinition(item),null);}
});
test('crafting all identities commits exact costs once and duplicate attempts mutate nothing',()=>{
 // Alpha 0.136: the seal recipe stays in the catalog for owned copies but seals come only from the boss rush.
 {const s=prepare(),before=JSON.stringify(s);assert.equal(g.craftStatus(s.profile,'crafted-special').ok,false);assert.equal(g.craftItem(s,'crafted-special').ok,false);assert.equal(JSON.stringify(s),before);}
 for(const row of g.CRAFTED_CATALOG.filter(r=>r.slot!=='special')){const s=prepare(),before=structuredClone(s.profile);assert.equal(g.craftStatus(s.profile,row.id).ok,true);const result=g.craftItem(s,row.id);assert.equal(result.ok,true);assert.equal(s.profile.gold,before.gold-row.gold);for(const m of g.MATERIALS)assert.equal(s.profile.materials[m.id],before.materials[m.id]-(row.cost[m.id]??0));assert.equal(s.profile.inventory.length,1);assert.equal(g.craftedDefinition(result.item),row);assert.ok(g.EQUIPMENT_KEYS.filter(key=>g.itemSlotForPosition(key)===row.slot).every(key=>s.profile.equipment[key]===null));if(row.slot==='earring')assert.equal(g.craftItem(s,row.id).ok,true);const snapshot=JSON.stringify(s);assert.equal(g.craftItem(s,row.id).ok,false);assert.equal(JSON.stringify(s),snapshot);}
});
test('missing each ingredient, gold, unlock, full bag, invalid recipe and non-camp fail with no state change',()=>{
 const row=g.CRAFTED_CATALOG[0];for(const mutate of [s=>s.profile.gold=0,s=>s.profile.unlockedStage=1,s=>s.profile.inventory=Array.from({length:g.INVENTORY_LIMIT},(_,n)=>({id:n+1})),s=>s.phase='playing',s=>s.phase='victory',...Object.keys(row.cost).map(k=>s=>s.profile.materials[k]=row.cost[k]-1)]){const s=prepare();mutate(s);const before=JSON.stringify(s);assert.equal(g.craftItem(s,row.id).ok,false);assert.equal(JSON.stringify(s),before);}const s=prepare(),before=JSON.stringify(s);assert.equal(g.craftItem(s,'forged-recipe').ok,false);assert.equal(JSON.stringify(s),before);
});
test('new identity allocation skips both worn/inventory and reserved loot IDs',()=>{
 const s=prepare();s.profile.inventory=[{id:1}];s.profile.pendingLoot=[{id:2}];s.profile.nextItemId=1;const result=g.craftItem(s,g.CRAFTED_CATALOG[1].id);assert.equal(result.item.id,3);assert.equal(s.profile.nextItemId,4);
});
test('version7 saves round-trip fixed crafted stats material balances identity and equipped ownership',()=>{
 const s=prepare();for(const row of g.CRAFTED_CATALOG.filter(r=>r.slot!=='special')){const result=g.craftItem(s,row.id);g.equipItem(s,result.item.id);}const p=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.equal(p.version,16);assert.deepEqual(p.materials,s.profile.materials);assert.deepEqual(p.equipment,s.profile.equipment);assert.deepEqual(p.inventory,s.profile.inventory);assert.deepEqual(g.restoreProfile(g.encodeProfile(p,1000),1000),p);assert.equal(p.discoveredAncients.length,0);
});
test('older saves do not mint materials and legacy extreme grade keeps its ancient migration',()=>{
 for(let version=1;version<=6;version++){const p=prepare().profile;p.version=version;const restored=g.restoreProfile(p,1000);assert.equal(restored.version,16);assert.ok(Object.values(restored.materials).every(n=>n===0));assert.equal(restored.gold,p.gold);}
 const row=ITEM_CATALOG[0],p=prepare().profile;p.version=4;p.inventory=[{id:1,catalogId:row.id,slot:row.slot,tier:row.tier,artId:row.artId,rarity:6,affixes:{damage:17}}];p.equipment.weapon=1;const restored=g.restoreProfile(p,1000);assert.equal(restored.inventory[0].rarity,5);assert.ok(g.ancientDefinition(restored.inventory[0]));assert.equal(restored.equipment.weapon,1);
});
test('untrusted counts are bounded and crafted rarity cannot borrow a legacy identity or slot',()=>{
 const p=prepare().profile;p.materials={origin:Infinity,source:-2,root:2.9,seal:1e10,unknown:55};const restored=g.restoreProfile(p,1000);assert.equal(restored.materials.origin,0);assert.equal(restored.materials.source,0);assert.equal(restored.materials.root,2);assert.equal(restored.materials.seal,MATERIAL_LIMIT);assert.equal(restored.materials.unknown,undefined);
 const s=prepare(),item=g.craftItem(s,g.CRAFTED_CATALOG[0].id).item;assert.equal(uniquePower(6),1.5);assert.equal(uniqueEffect({...item,catalogId:'bad'}),null);assert.equal(uniqueEffect({...item,slot:'armor'}),null);assert.equal(uniqueEffect({...item,catalogId:ITEM_CATALOG[0].id}),null);item.affixes.damage=999;assert.deepEqual(g.restoreProfile(s.profile,1000).inventory[0].affixes,{...g.CRAFTED_CATALOG[0].base,damage:g.itemRollRanges(item).damage.max});
 for(const patch of [{rarity:7},{rarity:6.5},{tier:3.1}]){const raw=structuredClone(s.profile);Object.assign(raw.inventory[0],patch);assert.ok(g.restoreProfile(raw,1000).inventory[0].rarity<6);}
});
test('crafted equipment retains grade6 in appearance and committed attack snapshot with no new atlas dependency',()=>{
 const s=prepare(),row=g.CRAFTED_CATALOG[1],item=g.craftItem(s,row.id).item;g.equipItem(s,item.id);const design=visualDesign(item);assert.equal(design.rarity,6);assert.equal(design.craftId,row.id);assert.ok(Number.isFinite(design.rune));const snapshot=g.equipmentSnapshot(s.profile);assert.equal(snapshot.weapon.rarity,6);assert.equal(snapshotDesigns(snapshot).weapon.craftId,row.id);assert.equal(g.uniqueLoadout(s.profile).weapon.crafted,row);
});
test('death reserves materials until collection, while reload recovers the reservation exactly once',()=>{
 const s=prepare();arena(s);const before=structuredClone(s.profile.materials);s.materialRng=2000;enemy(s);g.attack(s,{x:1,y:0});advance(s,.15);assert.equal(s.run.materials,0);assert.deepEqual(s.profile.materials,before);assert.ok(s.profile.pendingMaterials.boneIron>0);
 const expected=Object.fromEntries(g.MATERIALS.map(m=>[m.id,before[m.id]+s.profile.pendingMaterials[m.id]])),restored=g.restoreProfile(g.encodeProfile(s.profile));assert.deepEqual(restored.materials,expected);assert.ok(Object.values(restored.pendingMaterials).every(n=>n===0));assert.deepEqual(g.restoreProfile(g.encodeProfile(restored)).materials,expected);
 const pickups=s.pickups.filter(q=>q.kind==='material');assert.ok(pickups.length);for(const q of pickups){q.x=s.player.x;q.y=s.player.y;}advance(s,.5);assert.deepEqual(s.profile.materials,expected);assert.ok(Object.values(s.profile.pendingMaterials).every(n=>n===0));assert.equal(s.run.kills,1);
});
test('material stream cannot change combat or gear RNG; saturated bank does not overflow',()=>{
 const s=prepare();arena(s);s.profile.lootPity=0;s.materialRng=2000;for(const m of g.MATERIALS)s.profile.materials[m.id]=MATERIAL_LIMIT;const beforeRng=s.rng;enemy(s);g.attack(s,{x:1,y:0});advance(s,.15);assert.equal(s.run.materials,0);assert.ok(Object.values(s.profile.materials).every(n=>n===MATERIAL_LIMIT));assert.notEqual(s.rng,beforeRng);assert.notEqual(s.materialRng,2000);
});
test('crafted signatures use existing bounded proc path and cannot recursively apply a direct synergy',()=>{
 const s=prepare();for(const n of [1,3,5]){const result=g.craftItem(s,g.CRAFTED_CATALOG[n].id);g.equipItem(s,result.item.id);}arena(s);const e=enemy(s,{hp:1000});g.attack(s,{x:1,y:0});advance(s,.15);assert.ok(s.run.craftedProcs>0);assert.ok(e.bleedTicks>0);assert.equal(s.run.synergyProcs.execute,0);assert.equal(s.run.ancientProcs,0);g.dash(s,{x:1,y:0});assert.ok(s.uniqueState.ancientZones.length<=6);assert.ok(s.projectiles.length<=64);
});
