"""Pack the Alpha 0.142 승화 제작 art (art/forge0142, Codex CLI).

- forge-1: weapon helmet armor pants boots; forge-2: charm earring + the 4~6지역 materials pearl plume halo.
  Each sheet holds five items in a 3x2 grid with the bottom-right cell empty, cut like tools/pack-ancient0119.py.
- The seven forged parts go below the 0.140 crafted page into 512px cells (scaled to the 0.140 item size) on a new page
  craft-equipment-v0142; manifest.craftedPresentation.frames maps every forge row id (forge-<slot>-<1..6|raid>) to its
  part's cell, and forge weapons get grip/tip anchors.
- The three materials join the material atlas: materials-v0142 = materials-v0141 (7 x 2) plus a third row (indices 14~16).
Re-running rebuilds both pages from the 0.140 crafted page and the 0.141 material atlas.
"""
from pathlib import Path
import hashlib
import importlib.util
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
CELL = 512
OLD_PAGE = 'craft-equipment-v0140.png'
PAGE = 'craft-equipment-v0142.png'
MAT_CELL = 128
SLOTS = ['weapon', 'helmet', 'armor', 'pants', 'boots', 'charm', 'earring']
ROWS = ['1', '2', '3', '4', '5', '6', 'raid']
spec = importlib.util.spec_from_file_location('ancient0119', ROOT / 'tools/pack-ancient0119.py')
ancient0119 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ancient0119)


def main():
    sheets = json.loads((ROOT / 'art/forge0142/sheets.json').read_text(encoding='utf-8'))
    ancient0119.MAX_SIDE = 4096
    items, sources = {}, []
    for key, sheet in sheets.items():
        source = ROOT / sheet['out']
        items.update(zip(sheet['items'], ancient0119.items(source)))
        sources.append({'sheet': key, 'source': sheet['out'], 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    path = ASSETS / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    presentation = manifest['craftedPresentation']
    old_name = manifest['delivery'].get(OLD_PAGE) or manifest['delivery'].get(PAGE)
    base_frames = {k: v for k, v in presentation['frames'].items() if not k.startswith('forge-')}
    old = Image.open(ROOT / 'art/forge0142/craft-equipment-v0140.webp').convert('RGBA')
    target = json.loads((ROOT / 'tools/reports/alpha0140-equipment.json').read_text(encoding='utf-8'))['craftItemSide']
    columns, used = old.width // CELL, len(base_frames)
    rows = -(-(used + len(SLOTS)) // columns)
    page = Image.new('RGBA', (old.width, rows * CELL))
    page.paste(old, (0, 0))
    frames, anchors = dict(base_frames), {k: v for k, v in presentation.get('weaponAnchors', {}).items() if not k.startswith('forge-')}
    for n, slot in enumerate(SLOTS):
        crop = items['forge_' + slot]
        scale = target / max(crop.size)
        crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.LANCZOS)
        cell = used + n
        cx, cy = (cell % columns) * CELL, (cell // columns) * CELL
        ox, oy = (CELL - crop.width) // 2, (CELL - crop.height) // 2
        page.alpha_composite(crop, (cx + ox, cy + oy))
        for row in ROWS:
            frames[f'forge-{slot}-{row}'] = {'x': cx, 'y': cy, 'w': CELL, 'h': CELL}
            if slot == 'weapon':
                a = ancient0119.anchors(crop)
                anchors[f'forge-{slot}-{row}'] = {'gripX': round(a['gripX'] + ox), 'gripY': round(a['gripY'] + oy), 'tipX': round(a['tipX'] + ox), 'tipY': round(a['tipY'] + oy)}
    out = ASSETS / PAGE.replace('.png', '.webp')
    page.save(out, quality=82, alpha_quality=90, method=6)
    presentation.update({'image': PAGE, 'width': page.width, 'height': page.height, 'frames': frames, 'weaponAnchors': anchors})
    manifest['delivery'].pop(OLD_PAGE, None)
    manifest['delivery'][PAGE] = out.name
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    # Materials: the 0.141 atlas plus a third row.
    old_atlas = Image.open(ROOT / 'art/forge0142/materials-v0141.webp').convert('RGBA')
    atlas = Image.new('RGBA', (MAT_CELL * 7, MAT_CELL * 3))
    atlas.paste(old_atlas, (0, 0))
    for n, key in enumerate(['pearl', 'plume', 'halo']):
        icon = items[key].crop(items[key].getbbox())
        scale = (MAT_CELL - 8) / max(icon.size)
        icon = icon.resize((max(1, round(icon.width * scale)), max(1, round(icon.height * scale))), Image.LANCZOS)
        index = 14 + n
        atlas.alpha_composite(icon, ((index % 7) * MAT_CELL + (MAT_CELL - icon.width) // 2, (index // 7) * MAT_CELL + (MAT_CELL - icon.height) // 2))
    mat_out = ASSETS / 'materials-v0142.webp'
    atlas.save(mat_out, quality=88, alpha_quality=100, method=6)
    (ROOT / 'tools/reports/alpha0142-forge.json').write_text(json.dumps({'sources': sources, 'craftPage': [page.width, page.height], 'craftItemSide': target,
        'materials': ['pearl', 'plume', 'halo'], 'webpBytes': {out.name: out.stat().st_size, mat_out.name: mat_out.stat().st_size}}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(page.size, atlas.size, out.stat().st_size, mat_out.stat().st_size)


if __name__ == '__main__':
    main()
