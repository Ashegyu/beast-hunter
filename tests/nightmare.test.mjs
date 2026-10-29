import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {rollAncient,ancientSignatures,itemRollRanges} from '../dist/loot.js?v=0.142.1';
import {FORGE_AWAKEN_POWER,awakenCost,rollMaterials} from '../dist/crafting.js?v=0.142.1';import {RIFT_MUTATORS,riftMutators,riftChapter,riftDepthKind,riftRewards,riftLimit,riftPlan} from '../dist/dungeons.js?v=0.142.1';
import {openMode} from './mode-fixture.mjs';
// Alpha 0.142 악몽 콘텐츠: 악몽 결정, 승화 각성, 심연의 균열, 악몽 레이드 '악몽의 군주', 초월 확장.
const MONDAY=Date.UTC(2026,9,25,15),now=MONDAY+3*864e5;
// `nightmare` chapters beaten on 악몽 (0 = 악몽 just opened: every chapter beaten on 정예).
function nightmareGame(nightmare=60){const p=g.createProfile(1000);p.level=150;openMode(g,p,2,nightmare+1);p.gold=1e6;for(const m of g.MATERIALS)p.materials[m.id]=1000;const s=g.createGame(p);s.phase='camp';return s;}
function forged(s,{tier=6,slot='weapon',hunt}={}){const id=Math.max(1,...s.profile.inventory.map(i=>i.id+1));const a=rollAncient({id,tier,slot,...(hunt?{hunt}:{})},.3,()=>.5);s.profile.inventory.push(a);s.profile.nextItemId=id+1;
 const r=g.forgeAncient(s,a.id,g.FORGE_EFFECTS[slot][0].id);assert.equal(r.ok,true,r.reason);return s.profile.inventory.find(i=>i.id===a.id);}
const advance=(s,t)=>{for(let x=0;x<t-1e-9;x+=.025)g.advanceGame(s,.025);};

test('악몽 결정: a new material, only from 악몽 chapter bosses, the rift and the 악몽 raid',()=>{
 const row=g.MATERIAL_BY_ID.nightmareShard;assert.ok(row);assert.equal(row.normal+row.elite+row.boss,0);
 for(const tier of [1,3,6])for(const boss of [false,true])assert.ok(!rollMaterials({tier,boss},()=>0,()=>0,()=>0).some(d=>d.id==='nightmareShard'));
 const fresh=g.restoreProfile(g.createProfile(1000),1000);assert.equal(fresh.materials.nightmareShard,0);
});

test('승화 각성 opens with 악몽, needs the region 악몽 boss, adds a second different effect and ×1.15 stats once',()=>{
 const elite=nightmareGame(0),item=forged(elite),other=g.FORGE_EFFECTS.weapon[1].id;
 assert.equal(g.awakenStatus(elite.profile,item.id,other).ok,false);assert.match(g.awakenStatus(elite.profile,item.id,other).reason,/악몽 60장/);
 const closed=nightmareGame(0);closed.profile.bossMastery[5]=0;const c=forged(closed,{tier:1});assert.match(g.awakenStatus(closed.profile,c.id,other).reason,/악몽 개방|정예 60장/);
 const s=nightmareGame(),a=forged(s,{hunt:2}),before=structuredClone(s.profile),cost=awakenCost(6,false);
 assert.match(g.awakenStatus(s.profile,a.id,a.forge.effect).reason,/다른 승화 효과/);
 const st=g.awakenStatus(s.profile,a.id,other);assert.equal(st.ok,true,st.reason);assert.deepEqual(st.cost,cost);assert.ok(cost.materials.nightmareShard>0);
 const r=g.awakenForge(s,a.id,other);assert.equal(r.ok,true);const made=s.profile.inventory.find(i=>i.id===a.id);
 assert.deepEqual(made.forge,{...a.forge,awaken:other});assert.equal(made.rarity,6);assert.equal(made.hunt,2);assert.equal(s.profile.gold,before.gold-cost.gold);
 for(const [k,n]of Object.entries(cost.materials))assert.equal(s.profile.materials[k],before.materials[k]-n);
 const ranges=itemRollRanges(made);for(const [k,v]of Object.entries(a.affixes)){assert.equal(made.affixes[k],Math.max(ranges[k].min,Math.min(ranges[k].max,Math.round(v*FORGE_AWAKEN_POWER))),k);assert.ok(made.affixes[k]>=v);}
 const names=ancientSignatures(made).map(x=>x.id);assert.equal(new Set(names).size,names.length);assert.ok(names.some(id=>/-awaken$/.test(id)));
 const again=JSON.stringify(s);assert.equal(g.awakenForge(s,a.id,g.FORGE_EFFECTS.weapon[2].id).ok,false,'awakened once');assert.equal(JSON.stringify(s),again);
 const saved=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.deepEqual(saved.inventory.find(i=>i.id===a.id),made);
 // Gold, a material, the camp and a pending reroll each refuse without touching the profile.
 for(const mutate of [x=>x.profile.gold=0,x=>x.profile.materials.nightmareShard=0,x=>x.phase='playing',(x,i)=>i.rerollCandidate={affixes:{...i.affixes}}]){const t=nightmareGame(),i=forged(t);mutate(t,i);const b=JSON.stringify(t);assert.equal(g.awakenForge(t,i.id,other).ok,false);assert.equal(JSON.stringify(t),b);}
 // A hostile save cannot keep an awaken equal to its first effect.
 const bad=structuredClone(s.profile);bad.inventory.find(i=>i.id===a.id).forge.awaken=a.forge.effect;assert.equal(g.restoreProfile(bad,1000).inventory.find(i=>i.id===a.id).forge.awaken,undefined);
});

