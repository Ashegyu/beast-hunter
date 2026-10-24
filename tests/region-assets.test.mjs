import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { regionAssetPlan, createRegionAssets, campAssetPaths } from '../dist/region-assets.js';
import { CHAPTERS } from '../dist/chapters.js';

test('cold camp decodes only preview images that are reused by the battle plan',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url))),camp=campAssetPaths(manifest),battle=regionAssetPlan(manifest,CHAPTERS);
 assert.equal(camp.size,3);assert.ok(camp.has(manifest.clips[manifest.directions.hunter.idle.s].image));
 for(const path of camp)assert.ok(battle.paths.has(path));
 for(const path of [manifest.pickupEffects.image,manifest.skillPresentation.effects.image,...[...battle.regions.values()].flatMap(r=>[...r.paths])])assert.equal(camp.has(path),false);
});

test('startup plan excludes other regions without excluding shared animation assets', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json', import.meta.url)));
  const plan = regionAssetPlan(manifest, CHAPTERS);
  assert.equal(plan.paths.size, 18);
  assert.ok(plan.paths.has(manifest.pickupEffects.image));
  assert.ok(plan.paths.has(manifest.skillPresentation.effects.image));
  for(const p of Object.values(manifest.skillPresentation.portraits))assert.equal(plan.paths.has(p.image),false);
  for (const chapter of CHAPTERS) {
    const region = plan.regions.get(chapter.id);
    assert.equal(region.paths.size, 4);
    assert.equal(region.clips.length, 105);
    assert.ok(region.paths.has(manifest.chapters[chapter.theme].environment));
    for (const path of region.paths) assert.ok(!plan.paths.has(path));
  }
});

function fixture() {
  const images = new Map([['shared', { shared: true }]]), loads = new Map();
  const plan = { paths: new Set(['shared']), regions: new Map([1,2,3].map(id => [id, {
    paths: new Set(['terrain'+id, 'monster'+id]), clips: [{ image: 'monster'+id }]
  }])) };
  const loader = createRegionAssets({ images, plan, loadImage(path) {
    return new Promise((resolve, reject) => {
      assert.ok(!loads.has(path), 'same region must share its pending load');
      loads.set(path, { resolve, reject });
    });
  }, validateClip: (_, width) => ({ valid: width !== 0, errors: ['invalid region clip'] }) });
  function finish(id, invalid = false) {
    for (const path of ['terrain'+id, 'monster'+id]) {
      const pending = loads.get(path); loads.delete(path);
      pending.resolve({ naturalWidth: invalid ? 0 : 100, naturalHeight: 100 });
    }
  }
  return { images, loads, loader, finish };
}

test('latest region alone commits and replacement evicts only previous region images', async () => {
  const f = fixture(), first = f.loader.request(1); f.finish(1); assert.equal(await first, true);
  const old = f.loader.request(2), latest = f.loader.request(3);
  assert.equal(f.loader.request(3), latest);
  f.finish(3); assert.equal(await latest, true); f.finish(2); assert.equal(await old, false);
  assert.equal(f.loader.residentId, 3);
  assert.deepEqual([...f.images.keys()].sort(), ['monster3', 'shared', 'terrain3']);
});

test('returning to resident cancels pending promotion and stale failure cannot poison readiness', async () => {
  const f = fixture(), first = f.loader.request(1); f.finish(1); await first;
  const abandoned = f.loader.request(2); assert.equal(await f.loader.request(1), true);
  f.loads.get('terrain2').reject(Error('late failure')); f.loads.delete('terrain2');
  f.loads.get('monster2').resolve({ naturalWidth: 100, naturalHeight: 100 }); f.loads.delete('monster2');
  assert.equal(await abandoned, false); assert.equal(f.loader.status, 'ready'); assert.equal(f.loader.error, '');
  assert.equal(f.loader.residentId, 1);
});

test('invalid or partial region never commits; explicit retry validates a fresh complete region', async () => {
  const f = fixture(), first = f.loader.request(1); f.finish(1); await first;
  const invalid = f.loader.request(2); f.finish(2, true); assert.equal(await invalid, false);
  assert.equal(f.loader.status, 'error'); assert.equal(f.loader.residentId, 1);
  assert.ok(!f.images.has('terrain2')); assert.equal(await f.loader.request(2), false);
  const retry = f.loader.request(2, true); f.finish(2); assert.equal(await retry, true);
  assert.equal(f.loader.residentId, 2); assert.equal(f.images.size, 3);
});

test('A to B to A pending selections reuse work but only newest selection can promote', async () => {
  const f = fixture(), old = f.loader.request(1), other = f.loader.request(2), newest = f.loader.request(1);
  f.finish(1); assert.equal(await old, false); assert.equal(await newest, true);
  f.finish(2); assert.equal(await other, false); assert.equal(f.loader.residentId, 1);
});
