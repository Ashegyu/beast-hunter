import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {regionAssetPlan} from '../dist/region-assets.js';
import * as L from '../dist/loot.js';
import manifest from '../dist/assets/manifest.json' with {type:'json'};

// Alpha 0.136 보스 러시 + 인장: seals come only from the rush, graded by effect kind, and grow on their own track.
const DAY=Date.UTC(2026,9,26,15);// 2026-10-27 00:00 KST
const now=DAY+5*36e5;
function profile(cleared=10){const p=g.createProfile(1000);p.unlockedStage=cleared+1;p.clearedStage=cleared;p.stageProgress=g.STAGES.map(c=>c.id<=cleared?10:0);p.level=60;return p;}
function rush({cleared=10,durable=false,scale={hp:1e-4,damage:0}}={}){const s=g.createGame(profile(cleared),{durable});assert.equal(g.launchBossRush(s,now),true);s.enemyScale=scale;return s;}
const run=(s,seconds,until=()=>false)=>{for(let t=0;t<seconds-1e-9&&!until();t+=.025)g.advanceGame(s,.025);};

test('seal grades are effect kinds: 하옵 survival stats, 중옵 attack stats, 상옵 special effects, 전용 character effects, drawn 65/27/6/2',()=>{
 assert.deepEqual(g.SEAL_GRADES.map(r=>r.chance),[.65,.27,.06,.02]);assert.ok(Math.abs(g.SEAL_GRADES.reduce((a,r)=>a+r.chance,0)-1)<1e-9);
 assert.equal(g.rollSealGrade(0),0);assert.equal(g.rollSealGrade(.6499),0);assert.equal(g.rollSealGrade(.65),1);assert.equal(g.rollSealGrade(.9199),1);assert.equal(g.rollSealGrade(.9201),2);assert.equal(g.rollSealGrade(.9799),2);assert.equal(g.rollSealGrade(.9801),3);assert.equal(g.rollSealGrade(.99999),3);
 for(const e of g.sealPool(0))assert.ok(Object.keys(e.stats).every(k=>['hpPct','reduction','speed','collection'].includes(k)),e.id);
 for(const e of g.sealPool(1))assert.ok(Object.keys(e.stats).every(k=>['damagePct','crit','attackSpeed','range'].includes(k)),e.id);
 for(const e of g.sealPool(2))assert.ok(e.power&&!e.stats,e.id);
 const ids=g.SEAL_EFFECTS.map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
 // 전용 (Alpha 0.136.2): each character's own special effects, only for that character's seals.
 const own=g.sealPool(3,'lirian');assert.equal(own.length,3);assert.ok(own.every(e=>e.character==='lirian'&&e.power));assert.equal(g.sealPool(3,'someone').length,0);assert.ok(g.sealPool(2,'someone').length===6);
 const exclusive=g.rollSeal({id:8},(()=>{const v=[.99,.5];return ()=>v.shift();})());assert.equal(exclusive.seal.grade,3);assert.equal(exclusive.rarity,4);assert.equal(exclusive.characterId,'lirian');assert.match(exclusive.name,/^리리안의 /);assert.ok(own.some(e=>e.id===exclusive.seal.effects[0]));
 // A character with no 전용 effects yet gets a 상옵 effect; growth never adds another character's effect.
 const fallback=g.rollSeal({id:9,characterId:'someone'},(()=>{const v=[.99,.5];return ()=>v.shift();})());assert.equal(fallback.seal.grade,2);
 const grown=g.makeSeal({id:10,effect:'lirian_parry'});for(let n=0;n<10;n++)g.growSeal(grown);assert.deepEqual(grown.seal.effects.map(id=>g.SEAL_EFFECT_BY_ID[id].grade),[3,1,2]);
 const restored=g.restoreProfile({...JSON.parse(g.encodeProfile(g.createProfile(1000),1000)),inventory:[{...grown,characterId:'someone'}]},1000).inventory[0];assert.equal(restored.characterId,'lirian');assert.deepEqual(restored.seal,grown.seal);
 // A seal is a Lilian 전용장비 with no base stats; its grade sets name, art and rarity colour.
 const seal=g.rollSeal({id:7,tier:2},(()=>{const v=[.95,.4];return ()=>v.shift();})());
 assert.equal(seal.slot,'special');assert.equal(seal.characterId,'lirian');assert.deepEqual(seal.affixes,{});assert.equal(seal.seal.grade,2);assert.equal(seal.artId,'seal_'+seal.seal.effects[0]);assert.equal(seal.seal.effects.length,1);assert.ok(g.SEAL_EFFECT_BY_ID[seal.seal.effects[0]].power);
});

