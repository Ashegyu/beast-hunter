# Alpha 0.66 verification

## Runtime contract

- Limits live in frozen `battle-plans.js` data: normal stages 120 seconds, boss stage 180 seconds, all three chapters and replay modes.
- `prepareStage` resets a runtime-only quota, valid kill tally and clock. No profile schema change or duplicate state persisted in saves.
- Remaining enemies = stage quota minus valid current-stage/wave kills. This includes pending and future waves and remains O(1) per HUD update. Existing dead guards prevent duplicate contacts from decrementing twice; stale identities cannot complete quotas.
- Existing capped, bounded engine steps remain in place. Active combat and wave breaks consume time. Paused/background play and the existing 2.5-second clear interlude freeze it. Contact freezes also consume the full elapsed challenge budget, including the discarded remainder of a newly frozen frame.
- The final step is bounded to the remaining fractional deadline. Contacts at that boundary resolve first, so a final clear/boss victory wins an exact tie. An already expired hunt admits no further combat.
- Timeout commits defeat before pending gear ownership is settled, clears outgoing attacks/spawns/casts and immediately opens a time-over result without pretending the player died. Earned progression and reserved equipment persist exactly once; no unfinished-stage rewards, checkpoint, unlock or mastery is granted. Retry resets the same encounter budget.

## UI

The old stage/wave/name/quest nodes are removed, including the stage-entry herald. The compact, maximum-360px panel uses an SVG clock ring, tabular MM:SS countdown, monster glyph and complete-encounter remaining bar. Positive fractions round up; warning colors change at 30 and 10 seconds, with no flashing animation. Pause and time-over results use the same production values. Screen-reader timer announcements are not fired every frame; the monster meter identifies pending enemies as included. HP, boss HP, small icon-only skills and camp maps retain their existing behavior. Changed module URLs are versioned together to avoid stale engine/data imports.

Native font advance checks (Pillow/FreeType loading the shipped WOFF2 files) estimated horizontal content fit for the narrow layouts. These are font/box calculations, not rendered browser layout evidence:

| Panel width | Each column | Clock content | Monster content |
| --- | --- | --- | --- |
| 296px (320px viewport) | 133px | 103.83px | 85.97px |
| 336px (360px viewport) | 153px | 103.83px | 85.97px |
| 360px cap | 161px | 113.28px | 95.97px |
| 280px short landscape | 126px | 94.38px | 87.97px |

## Automated verification

`npm test`: 542 passed, zero failures/skips. Nine new timer engine tests plus two new real-app VM tests cover budgets, pending/future enemies, duplicate/stale kills, warning thresholds, accessible values, pause, interlude, hitstop, fractional deadlines, exact-boundary clears, ownership, no unfinished rewards, held controls and full-budget retry. Existing UI tests now assert the requested replacement rather than removed stage nodes. Legacy isolated combat fixtures explicitly receive a large test clock; actual campaign tests use production limits.

`node tools/measure-timer066.mjs`: 9 deterministic, earned-gear automatic campaigns (balanced/farm/safe × seeds 0/4/9), all 27 chapter runs won, 339 kills and 10 clears per chapter, boss final alone, live enemies ≤18. Raw stage clock data is in `campaign.json`. The longest sampled normal encounter used 99.85/120 seconds, leaving 20.15 seconds; longest sampled boss used 11.23/180 seconds. These samples check regression and automatic completion; they do not establish manual-player difficulty or a statistical balance guarantee.

JavaScript syntax checks and `git diff --check` pass. No dependencies or bitmap assets were added.

## Verification limits

Managed cloud browser control was unavailable. In accordance with the Sites workflow, no preview server, browser installation or alternate browser-control path was used. There is no claim of actual browser screenshot, touch, GPU or device FPS validation. User computer and sign-in were not used.
