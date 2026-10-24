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
 for(const row of ITEM_CATALOG.filter(r=>!r.signatureOnly&&!r.set))for(const rarity of [5,6]){const p=g.createProfile(1000);p.version=4;p.gold=73;p.inventory=[owned(row,rarity,17)];p.equipment[row.slot]=17;p.lootPity=8;p.nextItemId=18;const a=g.restoreProfile(g.encodeProfile(p,1000),1000),item=a.inventory[0];assert.equal(a.version,14);assert.equal(item.id,17);assert.equal(item.rarity,5);assert.ok(ancientDefinition(item));assert.deepEqual(item.affixes,p.inventory[0].affixes);assert.equal(item.artId,row.artId);assert.equal(uniqueEffect(item).id,row.effectId);assert.equal(a.equipment[row.slot],17);assert.equal(a.gold,73);assert.equal(a.lootPity,8);assert.equal(a.nextItemId,18);const b=g.restoreProfile(g.encodeProfile(a,1000),1000);assert.deepEqual(b,a);}
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
