# Alpha 0.84.2 difficulty campaigns and checkpoint selection

## Causes and final behavior

The prior controller always changed advanced mode selection to stage 10; selecting an ordinary stage then reset difficulty to general. Launch also forced difficulty zero for stages 1–9. These are direct conflicts with a separate ten-stage campaign per difficulty. Tapping an already selected chapter unnecessarily reset its checkpoint. Existing map-pin styles also retained transparent native text and an absolutely positioned, rotated pseudo-label underneath the newer grid rules.

Each difficulty now has an independent checkpoint limit per chapter. Switching to a different difficulty selects stage 1 without erasing earned progress. Tapping the already selected mode or chapter leaves the checkpoint alone. Selecting stages 1–9 keeps the chosen difficulty. Selection, unlock limits, home progress, map labels, launch, defeat retry and result replay use the same mode. Full advanced replay starts at stage 1. The final stage remains a single-boss encounter.

Stage rules are consolidated in stages.css. Native stage-number text is visible inside normal-flow 64px-minimum-height buttons; the secondary caption participates in their layout and ignores pointer input. Old rotation, position offsets and pseudo-label overlap are explicitly cleared at the active selector's specificity. Repeated chapter taps and navigation no longer replace the stage selection. This source correction is not a browser-observed diagnosis of every missed tap.

## State, migration and rewards

- Existing `stageProgress` remains authoritative for general difficulty; `difficultyProgress` contains two separate three-chapter rows for elite and nightmare. No duplicate general progress is stored. `completedStages` and `stageLimit` centralize reads. Only the captured hunt's difficulty is advanced on a stage clear.
- Launch checks phase, mode validity, chapter unlock and the chosen mode's checkpoint limit before mutating run state, counters or RNG. An unplayed advanced stage cannot be entered by a direct launch or a UI click.
- Save schema v9 restores v1–v8 state. Legacy boss mastery and its unlocks remain earned; advanced ordinary-stage progress initializes to zero because these stages were not present in the old mode. v9 rows are bounded and gated by existing chapter/mastery rules. Version-eight backups remain readable; version-nine backups validate their new rows.
- General chapter unlocks/offline progression stay unchanged. Advanced clears do not overwrite general progress. Existing boss reward scales, rarity tables, materials, pity, equipment, XP and gold rules remain; ordinary advanced enemies now use the existing mode's HP/damage scale. Boss patterns retain their extra projectiles and cycles.
- Existing launch-revision invalidation still cancels a pending load after selection changes. Mode selection itself changes neither save progression nor rewards.

## Verification

Full regression command: `node --experimental-vm-modules --test --test-concurrency=2 tests/*.test.mjs`. **622/622 passed**, raw results in `tools/reports/campaign0842-tests.txt`.

New engine cases cover v8 migration and idempotent restore, legacy/new backup round trips, malformed rows, atomic rejection of skipped/locked/invalid launches, actual elite stages 1–10 through collision/kill/reward transitions, victory reward idempotence, nightmare continuation in its own row, and ordinary enemy HP/damage scales.

The actual-app VM exercises all ten checkpoint buttons under all three modes, redraws, repeated selected-chapter/mode activation, navigation away/back and final launch identity. Existing cases now verify difficulty selection starts a full campaign; boss-specific combat fixtures explicitly own their nine prior checkpoints. Schema-result assertions expect v9 while old-input fixtures retain their actual versions.

Syntax, unique IDs, local references and source whitespace are checked before packaging. No image assets or the restored UI theme are replaced. Browser composition, physical touch, device font wrapping, GPU behavior and full high-difficulty balance are not measured. The supported browser-control skill is unavailable; no alternate browser or preview server is used. VM integration validates behavior, not actual CSS hit testing.
