import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import * as g from '../dist/game-engine.js';import {ANCIENT_CATALOG,ITEM_CATALOG,rollItem,rollAncient,ancientDefinition,uniqueEffect,uniquePower} from '../dist/loot.js';import {visualDesign,gearFrame,snapshotDesigns} from '../dist/equipment-visuals.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url),'utf8'));
const owned=(row,rarity=5,id=1)=>({id,slot:row.slot,tier:row.tier,catalogId:row.id,artId:row.artId,name:row.name,rarity,affixes:{damage:17,hp:31}});
test('ordinary item identity and atlas rectangle stay constant across all five qualities',()=>{
 for(const row of ITEM_CATALOG){const records=[];for(let rarity=0;rarity<=4;rarity++){const item=owned(row,rarity),before=JSON.stringify(item),design=visualDesign(item);assert.equal(design.id,row.artId);assert.equal(design.variant,undefined);assert.equal(design.rarity,rarity);records.push(gearFrame(manifest.equipment,design,manifest.equipmentRarities).frame);assert.equal(JSON.stringify(item),before);}assert.ok(records.every(r=>r===records[0]));}
});
test('ancient definitions are separate identities with fixed properties and no ordinary quality versions',()=>{
 assert.deepEqual(g.RARITIES,['일반','희귀','영웅','전설','신화','고대','제작']);assert.equal(ANCIENT_CATALOG.length,75);assert.equal(new Set(ANCIENT_CATALOG.map(r=>r.id)).size,75);
 for(const row of ANCIENT_CATALOG){assert.ok(!ITEM_CATALOG.some(r=>r.id===row.id));assert.ok(Object.isFrozen(row)&&Object.isFrozen(row.base));const choices=ANCIENT_CATALOG.filter(r=>r.tier===row.tier&&r.slot===row.slot),pick=(choices.indexOf(row)+.5)/choices.length,a=rollAncient({id:1,tier:row.tier,slot:row.slot},pick),b=rollAncient({id:2,tier:row.tier,slot:row.slot},pick);assert.equal(a.rarity,5);assert.deepEqual(a.affixes,b.affixes);assert.equal(a.name,row.name);assert.equal(ancientDefinition(a),row);assert.equal(uniqueEffect(a).id,row.signatureOnly?'signature-'+row.id:row.effectId);assert.equal(uniquePower(a.rarity),1.36);assert.equal(visualDesign(a).variant,row.id);}
});
test('ordinary quality intervals never select ancient identity and ancient interval selects only ancient',()=>{
 for(const source of ['normal','elite','boss','stage'])for(const pick of [.001,.5,.999]){let count=0;const ancient=rollItem({id:1,tier:2,source,minimum:5},()=>++count===1?pick:.9999);assert.ok(ancientDefinition(ancient));assert.equal(ancient.rarity,5);assert.equal(count,5);}
 for(let rarity=0;rarity<=4;rarity++){const thresholds=[.1,.7,.95,.99,.9985];let count=0;const item=rollItem({id:1,tier:1,source:'normal'},()=>++count===2?thresholds[rarity]:.4);assert.equal(item.rarity,rarity);assert.equal(ancientDefinition(item),null);}
});
test('every old ultra/extreme identity migrates once with ID stats trait effect and worn ownership intact',()=>{
 // Region set pieces (Alpha 0.108) are newer than these saves and have no ancient twin.
 for(const row of ITEM_CATALOG.filter(r=>!r.signatureOnly&&!r.set))for(const rarity of [5,6]){const p=g.createProfile(1000);p.version=4;p.gold=73;p.inventory=[owned(row,rarity,17)];p.equipment[row.slot]=17;p.lootPity=8;p.nextItemId=18;const a=g.restoreProfile(g.encodeProfile(p,1000),1000),item=a.inventory[0];assert.equal(a.version,15);assert.equal(item.id,17);assert.equal(item.rarity,5);assert.ok(ancientDefinition(item));assert.deepEqual(item.affixes,p.inventory[0].affixes);assert.equal(item.artId,row.artId);assert.equal(uniqueEffect(item).id,row.effectId);assert.equal(a.equipment[row.slot],17);assert.equal(a.gold,73);assert.equal(a.lootPity,8);assert.equal(a.nextItemId,18);const b=g.restoreProfile(g.encodeProfile(a,1000),1000);assert.deepEqual(b,a);}
});
test('legacy art fallback and pending migration settle duplicate drops once without granting extra gold',()=>{
 const p=g.createProfile(1000);p.version=4;p.inventory=[{id:1,slot:'weapon',tier:1,rarity:6,name:'예전 검',affixes:{damage:21}}];p.equipment.weapon=1;const row=ITEM_CATALOG.find(r=>r.slot==='charm');p.pendingLoot=[p.inventory[0],owned(row,5,2),owned(row,5,2)];p.gold=42;const a=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(a.inventory.length,2);assert.equal(a.gold,42);assert.equal(a.pendingLoot.length,0);assert.equal(a.equipment.weapon,1);assert.ok(a.inventory.every(i=>ancientDefinition(i)));assert.equal(a.nextItemId,3);
});
test('forged ancient IDs or ordinary grade five cannot obtain ancient artwork or top effect',()=>{
 const row=ANCIENT_CATALOG[0],p=g.createProfile(1000);p.inventory=[owned(row,1),{...owned(ITEM_CATALOG[0]),id:2},{...owned(row),id:3,slot:'armor'}];const restored=g.restoreProfile(p,1000);assert.equal(restored.inventory[0].rarity,5);assert.equal(restored.inventory[1].rarity,4);assert.equal(restored.inventory[2].rarity,4);assert.equal(ancientDefinition(restored.inventory[2]),null);assert.equal(uniqueEffect(p.inventory[1]),null);assert.equal(visualDesign(restored.inventory[2]).variant,undefined);
});
test('committed ancient snapshot retains item identity and theme through mutation and equip swap',()=>{
 const p=g.createProfile(),row=ANCIENT_CATALOG.find(r=>r.slot==='weapon'&&r.visualStyle===6);p.inventory=[owned(row)];p.equipment.weapon=1;const snapshot=g.equipmentSnapshot(p);p.inventory[0].catalogId=ITEM_CATALOG[0].id;p.inventory[0].rarity=0;assert.equal(snapshot.weapon.catalogId,row.id);assert.equal(snapshotDesigns(snapshot).weapon.variant,row.id);assert.ok(Object.isFrozen(snapshot.weapon));
});

