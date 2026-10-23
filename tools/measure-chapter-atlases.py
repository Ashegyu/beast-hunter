"""Read generated RGBA assets and write metadata. Never writes/edits an image."""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

root = Path(__file__).resolve().parents[1]
assets = root / 'dist/assets'
manifest = json.loads((assets / 'manifest.json').read_text())
report = {'images': {}, 'rows': []}
specs = {
    'forest': [('forest_goblin', 5), ('forest_wolf', 5), ('forest_orc', 5), ('forest_guardian', 4)],
    'ruins': [('ruins_skeleton', 5), ('ruins_mage', 5), ('ruins_knight', 5), ('ruins_king', 5)],
    'frost': [('frost_wolf', 5), ('frost_mage', 4), ('frost_golem', 5), ('frost_king', 4)],
}
views = ['s', 'se', 'e', 'ne', 'n']

def read_parts(name, expected, minimum=150):
    path = assets / name
    rgba = np.array(Image.open(path).convert('RGBA'))
    if not (rgba[:, :, 3] == 0).any():
        raise ValueError(f'{name}: missing alpha transparency')
    labels, _ = label(rgba[:, :, 3] > 127)
    sizes = np.bincount(labels.ravel())
    parts = [{'label': i+1, 'rect': rect} for i, rect in enumerate(find_objects(labels)) if rect is not None and sizes[i+1] > minimum]
    if len(parts) != expected:
        raise ValueError(f'{name}: expected {expected} independent silhouettes, found {len(parts)}')
    parts.sort(key=lambda p: p['rect'][0].stop)
    report['images'][name] = {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'size': [rgba.shape[1], rgba.shape[0]], 'silhouettes': expected}
    return rgba, labels, sizes, parts

def measure_head(rgba, labels, part, species, reference_height):
    by, bx = part['rect']
    rgb = rgba[by, bx, :3].astype(float)
    mask = labels[by, bx] == part['label']
    yy, xx = np.indices(mask.shape)
    red, green, blue = rgb.transpose(2, 0, 1)
    high, low = rgb.max(axis=2), rgb.min(axis=2)
    if species in ['forest_goblin', 'forest_orc', 'forest_guardian']:
        color = (green > red*1.08) & (green > blue*1.15) & (green > 55)
    elif species in ['ruins_skeleton', 'ruins_mage', 'frost_mage', 'forest_wolf', 'frost_wolf']:
        color = (low > 100) & ((high-low)/np.maximum(high, 1) < .4)
    else:
        color = mask
    head = mask & color & (yy < max(5, reference_height*.4))
    if head.sum() < 8:
        head = mask & (yy < max(5, reference_height*.32))
    hy, hx = np.nonzero(head)
    if not len(hx):
        raise ValueError(f'{species}: missing upper-body landmark')
    return float(bx.start + np.median(hx)), float(by.start + np.median(hy))

def frame(rgba, labels, sizes, part, anchor_x, anchor_y, body, trim_border=False):
    by, bx = part['rect']
    height, width = rgba.shape[:2]
    x = min(max(0, bx.start-2), int(np.floor(anchor_x)))
    y = min(max(0, by.start-2), int(np.floor(anchor_y)))
    right = max(min(width, bx.stop+2), int(np.ceil(anchor_x))+1)
    bottom = max(min(height, by.stop+2), int(np.ceil(anchor_y))+1)
    if not (0 <= x < right <= width and 0 <= y < bottom <= height):
        raise ValueError('pivot outside atlas')
    region = labels[y:bottom, x:right]
    if trim_border:
        # A leaf tip at a neighboring prop's edge is outside this prop. Tighten
        # at most four border pixels of the source rectangle, never image data.
        for _ in range(4):
            foreign = (region != 0) & (region != part['label']) & (sizes[region] > 150)
            if not foreign.any():
                break
            fy, fx = np.nonzero(foreign)
            if fx.max() < 4: x += int(fx.max())+1
            elif fx.min() >= region.shape[1]-4: right -= region.shape[1]-int(fx.min())
            elif fy.max() < 4: y += int(fy.max())+1
            elif fy.min() >= region.shape[0]-4: bottom -= region.shape[0]-int(fy.min())
            else: break
            region = labels[y:bottom, x:right]
    if ((region != 0) & (region != part['label']) & (sizes[region] > 150)).any():
        raise ValueError('source rectangle contains a neighboring silhouette')
    if trim_border:
        anchor_x = max(x, min(anchor_x, right-1))
        anchor_y = max(y, min(anchor_y, bottom-1))
    return {'x': x, 'y': y, 'w': right-x, 'h': bottom-y, 'pivotX': round(anchor_x-x, 2), 'pivotY': round(anchor_y-y, 2), 'bodyHeight': body}

