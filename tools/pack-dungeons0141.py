"""Pack the Alpha 0.141 dungeon hall scenes (art/dungeons0141/<id>.png, Codex CLI) into dist/assets/dungeon-<id>-v0141.webp.

Each 1536x1024 scene is resized to 768x512 and saved as lossy WebP (painterly art). layout-fit.css uses them as the
growth dungeon and raid card backgrounds, the entry panel banner, the 무한의 탑 and 보스 러시 panels. Re-running overwrites them.
"""
from pathlib import Path
import hashlib
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IDS = ['gold', 'enhance', 'promote', 'skill', 'xp', 'craft', 'tower', 'raid-colossus', 'raid-queen', 'raid-judge', 'rush']


def main():
    report = []
    for key in IDS:
        source = ROOT / f'art/dungeons0141/{key}.png'
        out = ROOT / f'dist/assets/dungeon-{key}-v0141.webp'
        Image.open(source).convert('RGB').resize((768, 512), Image.LANCZOS).save(out, quality=82, method=6)
        report.append({'id': key, 'source': str(source.relative_to(ROOT)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'webpBytes': out.stat().st_size})
    (ROOT / 'tools/reports/alpha0141-dungeon-scenes.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(sum(r['webpBytes'] for r in report))


if __name__ == '__main__':
    main()
