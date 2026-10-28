import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {ITEM_CATALOG,DROP_TABLES,rollRarity,rollItem,storeItem,salvageValue,MAX_PENDING_LOOT,INVENTORY_LIMIT} from '../dist/loot.js';
import {EQUIPMENT_ART,SET_ART,ACCESSORY_ART,REGION_ACCESSORY_ART} from '../dist/chapters.js';
import {freezeCombat} from './combat-fixture.mjs';
const ALWAYS=Object.freeze({normal:1,elite:1,stage:1,boss:1});// Alpha 0.115: drops are rolls; force them where a test needs one.
const generator=(seed=12345)=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
function item(id,rarity=0,tier=1,slot='weapon'){return {id,rarity,tier,slot,name:'시험 '+id,affixes:slot==='weapon'?{damage:8}:{hp:20}};}
function arena(){const s=g.createGame();g.launch(s);freezeCombat(s);s.enemies=[];s.player.invulnerable=999;s.lootRates=ALWAYS;return s;}
function kill(s,{elite=false,boss=false}={}){
 const e={id:s.nextId++,type:boss?'bulwark':'skitter',elite,boss,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,group:null,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];
 s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:99,ttl:1,friendly:true});g.advanceGame(s,.025);assert.equal(e.dead,true);return e;
}
function advance(s,seconds){for(let i=0;i<Math.ceil(seconds/.025);i++)g.advanceGame(s,.025);}
test('108 immutable item families cover all three slots in every chapter using valid art',()=>{
 // 123 original identities, 24 region 4-6 accessories (Alpha 0.122) and 720 chapter set pieces (Alpha 0.109: 12 per set; 0.118: 60 sets).
 assert.equal(ITEM_CATALOG.length,123+24+20+720);assert.equal(new Set(ITEM_CATALOG.map(i=>i.id)).size,887);assert.equal(new Set(ITEM_CATALOG.map(i=>i.name)).size,887);
 for(const tier of [4,5,6])assert.deepEqual(['charm','earring','special'].map(slot=>ITEM_CATALOG.filter(i=>!i.set&&i.tier===tier&&i.slot===slot).length),[6,1,1]);
 for(const tier of [1,2,3])for(const slot of ['weapon','armor','charm'])assert.equal(ITEM_CATALOG.filter(i=>!i.set&&!i.dungeon&&i.tier===tier&&i.slot===slot).length,12);
 // Alpha 0.140: region 1-3 dungeon accessories (six necklaces each, a region earring for regions 2-3).
 assert.deepEqual([1,2,3].map(tier=>['charm','earring'].map(slot=>ITEM_CATALOG.filter(i=>i.dungeon&&i.tier===tier&&i.slot===slot).length)),[[6,0],[6,1],[6,1]]);
 for(const set of Object.keys(g.EQUIPMENT_SETS))assert.deepEqual([...new Set(ITEM_CATALOG.filter(i=>i.set===set).map(i=>i.slot))],['weapon','helmet','armor','pants','boots']);
 for(const row of ITEM_CATALOG)assert.ok([...EQUIPMENT_ART,...SET_ART,...ACCESSORY_ART,...REGION_ACCESSORY_ART].some(a=>a.id===row.artId&&a.slot===g.equipmentFamily(row.slot)&&a.tier===row.tier));
 assert.throws(()=>{ITEM_CATALOG[0].base.damage=999;},TypeError);
});
test('five qualities and ancient tables have measured frequencies and stronger enemies have higher quality floors',()=>{
 for(const source of ['normal','elite','boss']){const rng=generator(),counts=Array(6).fill(0);for(let i=0;i<200000;i++)counts[rollRarity(source,rng)]++;
  assert.ok(Math.abs(DROP_TABLES[source].reduce((a,b)=>a+b,0)-100)<1e-6);
  for(let n=0;n<6;n++)assert.ok(Math.abs(counts[n]/2000-DROP_TABLES[source][n])<.25,source+' rarity '+n);
  if(source==='elite')assert.equal(counts[0],0);if(source==='boss')assert.equal(counts[0]+counts[1],0);
 }
});
test('rolled variants vary affixes, obey save limits and survive complete round trips',()=>{
 const rng=generator(),names=new Set(),catalog=new Set(),rarities=new Set();
 for(let i=0;i<1200;i++){const a=rollItem({id:i+1,tier:i%3+1,source:i%3===0?'boss':'normal'},rng);names.add(a.name);catalog.add(a.catalogId);rarities.add(a.rarity);
  for(const [k,v]of Object.entries(a.affixes))assert.ok(Number.isInteger(v)&&v>0&&v<=(k==='damage'?80:k==='hp'?250:25));
  const p=g.createProfile();p.inventory=[a];g.equipItem(g.createGame(p),a.id);const loaded=g.restoreProfile(g.encodeProfile(p));assert.deepEqual(loaded.inventory[0],a);assert.ok(g.isEquippedItem(loaded,a));
 }
 assert.ok(catalog.size>=108);assert.equal(rarities.size>=5,true);assert.ok(names.size>100);
});
test('normal monster drops are plain rolls with no pity, and loot uses an independent RNG (Alpha 0.115)',()=>{
 // Real rates: about one normal kill in six drops, never guaranteed; the old ten-kill pity no longer exists.
 const s=arena();s.lootRates=null;s.profile.lootPity=9;let drops=0;
 for(let n=0;n<300;n++){const before=s.profile.pendingLoot.length+s.profile.inventory.length;s.lootRng=n*2654435761>>>0;const combat=s.rng;kill(s);assert.equal(s.rng,combat);if(s.profile.pendingLoot.length+s.profile.inventory.length>before)drops++;}
 assert.equal(s.profile.lootPity,9);assert.ok(drops>20&&drops<80,'drops '+drops);assert.equal(g.DROP_CHANCE.normal,.16);
});
test('a drop reserves ownership, has a short landing time and claims exactly once on approach',()=>{
 const s=arena();s.profile.lootPity=9;kill(s);const drop=s.pickups.find(p=>p.kind==='equipment'),id=drop.item.id;
 assert.equal(s.profile.inventory.length,0);assert.equal(s.run.items,0);s.player.x=drop.x;s.player.y=drop.y;advance(s,.2);assert.equal(s.profile.inventory.length,0);
 advance(s,.5);assert.equal(s.profile.inventory.length,1);assert.equal(s.run.monsterItems,1);assert.equal(s.profile.pendingLoot.length,0);assert.equal(s.profile.inventory[0].id,id);advance(s,1);assert.equal(s.run.items,1);
});
test('a reserved drop recovers after reload without resetting currencies, gear or grade',()=>{
 const s=arena();s.profile.gold=73;s.profile.lootPity=9;kill(s,{elite:true});const pending=s.profile.pendingLoot[0];
 const recovered=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.equal(recovered.gold,89);assert.equal(recovered.pendingLoot.length,0);assert.deepEqual(recovered.inventory[0],pending);
 const twice=g.restoreProfile(g.encodeProfile(recovered,1000),1000);assert.equal(twice.inventory.length,1);assert.equal(twice.gold,89);assert.equal(twice.version,16);
});
test('a duplicate reserved ID already owned never duplicates the item or grants salvage gold',()=>{
 const p=g.createProfile();const a=item(1,4);p.inventory=[a];p.pendingLoot=[a,a,{...a,id:2,slot:'invalid'}];p.gold=42;
 const loaded=g.restoreProfile(p);assert.equal(loaded.inventory.length,1);assert.equal(loaded.gold,42);assert.equal(loaded.pendingLoot.length,0);
});
test('full bags protect equipped/high-quality gear and salvage a worse incoming item instead',()=>{
 const p=g.createProfile();p.inventory=Array.from({length:INVENTORY_LIMIT},(_,n)=>item(n+1,4,1,['weapon','armor','charm'][n%3]));p.equipment={weapon:1,armor:2,charm:3};const ids=p.inventory.map(i=>i.id),a=item(INVENTORY_LIMIT+1,0,3);
 const result=storeItem(p,a);assert.equal(result.kept,false);assert.deepEqual(p.inventory.map(i=>i.id),ids);assert.equal(p.gold,salvageValue(a));
 const better=item(INVENTORY_LIMIT+2,4,3);const high=storeItem(p,better);assert.equal(high.kept,true);assert.equal(p.inventory.length,INVENTORY_LIMIT);assert.ok(p.inventory.some(i=>i.id===INVENTORY_LIMIT+2));assert.ok([1,2,3].every(id=>p.inventory.some(i=>i.id===id)));assert.equal(high.discardedId,5);
 const gold=p.gold;assert.equal(storeItem(p,better).duplicate,true);assert.equal(p.gold,gold);
});
test('recovering a full-bag reservation credits conversion once and clears its pending ownership',()=>{
 const p=g.createProfile();p.inventory=Array.from({length:INVENTORY_LIMIT},(_,n)=>item(n+1,4));p.pendingLoot=[item(INVENTORY_LIMIT+1,0),item(INVENTORY_LIMIT+1,0)];
 const a=g.restoreProfile(p);assert.equal(a.gold,salvageValue(item(INVENTORY_LIMIT+1,0)));assert.equal(a.pendingLoot.length,0);const b=g.restoreProfile(g.encodeProfile(a));assert.equal(b.gold,a.gold);assert.equal(b.inventory.length,INVENTORY_LIMIT);
});
test('defeat and camp return settle uncollected equipment without granting extra kills',()=>{
 for(const death of [false,true]){const s=arena();kill(s,{elite:true});const id=s.profile.pendingLoot[0].id;
  if(death){s.player.invulnerable=0;s.player.hp=1;s.projectiles.push({id:s.nextId++,x:s.player.x,y:s.player.y,vx:0,vy:0,damage:999,ttl:1,friendly:false});g.advanceGame(s,.025);assert.equal(s.phase,'defeat');}else g.returnToCamp(s);
  assert.equal(s.profile.pendingLoot.length,0);assert.ok(s.profile.inventory.some(i=>i.id===id));assert.equal(s.profile.totalKills,1);const gold=s.profile.gold;g.returnToCamp(s);assert.equal(s.profile.gold,gold);assert.equal(s.profile.inventory.length,1);
 }
});
test('pending equipment is bounded and a long pickup-free session settles every item once',()=>{
 const s=arena();for(let i=0;i<40;i++){kill(s,{elite:true});assert.ok(s.profile.pendingLoot.length<=MAX_PENDING_LOOT);assert.ok(s.pickups.filter(p=>p.kind==='equipment').length<=MAX_PENDING_LOOT);}
 assert.equal(s.run.monsterItems+s.profile.pendingLoot.length,40);g.returnToCamp(s);assert.equal(s.profile.inventory.length,40);assert.equal(s.profile.pendingLoot.length,0);assert.equal(s.profile.totalKills,40);
});
test('item identity wraps safely at the save ceiling without reusing an owned or reserved ID',()=>{
 const s=arena();s.profile.inventory=[item(1),item(1e9)];s.profile.nextItemId=1e9;kill(s,{elite:true});kill(s,{elite:true});assert.deepEqual(s.profile.pendingLoot.map(i=>i.id),[2,3]);
 const ids=[...s.profile.inventory,...s.profile.pendingLoot].map(i=>i.id);assert.equal(new Set(ids).size,ids.length);
});
test('boss loot is guaranteed, settles before the reveal and result delay never replays rewards',()=>{
 const s=arena();s.run.stage=10;s.run.wave=1;s.run.waveQuota=1;s.run.bossSpawned=true;kill(s,{boss:true});
 assert.equal(s.phase,'victory');assert.equal(s.run.monsterItems,2);assert.equal(s.run.stageItems,1);assert.equal(s.run.items,3);assert.equal(s.profile.pendingLoot.length,0);assert.equal(g.resultReady(s),false);assert.ok(s.profile.inventory.every(i=>i.rarity===0&&g.STAGE_SLOTS.includes(i.slot)));
 const gold=s.profile.gold,ids=s.profile.inventory.map(i=>i.id),time=s.run.time;advance(s,.5);assert.equal(g.resultReady(s),false);advance(s,.7);assert.equal(g.resultReady(s),true);advance(s,5);assert.deepEqual(s.profile.inventory.map(i=>i.id),ids);assert.equal(s.profile.gold,gold);assert.equal(s.run.time,time);
});
test('all chapter and difficulty boss receipts match the actual once-only payout',()=>{
 for(const chapter of [1,5,6,11,30])for(let mode=0;mode<3;mode++){
  const p=g.createProfile(),all=g.STAGES.length;p.clearedStage=all;p.unlockedStage=all;p.stageProgress=g.STAGES.map(()=>10);p.bossMastery=g.STAGES.map(()=>2);p.difficultyProgress=[g.STAGES.map(()=>9),g.STAGES.map(()=>9)];const s=g.createGame(p);assert.ok(g.launch(s,chapter,10,null,mode));s.lootRates=ALWAYS;
  s.enemies=[];s.spawns=[];s.barrels=[];s.run.wave=1;s.run.waveQuota=1;s.run.bossSpawned=true;kill(s,{boss:true});
  const receipt=s.effects.findLast(f=>f.type==='loot'&&f.origin==='stage').stageReward,expected={gold:Math.round(g.STAGES[chapter-1].reward*g.modeScale(chapter,mode).reward),cores:Math.ceil(chapter/5)+g.HUNT_MODES[mode].extraCore,healed:0};
  assert.deepEqual(receipt,expected);assert.equal(p.gold,expected.gold);assert.equal(s.run.gold,expected.gold);assert.equal(p.cores,expected.cores);
  const saved=g.encodeProfile(p,1000);advance(s,2);assert.equal(g.encodeProfile(p,1000),saved);
 }
});

