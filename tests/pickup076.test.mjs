import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
const advance=(s,seconds)=>{for(let n=0;n<Math.ceil(seconds/.025);n++)g.advanceGame(s,.025);};
function arena(){const s=g.createGame(g.createProfile(1000));g.launch(s);s.enemies=[];s.spawns=[];s.barrels=[];s.run.waveQuota=1000;s.player.invulnerable=999;return s;}
function kill(s,{boss=false,elite=true,offset=300}={}){
 const e={id:s.nextId++,type:boss?'bulwark':'skitter',boss,elite:!boss&&elite,x:s.player.x+offset,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];s.materialRng=2000;
 s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);assert.ok(e.dead);return e;
}
const materialTotal=p=>Object.values(p).reduce((a,b)=>a+b,0);
test('gold and materials land without payment, remain beyond eight seconds and pay only when collected',()=>{
 const s=arena();kill(s);assert.equal(s.profile.gold,0);assert.equal(s.profile.pendingGold,16);assert.equal(s.run.materials,0);assert.ok(materialTotal(s.profile.pendingMaterials)>0);assert.equal(materialTotal(s.profile.materials),0);
 const gold=s.pickups.find(d=>d.kind==='gold'),material=s.pickups.find(d=>d.kind==='material'),owed=materialTotal(s.profile.pendingMaterials);assert.ok(gold&&material);advance(s,.2);assert.equal(s.profile.gold,0);advance(s,8.1);assert.ok(s.pickups.includes(gold)&&s.pickups.includes(material));assert.equal(s.profile.gold,0);
 for(const d of s.pickups)if(d.kind==='gold'||d.kind==='material'){d.x=s.player.x;d.y=s.player.y;}
 advance(s,.025);assert.equal(s.profile.gold,16);assert.equal(s.profile.pendingGold,0);assert.equal(s.run.materials,owed);assert.equal(materialTotal(s.profile.materials),owed);assert.equal(materialTotal(s.profile.pendingMaterials),0);advance(s,.1);assert.equal(s.profile.gold,16);
});
test('reservation changes save a bounded once-only recovery budget without needing floor coordinates',()=>{
 const s=arena();kill(s);const pending=structuredClone(s.profile.pendingMaterials),gold=s.profile.pendingGold,revision=s.run.resourceRevision;assert.ok(revision>0);const restored=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);
 assert.equal(restored.gold,gold);assert.deepEqual(restored.materials,pending);assert.equal(restored.pendingGold,0);assert.equal(materialTotal(restored.pendingMaterials),0);assert.deepEqual(g.restoreProfile(g.encodeProfile(restored,1000),1000),restored);
 const bad=g.createProfile(1000);bad.pendingGold=Infinity;bad.pendingMaterials={boneIron:-5,hide:1e20,source:NaN,unknown:999};const clean=g.restoreProfile(bad,1000);assert.equal(clean.gold,0);assert.equal(clean.materials.boneIron,0);assert.equal(clean.materials.hide,g.MATERIAL_LIMIT??1000000);assert.equal(clean.materials.source,0);assert.equal(clean.materials.unknown,undefined);
});
test('pause freezes both landing and currency reservations',()=>{
 const s=arena();kill(s);s.paused=true;const before=JSON.stringify(s);advance(s,2);assert.equal(JSON.stringify(s),before);s.paused=false;assert.ok(s.profile.pendingGold>0);
});
test('immediate next wave preserves visible currency then vacuums it without delaying monster spawn',()=>{
 const s=arena();s.run.waveQuota=1;kill(s);assert.equal(s.run.wave,2);assert.equal(s.run.flow,'combat');assert.equal(s.enemies.filter(e=>!e.dead).length,6);assert.equal(s.profile.gold,0);assert.ok(s.profile.pendingGold>0);assert.ok(s.pickups.filter(d=>d.kind==='gold'||d.kind==='material').every(d=>d.vacuum));advance(s,.2);assert.equal(s.profile.gold,0);advance(s,.8);assert.equal(s.profile.pendingGold,0);assert.equal(s.profile.gold,16);assert.equal(materialTotal(s.profile.pendingMaterials),0);
});
test('normal stage replacement keeps currency positions and minute budget before its collection',()=>{
 const s=arena();s.run.wave=3;s.run.waveQuota=1;kill(s);assert.equal(s.run.stage,2);assert.equal(s.run.timeRemaining,60);assert.equal(s.profile.gold,27);assert.equal(s.profile.pendingGold,16);assert.ok(s.pickups.some(d=>d.kind==='gold'&&d.age<.35&&d.vacuum));assert.equal(s.run.lootLedger.length,2);const flash=s.effects.find(f=>f.type==='gearDrop'&&f.source==='elite');assert.ok(flash,'last-kill drop flash survives stage replacement');assert.ok(flash.maxTtl-flash.ttl<.1);advance(s,1);assert.ok(flash.ttl<flash.maxTtl-.9);assert.equal(s.profile.gold,43);assert.equal(s.profile.pendingGold,0);
});
test('death, timeout and camp settle only reserved currency once and do not pay unfinished-stage rewards',()=>{
 for(const exit of ['death','timeout','camp']){
  const s=arena();kill(s);const p=s.profile,expectedGold=p.pendingGold,expectedMaterials=structuredClone(p.pendingMaterials);
  if(exit==='camp')g.returnToCamp(s);else if(exit==='timeout'){s.run.timeRemaining=0;g.advanceGame(s,.025);}else{s.player.invulnerable=0;s.player.hp=1;s.projectiles.push({id:s.nextId++,x:s.player.x,y:s.player.y,vx:0,vy:0,damage:999,ttl:1,friendly:false});g.advanceGame(s,.025);}
  assert.equal(p.gold,expectedGold);assert.deepEqual(p.materials,expectedMaterials);assert.equal(p.pendingGold,0);assert.equal(materialTotal(p.pendingMaterials),0);assert.equal(p.stageProgress[0],0);const encoded=g.encodeProfile(p,1000);advance(s,.5);g.returnToCamp(s);assert.equal(g.encodeProfile(p,1000),encoded);
 }
});
test('duplicate visual currency cannot exceed its reservation, and saturated banks reserve nothing',()=>{
 const s=arena();kill(s);const gold=s.pickups.find(d=>d.kind==='gold'),material=s.pickups.find(d=>d.kind==='material'),expected=materialTotal(s.profile.pendingMaterials);s.pickups.push({...gold,id:s.nextId++},{...material,id:s.nextId++});for(const d of s.pickups){d.x=s.player.x;d.y=s.player.y;}advance(s,.5);assert.equal(s.profile.gold,16);assert.equal(materialTotal(s.profile.materials),expected);assert.equal(s.profile.pendingGold,0);assert.equal(materialTotal(s.profile.pendingMaterials),0);
 const full=arena();full.profile.gold=1e8;for(const m of g.MATERIALS)full.profile.materials[m.id]=1000000;kill(full);assert.equal(full.profile.pendingGold,0);assert.equal(materialTotal(full.profile.pendingMaterials),0);assert.ok(!full.pickups.some(d=>d.kind==='gold'||d.kind==='material'));
});
test('result ledger includes all settled gear once, even when a full bag converts earlier drops',()=>{
 const s=arena();const count=g.INVENTORY_LIMIT+12;for(let n=0;n<count;n++)kill(s);assert.ok(s.run.lootLedger.length>0);s.run.timeRemaining=0;g.advanceGame(s,.025);assert.equal(s.run.items,count);assert.equal(s.run.lootLedger.length,count);assert.equal(s.profile.inventory.length,g.INVENTORY_LIMIT);assert.equal(new Set(s.run.lootLedger.map(i=>i.id)).size,count);assert.ok(s.run.lootLedger.some(i=>!s.profile.inventory.includes(i)));const items=s.run.lootLedger.slice(),gold=s.profile.gold;advance(s,.5);assert.deepEqual(s.run.lootLedger,items);assert.equal(s.profile.gold,gold);
});
