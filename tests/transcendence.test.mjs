import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {createBackup,readBackup} from '../dist/profile-backup.js';
const capped=()=>{const p=g.createProfile(1000);p.level=g.MAX_LEVEL;p.xp=0;return p;};
test('초월 levels: 5,000 + 250×T per level, computed from the stored total',()=>{
 assert.equal(g.transcendLevel(0),0);assert.equal(g.transcendLevel(4999),0);assert.equal(g.transcendLevel(5000),1);assert.equal(g.transcendLevel(5000+5249),1);assert.equal(g.transcendLevel(5000+5250),2);
 let total=0;for(let t=0;t<400;t++){assert.equal(g.transcendLevel(total),t);assert.equal(g.transcendLevel(total+g.transcendNeeded(t)-1),t);total+=g.transcendNeeded(t);}
 assert.deepEqual(g.transcendProgress(5000+100),{level:1,xp:100,needed:5250});
 assert.deepEqual([1,50,51,150,151,200].map(g.transcendEffective),[1,50,50.5,100,100.25,112.5]);
});
test('experience past Lv.200 fills 초월 경험치 (stage pickups and the experience dungeon); below Lv.200 nothing does',()=>{
 const p=g.createProfile(1000);p.level=g.MAX_LEVEL-1;p.xp=0;const s=g.createGame(p);
 const need=g.xpNeeded(g.MAX_LEVEL-1);s.profile.dungeonProgress.xp=99;g.launchDungeon(s,'xp',100);s.enemies=[];s.spawns=[];s.barrels=[];s.run.wave=3;s.run.waveQuota=s.run.waveKills=0;s.run.stageKills=s.run.stageQuota;g.advanceGame(s,.025);
 assert.equal(s.profile.level,g.MAX_LEVEL);assert.equal(s.profile.xp,0);assert.equal(s.profile.transcendXp,5500-need);
 const r=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.equal(r.transcendXp,5500-need);
 const low=g.createProfile(1000);low.transcendXp=1e6;assert.equal(g.restoreProfile(low,1000).transcendXp,0);
});
test('초월 points buy four abilities in camp; restore trims ranks to the points; reset refunds everything',()=>{
 const p=capped();p.transcendXp=5000+5250+5500;const s=g.createGame(p);assert.equal(g.transcendPointsTotal(p),3);
 const before=g.playerStats(p);assert.equal(g.trainTranscend(s,'might'),true);assert.equal(g.trainTranscend(s,'life'),true);assert.equal(g.trainTranscend(s,'slayer'),true);assert.equal(g.trainTranscend(s,'arts'),false);assert.equal(g.transcendStatus(p,'arts'),'초월 포인트 부족');
 const after=g.playerStats(p);assert.ok(Math.abs(after.damage/before.damage-(1+g.equipmentBonuses(p).damagePct+.01)/(1+g.equipmentBonuses(p).damagePct))<.02);assert.ok(after.maxHp>before.maxHp);assert.deepEqual(g.transcendBonus(p),{damagePct:.01,hpPct:.01,bossDamage:.01,skillDamage:0,reduction:0,attackSpeed:0});
 const saved=readBackup(createBackup(p,1000),1000).profile;assert.deepEqual(saved.transcendence,{might:1,life:1,slayer:1,arts:0,aegis:0,swift:0});
 const forged=capped();forged.transcendXp=5000;forged.transcendence={might:9,life:9,slayer:0,arts:0};assert.deepEqual(g.restoreProfile(forged,1000).transcendence,{might:1,life:0,slayer:0,arts:0,aegis:0,swift:0});
 assert.equal(g.resetTranscendence(s),true);assert.equal(g.transcendPoints(p),3);const low=g.createGame(g.createProfile(1000));assert.equal(g.trainTranscend(low,'might'),false);assert.equal(g.transcendStatus(low.profile,'might'),'Lv.200 이후 개방');
});
test('초월 사냥 raises damage to bosses only',()=>{
 const p=capped();p.transcendXp=1e9;p.transcendence={might:0,life:0,slayer:50,arts:0};assert.equal(g.transcendBonus(p).bossDamage,.5);
});
