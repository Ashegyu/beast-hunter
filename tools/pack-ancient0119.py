"""Add the Alpha 0.119 ancients of regions 4-6 to the ancient atlas.

art/ancient0119/ancient-<region>-<n>.png holds five ancients in a 3x2 grid with the sixth
(bottom-right) cell empty; sheets.json lists which ancient ids each sheet holds, in cell order.
Items are cut by the cell holding each solid body's centroid (a pair of boots is two bodies),
faint haze goes to the nearest body and stray specks are dropped, then scaled to at most 200px
like the earlier ancient art. They are shelf-packed below an exact copy of the area holding the
first 75 frames (the Alpha 0.112 atlas). Weapon frames get grip/tip anchors measured like the 0.19 art: the tip is the
top-right-most pixel, the grip sits 14% of the way from the bottom-left-most pixel (pommel).
Re-running cuts the current atlas back to those 75 frames first (and drops the 0.123 raid frames: run pack-raid0123.py after).
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
OUT_IMAGE = 'ancient-individual-v0119.png'
MAX_SIDE = 200
GAP = 12
GRIP = .14


def items(source):
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
    assert sizes[[i for i in kept if cell_of[i] == 5]].sum() < 5000, (source.name, 'the sixth cell must stay empty')
    owner = np.where(np.isin(labels, kept), labels, 0)
    distance, (iy, ix) = distance_transform_edt(owner == 0, return_indices=True)
    cells = np.where((alpha > 8) & (distance <= 6), cell_of[owner[iy, ix]], -1)
    crops = []
    for cell in range(5):
        assert sizes[[i for i in kept if cell_of[i] == cell]].sum() > 5000, (source.name, cell, 'empty cell')
        mask = cells == cell
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


def anchors(crop):
    ys, xs = np.nonzero(np.array(crop)[:, :, 3] > 127)
    t, b = np.argmax(xs - ys), np.argmax(ys - xs)
    tip, pommel = (xs[t] + .5, ys[t] + .5), (xs[b] + .5, ys[b] + .5)
    grip = (pommel[0] + (tip[0] - pommel[0]) * GRIP, pommel[1] + (tip[1] - pommel[1]) * GRIP)
    return {'gripX': round(float(grip[0]), 1), 'gripY': round(float(grip[1]), 1), 'tipX': float(tip[0]), 'tipY': float(tip[1])}


def main():
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    old = manifest['equipmentRarities']
    keep = [i for i, d in enumerate(old['designIds']) if d.split('-')[1].isdigit() and int(d.split('-')[1]) <= 3]
    assert len(keep) == 75 and old.get('numbering') == 'region'
    # The current atlas (0.112 or an earlier 0.119 run) cut back to the area of the first 75 frames.
    current = Image.open(ASSETS / manifest['delivery'].get(old['image'], old['image'])).convert('RGBA')
    bottom = max(old['frames'][i]['y'] + old['frames'][i]['h'] for i in keep) + GAP
    base = current.crop((0, 0, current.width, bottom))
    sheets = json.loads((ROOT / 'art/ancient0119/sheets.json').read_text(encoding='utf-8'))
    placed, report, x, y, shelf = [], [], GAP, base.height + GAP, 0
    for key, spec in sheets.items():
        source = ROOT / spec['out']
        for design, crop in zip(spec['items'], items(source)):
            if x + crop.width + GAP > base.width:
                x, y, shelf = GAP, y + shelf + GAP, 0
            placed.append((design, design.split('-')[2], crop, x, y))
            x += crop.width + GAP
            shelf = max(shelf, crop.height)
        report.append({'sheet': key, 'source': spec['out'], 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    atlas = Image.new('RGBA', (base.width, y + shelf + GAP))
    atlas.paste(base, (0, 0))
    frames = [old['frames'][i] for i in keep]
    design_ids = [old['designIds'][i] for i in keep]
    for design, slot, crop, px, py in placed:
        atlas.paste(crop, (px, py))
        frame = {'x': px, 'y': py, 'w': crop.width, 'h': crop.height, 'pivotX': round(crop.width / 2, 1),
                 'pivotY': crop.height, 'duration': 1, 'slot': slot}
        if slot == 'weapon':
            frame.update(anchors(crop))
        frames.append(frame)
        design_ids.append(design)
    assert len(frames) == 150 and len(set(design_ids)) == 150
    assert atlas.crop((0, 0, base.width, base.height)).tobytes() == base.tobytes()
    if old['image'] != OUT_IMAGE:
        manifest['delivery'].pop(old['image'], None)
        (ASSETS / old['image'].replace('.png', '.webp')).unlink(missing_ok=True)
    out = ASSETS / OUT_IMAGE.replace('.png', '.webp')
    atlas.save(out, lossless=True, exact=True, method=6)
    with Image.open(out) as decoded:
        assert decoded.convert('RGBA').tobytes() == atlas.tobytes(), 'WebP pixels changed'
    manifest['delivery'][OUT_IMAGE] = out.name
    manifest['equipmentRarities'] = {**old, 'id': 'ancient_individual_v0119', 'image': OUT_IMAGE, 'frames': frames, 'designIds': design_ids}
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/reports/alpha0119-ancients.json').write_text(json.dumps({'sources': report, 'atlas': [atlas.width, atlas.height],
        'frames': len(frames), 'webpBytes': out.stat().st_size}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(atlas.size, len(frames), out.stat().st_size)


if __name__ == '__main__':
    main()
