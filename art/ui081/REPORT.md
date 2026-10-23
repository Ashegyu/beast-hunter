# Alpha 0.81: responsive equipment thumbnails

## Cause and invariant

Alpha 0.80 reduced the equipment viewport sizes in CSS, but atlasThumbnail still positioned and clipped the source at fixed pixel sizes supplied by callers (80px for bag items and 56px for equipped/crafting sockets). A 44px viewport could therefore show only the tip of a weapon. The atlas frame cache also compared only frame identity, not the source, nominal size or source dimensions.

The image placement and clip now share the same normalized square. The full selected frame must stay centered and inside that square at every display size, with equal scaling on both axes. Native text, actual item identity, equip actions and ownership are unaffected.

## Change

- One decorative image child per populated atlas viewport. Absolute percentage dimensions/offsets and percentage clip insets scale together with CSS. No layout measurement, resize observer or per-resize event is required.
- Reuse the image child and skip geometry writes while source/frame/nominal size/source dimensions remain the same. A source switch updates the same image. An unavailable regional image hides any old child and clears its cache.
- Smooth sampling for menu atlas images. Removed legacy negative margins and extra scale transforms on bag and crafting sockets. Combat pixel art and the arena renderer are unchanged.
- Responsive archive grid thumbnails replace fixed 144px artwork overflowing narrow cards. Large craft, tracking and featured archive images stay inside their artwork panels with positive insets.
- Original PNG/WebP assets and all saved profile/drop/combat rules remain unchanged. No runtime dependency or new game asset was added.

## Evidence

- UI integration suite: **172/172 passed**, including existing armory/crafting/equip/save/result/regional-failure checks and two regressions covering small-slot containment, centered uniform scaling, cached child reuse and item source changes. Log: tools/reports/ui081-ui-tests.txt. The source-switch regression was strengthened afterwards and rerun successfully: tools/reports/ui081-targeted.txt.
- Native Canvas render of actual app thumbnail styles: nine base/ancient/crafted weapon/armor/charm identities × four sizes (32/44/56/80px), **36 comparisons**. Full-frame reference alpha ratios after the fix range from 0.999712 to 1.000151. In the reproduced 44px case, the base weapon previously retained only about 6% of the reference alpha. Full evidence: render-results.json and thumbnail-comparison.png.
- The comparison reproduces the previous atlas function from commit c996ff444c289ae275c5bef333b5d9a58c31e9af. tools/render-thumbnails081.mjs can rerun it without modifying original assets. The illustration is an offline thumbnail render, not a browser screenshot.
- JavaScript syntax and git diff whitespace checks passed. Static local asset/ID audit is in tools/reports/ui081-structure.json.

## Limits

The DOM host executes real app code but does not compute browser CSS layout. The offline renderer verifies the atlas geometry at specified square sizes; it does not prove every device layout or GPU rendering behavior. Direct browser/device QA is unavailable in this environment. The original pixel-art design remains pixel art; smooth resampling does not invent source detail. Actual browser memory and visual sharpness on a physical phone were not measured.