test('worn seals add their stats and 상옵 powers ride the ancient trigger path',()=>{
 const p=profile(),s=g.createGame(p),base=g.playerStats(p);
 p.inventory.push(g.makeSeal({id:901,effect:'might'}),g.makeSeal({id:902,effect:'life'}),g.makeSeal({id:903,effect:'awakening'}));
 assert.equal(g.equipItem(s,901),true);assert.ok(Math.abs(g.playerStats(p).damage/base.damage-1.08)<1e-9);
 assert.equal(g.equipItem(s,902),true);assert.ok(Math.abs(g.playerStats(p).maxHp/base.maxHp-1.08)<1e-9);assert.equal(s.loadout.special,null);
 assert.equal(g.equipItem(s,903),true);assert.deepEqual(s.loadout.special.signatures.map(r=>r.id),['seal-awakening']);
 // 각성 고동 fires on its own in combat: timed fury and haste.
 g.launch(s,1,1);s.auto=true;s.enemyScale={hp:50,damage:0};run(s,11);
 assert.ok(s.uniqueState.ancientBuffs?.fury?.value>0);assert.ok(s.uniqueState.ancientBuffs?.haste?.value>0);
 // Strike triggers (3연격 마무리) reach seals too: 0.136.1 skipped them, so 적월 낙하 and 적월 검무 never fired.
 for(const effect of ['moonfall','lirian_crescent']){const q=profile(),t=g.createGame(q);q.inventory.push(g.makeSeal({id:904,effect}));assert.equal(g.equipItem(t,904),true);g.launch(t,1,1);t.auto=true;t.enemyScale={hp:50,damage:0};run(t,20);assert.ok(t.run.ancientProcs>0,effect);}
});

test('seal growth: +10% per level, a 중옵 effect at 5 and a 상옵 effect at 10, paid in 인장 조각 and gold',()=>{
 const p=profile(),s=g.createGame(p);p.inventory.push(g.makeSeal({id:911,effect:'guard'}));p.gold=1e6;p.materials.sealShard=0;
 assert.equal(g.sealGrowthStatus(p,911).ok,false);assert.equal(g.growSealItem(s,911).ok,false);
 p.materials.sealShard=g.SEAL_SHARD_COSTS.reduce((a,b)=>a+b,0);
 const item=p.inventory.find(i=>i.id===911);
 for(let n=1;n<=g.SEAL_MAX_LEVEL;n++){const r=g.growSealItem(s,911);assert.equal(r.ok,true);assert.equal(item.seal.level,n);assert.equal(item.seal.effects.length,n<5?1:n<10?2:3);if(n===5)assert.equal(r.added.grade,1);if(n===10)assert.equal(r.added.grade,2);}
 assert.equal(p.materials.sealShard,0);assert.equal(p.gold,1e6-g.SEAL_SHARD_COSTS.reduce((a,_,i)=>a+g.sealGoldCost(i),0));
 assert.deepEqual(g.sealStats(item).reduction,8);assert.equal(new Set(item.seal.effects).size,3);
 assert.equal(g.growSealItem(s,911).ok,false);assert.equal(g.sealGrowthStatus(p,911).reason,'최대 성장 10단계');
 // Growth is camp-only and never draws from the battle RNG streams.
 const rngs=[s.rng,s.lootRng,s.materialRng];p.inventory.push(g.makeSeal({id:912,effect:'tempo'}));p.materials.sealShard=99;g.growSealItem(s,912);assert.deepEqual([s.rng,s.lootRng,s.materialRng],rngs);
 // Saves keep level and effects (re-derived from the first effect and level, so tampering cannot add effects).
 const saved=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.deepEqual(saved.inventory.find(i=>i.id===911),item);
 const hostile=g.restoreProfile({...JSON.parse(g.encodeProfile(p,1000)),inventory:[{...item,seal:{...item.seal,level:99,effects:['moonfall','verdict','might','keen']}},{...item,id:913,seal:{effects:['nope'],level:1}}]},1000);
 const restored=hostile.inventory.find(i=>i.id===911);assert.equal(restored.seal.level,10);assert.equal(restored.seal.effects[0],'moonfall');assert.equal(restored.seal.grade,2);assert.equal(restored.seal.effects.length,3);assert.equal(hostile.inventory.some(i=>i.id===913),false);
});

