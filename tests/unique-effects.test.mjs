import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {DROP_TABLES,rollRarity,RARITY_INFO,uniqueEffect,UNIQUE_EFFECTS} from '../dist/loot.js';
import {freezeCombat} from './combat-fixture.mjs';
const gear=(effectId,id=1,rarity=3)=>{const row=(rarity>=5?g.ANCIENT_CATALOG:g.ITEM_CATALOG).find(r=>r.effectId===effectId);rarity=Math.min(5,rarity);return {id,slot:row.slot,tier:row.tier,rarity,name:row.name,artId:row.artId,catalogId:row.id,affixes:{}};};
function arena(...ids){const p=g.createProfile();p.inventory=ids.map((id,i)=>gear(id,i+1));for(const item of p.inventory)p.equipment[item.slot]=item.id;const s=g.createGame(p);g.launch(s);freezeCombat(s);s.barrels=[];s.enemies=[];s.player.invulnerable=999;return s;}
function enemy(s,x=80,y=0){const e={id:s.nextId++,type:'skitter',elite:false,boss:false,x:s.player.x+x,y:s.player.y+y,hp:1000,maxHp:1000,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,guardMax:0,dead:false,group:null,wave:s.run.wave,runStage:s.run.stage,damage:20,radius:58,lookX:0,lookY:1};s.enemies.push(e);return e;}
function advance(s,time,input={}){let left=time;while(left>1e-8){const dt=Math.min(.025,left);g.advanceGame(s,dt,input);left-=dt;}}
function hit(s,{heavy=false,finisher=false}={}){const p=s.player;p.action='idle';p.attackCooldown=0;p.thunderCooldown=0;p.stamina=100;p.combo=finisher?2:0;p.comboWindow=finisher?.5:0;s.rng=0;assert.equal(heavy?g.thunder(s,{x:1,y:0}):g.attack(s,{x:1,y:0}),true);advance(s,p.swing.impact);s.hitStop=0;}
function hurt(s,value=20){s.player.invulnerable=0;s.projectiles.push({id:s.nextId++,x:s.player.x,y:s.player.y,vx:1,vy:0,damage:value,ttl:1,friendly:false});advance(s,.025);}

