"""Pack the Alpha 0.109 chapter set items into one equipment atlas page per region.

Every chapter has its own set (dist/equipment-sets.js). Each set sheet holds six items
in a 3x2 grid: sword, second weapon, helmet / chest, pants, boots. The 0.108 region sets
come from art/equipment0108, the rest from art/equipment0109. Items are cut out by grid cell
(stray specks and faint haze ignored), scaled to at most 240px (icons draw at 34-64px)
and placed one set per row on the page of their region (chapters 1-10, 11-20, 21-30).

manifest.equipment goes back to the unchanged Alpha 0.9 atlas for its twelve frames and
gains `setFrames` (design id -> frame with its page `image`) and `pages` (page sizes).
Set frames stay out of `frames` so the 0.9 atlas validation is unchanged. Re-running
always starts again from the 0.9 atlas.
"""
from pathlib import Path
import hashlib
import json
import re

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
PARTS = ['sword', 'blade2', 'helmet', 'armor', 'pants', 'boots']
BASE_IMAGE = 'equipment_chapters-v09.png'
LEGACY = {'forest', 'fire', 'frost', 'ruins'}
MAX_SIDE = 240
GAP = 8


def chapter_sets():
    source = (ROOT / 'dist/equipment-sets.js').read_text(encoding='utf-8')
    rows = re.findall(r"^ \['(\w+)',(\d+),'", source, re.M)
    assert len(rows) == 30, 'expected thirty chapter sets'
    return [(set_id, int(chapter)) for set_id, chapter in rows]


def items(source):
    """Cut the six items by their 3x2 grid cell. A pair of boots or a thin rapier can be several
    separate bodies and a diagonal blade can reach past a grid line, so every solid body goes to
    the cell holding its centroid; faint haze goes to the nearest body, stray specks are dropped."""
    rgba = np.array(Image.open(source).convert('RGBA'))
    alpha = rgba[:, :, 3]
    height, width = alpha.shape
    labels, count = label(alpha > 127)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    kept = [i for i in range(1, count + 1) if sizes[i] >= sizes.max() * .01]
    cell_of = np.zeros(count + 1, dtype=int) - 1
    for i, (ys, xs) in zip(range(1, count + 1), find_objects(labels)):
        if i in kept:
            py, px = np.nonzero(labels[ys, xs] == i)
            cy, cx = py.mean() + ys.start, px.mean() + xs.start
            cell_of[i] = min(1, int(cy / (height / 2))) * 3 + min(2, int(cx / (width / 3)))
    owner = np.where(np.isin(labels, kept), labels, 0)
    distance, (iy, ix) = distance_transform_edt(owner == 0, return_indices=True)
    cells = np.where((alpha > 8) & (distance <= 6), cell_of[owner[iy, ix]], -1)
    crops = []
    for cell in range(6):
        mask = cells == cell
        assert sizes[[i for i in kept if cell_of[i] == cell]].sum() > 5000, (source.name, cell, 'empty cell')
        ys, xs = np.nonzero(mask)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        pixels = rgba[y0:y1, x0:x1].copy()
        pixels[~mask[y0:y1, x0:x1]] = 0
        crop = Image.fromarray(pixels)
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
    base = Image.open(ASSETS / manifest['delivery'][BASE_IMAGE])
    # Drop the single 0.108 atlas.
    manifest['delivery'].pop('equipment_chapters-v0108.png', None)
    (ASSETS / 'equipment_chapters-v0108.webp').unlink(missing_ok=True)
    set_frames, pages, report = {}, {}, []
    for region in range(3):
        rows = [s for s in chapter_sets() if (s[1] - 1) // 10 == region]
        placed, y = [], GAP
        for set_id, chapter in rows:
            source = ROOT / f"art/{'equipment0108' if set_id in LEGACY else 'equipment0109'}/set-{set_id}.png"
            crops = items(source)
            x, shelf = GAP, 0
            for part, crop in zip(PARTS, crops):
                placed.append((f'set_{set_id}_{part}', crop, x, y))
                x += crop.width + GAP
                shelf = max(shelf, crop.height)
            y += shelf + GAP
            report.append({'set': set_id, 'chapter': chapter, 'source': str(source.relative_to(ROOT)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
        width = max(px + crop.width for _, crop, px, _ in placed) + GAP
        page = Image.new('RGBA', (width, y))
        logical = f'equipment-sets-r{region + 1}-v0109.png'
        for design, crop, px, py in placed:
            page.paste(crop, (px, py))
            set_frames[design] = {'image': logical, 'x': px, 'y': py, 'w': crop.width, 'h': crop.height,
                                  'pivotX': round(crop.width / 2, 1), 'pivotY': crop.height - 3, 'bodyHeight': crop.height - 4}
        out = ASSETS / logical.replace('.png', '.webp')
        page.save(out, lossless=True, exact=True, method=6)
        with Image.open(out) as decoded:
            assert decoded.convert('RGBA').tobytes() == page.tobytes(), 'WebP pixels changed'
        manifest['delivery'][logical] = out.name
        pages[logical] = {'width': page.width, 'height': page.height}
        print(logical, page.size, out.stat().st_size)
    manifest['equipment'] = {**old, 'id': 'equipment_v0109', 'image': BASE_IMAGE,
                             'frames': [old['frames'][i] for i in keep], 'designIds': [old['designIds'][i] for i in keep],
                             'setFrames': set_frames, 'pages': pages}
    assert len(manifest['equipment']['frames']) == 12 and base.size == (1254, 1254)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/reports/alpha0109-equipment.json').write_text(json.dumps({'sources': report, 'pages': pages,
        'setFrames': len(set_frames), 'webpBytes': {p: (ASSETS / p.replace('.png', '.webp')).stat().st_size for p in pages}},
        ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