test('seals skip the workshop and inscriptions, return shards when dismantled and survive a full bag',()=>{
 const p=profile(),s=g.createGame(p);p.inventory.push(g.makeSeal({id:921,effect:'keen'}));p.gold=1e6;for(const m of g.MATERIALS)p.materials[m.id]=999;
 for(const status of [g.enhancementStatus(p,921),g.promotionStatus(p,921),g.rerollStatus(p,921)]){assert.equal(status.ok,false);assert.match(status.reason,/보스 러시/);}
 assert.equal(g.inscribeItem(s,921,g.BUILD_EFFECT_IDS[0]).ok,false);assert.match(g.equipmentAcquisition(p.inventory.at(-1)),/보스 러시/);
 p.materials.sealShard=0;const r=g.bulkSalvage(s,[921]);assert.equal(r.ok,true);assert.equal(r.shards,5);assert.equal(p.materials.sealShard,5);
 // A full bag discards its weakest unprotected piece, never a seal (incoming or owned).
 const full=profile(),seal=g.makeSeal({id:931,effect:'life'});full.inventory=[seal,...Array.from({length:g.INVENTORY_LIMIT-1},(_,n)=>({id:1000+n,slot:'weapon',tier:1,rarity:0,name:'검',affixes:{damage:1}}))];
 const incoming=g.makeSeal({id:932,effect:'life'});const stored=L.storeItem(full,incoming);assert.equal(stored.kept,true);assert.ok(full.inventory.some(i=>i.id===931)&&full.inventory.some(i=>i.id===932));
});

test('seals no longer come from dungeons, boss or raid ancients or the forge',()=>{
 let x=7;const rng=()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};
 for(let n=0;n<400;n++)assert.notEqual(L.rollAccessory({id:n+1,tier:1+n%6,grade:n%3},rng).slot,'special');
 for(let n=0;n<200;n++){for(const tier of [1,2,3,4,5,6])assert.notEqual(L.rollAncient({id:n+1,tier,slot:null},rng()).slot,'special');for(const r of g.RAIDS)assert.notEqual(L.rollAncient({id:n+1,tier:6,raid:r.id},rng()).slot,'special');}
 const p=profile(60);for(const m of g.MATERIALS)p.materials[m.id]=999;p.gold=1e7;assert.equal(g.craftStatus(p,'crafted-special').ok,false);assert.ok(!g.FORGE_SLOTS.includes('special'));const sealAncient=L.rollAncient({id:9,tier:1,slot:'special'},.1);assert.equal(g.forgeTarget(sealAncient),null,'seals can never be forged');
});

test('boss rush opens after chapter 10 with three entries a day, spent at entry',()=>{
 assert.equal(g.launchBossRush(g.createGame(profile(9)),now),false);
 const p=profile(),s=g.createGame(p,{durable:true});
 for(let n=0;n<g.RUSH_DAILY_ENTRIES;n++){assert.equal(g.rushEntriesLeft(p,now),3-n);assert.equal(g.launchBossRush(s,now),true);assert.equal(g.returnToCamp(s),true);}
 assert.equal(g.rushEntriesLeft(p,now),0);assert.equal(g.launchBossRush(s,now),false);
 const saved=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(saved.bossRush.entries,3);assert.equal(g.rushEntriesLeft(saved,DAY+864e5-1),0);assert.equal(g.rushEntriesLeft(saved,DAY+864e5),3);assert.equal(g.nextRushReset(now),DAY+864e5);
 const hostile=g.restoreProfile({...JSON.parse(g.encodeProfile(p,1000)),bossRush:{day:'x',entries:99,clears:-3,best:9}},1000);assert.deepEqual(hostile.bossRush,{day:-1,entries:3,clears:0,best:5});
 assert.deepEqual(g.restoreProfile(null,1000).bossRush,g.emptyRushProgress());
});

