"""Lossless format conversion only. Keep PNG originals for source QA and the lab."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / 'dist/assets'
manifest_path = assets / 'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
actors = list(manifest['directions'])
ids = {'fx_cleave_sequence'}
for actor in actors:
    for family in manifest['directions'][actor].values():
        ids.update(family.values())
paths = {manifest['loot'], manifest['chapterProps']['image'], manifest['equipment']['image']}
paths.update(chapter['environment'] for chapter in manifest['chapters'].values())
paths.update(manifest['clips'][clip]['image'] for clip in ids)
delivery = {}
rows = []
for name in sorted(paths | {'lirian_design-portrait-v09.png'}):
    source = assets / name
    target = source.with_suffix('.webp')
    with Image.open(source) as original:
        pixels = original.convert('RGBA')
        pixels.save(target, format='WEBP', lossless=True, exact=True, method=4)
        with Image.open(target) as decoded:
            assert decoded.convert('RGBA').tobytes() == pixels.tobytes(), name + ' pixel mismatch'
    delivery[name] = target.name
    rows.append({'name': name, 'pngBytes': source.stat().st_size, 'webpBytes': target.stat().st_size, 'rgbaEqual': True})
    print(name, rows[-1]['pngBytes'], '->', rows[-1]['webpBytes'], flush=True)
manifest['delivery'] = delivery
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
report = {'bootImageCount': len(paths), 'bootPngBytes': sum(row['pngBytes'] for row in rows if row['name'] in paths),
          'bootDeliveryBytes': sum(row['webpBytes'] for row in rows if row['name'] in paths), 'images': rows,
          'scope': 'Encoded transfer budget; RGBA equality verified, not a GPU memory or network timing benchmark'}
(root / 'tools/reports/alpha091-delivery.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
