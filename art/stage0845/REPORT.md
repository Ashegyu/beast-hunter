# Alpha 0.84.5 — explicit seal dimensions and grid alignment

## Observed failure

The user's 0.84.4 screenshot shows tiny painted seals beneath larger numbers, stage contents near the left edges of their columns, and a large gap above the stage rows and before the preview. The intended 64px art is not represented by that screen. The earlier manually composed reference did not model the browser's intrinsic track sizing and must not be treated as successful visual validation.

## Source cause and repair

The map's button changes display from flex to grid, but inherits `justify-content:flex-start` from stages.css. It defines rows without an explicit column. The seal uses a percentage-dependent width and automatic height within that intrinsic column. This combination can size the track around its two-digit text, rather than using the available button width. It is consistent with the supplied failure. No browser computed-style capture is available to independently measure that result.

Each button now declares `grid-template-columns:minmax(0,1fr)` and `justify-content:stretch`. Each seal explicitly declares equal width, height, minimum width and minimum height from the same size variable, and no longer relies on aspect-ratio or percentage width to obtain its size. The existing generated atlas and its registered centers are unchanged. Numbers remain a single native text node in each existing button.

The board's stage track and the grid itself now use the exact sum of the two row heights and the 4px gap. Both align to the start, and the preview follows immediately. Empty available height no longer separates the heading, stage buttons and preview. The existing map viewport boundary, compact-height rules, fixed footer, accessible names and 44px minimum hit areas remain.

## Checks and limits

Focused actual-app tests cover all ten stage selections across three difficulties, chapter-specific difficulty gates, locked actions and tactics navigation. See tools/reports/stage0845-focused-tests.txt. Source ID/reference and diff checks are recorded separately. No JS, gameplay, progression, persistence or asset pixels changed.

These checks do not execute browser layout. The supported browser-control skill is unavailable, and no substitute browser/preview path was used. Browser composition and touch remain unverified. No new manually composed screenshot is presented as evidence for this repair.
