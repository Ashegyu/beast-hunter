"""Pack the Alpha 0.136 boss rush seal art (16 seals, one per effect incl. the 0.136.2 character 전용 seals, and the 인장 조각 icon) into one equipment page.

art/seals0136/seal-<n>.png holds three to five items in a 3x2 grid filled left to right, top row first, with the
remaining cells empty; sheets.json lists the design id of each cell in order (seal_<effect id>, seal_shard).
Items are cut like tools/pack-ancient0119.py `items` (each opaque part joins the cell its centre falls in, a 6px
halo keeps soft edges), scaled to at most 240px and shelf-packed onto equipment-seals-v0136. The frames go into
manifest.equipment.setFrames (each names its page) and the page size into manifest.equipment.pages, which
equipment-visuals `gearFrame` already reads. Re-running replaces them.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
PAGE = 'equipment-seals-v0136.png'
MAX_SIDE = 240
GAP = 8


def items(source, count):
    rgba = np.array(Image.open(source).convert('RGBA'))
    alpha = rgba[:, :, 3]
    height, width = alpha.shape
    labels, parts = label(alpha > 127)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    kept = [i for i in range(1, parts + 1) if sizes[i] >= sizes.max() * .01]
    cell_of = np.zeros(parts + 1, dtype=int) - 1
    for i, (ys, xs) in zip(range(1, parts + 1), find_objects(labels)):
        if i in kept:
            py, px = np.nonzero(labels[ys, xs] == i)
            cy, cx = py.mean() + ys.start, px.mean() + xs.start
            cell_of[i] = min(1, int(cy / (height / 2))) * 3 + min(2, int(cx / (width / 3)))
    for cell in range(count, 6):
        assert sizes[[i for i in kept if cell_of[i] == cell]].sum() < 5000, (source.name, cell, 'cell must stay empty')
    owner = np.where(np.isin(labels, kept), labels, 0)
    distance, (iy, ix) = distance_transform_edt(owner == 0, return_indices=True)
    cells = np.where((alpha > 8) & (distance <= 6), cell_of[owner[iy, ix]], -1)
    crops = []
    for cell in range(count):
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
    equipment = manifest['equipment']
    sheets = json.loads((ROOT / 'art/seals0136/sheets.json').read_text(encoding='utf-8'))
    placed, report, x, y, shelf, width = [], [], GAP, GAP, 0, 1240
    for key, sheet in sheets.items():
        source = ROOT / sheet['out']
        for design, crop in zip(sheet['items'], items(source, len(sheet['items']))):
            if x + crop.width + GAP > width:
                x, y, shelf = GAP, y + shelf + GAP, 0
            placed.append((design, crop, x, y))
            x += crop.width + GAP
            shelf = max(shelf, crop.height)
        report.append({'sheet': key, 'source': sheet['out'], 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    page = Image.new('RGBA', (width, y + shelf + GAP))
    frames = {k: v for k, v in equipment['setFrames'].items() if v.get('image') != PAGE}
    for design, crop, px, py in placed:
        page.paste(crop, (px, py))
        frames[design] = {'image': PAGE, 'x': px, 'y': py, 'w': crop.width, 'h': crop.height,
                          'pivotX': round(crop.width / 2, 1), 'pivotY': crop.height - 3, 'bodyHeight': crop.height - 4}
    assert len(placed) == 17 and len({d for d, *_ in placed}) == 17
    out = ASSETS / PAGE.replace('.png', '.webp')
    page.save(out, lossless=True, exact=True, method=6)
    with Image.open(out) as decoded:
        assert decoded.convert('RGBA').tobytes() == page.tobytes(), 'WebP pixels changed'
    equipment['setFrames'] = frames
    equipment['pages'] = {**equipment['pages'], PAGE: {'width': page.width, 'height': page.height}}
    manifest['delivery'][PAGE] = out.name
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    reports = ROOT / 'tools/reports'
    reports.mkdir(exist_ok=True)
    (reports / 'alpha0136-seals.json').write_text(json.dumps({'sources': report, 'page': [page.width, page.height],
        'frames': {d: frames[d] for d, *_ in placed}, 'webpBytes': out.stat().st_size}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(page.size, len(placed), out.stat().st_size)


if __name__ == '__main__':
    main()
