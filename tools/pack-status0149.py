"""Pack the Alpha 0.149.3 status-effect icons (art/status0149/status-1~2.png, Codex CLI) into dist/assets/status-icons-v0149.webp.

Each sheet holds six round badges in a 3x2 grid (all six cells). The atlas is 6 columns x 2 rows of 64px cells in
icons.json `items` order: burn frost curse corrode sealed purified / dispelled holyShield fury stance regen ward.
layout-fit.css draws them before the battle status chips with background-position (`data-status`).
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

ROOT = Path(__file__).resolve().parents[1]
CELL = 64


def items(source):
    rgba = np.array(Image.open(source).convert('RGBA'))
    alpha = rgba[:, :, 3]
    height, width = alpha.shape
    labels, count = label(alpha > 127)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    cells = np.full(alpha.shape, -1)
    for i, (ys, xs) in zip(range(1, count + 1), find_objects(labels)):
        if sizes[i] < sizes.max() * .01:
            continue
        py, px = np.nonzero(labels[ys, xs] == i)
        cy, cx = py.mean() + ys.start, px.mean() + xs.start
        cells[labels == i] = min(1, int(cy / (height / 2))) * 3 + min(2, int(cx / (width / 3)))
    crops = []
    for cell in range(6):
        mask = cells == cell
        assert mask.sum() > 5000, (source.name, cell, 'empty cell')
        ys, xs = np.nonzero(mask)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        pixels = rgba[y0:y1, x0:x1].copy()
        # keep soft edges: everything inside the bounding box that is not another cell's object
        other = (cells[y0:y1, x0:x1] >= 0) & ~mask[y0:y1, x0:x1]
        pixels[other] = 0
        crop = Image.fromarray(pixels)
        crop.thumbnail((CELL - 2, CELL - 2), Image.LANCZOS)
        crops.append(crop)
    return crops


def main():
    sheets = json.loads((ROOT / 'art/status0149/icons.json').read_text(encoding='utf-8'))
    ids, crops, report = [], [], []
    for key, sheet in sheets.items():
        source = ROOT / sheet['out']
        ids += sheet['items']
        crops += items(source)
        report.append({'sheet': key, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    atlas = Image.new('RGBA', (CELL * 6, CELL * 2))
    for n, crop in enumerate(crops):
        atlas.alpha_composite(crop, ((n % 6) * CELL + (CELL - crop.width) // 2, (n // 6) * CELL + (CELL - crop.height) // 2))
    out = ROOT / 'dist/assets/status-icons-v0149.webp'
    atlas.save(out, quality=90, alpha_quality=100, method=6)
    (ROOT / 'tools/reports/alpha0149-status-icons.json').write_text(json.dumps({'ids': ids, 'sources': report, 'webpBytes': out.stat().st_size}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(ids, out.stat().st_size)


if __name__ == '__main__':
    main()