test('five qualities and ancient have strictly decreasing eligible odds and exact deterministic interval coverage',()=>{
 assert.equal(g.RARITIES.length,7);for(const [source,weights]of Object.entries(DROP_TABLES)){let cumulative=0,last=Infinity;for(let i=0;i<6;i++){const weight=weights[i];if(weight){assert.ok(weight<last,source);last=weight;assert.equal(rollRarity(source,()=> (cumulative+weight/2)/100),i);}cumulative+=weight;}assert.ok(Math.abs(cumulative-100)<1e-8);}
 assert.equal(new Set(RARITY_INFO.map(r=>[r.beam,r.particles,r.rings,r.ttl].join(','))).size,7);
});
test('all 108 identities gain validated slot effects at high grade and preserve them through old-v4 saves',()=>{
 assert.equal(Object.keys(UNIQUE_EFFECTS).length,18);for(const row of g.ITEM_CATALOG.filter(r=>!r.signatureOnly)){for(const rarity of [3,4]){const item={...gear(row.effectId),catalogId:row.id,artId:row.artId,slot:row.slot,tier:row.tier,rarity};const p=g.createProfile();p.inventory=[item];p.equipment[item.slot]=item.id;const loaded=g.restoreProfile(g.encodeProfile(p));assert.equal(loaded.inventory[0].rarity,rarity);assert.equal(uniqueEffect(loaded.inventory[0]).id,row.effectId);assert.equal(g.uniqueLoadout(loaded)[row.slot].power,1+(rarity-3)*.12);}}
 assert.equal(uniqueEffect({...gear('echo'),rarity:2}),null);assert.equal(uniqueEffect({...gear('echo'),slot:'armor'}),null);assert.equal(uniqueEffect({...gear('echo'),rarity:99}),null);
 const forged={...gear('echo'),catalogId:'1-weapon-2',artId:'frost_armor'};assert.equal(uniqueEffect(forged),null);
});
test('echo adds a finisher-only forward shockwave with cooldown and no reverse damage',()=>{
 const s=arena('echo'),front=enemy(s,230),rear=enemy(s,-180);enemy(s);hit(s);assert.equal(front.hp,1000);hit(s,{finisher:true});assert.ok(front.hp<1000);assert.equal(rear.hp,1000);const before=front.hp;front.x=s.player.x+260;enemy(s);hit(s,{finisher:true});assert.equal(front.hp,before);assert.ok(s.uniqueState.cooldowns.echo>0);
});
test('storm chains from one ordinary combo contact to at most three distinct secondary targets (Alpha 0.120: no longer 파쇄-only)',()=>{
 const s=arena('storm'),primary=enemy(s),secondaries=[enemy(s,-50,140),enemy(s,-50,-140),enemy(s,-90,80),enemy(s,-90,-80)];hit(s);assert.equal(s.effects.filter(f=>f.type==='uniqueLink').length,3);assert.equal(secondaries.filter(e=>e.hp<1000).length,3);assert.ok(primary.hp<1000);const count=s.effects.filter(f=>f.type==='uniqueLink').length;advance(s,.3);assert.equal(s.effects.filter(f=>f.type==='uniqueLink').length,count);
});
test('execution thresholds distinguish regular monsters from bosses',()=>{
 const result=[];for(const boss of [false,true]){const s=arena('execution'),e=enemy(s);e.hp=300;e.boss=boss;s.run.bossSpawned=boss;hit(s);result.push(300-e.hp);}assert.ok(result[0]>result[1]*1.5);
});
test('blood supports a low-health damage style and restores health once per unguarded strike',()=>{
 const rows=[];for(const hp of [30,130]){const s=arena('blood');s.player.hp=hp;const e=enemy(s);enemy(s,90,15);hit(s);rows.push(1000-e.hp);assert.equal(s.player.hp,hp+6);}assert.ok(rows[0]>rows[1]*1.4);
});
test('frost nova hits surrounding enemies on the combo finisher and respects cooldown (Alpha 0.120)',()=>{
 const s=arena('frostNova'),behind=enemy(s,-160);enemy(s);hit(s);assert.equal(behind.hp,1000);hit(s,{finisher:true});assert.ok(behind.hp<1000);assert.ok(behind.chillRemaining>2.4);const hp=behind.hp;enemy(s);hit(s,{finisher:true});assert.equal(behind.hp,hp);
});
test('whirlwind turns only the finisher into a full-circle attack',()=>{
 const s=arena('whirlwind'),back=enemy(s,-80);enemy(s);hit(s);assert.equal(back.hp,1000);hit(s,{finisher:true});assert.ok(back.hp<1000);assert.equal(s.player.swing.dot,-1);
});
test('barrier absorbs damage, expires, freezes when paused and cannot be refreshed by swapping',()=>{
 const s=arena('barrier');g.dash(s,{x:1,y:0});assert.equal(s.uniqueState.shield,27);const hp=s.player.hp;s.player.action='idle';hurt(s,20);assert.equal(s.player.hp,hp);assert.equal(s.uniqueState.shield,7);s.paused=true;const time=s.uniqueState.shieldTime;advance(s,10);assert.equal(s.uniqueState.shieldTime,time);
 s.profile.inventory.push(gear('barrier',2));g.equipItem(s,2);assert.equal(s.uniqueState.shield,0);s.paused=false;s.player.dashCooldown=0;s.player.stamina=100;g.dash(s);assert.equal(s.uniqueState.shield,0);advance(s,9);s.player.dashCooldown=0;g.dash(s);assert.ok(s.uniqueState.shield>0);advance(s,3.1);assert.equal(s.uniqueState.shield,0);
});
test('thorns reflect actual received damage once without recursively triggering direct sword procs',()=>{
 const s=arena('storm','thorns'),e=enemy(s);hurt(s,20);assert.equal(e.hp,984);assert.equal(s.effects.some(f=>f.type==='uniqueLink'),false);const hp=e.hp;hurt(s,20);assert.equal(e.hp,hp);
});
test('perfect dodge pulse requires the real hazard timing window',()=>{
 const s=arena('pulse'),e=enemy(s,40);Object.assign(e,{action:'windup',windup:1,actionTime:.9,targetX:s.player.x,targetY:s.player.y});g.dash(s,{x:-1,y:0});assert.equal(s.run.perfectDodges,1);assert.equal(e.hp,981);const other=arena('pulse'),safe=enemy(other);g.dash(other);assert.equal(safe.hp,1000);
});
test('frost ward applies control only after actual nonlethal damage',()=>{
 const s=arena('frostWard'),e=enemy(s);hurt(s);assert.ok(e.chillRemaining>2.4);e.chillRemaining=0;hurt(s);assert.equal(e.chillRemaining,0);
});
test('last stand is once per hunt, survives swapping and resets only on a new hunt',()=>{
 const s=arena('lastStand');s.player.hp=10;hurt(s,100);assert.equal(s.phase,'playing');assert.equal(s.player.hp,30);assert.equal(s.uniqueState.lastStand,true);s.paused=true;s.profile.inventory.push(gear('lastStand',2));g.equipItem(s,2);s.paused=false;s.player.hp=10;hurt(s,100);assert.equal(s.phase,'defeat');g.returnToCamp(s);g.launch(s);assert.equal(s.uniqueState.lastStand,false);
});
test('recovery needs uninterrupted quiet time and stops immediately when movement resumes',()=>{
 const s=arena('recovery');s.player.hp=50;advance(s,1.4);assert.equal(s.player.hp,50);advance(s,.5);assert.ok(s.player.hp>52);const hp=s.player.hp;advance(s,.2,{x:1,y:0});assert.equal(s.player.hp,hp);assert.equal(s.uniqueState.still,0);
});
test('momentum buffs exactly the next committed strike and is consumed even on a miss',()=>{
 const s=arena('momentum');g.dash(s,{x:1,y:0});s.player.action='idle';s.player.attackCooldown=0;const e=enemy(s);hit(s);const boosted=1000-e.hp;e.x=s.player.x+80;e.y=s.player.y;const hp=e.hp;hit(s);assert.ok(boosted>(hp-e.hp)*1.4);assert.equal(s.uniqueState.momentum,0);
 const miss=arena('momentum');g.dash(miss);miss.player.action='idle';g.attack(miss,{x:1,y:0});assert.equal(miss.uniqueState.momentum,0);assert.ok(miss.player.swing.momentum>0);
});
test('focus grants one resource refund per finisher regardless of target count',()=>{
 const s=arena('focus');enemy(s);enemy(s,85,20);s.skillRuntime.cooldowns.crescent=3;s.skillRuntime.cooldownKeys.push('crescent');s.player.action='idle';s.player.combo=2;s.player.comboWindow=.5;s.player.stamina=30;g.attack(s,{x:1,y:0});const impact=s.player.swing.impact;advance(s,impact);assert.ok(s.player.stamina<50&&s.player.stamina>45);assert.ok(Math.abs(s.skillRuntime.cooldowns.crescent-(3-.4-impact))<.03);
});
test('capacitor charges on skill casts and unequipping clears the owned charge',()=>{
 const s=arena('capacitor');s.run.flow='combat';enemy(s,60);for(let i=0;i<2;i++){s.player.action='idle';s.player.stamina=100;s.skillRuntime.casting=null;s.skillRuntime.cooldowns.crescent=0;assert.ok(g.useSkill(s,'crescent',{x:1,y:0}));}assert.equal(s.uniqueState.capacitor,2);s.paused=true;s.profile.inventory.push(gear('focus',2));g.equipItem(s,2);assert.equal(s.uniqueState.capacitor,0);
});
test('hunter refunds resources on a kill and limits simultaneous-kill gain',()=>{
 const s=arena('hunter');const a=enemy(s),b=enemy(s,85,10);a.hp=b.hp=1;s.player.stamina=0;s.player.dashCooldown=.65;g.attack(s,{x:1,y:0});advance(s,.11);assert.equal(s.run.kills,2);assert.ok(s.player.stamina>10&&s.player.stamina<13);assert.ok(s.player.dashCooldown<.1);
});
test('orbit owns three delayed ticks, freezes in pause and cannot recursively activate weapon chains',()=>{
 const s=arena('storm','orbit'),e=enemy(s);g.dash(s,{x:1,y:0});s.player.action='idle';advance(s,.41);assert.equal(e.hp,994);s.paused=true;const timer=s.uniqueState.orbit.timer;advance(s,20);assert.equal(s.uniqueState.orbit.timer,timer);s.paused=false;advance(s,.8);assert.equal(e.hp,982);assert.equal(s.uniqueState.orbit,null);assert.equal(s.effects.some(f=>f.type==='uniqueLink'),false);advance(s,2);assert.equal(e.hp,982);
});
test('magnet expands collection and grants a bounded equipment pickup pulse',()=>{
 const s=arena('magnet');assert.equal(g.playerStats(s.profile).collection,200);s.player.hp=50;s.player.stamina=0;const drop=gear('echo',20);s.profile.pendingLoot=[drop];s.pickups=[{id:99,kind:'equipment',x:s.player.x,y:s.player.y,item:drop,age:1,gold:0,xp:0,cores:0}];advance(s,.025);assert.equal(s.player.hp,55);assert.ok(s.player.stamina>8);assert.equal(s.profile.inventory.length,2);
});
test('fatal damage settles reserved gear without reviving the hunter through magnet pickup healing',()=>{
 const s=arena('magnet'),drop=gear('echo',20);s.profile.pendingLoot=[drop];s.pickups=[{id:99,kind:'equipment',x:s.player.x+300,y:s.player.y,item:drop,age:0}];s.player.hp=1;
 hurt(s,999);assert.equal(s.phase,'defeat');assert.equal(s.player.hp,0);assert.equal(s.profile.pendingLoot.length,0);assert.ok(s.profile.inventory.some(i=>i.id===20));assert.equal(s.run.items,1);
 const profile=g.encodeProfile(s.profile,1000);advance(s,2);assert.equal(s.player.hp,0);assert.equal(g.encodeProfile(s.profile,1000),profile);g.returnToCamp(s);assert.equal(s.profile.inventory.filter(i=>i.id===20).length,1);
});
test('captured sword and charm effects survive a pause swap without inheriting the new item effect',()=>{
 const s=arena('echo','focus'),far=enemy(s,240);enemy(s);s.player.combo=2;s.player.comboWindow=.5;g.attack(s,{x:1,y:0});s.paused=true;s.profile.inventory.push(gear('storm',3),gear('orbit',4));g.equipItem(s,3);g.equipItem(s,4);s.paused=false;advance(s,.25);assert.ok(far.hp<1000);assert.equal(s.player.swing.unique.definition.id,'echo');assert.equal(s.player.swing.charm.definition.id,'focus');assert.equal(s.loadout.weapon.definition.id,'storm');
});
test('proc kills pay once, result states freeze zones and return clears their lifetime',()=>{
 const s=arena('orbit'),e=enemy(s);e.hp=6;g.dash(s);s.player.action='idle';advance(s,.41);assert.equal(s.run.kills,1);const gold=s.profile.gold+s.profile.pendingGold+s.pickups.reduce((n,p)=>n+p.gold,0);advance(s,2);assert.equal(s.run.kills,1);assert.equal(s.profile.gold+s.profile.pendingGold+s.pickups.reduce((n,p)=>n+p.gold,0),gold);s.uniqueState.orbit={timer:.4,ticks:3};s.phase='victory';const cd=s.uniqueState.cooldowns.orbit;advance(s,5);assert.equal(s.uniqueState.orbit.timer,.4);assert.equal(s.uniqueState.cooldowns.orbit,cd);g.returnToCamp(s);assert.equal(s.uniqueState.orbit,null);assert.deepEqual(s.uniqueState.cooldowns,{});
});




