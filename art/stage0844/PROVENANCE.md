# Alpha 0.84.4 stage seals — production image record

- Mode: built-in `image_gen.imagegen`, edit flow, `transparent_background: true`.
- Edit reference: the previously generated six-state atlas `art/stage0843/seals-source.png`, inspected before editing. A spacing-only second edit used the first clean-rim result.
- Selected unmodified generated source: `art/stage0844/seals-source-final.png`, copied intact from `/workspace/scratch/b9640f78719a/generated_images/exec-07ff583b-99d8-4779-a2ab-bb53f6afabf9.png`.
- Final production asset: `dist/assets/ui-stage-v0844/seals.webp` (1536×1024, 807,962 bytes). Sharp lossless WebP conversion; alpha and every nontransparent RGBA sample are identical. No programmatic image retouch, recoloring, masking, crop, or rescale.
- Six 512px cells, reading order: locked, available, completed, selected, boss locked, boss available. Numbers and state captions are native DOM text.
- The generator's disk centers do not exactly match cell centers. CSS background positions register each painted disk to the native numeric label, without changing the bitmap. Offline registration and source/production hashes are in offline-map-check.json and asset-check.json. Cell boundaries have alpha at most 1/255; the generated alpha is preserved.

## First edit prompt (cleaner rim)

```text
Use case: precise-object-edit. Edit target: attached six-state UI atlas. Redesign the six medallions for crisp display at 48-64 CSS pixels. Keep the exact 1536x1024 canvas, exact 3x2 equal 512px cells, and the same reading-order states (locked dark steel, available silver, completed muted warm gold, selected muted crimson/silver, boss locked, boss available). Each medallion MUST be a perfectly centered regular circular disk at cell center 256,256, with the SAME 400px outer diameter. Simplify the existing assets: remove all spiky tips, filigree, bevel noise, scratch grain, red hanging fabric and tiny rim pieces. Use one clean broad metal rim with two smooth shaded bands, a smooth deep charcoal slate center, restrained hand-painted dark fantasy game finish. Keep a small SIMPLE lock shape on the bottom rim for locked, one simple short check mark for completed, one small ruby at top for selected. The two boss medallions use one small simplified horned crown/skull on their TOP rim, contained within the same circular bounds; absolutely no ornate skeleton texture. Center remains entirely blank for runtime numbers. Reduce bright highlights and tiny contrast changes; large clean surfaces and calm edges. All six must look equally sized and have identical center alignment. Transparent background around each disk; no surrounding glow, shadows, gradients or checkerboard; preserve genuine alpha. No text, digits, labels, watermarks, logos. Deliver only the updated production sprite atlas, not a mockup.
```

## Final edit prompt (spacing)

```text
Use case: precise-object-edit. Edit target: attached production UI atlas. Change ONLY spacing, scale and centering of the six existing medallions. Preserve their clean painted metal style and six state colors/emblems. Critical correction: all six need 80px TRANSPARENT gutter on every side of each individual 512x512 cell. Fit the ENTIRE visible shape including lock, jewel or skull within a centered 352px-diameter bounding circle. The circular disk centers must be exactly (256,256), (768,256), (1280,256), (256,768), (768,768), (1280,768) on the 1536x1024 canvas. Shrink the skull/lock/jewel if needed to keep the disk centered and leave ample margin. No part of one medallion may touch or enter another cell. Both row boundaries y=0,512,1023 and column boundaries x=0,512,1024,1535 must be fully empty transparent. Same absolute outer size in all six states, empty dark central disk, no text or digits. Remove all shadows/glows/background from outside the six medallions. Genuine alpha background; no painted gradient or checkerboard. Deliver only the corrected 3 by 2 sprite atlas.
```

