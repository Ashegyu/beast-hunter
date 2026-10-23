# Alpha 0.80 UI image provenance

Created with the built-in `image_gen.imagegen` tool, with `transparent_background: true`. Five generated PNG sources are preserved unchanged. No external image download or image post-processing was used. Pillow converted delivery files to lossless WebP (`lossless=True`, `exact=True`, `method=6`); every decoded RGBA pixel, including alpha and transparent RGB, was verified against its PNG using numpy.array_equal.

| Asset | Source | Delivery | Dimensions | Transfer bytes | RGBA bytes | Final prompt |
|---|---|---|---|---:|---:|---|
| panel | art/ui080/panel-source.png | dist/assets/ui-panel-v080.webp | 1254 × 1254 | 1841466 | 6290064 | art/ui080/panel.prompt.txt |
| slot | art/ui080/slot-source.png | dist/assets/ui-slot-v080.webp | 1254 × 1254 | 1779718 | 6290064 | art/ui080/slot.prompt.txt |
| crest | art/ui080/crest-source.png | dist/assets/ui-crest-v080.webp | 2172 × 724 | 328808 | 6290112 | art/ui080/crest.prompt.txt |
| nav | art/ui080/nav-source.png | dist/assets/ui-nav-v080.webp | 1536 × 1024 | 1562110 | 6291456 | art/ui080/nav.prompt.txt |
| utility | art/ui080/utility-source.png | dist/assets/ui-utility-v080.webp | 1536 × 1024 | 1776656 | 6291456 | art/ui080/utility.prompt.txt |

The utility atlas uses `nav-source.png` as a visual style reference. The other four assets were generated from text. Full final prompts are saved alongside the original sources, and hashes and pixel equality results are in `assets.json`.

Placement: the panel is a CSS nine-slice frame; the slot sits behind existing equipment/skill art; the crest decorates pause/result headings. The navigation atlas uses a 3 × 2 grid: home, hunt, equipment / crafting, more, skills. The utility atlas uses a 3 × 2 grid: archive, growth, tracking / gold, core, filter. Entire image cells are selected with CSS background-position; no image pixels were cropped or repainted.

Live labels, currencies, stats and skill names remain native HTML text. Existing images still depict the actual item/skill identity. All decorative art is hidden from assistive technology.

Total additional encoded bytes: 7288758. Upper bound for the five decoded RGBA surfaces: 31453152 bytes. This is an asset accounting figure, not measured browser/GPU memory. No combat boot image entry was added.
