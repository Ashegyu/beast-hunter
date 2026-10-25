"""Pack environment art: per-chapter ground tiles, biome props and biome attack effects.

- Ground: manifest.chapters['c1'..'c60'] points every chapter at its own tile. Chapters
  1-30 come from art/terrain0107/terrain-cNN.png (Alpha 0.107) or reuse earlier tiles;
  31-60 come from art/terrain0118/terrain-cNN.png (Alpha 0.118).
- Props: the Alpha 0.9 prop atlas (12 frames: forest, ruins, frost) is copied
  unchanged into a taller atlas with four props per later biome appended (0.118 props are
  downscaled to at most 360px, the only resampling here):
  fire 12-15 (0.107), sea 16-19, sky 20-23, divine 24-27 (0.118).
- Effects: art/fire0107/fx-fire.png becomes manifest.monsterEffects['4'] and
  art/env0118/fx-{sea,sky,divine}.png become '5'-'7', using the same 4x4
  measurement as tools/pack-monster-effects069.py.
Other pixels are never resampled or repainted; every WebP is decoded and compared.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
BASE_PROPS = 'props_chapters-v09.png'
# Chapters that reuse an existing tile; every other chapter has terrain-cNN.png.
REUSED = {1: 'terrain-forest-v044.png', 5: 'terrain-forest-2-v0106.png', 9: 'terrain-forest-3-v0106.png',
          16: 'terrain-frost-v044.png', 17: 'terrain-frost-2-v0106.png', 18: 'terrain-frost-3-v0106.png',
          21: 'terrain-ruins-v044.png', 28: 'terrain-ruins-2-v0106.png', 29: 'terrain-ruins-3-v0106.png'}
PROP_MAX_SIDE = 360
# Four props per sheet, appended in this order after the twelve Alpha 0.9 props.
PROP_SHEETS = ['art/fire0107/props-fire.png', 'art/env0118/props-sea.png', 'art/env0118/props-sky.png', 'art/env0118/props-divine.png']
EFFECT_SHEETS = [('4', 'art/fire0107/fx-fire.png', 'monster-effects-fire-v0107.png'),
                 ('5', 'art/env0118/fx-sea.png', 'monster-effects-sea-v0118.png'),
                 ('6', 'art/env0118/fx-sky.png', 'monster-effects-sky-v0118.png'),
                 ('7', 'art/env0118/fx-divine.png', 'monster-effects-divine-v0118.png')]


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
    for chapter in range(1, 61):
        if chapter in REUSED:
            logical = REUSED[chapter]
            # Reused tiles are delivered as their existing lossless WebP.
            webp = logical.replace('.png', '.webp')
            assert (ASSETS / webp).exists(), (logical, 'missing WebP')
            manifest['delivery'][logical] = webp
        else:
            tag = '0107' if chapter <= 30 else '0118'
            source = ROOT / f'art/terrain{tag}/terrain-c{chapter:02d}.png'
            image = Image.open(source).convert('RGB')
            logical = f'terrain-c{chapter:02d}-v{tag}.png'
            out = save_webp(image, logical, manifest)
            report['terrain'].append({'chapter': chapter, 'source': str(source.relative_to(ROOT)),
                                      'sha256': sha(source.read_bytes()), 'size': image.size, 'webpBytes': out.stat().st_size})
        manifest['chapters'][f'c{chapter}'] = {'environment': logical}


def pack_props(manifest, report):
    old = manifest['chapterProps']
    # Always start again from the Alpha 0.9 atlas so re-running never appends the biome props twice.
    base = Image.open(ASSETS / manifest['delivery'].get(BASE_PROPS, BASE_PROPS)).convert('RGBA')
    crops, sources = [], []
    for source in PROP_SHEETS:
        # The 0.118 props are drawn at most ~180 world units tall; shrink them so the shared atlas stays small.
        crops += [shrink(c, g) for c, g in cut_props(ROOT / source)] if '0118' in source else cut_props(ROOT / source)
        sources.append({'source': source, 'sha256': sha((ROOT / source).read_bytes())})
    # Shelf-pack the props below the old atlas (they are larger than the 0.9 props).
    placed, x, y, shelf = [], 8, base.height + 8, 0
    for crop, ground in crops:
        assert crop.width + 16 <= base.width, 'prop wider than the atlas'
        if x + crop.width + 8 > base.width:
            x, y, shelf = 8, y + shelf + 8, 0
        placed.append((crop, ground, x, y))
        x += crop.width + 8
        shelf = max(shelf, crop.height)
    atlas = Image.new('RGBA', (base.width, y + shelf + 8))
    atlas.paste(base, (0, 0))
    frames = [dict(f) for f in old['frames'] if f['y'] + f['h'] <= base.height]
    assert len(frames) == 12, 'expected the twelve Alpha 0.9 props'
    for crop, ground, x, y in placed:
        atlas.paste(crop, (x, y))
        frames.append({'x': x, 'y': y, 'w': crop.width, 'h': crop.height, 'pivotX': round(crop.width / 2, 1),
                       'pivotY': ground - 1, 'bodyHeight': ground - 1})
    assert atlas.crop((0, 0, base.width, base.height)).tobytes() == base.tobytes()
    for stale in ['props_chapters-v0107.png']:
        manifest['delivery'].pop(stale, None)
        (ASSETS / stale.replace('.png', '.webp')).unlink(missing_ok=True)
    logical = 'props_chapters-v0118.png'
    out = save_webp(atlas, logical, manifest)
    manifest['chapterProps'] = {**old, 'id': 'chapterProps_v0118', 'image': logical, 'frames': frames}
    report['props'] = {'sources': sources, 'atlas': [atlas.width, atlas.height], 'frames': len(frames), 'webpBytes': out.stat().st_size}


def shrink(crop, ground, side=PROP_MAX_SIDE):
    scale = side / max(crop.size)
    if scale >= 1:
        return crop, ground
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    return crop.resize(size, Image.LANCZOS), max(1, round(ground * scale))


def cut_props(source):
    """Four props of one 2x2 sheet in reading order, each with its ground line (crop bottom of the solid body)."""
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
    return crops


def pack_effects(manifest, report):
    report['effects'] = []
    for key, source, logical in EFFECT_SHEETS:
        pack_effect(manifest, report, key, ROOT / source, logical)


def pack_effect(manifest, report, key, source, logical):
    im = Image.open(source).convert('RGBA')
    w, h = im.size
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
    manifest['monsterEffects'][key] = {'image': out.name, 'width': w, 'height': h, 'frames': frames}
    report['effects'].append({'key': key, 'source': str(source.relative_to(ROOT)), 'sha256': sha(source.read_bytes()), 'size': [w, h], 'webpBytes': out.stat().st_size})


def main():
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    report = {'terrain': []}
    pack_terrain(manifest, report)
    pack_props(manifest, report)
    pack_effects(manifest, report)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/reports/alpha0118-environment.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: (v if k not in ('terrain', 'effects') else len(v)) for k, v in report.items()}, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
