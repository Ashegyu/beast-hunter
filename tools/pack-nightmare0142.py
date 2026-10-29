"""Pack the Alpha 0.142 악몽 content art (art/nightmare0142, Codex CLI). Run after tools/pack-forge0142.py and
tools/pack-monsters0106.py art/nightmare0142/bosses v0142 (the boss atlas).

- raid-nightmare.png: the 악몽의 군주 relics (weapon helmet armor charm earring) join the ancient atlas below the first
  165 frames (cut and anchored like tools/pack-raid0123.py) → ancient-individual-v0142.
- nm-1.png: 초월 수호·초월 질풍 emblems join the stat emblem atlas as a third row (growth-stats-v0142, 5×3), the
  악몽 결정 icon fills material cell 17 of materials-v0142.
- rift.png / raid-nightmare-scene.png → dungeon-rift-v0142.webp / dungeon-raid-sovereign-v0142.webp (768×512).
Re-running rebuilds everything from the previous atlases' first frames.
"""
from pathlib import Path
import hashlib
import importlib.util
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
ART = ROOT / 'art/nightmare0142'
GAP = 12
spec = importlib.util.spec_from_file_location('ancient0119', ROOT / 'tools/pack-ancient0119.py')
ancient0119 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ancient0119)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ancients(manifest):
    old = manifest['equipmentRarities']
    keep = [i for i, d in enumerate(old['designIds']) if not d.startswith(('ancient-raid-sovereign-', 'ancient-raid-nightmare-'))]
    assert len(keep) == 165
    current = Image.open(ASSETS / manifest['delivery'].get(old['image'], old['image'])).convert('RGBA')
    bottom = max(old['frames'][i]['y'] + old['frames'][i]['h'] for i in keep) + GAP
    base = current.crop((0, 0, current.width, bottom))
    sheet = json.loads((ART / 'ancients.json').read_text(encoding='utf-8'))['raid-nightmare']
    ancient0119.MAX_SIDE = 200
    placed, x, y, shelf = [], GAP, base.height + GAP, 0
    for design, crop in zip(sheet['items'], ancient0119.items(ROOT / sheet['out'])):
        if x + crop.width + GAP > base.width:
            x, y, shelf = GAP, y + shelf + GAP, 0
        placed.append((design, design.split('-')[3], crop, x, y))
        x += crop.width + GAP
        shelf = max(shelf, crop.height)
    atlas = Image.new('RGBA', (base.width, y + shelf + GAP))
    atlas.paste(base, (0, 0))
    frames = [old['frames'][i] for i in keep]
    ids = [old['designIds'][i] for i in keep]
    for design, slot, crop, px, py in placed:
        atlas.paste(crop, (px, py))
        frame = {'x': px, 'y': py, 'w': crop.width, 'h': crop.height, 'pivotX': round(crop.width / 2, 1), 'pivotY': crop.height, 'duration': 1, 'slot': slot}
        if slot == 'weapon':
            frame.update(ancient0119.anchors(crop))
        frames.append(frame)
        ids.append(design)
    assert len(frames) == 170 and len(set(ids)) == 170
    image = 'ancient-individual-v0142.png'
    if old['image'] != image:
        manifest['delivery'].pop(old['image'], None)
        (ASSETS / old['image'].replace('.png', '.webp')).unlink(missing_ok=True)
    out = ASSETS / image.replace('.png', '.webp')
    atlas.save(out, lossless=True, exact=True, method=6)
    manifest['delivery'][image] = out.name
    manifest['equipmentRarities'] = {**old, 'id': 'ancient_individual_v0142', 'image': image, 'frames': frames, 'designIds': ids}
    return {'ancientAtlas': list(atlas.size), 'bytes': out.stat().st_size}


def icons():
    sheet = json.loads((ART / 'icons.json').read_text(encoding='utf-8'))['nm-1']
    ancient0119.MAX_SIDE = 124
    crops = dict(zip(sheet['items'], ancient0119.items(ROOT / sheet['out'])))
    old = Image.open(ART / 'growth-stats-v0141.webp').convert('RGBA')
    stats = Image.new('RGBA', (old.width, 128 * 3))
    stats.paste(old, (0, 0))
    for n, key in enumerate(['t-guard', 't-swift', 'nightmare-mark', 'rift']):
        c = crops[key]
        stats.alpha_composite(c, (n * 128 + (128 - c.width) // 2, 256 + (128 - c.height) // 2))
    stats.save(ASSETS / 'growth-stats-v0142.webp', quality=88, alpha_quality=100, method=6)
    mats = Image.open(ASSETS / 'materials-v0142.webp').convert('RGBA')
    shard = crops['nightmareShard']
    shard = shard.crop(shard.getbbox())
    scale = 120 / max(shard.size)
    shard = shard.resize((max(1, round(shard.width * scale)), max(1, round(shard.height * scale))), Image.LANCZOS)
    index = 17
    cx, cy = (index % 7) * 128, (index // 7) * 128
    mats.paste(Image.new('RGBA', (128, 128)), (cx, cy))
    mats.alpha_composite(shard, (cx + (128 - shard.width) // 2, cy + (128 - shard.height) // 2))
    mats.save(ASSETS / 'materials-v0142.webp', quality=88, alpha_quality=100, method=6)
    return {'stats': list(stats.size)}


def scenes():
    out = {}
    for src, name in [('rift.png', 'dungeon-rift-v0142.webp'), ('raid-nightmare-scene.png', 'dungeon-raid-sovereign-v0142.webp')]:
        target = ASSETS / name
        Image.open(ART / src).convert('RGB').resize((768, 512), Image.LANCZOS).save(target, quality=82, method=6)
        out[name] = target.stat().st_size
    return out


def main():
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    report = {'sources': {p.name: sha(p) for p in sorted(ART.glob('*.png'))}, **ancients(manifest), **icons(), 'scenes': scenes()}
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/reports/alpha0142-nightmare.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False)[:400])


if __name__ == '__main__':
    main()
