"""Pack the Alpha 0.140 equipment art: region 1-3 dungeon accessories and the crafted parts.

art/equipment0140/<sheet>.png holds five items in a 3x2 grid with the sixth (bottom-right) cell empty; sheets.json
lists the design id of each cell in order. Items are cut like the 0.119 ancient sheets (tools/pack-ancient0119.py).

- acc-*: region 1-3 necklaces and region 2-3 earrings, scaled to at most 240px and shelf-packed onto
  equipment-accessories-v0140; frames go into manifest.equipment.setFrames like the 0.122 accessories.
- craft-*: crafted helmet/pants/boots/earring/special. The 0.41 crafted page (six 512px cells) is copied to the top
  of craft-equipment-v0140 and the new items fill 512px cells below it, scaled to the old items' average size.
  manifest.craftedPresentation then names the new page. Re-running rebuilds both pages from the 0.41 page.
"""
from pathlib import Path
import hashlib
import importlib.util
import json

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
ACC_PAGE = 'equipment-accessories-v0140.png'
OLD_CRAFT = 'craft-equipment-v041.png'
CRAFT_PAGE = 'craft-equipment-v0140.png'
CELL = 512
GAP = 8

spec = importlib.util.spec_from_file_location('ancient0119', ROOT / 'tools/pack-ancient0119.py')
ancient0119 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ancient0119)


def save_webp(page, name, lossless=True):
    out = ASSETS / name.replace('.png', '.webp')
    if not lossless:  # the 0.41 crafted page was lossy too (painterly art, about 0.4MB)
        page.save(out, quality=90, alpha_quality=100, method=6)
        return out
    page.save(out, lossless=True, exact=True, method=6)
    with Image.open(out) as decoded:
        assert decoded.convert('RGBA').tobytes() == page.tobytes(), 'WebP pixels changed'
    return out


def old_craft_page():
    path = ASSETS / OLD_CRAFT.replace('.png', '.webp')
    if not path.exists():
        path = ROOT / 'art/equipment0140/craft-equipment-v041.webp'
    return Image.open(path).convert('RGBA')


def main():
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    equipment = manifest['equipment']
    sheets = json.loads((ROOT / 'art/equipment0140/sheets.json').read_text(encoding='utf-8'))
    report = []

    # Accessories.
    ancient0119.MAX_SIDE = 240
    placed, x, y, shelf, width = [], GAP, GAP, 0, 1264
    for key, sheet in sheets.items():
        if not key.startswith('acc-'):
            continue
        source = ROOT / sheet['out']
        for design, crop in zip(sheet['items'], ancient0119.items(source)):
            if x + crop.width + GAP > width:
                x, y, shelf = GAP, y + shelf + GAP, 0
            placed.append((design, crop, x, y))
            x += crop.width + GAP
            shelf = max(shelf, crop.height)
        report.append({'sheet': key, 'source': sheet['out'], 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    page = Image.new('RGBA', (width, y + shelf + GAP))
    frames = {k: v for k, v in equipment['setFrames'].items() if v.get('image') != ACC_PAGE}
    for design, crop, px, py in placed:
        page.paste(crop, (px, py))
        frames[design] = {'image': ACC_PAGE, 'x': px, 'y': py, 'w': crop.width, 'h': crop.height,
                          'pivotX': round(crop.width / 2, 1), 'pivotY': crop.height - 3, 'bodyHeight': crop.height - 4}
    assert len(placed) == 5 and len({d for d, *_ in placed}) == 5
    acc_out = save_webp(page, ACC_PAGE)
    equipment['setFrames'] = frames
    equipment['pages'] = {**equipment['pages'], ACC_PAGE: {'width': page.width, 'height': page.height}}
    manifest['delivery'][ACC_PAGE] = acc_out.name

    # Crafted parts.
    old = old_craft_page()
    alpha = np.array(old)[:, :, 3]
    sides = []
    for cy in range(0, old.height, CELL):
        for cx in range(0, old.width, CELL):
            ys, xs = np.nonzero(alpha[cy:cy + CELL, cx:cx + CELL] > 8)
            sides.append(max(ys.max() - ys.min(), xs.max() - xs.min()) + 1)
    target = round(sum(sides) / len(sides))
    ancient0119.MAX_SIDE = 4096
    crafted = []
    for key, sheet in sheets.items():
        if not key.startswith('craft-'):
            continue
        source = ROOT / sheet['out']
        crafted += list(zip(sheet['items'], ancient0119.items(source)))
        report.append({'sheet': key, 'source': sheet['out'], 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    assert len(crafted) == 5
    columns = old.width // CELL
    rows = old.height // CELL + -(-len(crafted) // columns)
    craft = Image.new('RGBA', (old.width, rows * CELL))
    craft.paste(old, (0, 0))
    presentation = manifest['craftedPresentation']
    old_ids = [k for k in presentation['frames'] if not k.startswith(('crafted-helmet', 'crafted-pants', 'crafted-boots', 'crafted-earring', 'crafted-special'))]
    assert len(old_ids) == 6
    new_frames = {k: presentation['frames'][k] for k in old_ids}
    for n, (design, crop) in enumerate(crafted):
        scale = target / max(crop.size)
        crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.LANCZOS)
        cx, cy = (n % columns) * CELL, old.height + (n // columns) * CELL
        craft.alpha_composite(crop, (cx + (CELL - crop.width) // 2, cy + (CELL - crop.height) // 2))
        new_frames[design] = {'x': cx, 'y': cy, 'w': CELL, 'h': CELL}
    craft_out = save_webp(craft, CRAFT_PAGE, lossless=False)
    presentation.update({'image': CRAFT_PAGE, 'width': craft.width, 'height': craft.height, 'frames': new_frames})
    manifest['delivery'].pop(OLD_CRAFT, None)
    manifest['delivery'][CRAFT_PAGE] = craft_out.name

    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    reports = ROOT / 'tools/reports'
    reports.mkdir(exist_ok=True)
    (reports / 'alpha0140-equipment.json').write_text(json.dumps({'sources': report,
        'accessoryPage': [page.width, page.height], 'craftPage': [craft.width, craft.height], 'craftItemSide': target,
        'webpBytes': {acc_out.name: acc_out.stat().st_size, craft_out.name: craft_out.stat().st_size}},
        ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(page.size, craft.size, target)


if __name__ == '__main__':
    main()
