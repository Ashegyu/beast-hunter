"""Pack the Alpha 0.141 stat emblems (art/growth0141/stat-1~2.png, Codex CLI) into dist/assets/growth-stats-v0141.webp.

Each sheet holds five round emblems in a 3x2 grid with the bottom-right cell empty (cut like tools/pack-ancient0119.py).
The atlas is 5 columns x 2 rows of 128px cells in sheets.json `items` order: power vitality guard precision tempo /
stride might life slayer arts. layout-fit.css places them with background-position (`data-stat`).
"""
from pathlib import Path
import hashlib
import importlib.util
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CELL = 128
spec = importlib.util.spec_from_file_location('ancient0119', ROOT / 'tools/pack-ancient0119.py')
ancient0119 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ancient0119)
ancient0119.MAX_SIDE = CELL - 4


def main():
    sheets = json.loads((ROOT / 'art/growth0141/sheets.json').read_text(encoding='utf-8'))
    ids, crops, report = [], [], []
    for key, sheet in sheets.items():
        source = ROOT / sheet['out']
        ids += sheet['items']
        crops += ancient0119.items(source)
        report.append({'sheet': key, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    atlas = Image.new('RGBA', (CELL * 5, CELL * 2))
    for n, crop in enumerate(crops):
        atlas.alpha_composite(crop, ((n % 5) * CELL + (CELL - crop.width) // 2, (n // 5) * CELL + (CELL - crop.height) // 2))
    out = ROOT / 'dist/assets/growth-stats-v0141.webp'
    atlas.save(out, quality=88, alpha_quality=100, method=6)
    (ROOT / 'tools/reports/alpha0141-growth-stats.json').write_text(json.dumps({'ids': ids, 'sources': report, 'webpBytes': out.stat().st_size}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(ids, out.stat().st_size)


if __name__ == '__main__':
    main()
