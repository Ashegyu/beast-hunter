import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {storeItem} from '../dist/loot.js';
const item=(id,catalogId,affixes={})=>{const r=g.ITEM_CATALOG.find(r=>r.id===catalogId);return {id,catalogId,slot:r.slot,tier:r.tier,artId:r.artId,name:r.name,rarity:3,affixes};};
function fixture(){const p=g.createProfile(1000);p.inventory=[item(1,'3-weapon-1',{damage:10,crit:25}),item(2,'1-charm-2',{crit:25}),item(3,'1-weapon-1',{damage:20,crit:24}),item(4,'1-charm-4',{speed:10}),item(5,'1-armor-1',{hp:50})];p.equipment={weapon:1,armor:5,charm:2};p.nextItemId=6;return g.createGame(p);}
test('comparison uses actual capped stats and authored gained/lost synergies without mutating profile',()=>{
 const s=fixture(),before=structuredClone(s.profile),c=g.compareEquipment(s.profile,{weapon:3,armor:5,charm:4});assert.equal(c.before.crit,.5);assert.equal(c.after.crit,.29);assert.ok(Math.abs(c.deltas.crit+.21)<1e-9);assert.equal(c.deltas.damage,10);assert.equal(c.gained[0].id,'execute');assert.equal(c.lost[0].id,'shatter');assert.deepEqual(s.profile,before);
 const same=g.compareItem(s.profile,3);assert.equal(same.deltas.crit,0);assert.equal(g.compareItem(s.profile,999),null);
});
test('saved build swaps all slots including basic gear atomically in camp and recomputes ownership',()=>{
 const s=fixture();assert.equal(g.saveBuild(s,0,'빙결'),true);g.equipItem(s,3);g.equipItem(s,4);assert.equal(g.saveBuild(s,1,'출혈'),true);s.uniqueState.cooldowns.execute=2;s.uniqueState.lastStand=true;
 assert.equal(g.applyBuild(s,0).ok,true);assert.equal(s.synergies[0].id,'shatter');assert.equal(s.loadout.weapon.itemId,1);assert.equal(s.player.hp,g.playerStats(s.profile).maxHp);assert.equal(s.uniqueState.cooldowns.execute,2);assert.equal(s.uniqueState.lastStand,true);
 s.profile.savedBuilds[2]={name:'기본',equipment:{weapon:null,armor:null,charm:null}};assert.equal(g.applyBuild(s,2).ok,true);assert.deepEqual(s.profile.equipment,g.emptyEquipment());assert.equal(s.synergies.length,0);
 s.profile.savedBuilds[0].equipment.charm=999;const result=g.applyBuild(s,0);assert.equal(result.ok,true);assert.equal(result.missing.length,1);assert.equal(s.profile.equipment.charm,null);const before=structuredClone(s.profile.equipment);
 s.phase='playing';s.paused=true;assert.equal(g.applyBuild(s,1).ok,false);assert.deepEqual(s.profile.equipment,before);assert.equal(g.saveBuild(s,-1,'bad'),false);
});
test('favorites and build members protect manual, bulk and automatic salvage; failed transaction is atomic',()=>{
 const s=fixture();g.saveBuild(s,0,'빙결');assert.equal(g.itemProtection(s.profile,s.profile.inventory[0]),'착용 중');g.equipItem(s,3);assert.equal(g.itemProtection(s.profile,s.profile.inventory[0]),'저장 빌드');assert.equal(g.salvageItem(s,1),false);
 g.toggleFavorite(s,4);assert.equal(g.salvageItem(s,4),false);const before=g.encodeProfile(s.profile,1000);assert.equal(g.bulkSalvage(s,[1,4]).ok,false);assert.equal(g.bulkSalvage(s,[4,4]).ok,false);assert.equal(g.encodeProfile(s.profile,1000),before);
 g.deleteBuild(s,0);g.toggleFavorite(s,4);const gold=s.profile.gold,result=g.bulkSalvage(s,[1,4]);assert.equal(result.ok,true);assert.equal(result.count,2);assert.equal(s.profile.gold,gold+result.gold);assert.equal(g.bulkSalvage(s,[1,4]).ok,false);
 s.phase='playing';s.paused=false;assert.equal(g.toggleFavorite(s,2),false);assert.equal(g.bulkSalvage(s,[2]).ok,false);
});
test('full protected bag and pending loot restore never discard favorites or builds and settle once',()=>{
 const p=g.createProfile(1000);p.inventory=Array.from({length:g.INVENTORY_LIMIT},(_,n)=>({...item(n+1,'1-weapon-1'),rarity:0}));p.favoriteItemIds=p.inventory.map(i=>i.id);p.favoriteItemIds.push(1,999);p.savedBuilds[0]={name:'a'.repeat(40),equipment:{weapon:1,armor:null,charm:null}};
 const drop={...item(g.INVENTORY_LIMIT+1,'3-weapon-1'),rarity:4};p.pendingLoot=[drop,drop];const restored=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(restored.inventory.length,g.INVENTORY_LIMIT);assert.equal(restored.favoriteItemIds.length,g.INVENTORY_LIMIT);assert.equal(restored.inventory.some(i=>i.id===1),true);assert.equal(restored.savedBuilds[0].name.length,24);assert.equal(restored.gold,g.salvageValue(drop));
 const again=g.restoreProfile(g.encodeProfile(restored,1000),1000);assert.equal(again.gold,restored.gold);assert.deepEqual(again.inventory,restored.inventory);
 const result=storeItem(restored,{...drop,id:g.INVENTORY_LIMIT+2});assert.equal(result.kept,false);assert.equal(restored.inventory.length,g.INVENTORY_LIMIT);
});
test('legacy defaults, invalid builds and stale identities are bounded and never alias newly crafted gear',()=>{
 const p=g.createProfile(1000),old={...p};delete old.savedBuilds;delete old.favoriteItemIds;assert.deepEqual(g.restoreProfile(old,1000).savedBuilds,[null,null,null,null,null]);
 p.savedBuilds=[{name:'missing',equipment:{weapon:1,armor:null,charm:null}},{name:'invalid',equipment:{weapon:-1,armor:null,charm:null}},null,{name:'ignored'}];const clean=g.restoreProfile(p,1000);assert.equal(clean.savedBuilds.length,5);assert.equal(clean.savedBuilds[1],null);assert.equal(g.buildStatus(clean,0).ok,true);
 clean.gold=10000;clean.clearedStage=3;clean.unlockedStage=3;for(const m of g.MATERIALS)clean.materials[m.id]=100;const s=g.createGame(clean),crafted=g.craftItem(s,g.CRAFTED_CATALOG[0].id);assert.equal(crafted.ok,true);assert.equal(crafted.item.id,2);assert.equal(g.buildStatus(clean,0).ok,true);
});

