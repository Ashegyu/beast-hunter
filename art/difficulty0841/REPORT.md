# Alpha 0.84.1 map difficulty access

## Observed source behavior

The deployed rollback baseline is Alpha 0.84, saved Sites version 99, source commit `ba28cbeac2fda840ecfc9750b5529ba8fbef5a8c`. It already contains boss difficulty state and launch guards, but its controls are inside the separate tactics/reward view. That entire control panel is hidden for uncleared chapters. There was no always-visible map difficulty selector.

The repository's source branch still contained the subsequently rejected Alpha 0.85–0.89 UI. This change restores the tracked baseline to Alpha 0.84 without rewriting history, then adds the bounded difficulty correction. Earlier design work remains recoverable from Git history.

## Changes and invariants

- The map always shows three native, bitmap-backed buttons directly after the chapter tabs. Buttons stay in normal content flow in a three-column grid, with content-sized heights and wrapping lock explanations.
- Both map and tactics controls share `selectedDifficulty` and a guarded `selectHuntMode` transition. Selecting a mode only changes preparation state, never saved progression or rewards.
- General mode remains usable before reaching the boss and preserves the current ordinary checkpoint. Elite/nightmare use the existing chapter-specific unlock check and select stage 10. The older tactics normal-mode control retains its boss-only behavior.
- Changing chapter or choosing an ordinary checkpoint retains the existing reset to general difficulty. The map updates its selected state and lock reasons from the same authoritative game rules as the detail view.
- Every mode selection increments the existing launch revision, invalidating a pending cold-launch intent. Asset-load completion cannot launch an abandoned selection. A fresh start uses the new mode.
- Combat, loot, boss difficulty multipliers, unlock conditions, and persistence formats are unchanged from Alpha 0.84.

## Verification scope

Four focused actual-app VM integration cases cover: fresh/uncleared access and blocked locked clicks; all three chapters' different mastery gates and real boss launches; cross-view synchronization and reset on checkpoint/chapter changes; cancellation of a deferred image launch when mode changes. These pass. The full existing UI suite with these cases passes 191/191; raw output is retained in `tools/reports/difficulty0841-ui-tests.txt`.

Static markup validation confirms 1,520 unique IDs, all three new controls inside the map rather than the tactics view, valid local source references, and absence of the rejected Crimson stylesheet/skin. `node --check dist/app.js` and whitespace validation are run before packaging.

Direct browser composition, font wrapping on a physical device, and touch were not inspected: the supported browser-control skill is unavailable. VM tests validate app behavior rather than CSS layout; no substitute browser or preview server is used. No new image artwork is generated: the controls reuse the baseline's existing decorative button image.
