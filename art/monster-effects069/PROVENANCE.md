# Monster effect artwork · Alpha 0.69

Generated with the built-in `image_gen` tool, transparent background enabled. No external stock images or CLI fallback were used. Complete prompts and copied project paths: [prompts.json](prompts.json). Original generated files remain intact; runtime encoding uses lossless WebP with `exact=True` so even RGB under fully transparent pixels is preserved. Original SHA-256, decoded RGBA SHA-256, alpha statistics, frame rectangles and pivots are recorded in [qa.json](qa.json).

| Region | Original in this repository | Runtime asset |
| --- | --- | --- |
| Forest | art/monster-effects069/forest-original.png | dist/assets/monster-effects-forest-v069.webp |
| Ruins | art/monster-effects069/ruins-original.png | dist/assets/monster-effects-ruins-v069.webp |
| Frost | art/monster-effects069/frost-original.png | dist/assets/monster-effects-frost-v069.webp |

Every sheet contains four rows (slash, projectile, impact, charge) and four animation stages (formation, contact, aftermath, remnant). The result is three 1254×1254 RGBA sheets, despite the requested 1024×1024. Actual integer cell boundaries alternate 313/314 pixels; the manifest uses those measured sizes. These are generated bitmap stages with transform playback, not sixteen independently hand-drawn skeleton/rig animations. Some fine glow reaches the cell edge; sampling is constrained to each measured rectangle. No claim is made that the requested 24px padding was uniformly met.

Directional art faces right. Projectile pivots are measured at the bright leading core, rather than the center of the trailing smoke. Ground impacts use a lower ground contact pivot. The world renderer owns direction, flight-height projection and timing; the generated bitmap does not determine hitboxes, damage or pathfinding.

Pack again from the retained originals with `python tools/pack-monster-effects069.py`. The packer only encodes/formats original pixels, records measured regions and validates exact RGBA equality. View the engine-rendered review using `node tools/render-effects069.mjs`; the PNGs in art/quality069 are offline checks, not browser screenshots.
