import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import * as g from '../dist/game-engine.js';import {rollItem} from '../dist/loot.js';import {createBackup,readBackup} from '../dist/profile-backup.js';
const rng=(seed=23)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function profile(){const p=g.createProfile(1000);p.level=30;const all=g.STAGES.length;p.clearedStage=all;p.unlockedStage=all;p.stageProgress=g.STAGES.map(()=>10);p.bossMastery=g.STAGES.map(()=>2);p.difficultyProgress=[g.STAGES.map(()=>10),g.STAGES.map(()=>10)];p.gold=100000;for(const m of g.MATERIALS)p.materials[m.id]=1000;return p;}
function gear(p,slot,id,rune){const item=rollItem({id,tier:1,slot,quality:0},rng(id));if(rune)item.inscription=rune;p.inventory.push(item);p.nextItemId=Math.max(p.nextItemId,id+1);return item;}
function arena(runes=[],stage=1,chapter=1,durable=false){const p=profile();runes.forEach((r,n)=>{const slot=g.EQUIPMENT_KEYS[n],i=gear(p,g.itemSlotForPosition(slot),n+1,r);p.equipment[slot]=i.id;});const s=g.createGame(p,{durable});assert.equal(g.launch(s,chapter,stage),true);s.spawns=[];s.barrels=[];s.enemies=[];s.run.waveQuota=s.run.waveKills=100000;s.player.invulnerable=999;return s;}
function actor(s,x=60,y=0,hp=1000,boss=false){const e={id:s.nextId++,type:'skitter',species:'forest_wolf',elite:false,boss,x:s.player.x+x,y:s.player.y+y,hp,maxHp:hp,action:'idle',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:28};s.enemies.push(e);return e;}
function shot(s,e,damage=1){s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage,ttl:1,friendly:true});g.advanceGame(s,.025);s.hitStop=0;}
function finishStage(s){s.enemies=[];s.spawns=[];s.barrels=[];s.run.wave=g.stageWaveCount(s.run.stage);s.run.waveQuota=s.run.waveKills=s.run.stageQuota=s.run.stageKills=0;s.run.flow='combat';g.advanceGame(s,.025);}

