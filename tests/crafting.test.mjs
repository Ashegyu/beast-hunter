import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {MATERIAL_LIMIT,materialChance,rollMaterials} from '../dist/crafting.js';
import {rollItem,uniqueEffect,uniquePower,ITEM_CATALOG,ANCIENT_CATALOG} from '../dist/loot.js';
import {visualDesign,snapshotDesigns} from '../dist/equipment-visuals.js';import {freezeCombat} from './combat-fixture.mjs';
import {rollAncient,ancientSignatures} from '../dist/loot.js?v=0.142.1';import {openMode} from './mode-fixture.mjs';
// Alpha 0.142: the old recipes can no longer be crafted (승화 제작 replaced them); saves still hold such items, so fixtures build them directly.
const legacyItem=(row,id)=>({id,slot:row.slot,tier:row.tier,rarity:6,name:row.name,catalogId:row.id,artId:row.artId,affixes:{...row.base},rollVersion:1});
function addLegacy(s,row){const id=Math.max(s.profile.nextItemId??1,...s.profile.inventory.map(i=>i.id+1),...(s.profile.pendingLoot??[]).map(i=>i.id+1));s.profile.nextItemId=id+1;const item=legacyItem(row,id);s.profile.inventory.push(item);return item;}
const LEGACY=g.CRAFTED_CATALOG.filter(r=>r.legacy);
// 승화 fixture: every chapter cleared on 일반 and the first `elite` chapters beaten on 정예.
function forgeGame(elite=60){const p=g.createProfile(1000);p.level=150;openMode(g,p,1,elite+1);p.gold=1e7;for(const m of g.MATERIALS)p.materials[m.id]=1000;const s=g.createGame(p);s.phase='camp';return s;}
function addAncient(s,opts,pick=.3){const id=Math.max(1,...s.profile.inventory.map(i=>i.id+1));const it=rollAncient({id,...opts},pick,()=>.5);s.profile.inventory.push(it);s.profile.nextItemId=id+1;return it;}
const prepare=()=>{const p=g.createProfile(1000);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.gold=100000;for(const m of g.MATERIALS)p.materials[m.id]=1000;return g.createGame(p);};
const advance=(s,t)=>{while(t>1e-8){const dt=Math.min(.025,t);g.advanceGame(s,dt);t-=dt;}};
function arena(s){g.launch(s);freezeCombat(s);s.run.flow='combat';s.run.waveQuota=1000;s.spawns=[];s.enemies=[];s.barrels=[];s.player.invulnerable=999;}
function enemy(s,opts={}){const e={id:s.nextId++,type:'skitter',boss:false,x:s.player.x+60,y:s.player.y,hp:1,maxHp:1000,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,lookX:0,lookY:1,...opts};s.enemies.push(e);return e;}
test('all twelve material chances have exact independent boundaries, extreme ingredients are boss-only (Alpha 0.122: 원질 핵 2%, 무명의 기원 0.3%)',()=>{
 assert.equal(g.MATERIALS.length,18);assert.equal(g.MATERIALS.at(-1).id,'nightmareShard');assert.deepEqual(g.MATERIALS.slice(-4,-1).map(m=>[m.id,m.tier]),[['pearl',4],['plume',5],['halo',6]]);const origin=g.MATERIAL_BY_ID.origin,source=g.MATERIAL_BY_ID.source;assert.equal(origin.boss,.003);assert.equal(source.boss,.02);assert.equal(origin.normal+origin.elite+source.normal+source.elite,0);
 for(const m of g.MATERIALS)for(let tier=1;tier<=6;tier++)for(const role of ['normal','elite','boss']){const context={tier,boss:role==='boss',elite:role==='elite'},chance=materialChance(m,context);assert.ok(chance>=0&&chance<=1);if(chance){assert.ok(rollMaterials(context,()=>Math.max(0,chance-Number.EPSILON)).some(d=>d.id===m.id));assert.ok(!rollMaterials(context,()=>chance).some(d=>d.id===m.id));}else assert.ok(!rollMaterials(context,()=>0).some(d=>d.id===m.id));}
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
 assert.equal(LEGACY.length,11);assert.equal(g.FORGE_CATALOG.length,7*7);assert.equal(g.CRAFTED_CATALOG.length,60);for(const row of LEGACY){assert.ok(Object.keys(row.cost).length>=6);assert.equal(row.cost.origin,1);}for(const row of g.CRAFTED_CATALOG){assert.ok(!ITEM_CATALOG.some(r=>r.id===row.id));assert.ok(!ANCIENT_CATALOG.some(r=>r.id===row.id));}
 for(const source of ['normal','elite','boss','stage'])for(const difficulty of [0,1,2])for(const minimum of [0,5,6,999])for(let n=0;n<200;n++){let seed=n+77;const item=rollItem({id:1,tier:n%3+1,source,difficulty,minimum},()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;});assert.ok(item.rarity<=5);assert.equal(g.craftedDefinition(item),null);}
});
test('old recipes no longer craft; 승화 commits the exact cost once and turns the ancient into a forged item in place',()=>{
 for(const row of g.CRAFTED_CATALOG){const s=prepare(),before=JSON.stringify(s);assert.equal(g.craftStatus(s.profile,row.id).ok,false);assert.equal(g.craftItem(s,row.id).ok,false);assert.equal(JSON.stringify(s),before);}
 for(const slot of g.FORGE_SLOTS){const s=forgeGame(),a=addAncient(s,{tier:2,slot}),row=g.forgeTarget(a),effect=g.FORGE_EFFECTS[slot][1].id,before=structuredClone(s.profile);
  assert.equal(row.id,'forge-'+slot+'-2');assert.equal(g.forgeStatus(s.profile,a.id,effect).ok,true);const r=g.forgeAncient(s,a.id,effect);assert.equal(r.ok,true);
  assert.equal(s.profile.gold,before.gold-row.gold);for(const m of g.MATERIALS)assert.equal(s.profile.materials[m.id],before.materials[m.id]-(row.cost[m.id]??0));
  const made=s.profile.inventory.find(i=>i.id===a.id);assert.equal(s.profile.inventory.length,1);assert.equal(made.rarity,6);assert.equal(g.craftedDefinition(made),row);assert.deepEqual(made.forge,{ancient:a.catalogId,effect});
  const snapshot=JSON.stringify(s);assert.equal(g.forgeAncient(s,a.id,effect).ok,false,'a forged item is no ancient');assert.equal(JSON.stringify(s),snapshot);}
});
test('승화 refuses before 일반 60장, without the region\'s 정예 boss, without gold or a material, outside camp, for a wrong effect or a non-ancient',()=>{
 const make=()=>{const s=forgeGame(30),a=addAncient(s,{tier:3,slot:'armor'});return {s,a,effect:g.FORGE_EFFECTS.armor[0].id};};
 {const {s,a,effect}=make();assert.equal(g.forgeStatus(s.profile,a.id,effect).ok,true);}
 for(const mutate of [({s})=>s.profile.bossMastery[59]=-1,({s})=>s.profile.bossMastery[29]=0,({s})=>s.profile.gold=0,({s})=>s.phase='playing',({s,a})=>a.rerollCandidate={affixes:{...a.affixes}},...Object.keys(g.forgeCost(3).materials).map(k=>({s})=>s.profile.materials[k]=g.forgeCost(3).materials[k]-1)]){
  const f=make();mutate(f);const before=JSON.stringify(f.s);assert.equal(g.forgeAncient(f.s,f.a.id,f.effect).ok,false);assert.equal(JSON.stringify(f.s),before);}
 const {s,a}=make(),before=JSON.stringify(s);for(const [id,effect]of [[a.id,'forge-weapon-rend'],[a.id,'nope'],[999,g.FORGE_EFFECTS.armor[0].id]])assert.equal(g.forgeAncient(s,id,effect).ok,false);assert.equal(JSON.stringify(s),before);
 const legacy=addLegacy(s,LEGACY[0]);assert.equal(g.forgeStatus(s.profile,legacy.id,g.FORGE_EFFECTS.weapon[0].id).ok,false);
 assert.match(g.forgeStatus(forgeGame(20).profile,addAncient(forgeGame(20),{tier:3,slot:'armor'}).id,'x').reason,/고대|효과/);
 const gate=forgeGame(20),high=addAncient(gate,{tier:3,slot:'armor'});assert.match(g.forgeStatus(gate.profile,high.id,g.FORGE_EFFECTS.armor[0].id).reason,/정예 30장/);
});
test('승화 keeps the id, slot, enhancement, inscription and hunt grade, multiplies stats by 1.2 and adds one 승화 effect to the inherited ones',()=>{
 const s=forgeGame(),a=addAncient(s,{tier:6,slot:'weapon',hunt:2});a.enhancement=20;a.inscription='bleed';s.profile.equipment.weapon=a.id;s.profile.favoriteItemIds=[a.id];
 const inherited=ancientSignatures(a).map(r=>r.name),effect=g.FORGE_EFFECTS.weapon[2].id;assert.equal(inherited.length,2,'악몽 ancients carry a second power');
 assert.equal(g.forgeAncient(s,a.id,effect).ok,true);const made=s.profile.inventory[0];
 assert.equal(made.id,a.id);assert.equal(s.profile.equipment.weapon,a.id);assert.equal(made.enhancement,20);assert.equal(made.inscription,'bleed');assert.equal(made.hunt,2);assert.equal(made.tier,6);
 const ranges=g.itemRollRanges(made);for(const [k,v]of Object.entries(a.affixes))assert.equal(made.affixes[k],Math.max(ranges[k].min,Math.min(ranges[k].max,Math.round(v*1.2))));
 const list=ancientSignatures(made);assert.deepEqual(list.slice(0,2).map(r=>r.name),inherited);assert.equal(list.length,3);assert.equal(list[2].id,effect);assert.ok(list[2].fury>g.FORGE_EFFECT_BY_ID[effect].fury,'승화 효과 grows with region and hunt grade');
 assert.equal(g.uniqueLoadout(s.profile).weapon.signatures.length,3);assert.ok(g.playerStats(s.profile).damage>0);
 const back=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.deepEqual(back.inventory[0],made);assert.equal(back.equipment.weapon,a.id);
 const raid=g.ANCIENT_CATALOG.find(r=>r.raid&&r.slot==='armor'),ra=addAncient(s,{tier:raid.tier,slot:'armor',raid:raid.raid,hunt:1});ra.powerRoll=111;assert.equal(g.forgeTarget(ra).id,'forge-armor-raid');assert.ok(g.forgeAncient(s,ra.id,g.FORGE_EFFECTS.armor[1].id).ok);
 const forgedRaid=s.profile.inventory.find(i=>i.id===ra.id);assert.equal(forgedRaid.powerRoll,111);assert.equal(ancientSignatures(forgedRaid).length,3,'raid power + 각성 + 승화');
 for(const bad of [{forge:{ancient:'nope',effect}},{forge:{ancient:a.catalogId,effect:'forge-armor-ward'}},{forge:null}]){const raw=structuredClone(s.profile);Object.assign(raw.inventory[0],bad);assert.equal(g.restoreProfile(raw,1000).inventory.some(i=>i.id===a.id),false,JSON.stringify(bad));}
});
test('version7 saves round-trip fixed crafted stats material balances identity and equipped ownership',()=>{
 const s=prepare();for(const row of LEGACY.filter(r=>r.slot!=='special')){const item=addLegacy(s,row);g.equipItem(s,item.id);}const p=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.equal(p.version,16);assert.deepEqual(p.materials,s.profile.materials);assert.deepEqual(p.equipment,s.profile.equipment);assert.deepEqual(p.inventory,s.profile.inventory);assert.deepEqual(g.restoreProfile(g.encodeProfile(p,1000),1000),p);assert.equal(p.discoveredAncients.length,0);
});
test('older saves do not mint materials and legacy extreme grade keeps its ancient migration',()=>{
 for(let version=1;version<=6;version++){const p=prepare().profile;p.version=version;const restored=g.restoreProfile(p,1000);assert.equal(restored.version,16);assert.ok(Object.values(restored.materials).every(n=>n===0));assert.equal(restored.gold,p.gold);}
 const row=ITEM_CATALOG[0],p=prepare().profile;p.version=4;p.inventory=[{id:1,catalogId:row.id,slot:row.slot,tier:row.tier,artId:row.artId,rarity:6,affixes:{damage:17}}];p.equipment.weapon=1;const restored=g.restoreProfile(p,1000);assert.equal(restored.inventory[0].rarity,5);assert.ok(g.ancientDefinition(restored.inventory[0]));assert.equal(restored.equipment.weapon,1);
});
test('untrusted counts are bounded and crafted rarity cannot borrow a legacy identity or slot',()=>{
 const p=prepare().profile;p.materials={origin:Infinity,source:-2,root:2.9,seal:1e10,unknown:55};const restored=g.restoreProfile(p,1000);assert.equal(restored.materials.origin,0);assert.equal(restored.materials.source,0);assert.equal(restored.materials.root,2);assert.equal(restored.materials.seal,MATERIAL_LIMIT);assert.equal(restored.materials.unknown,undefined);
 const s=prepare(),item=addLegacy(s,LEGACY[0]);assert.equal(uniquePower(6),1.5);assert.equal(uniqueEffect({...item,catalogId:'bad'}),null);assert.equal(uniqueEffect({...item,slot:'armor'}),null);assert.equal(uniqueEffect({...item,catalogId:ITEM_CATALOG[0].id}),null);item.affixes.damage=999;assert.deepEqual(g.restoreProfile(s.profile,1000).inventory[0].affixes,{...g.CRAFTED_CATALOG[0].base,damage:g.itemRollRanges(item).damage.max});
 for(const patch of [{rarity:7},{rarity:6.5},{tier:3.1}]){const raw=structuredClone(s.profile);Object.assign(raw.inventory[0],patch);assert.ok(g.restoreProfile(raw,1000).inventory[0].rarity<6);}
});
test('crafted equipment retains grade6 in appearance and committed attack snapshot with no new atlas dependency',()=>{
 const s=prepare(),row=LEGACY[1],item=addLegacy(s,row);g.equipItem(s,item.id);const design=visualDesign(item);assert.equal(design.rarity,6);assert.equal(design.craftId,row.id);assert.ok(Number.isFinite(design.rune));const snapshot=g.equipmentSnapshot(s.profile);assert.equal(snapshot.weapon.rarity,6);assert.equal(snapshotDesigns(snapshot).weapon.craftId,row.id);assert.equal(g.uniqueLoadout(s.profile).weapon.crafted,row);
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
 const s=prepare();for(const n of [1,3,5]){const item=addLegacy(s,LEGACY[n]);g.equipItem(s,item.id);}arena(s);const e=enemy(s,{hp:1000});g.attack(s,{x:1,y:0});advance(s,.15);assert.ok(s.run.craftedProcs>0);assert.ok(e.bleedTicks>0);assert.equal(s.run.synergyProcs.execute,0);assert.equal(s.run.ancientProcs,0);g.dash(s,{x:1,y:0});assert.ok(s.uniqueState.ancientZones.length<=6);assert.ok(s.projectiles.length<=64);
});
