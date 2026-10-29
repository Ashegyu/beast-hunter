import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {MATERIAL_LIMIT} from '../dist/crafting.js';

// Alpha 0.144.9 테스트 모드(사용자 요청): 장비를 뺀 골드·괴수 핵·재료 무제한, 던전·레이드·보스 러시 입장 횟수 무제한.
const now=Date.UTC(2026,9,27,3);
function cleared(){const p=g.createProfile(1000);p.unlockedStage=p.clearedStage=g.STAGES.length;p.stageProgress=g.STAGES.map(()=>10);p.bossMastery=g.STAGES.map(()=>0);p.level=120;return p;}

test('test mode fills currencies and materials but not equipment, and survives save/restore', () => {
  const p=cleared(),s=g.createGame(p);
  assert.equal(g.setTestMode(s,true),true);
  assert.equal(p.gold,g.TEST_GOLD);assert.equal(p.cores,g.TEST_CORES);
  for(const m of g.MATERIALS)assert.equal(p.materials[m.id],MATERIAL_LIMIT,m.id);
  assert.equal(p.inventory.length,0);
  p.gold=5;p.materials.refineStone=0;assert.equal(g.applyTestMode(p),true);assert.equal(p.gold,g.TEST_GOLD);assert.equal(p.materials.refineStone,MATERIAL_LIMIT);
  assert.equal(g.applyTestMode(p),false);
  const back=g.restoreProfile(g.encodeProfile(p,now),now);assert.equal(back.testMode,true);
  assert.equal(g.restoreProfile(g.encodeProfile(g.createProfile(1000),now),now).testMode,false);
  assert.equal(g.setTestMode(s,false),true);assert.equal(p.testMode,false);assert.equal(g.applyTestMode(p),false);
});

test('test mode ignores weekly and daily entry limits', () => {
  const p=cleared(),week=g.raidWeek(now),id=g.RAIDS[0].id,dungeon=g.DUNGEONS[0].id;
  p.raids={...p.raids,week,entries:{...p.raids.entries,[id]:g.RAID_WEEKLY_ENTRIES}};p.bossRush={day:g.rushDay(now),entries:g.RUSH_DAILY_ENTRIES,clears:0,best:0};p.dungeonWeek={week,clears:{...p.dungeonWeek.clears,[dungeon]:g.DUNGEON_WEEKLY_CLEARS}};
  const before=[g.raidEntriesLeft(p,id,now),g.rushEntriesLeft(p,now),g.dungeonClearsLeft(p,dungeon,week)];
  p.testMode=true;
  assert.deepEqual([g.raidEntriesLeft(p,id,now),g.rushEntriesLeft(p,now),g.dungeonClearsLeft(p,dungeon,week)],[g.RAID_WEEKLY_ENTRIES,g.RUSH_DAILY_ENTRIES,g.DUNGEON_WEEKLY_CLEARS]);
  const s=g.createGame(p);assert.equal(g.launchBossRush(s,now),true);
  assert.deepEqual(before,[0,0,0]);
});
