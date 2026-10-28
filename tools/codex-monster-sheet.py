"""Generate 25-pose monster sprite sheets with the Codex CLI built-in image_gen tool.

Usage:
  python3 tools/codex-monster-sheet.py SPEC.json ID [ID ...] [--attempts N]

SPEC.json maps an id to {"out", "style", "subject", "reference"?} for a 25-pose sheet,
or {"kind": "terrain", "out", "style", "prompt"} for one opaque square ground tile,
or {"kind": "sprite", "minParts", "out", "style", "prompt"} for a transparent props/effects sheet,
or {"kind": "scene", "out", "style", "prompt"} for one opaque landscape illustration (UI banners, Alpha 0.141).
Each run asks Codex to generate one sheet and copy the PNG to `out`. The sheet is
accepted only when it has real transparency and 25 separate full-body poses in a
5x5 layout; otherwise it is regenerated (up to --attempts). Prompts, reference
hashes, attempt results and the final SHA-256 are written to prompts/<id>.json next to out.
Generated pixels are never repainted here.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import time

import numpy as np
from PIL import Image
from scipy.ndimage import find_objects, label

ROOT = Path(__file__).resolve().parents[1]

LAYOUT = (
    "OUTPUT: genuinely transparent RGBA, no matte, no checkerboard, no background, no floor, no shadow oval. "
    "Square 2048x2048 or larger native pixels. Exactly 25 separate full-body monster silhouettes in a perfectly "
    "regular 5 columns x 5 rows invisible grid. Each cell same dimensions and clear padding; poses never touch each "
    "other or the canvas edge. No labels, text, frame borders, UI, grid lines, glow background, extra monsters or scenery.\n"
    "DIRECTIONS by ROW top-to-bottom: row1 front facing screen/down (south); row2 front-right three-quarter (southeast); "
    "row3 right profile (east); row4 back-right three-quarter (northeast); row5 back facing screen/up (north). "
    "Actually turn anatomy, faces and bodies in each row; do not repeat the front view.\n"
    "ACTIONS by COLUMN left-to-right: 1 walk A planted left foot; 2 walk B visibly alternating limbs; 3 attack windup; "
    "4 attack contact with a distinct forward action; 5 dead body lying flat on the ground. Keep each direction's body "
    "scale unchanged across actions. Feet or grounded contact point aligned near the cell bottom; full anatomy, no clipping. "
    "This is ONE creature repeated 25 times for animation, not a monster catalog."
)


def build_prompt(spec):
    roles = "Image1 is STYLE/LAYOUT reference ONLY: match its crisp finely detailed high-resolution pixel-illustrated fantasy sprites, dark ink outlines, 3/4 overhead RPG camera, shading and level of detail; never copy its subject."
    if spec.get('reference'):
        roles += f" Image2 is SUBJECT CONCEPT reference only: {spec['reference_hint']}."
    return (f"Use case: stylized-concept. Asset type: production monster sprite animation sheet for an existing 2D action RPG.\n"
            f"REFERENCE ROLES: {roles} Produce a brand-new single-species sheet.\n{LAYOUT}\nSUBJECT: {spec['subject']}")


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def validate_terrain(path):
    im = Image.open(path)
    w, h = im.size
    alpha = np.array(im.convert('RGBA'))[:, :, 3]
    if w != h or w < 1024:
        return False, {'reason': 'not a large square tile', 'size': im.size}
    if (alpha < 255).mean() > .001:
        return False, {'reason': 'terrain must be opaque', 'size': im.size}
    return True, {'size': im.size}


def validate_scene(path):
    im = Image.open(path)
    w, h = im.size
    alpha = np.array(im.convert('RGBA'))[:, :, 3]
    if w < 1024 or w < h * 1.3:
        return False, {'reason': 'not a large landscape image', 'size': im.size}
    if (alpha < 255).mean() > .001:
        return False, {'reason': 'scene must be opaque', 'size': im.size}
    return True, {'size': im.size}


def validate_sprite(path, min_parts):
    """Transparent sheet with at least min_parts separate opaque objects (props, effects)."""
    im = Image.open(path)
    if im.mode != 'RGBA':
        return False, {'reason': f'mode {im.mode}'}
    alpha = np.array(im)[:, :, 3]
    transparent = float((alpha == 0).mean())
    labels, count = label(alpha > 127)
    sizes = np.bincount(labels.ravel())[1:]
    parts = int((sizes > 2000).sum())
    details = {'size': im.size, 'transparent': round(transparent, 3), 'parts': parts}
    if transparent < .3:
        return False, {**details, 'reason': 'missing real transparency'}
    if parts < min_parts:
        return False, {**details, 'reason': f'fewer than {min_parts} separate objects'}
    return True, details


def validate(path):
    """Return (ok, details). Mirrors the core checks of tools/pack-monsters065.py."""
    im = Image.open(path)
    if im.mode != 'RGBA':
        return False, {'reason': f'mode {im.mode}'}
    alpha = np.array(im)[:, :, 3]
    transparent = float((alpha == 0).mean())
    if transparent < .25:
        return False, {'reason': 'missing real transparency', 'transparent': transparent}
    labels, _ = label(alpha > 127)
    sizes = np.bincount(labels.ravel())
    rects = [(i + 1, r) for i, r in enumerate(find_objects(labels)) if r is not None and sizes[i + 1] > 1500]
    cores = sorted(rects, key=lambda p: -sizes[p[0]])[:25]
    details = {'size': im.size, 'transparent': round(transparent, 3), 'components': len(rects)}
    if len(cores) < 25 or min(sizes[c[0]] for c in cores) <= 5000:
        return False, {**details, 'reason': 'fewer than 25 separate body cores'}
    if len(rects) > 25 and sizes[sorted(rects, key=lambda p: -sizes[p[0]])[25][0]] > .6 * min(sizes[c[0]] for c in cores):
        return False, {**details, 'reason': 'extra large silhouettes (more than 25 bodies)'}
    cores.sort(key=lambda p: p[1][0].stop)
    for row in range(5):
        band = cores[row * 5:row * 5 + 5]
        if row < 4:
            lowest = max(r[0].stop for _, r in band)
            nxt = min(r[0].stop for _, r in cores[row * 5 + 5:row * 5 + 10])
            if lowest >= nxt:
                return False, {**details, 'reason': f'row {row + 1} baselines overlap the next row'}
        for _, (ys, xs) in band:
            if ys.start == 0 or xs.start == 0 or ys.stop == im.height or xs.stop == im.width:
                return False, {**details, 'reason': 'pose touches canvas edge'}
        walk = sorted(band, key=lambda p: p[1][1].start)[:2]
        heights = [ys.stop - ys.start for _, (ys, _) in walk]
        if min(heights) < 120:
            return False, {**details, 'reason': 'insufficient body detail', 'height': min(heights)}
    return True, details


def generate(species, spec, attempts):
    out = ROOT / spec['out']
    out.parent.mkdir(parents=True, exist_ok=True)
    work = out.parent / '.codex-work'
    work.mkdir(exist_ok=True)
    images = [ROOT / spec['style']] + ([ROOT / spec['reference']] if spec.get('reference') else [])
    terrain = spec.get('kind') == 'terrain'
    sprite = spec.get('kind') == 'sprite'
    scene = spec.get('kind') == 'scene'
    prompt = spec['prompt'] if terrain or sprite or scene else build_prompt(spec)
    log = []
    for attempt in range(1, attempts + 1):
        target = work / f'{species}-try{attempt}.png'
        target.unlink(missing_ok=True)
        instruction = (f"Use your built-in image generation tool (image_gen) exactly once with the prompt below and the attached "
                       f"images as references. Do not draw with code, do not edit pixels, do not use any API or CLI fallback. "
                       f"After generation, copy the generated PNG unchanged to {target} and reply with only that path.\n\n"
                       f"IMAGE PROMPT:\n{prompt}")
        cmd = ['codex', 'exec', '--skip-git-repo-check', '-s', 'workspace-write', '-C', str(work)]
        for image in images:
            cmd += ['-i', str(image)]
        started = time.time()
        run = subprocess.run(cmd + ['-'], input=instruction, text=True, capture_output=True, timeout=1500)
        (work / f'{species}-try{attempt}.log').write_text(run.stdout[-20000:] + '\n--- stderr ---\n' + run.stderr[-5000:], encoding='utf-8')
        if not target.exists():
            log.append({'attempt': attempt, 'ok': False, 'reason': 'no image produced', 'seconds': round(time.time() - started)})
            continue
        ok, details = validate_terrain(target) if terrain else validate_scene(target) if scene else validate_sprite(target, spec['minParts']) if sprite else validate(target)
        log.append({'attempt': attempt, 'ok': ok, **details, 'seconds': round(time.time() - started), 'sha256': sha256(target)})
        print(species, attempt, ok, details, flush=True)
        if ok:
            target.replace(out)
            break
    record = {'id': species, 'mode': 'codex exec built-in image_gen', 'prompt': prompt,
              'referenceImages': [{'path': str(p.relative_to(ROOT)), 'sha256': sha256(p)} for p in images],
              'attempts': log, 'final': {'path': spec['out'], 'sha256': sha256(out)} if out.exists() and log and log[-1]['ok'] else None}
    # One record per species so parallel runs never overwrite each other.
    prompts_dir = out.parent / 'prompts'
    prompts_dir.mkdir(exist_ok=True)
    (prompts_dir / f'{species}.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return record['final'] is not None


def main():
    args = sys.argv[1:]
    attempts = 3
    if '--attempts' in args:
        i = args.index('--attempts'); attempts = int(args[i + 1]); del args[i:i + 2]
    specs = json.loads(Path(args[0]).read_text(encoding='utf-8'))
    failed = [s for s in args[1:] if not generate(s, specs[s], attempts)]
    if failed:
        print('FAILED', failed)
        sys.exit(1)


if __name__ == '__main__':
    main()
