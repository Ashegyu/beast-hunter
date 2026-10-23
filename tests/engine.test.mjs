import test from 'node:test';
import assert from 'node:assert/strict';
import { frameIndex, frameRect, validateClip, makeState, advance, triggerAttack, triggerHit, resetState, MOVE_SPEED, MAX_DELTA } from '../dist/engine.js';

const rectangle = (x = 0) => ({ x, y: 0, w: 32, h: 48, pivotX: 16, pivotY: 45 });
const clip = { frames: [rectangle(), rectangle(32), rectangle(64), rectangle(96)], fps: 4, loop: true };

function ticks(state, seconds, input = {}) {
  const events = [];
  const count = Math.round(seconds / 0.05);
  for (let index = 0; index < count; index += 1) events.push(...advance(state, 0.05, input).events);
  return events;
}
function stationaryEnemy(state, distance, hp = 70) {
  const enemy = state.enemies[0];
  enemy.x = enemy.anchorX = state.player.x + distance;
  enemy.y = enemy.anchorY = state.player.y;
  enemy.vx = enemy.vy = 0;
  enemy.hp = enemy.maxHp = hp;
  state.enemies = [enemy];
  return enemy;
}

test('looping and nonlooping frame indices handle exact boundaries and invalid time', () => {
  for (const [time, expected] of [[0, 0], [0.249999, 0], [0.25, 1], [0.5, 2], [0.999999, 3], [1, 0], [1.25, 1], [1000.5, 2]]) assert.equal(frameIndex(clip, time), expected);
  assert.equal(frameIndex({ ...clip, loop: false }, 100), 3);
  assert.equal(frameIndex(clip, 0.25, 2), 2);
  assert.equal(frameIndex(clip, 20, 0), 0);
  for (const invalid of [-1, NaN, Infinity, '2', null]) assert.equal(frameIndex(clip, invalid), 0);
  assert.equal(frameIndex({ frames: [] }, 10), 0);
  assert.equal(frameIndex(null, 10), 0);
  assert.equal(frameIndex({ frames: clip.frames }, 1 / 12), 1);
  assert.equal(frameIndex(clip, Number.MAX_VALUE), 0);
  assert.equal(frameIndex({ ...clip, fps: Number.MAX_VALUE }, 2), 0);
  assert.equal(frameIndex({ ...clip, loop: false }, Number.MAX_VALUE), 3);
});

test('per-frame duration is measured in seconds and wraps after the entire clip', () => {
  const variable = { fps: 10, frames: [{ ...rectangle(), duration: 0.1 }, { ...rectangle(32), duration: 0.2 }, { ...rectangle(64), duration: 0.3 }] };
  assert.equal(frameIndex(variable, 0.099999), 0);
  assert.equal(frameIndex(variable, 0.1), 1);
  assert.equal(frameIndex(variable, 0.3), 2);
  assert.equal(frameIndex(variable, 0.59999), 2);
  assert.equal(frameIndex(variable, 0.6), 0);
  assert.equal(frameIndex({ ...variable, loop: false }, 0.6), 2);
});

test('frame rectangles clamp indices, provide defaults and never mutate metadata', () => {
  assert.equal(frameRect(clip, -10).index, 0);
  assert.equal(frameRect(clip, 100).index, 3);
  assert.equal(frameRect(clip, 1.9).index, 1);
  assert.equal(frameRect(clip, NaN).index, 0);
  const result = frameRect({ frames: [{ x: 0, y: 0, w: 30, h: 40 }] }, 0);
  assert.deepEqual(result, { x: 0, y: 0, w: 30, h: 40, index: 0, pivotX: 15, pivotY: 40 });
  result.x = 999;
  assert.equal(clip.frames[0].x, 0);
  assert.equal(frameRect({ frames: [] }, 0), null);
});

