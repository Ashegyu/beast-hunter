import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {openMode} from './mode-fixture.mjs';
import {rollItem,rollStageItem,rollAncient} from '../dist/loot.js';
import {createBackup,readBackup} from '../dist/profile-backup.js';
const rng=(seed=53981)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const item=(slot,id,rarity=0)=>rollItem({id,tier:1,slot,quality:rarity},rng(id));
function fullProfile(){const p=g.createProfile(1000);let id=1;for(const position of g.EQUIPMENT_KEYS){const i=item(g.itemSlotForPosition(position),id++);p.inventory.push(i);p.equipment[position]=i.id;}p.nextItemId=id;return p;}
test('nine wearable positions cover eight item types and every part has independent ancient and crafted identities',()=>{
 assert.equal(g.EQUIPMENT_KEYS.length,9);assert.equal(Object.keys(g.SLOTS).length,8);
 assert.equal(g.itemSlotForPosition('earringLeft'),'earring');assert.equal(g.itemSlotForPosition('earringRight'),'earring');
 for(const slot of Object.keys(g.SLOTS)){assert.ok(g.ITEM_CATALOG.some(r=>r.slot===slot));assert.ok(g.ANCIENT_CATALOG.some(r=>r.slot===slot));assert.ok(g.CRAFTED_CATALOG.some(r=>r.slot===slot));}
 assert.equal(g.ANCIENT_CATALOG.some(r=>g.ITEM_CATALOG.some(o=>o.id===r.id)),false);
});
test('all stage source rolls are common weapon or armor; no minimum, boss, mode or pity leaks accessories or ancient',()=>{
 const random=rng(),seen=new Set();for(let n=0;n<10000;n++){const i=rollStageItem({id:n+1,tier:n%3+1},random);assert.equal(i.rarity,0);assert.ok(g.STAGE_SLOTS.includes(i.slot));assert.equal(g.ancientDefinition(i),null);seen.add(i.slot);}
 assert.deepEqual([...seen].sort(),[...g.STAGE_SLOTS].sort());
 for(const slot of ['charm','earring','special','bogus'])assert.throws(()=>rollStageItem({id:1,tier:1,slot},rng()),RangeError);
 for(const mode of g.HUNT_MODES)assert.equal(mode.ancientChance,0);
});
test('two earring instances coexist, moving one clears its old position, comparisons and invalid swaps are atomic',()=>{
 const p=g.createProfile(1000);p.inventory=[item('earring',1),item('earring',2),item('helmet',3)];const s=g.createGame(p);
 assert.equal(g.equipItem(s,1),true);assert.equal(p.equipment.earringLeft,1);assert.equal(g.equipItem(s,2),true);assert.equal(p.equipment.earringRight,2);
 assert.equal(g.itemProtection(p,p.inventory[1]),'착용 중');const expected=g.equipmentBonuses(p);for(const k of Object.keys(expected))assert.equal(expected[k],p.inventory.slice(0,2).reduce((n,i)=>n+g.effectiveAffix(i,k),0));
 const before=structuredClone(p);assert.equal(g.equipItem(s,3,'earringLeft'),false);assert.equal(g.equipItem(s,1,'helmet'),false);assert.deepEqual(p,before);
 const comparison=g.compareItem(p,1,'earringRight');assert.ok(comparison.after.maxHp<=comparison.before.maxHp);
 assert.equal(g.equipItem(s,1,'earringRight'),true);assert.equal(p.equipment.earringLeft,null);assert.equal(p.equipment.earringRight,1);assert.equal(Object.values(p.equipment).filter(id=>id===1).length,1);
 assert.equal(g.equipmentBonuses(p).damage,g.effectiveAffix(p.inventory[0],'damage'));
});
test('all nine equipped contributions and signatures survive backup, pending recovery and saved build swaps',()=>{
 const p=fullProfile(),s=g.createGame(p),stats=g.playerStats(p);assert.equal(g.saveBuild(s,0,'전체'),true);
 const snap=g.equipmentSnapshot(p);assert.equal(Object.values(snap).filter(Boolean).length,9);
 const backup=readBackup(createBackup(p,1000),1000).profile;assert.deepEqual(backup.inventory,p.inventory);assert.deepEqual(backup.equipment,p.equipment);assert.deepEqual(g.playerStats(backup),stats);
 p.equipment=g.emptyEquipment();assert.equal(g.applyBuild(s,0).ok,true);assert.deepEqual(g.playerStats(p),stats);
 p.savedBuilds[1]={name:'잘못된 중복',equipment:{...p.equipment,earringRight:p.equipment.earringLeft}};const before=structuredClone(p.equipment);assert.equal(g.applyBuild(s,1).ok,false);assert.deepEqual(p.equipment,before);
 assert.equal(g.bulkSalvage(s,[p.equipment.earringLeft,p.equipment.earringRight]).ok,false);
});
test('version ten migration preserves IDs, affixes, separate enhancement values, pending reroll, worn gear and legacy builds exactly once',()=>{
 const p=g.createProfile(1000);p.version=10;p.equipment={weapon:1,armor:2,charm:3};p.inventory=[item('weapon',1,4),item('armor',2,3),item('charm',3,2)];
 p.inventory[0].enhancement=12;p.inventory[0].enhancementAffixes=Object.fromEntries(Object.keys(p.inventory[0].affixes).map(k=>[k,k==='damage'?1.23:k==='crit'?2.34:0]));p.inventory[0].rerollCandidate={affixes:Object.fromEntries(Object.entries(g.itemRollRanges(p.inventory[0])).map(([k,r])=>[k,r.max]))};p.savedBuilds=[{name:'기존 빌드',equipment:{...p.equipment}},null,null];
 const old=structuredClone(p.inventory);const restored=g.restoreProfile(p,1000);assert.equal(restored.version,16);assert.deepEqual(restored.inventory,old);assert.equal(restored.equipment.armor,2);assert.equal(restored.equipment.charm,3);
 for(const pos of g.EQUIPMENT_KEYS.filter(k=>!['weapon','armor','charm'].includes(k)))assert.equal(restored.equipment[pos],null);
 assert.deepEqual(g.restoreProfile(g.encodeProfile(restored,1000),1000),restored);assert.equal(g.applyBuild(g.createGame(restored),0).ok,true);
});
test('corrupt duplicate and wrong-type positions are discarded; character gear cannot be worn by another character',()=>{
 const p=fullProfile();p.equipment.earringRight=p.equipment.earringLeft;p.equipment.helmet=p.equipment.weapon;
 const r=g.restoreProfile(p,1000);assert.equal(r.equipment.earringRight,null);assert.equal(r.equipment.helmet,null);
 const special=p.inventory.find(i=>i.slot==='special');const other={...p,characterId:'other',equipment:g.emptyEquipment()};const s=g.createGame(other),before=structuredClone(other);assert.equal(g.equipItem(s,special.id),false);assert.deepEqual(other,before);
 assert.equal(g.equipmentBonuses({...p,characterId:'other'}).damage<g.equipmentBonuses(p).damage,true);
});
test('every new armor part promotes through normal to mythic without changing its position or instance',()=>{
 for(const slot of ['helmet','armor','pants','boots']){const p=g.createProfile(1000),i=item(slot,1);p.inventory=[i];p.equipment[slot]=1;p.gold=1e8;for(const m of g.MATERIALS)p.materials[m.id]=100000;const s=g.createGame(p);
  for(let rank=0;rank<4;rank++){i.enhancement=g.enhancementCap(rank);const before={id:i.id,slot:i.slot,catalogId:i.catalogId};assert.equal(g.promoteItem(s,1).ok,true);assert.equal(i.rarity,rank+1);assert.equal(g.enhancementLevel(i),0);assert.deepEqual({id:i.id,slot:i.slot,catalogId:i.catalogId},before);assert.equal(p.equipment[slot],1);}
  assert.equal(g.promoteItem(s,1).ok,false);assert.equal(g.enhancementCap(i.rarity),30);
 }
});
test('forged earrings fill both earring positions; every forged/legacy crafted/ancient signature is active in its position',()=>{
 const p=g.createProfile(1000);p.gold=1e8;openMode(g,p,1,61);for(const m of g.MATERIALS)p.materials[m.id]=1000;const s=g.createGame(p);s.phase='camp';
 const forge=(slot,id)=>{p.inventory.push(rollAncient({id,tier:1,slot},.1));const r=g.forgeAncient(s,id,g.FORGE_EFFECTS[slot][0].id);assert.equal(r.ok,true,slot);return r.item;};
 const a=forge('earring',1),b=forge('earring',2);assert.notEqual(a.id,b.id);g.equipItem(s,a.id);g.equipItem(s,b.id);assert.equal(Object.values(s.loadout).filter(Boolean).length,2);
 for(const [n,slot]of ['helmet','pants','boots'].entries()){const item=forge(slot,10+n);assert.equal(g.equipItem(s,item.id),true);assert.equal(s.loadout[slot].crafted.id,'forge-'+slot+'-1');assert.equal(s.loadout[slot].signatures.length,2);}
 // Alpha 0.136: the seal recipe can no longer be made, but an owned crafted seal keeps its signature.
 {const r=g.CRAFTED_CATALOG.find(r=>r.slot==='special');assert.equal(g.craftItem(s,r.id).ok,false);p.inventory.push({id:99,slot:'special',tier:r.tier,rarity:6,name:r.name,catalogId:r.id,artId:r.artId,affixes:{...r.base},rollVersion:1,characterId:'lirian'});assert.equal(g.equipItem(s,99),true);assert.equal(s.loadout.special.crafted.id,r.id);}
 const ancient=rollAncient({id:100,tier:1,slot:'boots'},.1);p.inventory.push(ancient);g.equipItem(s,100);assert.equal(s.loadout.boots.ancient.id,ancient.catalogId);assert.equal(g.promotionStatus(p,100).ok,false);
});