// The killBoss pattern of beast-techniques.test.mjs: a lone stage-10 boss felled by a friendly projectile.
function killBoss(chapter,difficulty){const p=g.createProfile(1000);p.level=150;openMode(g,p,2,60);p.difficultyProgress=[1,2].map(()=>g.STAGES.map(()=>10));const s=g.createGame(p);assert.equal(g.launch(s,chapter,10,null,difficulty),true);s.spawns=[];s.barrels=[];s.run.bossSpawned=true;s.player.invulnerable=999;
 const e={id:s.nextId++,species:g.STAGES[chapter-1].bossSpecies,type:'bulwark',elite:false,boss:true,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];
 s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);assert.ok(e.dead);return s;}
test('악몽 chapter bosses drop 1 + chapter/20 악몽 결정; 정예 bosses none',()=>{
 for(const [chapter,difficulty,expected]of [[30,1,0],[30,2,2],[5,2,1],[59,2,3]]){const s=killBoss(chapter,difficulty);assert.equal(s.profile.materials.nightmareShard+(s.profile.pendingMaterials.nightmareShard??0),expected,chapter+'/'+difficulty);}
});

test('심연의 균열: weekly mutators, depth chapters, rewards, opens with 악몽 and keeps the week\'s best',()=>{
 assert.equal(RIFT_MUTATORS.length,6);for(let w=0;w<40;w++){const m=riftMutators(w);assert.equal(m.length,2);assert.notEqual(m[0].id,m[1].id);}
 assert.notDeepEqual(riftMutators(0).map(m=>m.id),riftMutators(1).map(m=>m.id));
 assert.deepEqual([1,10,11,25].map(riftChapter),[51,60,51,55]);assert.deepEqual([4,5,10].map(riftDepthKind),['normal','boss','boss']);
 assert.deepEqual(riftRewards(1),{gold:1150,materials:{nightmareShard:2}});assert.deepEqual(riftRewards(10),{gold:2500,materials:{nightmareShard:4}});assert.equal(riftRewards(0),null);
 assert.ok(riftPlan(20,3).hpScale>riftPlan(10,3).hpScale);for(let w=0;w<6;w++){const p=riftPlan(5,w);assert.equal(p.floorKind,'boss');if(p.mutators.some(m=>m.id==='haste'))assert.equal(p.timeLimit,45);else assert.equal(p.timeLimit,60);}
 const week=g.raidWeek(now),closed=nightmareGame(0);closed.profile.bossMastery[59]=0;assert.equal(g.launchDungeon(closed,'rift',1,null,now),false);
 const s=nightmareGame(0);assert.equal(riftLimit(s.profile,week),1);assert.equal(g.launchDungeon(s,'rift',2,null,now),false);assert.equal(g.launchDungeon(s,'rift',1,null,now),true);
 assert.equal(s.run.dungeonId,'rift');assert.equal(s.stageId,51);assert.equal(s.run.dungeonWeek,week);
 const shards=s.profile.materials.nightmareShard,gold=s.profile.gold;
 s.enemies=[];s.spawns=[];s.barrels=[];s.run.wave=riftPlan(1,week).waves.length;s.run.waveQuota=s.run.waveKills=0;s.run.stageKills=s.run.stageQuota;g.advanceGame(s,.025);
 assert.equal(s.phase,'victory','rift cleared');assert.equal(s.run.dungeonReward.firstClear,true);assert.equal(s.profile.rift.best,1);assert.equal(s.profile.rift.week,week);
 assert.equal(s.profile.materials.nightmareShard,shards+2);assert.equal(s.profile.gold,gold+1150);assert.equal(riftLimit(s.profile,week),2);
 // A new week starts from depth 1 again but keeps the all-time record.
 assert.equal(riftLimit(s.profile,week+1),1);const saved=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.deepEqual(saved.rift,{week,best:1,allBest:1});
 const hostile=g.restoreProfile({...JSON.parse(g.encodeProfile(s.profile,1000)),rift:{week:'x',best:5e6,allBest:-3}},1000).rift;assert.ok(hostile.best<=999&&hostile.allBest>=hostile.best&&hostile.week===-1);
});

