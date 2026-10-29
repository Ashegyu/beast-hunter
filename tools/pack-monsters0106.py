"""Losslessly extract and shelf-pack Codex-generated monster sheets.

Usage: python3 tools/pack-monsters0106.py [art/monsters0106 v0106 | art/monsters0107 v0107]

Every PNG in the folder is packed, one atlas per species (a chapter loads only
its six stage species and its boss). Re-running rebuilds every entry of that tag
and leaves other assets untouched.

Source RGBA is never resampled or repainted. Connected detached body parts and
spores are assigned to their nearest large body silhouette before extraction.
Only clips/directions/delivery entries of the given tag are added or replaced.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
import sys
SOURCE = ROOT / (sys.argv[1] if len(sys.argv) > 1 else 'art/monsters0106')
ASSETS = ROOT / 'dist/assets'
SPECIES = sorted(p.stem for p in SOURCE.glob('*.png'))
TAG = sys.argv[2] if len(sys.argv) > 2 else 'v0106'
DIRECTIONS = ['s', 'se', 'e', 'ne', 'n']
ACTIONS = [('walk', [0, 1], 6, True), ('attack', [2, 3], 4, False), ('death', [4], 4, False)]
# Source-measured empty row gaps for detached spores/crystal arms. Without row
# ownership, a high spore from the next row can be closer to the previous feet.
# These are extraction coordinates, not painting or animation transforms.
ROW_BANDS = {}


def atlas_group(species):
    """Every species gets its own atlas, so a chapter downloads only the six
    species its stages use plus its boss (Alpha 0.107)."""
    return species


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def assign_parts(core_owners, labels):
    """Keep every disconnected opaque part whole, then recover edge alpha.

    A long detached ice arm can span closer to the neighboring corpse. Assign
    the entire component by its closest connection to a body, rather than
    cutting that arm at the Voronoi boundary between two sprites.
    """
    distances, nearest = distance_transform_edt(core_owners == 0, return_indices=True)
    nearest_core = core_owners[tuple(nearest)]
    component_owners = np.zeros_like(core_owners)
    for component, rect in enumerate(find_objects(labels), 1):
        if rect is None:
            continue
        mask = labels[rect] == component
        yy, xx = np.nonzero(mask)
        local_core = core_owners[rect]
        if np.any(local_core[mask]):
            owner = int(local_core[mask].max())
        else:
            local_distances = distances[rect][yy, xx]
            closest = int(np.argmin(local_distances))
            owner = int(nearest_core[rect][yy[closest], xx[closest]])
        target = component_owners[rect]
        target[mask] = owner
    nearest = distance_transform_edt(component_owners == 0, return_distances=False, return_indices=True)
    return component_owners[tuple(nearest)]


def pack():
    manifest_path = ASSETS / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    # Drop every earlier v0106 entry so removed or renamed sheets do not linger.
    manifest['clips'] = {key: value for key, value in manifest['clips'].items() if not key.endswith('_' + TAG)}
    manifest['directions'] = {key: value for key, value in manifest['directions'].items()
                              if not any(i.endswith('_' + TAG) for f in value.values() for i in f.values())}
    # Only monster atlases of this tag (0.142: other packers also use the v0142 tag for their own pages).
    manifest['delivery'] = {key: value for key, value in manifest['delivery'].items() if not (key.startswith('monsters-') and TAG in key)}
    old_clips = dict(manifest['clips'])
    old_directions = dict(manifest['directions'])
    report = {
        'kind': 'generated-source-extraction-and-lossless-atlas',
        'scope': 'Native pixel geometry and encoded/decoded size; no browser/GPU measurements.',
        'sources': {}, 'species': {}, 'atlases': [],
        'method': '25 largest body cores; validated row bands for detached spores/shards; whole opaque parts assigned to closest body connection, then nearest-part edge alpha; no resampling or repainting',
    }
    regions = {}
    for species in SPECIES:
        source_path = SOURCE / f'{species}.png'
        im = Image.open(source_path).convert('RGBA')
        rgba = np.array(im)
        alpha = rgba[:, :, 3]
        assert (alpha == 0).mean() > .25, f'{species}: missing real transparency'
        labels, _ = label(alpha > 127)
        sizes = np.bincount(labels.ravel())
        candidates = [(i + 1, rect) for i, rect in enumerate(find_objects(labels))
                      if rect is not None and sizes[i + 1] > 1500]
        # The extra connected components on mushroom/wisp are spores or arms,
        # smaller than every core. Their original RGBA is retained below.
        parts = sorted(candidates, key=lambda p: -sizes[p[0]])[:25]
        assert len(parts) == 25, (species, 'expected 25 body cores', len(parts))
        assert min(sizes[p[0]] for p in parts) > 5000, (species, 'body-core threshold')
        selected = np.zeros(len(sizes), dtype=bool)
        selected[[p[0] for p in parts]] = True
        selected[0] = False
        core_owners = np.where(selected[labels], labels, 0)
        # Group by baseline rather than top: windups and corpses have different heights.
        parts.sort(key=lambda p: p[1][0].stop)
        if species in ROW_BANDS:
            bands = ROW_BANDS[species]
            assert bands[-1] == im.height, (species, 'row bands require remeasurement')
            owners = np.zeros_like(core_owners)
            for row in range(5):
                top, end = bands[row:row + 2]
                for _, (ys, _) in parts[row * 5:row * 5 + 5]:
                    assert top <= ys.start < ys.stop <= end, (species, row, 'row band clips body')
                row_cores = core_owners[top:end]
                owners[top:end] = assign_parts(row_cores, labels[top:end])
        else:
            owners = assign_parts(core_owners, labels)
        manifest['directions'][species] = {action: {} for action, *_ in ACTIONS}
        measurements = []
        report['sources'][species] = sha256(source_path)
        for row, direction in enumerate(DIRECTIONS):
            poses = sorted(parts[row * 5:row * 5 + 5], key=lambda p: p[1][1].start)
            # Check the measured row/column ordering rather than assuming cells
            # were rendered at mathematically exact positions by image generation.
            assert len(poses) == 5
            body = float(np.median([poses[c][1][0].stop - poses[c][1][0].start for c in [0, 1]]))
            assert body >= 120, (species, direction, 'insufficient native body detail', body)
            frames = []
            frame_measurements = []
            for column, (component, (ys, xs)) in enumerate(poses):
                assert 0 < xs.start < xs.stop < im.width and 0 < ys.start < ys.stop < im.height, \
                    (species, direction, column, 'clipped opaque body')
                belongs = (owners == component) & (alpha > 0)
                pixel_y, pixel_x = np.nonzero(belongs)
                assert len(pixel_x), (species, direction, column, 'empty extraction')
                # Bounds include all original semitransparent halo/body pixels
                # belonging to this pose, with four transparent sampling pixels.
                x, y = max(0, int(pixel_x.min()) - 4), max(0, int(pixel_y.min()) - 4)
                right, bottom = min(im.width, int(pixel_x.max()) + 5), min(im.height, int(pixel_y.max()) + 5)
                ground = ys.stop - 1
                lower = labels[max(ys.start, ground - int(body * .18)):ground + 1, xs] == component
                _, feet_x = np.nonzero(lower)
                pivot_x = float(xs.start + np.median(feet_x)) if column != 4 else (xs.start + xs.stop) / 2
                source_pixels = rgba[y:bottom, x:right].copy()
                mask = owners[y:bottom, x:right] == component
                source_pixels[~mask] = 0
                crop = Image.fromarray(source_pixels)
                # Selected RGBA values, including alpha and transparent RGB,
                # are an exact copy. Only neighboring poses are zeroed.
                assert np.array_equal(np.array(crop)[mask], rgba[y:bottom, x:right][mask])
                frame = {'w': crop.width, 'h': crop.height,
                         'pivotX': round(pivot_x - x, 2), 'pivotY': ground - y,
                         'bodyHeight': body}
                entry = {'species': species, 'direction': direction, 'column': column,
                         'pixels': crop, 'frame': frame}
                regions.setdefault(atlas_group(species), []).append(entry)
                frames.append(frame)
                frame_measurements.append({
                    'column': column, 'core': [xs.start, ys.start, xs.stop, ys.stop],
                    'crop': [x, y, right, bottom], 'pivotX': frame['pivotX'],
                    'pivotY': frame['pivotY'], 'bodyHeight': body,
                    'sourcePixelsExact': True,
                    'rgbaSHA256': hashlib.sha256(crop.tobytes()).hexdigest(),
                })
            measurements.append({'direction': direction, 'bodyHeight': body, 'frames': frame_measurements})
            for action, columns, fps, loop in ACTIONS:
                clip_id = f'{species}_{action}_{direction}_{TAG}'
                manifest['directions'][species][action][direction] = clip_id
                manifest['clips'][clip_id] = {
                    'id': clip_id, 'actor': species, 'name': f'{species} {direction.upper()} {action}',
                    'image': f'monsters-{atlas_group(species)}-{TAG}.png',
                    'fps': fps, 'loop': loop, 'bodyHeight': body, 'sourceColumns': columns,
                    'frames': [frames[c] for c in columns],
                }
        report['species'][species] = {
            'source': str((SOURCE / f'{species}.png').relative_to(ROOT)), 'sha256': report['sources'][species],
            'width': im.width, 'height': im.height,
            'transparentFraction': round(float((alpha == 0).mean()), 6),
            'bodyCores': 25, 'independentComponentsOver1500px': len(candidates),
            'rowBands': ROW_BANDS.get(species),
            'directions': measurements, 'frames': 25,
        }

    for region, entries in regions.items():
        width, x, y, shelf = 2048, 4, 4, 0
        for entry in sorted(entries, key=lambda p: -p['pixels'].height):
            crop, frame = entry['pixels'], entry['frame']
            assert crop.width + 8 <= width, (region, 'oversized crop')
            if x + crop.width + 4 > width:
                x, y, shelf = 4, y + shelf + 8, 0
            frame['x'], frame['y'] = x, y
            x += crop.width + 8
            shelf = max(shelf, crop.height)
        height = y + shelf + 4
        assert height <= 4096, (region, height, 'atlas limit')
        atlas = Image.new('RGBA', (width, height))
        for entry in entries:
            frame, crop = entry['frame'], entry['pixels']
            atlas.paste(crop, (frame['x'], frame['y']))
            assert atlas.crop((frame['x'], frame['y'], frame['x'] + crop.width,
                               frame['y'] + crop.height)).tobytes() == crop.tobytes()
        logical = f'monsters-{region}-{TAG}.png'
        delivery = logical.replace('.png', '.webp')
        output_path = ASSETS / delivery
        atlas.save(output_path, lossless=True, exact=True, method=6)
        with Image.open(output_path) as decoded:
            assert decoded.convert('RGBA').tobytes() == atlas.tobytes(), (region, 'WebP pixels changed')
        manifest['delivery'][logical] = delivery
        report['atlases'].append({
            'image': logical, 'delivery': delivery, 'width': width, 'height': height,
            'frames': len(entries), 'sha256WebP': sha256(output_path),
            'sha256RGBA': hashlib.sha256(atlas.tobytes()).hexdigest(),
            'decodedRGBABytes': width * height * 4, 'webpBytes': output_path.stat().st_size,
            'pixelExact': True,
        })
        for entry in entries:
            species_report = report['species'][entry['species']]
            directional = next(d for d in species_report['directions'] if d['direction'] == entry['direction'])
            measured = directional['frames'][entry['column']]
            measured['atlas'] = logical
            measured['atlasRect'] = [entry['frame']['x'], entry['frame']['y'], entry['frame']['w'], entry['frame']['h']]

    # These are identity/geometry invariants for the established asset system.
    assert old_clips == {key: value for key, value in manifest['clips'].items()
                         if value.get('actor') not in SPECIES}
    assert old_directions == {key: value for key, value in manifest['directions'].items() if key not in SPECIES}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    report_path = ROOT / f'tools/reports/alpha{TAG[1:]}-monsters.json'
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'report': str(report_path), 'species': len(SPECIES),
                      'atlases': report['atlases']}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    pack()