test('actual normal and elite kills, stage clears and every boss mode deliver only stage types graded by hunt mode, with once-only settlement',()=>{
 for(let tier=1;tier<=3;tier++)for(let mode=0;mode<=2;mode++){
  const p=g.createProfile(1000);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[2,2,2];p.difficultyProgress=[[9,9,9],[9,9,9]];openMode(g,p,2,1);
  const s=g.createGame(p);assert.equal(g.launch(s,tier,10,null,mode),true);s.lootRates={normal:1,elite:1,stage:1,boss:1};s.spawns=[];s.barrels=[];s.run.bossSpawned=true;s.player.invulnerable=999;
  const e={id:s.nextId++,species:g.STAGES[tier-1].bossSpecies,type:'bulwark',elite:false,boss:true,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];
  s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);assert.equal(s.phase,'victory');
  // Alpha 0.114/0.115: a boss ancient is only a rare roll; with lootRates forced to 1 the three set pieces all drop.
  assert.ok(s.run.bossAncients.length<=1);assert.equal(s.run.items,3+s.run.bossAncients.length);assert.equal(s.profile.pendingLoot.length,0);
  for(const i of p.inventory){assert.equal(g.huntGrade(i),mode);if(i.rarity===5){assert.ok(g.ancientDefinition(i));assert.equal(i.tier,1);continue;}assert.ok(mode?i.rarity<=3:i.rarity===0);assert.ok(g.STAGE_SLOTS.includes(i.slot));}const before=g.encodeProfile(p,1000);for(let n=0;n<100;n++)g.advanceGame(s,.025);assert.equal(g.encodeProfile(p,1000),before);
 }
 for(const elite of [false,true]){
  const s=g.createGame();g.launch(s);s.lootRates={normal:1,elite:1,stage:1,boss:1};s.spawns=[];s.barrels=[];s.run.waveQuota=999;s.player.invulnerable=999;
  const e={id:s.nextId++,type:'skitter',elite,boss:false,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);assert.ok(s.profile.pendingLoot.length>0);assert.ok(s.profile.pendingLoot.every(i=>i.rarity===0&&g.STAGE_SLOTS.includes(i.slot)));
 }
 const s=g.createGame();g.launch(s);s.lootRates={normal:1,elite:1,stage:1,boss:1};s.spawns=[];s.barrels=[];s.enemies=[];s.run.wave=g.stageWaveCount(1);s.run.waveKills=s.run.waveQuota;g.advanceGame(s,.025);assert.equal(s.run.stageItems,1);assert.ok(s.profile.inventory.every(i=>i.rarity===0&&g.STAGE_SLOTS.includes(i.slot)));
});

