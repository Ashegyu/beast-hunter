import fs from 'node:fs';
import { regionAssetPlan } from '../dist/region-assets.js';
import { CHAPTERS } from '../dist/chapters.js';
const root = new URL('../dist/assets/', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', root)));
const plan = regionAssetPlan(manifest, CHAPTERS);
function measure(paths) {
  let bytes = 0, rgbaBytes = 0;
  for (const path of paths) {
    const source = fs.readFileSync(new URL(manifest.delivery?.[path] ?? path, root));
    bytes += source.length;
    if (source.toString('ascii', 12, 16) !== 'VP8L') throw Error('Expected lossless WebP: '+path);
    const bits = source.readUInt32LE(21);
    rgbaBytes += ((bits & 16383) + 1) * (((bits >>> 14) & 16383) + 1) * 4;
  }
  return { imageCount: paths.size, transferBytes: bytes, theoreticalRgbaBytes: rgbaBytes };
}
const all = new Set(plan.paths);
for (const region of plan.regions.values()) for (const path of region.paths) all.add(path);
const before = measure(all);
const report = { scope: 'JS-managed combat images only; CSS/HTML UI images, browser cache, network time and GPU memory excluded',
  before, common: measure(plan.paths), regions: CHAPTERS.map(chapter => {
    const after = measure(new Set([...plan.paths, ...plan.regions.get(chapter.id).paths]));
    return { id: chapter.id, name: chapter.name, ...after, savedTransferBytes: before.transferBytes-after.transferBytes,
      transferReductionPercent: Number(((1-after.transferBytes/before.transferBytes)*100).toFixed(2)) };
  }) };
console.log(JSON.stringify(report, null, 2));
