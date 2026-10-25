"""Alpha 0.125: 괴수 기술 icons cut from each chapter boss atlas (no new generated art).

For every technique in dist/beast-techniques.js order, the boss's south-east attack-contact frame is fitted into a
256×256 RGB icon over a dark radial backdrop tinted with the technique's region element colour and ringed in it.
Output: dist/assets/skills/beast/<key>.webp (key = boss species without the 'boss_<biome>_' prefix).
"""
from pathlib import Path
import json
import subprocess

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
OUT = ASSETS / 'skills/beast'
SIZE = 256


def rows():
    script = "import('./dist/game-engine.js').then(g=>console.log(JSON.stringify(g.BEAST_TECHNIQUES.map(d=>({icon:d.icon,boss:d.bossSpecies,color:d.color})))))"
    return json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT, text=True))


def main():
    manifest = json.loads((ASSETS / 'manifest.json').read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    atlases = {}
    for row in rows():
        clip = manifest['clips'][manifest['directions'][row['boss']]['attack']['se']]
        frame = clip['frames'][min(1, len(clip['frames']) - 1)]
        image = clip['image']
        if image not in atlases:
            atlases[image] = Image.open(ASSETS / manifest['delivery'].get(image, image)).convert('RGBA')
        crop = atlases[image].crop((frame['x'], frame['y'], frame['x'] + frame['w'], frame['y'] + frame['h']))
        crop = crop.crop(crop.getbbox())
        scale = 214 / max(crop.size)
        crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.LANCZOS)
        color = tuple(int(row['color'][i:i + 2], 16) for i in (1, 3, 5))
        icon = Image.new('RGB', (SIZE, SIZE), (14, 12, 18))
        glow = Image.new('L', (SIZE, SIZE), 0)
        ImageDraw.Draw(glow).ellipse((28, 28, SIZE - 28, SIZE - 28), fill=150)
        glow = glow.filter(ImageFilter.GaussianBlur(34))
        icon.paste(Image.new('RGB', (SIZE, SIZE), tuple(c // 2 for c in color)), (0, 0), glow)
        icon.paste(crop, ((SIZE - crop.width) // 2, (SIZE - crop.height) // 2 + 6), crop)
        ImageDraw.Draw(icon).ellipse((6, 6, SIZE - 7, SIZE - 7), outline=color, width=6)
        icon.save(ROOT / 'dist' / row['icon'], quality=88, method=6)
    print(len(list(OUT.glob('*.webp'))), 'icons')


if __name__ == '__main__':
    main()
