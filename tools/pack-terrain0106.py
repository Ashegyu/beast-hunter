"""Export Alpha 0.106 Codex-generated ground tiles as lossless WebP and register them.

Every art/terrain0106/terrain-<region>-<phase>.png becomes
dist/assets/terrain-<region>-<phase>-v0106.webp and manifest.chapters['<theme>.<phase>'].
Pixels are not resampled or repainted; the decoded WebP must equal the source RGB.
Phase-1 tiles (manifest.chapters['1'..'3']) are untouched.
"""
from pathlib import Path
import hashlib
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/terrain0106'
ASSETS = ROOT / 'dist/assets'
THEMES = {'forest': 1, 'ruins': 2, 'frost': 3}


def main():
    manifest_path = ASSETS / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    report = []
    for source in sorted(SOURCE.glob('terrain-*-*.png')):
        _, region, phase = source.stem.split('-')
        logical = f'{source.stem}-v0106.png'
        delivery = logical.replace('.png', '.webp')
        image = Image.open(source).convert('RGB')
        out = ASSETS / delivery
        image.save(out, lossless=True, exact=True, method=6)
        with Image.open(out) as decoded:
            assert decoded.convert('RGB').tobytes() == image.tobytes(), (source.name, 'WebP pixels changed')
        manifest['chapters'][f'{THEMES[region]}.{phase}'] = {'environment': logical}
        manifest['delivery'][logical] = delivery
        report.append({'source': str(source.relative_to(ROOT)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                       'size': image.size, 'delivery': delivery, 'webpBytes': out.stat().st_size, 'pixelExact': True})
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/reports/alpha0106-terrain.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
