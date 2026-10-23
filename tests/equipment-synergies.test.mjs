import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {freezeCombat} from './combat-fixture.mjs';
const gear=(id,n=1,rarity=3)=>{const row=[...g.ITEM_CATALOG,...g.ANCIENT_CATALOG].find(r=>r.id===id);return {id:n,catalogId:row.id,name:row.name,slot:row.slot,tier:row.tier,artId:row.artId,rarity,affixes:{}};};
function arena(ids=['3-weapon-1','1-charm-2']){const p=g.createProfile();p.inventory=ids.map((id,i)=>gear(id,i+1,id.startsWith('ancient')?5:3));for(const item of p.inventory)p.equipment[item.slot]=item.id;const s=g.createGame(p);g.launch(s);freezeCombat(s);s.run.flow='combat';s.run.waveQuota=1000;s.spawns=[];s.barrels=[];s.enemies=[];s.player.invulnerable=999;return s;}
function enemy(s,opts={}){if(opts.boss)s.run.bossSpawned=true;const e={id:s.nextId++,type:'skitter',boss:false,x:s.player.x+80,y:s.player.y,hp:1000,maxHp:1000,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,guardMax:0,dead:false,group:null,wave:s.run.wave,runStage:s.run.stage,damage:20,radius:58,lookX:0,lookY:1,...opts};s.enemies.push(e);return e;}
function advance(s,time){while(time>1e-8){const dt=Math.min(.01,time);g.advanceGame(s,dt);time-=dt;}}
function hit(s,{heavy=true,finisher=false}={}){const p=s.player;p.action='idle';p.attackCooldown=0;p.thunderCooldown=0;p.stamina=50;p.combo=finisher?2:0;p.comboWindow=finisher?.5:0;s.rng=0;assert.equal(heavy?g.thunder(s,{x:1,y:0}):g.attack(s,{x:1,y:0}),true);advance(s,p.swing.impact+.001);s.hitStop=0;}
test('distinct equipped slots activate authored frost and bleed combinations at all supported grades',()=>{
 for(const rarity of [3,4]){const s=arena();s.profile.inventory[1].rarity=rarity;assert.equal(g.equipmentSynergies(s.profile)[0].id,'shatter');}
 const s=arena(['1-weapon-1','1-charm-4']);assert.equal(s.synergies[0].id,'execute');s.profile.inventory[1].rarity=2;assert.equal(g.equipmentSynergies(s.profile).length,0);
 const solo=arena(['3-weapon-5']);assert.equal(solo.synergies.length,0);
 const ancient=arena(['ancient-2-weapon-3','ancient-1-armor-4']);assert.equal(ancient.synergies[0].id,'execute');
});
test('default visual sword and unequipped inventory never grant a preparation capability',()=>{
 const s=arena(['1-weapon-1','1-charm-4']);s.profile.equipment.weapon=null;assert.equal(g.equipmentSynergies(s.profile).length,0);s.profile.inventory=s.profile.inventory.filter(i=>i.slot!=='weapon');assert.equal(g.equipmentSynergies(s.profile).length,0);
});
test('expired preparations and inter-wave attacks cannot pay off',()=>{
 const s=arena(),e=enemy(s,{chillRemaining:.1});hit(s);assert.equal(s.run.synergyProcs.shatter,0);e.x=s.player.x+80;e.chillRemaining=5;s.run.flow='break';s.run.timer=100;hit(s);assert.equal(s.run.synergyProcs.shatter,0);
});
test('first frost hit only prepares, following heavy consumes frost with an exact bounded bonus',()=>{
 const s=arena(),e=enemy(s);hit(s,{heavy:false});assert.ok(e.chillRemaining>0);assert.equal(s.run.synergyProcs.shatter,0);e.x=s.player.x+80;const before=e.hp;hit(s);assert.equal(before-e.hp,Math.round(g.playerStats(s.profile).thunderDamage*1.65));assert.equal(e.chillRemaining,0);assert.equal(s.run.synergyProcs.shatter,1);
});
test('ordinary attacks cannot consume prepared status; finisher can',()=>{
 const s=arena(),e=enemy(s,{chillRemaining:4});hit(s,{heavy:false});assert.ok(e.chillRemaining>0);assert.equal(s.run.synergyProcs.shatter,0);e.x=s.player.x+80;hit(s,{heavy:false,finisher:true});assert.equal(s.run.synergyProcs.shatter,1);assert.equal(e.chillRemaining,0);
});
test('cooldown survives pause and equipment swaps and one cleave can pay off multiple prepared targets',()=>{
 const s=arena(),a=enemy(s,{chillRemaining:5}),b=enemy(s,{chillRemaining:5,y:s.player.y+8});hit(s);assert.equal(s.run.synergyProcs.shatter,2);assert.equal(a.chillRemaining+b.chillRemaining,0);
 s.paused=true;const cd=s.uniqueState.cooldowns['synergy:shatter'];advance(s,5);assert.equal(s.uniqueState.cooldowns['synergy:shatter'],cd);s.profile.inventory.push(gear('1-charm-3',9));g.equipItem(s,9);g.equipItem(s,2);assert.equal(s.uniqueState.cooldowns['synergy:shatter'],cd);s.paused=false;const c=enemy(s,{chillRemaining:5});hit(s);assert.equal(s.run.synergyProcs.shatter,2);assert.ok(c.chillRemaining>0);advance(s,1.6);c.x=s.player.x+80;hit(s);assert.ok(s.run.synergyProcs.shatter>2);
});
test('front guard blocks payoff without consuming status or starting its cooldown',()=>{
 const s=arena(),e=enemy(s,{chillRemaining:5,guard:200,guardMax:200,guardX:-1,guardY:0});hit(s);assert.equal(e.guard,135);assert.equal(s.run.synergyProcs.shatter,0);assert.ok(e.chillRemaining>0);assert.equal(s.uniqueState.cooldowns['synergy:shatter'],undefined);
});
test('boss shatter scales to 30 percent and does not alter telegraph time',()=>{
 const s=arena(),e=enemy(s,{boss:true,chillRemaining:5,action:'windup',actionTime:0,windup:100,targetX:0,targetY:0});hit(s);assert.equal(1000-e.hp,Math.round(g.playerStats(s.profile).thunderDamage*1.3));assert.equal(e.action,'windup');assert.equal(e.windup,100);assert.equal(e.chillRemaining,0);
});
test('bleed execution requires existing bleed and pre-hit threshold; refunds once per cleave',()=>{
 const s=arena(['1-weapon-1','1-charm-4']),e=enemy(s,{hp:351});hit(s);assert.equal(s.run.synergyProcs.execute,0);assert.ok(e.bleedTicks>0);e.x=s.player.x+80;e.hp=350;e.bleedTimer=2;const f=enemy(s,{hp:350,bleedTicks:3,bleedTimer:2,bleedDamage:2});const control=arena(['1-weapon-1','1-charm-4']);control.synergies=[];enemy(control,{hp:350,bleedTicks:3,bleedTimer:2,bleedDamage:2});hit(control);hit(s);assert.equal(s.run.synergyProcs.execute,2);assert.equal(e.bleedTicks+f.bleedTicks,0);assert.ok(Math.abs(s.player.stamina-control.player.stamina-12)<.001);assert.equal(350-e.hp,Math.round(g.playerStats(s.profile).thunderDamage*1.8));
});
test('bleed first applied by a low-health heavy is not eligible on that same impact',()=>{
 const s=arena(['1-weapon-1','1-charm-4']),e=enemy(s,{hp:350});hit(s);assert.equal(s.run.synergyProcs.execute,0);assert.ok(e.bleedTicks>0);
});
test('boss execution uses 18 percent threshold and 40 percent bonus without instant death',()=>{
 const s=arena(['1-weapon-1','1-charm-4']),e=enemy(s,{boss:true,hp:181,bleedTicks:3,bleedTimer:2,bleedDamage:2});hit(s);assert.equal(s.run.synergyProcs.execute,0);e.x=s.player.x+80;e.hp=180;e.bleedTimer=2;hit(s);assert.equal(s.run.synergyProcs.execute,1);assert.equal(180-e.hp,Math.round(g.playerStats(s.profile).thunderDamage*1.4));assert.ok(e.hp>0);
});
test('committed attack retains old combination through paused swap, and cannot gain one mid-swing',()=>{
 for(const gain of [false,true]){const s=arena(['3-weapon-1',gain?'1-charm-4':'1-charm-2']),e=enemy(s,{chillRemaining:4});s.profile.inventory.push(gear(gain?'1-charm-2':'1-charm-4',9));g.thunder(s,{x:1,y:0});s.paused=true;g.equipItem(s,9);s.paused=false;advance(s,s.player.swing.impact+.001);assert.equal(s.run.synergyProcs.shatter,gain?0:1);assert.equal(s.synergies.length,gain?1:0);}
});
test('ancient or unique proc damage cannot trigger recursive payoff',()=>{
 const s=arena(['3-weapon-5','1-charm-2']);enemy(s);const e=enemy(s,{x:s.player.x-150,chillRemaining:4});hit(s);assert.equal(s.run.synergyProcs.shatter,0);assert.ok(e.hp<1000);assert.ok(e.chillRemaining>0);
});
test('lethal execution rewards one death, while new hunt resets counters and cooldowns',()=>{
 const s=arena(['1-weapon-1','1-charm-4']),e=enemy(s,{hp:1,bleedTicks:3,bleedTimer:2,bleedDamage:2});hit(s);assert.equal(e.dead,true);assert.equal(s.run.kills,1);assert.equal(s.run.synergyProcs.execute,1);advance(s,2);assert.equal(s.run.kills,1);g.returnToCamp(s);g.launch(s);assert.deepEqual(s.run.synergyProcs,{shatter:0,execute:0});assert.equal(s.uniqueState.cooldowns['synergy:execute'],undefined);
});