test('A baseline saves migrate without resetting identity, currencies, progression, enhancements or old skill presets',()=>{
 for(const name of ['legacy-v10.json','baseline-v11.json','reserved-v11.json']){const raw=JSON.parse(fs.readFileSync(new URL('../tools/reports/stage-b-baseline/'+name,import.meta.url)));const p=g.restoreProfile(raw,1000);assert.equal(p.version,15);assert.equal(p.savedBuilds.length,5);for(const i of raw.inventory){const actual=p.inventory.find(x=>x.id===i.id);assert.deepEqual(actual,i);}assert.equal(p.gold,raw.gold+(raw.pendingGold??0));assert.deepEqual(p.stageProgress.slice(0,raw.stageProgress.length),raw.stageProgress);assert.deepEqual(g.restoreProfile(g.encodeProfile(p,1000),1000),p);assert.deepEqual(readBackup(createBackup(p,1000),1000).profile,p);}
 const backup=readBackup(fs.readFileSync(new URL('../tools/reports/stage-b-baseline/qa-existing-v11-backup.json',import.meta.url),'utf8'));assert.equal(backup.profile.version,15);assert.equal(backup.profile.inventory.length,36);assert.equal(Object.values(backup.profile.equipment).filter(Boolean).length,9);
});
test('five unified presets share owned IDs and atomically swap skills, order, passives and awakening',()=>{
 const p=profile(),a=gear(p,'weapon',1,'chain'),b=gear(p,'helmet',2,'explosion'),s=g.createGame(p);g.equipItem(s,a.id);g.equipItem(s,b.id);p.skillBook.loadout.active=['gale','crescent'];p.skillBook.auto.mode='farm';p.skillBook.awakening='execution';
 for(let n=0;n<5;n++)assert.equal(g.saveBuild(s,n,''),true);assert.deepEqual(p.savedBuilds.map(x=>x.name),g.BUILD_NAMES);const count=p.inventory.length;
 p.skillBook.loadout.active=['crescent',null];p.skillBook.auto.mode='safe';p.skillBook.awakening='area';p.equipment.weapon=null;
 assert.equal(g.applyBuild(s,4).ok,true);assert.deepEqual(p.skillBook.loadout.active,['gale','crescent']);assert.equal(p.skillBook.auto.mode,'farm');assert.equal(p.skillBook.awakening,'execution');assert.equal(p.equipment.weapon,1);assert.equal(p.inventory.length,count);
 a.enhancement=1;assert.equal(p.savedBuilds.every(x=>x.equipment.weapon===a.id),true);assert.equal(g.applyBuild(s,2).ok,true);assert.equal(p.inventory[0].enhancement,1);const loaded=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(loaded.savedBuilds.length,5);assert.equal(loaded.selectedBuild,2);
});
test('missing references empty only those positions, warn, and reject duplicate identities without partial application',()=>{
 const p=profile(),a=gear(p,'weapon',1),b=gear(p,'earring',2),s=g.createGame(p);g.equipItem(s,1);g.equipItem(s,2,'earringLeft');g.saveBuild(s,0,'보스');p.inventory=p.inventory.filter(i=>i.id!==2);const result=g.applyBuild(s,0);assert.equal(result.ok,true);assert.equal(p.equipment.weapon,1);assert.equal(p.equipment.earringLeft,null);assert.equal(result.missing.length,1);assert.match(result.reason,/1개/);
 p.savedBuilds[1]={...p.savedBuilds[0],equipment:{...p.savedBuilds[0].equipment,earringRight:1}};const before=g.encodeProfile(p,1000);assert.equal(g.applyBuild(s,1).ok,false);assert.equal(g.encodeProfile(p,1000),before);assert.equal(g.launch(s,1,1),true);assert.equal(g.applyBuild(s,0).ok,false);assert.equal(g.saveBuild(s,0,'combat'),false);
});
test('inscription replaces exactly one optional effect, preserves innate identity/base/enhancement and charges atomically',()=>{
 const p=profile(),i=gear(p,'weapon',1),s=g.createGame(p);i.enhancement=2;i.enhancementAffixes={damage:1.2};const identity={id:i.id,affixes:structuredClone(i.affixes),bonus:structuredClone(i.enhancementAffixes),catalogId:i.catalogId};const gold=p.gold,iron=p.materials.boneIron;
 assert.equal(g.inscribeItem(s,1,'bleed').ok,true);assert.equal(p.gold,gold-1500);assert.equal(p.materials.boneIron,iron-12);assert.equal(i.inscription,'bleed');assert.deepEqual({id:i.id,affixes:i.affixes,bonus:i.enhancementAffixes,catalogId:i.catalogId},identity);
 p.gold=0;const before=g.encodeProfile(p,1000);assert.equal(g.inscribeItem(s,1,'leech').ok,false);assert.equal(g.inscribeItem(s,1,'malicious-script').ok,false);assert.equal(g.encodeProfile(p,1000),before);assert.equal(g.restoreProfile({...p,inventory:[{...i,inscription:'evil'}]},1000).inventory[0].inscription,undefined);
});
test('craft plus inscription checks combined costs before allocating or charging, and saved art stays the same',()=>{
 const p=profile(),s=g.createGame(p),recipe=g.CRAFTED_CATALOG[1];const gold=p.gold;const r=g.craftItem(s,recipe.id,'shred');assert.equal(r.ok,true);assert.equal(r.item.inscription,'shred');assert.equal(r.item.artId,recipe.artId);assert.equal(p.gold,gold-recipe.gold-1500);
 const other=g.CRAFTED_CATALOG[0];p.gold=other.gold+1499;const before=g.encodeProfile(p,1000);assert.equal(g.craftItem(s,other.id,'chain').ok,false);assert.equal(g.encodeProfile(p,1000),before);
});
test('new stage types preserve ten stages and difficulty, while failed special rewards and new refresh rewards are not owned',()=>{
 assert.deepEqual(g.BATTLE_PLANS.map(x=>x.stageType),['normal','normal','normal','special','normal','normal','normal','elite','special','boss']);
 const s=arena([],4),p=s.profile,before={gold:p.gold,items:p.inventory.length,materials:p.materials.boneIron};p.gold+=777;p.materials.boneIron+=9;gear(p,'helmet',p.nextItemId++,'fury');
 const restored=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(restored.gold,before.gold);assert.equal(restored.inventory.length,before.items);assert.equal(restored.materials.boneIron,before.materials);assert.match(restored.lastInterruptedBattle,/^b\d+:4$/);assert.equal(restored.activeBattle,null);assert.deepEqual(g.restoreProfile(g.encodeProfile(restored,1000),1000),restored);
 assert.equal(g.returnToCamp(s),true);assert.equal(p.gold,before.gold);assert.equal(p.inventory.length,before.items);assert.equal(p.materials.boneIron,before.materials);
 const normal=arena([],1);normal.profile.gold+=12;assert.equal(g.restoreProfile(g.encodeProfile(normal.profile,1000),1000).gold,100012);
});
test('durable stage settlement freezes until acknowledged, exposes candidate only to save, and commits exactly once',()=>{
 const s=arena([],4,1,true),p=s.profile;p.stageProgress=[3,0,0];p.clearedStage=0; // snapshot was complete; replace with a genuinely fresh launch below.
 const fresh=profile();fresh.clearedStage=0;fresh.unlockedStage=1;fresh.stageProgress=[3,0,0];fresh.bossMastery=[-1,-1,-1];const t=g.createGame(fresh,{durable:true});assert.equal(g.launch(t,1,4),true);finishStage(t);assert.ok(t.settlement);assert.equal(t.run.stage,4);assert.equal(fresh.stageProgress[0],3);const id=t.settlement.id,encoded=g.encodeProfile(fresh,1000);const saved=g.restoreProfile(encoded,1000);assert.equal(saved.stageProgress[0],4);assert.deepEqual(saved.settledBattleIds,[id]);assert.equal(saved.activeBattle,null);
 const clock=t.run.time;g.advanceGame(t,.1);assert.equal(t.run.time,clock);assert.equal(g.returnToCamp(t),false);assert.equal(g.confirmSettlement(t,'wrong'),false);assert.equal(g.confirmSettlement(t,id),true);assert.equal(fresh.stageProgress[0],4);assert.equal(g.confirmSettlement(t,id),false);g.advanceGame(t,.025);assert.equal(t.run.stage,5);assert.equal(fresh.settledBattleIds.filter(x=>x===id).length,1);
});
test('boss completion remains unpublished until one durable write, timeout never unlocks, and no replay of the settlement ID pays twice',()=>{
 const p=profile();p.clearedStage=0;p.unlockedStage=1;p.stageProgress=[9,0,0];p.bossMastery=[-1,-1,-1];const s=g.createGame(p,{durable:true});g.launch(s,1,10);s.spawns=[];s.enemies=[];s.barrels=[];s.run.bossSpawned=true;const boss=actor(s,60,0,1,true);shot(s,boss,10000);assert.ok(s.settlement);assert.equal(p.clearedStage,0);assert.equal(s.phase,'playing');const encoded=g.encodeProfile(p,1000),committed=g.restoreProfile(encoded,1000);assert.equal(committed.clearedStage,1);assert.equal(committed.unlockedStage,2);const id=s.settlement.id;g.confirmSettlement(s,id);assert.equal(s.phase,'victory');const once=g.encodeProfile(p,1000);g.confirmSettlement(s,id);for(let n=0;n<100;n++)g.advanceGame(s,.025);assert.equal(g.encodeProfile(p,1000),once);
 const failed=arena([],10,1,true);failed.run.timeRemaining=0;g.advanceGame(failed,.025);assert.equal(failed.phase,'defeat');assert.equal(failed.profile.activeBattle,null);
});
test('chain chooses nearby targets, caps at five, adds duplicate magnitude and never chains recursively',()=>{
 const s=arena(['chain','chain']),main=actor(s,80,0,10000);const others=Array.from({length:8},(_,i)=>actor(s,90+i*12,10,1000));shot(s,main);const hit=others.filter(e=>e.hp<e.maxHp);assert.equal(hit.length,5);assert.equal(hit.every(e=>e.maxHp-e.hp===Math.round(g.playerStats(s.profile).damage*.8)),true);assert.equal(s.run.maxProcsPerFrame,5);
});
test('explosion kills have depth one, fury refreshes and stops increasing after expiry',()=>{
 const s=arena(['explosion','fury']),main=actor(s,60,0,1),second=actor(s,200,0,1),third=actor(s,340,0,100);shot(s,main,100);assert.equal(main.dead,true);assert.equal(second.dead,true);assert.equal(third.hp,100);assert.ok(s.inscriptionState.furyUntil>s.run.time);assert.equal(s.inscriptionState.furyPower,.2);
});
test('bleed stacks and expires, shred caps at forty percent, leech caps at ten percent',()=>{
 const s=arena(['bleed','shred','shred','shred','leech','leech','leech','leech']),e=actor(s,60,0,100000);s.player.hp=100;s.player.lastDamage=100;for(let n=0;n<12;n++)shot(s,e,10);assert.equal(e.runeBleedStacks,10);assert.equal(e.runeShred,.4);assert.ok(Math.abs(s.player.hp-(100+(e.maxHp-e.hp)*.1))<1e-7);const hp=e.hp;s.projectiles=[];for(let n=0;n<122;n++)g.advanceGame(s,.025);assert.ok(e.hp<hp);assert.equal(e.runeBleedStacks,0);assert.match(g.buildEffectText('leech',4),/10%/);assert.match(g.buildEffectText('shred',3),/40%/);
});
test('all inscription damage shares a fifty-proc advance budget and bounded visual list under dense contact',()=>{
 const s=arena(['chain','explosion','bleed','fury','shred','leech']);for(let n=0;n<60;n++){const e=actor(s,70+(n%10)*8,Math.floor(n/10)*8,10000);s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1,ttl:1,friendly:true});}g.advanceGame(s,.1);assert.ok(s.run.maxProcsPerFrame<=50);assert.ok(s.run.procBudgetDropped>0);assert.ok(s.effects.length<=400);
});

