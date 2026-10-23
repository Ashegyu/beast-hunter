import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {EQUIPMENT_ART} from '../dist/chapters.js';
import {freezeCombat} from './combat-fixture.mjs';
function item(artId,id=1){const art=EQUIPMENT_ART.find(a=>a.id===artId);return {...art,id,artId,rarity:1,affixes:{},name:art.name};}
function arena(artId='forest_blade'){
 const p=g.createProfile();p.inventory=[item(artId)];p.equipment.weapon=1;const s=g.createGame(p);g.launch(s);freezeCombat(s);
 const e=s.enemies[0];s.enemies=[e];Object.assign(e,{x:s.player.x+80,y:s.player.y,hp:500,maxHp:500,speed:0,cooldown:999,action:'walk',aggro:true,guard:0,guardMax:0});return {s,e};
}
function advance(s,seconds,input={}){let left=seconds;while(left>1e-8){const dt=Math.min(.025,left);g.advanceGame(s,dt,input);left-=dt;}}
function hit(s,e,{heavy=false,finisher=false}={}){
 s.player.action='idle';s.player.attackCooldown=0;s.player.thunderCooldown=0;s.player.stamina=100;s.player.combo=finisher?2:0;s.player.comboWindow=finisher?.5:0;
 e.x=s.player.x+80;e.y=s.player.y;assert.equal(heavy?g.thunder(s,{x:1,y:0}):g.attack(s,{x:1,y:0}),true);
 advance(s,s.player.swing.impact);s.hitStop=0;
}
test('all six existing swords get immutable traits and legacy art fallback survives save restore',()=>{
 for(const art of EQUIPMENT_ART){const i=item(art.id);assert.equal(Boolean(g.weaponTrait(i)),art.slot==='weapon');}
 assert.equal(g.weaponTrait(null),null);assert.throws(()=>{g.WEAPON_TRAITS.bleed.name='bad';},TypeError);
 const p=g.createProfile();p.inventory=[item('frost_blade')];delete p.inventory[0].artId;p.equipment.weapon=1;
 const restored=g.restoreProfile(g.encodeProfile(p));assert.equal(restored.version,13);assert.equal(g.equippedWeaponTrait(restored).id,'frost');assert.equal(restored.inventory.length,1);
});
test('bleed ticks exactly three times without stagger, extra drain or stacked instances',()=>{
 const {s,e}=arena();s.profile.skills.drain=1;s.player.hp=50;hit(s,e);assert.equal(e.bleedTicks,3);const hp=e.hp,playerHp=s.player.hp;
 advance(s,.8);assert.equal(e.hp,hp-4);assert.equal(e.bleedTicks,2);assert.equal(s.player.hp,playerHp);assert.notEqual(e.action,'hurt');
 advance(s,1.6);assert.equal(e.hp,hp-12);assert.equal(e.bleedTicks,0);advance(s,1);assert.equal(e.hp,hp-12);
});
test('repeated hits refresh count without resetting tick countdown or multiplying damage',()=>{
 const {s,e}=arena();hit(s,e);advance(s,.3);const timer=e.bleedTimer;hit(s,e);assert.ok(e.bleedTimer<timer);assert.equal(e.bleedTicks,3);assert.equal(e.bleedDamage,4);
 const hp=e.hp;advance(s,.4);assert.equal(e.hp,hp-4);assert.equal(e.bleedTicks,2);
});
test('guarded contact blocks bleed and frost, rear contact can apply them',()=>{
 for(const art of ['forest_blade','frost_blade']){const {s,e}=arena(art);Object.assign(e,{type:'bulwark',guard:100,guardMax:100,guardX:-1,guardY:0,action:'windup',windup:99});hit(s,e);assert.equal(e.bleedTicks,0);assert.equal(e.chillRemaining,0);
 e.guardX=1;hit(s,e);assert.ok(e.bleedTicks>0||e.chillRemaining>0);}
});
test('pause freezes statuses, re-equipping changes future swings but keeps the applied bleed',()=>{
 const {s,e}=arena();hit(s,e);const timer=e.bleedTimer;s.paused=true;advance(s,10);assert.equal(e.bleedTimer,timer);
 s.profile.inventory.push(item('frost_blade',2));assert.equal(g.equipItem(s,2),true);s.paused=false;advance(s,.8);assert.equal(e.bleedTicks,2);assert.equal(g.equippedWeaponTrait(s.profile).id,'frost');hit(s,e);assert.ok(e.chillRemaining>0);assert.ok(e.bleedTicks>0);
 g.returnToCamp(s);g.launch(s);assert.ok(s.enemies.every(a=>!a.bleedTicks&&!a.chillRemaining));
});
test('committed swing keeps its weapon trait when equipment changes during pause',()=>{
 const {s,e}=arena();g.attack(s,{x:1,y:0});advance(s,.025);s.paused=true;s.profile.inventory.push(item('frost_blade',2));g.equipItem(s,2);s.paused=false;advance(s,.1);
 assert.ok(e.bleedTicks>0);assert.equal(e.chillRemaining,0);assert.equal(s.player.swing.trait,'bleed');
});
test('bleed death owns one reward and never repeats damage or rewards after death',()=>{
 const {s,e}=arena();hit(s,e);e.hp=4;advance(s,.8);assert.equal(e.dead,true);assert.equal(e.bleedTicks,0);assert.equal(s.run.kills,1);assert.equal(s.profile.totalKills,1);const gold=s.profile.gold+s.profile.pendingGold+s.pickups.reduce((n,p)=>n+p.gold,0);
 advance(s,2);assert.equal(s.run.kills,1);assert.equal(s.profile.totalKills,1);assert.equal(s.profile.gold+s.profile.pendingGold+s.pickups.reduce((n,p)=>n+p.gold,0),gold);
});
test('frost reduces movement only, expires, and bosses retain 85 percent speed',()=>{
 for(const boss of [false,true]){const {s,e}=arena('frost_blade');e.boss=boss;s.run.bossSpawned=boss;hit(s,e);assert.equal(e.chillRemaining>0,true);
 s.player.action='idle';e.action='walk';e.actionTime=0;e.x=s.player.x+300;e.speed=100;e.cooldown=99;const x=e.x;advance(s,.2);assert.ok(Math.abs((x-e.x)-(boss?17:13))<.001);assert.ok(Math.abs(e.actionTime-.2)<.001);
 e.speed=0;advance(s,2);assert.equal(e.chillRemaining,0);}
});
test('piercing is limited to heavy and finisher, damages guard extra and does not create a projectile',()=>{
 for(const mode of [{},{heavy:true},{finisher:true}]){const {s,e}=arena('forest_fang');Object.assign(e,{type:'bulwark',guard:100,guardMax:100,guardX:-1,guardY:0,action:'windup',windup:99});hit(s,e,mode);
 const special=mode.heavy||mode.finisher;assert.equal(e.guard,100-(mode.heavy?90:mode.finisher?63:12));assert.equal(s.projectiles.length,0);assert.equal(e.bleedTicks,0);assert.equal(e.chillRemaining,0);
 assert.ok(500-e.hp>(special?25:0));if(!special)assert.ok(500-e.hp<14);}
});
test('an unequipped or salvaged sword never grants traits to a basic weapon',()=>{
 const {s,e}=arena();s.paused=true;s.profile.equipment.weapon=null;assert.equal(g.salvageItem(s,1),true);s.paused=false;hit(s,e);assert.equal(s.player.swing.trait,null);assert.equal(e.bleedTicks,0);
});
test('piercing feedback appears only when hitting armor, not on unarmored targets',()=>{
 const {s,e}=arena('forest_fang');hit(s,e,{heavy:true});assert.equal(s.effects.some(f=>f.type==='gearProc'),false);
});
test('expired bleed releases old damage; a later weaker hit snapshots its own strength',()=>{
 const {s,e}=arena();s.profile.forge.blade=8;hit(s,e);assert.equal(e.bleedDamage,7);advance(s,2.5);assert.equal(e.bleedTicks,0);s.profile.forge.blade=0;hit(s,e);assert.equal(e.bleedDamage,4);
});
test('a final boss killed by bleed advances chapter and rewards once, and victory freezes statuses',()=>{
 const p=g.createProfile();p.stageProgress[0]=9;p.inventory=[item('forest_blade')];p.equipment.weapon=1;const s=g.createGame(p);g.launch(s,1,10);
 s.run.wave=1;s.run.waveQuota=1;s.run.bossSpawned=true;s.spawns=[{id:s.nextId++,type:'bulwark',boss:true,elite:false,x:s.player.x+80,y:s.player.y,delay:0}];s.barrels=[];g.advanceGame(s,.001);
 const e=s.enemies[0];e.cooldown=999;e.speed=0;hit(s,e);e.hp=4;advance(s,.8);assert.equal(s.phase,'victory');assert.equal(s.run.waveKills,1);assert.equal(s.run.kills,1);assert.equal(s.profile.unlockedStage,2);assert.equal(s.run.items,3);assert.equal(s.run.stageItems,1);assert.equal(s.run.monsterItems,2);
 const gold=s.profile.gold,cores=s.profile.cores;advance(s,10);assert.equal(s.profile.gold,gold);assert.equal(s.profile.cores,cores);assert.equal(s.run.items,3);assert.equal(s.run.stageItems,1);assert.equal(s.run.monsterItems,2);
});
test('entry chapter and boss cues give reaction time while later melee retains its challenge',()=>{
 for(const chapter of [1,2]){const p=g.createProfile();p.clearedStage=1;p.unlockedStage=2;const s=g.createGame(p);g.launch(s,chapter);freezeCombat(s);const e=s.enemies[0];s.enemies=[e];Object.assign(e,{x:s.player.x+50,y:s.player.y,cooldown:0,aggro:true,speed:0});g.advanceGame(s,.025);assert.equal(e.action,'windup');assert.equal(e.windup,chapter===1?.58:.48);}
 const {s,e}=arena();Object.assign(e,{boss:true,chapterId:1,pattern:0,cooldown:0,action:'idle'});s.run.bossSpawned=true;g.advanceGame(s,.025);assert.equal(e.windup,1);
 Object.assign(e,{hp:100,maxHp:500,cooldown:0,action:'idle'});g.advanceGame(s,.025);assert.equal(e.windup,.8);
});
