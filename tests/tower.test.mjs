import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {dungeonActors} from '../dist/dungeons.js';import {createBackup,readBackup} from '../dist/profile-backup.js';
function finish(s){s.enemies=[];s.spawns=[];s.barrels=[];s.run.wave=s.run.wave||1;const plan=g.towerPlan(s.run.stage);s.run.wave=plan.waves.length;s.run.waveQuota=s.run.waveKills=0;s.run.stageKills=s.run.stageQuota;g.advanceGame(s,.025);}
test('무한의 탑 floors: chapter curve, land of chapter ((F−1) mod 60)+1, elites every 5th and a boss every 10th floor',()=>{
 assert.equal(g.towerChapter(1),1);assert.equal(g.towerChapter(60),60);assert.equal(g.towerChapter(61),1);assert.equal(g.towerChapter(130),10);
 assert.deepEqual([1,5,10,15,20].map(g.towerFloorKind),['normal','elite','boss','elite','boss']);
 const a=g.towerPlan(60),b=g.towerPlan(120);assert.equal(a.hpScale,g.STAGES[59].hpScale);assert.ok(Math.abs(b.hpScale/a.hpScale-g.modeScale(60,2).hp)<1e-9,'120층 = 악몽 60장');
 assert.deepEqual(dungeonActors(g.towerPlan(10),1),[{type:'bulwark',boss:true,elite:false}]);assert.ok(dungeonActors(g.towerPlan(5),1).some(a=>a.elite));assert.equal(g.towerPlan(0),null);assert.equal(g.towerPlan(g.TOWER_MAX_FLOOR+1),null);
});
test('a floor opens after the one below; rewards come once, on the first clear; boss floors spawn the chapter boss',()=>{
 const s=g.createGame(g.createProfile(1000)),p=s.profile;assert.equal(g.dungeonLimit(p,'tower'),1);assert.equal(g.launchDungeon(s,'tower',2),false);
 assert.equal(g.launchDungeon(s,'tower',1),true);assert.equal(s.stageId,1);finish(s);assert.equal(p.tower.best,1);assert.equal(p.gold,250);assert.equal(s.run.dungeonReward.firstClear,true);
 g.returnToCamp(s);assert.equal(g.launchDungeon(s,'tower',1),true);finish(s);assert.equal(p.gold,250,'no second payout');assert.equal(s.run.dungeonReward.firstClear,false);
 p.tower.best=9;g.returnToCamp(s);assert.equal(g.launchDungeon(s,'tower',10),true);for(let n=0;n<80&&!s.enemies.some(e=>e.boss);n++)g.advanceGame(s,.05);const boss=s.enemies.find(e=>e.boss);assert.ok(boss);assert.equal(boss.species,g.STAGES[9].bossSpecies);
 const t=g.createGame(g.createProfile(1000));t.profile.tower.best=69;g.launchDungeon(t,'tower',70);assert.equal(t.stageId,10);
});
test('every tenth floor adds its permanent bonus; restore and backup keep the best floor; a lost floor pays nothing',()=>{
 assert.deepEqual(g.towerBonus(9),{damagePct:0,hpPct:0,crit:0,reduction:0});assert.deepEqual(g.towerBonus(10),{damagePct:.01,hpPct:0,crit:0,reduction:0});assert.deepEqual(g.towerBonus(85),{damagePct:.02,hpPct:.02,crit:.01,reduction:.01});
 const p=g.createProfile(1000),before=g.playerStats(p);p.tower={best:20};const after=g.playerStats(p);assert.ok(after.damage>before.damage&&after.maxHp>before.maxHp);
 assert.equal(readBackup(createBackup(p,1000),1000).profile.tower.best,20);const f=g.createProfile(1000);f.tower={best:-3};assert.equal(g.restoreProfile(f,1000).tower.best,0);f.tower={best:1e9};assert.equal(g.restoreProfile(f,1000).tower.best,g.TOWER_MAX_FLOOR);
 const s=g.createGame(g.createProfile(1000));g.launchDungeon(s,'tower',1);s.run.timeRemaining=0;g.advanceGame(s,.025);assert.equal(s.phase,'defeat');const r=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.equal(r.tower.best,0);assert.equal(r.gold,0);
});