test('three boss decisions are real: timed defense/weakness, regeneration, and bounded threshold summons',()=>{
 const defense=arena([],10,21);defense.run.bossSpawned=true;const a=actor(defense,80,0,10000,true);shot(defense,a,100);assert.equal(a.maxHp-a.hp,30);assert.match(g.bossRuleStatus(defense),/방어 태세/);defense.run.time=8;const hp=a.hp;shot(defense,a,100);assert.equal(hp-a.hp,150);assert.match(g.bossRuleStatus(defense),/약점 노출/);
 const regen=arena([],10,1);regen.run.bossSpawned=true;const b=actor(regen,80,0,2000,true);b.hp=1000;for(let i=0;i<321;i++)g.advanceGame(regen,.025);assert.equal(b.hp,1040);
 const summons=arena([],10,16);summons.run.bossSpawned=true;const c=actor(summons,80,0,1000,true);c.hp=650;g.advanceGame(summons,.025);assert.equal(c.summonPhase,1);assert.equal(summons.enemies.filter(e=>e.objective===false).length,3);c.hp=300;g.advanceGame(summons,.025);assert.equal(c.summonPhase,2);assert.equal(summons.enemies.filter(e=>e.objective===false).length,6);for(let i=0;i<20;i++)g.advanceGame(summons,.025);assert.equal(summons.enemies.filter(e=>e.objective===false).length,6);
});
test('a committed skill keeps its inscription snapshot after a paused ownership swap',()=>{
 const s=arena(['chain']),e=actor(s,95,0,10000),behind=actor(s,-90,0,10000),other=gear(s.profile,'weapon',20);assert.equal(g.useSkill(s,'crescent',{x:1,y:0,targetId:e.id}),true);s.paused=true;assert.equal(g.equipItem(s,other.id),true);assert.equal(s.buildEffects.chain,undefined);s.paused=false;for(let i=0;i<24;i++)g.advanceGame(s,.025);assert.ok(behind.hp<behind.maxHp);
});

test('defense weakening penetrates the boss defense stance, respects the cap and expires',()=>{
 const s=arena(["shred"],10,21);s.run.bossSpawned=true;const e=actor(s,80,0,10000,true);shot(s,e,100);assert.equal(e.maxHp-e.hp,30);let hp=e.hp;shot(s,e,100);assert.equal(hp-e.hp,55);assert.match(g.bossRuleStatus(s),/50%.*약화/);
 s.buildEffects=Object.freeze({shred:3});shot(s,e,100);hp=e.hp;shot(s,e,100);assert.equal(hp-e.hp,84);assert.equal(e.runeShred,.4);assert.match(g.bossRuleStatus(s),/30%/);
 s.buildEffects=Object.freeze({});for(let n=0;n<162;n++)g.advanceGame(s,.025);hp=e.hp;shot(s,e,100);assert.equal(hp-e.hp,30);assert.match(g.bossRuleStatus(s),/70%/);
 s.run.time=8;hp=e.hp;shot(s,e,100);assert.equal(hp-e.hp,150);assert.match(g.bossRuleStatus(s),/50% 증가/);
});
