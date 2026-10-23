import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {ITEM_CATALOG,DROP_TABLES,rollRarity,rollItem,storeItem,salvageValue,MAX_PENDING_LOOT,INVENTORY_LIMIT} from '../dist/loot.js';
import {EQUIPMENT_ART} from '../dist/chapters.js';
import {freezeCombat} from './combat-fixture.mjs';
const generator=(seed=12345)=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
function item(id,rarity=0,tier=1,slot='weapon'){return {id,rarity,tier,slot,name:'시험 '+id,affixes:slot==='weapon'?{damage:8}:{hp:20}};}
function arena(){const s=g.createGame();g.launch(s);freezeCombat(s);s.enemies=[];s.player.invulnerable=999;return s;}
function kill(s,{elite=false,boss=false}={}){
 const e={id:s.nextId++,type:boss?'bulwark':'skitter',elite,boss,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,group:null,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];
 s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:99,ttl:1,friendly:true});g.advanceGame(s,.025);assert.equal(e.dead,true);return e;
}
function advance(s,seconds){for(let i=0;i<Math.ceil(seconds/.025);i++)g.advanceGame(s,.025);}
test('108 immutable item families cover all three slots in every chapter using valid art',()=>{
 assert.equal(ITEM_CATALOG.length,123);assert.equal(new Set(ITEM_CATALOG.map(i=>i.id)).size,123);
 for(const tier of [1,2,3])for(const slot of ['weapon','armor','charm'])assert.equal(ITEM_CATALOG.filter(i=>i.tier===tier&&i.slot===slot).length,12);
 for(const row of ITEM_CATALOG)assert.ok(EQUIPMENT_ART.some(a=>a.id===row.artId&&a.slot===g.equipmentFamily(row.slot)&&a.tier===row.tier));
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
test('normal monsters guarantee an item by the tenth dry kill while loot uses an independent RNG',()=>{
 const s=arena();for(let n=0;n<35;n++){const before=s.profile.pendingLoot.length;s.lootRng=0x12345678;const combat=s.rng;kill(s);assert.equal(s.rng,combat);assert.ok(s.profile.lootPity<10);if(s.profile.lootPity===0)assert.ok(s.profile.pendingLoot.length>before);}
 const forced=arena();forced.profile.lootPity=9;kill(forced);assert.equal(forced.profile.pendingLoot.length,1);assert.equal(forced.profile.lootPity,0);
});
test('a drop reserves ownership, has a short landing time and claims exactly once on approach',()=>{
 const s=arena();s.profile.lootPity=9;kill(s);const drop=s.pickups.find(p=>p.kind==='equipment'),id=drop.item.id;
 assert.equal(s.profile.inventory.length,0);assert.equal(s.run.items,0);s.player.x=drop.x;s.player.y=drop.y;advance(s,.2);assert.equal(s.profile.inventory.length,0);
 advance(s,.5);assert.equal(s.profile.inventory.length,1);assert.equal(s.run.monsterItems,1);assert.equal(s.profile.pendingLoot.length,0);assert.equal(s.profile.inventory[0].id,id);advance(s,1);assert.equal(s.run.items,1);
});
test('a reserved drop recovers after reload without resetting currencies, gear or grade',()=>{
 const s=arena();s.profile.gold=73;s.profile.lootPity=9;kill(s,{elite:true});const pending=s.profile.pendingLoot[0];
 const recovered=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.equal(recovered.gold,89);assert.equal(recovered.pendingLoot.length,0);assert.deepEqual(recovered.inventory[0],pending);
 const twice=g.restoreProfile(g.encodeProfile(recovered,1000),1000);assert.equal(twice.inventory.length,1);assert.equal(twice.gold,89);assert.equal(twice.version,13);
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
 for(let chapter=1;chapter<=3;chapter++)for(let mode=0;mode<3;mode++){
  const p=g.createProfile();p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[2,2,2];p.difficultyProgress=[[9,9,9],[9,9,9]];const s=g.createGame(p);assert.ok(g.launch(s,chapter,10,null,mode));
  s.enemies=[];s.spawns=[];s.barrels=[];s.run.wave=1;s.run.waveQuota=1;s.run.bossSpawned=true;kill(s,{boss:true});
  const receipt=s.effects.findLast(f=>f.type==='loot'&&f.origin==='stage').stageReward,expected={gold:Math.round(g.STAGES[chapter-1].reward*g.HUNT_MODES[mode].reward),cores:chapter+g.HUNT_MODES[mode].extraCore,healed:0};
  assert.deepEqual(receipt,expected);assert.equal(p.gold,expected.gold);assert.equal(s.run.gold,expected.gold);assert.equal(p.cores,expected.cores);
  const saved=g.encodeProfile(p,1000);advance(s,2);assert.equal(g.encodeProfile(p,1000),saved);
 }
});