test('new earring finisher signature uses the committed instance even after a paused equipment swap',()=>{
 const p=g.createProfile(),row=g.CRAFTED_CATALOG.find(r=>r.slot==='earring');p.inventory=[{...row,id:1,catalogId:row.id,affixes:{...row.base},rollVersion:1},item('earring',2)];p.equipment.earringLeft=1;
 const s=g.createGame(p);g.launch(s);s.spawns=[];s.barrels=[];s.enemies=[];s.run.waveQuota=999;s.player.invulnerable=999;
 const e={id:s.nextId++,type:'skitter',elite:false,boss:false,x:s.player.x+80,y:s.player.y,hp:10000,maxHp:10000,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58,lookX:0,lookY:1};s.enemies=[e];s.player.combo=2;s.player.comboWindow=.5;
 assert.equal(g.attack(s,{x:1,y:0}),true);assert.equal(s.player.swing.powersAtStart.earringLeft.itemId,1);s.paused=true;g.equipItem(s,2,'earringLeft');s.paused=false;assert.equal(s.loadout.earringLeft,null);
 for(let n=0;n<20;n++)g.advanceGame(s,.025);assert.equal(s.run.craftedProcs,1);assert.ok(s.effects.some(f=>f.type==='ancientSig'&&f.ancientId===row.id));assert.ok(e.hp<10000);
});
test('character-specific crafted periodic signature dispatches from the ninth position during real combat',()=>{
 const p=g.createProfile(),row=g.CRAFTED_CATALOG.find(r=>r.slot==='special');p.inventory=[{...row,id:1,catalogId:row.id,affixes:{...row.base},rollVersion:1}];p.equipment.special=1;
 const s=g.createGame(p);g.launch(s);s.spawns=[];s.enemies=[];s.barrels=[];s.run.waveQuota=999;g.advanceGame(s,.025);assert.equal(s.run.craftedProcs,1);assert.ok(s.effects.some(f=>f.type==='ancientSig'&&f.ancientId===row.id));
});
