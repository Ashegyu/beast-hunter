# Alpha 0.84.4 — stage text, artwork and bounded map composition

**Later failure evidence:** the user's actual 0.84.4 screen showed collapsed seal sizing and excess spacing. The offline composition below did not model CSS intrinsic track sizing and is not successful visual validation. See ../stage0845/REPORT.md for the source cause and correction.

## Change

The stage selector uses a new imagegen-produced six-state slate/metal seal atlas with broader rims and fewer small decorations. Numbers remain real text and use tabular numerals. Individual CSS background positions align the painted disks with their numeric labels; the two rows of state captions have equal tracks. Heading and count use a shared line height. The sharp map scene no longer sits behind these controls.

The map view now owns a bounded grid between the existing masthead and app navigation. It allocates explicit chapter, difficulty, stage-board and launch rows. Its panel is no longer a scroll surface. Stage buttons are in normal grid flow, not positioned pins. Small heights use smaller art and hide only the supplementary preview. A short landscape layout places chapter and difficulty controls side by side and uses the header back control while hiding the bottom navigation in that map view.

The preparation guide moves into the existing tactics view. Its unchanged shortcuts remain reachable through the footer's ‘보상 · 정비’ button, next to the fixed launch button. The old footer thumbnail pseudo-element, 67px offset and minimum block height are explicitly reset on the new action wrapper. Other long views keep their existing scrolling. No app.js, game-engine, rewards, progression or save code changed.

## Verification and limits

- Actual-app VM UI integration suite: **192/192 pass**, including all ten stage selections, difficulty-specific records, locked actions, preparation shortcuts, tactics return and launch behavior. Evidence: tools/reports/stage0844-ui-tests.txt. This suite does not perform CSS layout or physical touch.
- tools/render-map0844.mjs evaluates a **hand-derived size budget** for 272 combinations: widths 320/360/390/430/480; heights 480/520/521/560/561/568/620/621/640/740/741/780/915; safe top 0/44 and bottom 0/34; plus 480px-wide short landscape heights 360/390/420. All modeled stage-grid allocations fit their two rows. The minimum modeled button width is 54px and height is 54px. Minimum spare grid height is 0px at the smallest portrait safe-area case, so device verification remains important.
- The same tool composes 30 cells and surrounding labels/buttons at 320×480, 390×780 and 480×360, using actual app values, the production bitmap and installed game fonts. offline-map-check.png/json are **offline references, not browser screenshots or a CSS renderer**. They cannot prove cascade behavior, intrinsic layout, loading or hit testing.
- The selected original and production lossless WebP are both 1536×1024. Alpha is identical and all visible RGBA samples are identical. The atlas adds 807,962 production bytes, replacing the map's previous atlas reference. Boundary alpha is at most 1/255; all meaningfully visible shapes stay within their own cells. See asset-check.json.
- Source checks: 1,548 unique IDs, 128 local HTML/CSS references present, preparation buttons inside tactics and both actions inside the footer. app.js syntax and whitespace checks pass. See source-check.json.

Direct browser CSS composition, actual device text rendering and touch remain unverified. The required supported browser-control skill is unavailable; no substitute browser control or preview server was used. The offline size model is not a browser guarantee, and portrait viewports below 480px high are outside its checked range.