test('clip validation rejects out-of-image frames, invalid pivots, durations and metadata', () => {
  assert.deepEqual(validateClip(clip, 128, 48), { valid: true, errors: [] });
  const invalids = [
    { ...clip, fps: 0 }, { ...clip, fps: NaN }, { ...clip, loop: 'yes' }, { ...clip, frames: [] },
    { frames: [{ ...rectangle(), x: -1 }] }, { frames: [{ ...rectangle(), x: 100 }] },
    { frames: [{ ...rectangle(), h: 49 }] }, { frames: [{ ...rectangle(), w: 0 }] },
    { frames: [{ ...rectangle(), pivotX: 33 }] }, { frames: [{ ...rectangle(), pivotY: -1 }] },
    { frames: [{ ...rectangle(), pivotX: Infinity }] }, { frames: [{ ...rectangle(), duration: -1 }] },
    { frames: [null] }, { frames: new Array(1) }, null,
  ];
  for (const invalid of invalids) { const result = validateClip(invalid, 128, 48); assert.equal(result.valid, false); assert.ok(result.errors.length > 0); }
  assert.equal(validateClip(clip, 0, 48).valid, false);
  assert.equal(validateClip(clip, 128, Infinity).valid, false);
});

test('default spawn provides two accessible dummies and six skitters plus two bulwarks', () => {
  const state = makeState();
  assert.equal(state.player.x, 600);
  assert.equal(state.player.y, 400);
  assert.equal(state.enemies.filter(enemy => enemy.type === 'skitter').length, 6);
  assert.equal(state.enemies.filter(enemy => enemy.type === 'bulwark').length, 2);
  assert.equal(state.enemies.filter(enemy => Math.hypot(enemy.x - 600, enemy.y - 400) <= 180).length, 2);
  ticks(state, 30);
  assert.equal(state.enemies.filter(enemy => Math.hypot(enemy.x - 600, enemy.y - 400) <= 180).length, 2);
});

test('diagonal movement is normalized and preserves analog input magnitude', () => {
  const straight = makeState();
  const diagonal = makeState();
  advance(straight, 0.05, { movementX: 1 });
  advance(diagonal, 0.05, { movementX: 1, movementY: 1 });
  assert.ok(Math.abs(Math.hypot(diagonal.player.x - 600, diagonal.player.y - 400) - (straight.player.x - 600)) < 1e-9);
  const analog = makeState();
  advance(analog, 0.05, { movementX: 0.3, movementY: 0.4 });
  assert.ok(Math.abs(Math.hypot(analog.player.x - 600, analog.player.y - 400) - MOVE_SPEED * 0.05 * 0.5) < 1e-9);
  assert.equal(diagonal.player.action, 'walk');
  advance(diagonal, 0.05);
  assert.equal(diagonal.player.action, 'idle');
  advance(diagonal, 0.05, { movementX: -1 });
  assert.equal(diagonal.player.facing, -1);
});

test('movement remains bounded and invalid inputs cannot poison state', () => {
  const state = makeState({ width: 180, height: 140 });
  ticks(state, 5, { movementX: 1, movementY: 1 });
  assert.equal(state.player.x, 120);
  assert.equal(state.player.y, 80);
  ticks(state, 5, { movementX: -1, movementY: -1 });
  assert.equal(state.player.x, 60);
  assert.equal(state.player.y, 60);
  const before = { x: state.player.x, y: state.player.y };
  advance(state, 0.05, { movementX: NaN, movementY: Infinity });
  assert.equal(state.player.x, before.x);
  assert.equal(state.player.y, before.y);
  assert.deepEqual(makeState({ width: 0, height: NaN }).bounds, { width: 1200, height: 760, padding: 60 });
});

test('attack hits once at .25 seconds, then finishes at .7 seconds', () => {
  const state = makeState();
  const enemy = stationaryEnemy(state, 150);
  assert.equal(triggerAttack(state), true);
  assert.equal(triggerAttack(state), false);
  ticks(state, 0.2);
  assert.equal(enemy.hp, 70);
  const hit = advance(state, 0.05);
  assert.equal(enemy.hp, 35);
  assert.equal(hit.events.filter(event => event.type === 'hit').length, 1);
  ticks(state, 0.4);
  assert.equal(enemy.hp, 35);
  assert.equal(state.player.action, 'attack');
  advance(state, 0.05);
  assert.equal(state.player.action, 'idle');
  assert.equal(state.player.actionTime, 0);
  assert.equal(state.stats.hits, 1);
  assert.equal(state.stats.damageDealt, 35);
});

