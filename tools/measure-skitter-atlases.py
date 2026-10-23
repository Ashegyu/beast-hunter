"""Read native RGBA pixels and update only skitter combat metadata. Never edits PNGs."""
from pathlib import Path
from PIL import Image
from scipy.ndimage import label, find_objects
import numpy as np
import json

root = Path(__file__).resolve().parents[1] / 'dist/assets'
manifest = json.loads((root / 'manifest.json').read_text())
report = {}
canonical = ['s', 'se', 'e', 'ne', 'n']
specs = [('attack', 4, [('attack', [0, 1, 2, 3])], [0, 3], {'se'}),
         ('reactions', 6, [('hurt', [0, 1]), ('death', [2, 3, 4, 5])], [1], {'se', 'e'})]
for atlas, cols, families, references, flipped in specs:
    name = f'skitter_{atlas}-v08.png'
    rgba = np.array(Image.open(root / name))
    if rgba.shape[2] != 4 or (rgba[:, :, 3] == 0).mean() < .25:
        raise ValueError(f'{name}: missing transparent gutters')
    height, width = rgba.shape[:2]
    labels, _ = label(rgba[:, :, 3] > 127)
    sizes = np.bincount(labels.ravel())
    parts = []
    for index, rect in enumerate(find_objects(labels)):
        if rect is not None and sizes[index + 1] > 1000:
            parts.append({'label': index + 1, 'rect': rect})
    if len(parts) != cols * 5:
        raise ValueError(f'{name}: expected {cols * 5} connected sprites, got {len(parts)}')
    parts.sort(key=lambda p: p['rect'][0].stop)
    for row, direction in enumerate(canonical):
        items = sorted(parts[row * cols:(row + 1) * cols], key=lambda p: p['rect'][1].start)
        measurements = []
        for column, part in enumerate(items):
            by, bx = part['rect']
            mask = labels[by, bx] == part['label']
            ys, xs = np.nonzero(mask)
            rgb = rgba[by, bx, :3].astype(float)
            red, green, blue = rgb.transpose(2, 0, 1)
            shell = mask & (blue > red + 5) & (green >= red)
            _, shell_x = np.nonzero(shell)
            if len(shell_x) < 100:
                raise ValueError(f'{name} row {row} col {column}: no readable blue carapace')
            # Shell center and foot contact follow anatomy, not generated cell placement.
            pivot_x = bx.start + float(np.median(shell_x))
            pivot_y = by.start + float(np.quantile(ys, .985))
            body = float(np.quantile(ys, .985) - np.quantile(ys, .015))
            x, y = max(0, bx.start - 2), max(0, by.start - 2)
            right, bottom = min(width, bx.stop + 2), min(height, by.stop + 2)
            region = labels[y:bottom, x:right]
            if ((region != 0) & (region != part['label']) & (sizes[region] > 1000)).any():
                raise ValueError(f'{name} row {row} col {column}: neighboring sprite in crop')
            measurements.append({'column': column, 'body': body,
                                 'rect': {'x': x, 'y': y, 'w': right - x, 'h': bottom - y,
                                          'pivotX': round(pivot_x - x, 2), 'pivotY': round(pivot_y - y, 2)}})
        body_height = round(float(np.median([measurements[i]['body'] for i in references])), 2)
        walk = manifest['clips'][manifest['directions']['skitter']['walk'][direction]]
        walk_rgba = np.array(Image.open(root / walk['image']))
        walk_offsets = []
        for frame in walk['frames']:
            crop = walk_rgba[frame['y']:frame['y'] + frame['h'], frame['x']:frame['x'] + frame['w']]
            red, green, blue = crop[:, :, :3].astype(float).transpose(2, 0, 1)
            shell = (crop[:, :, 3] > 127) & (blue > red + 5) & (green >= red)
            _, shell_x = np.nonzero(shell)
            walk_offsets.append((float(np.median(shell_x)) - frame['pivotX']) / walk['bodyHeight'])
        walk_offset = float(np.median(walk_offsets)) * (-1 if walk.get('flipX') else 1)
        for family, columns in families:
            clip_id = f'skitter_{family}_{direction}_v08'
            frames = [{**measurements[i]['rect'], 'bodyHeight': body_height} for i in columns]
            for frame in frames:
                frame['pivotX'] = round(frame['pivotX'] - walk_offset * body_height * (-1 if direction in flipped else 1), 2)
                if not 0 <= frame['pivotX'] < frame['w']:
                    raise ValueError(f'{clip_id}: calibrated ground anchor outside crop')
            manifest['clips'][clip_id] = {'id': clip_id, 'actor': 'skitter',
                'name': f'갑각충 {direction.upper()} {family}', 'image': name,
                'fps': 8, 'loop': False, 'bodyHeight': body_height,
                'flipX': direction in flipped, 'sourceColumns': columns, 'frames': frames}
            manifest['directions']['skitter'].setdefault(family, {})[direction] = clip_id
        report[f'{atlas} {direction}'] = {'bodyHeight': body_height,
            'poseHeights': [round(m['body'], 2) for m in measurements],
            'walkCanonicalShellOffsetAt88': round(walk_offset * 88, 2),
            'flipX': direction in flipped}
manifest['version'] = '0.9'
(root / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
