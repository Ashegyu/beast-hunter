import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';

// Alpha 0.132 스테이지 별: ★ 클리어 · ★ 30초 안 · ★ 체력 50% 이상, best result kept; chapter chests at 10/20/30 stars.
const clearStage=(s,{time=40,hp=1}={})=>{s.run.timeRemaining=s.run.timeLimit-time;s.run.lowestHp=hp;s.enemies=[];s.spawns.length=0;s.run.wave=g.stageWaveCount(s.run.stage);s.run.waveKills=s.run.waveQuota=1;s.run.flow='combat';g.advanceGame(s,.025);};

test('star masks: clear, half the time limit, a third of it (bosses: half health); each on its own',()=>{
 assert.equal(g.starsFor({stage:3,timeLimit:60,timeRemaining:41,lowestHp:.1}),7);assert.equal(g.starsFor({stage:3,timeLimit:60,timeRemaining:35,lowestHp:1}),3);assert.equal(g.starsFor({stage:9,timeLimit:60,timeRemaining:10,lowestHp:1}),1);
 assert.equal(g.starsFor({timeLimit:60,timeRemaining:20,lowestHp:.1}),1);
 assert.equal(g.starsFor({timeLimit:60,timeRemaining:30,lowestHp:.1}),3);
 assert.equal(g.starsFor({timeLimit:60,timeRemaining:10,lowestHp:.5}),5);
 assert.equal(g.starsFor({timeLimit:60,timeRemaining:45,lowestHp:1}),7);
 const p=g.createProfile(1000);assert.equal(p.stageStars.length,g.STAGES.length);
 assert.deepEqual(g.awardStars(p,3,7,5),{mask:5,earned:5,gained:2});assert.deepEqual(g.awardStars(p,3,7,3),{mask:7,earned:3,gained:1});assert.deepEqual(g.awardStars(p,3,7,1),{mask:7,earned:1,gained:0});
 g.awardStars(p,3,10,7);g.awardStars(p,3,1,1);assert.equal(g.stageStarMask(p,3,10),7);assert.equal(g.stageStarMask(p,3,1),1);assert.equal(g.stageStarMask(p,3,2),0);assert.equal(g.chapterStars(p,3),7);assert.equal(g.totalStars(p),7);
});

test('a stage clear records stars from the time used; the boss from time and the lowest health of the stage',()=>{
 const p=g.createProfile(1000);p.level=60;const s=g.createGame(p);g.launch(s,1);
 clearStage(s,{time:25,hp:.3});assert.equal(s.run.stage,2);assert.equal(g.stageStarMask(p,1,1),3);
 const banner=s.effects.find(f=>f.type==='stageClear');assert.equal(banner.stars,3);assert.equal(banner.gained,2);
 clearStage(s,{time:15,hp:.1});assert.equal(g.stageStarMask(p,1,2),7);
 // The boss: kill it with fast time and full health.
 const q=g.createProfile(1000);q.level=60;q.stageProgress[0]=9;const b=g.createGame(q);assert.ok(g.launch(b,1,10));b.enemies=[];b.barrels=[];b.run.flow='combat';b.run.wave=1;b.run.waveQuota=1e6;b.run.waveKills=0;b.run.bossSpawned=true;b.spawns=[{id:b.nextId++,type:'bulwark',boss:true,elite:false,x:b.player.x+80,y:b.player.y,delay:0,warning:1}];g.advanceGame(b,.001);
 const boss=b.enemies.find(e=>e.boss);boss.hp=1;boss.action='idle';boss.cooldown=999;b.player.invulnerable=999;b.run.timeRemaining=b.run.timeLimit-20;b.player.hp=b.player.maxHp;g.attack(b,{x:1,y:0});for(let i=0;i<6;i++)g.advanceGame(b,.025);
 assert.equal(b.phase,'victory');assert.equal(g.stageStarMask(q,1,10),7);assert.equal(b.run.stars.earned,7);
 // Dungeons give no stars.
 const d=g.createGame(p);assert.ok(g.launchDungeon(d,'gold',1));clearStage(d,{time:10});assert.equal(g.totalStars(p),5);
});

