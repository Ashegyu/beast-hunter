import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_BOUNDS, GROUND_DEPTH_SCALE, cameraFor, worldToScreen, screenToWorld, visibleInCamera } from '../dist/world.js';
import { makeState, advance, resetState } from '../dist/engine.js';

const viewport = { width: 1200, height: 760 };
// The camera keeps the player 60% down the screen (world.js cameraFor).
const playerScreenY = viewport.height * .6;

test('world has nine viewport areas and seven separate enemy camps', () => {
  const state = makeState(WORLD_BOUNDS);
  assert.equal(state.bounds.width * state.bounds.height, 9 * viewport.width * viewport.height);
  assert.equal(state.enemies.length, 56);
  assert.equal(new Set(state.enemies.map(enemy => enemy.id)).size, 56);
  assert.equal(state.enemies.filter(enemy => Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) <= 180).length, 2);
  assert.ok(state.enemies.some(enemy => !visibleInCamera(enemy, cameraFor(state.player, state.bounds, viewport))));
  for (const enemy of state.enemies) {
    assert.ok(enemy.x >= 60 && enemy.x <= state.bounds.width - 60);
    assert.ok(enemy.y >= 60 && enemy.y <= state.bounds.height - 60);
  }
  state.enemies[0].dead = true;
  resetState(state);
  assert.equal(state.enemies.length, 56);
  assert.equal(state.enemies.some(enemy => enemy.dead), false);
});

test('camera tracks both axes and stops at all four world edges', () => {
  const state = makeState(WORLD_BOUNDS);
  const initial = cameraFor(state.player, state.bounds, viewport);
  assert.deepEqual(initial, { x: 1200, y: state.player.y - playerScreenY, width: 1200, height: 760 });
  for (let i = 0; i < 100; i++) advance(state, .05, { movementX: 1, movementY: 1 });
  const moved = cameraFor(state.player, state.bounds, viewport);
  assert.ok(moved.x > initial.x && moved.y > initial.y);
  assert.equal(state.player.x - moved.x, 600);
  assert.deepEqual(cameraFor({ x: 60, y: 60 }, state.bounds, viewport), { x: 0, y: 0, width: 1200, height: 760 });
  assert.deepEqual(cameraFor({ x: 3540, y: 2220 }, state.bounds, viewport), { x: 2400, y: 1520, width: 1200, height: 760 });
});

test('pointer conversion includes camera offset and clamps to reachable world bounds', () => {
  const state = makeState(WORLD_BOUNDS);
  const camera = cameraFor(state.player, state.bounds, viewport);
  assert.deepEqual(screenToWorld({ x: 600, y: playerScreenY }, camera, state.bounds), { x: state.player.x, y: state.player.y });
  assert.deepEqual(screenToWorld({ x: 1100, y: 500 }, camera, state.bounds), { x: 2300, y: camera.y + 500 });
  assert.deepEqual(screenToWorld({ x: 1200, y: 760 }, { x: 2400, y: 1520 }, state.bounds), { x: 3540, y: 2220 });
  assert.deepEqual(screenToWorld({ x: 0, y: 0 }, { x: 0, y: 0 }, state.bounds), { x: 60, y: 60 });
});

test('small worlds never create negative camera offsets', () => {
  const state = makeState({ width: 180, height: 140 });
  const camera = cameraFor(state.player, state.bounds, viewport);
  assert.equal(camera.x, 0); assert.equal(camera.y, 0);
  assert.equal(visibleInCamera(state.player, camera), true);
});

test('45-degree ground projection round-trips points and centers the feet through camera motion', () => {
  const bounds={...WORLD_BOUNDS,padding:60};
  for(const p of [{x:1800,y:1160},{x:350,y:800},{x:3540,y:2220},{x:60,y:60}]){
    const camera=cameraFor(p,bounds,viewport,GROUND_DEPTH_SCALE);
    assert.ok(camera.y>=0&&camera.y+camera.height<=bounds.height+1e-9);
    assert.ok(Math.abs(camera.height*camera.depthScale-viewport.height)<1e-9);
    for(const point of [p,{x:60,y:60},{x:3540,y:2220},{x:1234,y:1456}]){
      const roundtrip=screenToWorld(worldToScreen(point,camera),camera,bounds);
      assert.ok(Math.abs(roundtrip.x-point.x)<1e-9&&Math.abs(roundtrip.y-point.y)<1e-9);
    }
  }
  const p={x:1800,y:1160},camera=cameraFor(p,bounds,viewport,GROUND_DEPTH_SCALE),foot=worldToScreen(p,camera);
  assert.ok(Math.abs(foot.x-600)<1e-9&&Math.abs(foot.y-playerScreenY)<1e-9);
  const bottom=cameraFor({x:3540,y:2220},bounds,viewport,GROUND_DEPTH_SCALE);
  assert.ok(Math.abs(worldToScreen({x:bounds.width,y:bounds.height},bottom).y-760)<1e-9);
  assert.deepEqual(screenToWorld({x:99999,y:99999},bottom,bounds),{x:3540,y:2220});
});

test('projected culling keeps upright heads at the bottom edge and small-world cameras stay valid', () => {
  const camera=cameraFor({x:1800,y:1160},WORLD_BOUNDS,viewport,GROUND_DEPTH_SCALE);
  const below={x:camera.x+600,y:camera.y+camera.height+260/GROUND_DEPTH_SCALE};
  assert.equal(visibleInCamera(below,camera,270),true);
  assert.equal(visibleInCamera({...below,y:below.y+20/GROUND_DEPTH_SCALE},camera,270),false);
  const small=cameraFor({x:90,y:70},{width:180,height:140},viewport,GROUND_DEPTH_SCALE);
  assert.equal(small.x,0);assert.equal(small.y,0);assert.equal(visibleInCamera({x:90,y:70},small,0),true);
});
