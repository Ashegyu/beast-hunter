"""Add the Alpha 0.123 raid-only ancients to the ancient atlas.

art/raid0123/raid-<raid>.png holds five ancients in a 3x2 grid with the sixth (bottom-right) cell empty;
ancients.json lists their ancient ids in cell order. Items are cut and anchored exactly like the 0.119 sheets
(tools/pack-ancient0119.py `items`/`anchors`, at most 200px) and shelf-packed below an exact copy of the area
holding the first 150 frames (the 0.119 atlas). Re-running cuts the current atlas back to those 150 frames first.
Run tools/pack-ancient0119.py first if the 0.112/0.119 atlas was rebuilt.
"""
from pathlib import Path
import hashlib
import importlib.util
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
OUT_IMAGE = 'ancient-individual-v0123.png'
GAP = 12

spec = importlib.util.spec_from_file_location('ancient0119', ROOT / 'tools/pack-ancient0119.py')
ancient0119 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ancient0119)


def main():
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    old = manifest['equipmentRarities']
    keep = [i for i, d in enumerate(old['designIds']) if not d.startswith('ancient-raid-')]
    assert len(keep) == 150 and old.get('numbering') == 'region'
    current = Image.open(ASSETS / manifest['delivery'].get(old['image'], old['image'])).convert('RGBA')
    bottom = max(old['frames'][i]['y'] + old['frames'][i]['h'] for i in keep) + GAP
    base = current.crop((0, 0, current.width, bottom))
    sheets = json.loads((ROOT / 'art/raid0123/ancients.json').read_text(encoding='utf-8'))
    placed, report, x, y, shelf = [], [], GAP, base.height + GAP, 0
    for key, sheet in sheets.items():
        source = ROOT / sheet['out']
        for design, crop in zip(sheet['items'], ancient0119.items(source)):
            if x + crop.width + GAP > base.width:
                x, y, shelf = GAP, y + shelf + GAP, 0
            placed.append((design, design.split('-')[3], crop, x, y))
            x += crop.width + GAP
            shelf = max(shelf, crop.height)
        report.append({'sheet': key, 'source': sheet['out'], 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    atlas = Image.new('RGBA', (base.width, y + shelf + GAP))
    atlas.paste(base, (0, 0))
    frames = [old['frames'][i] for i in keep]
    design_ids = [old['designIds'][i] for i in keep]
    for design, slot, crop, px, py in placed:
        atlas.paste(crop, (px, py))
        frame = {'x': px, 'y': py, 'w': crop.width, 'h': crop.height, 'pivotX': round(crop.width / 2, 1),
                 'pivotY': crop.height, 'duration': 1, 'slot': slot}
        if slot == 'weapon':
            frame.update(ancient0119.anchors(crop))
        frames.append(frame)
        design_ids.append(design)
    assert len(frames) == 165 and len(set(design_ids)) == 165
    assert atlas.crop((0, 0, base.width, base.height)).tobytes() == base.tobytes()
    if old['image'] != OUT_IMAGE:
        manifest['delivery'].pop(old['image'], None)
        (ASSETS / old['image'].replace('.png', '.webp')).unlink(missing_ok=True)
    out = ASSETS / OUT_IMAGE.replace('.png', '.webp')
    atlas.save(out, lossless=True, exact=True, method=6)
    with Image.open(out) as decoded:
        assert decoded.convert('RGBA').tobytes() == atlas.tobytes(), 'WebP pixels changed'
    manifest['delivery'][OUT_IMAGE] = out.name
    manifest['equipmentRarities'] = {**old, 'id': 'ancient_individual_v0123', 'image': OUT_IMAGE, 'frames': frames, 'designIds': design_ids}
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/reports/alpha0123-raid-ancients.json').write_text(json.dumps({'sources': report, 'atlas': [atlas.width, atlas.height],
        'frames': len(frames), 'webpBytes': out.stat().st_size}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(atlas.size, len(frames), out.stat().st_size)


if __name__ == '__main__':
    main()