test('five bosses of the last five cleared chapters, ramping in health, each with its own region rule',()=>{
 assert.deepEqual(g.rushLineup(10),[6,7,8,9,10]);assert.deepEqual(g.rushLineup(37),[33,34,35,36,37]);
 const s=rush({cleared:37,scale:{hp:1,damage:0}}),seen=[];assert.equal(s.stageId,37);assert.equal(s.run.timeLimit,g.RUSH_TIME_LIMIT);assert.equal(s.run.gate,null);assert.equal(s.run.rule.type,'rush');
 for(let wave=1;wave<=g.RUSH_BOSSES;wave++){
  run(s,3,()=>s.enemies.some(e=>e.boss&&!e.dead&&e.wave===wave));const e=s.enemies.find(q=>q.boss&&!q.dead&&q.wave===wave),c=s.run.rushLineup[wave-1];
  assert.equal(e.species,g.STAGES[c-1].bossSpecies);assert.equal(e.maxHp,Math.round(g.STAGES[36].bossHp*g.RUSH_HP[wave-1]*g.rushScale(37)));seen.push(e.species);
  s.player.invulnerable=99;e.hp=1;s.player.x=e.x-120;s.player.y=e.y;run(s,4,()=>e.dead);assert.ok(e.dead,'wave '+wave);
 }
 assert.equal(new Set(seen).size,5);
 // Assets: the rush region of chapter 37 loads the other four bosses too.
 const region=g.RUSH_REGIONS[36];assert.equal(region.id,g.rushRegionId(37));assert.deepEqual([...region.extraSpecies],[33,34,35,36].map(c=>g.STAGES[c-1].bossSpecies));
 const plan=regionAssetPlan(manifest,[...g.STAGES,...g.RAID_REGIONS,...g.RUSH_REGIONS]);for(const species of region.extraSpecies)assert.ok([...plan.regions.get(region.id).clips].some(c=>c.actor===species||c.image.includes(species)),species);
});

test('a full clear pays shards, gold and a certain seal; it saves through settlement',()=>{
 const s=rush({durable:true});s.auto=true;run(s,120,()=>!!s.settlement);
 assert.equal(s.run.rushKills,5);assert.ok(s.settlement.rush);const reward=g.rushRewards(5,10),item=s.run.dungeonReward.item;
 assert.equal(s.run.dungeonReward.gold,reward.gold);assert.deepEqual(s.run.dungeonReward.materials,{sealShard:12});assert.equal(s.run.materialLedger.sealShard,12);
 assert.ok(g.isSeal(item));assert.ok(s.profile.inventory.some(i=>i.id===item.id));
 assert.equal(g.confirmSettlement(s,s.settlement.id),true);assert.equal(s.phase,'victory');assert.equal(s.profile.bossRush.clears,1);assert.equal(s.profile.bossRush.best,5);
 const saved=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.deepEqual(saved.inventory.find(i=>i.id===item.id),item);assert.equal(saved.materials.sealShard,12);
});

test('falling or running out of time after a kill settles the bosses felled; no kill pays nothing',()=>{
 // Two bosses, then an unbeatable third: the fall settles two kills (the next boss arrives the moment one falls,
 // so the scale changes after the first kill, while the tiny second boss is already up).
 const s=rush();s.auto=true;run(s,60,()=>s.run.rushKills>=1);s.enemyScale={hp:1e4,damage:1e4};s.lootRates={};run(s,60,()=>s.phase!=='playing'||!!s.settlement);
 assert.equal(s.run.rushKills,2);assert.equal(s.run.rushEnd,'fallen');assert.equal(s.phase,'victory');assert.deepEqual(s.run.dungeonReward.materials,{sealShard:4});assert.equal(s.run.dungeonReward.gold,g.rushRewards(2,10).gold);assert.equal(s.profile.bossRush.best,2);assert.equal(s.profile.bossRush.clears,0);
 // Two bosses, then one that cannot be hurt: the clock settles two kills.
 const t=rush();t.auto=true;run(t,60,()=>t.run.rushKills>=1);t.enemyScale={hp:1e6,damage:0};run(t,g.RUSH_TIME_LIMIT+5,()=>t.phase!=='playing');
 assert.equal(t.run.rushKills,2);assert.equal(t.run.rushEnd,'timeout');assert.equal(t.phase,'victory');assert.deepEqual(t.run.dungeonReward.materials,{sealShard:4});
 // No boss felled: a plain defeat, the entry stays spent and nothing is paid.
 const u=rush({durable:true,scale:{hp:1e4,damage:1e4}});u.auto=true;const shards=u.profile.materials.sealShard;run(u,60,()=>u.phase!=='playing');
 assert.equal(u.phase,'defeat');assert.equal(u.run.rushKills,0);assert.equal(u.profile.materials.sealShard,shards);assert.equal(u.profile.bossRush.entries,1);
});
