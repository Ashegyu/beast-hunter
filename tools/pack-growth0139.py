"""Alpha 0.139: pack the Codex 성장 트리 node emblems (art/growth0139/node-1..7.png, 4x2 grid, 7 per sheet) into one atlas.

Each emblem is cut by its grid cell (not by connected parts: keystone rims may touch), trimmed to its alpha box,
padded to a square and resized to CELL px. Order = the `items` of sheets.json, sheet by sheet; the atlas is
COLUMNS wide. tools/make-growth-tree0139.mjs reads the same order to place each node's icon.
Usage: python3 tools/pack-growth0139.py
"""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'art/growth0139'
OUT = ROOT / 'dist/assets/growth-tree-v0139.webp'
CELL, COLUMNS = 96, 7

specs = json.loads((ART / 'sheets.json').read_text(encoding='utf-8'))
icons = []
for sid, spec in specs.items():
    sheet = Image.open(ROOT / spec['out']).convert('RGBA')
    w, h = sheet.size
    for i, item in enumerate(spec['items']):
        cx, cy = i % 4, i // 4
        cell = sheet.crop((round(cx * w / 4), round(cy * h / 2), round((cx + 1) * w / 4), round((cy + 1) * h / 2)))
        box = cell.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
        part = cell.crop(box)
        side = max(part.size)
        square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        square.paste(part, ((side - part.width) // 2, (side - part.height) // 2))
        icons.append((item, square.resize((CELL, CELL), Image.LANCZOS)))
rows = (len(icons) + COLUMNS - 1) // COLUMNS
atlas = Image.new('RGBA', (CELL * COLUMNS, CELL * rows), (0, 0, 0, 0))
for n, (_, icon) in enumerate(icons):
    atlas.paste(icon, ((n % COLUMNS) * CELL, (n // COLUMNS) * CELL))
atlas.save(OUT, 'WEBP', quality=88, method=6)
print(OUT.relative_to(ROOT), atlas.size, len(icons), 'icons', OUT.stat().st_size, 'bytes')