test('attack range includes exactly 180; misses do not retry when an enemy approaches later', () => {
  for (const [distance, expected] of [[179.999, 35], [180, 35], [180.001, 70]]) {
    const state = makeState();
    const enemy = stationaryEnemy(state, distance);
    triggerAttack(state);
    ticks(state, 0.25);
    assert.equal(enemy.hp, expected);
  }
  const state = makeState();
  const enemy = stationaryEnemy(state, 181);
  triggerAttack(state);
  ticks(state, 0.25);
  enemy.x = enemy.anchorX = state.player.x + 100;
  ticks(state, 0.45);
  assert.equal(enemy.hp, 70);
  assert.equal(state.stats.hits, 0);
});

test('death never revives through a hurt timeout or a later attack', () => {
  const state = makeState();
  const enemy = stationaryEnemy(state, 100, 35);
  triggerAttack(state);
  const events = ticks(state, 0.7);
  assert.equal(enemy.hp, 0);
  assert.equal(enemy.dead, true);
  assert.equal(enemy.action, 'death');
  assert.equal(events.filter(event => event.type === 'death').length, 1);
  const deadPosition = { x: enemy.x, y: enemy.y };
  ticks(state, 1);
  assert.equal(enemy.action, 'death');
  assert.equal(enemy.x, deadPosition.x);
  assert.equal(enemy.y, deadPosition.y);
  triggerAttack(state);
  ticks(state, 0.7);
  assert.equal(state.stats.hits, 1);
  assert.equal(state.stats.damageDealt, 35);
});

test('player hurt interrupts an attack, resumes after .5 seconds and clamps HP at zero', () => {
  const state = makeState();
  const enemy = stationaryEnemy(state, 100);
  triggerAttack(state);
  ticks(state, 0.2);
  assert.equal(triggerHit(state), true);
  assert.equal(state.player.hp, 90);
  assert.equal(triggerAttack(state), false);
  ticks(state, 0.45);
  assert.equal(state.player.action, 'hurt');
  advance(state, 0.05);
  assert.equal(state.player.action, 'idle');
  assert.equal(enemy.hp, 70);
  for (let index = 0; index < 9; index += 1) triggerHit(state);
  assert.equal(state.player.hp, 0);
  assert.equal(state.player.action, 'death');
  assert.equal(triggerHit(state), false);
  assert.equal(triggerAttack(state), false);
  const x = state.player.x;
  advance(state, 0.05, { movementX: 1 });
  assert.equal(state.player.x, x);
});

test('delta clamp limits suspended frames and rejects nonfinite deltas', () => {
  const state = makeState();
  const result = advance(state, 100, { movementX: 1 });
  assert.equal(result.dt, MAX_DELTA);
  assert.equal(state.player.x, 600 + MOVE_SPEED * MAX_DELTA);
  for (const invalid of [-1, NaN, Infinity, '1', null, undefined]) {
    const before = JSON.stringify(state);
    assert.equal(advance(state, invalid).dt, 0);
    assert.equal(JSON.stringify(state), before);
  }
});

test('animation clocks and boundary strikes are independent of render-frame partitioning', () => {
  const large = makeState();
  const small = makeState();
  advance(large, 0.05, { movementX: 1 });
  for (let index = 0; index < 5; index += 1) advance(small, 0.01, { movementX: 1 });
  assert.ok(Math.abs(large.player.actionTime - small.player.actionTime) < 1e-9);
  assert.ok(Math.abs(large.player.x - small.player.x) < 1e-9);
  const coarse = makeState();
  const fine = makeState();
  const coarseEnemy = stationaryEnemy(coarse, 179.74);
  const fineEnemy = stationaryEnemy(fine, 179.74);
  coarseEnemy.vx = fineEnemy.vx = 1;
  triggerAttack(coarse);
  triggerAttack(fine);
  for (let index = 0; index < 6; index += 1) advance(coarse, 0.05);
  for (let index = 0; index < 10; index += 1) advance(fine, 0.03);
  assert.equal(coarseEnemy.hp, 35);
  assert.equal(fineEnemy.hp, 35);
  assert.ok(Math.abs(coarseEnemy.x - fineEnemy.x) < 1e-9);
});

test('reset preserves the root reference and bounds while clearing damage and action state', () => {
  const state = makeState({ width: 1000, height: 600, padding: 40 });
  const identity = state;
  triggerAttack(state);
  ticks(state, 0.3);
  triggerHit(state);
  state.extra = true;
  assert.equal(resetState(state), identity);
  assert.deepEqual(state, makeState({ width: 1000, height: 600, padding: 40 }));
});
