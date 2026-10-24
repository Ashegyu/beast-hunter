"""Append the Alpha 0.108 region set items to the equipment atlas.

Each art/equipment0108/set-<id>.png holds six items in a 3x2 grid: sword, second
weapon, helmet / chest, pants, boots. They are cut out (largest six opaque bodies,
faint haze ignored), scaled to at most 340px like the 0.9 items, and shelf-packed below an exact copy of the
current equipment atlas; manifest.equipment gains one frame and design id each
(set_<id>_sword, _blade2, _helmet, _armor, _pants, _boots). Re-running starts again
from the original Alpha 0.9 atlas.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
SETS = ['forest', 'fire', 'frost', 'ruins']
PARTS = ['sword', 'blade2', 'helmet', 'armor', 'pants', 'boots']
BASE_IMAGE = 'equipment_chapters-v09.png'
MAX_SIDE = 340


def items(source):
    rgba = np.array(Image.open(source).convert('RGBA'))
    alpha = rgba[:, :, 3]
    labels, _ = label(alpha > 127)
    sizes = np.bincount(labels.ravel())
    cores = sorted([(i + 1, r) for i, r in enumerate(find_objects(labels)) if r is not None], key=lambda p: -sizes[p[0]])[:6]
    assert len(cores) == 6 and min(sizes[c[0]] for c in cores) > 5000, (source.name, 'expected six items')
    owners = np.zeros_like(labels)
    for component, _ in cores:
        owners[labels == component] = component
    owners = owners[tuple(distance_transform_edt(owners == 0, return_distances=False, return_indices=True))]
    height = rgba.shape[0]
    cores.sort(key=lambda p: (int((p[1][0].start + p[1][0].stop) / 2 > height / 2), p[1][1].start))
    crops = []
    for component, _ in cores:
        mask = (owners == component) & (alpha > 8)
        ys, xs = np.nonzero(mask)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        pixels = rgba[y0:y1, x0:x1].copy()
        pixels[~mask[y0:y1, x0:x1]] = 0
        crop = Image.fromarray(pixels)
        # Icons draw at 34-64px and in-hand at character scale; match the 0.9 items
        # (max side ~370px) so the startup equipment atlas stays small.
        scale = MAX_SIDE / max(crop.size)
        if scale < 1:
            crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.LANCZOS)
        crops.append(crop)
    return crops


def main():
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    old = manifest['equipment']
    keep = [i for i, d in enumerate(old['designIds']) if not d.startswith('set_')]
    base = Image.open(ASSETS / manifest['delivery'].get(BASE_IMAGE, BASE_IMAGE)).convert('RGBA')
    entries = []
    report = []
    for set_id in SETS:
        source = ROOT / f'art/equipment0108/set-{set_id}.png'
        for part, crop in zip(PARTS, items(source)):
            entries.append((f'set_{set_id}_{part}', crop))
        report.append({'set': set_id, 'source': str(source.relative_to(ROOT)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    # Shelf-pack under the original atlas.
    placed, x, y, shelf = [], 8, base.height + 8, 0
    for design, crop in entries:
        if x + crop.width + 8 > base.width:
            x, y, shelf = 8, y + shelf + 8, 0
        placed.append((design, crop, x, y))
        x += crop.width + 8
        shelf = max(shelf, crop.height)
    atlas = Image.new('RGBA', (base.width, y + shelf + 8))
    atlas.paste(base, (0, 0))
    frames = [old['frames'][i] for i in keep]
    design_ids = [old['designIds'][i] for i in keep]
    for design, crop, px, py in placed:
        atlas.paste(crop, (px, py))
        frames.append({'x': px, 'y': py, 'w': crop.width, 'h': crop.height, 'pivotX': round(crop.width / 2, 1),
                       'pivotY': crop.height - 3, 'bodyHeight': crop.height - 4})
        design_ids.append(design)
    assert atlas.crop((0, 0, base.width, base.height)).tobytes() == base.tobytes()
    logical = 'equipment_chapters-v0108.png'
    out = ASSETS / logical.replace('.png', '.webp')
    atlas.save(out, lossless=True, exact=True, method=6)
    with Image.open(out) as decoded:
        assert decoded.convert('RGBA').tobytes() == atlas.tobytes(), 'WebP pixels changed'
    manifest['delivery'][logical] = out.name
    manifest['equipment'] = {**old, 'id': 'equipment_v0108', 'image': logical, 'frames': frames, 'designIds': design_ids}
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/reports/alpha0108-equipment.json').write_text(json.dumps({'sources': report, 'atlas': [atlas.width, atlas.height],
        'frames': len(frames), 'webpBytes': out.stat().st_size}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(len(frames), atlas.size, out.stat().st_size)


if __name__ == '__main__':
    main()