test('legacy 48-item saves can grow through 49 to the bag limit and recover without item loss',()=>{
 const p=g.createProfile(1000);p.inventory=Array.from({length:48},(_,n)=>({...item(n+1,'1-weapon-1'),rarity:0}));p.nextItemId=49;
 const L=g.INVENTORY_LIMIT,loaded=g.restoreProfile(g.encodeProfile(p,1000),1000),gold=loaded.gold;
 for(let id=49;id<=L;id++){const result=storeItem(loaded,item(id,'1-weapon-1'));assert.equal(result.kept,true);assert.equal(result.discardedId,null);}
 assert.equal(loaded.inventory.length,L);assert.equal(loaded.gold,gold);
 loaded.equipment.weapon=L;loaded.favoriteItemIds=loaded.inventory.map(i=>i.id);loaded.nextItemId=L+1;
 const restored=g.restoreProfile(g.encodeProfile(loaded,1000),1000);assert.deepEqual(restored.inventory,loaded.inventory);assert.equal(restored.equipment.weapon,L);assert.equal(restored.favoriteItemIds.length,L);
 const overflow=storeItem(restored,item(L+1,'1-weapon-1'));assert.equal(overflow.kept,false);assert.equal(overflow.discardedId,L+1);assert.equal(restored.inventory.length,L);assert.ok(restored.inventory.some(i=>i.id===L));
});