test('boss ancients drop their region tier: 1 forest, 2 frost, 3 ruined castle/abyss (Alpha 0.111/0.112)',()=>{
 // 0.114: no guaranteed drop, so search the deterministic loot stream for a kill that rolls an ancient.
 for(const [chapter,tier,region]of [[1,1,1],[11,2,2],[21,3,3]])for(let seed=1;seed<4000;seed++){
  const p=g.createProfile(1000);p.unlockedStage=30;p.clearedStage=29;p.stageProgress=g.STAGES.map(()=>10);
  const s=g.createGame(p);assert.equal(g.launch(s,chapter,10),true);s.spawns=[];s.barrels=[];s.run.bossSpawned=true;s.player.invulnerable=999;
  const e={id:s.nextId++,species:g.STAGES[chapter-1].bossSpecies,type:'bulwark',elite:false,boss:true,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];
  s.lootRng=seed;s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);
  assert.ok(s.run.bossAncients.length<=1);if(!s.run.bossAncients.length){assert.ok(seed<3999,'no ancient in 4000 boss kills');continue;}const row=ANCIENT_CATALOG.find(r=>r.id===s.run.bossAncients[0]);assert.equal(row.tier,tier);assert.equal(row.region,region);
  assert.match(g.equipmentAcquisition({rarity:5,tier}),new RegExp('^'+((region-1)*10+1)+'~'+region*10+'장'));break;
 }
 const weapon=t=>ANCIENT_CATALOG.find(r=>r.tier===t&&r.slot==='weapon').base.damage;assert.ok(weapon(1)<weapon(2)&&weapon(2)<weapon(3));
 assert.equal(ANCIENT_CATALOG.find(r=>r.id==='ancient-2-weapon-1').artId,'frost_blade');assert.equal(ANCIENT_CATALOG.find(r=>r.id==='ancient-3-weapon-1').artId,'ruins_blade');
});

test('v14 saves move ancients to the region numbering once (Alpha 0.112)',()=>{
 const ruins=ANCIENT_CATALOG.find(r=>r.id==='ancient-3-weapon-1'),frost=ANCIENT_CATALOG.find(r=>r.id==='ancient-2-armor-1'),p=g.createProfile(1000);p.version=14;
 p.inventory=[{id:1,slot:'weapon',tier:2,rarity:5,artId:ruins.artId,catalogId:'ancient-2-weapon-1',name:'옛 이름',affixes:{damage:50}},{id:2,slot:'armor',tier:3,rarity:5,artId:frost.artId,catalogId:'ancient-3-armor-1',name:'옛 이름',affixes:{hp:100}}];p.equipment.weapon=1;p.equipment.armor=2;
 p.discoveredAncients=['ancient-2-weapon-1','ancient-3-armor-1'];p.targetAncientId='ancient-3-armor-1';
 const r=g.restoreProfile(JSON.stringify(p),1000);assert.equal(r.version,15);
 assert.deepEqual(r.inventory.map(i=>[i.catalogId,i.tier,i.name]),[[ruins.id,3,ruins.name],[frost.id,2,frost.name]]);assert.deepEqual([r.equipment.weapon,r.equipment.armor],[1,2]);
 assert.deepEqual([...r.discoveredAncients].sort(),[frost.id,ruins.id].sort());assert.equal(r.targetAncientId,frost.id);
 const again=g.restoreProfile(g.encodeProfile(r,1000),1000);assert.deepEqual(again.inventory.map(i=>i.catalogId),[ruins.id,frost.id]);
});

test('boss ancients are never guaranteed: about 1% of normal boss kills and the old pity counter does nothing (Alpha 0.114)',()=>{
 let ancients=0;const kills=600;
 for(let seed=1;seed<=kills;seed++){const p=g.createProfile(1000);p.unlockedStage=30;p.clearedStage=29;p.stageProgress=g.STAGES.map(()=>10);p.legendaryPity=g.LEGENDARY_PITY_LIMIT-1;
  const s=g.createGame(p);g.launch(s,1,10);s.spawns=[];s.barrels=[];s.run.bossSpawned=true;s.player.invulnerable=999;s.lootRng=seed*7919;
  const e={id:s.nextId++,species:g.STAGES[0].bossSpecies,type:'bulwark',elite:false,boss:true,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];
  s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);ancients+=s.run.bossAncients.length;assert.equal(p.legendaryPity,g.LEGENDARY_PITY_LIMIT-1);}
 assert.ok(ancients<kills*.04,'ancients '+ancients);
});
