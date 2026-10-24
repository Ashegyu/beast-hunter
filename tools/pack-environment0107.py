"""Pack Alpha 0.107 environment art: per-chapter ground tiles, fire props and fire attack effects.

- Ground: manifest.chapters['c1'..'c30'] points every chapter at its own tile. New
  tiles come from art/terrain0107/terrain-cNN.png; the rest reuse earlier tiles.
- Props: the Alpha 0.9 prop atlas (12 frames: forest, ruins, frost) is copied
  unchanged into a taller atlas with four fire props appended as frames 12-15.
- Effects: art/fire0107/fx-fire.png becomes manifest.monsterEffects['4'] using the
  same 4x4 measurement as tools/pack-monster-effects069.py.
Pixels are never resampled or repainted; every WebP is decoded and compared.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
# Chapters that reuse an existing tile; every other chapter has terrain-cNN.png.
REUSED = {1: 'terrain-forest-v044.png', 5: 'terrain-forest-2-v0106.png', 9: 'terrain-forest-3-v0106.png',
          16: 'terrain-frost-v044.png', 17: 'terrain-frost-2-v0106.png', 18: 'terrain-frost-3-v0106.png',
          21: 'terrain-ruins-v044.png', 28: 'terrain-ruins-2-v0106.png', 29: 'terrain-ruins-3-v0106.png'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save_webp(image, name, manifest):
    out = ASSETS / name.replace('.png', '.webp')
    image.save(out, lossless=True, exact=True, method=6)
    with Image.open(out) as decoded:
        assert decoded.convert(image.mode).tobytes() == image.tobytes(), (name, 'WebP pixels changed')
    manifest['delivery'][name] = out.name
    return out


def pack_terrain(manifest, report):
    # Drop the 0.106 phase keys; chapters now name their own tile.
    for key in [k for k in manifest['chapters'] if '.' in k or k.startswith('c')]:
        del manifest['chapters'][key]
    for chapter in range(1, 31):
        if chapter in REUSED:
            logical = REUSED[chapter]
        else:
            source = ROOT / f'art/terrain0107/terrain-c{chapter:02d}.png'
            image = Image.open(source).convert('RGB')
            logical = f'terrain-c{chapter:02d}-v0107.png'
            out = save_webp(image, logical, manifest)
            report['terrain'].append({'chapter': chapter, 'source': str(source.relative_to(ROOT)),
                                      'sha256': sha(source.read_bytes()), 'size': image.size, 'webpBytes': out.stat().st_size})
        manifest['chapters'][f'c{chapter}'] = {'environment': logical}


def pack_props(manifest, report):
    old = manifest['chapterProps']
    base = Image.open(ASSETS / manifest['delivery'].get(old['image'], old['image'])).convert('RGBA')
    source = ROOT / 'art/fire0107/props-fire.png'
    sheet = Image.open(source).convert('RGBA')
    rgba = np.array(sheet)
    alpha = rgba[:, :, 3]
    labels, _ = label(alpha > 127)
    sizes = np.bincount(labels.ravel())
    cores = sorted([(i + 1, r) for i, r in enumerate(find_objects(labels)) if r is not None], key=lambda p: -sizes[p[0]])[:4]
    assert len(cores) == 4 and min(sizes[c[0]] for c in cores) > 5000, 'expected four props'
    owners = np.zeros_like(labels)
    for component, _ in cores:
        owners[labels == component] = component
    nearest = distance_transform_edt(owners == 0, return_distances=False, return_indices=True)
    owners = owners[tuple(nearest)]
    cores.sort(key=lambda p: (p[1][0].start // (sheet.height // 2), p[1][1].start))
    crops = []
    for component, (ys, xs) in cores:
        # Ignore the near-invisible haze (alpha <= 8) the generator leaves around objects.
        mask = (owners == component) & (alpha > 8)
        py, px = np.nonzero(mask)
        x0, y0, x1, y1 = px.min(), py.min(), px.max() + 1, py.max() + 1
        pixels = rgba[y0:y1, x0:x1].copy()
        pixels[~mask[y0:y1, x0:x1]] = 0
        crops.append((Image.fromarray(pixels), int(ys.stop - y0)))
    # Shelf-pack the four props below the old atlas (they are larger than the 0.9 props).
    placed, x, y, shelf = [], 8, base.height + 8, 0
    for crop, ground in crops:
        assert crop.width + 16 <= base.width, 'fire prop wider than the atlas'
        if x + crop.width + 8 > base.width:
            x, y, shelf = 8, y + shelf + 8, 0
        placed.append((crop, ground, x, y))
        x += crop.width + 8
        shelf = max(shelf, crop.height)
    atlas = Image.new('RGBA', (base.width, y + shelf + 8))
    atlas.paste(base, (0, 0))
    frames = [dict(f) for f in old['frames']]
    for crop, ground, x, y in placed:
        atlas.paste(crop, (x, y))
        frames.append({'x': x, 'y': y, 'w': crop.width, 'h': crop.height, 'pivotX': round(crop.width / 2, 1),
                       'pivotY': ground - 1, 'bodyHeight': ground - 1})
    assert atlas.crop((0, 0, base.width, base.height)).tobytes() == base.tobytes()
    logical = 'props_chapters-v0107.png'
    out = save_webp(atlas, logical, manifest)
    manifest['chapterProps'] = {**old, 'id': 'chapterProps_v0107', 'image': logical, 'frames': frames}
    report['props'] = {'source': str(source.relative_to(ROOT)), 'sha256': sha(source.read_bytes()),
                       'atlas': [atlas.width, atlas.height], 'frames': len(frames), 'webpBytes': out.stat().st_size}


def pack_effects(manifest, report):
    source = ROOT / 'art/fire0107/fx-fire.png'
    im = Image.open(source).convert('RGBA')
    w, h = im.size
    logical = 'monster-effects-fire-v0107.png'
    out = save_webp(im, logical, manifest)
    pixels = im.load()
    frames = {}
    for row, kind in enumerate(['slash', 'bolt', 'impact', 'charge']):
        frames[kind] = []
        for col in range(4):
            x, y = col * w // 4, row * h // 4
            cw, ch = (col + 1) * w // 4 - x, (row + 1) * h // 4 - y
            px, py = cw * .5, ch * .5
            if kind == 'bolt':
                weighted = []
                for yy in range(ch):
                    for xx in range(cw):
                        r, g, b, a = pixels[x + xx, y + yy]
                        lum = (r + g + b) / 3
                        if xx > cw * .6 and a > 48 and lum > 170:
                            weighted.append((xx, yy, (lum - 160) * a * (xx / cw) ** 4))
                weight = sum(z[2] for z in weighted)
                if weight:
                    px = sum(z[0] * z[2] for z in weighted) / weight
                    py = sum(z[1] * z[2] for z in weighted) / weight
            if kind == 'impact':
                py = ch * .76
            assert im.crop((x, y, x + cw, y + ch)).getchannel('A').getbbox() is not None, (kind, col, 'empty cell')
            frames[kind].append({'x': x, 'y': y, 'w': cw, 'h': ch, 'pivotX': round(px, 2), 'pivotY': round(py, 2)})
    # The runtime descriptor names the delivered WebP directly, like the 0.69 sheets.
    manifest['delivery'].pop(logical)
    manifest['monsterEffects']['4'] = {'image': out.name, 'width': w, 'height': h, 'frames': frames}
    report['effects'] = {'source': str(source.relative_to(ROOT)), 'sha256': sha(source.read_bytes()), 'size': [w, h], 'webpBytes': out.stat().st_size}


def main():
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    report = {'terrain': []}
    pack_terrain(manifest, report)
    pack_props(manifest, report)
    pack_effects(manifest, report)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/reports/alpha0107-environment.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: (v if k != 'terrain' else len(v)) for k, v in report.items()}, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