def add_row(name, rgba, labels, sizes, row_parts, species, direction):
    parts = sorted(row_parts, key=lambda p: p['rect'][1].start)
    reference = parts[0]['rect']
    body = reference[0].stop-reference[0].start-1
    foot_line = float(np.median([parts[0]['rect'][0].stop-1, parts[1]['rect'][0].stop-1]))
    first_x, first_y = measure_head(rgba, labels, parts[0], species, body)
    head_offset = first_x-(reference[1].start+reference[1].stop-1)/2
    frames, landmarks = [], []
    for column, part in enumerate(parts):
        if column < 4:
            hx, hy = measure_head(rgba, labels, part, species, body)
            anchor = hx-head_offset
            landmarks.append({'column': column, 'x': hx, 'y': hy})
        else:
            bx = part['rect'][1]
            anchor = (bx.start+bx.stop-1)/2
        try:
            frames.append(frame(rgba, labels, sizes, part, anchor, foot_line, body))
        except ValueError as error:
            raise ValueError(f'{name} {species}/{direction} column {column}: {error}') from error
    for family, columns in [('walk', [0,1]), ('attack', [2,3]), ('death', [4])]:
        ident = f'{species}_{family}_{direction}_v09'
        manifest['clips'][ident] = {'id': ident, 'actor': species, 'name': f'{species} {direction.upper()} {family}', 'image': name, 'fps': 6 if family == 'walk' else 4, 'loop': family == 'walk', 'bodyHeight': body, 'sourceColumns': columns, 'frames': [frames[c] for c in columns]}
        manifest['directions'].setdefault(species, {}).setdefault(family, {})[direction] = ident
    report['rows'].append({'species': species, 'direction': direction, 'image': name, 'bodyHeight': body, 'footLine': foot_line, 'headOffsetX': head_offset, 'landmarks': landmarks})

for biome, creatures in specs.items():
    name = f'chapter_{biome}-v09.png'
    rgba, labels, sizes, parts = read_parts(name, sum(count for _, count in creatures)*5)
    row = 0
    for species, count in creatures:
        for direction in views[:count]:
            add_row(name, rgba, labels, sizes, parts[row*5:(row+1)*5], species, direction)
            row += 1

# Correct missing back views and an east gait that had turned left. This is
# source selection from an ImageGen supplement, not pixel manipulation.
name = 'chapter_direction_patch-v09.png'
rgba, labels, sizes, parts = read_parts(name, 20)
for row, (species, direction) in enumerate([('forest_guardian','n'),('frost_mage','n'),('frost_king','n'),('frost_wolf','e')]):
    report['rows'] = [r for r in report['rows'] if (r['species'],r['direction']) != (species,direction)]
    add_row(name, rgba, labels, sizes, parts[row*5:(row+1)*5], species, direction)
for species in [species for creatures in specs.values() for species, _ in creatures]:
    for family in ['walk','attack','death']:
        manifest['directions'][species][family] = {d: manifest['directions'][species][family][d] for d in views}

for field, name in [('chapterProps','props_chapters-v09.png'),('equipment','equipment_chapters-v09.png')]:
    rgba, labels, sizes, parts = read_parts(name, 12)
    ordered = []
    for row in range(3):
        ordered.extend(sorted(parts[row*4:(row+1)*4], key=lambda p: p['rect'][1].start))
    frames = []
    for part in ordered:
        by, bx = part['rect']
        frames.append(frame(rgba, labels, sizes, part, (bx.start+bx.stop-1)/2, by.stop-1, by.stop-by.start, trim_border=True))
    manifest[field] = {'id': field+'_v09', 'actor': field, 'name': field, 'image': name, 'fps': 1, 'loop': False, 'frames': frames}
manifest['equipment']['designIds'] = ['forest_blade','forest_fang','forest_armor','forest_charm','ruins_blade','ruins_rune','ruins_armor','ruins_charm','frost_blade','frost_fang','frost_armor','frost_charm']
manifest['chapters'] = {str(i+1): {'environment': f'terrain_{biome}-v09.png'} for i, biome in enumerate(specs)}
manifest['version'] = '1.0'
(assets / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
(root / 'tools/reports/chapters-alpha09-measurements.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'species': 12, 'views': len(report['rows']), 'clips': len(manifest['clips']), 'frames': sum(len(c['frames']) for c in manifest['clips'].values()), 'images': report['images']}, indent=2))
