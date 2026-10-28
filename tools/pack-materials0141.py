"""Pack the Alpha 0.141 material atlas dist/assets/materials-v0141.webp (7 x 2 cells of 128px, crafting.js MATERIALS order).

- boneIron hide crystal root seal tear source origin: the 0.41 crafting material page (craft-materials-v041, 4 x 2 cells).
- refineStone refineCrystal refineEssence skillPage promotionStone: art/materials0141/mats-1.png (Codex CLI, 3x2 grid with
  the bottom-right cell empty, cut like tools/pack-ancient0119.py). Before 0.141 these reused other materials' pictures.
- sealShard: the 인장 조각 frame of the 0.136 seal page (manifest setFrames['seal_shard']).
The 재료 도감 (codex materials tab) and every material icon read this atlas with --mi (index).
"""
from pathlib import Path
import hashlib
import importlib.util
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
CELL = 128
ORDER = ['boneIron', 'hide', 'crystal', 'root', 'seal', 'tear', 'source', 'origin', 'refineStone', 'refineCrystal', 'refineEssence', 'skillPage', 'promotionStone', 'sealShard']
V041 = {'boneIron': (0, 0), 'hide': (1, 0), 'crystal': (2, 0), 'root': (3, 0), 'seal': (0, 1), 'tear': (1, 1), 'source': (2, 1), 'origin': (3, 1)}
spec = importlib.util.spec_from_file_location('ancient0119', ROOT / 'tools/pack-ancient0119.py')
ancient0119 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ancient0119)
ancient0119.MAX_SIDE = CELL - 8


def fit(img):
    img = img.crop(img.getbbox())
    scale = (CELL - 8) / max(img.size)
    return img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)


def main():
    icons = {}
    old = Image.open(ASSETS / 'craft-materials-v041.webp').convert('RGBA')
    cw, ch = old.width / 4, old.height / 2
    for key, (cx, cy) in V041.items():
        icons[key] = fit(old.crop((round(cx * cw), round(cy * ch), round((cx + 1) * cw), round((cy + 1) * ch))))
    sheet = json.loads((ROOT / 'art/materials0141/sheets.json').read_text(encoding='utf-8'))['mats-1']
    for key, crop in zip(sheet['items'], ancient0119.items(ROOT / sheet['out'])):
        icons[key] = crop
    manifest = json.loads((ASSETS / 'manifest.json').read_text(encoding='utf-8'))
    frame = manifest['equipment']['setFrames']['seal_shard']
    page = Image.open(ASSETS / manifest['delivery'][frame['image']]).convert('RGBA')
    icons['sealShard'] = fit(page.crop((frame['x'], frame['y'], frame['x'] + frame['w'], frame['y'] + frame['h'])))
    atlas = Image.new('RGBA', (CELL * 7, CELL * 2))
    for n, key in enumerate(ORDER):
        icon = icons[key]
        atlas.alpha_composite(icon, ((n % 7) * CELL + (CELL - icon.width) // 2, (n // 7) * CELL + (CELL - icon.height) // 2))
    out = ASSETS / 'materials-v0141.webp'
    atlas.save(out, quality=88, alpha_quality=100, method=6)
    (ROOT / 'tools/reports/alpha0141-materials.json').write_text(json.dumps({'order': ORDER, 'sha256': hashlib.sha256((ROOT / sheet['out']).read_bytes()).hexdigest(), 'webpBytes': out.stat().st_size}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(out.stat().st_size)


if __name__ == '__main__':
    main()
