"""Add the Alpha 0.111 ancient art for the fifteen 0.97 parts to the ancient atlas.

art/ancient0111/ancient-<tier>-parts.png holds five items of one identity tier in a 3x2 grid
(helmet, pants, boots / earring, signet seal, empty cell). Every solid body goes to the cell
holding its centroid (a pair of boots is two bodies), faint haze goes to the nearest body and
stray specks are dropped. Items are scaled to at most 200px like the 0.19 ancient art and
placed below an exact copy of the 0.19 atlas; manifest.equipmentRarities gains the frames as
ancient-<tier>-<part>-1. Re-running always starts again from the 0.19 atlas.

Alpha 0.112 numbers ancients by region (1 forest, 2 frost, 3 ruined castle/abyss); the 0.19 atlas used
the old order (2 ruins, 3 frost), so its design ids are renumbered once, recorded as numbering='region'.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
BASE_IMAGE = 'ancient-individual-v019.png'
OUT_IMAGE = 'ancient-individual-v0112.png'
RENUMBER = {'1': '1', '2': '3', '3': '2'}
PARTS = ['helmet', 'pants', 'boots', 'earring', 'special']
MAX_SIDE = 200
GAP = 12


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


def main():
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    old = manifest['equipmentRarities']
    keep = [i for i, d in enumerate(old['designIds']) if not any(f'-{p}-' in d for p in PARTS)]
    assert len(keep) == 60
    base = Image.open(ASSETS / manifest['delivery'].get(BASE_IMAGE, BASE_IMAGE)).convert('RGBA')
    placed, report, x, y, shelf = [], [], GAP, base.height + GAP, 0
    for tier in (1, 2, 3):
        source = ROOT / f'art/ancient0111/ancient-{tier}-parts.png'
        for part, crop in zip(PARTS, items(source)):
            if x + crop.width + GAP > base.width:
                x, y, shelf = GAP, y + shelf + GAP, 0
            placed.append((f'ancient-{tier}-{part}-1', part, crop, x, y))
            x += crop.width + GAP
            shelf = max(shelf, crop.height)
        report.append({'tier': tier, 'source': str(source.relative_to(ROOT)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    atlas = Image.new('RGBA', (base.width, y + shelf + GAP))
    atlas.paste(base, (0, 0))
    frames = [old['frames'][i] for i in keep]
    design_ids = [old['designIds'][i] for i in keep]
    if old.get('numbering') != 'region':
        design_ids = [d[:8] + RENUMBER[d[8]] + d[9:] if d.startswith('ancient-') else d for d in design_ids]
    for design, part, crop, px, py in placed:
        atlas.paste(crop, (px, py))
        frames.append({'x': px, 'y': py, 'w': crop.width, 'h': crop.height, 'pivotX': round(crop.width / 2, 1),
                       'pivotY': crop.height, 'duration': 1, 'slot': part})
        design_ids.append(design)
    assert atlas.crop((0, 0, base.width, base.height)).tobytes() == base.tobytes()
    logical = OUT_IMAGE
    manifest['delivery'].pop('ancient-individual-v0111.png', None)
    (ASSETS / 'ancient-individual-v0111.webp').unlink(missing_ok=True)
    out = ASSETS / logical.replace('.png', '.webp')
    atlas.save(out, lossless=True, exact=True, method=6)
    with Image.open(out) as decoded:
        assert decoded.convert('RGBA').tobytes() == atlas.tobytes(), 'WebP pixels changed'
    manifest['delivery'][logical] = out.name
    manifest['equipmentRarities'] = {**old, 'id': 'ancient_individual_v0112', 'image': logical, 'frames': frames, 'designIds': design_ids, 'numbering': 'region'}
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/reports/alpha0112-ancient-parts.json').write_text(json.dumps({'sources': report, 'atlas': [atlas.width, atlas.height],
        'frames': len(frames), 'webpBytes': out.stat().st_size}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(atlas.size, len(frames), out.stat().st_size)


if __name__ == '__main__':
    main()
