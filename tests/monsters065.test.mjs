import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {CHAPTERS,MONSTERS,CHAPTER_BOSSES,chapterMonsterPool} from '../dist/chapters.js';
const NEW=Object.keys(MONSTERS).filter(id=>MONSTERS[id].unlockStage);
const step=(s,t)=>{for(let i=0;i<Math.ceil(t/.025);i++)g.advanceGame(s,.025);};
function prepared(chapter=1,stage=4){const p=g.createProfile(1000);p.clearedStage=g.STAGES.length;p.unlockedStage=g.STAGES.length;const s=g.createGame(p);assert.ok(g.launch(s,chapter,stage));return s;}
function arena(id){const chapter=CHAPTERS.find(c=>c.roster.includes(id)),s=prepared(chapter.id),design=MONSTERS[id];s.enemies=[];s.spawns=[{id:s.nextId++,type:design.role,species:id,boss:false,elite:false,x:750,y:1160,delay:0,warning:1}];s.barrels=[];s.run.flow='combat';s.player.invulnerable=99;g.advanceGame(s,.001);s.run.flow='break';s.run.timer=1e6;assert.equal(s.enemies.length,1);return {s,e:s.enemies[0],design};}

test('nine new identities have distinct chapter membership and frozen attack definitions',()=>{
 // 0.65 added nine specialists; 0.106 added nine more, nine new basics and the chapter bosses.
 assert.equal(NEW.length,18);assert.equal(Object.keys(MONSTERS).length,21+18+Object.keys(CHAPTER_BOSSES).length);
 for(const c of CHAPTERS){assert.equal(c.roster.length,6);assert.equal(new Set(c.roster).size,6);for(const id of c.roster)assert.ok(id.startsWith(c.key+'_'));for(const type of ['skitter','spitter','bulwark'])assert.equal(c.roster.filter(id=>MONSTERS[id].role===type).length,2);}
 for(const id of NEW){const {e,design}=arena(id);assert.equal(e.species,id);assert.equal(e.name,design.name);assert.equal(e.type,design.role);assert.equal(e.guardMax,0);if(design.role==='spitter')assert.ok(e.shots>=2);if(design.attackCycle)assert.ok(Object.isFrozen(e.attackCycle));}
});
test('stages introduce mobility at 2, casters at 3, heavies at 4 while retaining original roles',()=>{
 for(const c of CHAPTERS)for(let stage=1;stage<=9;stage++){
  const s=prepared(c.id,stage),ids=new Set(s.spawns.map(q=>q.species));assert.ok(s.spawns.every(q=>c.roster.includes(q.species)&&MONSTERS[q.species].role===q.type&&(MONSTERS[q.species].unlockStage??1)<=stage));
  // Stage 9 is the special swarm: every slot becomes a skitter, so ranged/heavy pools stay defined but unused.
  const swarm=stage===9;if(swarm)assert.ok(s.spawns.every(q=>q.type==='skitter'));
  for(const role of ['skitter','spitter','bulwark']){const pool=chapterMonsterPool(c.id,stage,role);assert.equal(pool.length,stage>=({skitter:2,spitter:3,bulwark:4}[role])?2:1);if(!swarm||role==='skitter')assert.ok(pool.every(id=>ids.has(id)));}
  assert.equal(s.spawns.some(q=>q.boss),false);assert.ok(s.spawns.length<=40);
 }
 assert.deepEqual(chapterMonsterPool(99,1,'skitter'),[]);
});
test('factory rejects foreign or wrong-role skins and boss reservations cannot be reskinned',()=>{
 for(const [type,species,boss,expected]of [['skitter','ruins_bat',false,'forest_wolf'],['spitter','forest_spider',false,'forest_goblin'],['bulwark','unknown',false,'forest_orc'],['bulwark','forest_devourer',true,CHAPTERS[0].bossSpecies]]){
  const s=prepared();s.enemies=[];s.spawns=[{id:s.nextId++,type,species,boss,x:750,y:1160,delay:0}];s.run.flow='combat';g.advanceGame(s,.001);assert.equal(s.enemies[0].species,expected);
 }
});
test('new ranged species fire their actual fan counts, velocities and colors after a locked windup',()=>{
 for(const id of ['forest_mushroom','ruins_wraith','frost_wisp']){
  const {s,e,design}=arena(id);Object.assign(e,{action:'windup',actionTime:0,windup:.1,targetX:e.x+300,targetY:e.y});s.player.y=e.y+300;
  s.paused=true;const before=JSON.stringify(s);step(s,.2);assert.equal(JSON.stringify(s),before);s.paused=false;step(s,.1);assert.equal(s.projectiles.length,design.shots);
  for(let i=0;i<design.shots;i++){const q=s.projectiles[i],angle=(i-(design.shots-1)/2)*design.shotSpread;assert.ok(Math.abs(q.vx-Math.cos(angle)*design.shotSpeed)<1e-8);assert.ok(Math.abs(q.vy-Math.sin(angle)*design.shotSpeed)<1e-8);assert.equal(q.color,design.shotColor);assert.equal(q.projectileStyle,design.projectileStyle);}
  e.action='windup';e.actionTime=0;e.windup=.1;s.projectiles=Array.from({length:63},(_,i)=>({id:1000+i,x:50,y:50,vx:0,vy:0,ttl:99,damage:0,friendly:false}));step(s,.1);assert.equal(s.projectiles.length,64);
  e.action='windup';e.actionTime=0;e.dead=true;s.projectiles=[];step(s,.2);assert.equal(s.projectiles.length,0);
 }
});
test('rooted carnivorous plant stays anchored and resolves one readable ground bite',()=>{
 const {s,e}=arena('forest_devourer');e.cooldown=999;const start={x:e.x,y:e.y};step(s,.5);assert.equal(e.x,start.x);assert.equal(e.y,start.y);assert.equal(e.guard,0);
 Object.assign(e,{action:'windup',actionTime:0,windup:.1,targetX:s.player.x,targetY:s.player.y});s.player.invulnerable=0;const hp=s.player.hp;step(s,.1);assert.ok(s.player.hp<hp);e.cooldown=999;s.player.invulnerable=0;const after=s.player.hp;step(s,.5);assert.equal(s.player.hp,after);
});
test('new charge species commit snapshot directions and cancel safely on death',()=>{
 for(const id of ['forest_spider','ruins_bat','ruins_mimic','frost_leopard','frost_yeti']){
  const {s,e,design}=arena(id);e.pattern=design.attackCycle.indexOf('charge');Object.assign(e,{action:'windup',actionTime:0,windup:.1,targetX:e.x+200,targetY:e.y});step(s,.1);assert.equal(e.action,'attack');assert.equal(e.chargeY,0);const x=e.x;s.player.y+=400;step(s,.1);assert.ok(e.x>x);assert.equal(e.y,1160);assert.ok(e.x<=s.bounds.width-s.bounds.padding);
  e.dead=true;const deadX=e.x;step(s,.2);assert.equal(e.x,deadX);
 }
});

