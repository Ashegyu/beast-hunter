import { SEAL_EFFECTS } from '../dist/seals.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { regionAssetPlan, createRegionAssets, campAssetPaths } from '../dist/region-assets.js';
import { CHAPTERS, ACCESSORY_ART, REGION_ACCESSORY_ART } from '../dist/chapters.js';

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
    // Ground tile, attack effects, the boss atlas and only the atlases of the chapter's six species (Alpha 0.107).
    const expected = new Set([manifest.chapters[chapter.environment].environment, manifest.monsterEffects[chapter.effects].image,
      ...[...chapter.roster, chapter.bossSpecies, ...(chapter.midBoss ? [chapter.midBoss] : [])].flatMap(id => Object.values(manifest.directions[id]).flatMap(v => Object.values(v)).map(c => manifest.clips[c].image)),
      // The region's equipment page carries the chapter's set items that drop in battle (Alpha 0.109).
      manifest.equipment.setFrames[`set_${chapter.set}_sword`].image]);
    assert.deepEqual(region.paths, expected);
    assert.ok(region.paths.size <= 11);
    assert.equal(region.clips.length, chapter.midBoss ? 120 : 105);
    assert.ok(region.paths.has(manifest.chapters[chapter.environment].environment));
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

test('every startup and chapter image resolves to a delivered file (Alpha 0.108)', () => {
  // A logical .png without a delivery entry is requested as-is and 404s (chapters 5·9·17·18·28·29 in 0.107).
  const manifest = JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json', import.meta.url)));
  const plan = regionAssetPlan(manifest, CHAPTERS);
  const paths = new Set([...campAssetPaths(manifest), ...plan.paths, ...[...plan.regions.values()].flatMap(r => [...r.paths])]);
  for (const path of paths) {
    const file = manifest.delivery[path] ?? path;
    assert.ok(fs.existsSync(new URL('../dist/assets/' + file, import.meta.url)), path + ' → ' + file);
  }
});

test('every chapter set item has a frame inside its atlas page (Alpha 0.109)', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json', import.meta.url)));
  const { setFrames, pages } = manifest.equipment;
  // Six per chapter set plus the 15 accessory frames on their own page (Alpha 0.122) and 17 seal frames (Alpha 0.136:
  // one per boss rush seal effect and the 인장 조각 icon) and 5 region 1-3 dungeon accessories (Alpha 0.140).
  assert.equal(Object.keys(setFrames).length, CHAPTERS.length * 6 + 15 + 17 + 5);
  for (const id of [...SEAL_EFFECTS.map(e => 'seal_' + e.id), 'seal_shard']) { const frame = setFrames[id], page = pages[frame?.image]; assert.ok(frame && page, id); assert.equal(frame.image, 'equipment-seals-v0136.png'); assert.ok(frame.x >= 0 && frame.y >= 0 && frame.x + frame.w <= page.width && frame.y + frame.h <= page.height && Math.max(frame.w, frame.h) <= 240, id); assert.ok(fs.existsSync(new URL('../dist/assets/' + manifest.delivery[frame.image], import.meta.url))); }
  for (const art of REGION_ACCESSORY_ART) { const frame = setFrames[art.id], page = pages[frame?.image]; assert.ok(frame && page, art.id); assert.equal(frame.image, 'equipment-accessories-v0140.png'); assert.ok(frame.x >= 0 && frame.y >= 0 && frame.x + frame.w <= page.width && frame.y + frame.h <= page.height && Math.max(frame.w, frame.h) <= 240, art.id); assert.ok(fs.existsSync(new URL('../dist/assets/' + manifest.delivery[frame.image], import.meta.url))); }
  for (const art of ACCESSORY_ART) { const frame = setFrames[art.id], page = pages[frame?.image]; assert.ok(frame && page, art.id); assert.equal(frame.image, 'equipment-accessories-v0122.png'); assert.ok(frame.x >= 0 && frame.y >= 0 && frame.x + frame.w <= page.width && frame.y + frame.h <= page.height, art.id); assert.ok(fs.existsSync(new URL('../dist/assets/' + manifest.delivery[frame.image], import.meta.url))); }
  for (const chapter of CHAPTERS) for (const part of ['sword', 'blade2', 'helmet', 'armor', 'pants', 'boots']) {
    const f = setFrames[`set_${chapter.set}_${part}`], page = pages[f.image];
    assert.ok(page && f.x >= 0 && f.y >= 0 && f.w > 0 && f.h > 0 && f.x + f.w <= page.width && f.y + f.h <= page.height, chapter.set + part);
    assert.ok(Math.max(f.w, f.h) <= 240);
  }
  assert.equal(new Set(CHAPTERS.map(c => c.set)).size, CHAPTERS.length);
});
