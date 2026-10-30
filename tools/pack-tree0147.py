"""Alpha 0.147.1: pack the 성장 트리 connector strips (art/tree0147/branch-1.png, four horizontal branches) into
dist/assets/tree-branches-v0147.webp — four 512x48 rows, each strip trimmed to its own bounds and stretched to the row.
CSS lays row --v of it between two nodes (layout-fit.css '0.147.1 성장 트리 연결선')."""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, binary_dilation

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'art/tree0147/branch-1.png'
OUT = ROOT / 'dist/assets/tree-branches-v0147.webp'
W, H = 512, 48

img = Image.open(SRC).convert('RGBA')
alpha = np.asarray(img)[..., 3] > 24
lab, n = label(binary_dilation(alpha, iterations=6))
parts = sorted((s for s in find_objects(lab) if s is not None), key=lambda s: (s[1].stop - s[1].start) * (s[0].stop - s[0].start), reverse=True)[:4]
parts.sort(key=lambda s: s[0].start)
if len(parts) != 4:
    raise SystemExit(f'expected 4 strips, found {len(parts)}')
sheet = Image.new('RGBA', (W, H * 4), (0, 0, 0, 0))
for row, (ys, xs) in enumerate(parts):
    crop = img.crop((xs.start, ys.start, xs.stop, ys.stop))
    # Each row holds the whole strip; CSS repeats it along a link at its own aspect, so it is never squeezed.
    h = H - 4
    strip = crop.resize((W, h), Image.LANCZOS)
    sheet.paste(strip, (0, row * H + (H - h) // 2), strip)
    print(f'strip {row + 1}: source {crop.width}x{crop.height} -> {W}x{h}')
sheet.save(OUT, 'WEBP', quality=90, method=6)
print(OUT.relative_to(ROOT), OUT.stat().st_size, 'bytes')
