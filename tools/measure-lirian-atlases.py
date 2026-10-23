"""Read RGBA pixels and write sprite metadata; never modifies an image."""
from pathlib import Path
from PIL import Image
from scipy.ndimage import label, find_objects
import numpy as np
import json
import hashlib

root = Path(__file__).resolve().parents[1] / 'dist/assets'
manifest = json.loads((root / 'manifest.json').read_text())
directions = {}
report = {}
locomotion_report = {'image': 'lirian_locomotion-v05.png', 'sha256': hashlib.sha256((root / 'lirian_locomotion-v05.png').read_bytes()).hexdigest(), 'logicalHeight': 126, 'directions': {}, 'summary': {}}
specs = [(action, 6, 'v05') for action in ['locomotion', 'forehand', 'backhand', 'finisher']]
specs += [('actions', 6, 'v06'), ('death', 4, 'v06')]
for action, cols, version in specs:
    name = f'lirian_{action}-{version}.png'
    rgba = np.array(Image.open(root / name))
    height, width = rgba.shape[:2]
    labels, _ = label(rgba[:, :, 3] > 127)
    sizes = np.bincount(labels.ravel())
    parts = []
    for index, rect in enumerate(find_objects(labels)):
        if rect is not None and sizes[index + 1] > 1200:
            parts.append({'label': index + 1, 'rect': rect})
    if len(parts) != cols * 5:
        raise ValueError(f'{name}: expected {cols * 5} sprites, got {len(parts)}')
    parts.sort(key=lambda p: p['rect'][0].stop)
    for row, direction in enumerate(['s', 'se', 'e', 'ne', 'n']):
        items = sorted(parts[row * cols:(row + 1) * cols], key=lambda p: p['rect'][1].start)
        measurements = []
        for column, part in enumerate(items):
            by, bx = part['rect']
            mask = labels[by, bx] == part['label']
            rgb = rgba[by, bx, :3].astype(float)
            red, green, blue = rgb.transpose(2, 0, 1)
            hair = mask & (red > 120) & (green > 90) & (red > green * 1.035) & (blue > green * .94)
            hy, hx = np.nonzero(hair)
            head = float(hy.min()) if len(hy) else 0
            upper = hair & (np.indices(mask.shape)[0] < head + mask.shape[0] * .25)
            uy, ux = np.nonzero(upper)
            head_x = float(np.median(ux)) if len(ux) else mask.shape[1] / 2
            head_y = float(np.median(uy)) if len(uy) else head
            yy, xx = np.indices(mask.shape)
            maximum, minimum = rgb.max(axis=2), rgb.min(axis=2)
            saturation = (maximum - minimum) / np.maximum(maximum, 1)
            boots = mask & (yy > head + (mask.shape[0] - head) * .63) & (maximum < 140) & (saturation < .7) & (np.abs(xx - head_x) < (mask.shape[0] - head) * .36)
            candidates = np.flatnonzero(boots.sum(axis=1) >= max(3, mask.shape[1] * .035))
            foot = float(candidates[-1]) if len(candidates) else mask.shape[0] - 2
            low = boots & (yy > foot - max(5, (foot - head) * .12))
            _, feet_x = np.nonzero(low)
            pivot = float((np.quantile(feet_x, .05) + np.quantile(feet_x, .95)) / 2) if len(feet_x) else head_x
            foreign = (labels[by, bx] != 0) & (labels[by, bx] != part['label']) & (sizes[labels[by, bx]] > 1200)
            if foreign.any():
                raise ValueError(f'{name} row {row} column {column}: neighboring sprite in source rectangle')
            measurements.append({'part': part, 'column': column, 'foot': by.start + foot, 'pivot': bx.start + pivot, 'body': foot - head, 'headX': bx.start + head_x, 'headY': by.start + head_y})
        reference = 5 if action == 'actions' else 0
        body_height = round(measurements[reference]['body'], 2)
        pivot_offset = measurements[reference]['pivot'] - reference * width / cols
        head_offset = measurements[reference]['headX'] - measurements[reference]['pivot']
        # Low contact blades aren't feet. Anchor every pose to its ready/guard line.
        foot_line = measurements[reference]['foot'] if action in ['actions', 'death'] else float(np.median([measurements[0]['foot'], measurements[5]['foot']]))
        families = [('idle', [0, 1]), ('walk', [2, 3, 4, 5])] if action == 'locomotion' else [('dash', [0, 1, 2, 3]), ('hurt', [4, 5])] if action == 'actions' else [(action, list(range(cols)))]
        # Two generated east forehand poses turn left; retain the correct right-facing
        # contact/guard instead. This selects source poses; it never edits image pixels.
        if action == 'forehand' and direction == 'e':
            families = [('forehand', [0, 1, 2, 2, 4, 0])]
        for family, columns in families:
            clip_id = f'lirian_{family}_{direction}_{version}'
            frames = []
            for column in columns:
                m = measurements[column]
                by, bx = m['part']['rect']
                # Tight rectangles keep alpha fringes of adjacent cells out of the frame.
                # Generated poses do not occupy equally spaced cells. Align the
                # upper head to the idle reference, leaving legs/hair/cloth free
                # to animate. Do not track alternating boots or resize each pose.
                cell_anchor_x = column * width / cols + pivot_offset
                anchor_x = m['headX'] - head_offset if action == 'locomotion' else cell_anchor_x
                # Keep existing source padding so a pivot correction does not
                # incidentally crop low-alpha fringes outside the measured body.
                x, y = min(bx.start, int(np.floor(min(anchor_x, cell_anchor_x)))), min(by.start, int(np.floor(foot_line)))
                right, bottom = max(bx.stop, int(np.ceil(max(anchor_x, cell_anchor_x))) + 1), max(by.stop, int(np.ceil(foot_line)) + 1)
                if x < 0 or y < 0 or right > width or bottom > height:
                    raise ValueError(f'{clip_id}: anchor outside atlas')
                region = labels[y:bottom, x:right]
                if ((region != 0) & (region != m['part']['label']) & (sizes[region] > 1200)).any():
                    raise ValueError(f'{clip_id}: anchor padding includes neighboring sprite')
                frames.append({'x': x, 'y': y, 'w': right - x, 'h': bottom - y, 'pivotX': round(anchor_x - x, 2), 'pivotY': round(foot_line - y, 2), 'bodyHeight': body_height})
            manifest['clips'][clip_id] = {'id': clip_id, 'actor': 'hunter', 'name': f'리리안 {direction.upper()} {family}', 'image': name, 'fps': 4 if family == 'idle' else 10, 'loop': family in ['idle', 'walk'], 'bodyHeight': body_height, 'sourceColumns': columns, 'frames': frames}
            directions.setdefault(family, {})[direction] = clip_id
        report[f'{action} {direction}'] = {'bodyHeight': body_height, 'feet': [round(m['foot'], 1) for m in measurements]}
        if action == 'locomotion':
            locomotion_report['directions'][direction] = {'bodyHeight': body_height, 'footLine': foot_line, 'headOffsetX': head_offset, 'poses': [{'column': m['column'], 'headX': m['headX'], 'headY': m['headY'], 'equalCellAnchorX': m['column'] * width / cols + pivot_offset, 'anchorX': m['headX'] - head_offset} for m in measurements]}
            poses = locomotion_report['directions'][direction]['poses'][2:]
            scale = locomotion_report['logicalHeight'] / body_height
            before = [(m['headX'] - m['equalCellAnchorX']) * scale for m in poses]
            after = [(m['headX'] - m['anchorX']) * scale for m in poses]
            locomotion_report['summary'][direction] = {'beforeHorizontalSpan': round(max(before) - min(before), 3), 'afterHorizontalSpan': round(max(after) - min(after), 3), 'verticalSpan': round((max(m['headY'] for m in poses) - min(m['headY'] for m in poses)) * scale, 3)}
# Other actors and the manifest release version are owned by their own updates.
manifest['directions']['hunter'] = directions
manifest['playerCharacter'] = {**manifest.get('playerCharacter', {}), 'name': '리리안', 'subtitle': '붉은 꽃의 검사', 'assetVersion': '0.6.1', 'reference': 'user-supplied LIRIAN design sheet'}
(root / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
report_path = root.parents[1] / 'tools/reports/lirian-alpha081-alignment.json'
report_path.write_text(json.dumps(locomotion_report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
