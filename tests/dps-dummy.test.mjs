import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {DUMMY, DUMMY_SECONDS, dummyPlan} from '../dist/dungeons.js';

const NOW = Date.UTC(2026, 9, 30);
const emptyRecord = {best: 0, bestDamage: 0, last: 0, runs: 0};

function make(durable = false) {
  const p = g.createProfile(NOW);
  assert.deepEqual(p.dummy, emptyRecord);
  p.level = 200;
  p.skillBook = g.restoreSkillBook(null, 200);
  const s = g.createGame(p, {durable});
  s.phase = 'camp';
  return s;
}

function launch(s) {
  assert.equal(g.launchDungeon(s, 'dummy', 1, null, NOW), true);
  assert.equal(s.run.timeLimit, 60);
  assert.equal(s.run.timeRemaining, 60);
}

// 자연 만료까지 실제 자동 전투를 진행한다. 피해나 타이머를 주입하지 않는다.
function measure(s) {
  const hp = s.player.hp;
  let target;
  let position;
  for (let tick = 0; tick < 70 / .05 && s.phase === 'playing' && !s.settlement; tick++) {
    g.advanceGame(s, .05);
    assert.equal(s.player.hp, hp, '허수아비는 플레이어에게 피해를 주지 않는다');
    if (s.enemies.length) {
      assert.equal(s.enemies.length, 1, '허수아비는 한 마리뿐이다');
      const e = s.enemies[0];
      assert.equal(e.dummy, true);
      if (!target) {
        target = e;
        position = {x: e.x, y: e.y};
      }
      assert.equal(e, target, '측정 중 허수아비가 교체되지 않는다');
      assert.deepEqual({x: e.x, y: e.y}, position, '허수아비 위치는 고정이다');
      if (s.phase === 'playing' && !s.settlement) assert.equal(e.dead, false);
    }
  }
  assert.ok(target, '실제 허수아비가 생성되어야 한다');
  assert.equal(s.run.timeRemaining, 0, '70초 이내에 자연 만료된다');
  const result = s.run.dungeonReward.dummy;
  assert.ok(result.damage > 0);
  assert.equal(result.damage, g.liveDps(s).dealt);
  assert.equal(result.dps, result.damage / 60);
  assert.equal(s.run.dungeonReward.gold, 0);
  assert.deepEqual(s.run.dungeonReward.materials, {});
  assert.equal(Object.hasOwn(s.profile.dungeonProgress, 'dummy'), false);
  return result;
}

test('60초 허수아비 측정: 고정 위치·무공격·승리·DPS 기록, 낮은 재측정과 무제한 입장', () => {
  assert.equal(DUMMY.id, 'dummy');
  assert.equal(DUMMY_SECONDS, 60);
  const plan = dummyPlan();
  assert.equal(plan.timeLimit, DUMMY_SECONDS);
  assert.equal(plan.damageScale, 0);
  assert.equal(plan.barrels, 0);
  assert.equal(plan.waves.length, 1);
  assert.equal(plan.waves[0].boss, true);

  const s = make();
  const p = s.profile;
  p.dungeonWeek.week = g.raidWeek(NOW);
  for (const d of g.DUNGEONS) p.dungeonWeek.clears[d.id] = g.DUNGEON_WEEKLY_CLEARS;
  const week = structuredClone(p.dungeonWeek);
  const progress = structuredClone(p.dungeonProgress);
  const materials = structuredClone(p.materials);
  const gold = p.gold;
  for (const d of g.DUNGEONS) assert.equal(g.dungeonClearsLeft(p, d.id, week.week), 0);

  launch(s);
  const first = measure(s);
  assert.equal(s.phase, 'victory');
  assert.equal(first.record, true);
  assert.deepEqual(p.dummy, {best: first.dps, bestDamage: first.damage, last: first.dps, runs: 1});
  assert.deepEqual(g.restoreProfile(JSON.parse(JSON.stringify(p)), NOW).dummy, p.dummy);

  // 장착 스킬은 유지하고 프로필 레벨만 낮춰 실제 공격력을 줄인다.
  const loadout = structuredClone(p.skillBook.loadout);
  const damage = g.playerStats(p).damage;
  p.level = 1;
  assert.ok(g.playerStats(p).damage < damage);
  launch(s);
  assert.deepEqual(p.skillBook.loadout, loadout);
  const second = measure(s);
  assert.equal(s.phase, 'victory');
  assert.ok(second.dps < first.dps);
  assert.equal(second.record, false);
  assert.equal(second.best, first.dps);
  assert.deepEqual(p.dummy, {best: first.dps, bestDamage: first.damage, last: second.dps, runs: 2});
  assert.deepEqual(p.dungeonWeek, week);
  assert.deepEqual(p.dungeonProgress, progress);
  assert.equal(p.gold, gold);
  assert.deepEqual(p.materials, materials);
  assert.deepEqual(g.restoreProfile(JSON.parse(JSON.stringify(p)), NOW).dummy, p.dummy);

  launch(s);
  assert.equal(Object.hasOwn(p.dungeonProgress, 'dummy'), false);
  assert.equal(g.returnToCamp(s), true);
  assert.deepEqual(p.dungeonWeek, week);
});

test('dummy 기록 복원은 잘못된 값을 0으로 정리한다', () => {
  assert.deepEqual(g.cleanDummy({best: -1, runs: 'x'}), emptyRecord);
  const p = g.createProfile(NOW);
  p.dummy = {best: -1, runs: 'x'};
  assert.deepEqual(g.restoreProfile(JSON.parse(JSON.stringify(p)), NOW).dummy, emptyRecord);
});

test('내구 모드의 dummy 저널은 확인 전 기록을 보류하고 정산 확인 후 보존한다', () => {
  const s = make(true);
  launch(s);
  assert.equal(s.profile.activeBattle.dungeon, 'dummy');
  const result = measure(s);
  assert.ok(s.settlement);
  assert.equal(s.phase, 'playing');
  assert.deepEqual(s.profile.dummy, emptyRecord, '확인 전에는 진행 기록을 공개하지 않는다');
  const expected = {best: result.dps, bestDamage: result.damage, last: result.dps, runs: 1};
  assert.deepEqual(g.restoreProfile(g.encodeProfile(s.profile, NOW), NOW).dummy, expected,
    '저장 후보에는 정산될 dummy 기록이 있어야 한다');
  const id = s.settlement.id;
  assert.equal(g.confirmSettlement(s, id), true);
  assert.equal(s.phase, 'victory');
  assert.deepEqual(s.profile.dummy, expected);
  assert.deepEqual(g.restoreProfile(JSON.parse(JSON.stringify(s.profile)), NOW).dummy, expected);
  assert.equal(g.confirmSettlement(s, id), false);
  assert.deepEqual(s.profile.dummy, expected, '중복 확정으로 runs가 증가하지 않는다');
});
