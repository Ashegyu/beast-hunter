import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {ITEM_CATALOG,RARITY_INFO,PERFECT_ROLL_CHANCE,rollItem} from '../dist/loot.js';
import {freezeCombat} from './combat-fixture.mjs';
function arena(){const s=g.createGame(g.createProfile(1000));g.launch(s);freezeCombat(s);s.enemies=[];s.barrels=[];s.player.invulnerable=999;return s;}
function drop(s,boss=false){
 const e={id:s.nextId++,type:boss?'bulwark':'skitter',elite:!boss,boss,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];
 s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);assert.ok(e.dead);
}
test('reserved monster drops remain common even at the former legendary guarantee and pickup or reload never recounts it',()=>{
 const s=arena();for(let i=1;i<=20;i++){s.lootRng=0;const combat=s.rng;drop(s);assert.equal(s.rng,combat);assert.equal(s.profile.pendingLoot.at(-1).rarity,0);assert.equal(s.profile.legendaryPity,0);}
 assert.equal(s.profile.pendingLoot.length,20);assert.equal(s.run.items,0);
 const restored=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.equal(restored.legendaryPity,0);assert.equal(restored.pendingLoot.length,0);assert.equal(restored.inventory.length,20);
 const again=g.restoreProfile(g.encodeProfile(restored,1000),1000);assert.deepEqual(again,restored);
 g.returnToCamp(s);assert.equal(s.profile.legendaryPity,0);assert.equal(s.profile.inventory.length,20);assert.equal(s.profile.gold,320);
});
test('legacy legendary streak cannot elevate stage monster rewards',()=>{
 const s=arena();s.profile.legendaryPity=7;
 // First family sample then an elite quality roll in its legendary interval.
 let seed=0;for(;seed<10000;seed++){let a=(Math.imul(1664525,seed)+1013904223)>>>0;a=(Math.imul(1664525,a)+1013904223)>>>0;const roll=a/4294967296;if(roll>.93&&roll<.99)break;}
 s.lootRng=seed;drop(s);assert.equal(s.profile.pendingLoot.at(-1).rarity,0);assert.equal(s.profile.legendaryPity,0);
 const next=g.createGame(s.profile);g.launch(next);next.enemies=[];next.spawns=[];next.barrels=[];next.run.wave=3;next.run.waveKills=next.run.waveQuota;next.profile.legendaryPity=9;g.advanceGame(next,.025);
 assert.equal(next.run.stage,2);assert.equal(next.profile.legendaryPity,9);assert.equal(next.run.stageItems,1);
});
test('drop protection restores bounded legacy defaults and a pending pickup keeps its already committed count',()=>{
 for(const [raw,want] of [[undefined,0],[-5,0],[NaN,0],[1e9,19],[7,7]]){const p=g.createProfile(1000);p.legendaryPity=raw;assert.equal(g.restoreProfile(p,1000).legendaryPity,want);}
 const s=arena();s.lootRng=0;drop(s);const p=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.equal(p.legendaryPity,0);assert.equal(p.inventory.length,1);assert.equal(p.pendingLoot.length,0);
});
test('every chapter and boss difficulty grants common stage equipment without duplicating settlement',()=>{
 for(let chapter=1;chapter<=3;chapter++)for(let mode=0;mode<=2;mode++){
  const p=g.createProfile();p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[2,2,2];p.difficultyProgress=[[9,9,9],[9,9,9]];const s=g.createGame(p);g.launch(s,chapter,10,null,mode);s.spawns=[];s.barrels=[];s.run.bossSpawned=true;s.lootRng=0;drop(s,true);
  const receipts=s.effects.filter(f=>f.type==='loot'&&f.origin==='monster');assert.equal(receipts.length,2);assert.ok(receipts.every(r=>r.rarity===0));assert.equal(s.profile.pendingLoot.length,0);assert.equal(s.phase,'victory');assert.equal(s.run.items,3);
  const owned=s.profile.inventory.map(i=>i.id),gold=p.gold;for(let n=0;n<80;n++)g.advanceGame(s,.05);assert.deepEqual(p.inventory.map(i=>i.id),owned);assert.equal(p.gold,gold);
 }
});
test('perfect rolls maximize each selected affix across every ordinary family and quality, preserving RNG calls',()=>{
 const extras={damage:3,hp:12,speed:2,crit:2,reduction:1};
 for(const row of ITEM_CATALOG)for(const rarity of [2,3,4]){
  // Set pieces roll from their own set; original identities roll by tier.
  const choices=ITEM_CATALOG.filter(r=>row.set?r.set===row.set:!r.set&&r.tier===row.tier),index=choices.indexOf(row),threshold={2:.94,3:.985,4:.998}[rarity];
  const roll=fraction=>{let n=0;const item=rollItem({id:1,tier:row.tier,set:row.set??null},()=>++n===1?(index+fraction)/choices.length:n===2?threshold:.3);return{item,n};};
  const a=roll(.02),b=roll(.5);assert.equal(a.item.rarity,rarity);assert.equal(a.item.perfect,true);assert.equal(b.item.perfect,undefined);assert.equal(a.n,b.n);assert.equal(a.item.catalogId,row.id);
  const scale=(.76+row.tier*.24)*RARITY_INFO[rarity].power;
  for(const [k,v]of Object.entries(a.item.affixes)){const expected=Math.min(k==='hp'?250:k==='damage'?80:25,Math.max(1,Math.round((row.base[k]??extras[k])*scale*(Object.hasOwn(row.base,k)?1.15:1.2))));assert.equal(v,expected);assert.ok(v>=b.item.affixes[k]);}
  const p=g.createProfile(1000);p.inventory=[a.item];p.equipment[a.item.slot]=1;const restored=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.deepEqual(restored.inventory[0],a.item);
 }
});
test('all dropped grades can roll numeric maxima; perfect markers match their actual stat ranges',()=>{
 let seed=12345,perfect=0;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 for(let n=0;n<10000;n++){const item=rollItem({id:n+1,tier:n%3+1},rng);assert.equal(!!item.perfect,g.isPerfectRoll(item));if(item.perfect)perfect++;}
 assert.ok(perfect>10000*PERFECT_ROLL_CHANCE*.8);
 const row=g.ANCIENT_CATALOG[0],p=g.createProfile(1000);p.inventory=[{...row,id:1,catalogId:row.id,rarity:5,perfect:true,rollVersion:1,affixes:{...row.base}}];assert.equal(g.restoreProfile(p,1000).inventory[0].perfect,undefined);
});
test('a full protected bag converts a guaranteed drop once and cannot restore or duplicate its protection',()=>{
 const s=arena(),p=s.profile;p.inventory=Array.from({length:g.INVENTORY_LIMIT},(_,n)=>({id:n+1,slot:'weapon',tier:3,rarity:4,name:'보호 장비',affixes:{damage:80}}));p.favoriteItemIds=p.inventory.map(i=>i.id);p.nextItemId=g.INVENTORY_LIMIT+1;p.legendaryPity=19;s.lootRng=0;drop(s);assert.equal(p.legendaryPity,0);assert.equal(p.pendingLoot[0].rarity,0);
 g.returnToCamp(s);assert.equal(p.inventory.length,g.INVENTORY_LIMIT);assert.equal(p.pendingLoot.length,0);const gold=p.gold;assert.ok(gold>0);const restored=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(restored.gold,gold);assert.equal(restored.legendaryPity,0);
});