test('stars are published with the stage settlement and survive saves',()=>{
 const p=g.createProfile(1000);p.level=60;p.unlockedStage=1;p.stageProgress[0]=3;const s=g.createGame(p,{durable:true});g.launch(s,1,4);
 clearStage(s,{time:19,hp:1});assert.equal(s.settlement?.boss,false);assert.equal(g.stageStarMask(p,1,4),0,'acknowledgement first');
 assert.equal(g.stageStarMask(g.restoreProfile(g.encodeProfile(p,1000),1000),1,4),7,'the save being acknowledged carries the stars');
 assert.ok(g.confirmSettlement(s,s.settlement.id));assert.equal(g.stageStarMask(p,1,4),7);
 const r=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(g.stageStarMask(r,1,4),7);assert.equal(g.chapterStars(r,1),3);
});

test('restore: legacy saves get ★1 on cleared stages, hostile stars and chests are trimmed',()=>{
 const p=g.createProfile(1000);p.clearedStage=2;p.unlockedStage=3;p.stageProgress=p.stageProgress.map((_,i)=>i<2?10:i===2?4:0);
 const raw=JSON.parse(g.encodeProfile(p,1000));delete raw.stageStars;delete raw.starChests;
 const legacy=g.restoreProfile(raw,1000);assert.equal(g.chapterStars(legacy,1),10);assert.equal(g.chapterStars(legacy,2),10);assert.equal(g.chapterStars(legacy,3),4);assert.equal(g.chapterStars(legacy,4),0);
 // Stars on uncleared stages vanish, partial masks gain ★1, chests without their stars are dropped.
 const hostile=g.restoreProfile({...raw,stageStars:[0x3fffffff,6,-1,0x3fffffff,'x'],starChests:[7,7,7,7]},1000);
 assert.equal(g.chapterStars(hostile,1),30);assert.equal(g.stageStarMask(hostile,2,1),7);assert.equal(g.chapterStars(hostile,2),3);assert.equal(g.chapterStars(hostile,3),0);assert.equal(g.chapterStars(hostile,4),0);
 assert.deepEqual(hostile.starChests.slice(0,4),[7,0,0,0]);assert.equal(g.bonusGrowthPoints(hostile),1);
});

test('chapter chests: 10·20·30 stars, camp only, once each; the 30-star chest gives a 성장 포인트',()=>{
 const p=g.createProfile(1000);p.level=40;p.clearedStage=12;p.unlockedStage=13;const s=g.createGame(p);
 for(let n=1;n<=10;n++)g.awardStars(p,12,n,n<=5?7:1);assert.equal(g.chapterStars(p,12),20);
 assert.equal(g.chestStatus(p,12,3),'별 20/30');assert.equal(g.claimStarChest(s,12,3),null);
 const before={gold:p.gold,cores:p.cores,pages:p.materials.skillPage,stone:p.materials.refineStone};
 const one=g.claimStarChest(s,12,1);assert.ok(one);assert.equal(p.gold-before.gold,one.gold);assert.equal(p.cores-before.cores,one.cores);assert.equal(p.materials.refineStone-before.stone,one.materials.refineStone);
 assert.equal(g.claimStarChest(s,12,1),null);assert.equal(g.chestStatus(p,12,1),'수령 완료');
 const two=g.claimStarChest(s,12,2);assert.ok(two.materials.skillPage>0);assert.equal(p.materials.skillPage-before.pages,two.materials.skillPage);
 // Later chapters pay more.
 assert.ok(g.starChestReward(50,1,g.STAGES[49].multiplier).gold>g.starChestReward(1,1,g.STAGES[0].multiplier).gold*5);
 const points=g.growthPoints(p);for(let n=6;n<=10;n++)g.awardStars(p,12,n,7);g.launch(s,12);assert.equal(g.claimStarChest(s,12,3),null);g.returnToCamp(s);
 const three=g.claimStarChest(s,12,3);assert.equal(three.growthPoints,1);assert.equal(g.growthPoints(p),points+1);assert.equal(g.growthPointsTotal(p),p.level);
 // The bonus point survives a save: training that spends it is kept.
 for(const id of g.TRAINING_IDS)while(g.trainStat(s,id)){}assert.equal(g.growthPoints(p),0);
 const r=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(r.starChests[11],7);assert.equal(g.trainingSpent(r),g.trainingSpent(p));assert.equal(g.growthPoints(r),0);
});
