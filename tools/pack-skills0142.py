"""Pack the Alpha 0.142 animated skill effects (skill colours and shards, art/skills0142) into one atlas page.

Same layout as tools/pack-skills0137.py; only the source folder, page name and report change.

art/skills0142/anim-<id>.png holds six sequential frames of one effect in a 3x2 grid (left to right, top row first).
Each cell is scaled by one factor per effect (frames keep their relative size and anchor) into a CELL px square and
placed on a 10x10 grid: effect i, frame k sits at index i*6+k. manifest.skillPresentation.effects gets `sequences`
(six rects per effect) and `frames` (the peak frame, SKILL_PEAK_FRAME, for still uses). Re-running replaces them.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
PAGE = 'skill-effects-v0142.png'
IDS = ['crescent', 'gale', 'dance', 'draw', 'plunge', 'parry', 'echo', 'triple', 'seeking', 'returning', 'field', 'breach', 'gather', 'stance', 'mark', 'bloodblade']
FRAMES, PEAK, CELL, COLUMNS = 6, 2, 204, 10


def frames(source):
    im = Image.open(source).convert('RGBA')
    w, h = im.width / 3, im.height / 2
    cells = [im.crop((round(c * w), round(r * h), round((c + 1) * w), round((r + 1) * h))) for r in range(2) for c in range(3)]
    side = max(max(c.size) for c in cells)
    scale = CELL / side
    out, edges = [], []
    for c in cells:
        a = np.array(c)[:, :, 3]
        edges.append(int(max(a[0].max(), a[-1].max(), a[:, 0].max(), a[:, -1].max())))
        # Feather the outer 6% of the cell so glow that reached the cell edge fades out instead of ending in a hard line.
        px = np.array(c).astype(np.float32)
        hh, ww = a.shape
        yy, xx = np.mgrid[0:hh, 0:ww]
        edge = np.minimum(np.minimum(xx, ww - 1 - xx), np.minimum(yy, hh - 1 - yy)) / (.06 * min(hh, ww))
        px[:, :, 3] *= np.clip(edge, 0, 1)
        c = Image.fromarray(px.astype(np.uint8))
        small = c.resize((max(1, round(c.width * scale)), max(1, round(c.height * scale))), Image.LANCZOS)
        cell = Image.new('RGBA', (CELL, CELL))
        cell.paste(small, ((CELL - small.width) // 2, (CELL - small.height) // 2))
        out.append(cell)
    return out, edges


def main():
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    rows = -(-len(IDS) * FRAMES // COLUMNS)
    page = Image.new('RGBA', (COLUMNS * CELL, rows * CELL))
    sequences, report = {}, []
    for i, effect in enumerate(IDS):
        source = ROOT / f'art/skills0142/anim-{effect}.png'
        cells, edges = frames(source)
        rects = []
        for k, cell in enumerate(cells):
            n = i * FRAMES + k
            x, y = n % COLUMNS * CELL, n // COLUMNS * CELL
            page.paste(cell, (x, y))
            rects.append({'x': x, 'y': y, 'w': CELL, 'h': CELL})
        sequences[effect] = rects
        report.append({'id': effect, 'source': str(source.relative_to(ROOT)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'edgeAlpha': edges})
    out = ASSETS / PAGE.replace('.png', '.webp')
    # Lossy colour with full-quality alpha: the glow textures are 6 MB lossless, about 2 MB here.
    page.save(out, quality=85, alpha_quality=100, method=6)
    effects = manifest['skillPresentation']['effects']
    old = effects.get('image')
    manifest['skillPresentation']['effects'] = {**effects, 'image': out.name, 'width': page.width, 'height': page.height, 'columns': COLUMNS, 'rows': rows,
        'frames': {k: v[PEAK] for k, v in sequences.items()}, 'sequences': sequences}
    manifest['delivery'].pop(PAGE, None)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/reports/alpha0142-skill-effects.json').write_text(json.dumps({'page': [page.width, page.height], 'cell': CELL, 'frames': FRAMES,
        'webpBytes': out.stat().st_size, 'sources': report}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(page.size, out.stat().st_size, [r['id'] for r in report if max(r['edgeAlpha']) > 40])


if __name__ == '__main__':
    main()
