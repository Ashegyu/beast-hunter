"""Pack the Alpha 0.122 accessory art (earrings, Lilian seals, region 4-6 necklaces) into one equipment page.

art/accessories0122/acc-<n>.png holds five items in a 3x2 grid with the sixth (bottom-right) cell empty;
sheets.json lists the design id of each cell in order. Items are cut exactly like the 0.119 ancient sheets
(tools/pack-ancient0119.py `items`), scaled to at most 240px like the chapter set pieces and shelf-packed onto
equipment-accessories-v0122. The frames go into manifest.equipment.setFrames (each names its page) and the
page size into manifest.equipment.pages, which equipment-visuals `gearFrame` already reads. Re-running replaces them.
"""
from pathlib import Path
import hashlib
import importlib.util
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
PAGE = 'equipment-accessories-v0122.png'
MAX_SIDE = 240
GAP = 8

spec = importlib.util.spec_from_file_location('ancient0119', ROOT / 'tools/pack-ancient0119.py')
ancient0119 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ancient0119)
ancient0119.MAX_SIDE = MAX_SIDE


def main():
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    equipment = manifest['equipment']
    sheets = json.loads((ROOT / 'art/accessories0122/sheets.json').read_text(encoding='utf-8'))
    placed, report, x, y, shelf, width = [], [], GAP, GAP, 0, 1200
    for key, sheet in sheets.items():
        source = ROOT / sheet['out']
        for design, crop in zip(sheet['items'], ancient0119.items(source)):
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
    assert len(placed) == 15 and len({d for d, *_ in placed}) == 15
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
    (reports / 'alpha0122-accessories.json').write_text(json.dumps({'sources': report, 'page': [page.width, page.height],
        'frames': len(placed), 'webpBytes': out.stat().st_size}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(page.size, len(placed), out.stat().st_size)


if __name__ == '__main__':
    main()
