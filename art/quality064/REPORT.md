# Alpha 0.64 — 10-stage chapters

Production changes:
- Three chapters × ten stages. Normal stages 1–9 have three waves; final stage 10 has exactly one boss, one wave, no adds and no barrels, including elite/nightmare retries.
- 339 enemies per chapter (previously 83). Normal waves contain 8–18 enemies with all three chapter-native roles. Arrival intervals .10–.18s instead of .30–.40s. Normal warning .75s; elite/boss warning 1.3s. Survival batches arrive within 3s; each survival wave still requires 12s and all kills.
- Authored pincer, barrage and alternating surge headings; rotating elite roles; bounded live population 18 (previously 10).
- Checkpoint rewards cover all nine normal stages. Stage counts and boss wave count derive from encounter data. All map controls, progress bars, pause HUD, retry, codex and material routes follow the new final stage.
- Save v8 migrates legacy v1–v7 checkpoint completion ratios once. Cleared chapter and inventory identities, XP, skill builds, currencies, materials and mastery retain their existing validation rules.

Validation:
- Full test suite: 517 passed, 0 failed. Includes all 30 stages, chapter unlock only after the final boss, exactly-once rewards, stale boss rejection, concurrency backpressure, pause/death, migration round trips, map gates, HUD and retries.
- campaign.json: three camp preparation policies × three seeds, real earned gear and budgets, all nine campaigns complete all three chapters. Each chapter has 339 kills and ten clears. End chapter levels 25 / 33 / 39; first level-20 ultimate unlock during chapter 1 stage 5. No XP/gate changes were needed.
- Simulated peaks across these campaigns: 18 living enemies, 22 total actors including temporary corpses, 18 projectiles, 51 effects. No lifetime changes were warranted by these measurements.
- cpu.json: seven fixed-crowd samples per condition, 1,000 warmup + 10,000 16ms engine steps. Median 0.63/10 enemies 10.202µs; 0.64/10 enemies 9.912µs; 0.64/18 enemies 17.697µs. This only measures isolated engine CPU and is not browser/GPU/device FPS or a statistical performance guarantee.
- HTML: 1,394 unique IDs; both maps have all ten controls. Stage grid overrides remove obsolete five-pin positions and route line; minimum target width 44px. Integration host tests execute actual app/engine but do not render CSS.
- Browser control is unavailable in this managed cloud environment. No preview server, substitute browser, login, user-computer operation, actual screenshot, touch or visual-layout verification was performed.

Reproduce: npm test; node tools/measure-stages064.mjs; node tools/benchmark-stages064.mjs.