test('stage transitions discard spatial buffs, keep earned charges and advance cooldown clocks',()=>{
 const s=arena('barrier','capacitor');g.dash(s);s.uniqueState.capacitor=2;s.uniqueState.orbit={spec:s.loadout.armor,x:s.player.x,y:s.player.y,timer:.3,ticks:3,damage:10};s.uniqueState.momentum=2;s.run.flow='combat';s.run.wave=3;s.run.waveKills=s.run.waveQuota;s.spawns=[];s.enemies=[];advance(s,.025);assert.equal(s.run.flow,'combat');assert.equal(s.run.stage,2);assert.equal(s.uniqueState.orbit,null);assert.equal(s.uniqueState.shield,0);assert.equal(s.uniqueState.momentum,0);assert.equal(s.uniqueState.capacitor,2);const before=s.uniqueState.cooldowns.barrier;advance(s,2.6);assert.equal(s.run.stage,2);assert.ok(s.uniqueState.cooldowns.barrier<before-2.4);assert.equal(s.uniqueState.orbit,null);
});
test('highest grades strengthen scalable control and range while free-heavy behavior stays bounded',()=>{
 const p=g.createProfile();p.inventory=[gear('frostWard',1,6),gear('whirlwind',2,6)];p.equipment.armor=1;p.equipment.weapon=2;const s=g.createGame(p);g.launch(s);freezeCombat(s);s.enemies=[];const e=enemy(s);hurt(s);assert.ok(e.chillRemaining>3.3);s.player.action='idle';s.player.attackCooldown=0;s.player.combo=2;s.player.comboWindow=.5;g.attack(s,{x:1,y:0});assert.ok(Math.abs(s.player.swing.range-1.12*(1+.18*1.36))<.00001);
});
test('연격의 호흡 and 스킬 축전기 act on equipped skills now that 파쇄 is gone (Alpha 0.121)',()=>{
 assert.match(UNIQUE_EFFECTS.focus.description,/장착 스킬 재사용 대기 0.4초 감소/);assert.equal(UNIQUE_EFFECTS.capacitor.name,'스킬 축전기');assert.doesNotMatch(UNIQUE_EFFECTS.focus.description+UNIQUE_EFFECTS.capacitor.description,/파쇄/);
 // focus: a landed 3연격 finisher trims every running skill cooldown.
 let s=arena('focus');enemy(s,60);s.skillRuntime.cooldowns.crescent=5;s.skillRuntime.cooldownKeys.push('crescent');hit(s,{finisher:true});
 assert.ok(Math.abs(s.skillRuntime.cooldowns.crescent-(5-.4-s.player.swing.impact))<.03,String(s.skillRuntime.cooldowns.crescent));
 // capacitor: two casts charge it, the third cast starts with a 40% shorter cooldown and empties the charge.
 s=arena('capacitor');s.run.flow='combat';enemy(s,60);const cast=()=>{const p=s.player;p.stamina=100;p.action='idle';s.skillRuntime.casting=null;s.skillRuntime.cooldowns.crescent=0;assert.ok(g.useSkill(s,'crescent',{x:1,y:0}));return s.skillRuntime.cooldowns.crescent;};
 const full=cast();assert.equal(s.uniqueState.capacitor,1);assert.equal(cast(),full);assert.equal(s.uniqueState.capacitor,2);
 assert.ok(Math.abs(cast()-full*.6)<1e-9);assert.equal(s.uniqueState.capacitor,0);
 // The removed 파쇄 no longer spends or uses the charge.
 s.uniqueState.capacitor=2;s.player.stamina=0;s.player.thunderCooldown=0;s.player.action='idle';s.skillRuntime.casting=null;assert.equal(g.thunder(s,{x:1,y:0}),false);assert.equal(s.uniqueState.capacitor,2);
});
