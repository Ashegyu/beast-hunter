# Alpha 0.84.3 expedition-seal stage selector

## Change

The existing 5×2 checkpoint grid now presents each stage as a generated painted slate/metal expedition seal. Four ordinary seal states represent locked, available, completed and selected; two skull-crested states distinguish the final boss. A selected ordinary stage uses the crimson state. Boss selection keeps its skull/red frame and uses the visible selected label. State meaning is also provided as text and in native accessible names.

Stage numbers and status labels are separate persistent span/small nodes inside the same native buttons. IDs and click handlers remain unchanged. The old pseudo-labels and rotated-pin surfaces stay disabled; artwork and captions ignore pointer input. Each button remains in normal grid flow with an independent 44px minimum width and 72px minimum height. The actual viewport's layout still requires browser/device verification.

A compact heading and real progress bar show completed stages in the selected difficulty. The preview uses an existing actual monster/boss atlas, the selected battle plan's name/tactic, and actual wave count. Changing this display does not alter selection, progression, difficulty gates, combat, rewards or saves. No game-engine code changed.

## Verification

- Existing actual-app VM UI suite: **192/192 pass** after the markup/render changes. The selected-stage regression is additionally extended and rerun to verify all ten numeric spans, selected labels, exact plan titles and ordinary/boss metadata under all three difficulties.
- `tools/render-stage0843.mjs` composes the generated atlas and native-font labels with live app values at reference widths 320, 390 and 480. Thirty cells exercise fresh, partly cleared and boss-ready states. The generated PNG is an offline component/asset reference, not a screenshot or CSS renderer.
- Generated original and lossless WebP: same 1536×1024 dimensions, identical alpha and identical RGBA wherever alpha is nonzero. One 1,212,104-byte image is added and preloaded; all button states share it. Original source and conversion hashes are recorded in asset-check.json.
- Syntax, unique IDs, local references and whitespace are checked before packaging. Static asset references and alpha/cell boundaries are validated.

Direct browser layout, physical touch, device text rendering, loading latency and GPU performance remain unverified. The supported browser-control skill is unavailable; no substitute browser control or preview server was used. Offline composition cannot validate CSS specificity, intrinsic layout or hit testing.

Evidence: tools/reports/stage0843-ui-tests.txt, tools/reports/stage0843-focused-tests.txt, offline-stage-check.json/png and asset-check.json in this directory.
