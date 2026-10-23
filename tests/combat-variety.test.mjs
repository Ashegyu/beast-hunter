import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
function ticks(s,seconds,input={}){for(let i=0;i<Math.ceil(seconds/.025);i++)g.advanceGame(s,.025,input);}
function arena(){const s=g.createGame(g.createProfile(1000));g.launch(s,1);s.enemies=[];s.barrels=[];s.spawns=[];s.run.flow="break";s.run.timer=1e6;return s;}
function enemy(s,dx=100,type='skitter'){return{id:s.nextId++,x:s.player.x+dx,y:s.player.y,homeX:s.player.x+dx,homeY:s.player.y,type,group:0,boss:false,elite:false,hp:500,maxHp:500,speed:0,cooldown:999,action:'idle',actionTime:0,dead:false,aggro:true,facing:1,damage:10,radius:type==='spitter'?16:58,windup:.8,pattern:0,guard:0,guardMax:0,guardX:-1,guardY:0,exposed:0,perfectDodged:false};}
function shot(s,dx=100,vx=-360){return{id:s.nextId++,x:s.player.x+dx,y:s.player.y,vx,vy:0,damage:10,ttl:2.6,friendly:false,perfectDodged:false};}
function core(s,dx=90){return{id:s.nextId++,kind:'barrel',x:s.player.x+dx,y:s.player.y,hp:18,status:'idle',fuse:0,radius:205,group:0};}