test('all three normal/elite/nightmare finals stay one boss with no new species or barrels',()=>{
 for(const chapter of CHAPTERS)for(const mode of [0,1,2]){
  const p=g.createProfile(),all=g.STAGES.length;p.clearedStage=all;p.unlockedStage=all;p.bossMastery=g.STAGES.map(()=>2);p.difficultyProgress=[g.STAGES.map(()=>9),g.STAGES.map(()=>9)];const s=g.createGame(p);assert.ok(g.launch(s,chapter.id,10,null,mode));assert.equal(s.spawns.length,1);assert.equal(s.spawns[0].boss,true);assert.equal(s.barrels.length,0);s.player.invulnerable=100;step(s,1.5);assert.equal(s.enemies.length,1);assert.equal(s.enemies[0].species,chapter.bossSpecies);step(s,10);assert.equal(s.spawns.length,0);assert.equal(s.enemies.length,1);
 }
});

test('a real hit interrupts new caster windups before any hostile fan can be committed',()=>{
 for(const id of ['forest_mushroom','ruins_wraith','frost_wisp']){
  const {s,e}=arena(id);Object.assign(e,{hp:1000,maxHp:1000,action:'windup',actionTime:0,windup:.15,targetX:s.player.x,targetY:s.player.y});
  s.projectiles=[{id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:5,ttl:1,friendly:true}];step(s,.025);assert.equal(e.action,'hurt');s.hitStop=0;step(s,.12);assert.equal(s.projectiles.filter(q=>!q.friendly).length,0);assert.equal(e.dead,false);
 }
});
