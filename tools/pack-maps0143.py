"""Pack the Alpha 0.143 hunting map region scenes (art/maps0143/r<1-6>.png, Codex CLI) into dist/assets/hunt-map-r<n>-v0143.webp.

Each 1536x1024 scene is resized to 1280x853 and saved as lossy WebP (painterly art). layout-fit.css picks one by
#camp-drawer[data-map-region] (app.js sets it from the selected chapter: 1-10 → 1 … 51-60 → 6). Re-running overwrites them.
"""
from pathlib import Path
import hashlib
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def main():
    report = []
    for n in range(1, 7):
        source = ROOT / f'art/maps0143/r{n}.png'
        out = ROOT / f'dist/assets/hunt-map-r{n}-v0143.webp'
        Image.open(source).convert('RGB').resize((1280, 853), Image.LANCZOS).save(out, quality=80, method=6)
        report.append({'id': f'r{n}', 'source': str(source.relative_to(ROOT)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'webpBytes': out.stat().st_size})
    (ROOT / 'tools/reports/alpha0143-map-scenes.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(sum(r['webpBytes'] for r in report))


if __name__ == '__main__':
    main()