test('spitter holds range, retreats up close and fires toward its locked windup target',()=>{
  const s=arena(),e=enemy(s,300,'spitter');e.speed=90;s.enemies=[e];const x=e.x;ticks(s,.2);assert.equal(e.x,x);s.player.x=e.x-50;ticks(s,.2);assert.ok(e.x>x);
  const a=arena(),ranged=enemy(a,300,'spitter');a.enemies=[ranged];ranged.action='windup';ranged.targetX=a.player.x;ranged.targetY=a.player.y;const hp=a.player.hp;
  ticks(a,.75);assert.equal(a.projectiles.length,0);ticks(a,.1);assert.equal(a.projectiles.length,1);assert.ok(a.projectiles[0].vx<0);ticks(a,.9);assert.ok(a.player.hp<hp);
  const miss=arena(),r=enemy(miss,300,'spitter');miss.enemies=[r];r.action='windup';r.targetX=miss.player.x;r.targetY=miss.player.y;ticks(miss,.85);miss.player.y+=150;ticks(miss,1);assert.equal(miss.player.hp,miss.player.maxHp);
});
test('front armor reduces hits; flanking avoids it and breaker attacks expose a real stagger window',()=>{
  const s=arena(),e=enemy(s,95,'bulwark');s.enemies=[e];Object.assign(e,{guard:100,guardMax:100,action:'windup',windup:99,targetX:s.player.x,targetY:s.player.y});g.attack(s,{x:1,y:0});ticks(s,.45);const blocked=500-e.hp;assert.ok(blocked>0&&blocked<14);assert.equal(e.guard,88);assert.equal(e.action,'windup');
  e.x=s.player.x+95;g.thunder(s,{x:1,y:0});ticks(s,.85);assert.equal(e.guard,23);
  e.x=s.player.x+95;e.action='windup';e.actionTime=0;s.player.combo=2;s.player.comboWindow=.5;g.attack(s,{x:1,y:0});ticks(s,.35);assert.equal(e.guard,0);assert.equal(s.run.guardBreaks,1);assert.ok(e.exposed>0);assert.equal(e.action,'stagger');assert.ok(s.effects.some(f=>f.type==='guardBreak'));
  const back=arena(),b=enemy(back,-95,'bulwark');back.enemies=[b];Object.assign(b,{guard:100,guardMax:100,action:'windup',windup:99});g.attack(back,{x:-1,y:0});ticks(back,.3);assert.ok(500-b.hp>blocked*2);assert.equal(b.guard,100);
});
test('only a late threatened dodge grants one counter, which costs no stamina and never overshoots nearby targets',()=>{
  const early=arena(),a=enemy(early,50);early.enemies=[a];Object.assign(a,{action:'windup',windup:1,actionTime:.1,targetX:early.player.x,targetY:early.player.y});g.dash(early,{x:0,y:1});assert.equal(early.player.counterReady,0);
  const s=arena(),e=enemy(s,50);s.enemies=[e];Object.assign(e,{action:'windup',windup:1,actionTime:.89,targetX:s.player.x,targetY:s.player.y});s.player.thunderCooldown=4;
  assert.equal(g.dash(s,{x:0,y:1}),true);assert.equal(s.run.perfectDodges,1);assert.equal(e.perfectDodged,true);assert.equal(s.player.thunderCooldown,0);ticks(s,.25);assert.ok(s.player.counterReady>0);
  s.player.stamina=0;e.x=s.player.x+55;e.y=s.player.y;e.action='idle';e.cooldown=999;const x=s.player.x,hp=e.hp;
  assert.equal(g.thunder(s,{x:1,y:0}),true);assert.equal(s.player.stamina,0);assert.equal(s.player.swing.counter,true);assert.equal(s.player.counterReady,0);ticks(s,.3);assert.ok(e.hp<hp-90);assert.equal(s.player.x,x);
  const fan=arena(),boss=enemy(fan,200);Object.assign(boss,{boss:true,pattern:2,action:'windup',windup:1,actionTime:.9,targetX:fan.player.x,targetY:fan.player.y});fan.enemies=[boss];fan.run.bossSpawned=true;g.dash(fan,{x:0,y:1});assert.equal(fan.player.counterReady,0);
});
test('projectile near misses award perfect dodge once and heavy attacks return shots to the attacker',()=>{
  const s=arena(),q=shot(s,60,-400);s.projectiles=[q];g.dash(s,{x:0,y:1});assert.equal(s.run.perfectDodges,1);assert.equal(q.perfectDodged,true);ticks(s,.25);assert.equal(s.player.hp,s.player.maxHp);
  q.x=s.player.x+60;q.y=s.player.y;s.player.dashCooldown=0;s.player.stamina=100;g.dash(s,{x:0,y:1});assert.equal(s.run.perfectDodges,1);
  const a=arena(),e=enemy(a,500);a.enemies=[e];a.projectiles=[shot(a,330,-300)];g.thunder(a,{x:1,y:0});ticks(a,.4);assert.equal(a.projectiles[0].friendly,true);assert.ok(a.projectiles[0].vx>0);assert.ok(a.effects.some(f=>f.type==='reflect'));ticks(a,.6);assert.ok(e.hp<500);assert.equal(a.player.hp,a.player.maxHp);
});
test('core detonation is delayed, chains once per core, hurts nearby enemies and the hunter, and freezes on pause',()=>{
  const s=arena(),b=core(s),neighbor=core(s,240),e=enemy(s,130);s.barrels=[b,neighbor];s.enemies=[e];g.attack(s,{x:1,y:0});ticks(s,.15);assert.equal(b.status,'armed');assert.equal(s.run.explosions,0);
  s.paused=true;const fuse=b.fuse;ticks(s,.5);assert.equal(b.fuse,fuse);s.paused=false;const hp=s.player.hp;ticks(s,.7);assert.equal(b.status,'spent');assert.equal(neighbor.status,'spent');assert.equal(s.run.explosions,2);assert.ok(e.hp<500);assert.ok(s.player.hp<hp);
  const kills=s.run.kills;ticks(s,2);assert.equal(s.run.explosions,2);assert.equal(s.run.kills,kills);
});
test('cores intercept incoming shots and swept collision cannot skip a target in one substep',()=>{
  const s=arena(),b=core(s,90);s.barrels=[b];s.projectiles=[shot(s,150,-2500)];ticks(s,.05);assert.equal(b.status,'armed');assert.equal(s.projectiles.length,0);assert.equal(s.player.hp,s.player.maxHp);
  const a=arena();a.projectiles=[shot(a,70,-10000)];ticks(a,.025);assert.ok(a.player.hp<a.player.maxHp);assert.equal(a.projectiles.length,0);
});
test('boss fan grows on rage, shots are capped and expire, and pause leaves all resources unchanged',()=>{
  const s=arena(),e=enemy(s,200);Object.assign(e,{boss:true,hp:200,maxHp:500,action:'windup',actionTime:.8,windup:.85,pattern:2,targetX:s.player.x,targetY:s.player.y});s.enemies=[e];s.run.bossSpawned=true;ticks(s,.075);assert.equal(e.enraged,true);assert.equal(s.projectiles.length,5);assert.ok(s.effects.some(f=>f.type==='bossRage'));
  s.projectiles=Array.from({length:63},(_,i)=>({...shot(s,600),id:s.nextId++,vx:0,vy:1}));e.action='windup';e.actionTime=.8;e.cooldown=0;ticks(s,.075);assert.ok(s.projectiles.length<=64);
  s.paused=true;const before=JSON.stringify(s);ticks(s,1);assert.equal(JSON.stringify(s),before);s.paused=false;s.enemies=[];ticks(s,3);assert.equal(s.projectiles.length,0);
});
test('armor swapping in a paused hunt never heals, including repeatedly swapping while critically wounded',()=>{
  const s=arena();s.profile.inventory=[{id:1,slot:'armor',name:'갑옷',rarity:0,tier:1,affixes:{hp:80}},{id:2,slot:'armor',name:'가벼운 갑옷',rarity:0,tier:1,affixes:{hp:10}}];s.paused=true;s.player.hp=1;
  for(let i=0;i<10;i++){g.equipItem(s,i%2?1:2);assert.equal(s.player.hp,1);}assert.equal(s.profile.gold,0);
});

test('blast damage follows its displayed ellipse and an intercepted shot is not a perfect-dodge threat',()=>{
  const s=arena(),b=core(s,0);Object.assign(b,{status:'armed',fuse:.01});s.barrels=[b];s.player.y+=160;ticks(s,.05);assert.equal(s.player.hp,s.player.maxHp);assert.equal(s.run.explosions,1);
  const a=arena();a.projectiles=[shot(a,60,-400)];a.barrels=[core(a,35)];g.dash(a,{x:0,y:1});assert.equal(a.run.perfectDodges,0);
});
