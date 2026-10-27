import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
function arena(level=1,stage=9){
 const p=g.createProfile(1000);p.level=level;p.stageProgress[0]=9;p.skillBook=g.restoreSkillBook(null,level);p.skillBook.loadout.active=['crescent',null];
 const s=g.createGame(p);g.launch(s,1,stage);s.enemies=[];s.spawns=[];s.barrels=[];s.player.invulnerable=999;return s;
}
function step(s,t){for(let n=0;n<Math.ceil(t/.025);n++)g.advanceGame(s,.025);}
function pack(s,count=32,cross=null){
 s.spawns=Array.from({length:count},(_,i)=>({id:s.nextId++,type:'skitter',species:'forest_wolf',x:s.player.x+100+i%8*20,y:s.player.y+(cross??(-60+Math.floor(i/8)*40)),delay:0}));
 g.advanceGame(s,.001);for(const e of s.enemies){e.speed=0;e.cooldown=999;}s.run.waveQuota=count;s.run.stageQuota=count;return s.enemies;
}
test('dense waves queue arrivals above 32, freeze on pause, then replace kills without changing total roster',()=>{
 const s=arena();g.returnToCamp(s);g.launch(s,1,9);s.barrels=[];s.player.invulnerable=999;step(s,5);
 assert.equal(s.enemies.filter(e=>!e.dead).length,32);assert.equal(s.spawns.length,5);assert.equal(g.remainingMonsters(s),116);
 s.paused=true;const frozen=JSON.stringify(s);step(s,1);assert.equal(JSON.stringify(s),frozen);s.paused=false;
 for(const e of s.enemies.slice(0,5))s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e6,ttl:1,friendly:true});
 step(s,.2);assert.equal(s.enemies.filter(e=>!e.dead).length,32);assert.equal(s.spawns.length,0);assert.equal(g.remainingMonsters(s),111);
});
test('same real 32-monster pack survives an untrained level one wave but a trained level twenty crescent clears it in one cast',()=>{
 const outcomes=[];
 for(const level of [1,20]){const s=arena(level);pack(s);if(level===20)s.profile.skillBook.ranks.crescent=4;
  assert.ok(g.useSkill(s,'crescent',{x:1,y:0}));step(s,.2);outcomes.push(s.run.kills);
  if(level===20){assert.equal(s.profile.totalKills,32);assert.ok(s.profile.pendingLoot.length+s.run.monsterItems>=3);const ids=[...s.profile.inventory,...s.profile.pendingLoot].map(i=>i.id);assert.equal(new Set(ids).size,ids.length);}
 }
 assert.deepEqual(outcomes,[0,32]);
});
test('level area thresholds are capped, leave single targets alone and snapshot width for the whole cast',()=>{
 for(const [level,scale]of [[1,1],[9,1],[10,1.1],[19,1.1],[20,1.2],[39,1.3],[40,1.4],[50,1.4]]){
  // Alpha 0.137: every area skill also has the SKILL_AREA_BOOST base.
  const area=g.SKILL_AREA_BOOST*scale;assert.ok(Math.abs(g.skillAreaScale({level},'crescent')-area)<1e-9);assert.equal(g.skillAreaScale({level},'seeking'),1);assert.equal(g.skillReach({level},'crescent'),300);assert.ok(Math.abs(g.skillReach({level},'dance')-175*area)<1e-9);
 }
 const s=arena(9),[e]=pack(s,1,80);e.hp=e.maxHp=1000;assert.ok(g.useSkill(s,"crescent",{x:1,y:0}));const root=s.skillRuntime.jobs[0].root,width=root.width;assert.ok(Math.abs(width-60*g.SKILL_AREA_BOOST)<1e-9);
 s.profile.level=40;step(s,.3);assert.equal(e.hp,1000);assert.equal(root.width,width);s.player.action='idle';s.skillRuntime.cooldowns.crescent=0;
 assert.ok(g.useSkill(s,'crescent',{x:1,y:0}));step(s,.2);assert.ok(e.hp<1000);assert.ok(s.effects.some(f=>f.type==='skillImpact'&&f.skillId==='crescent'&&Math.abs(f.areaScale-1.4*g.SKILL_AREA_BOOST)<1e-9));
});
test('bulk drops remain reserved exactly once and higher-quality receipts last four seconds',()=>{
 // Stage 3 is a normal stage; strict stages (4, 8, 9, 10) forfeit kills and loot on retreat by design.
 const s=arena(20,3);pack(s);s.profile.skillBook.ranks.crescent=4;assert.ok(g.useSkill(s,'crescent',{x:1,y:0}));step(s,.2);
 const item={id:999,slot:'weapon',tier:1,rarity:3,name:'시험 전설',catalogId:'1-weapon-1',artId:'forest_blade',affixes:{damage:10}};
 s.profile.pendingLoot.push(item);s.pickups.push({id:s.nextId++,kind:'equipment',item,x:s.player.x,y:s.player.y,age:1});step(s,.025);assert.ok(s.effects.some(f=>f.type==='loot'&&f.rarity===3&&f.maxTtl===4));
 const before=s.profile.totalKills,owned=s.profile.pendingLoot.map(i=>i.id);g.returnToCamp(s);assert.equal(s.profile.totalKills,before);assert.equal(s.profile.pendingLoot.length,0);
 const saved=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.ok(owned.every(id=>saved.inventory.some(i=>i.id===id)));assert.equal(new Set(saved.inventory.map(i=>i.id)).size,saved.inventory.length);
});