test('악몽의 군주: opens with 악몽, always fought on 악몽, shields itself with a brood and pays 악몽 결정',()=>{
 const r=g.raidDefinition('sovereign');assert.ok(r.nightmare);assert.equal(r.fixedTier,2);assert.equal(g.raidFightTier('sovereign',0),2);assert.equal(g.raidFightTier('colossus',1),1);
 const own=g.ANCIENT_CATALOG.filter(a=>a.raid==='sovereign');assert.deepEqual(own.map(a=>a.slot),['weapon','helmet','armor','charm','earring']);
 const elite=nightmareGame(0);elite.profile.bossMastery[0]=0;assert.equal(g.raidUnlocked(elite.profile,'sovereign'),false);assert.equal(g.launchRaid(elite,'sovereign',now),false);
 const s=nightmareGame(0);s.profile.skillBook=g.restoreSkillBook(null,150);assert.equal(g.raidUnlocked(s.profile,'sovereign'),true);assert.equal(g.launchRaid(s,'sovereign',now,null,0),true);assert.equal(s.run.raidTier,2);
 s.auto=false;s.player.invulnerable=999;let boss=null;for(let i=0;i<200&&!(boss=s.enemies.find(e=>e.boss));i++)g.advanceGame(s,.025);assert.equal(boss.species,'raid_nightmare');
 assert.match(g.bossRuleStatus(s),/./);advance(s,r.broodEvery+.3);const brood=s.enemies.filter(q=>q.raidBrood&&!q.dead);assert.ok(brood.length>=r.broodSize,'brood '+brood.length);
 // Felling it settles the raid with 악몽 결정 (4 × (1 + 악몽 tier)) and one of its own ancients.
 for(const q of brood)q.dead=true;s.lootRates={raid:1};boss.hp=1;s.projectiles.push({id:s.nextId++,x:boss.x,y:boss.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});advance(s,.6);
 assert.ok(boss.dead);assert.equal(s.run.dungeonReward.materials.nightmareShard,12);const item=s.run.dungeonReward.item;assert.ok(item&&/^ancient-raid-sovereign-/.test(item.catalogId));
});

test('초월 확장: each chapter beaten on 악몽 adds a point; 수호·질풍 open with 악몽 and raise reduction and attack speed',()=>{
 const p=g.createProfile(1000);p.level=g.MAX_LEVEL;openMode(g,p,2,21);assert.equal(g.nightmareChapters(p),20);assert.equal(g.nightmareOpen(p),true);assert.equal(g.transcendPointsTotal(p),20);
 const s=g.createGame(p);const before=g.playerStats(p);assert.equal(g.trainTranscend(s,'aegis'),true);assert.equal(g.trainTranscend(s,'swift'),true);
 const bonus=g.transcendBonus(p);assert.ok(bonus.reduction>0&&bonus.attackSpeed>0);const after=g.playerStats(p);assert.ok(after.reduction>before.reduction);
 const low=g.createProfile(1000);low.level=g.MAX_LEVEL;low.transcendXp=1e7;assert.equal(g.nightmareOpen(low),false);assert.equal(g.transcendStatus(low,'aegis'),'악몽 개방 후');assert.equal(g.trainTranscend(g.createGame(low),'aegis'),false);
 const saved=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(saved.transcendence.aegis,1);assert.equal(saved.transcendence.swift,1);
});
