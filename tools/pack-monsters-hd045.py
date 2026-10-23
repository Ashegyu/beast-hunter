"""Measure and losslessly pack generated monster poses. Never resamples or repaints pixels.

Only replaces existing monster clip image/geometry; gameplay and all other art remain intact.
Run after placing the twelve approved source sheets in art/monsters045/.
"""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, distance_transform_edt

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
SOURCE = ROOT / 'art/monsters045'
SPECIES = ['forest_wolf', 'forest_goblin', 'forest_orc', 'forest_guardian',
           'ruins_skeleton', 'ruins_mage', 'ruins_knight', 'ruins_king',
           'frost_wolf', 'frost_mage', 'frost_golem', 'frost_king']
DIRECTIONS = ['s', 'se', 'e', 'ne', 'n']
manifest = json.loads((ASSETS / 'manifest.json').read_text(encoding='utf-8'))
report = {'species': {}, 'atlases': [], 'scope': 'Native source pixel geometry and encoded size, not measured GPU memory or network latency'}
original = json.loads((ROOT / 'tools/reports/chapters-alpha09-measurements.json').read_text(encoding='utf-8'))
old_bodies = {(r['species'], r['direction']): r['bodyHeight'] for r in original['rows']}
report['sources'] = {}
regions = {key: [] for key in ['forest', 'ruins', 'frost']}

for species in SPECIES:
    im = Image.open(SOURCE / (species + '.png')).convert('RGBA')
    report['sources'][species] = hashlib.sha256((SOURCE / (species + '.png')).read_bytes()).hexdigest()
    rgba = np.array(im)
    assert (rgba[:, :, 3] == 0).mean() > .25, species + ': opaque backdrop'
    labels, _ = label(rgba[:, :, 3] > 127)
    sizes = np.bincount(labels.ravel())
    parts = [(i + 1, rect) for i, rect in enumerate(find_objects(labels))
             if rect is not None and sizes[i + 1] > 1500]
    assert len(parts) == 25, (species, 'expected 25 independent silhouettes', len(parts))
    # A rectangular source crop can contain the corner of a neighboring pose.
    # Assign antialias pixels to the nearest large silhouette before packing.
    # This is atlas extraction: selected source RGBA stays byte-for-byte unchanged.
    owners = np.where(sizes[labels] > 1500, labels, 0)
    owners[labels == 0] = 0
    nearest = distance_transform_edt(owners == 0, return_distances=False, return_indices=True)
    owners = owners[tuple(nearest)]
    parts.sort(key=lambda p: p[1][0].stop)
    measurements = []
    for row, direction in enumerate(DIRECTIONS):
        poses = sorted(parts[row * 5:row * 5 + 5], key=lambda p: p[1][1].start)
        # Raised weapons and flattened corpses must never change the actor's scale.
        body = float(np.median([poses[c][1][0].stop - poses[c][1][0].start for c in [0, 1]]))
        assert body >= 120, (species, direction, 'insufficient native resolution', body)
        old = old_bodies[(species, direction)]
        measurements.append({'direction': direction, 'bodyHeight': body, 'previousBodyHeight': old,
                             'nativeResolutionGain': round(body / old, 2)})
        frames = []
        for column, (component, (ys, xs)) in enumerate(poses):
            # Find the grounded anatomical center from the lower body, not a swinging weapon.
            ground = ys.stop - 1
            bottom = labels[max(ys.start, ground - int(body * .18)):ground + 1, xs] == component
            _, feet_x = np.nonzero(bottom)
            pivot_x = float(xs.start + np.median(feet_x)) if column != 4 else (xs.start + xs.stop) / 2
            x, y = max(0, xs.start - 4), max(0, ys.start - 4)
            right, end = min(im.width, xs.stop + 4), min(im.height, ys.stop + 4)
            assert xs.start > 0 and ys.start > 0 and xs.stop < im.width and ys.stop < im.height, (species, row, column, 'clipped source')
            extracted = rgba[y:end, x:right].copy()
            extracted[owners[y:end, x:right] != component] = 0
            crop = Image.fromarray(extracted)
            entry = {'species': species, 'direction': direction, 'column': column, 'pixels': crop,
                     'frame': {'w': crop.width, 'h': crop.height, 'pivotX': round(pivot_x - x, 2),
                               'pivotY': ground - y, 'bodyHeight': body}}
            frames.append(entry)
            regions[species.split('_')[0]].append(entry)
        for action, columns in [('walk', [0, 1]), ('attack', [2, 3]), ('death', [4])]:
            clip = manifest['clips'][manifest['directions'][species][action][direction]]
            clip['bodyHeight'] = body
            clip['image'] = f'monsters-{species.split("_")[0]}-v045.png'
            clip['frames'] = [frames[c]['frame'] for c in columns]
    report['species'][species] = measurements

for region, entries in regions.items():
    # Shelf packing with 4 transparent pixels around every crop avoids sampling neighbors.
    width, x, y, shelf = 2048, 4, 4, 0
    for entry in sorted(entries, key=lambda p: -p['pixels'].height):
        pixels, frame = entry['pixels'], entry['frame']
        if x + pixels.width + 4 > width:
            x, y, shelf = 4, y + shelf + 8, 0
        frame['x'], frame['y'] = x, y
        x += pixels.width + 8
        shelf = max(shelf, pixels.height)
    height = y + shelf + 4
    assert height <= 4096, (region, height)
    atlas = Image.new('RGBA', (width, height))
    for entry in entries:
        frame, crop = entry['frame'], entry['pixels']
        atlas.paste(crop, (frame['x'], frame['y']))
        # Copy proof includes transparent RGB and semitransparent outline pixels.
        assert atlas.crop((frame['x'], frame['y'], frame['x'] + crop.width, frame['y'] + crop.height)).tobytes() == crop.tobytes()
    name = f'monsters-{region}-v045.png'
    atlas.save(ASSETS / name)
    atlas.save((ASSETS / name).with_suffix('.webp'), lossless=True, exact=True, method=4)
    with Image.open((ASSETS / name).with_suffix('.webp')) as decoded:
        assert decoded.convert('RGBA').tobytes() == atlas.tobytes()
    manifest['delivery'][name] = name.replace('.png', '.webp')
    report['atlases'].append({'image': name, 'width': width, 'height': height,
                             'sha256': hashlib.sha256((ASSETS / name).read_bytes()).hexdigest(),
                             'decodedRGBABytes': width * height * 4,
                             'webpBytes': (ASSETS / name).with_suffix('.webp').stat().st_size,
                             'pixelExact': True, 'frames': len(entries)})

(ASSETS / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'tools/reports/alpha045-monsters.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