test('every chapter drops its own set and the new set bonuses reach player stats (Alpha 0.109)',()=>{
 assert.equal(new Set(g.STAGES.map(c=>c.set)).size,g.STAGES.length);
 for(const chapter of [2,13,24,30]){
  const p=g.createProfile(1000);p.unlockedStage=30;p.clearedStage=29;p.stageProgress=g.STAGES.map(()=>10);
  const s=g.createGame(p);g.launch(s,chapter);freezeCombat(s);s.enemies=[];s.player.invulnerable=999;
  for(let n=0;n<40&&s.profile.pendingLoot.length<3;n++){s.lootRng=n*7919+1;kill(s,{elite:true});}
  assert.ok(s.profile.pendingLoot.length>0);
  for(const item of s.profile.pendingLoot)assert.equal(g.itemSet(item),g.STAGES[chapter-1].set);
 }
 const wear=(set,slots)=>{const p=g.createProfile(1000);let seed=3;const rng=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
  for(const slot of slots){const row=g.SET_CATALOG.find(r=>r.set===set&&r.slot===slot),item={id:p.nextItemId++,slot,tier:row.tier,rarity:0,name:row.name,catalogId:row.id,artId:row.artId,affixes:{hp:1}};p.inventory.push(item);p.equipment[slot]=item.id;}
  return g.playerStats(p);};
 const bare=g.playerStats(g.createProfile(1000));
 assert.ok(Math.abs(wear('wolf',['weapon','helmet']).attackSpeed-bare.attackSpeed-.06)<1e-9);
 assert.equal(wear('mimic',['weapon','helmet']).collection-bare.collection,100);
 assert.ok(Math.abs(wear('ghoul',['weapon','helmet']).regeneration-bare.regeneration-2)<1e-9);
 assert.ok(Math.abs(wear('necro',['weapon','helmet']).range/bare.range-1.10)<1e-9);
 assert.equal(wear('wolf',['weapon']).attackSpeed,bare.attackSpeed);
});
