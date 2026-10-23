# Lirian skill icon assets — Alpha 0.49

- 35 individual icons: 16 active, 16 passive, 3 ultimate.
- Recovered 16 previously generated originals without replacing their artwork.
- Generated 19 additional originals with the built-in image_gen tool, one separate call and subject-specific prompt per icon. Exact new prompts are in assets.json; old prompts were unavailable and are explicitly marked as such.
- Style: painted silver steel, crimson lunar light, blue-black charcoal, thin silver frame, no labels baked into art.
- Production assets: dist/assets/skills/{id}.webp, 256 × 256 RGB, quality 88, Lanczos downsampling only. No programmatic painting or recoloring.
- Runtime total: 628,612 bytes. 35 unique SHA-256 hashes. All 35 originals retained in originals/.
- Reviewed every generated output and the combined contact sheet for distinct subjects, consistent palette, clear central silhouettes, no generated lettering, and file/name mapping.
- The narrow sword subjects in lone/stance/steady intentionally differ by isolated space, water reflection, and planted stone. At the smallest button sizes they share a silhouette; always accompany icons with live text labels in the selection screen.
- This asset review does not claim browser/UI layout validation. No browser, login, or personal computer was used.

## Mapping

Active: crescent, gale, dance, draw, plunge, parry, echo, triple, seeking, returning, field, breach, gather, stance, mark, bloodblade.

Passive: opening, flow, finisher, footwork, pursuit, imbalance, breath, resolve, lone, surrounded, scar, recovery, steady, resonance, momentum, reserve.

Ultimate: bloodmoon, eclipse, phantoms.

## Application integration

- Alpha0.49 adds16 active,16 passive,3 ultimate definitions in combat-skills.js, rank-aware descriptions and actual combat resolution. Full generated values/contracts: DESIGN.md.
- Existing profile v7 fields remain, with an additive skillBook namespace. Existing equipment, legacy training points and progress are preserved; rank spending has a separate level-derived budget. All mutations require camp.
- Final full suite447/447 passed, including15 skill-engine tests. Moving-area guard origins and the surrounded passive240-radius boundary are covered. DOM/Canvas application tests cover actual workshop events, rank gates, equip/reset/preset/save/reload, paused jobs and ultimate resource UI. This host does not render browser layout.
- Tests cover corrupted allocations and duplicate/locked identities, budget repair, rank gates, multi-hit single gauge grants, interrupted casts, paused clocks, dead target identity, bounded phantom hits, no recursive mark proc, reduction cap, kill cooldown, saved auto policy, manual ultimate, safety reserve, exact boss marking, and discarded elapsed pulses through wave breaks.
- A legacy seeded loot test now explicitly equips the original basic/heavy kit. Changing the combat kit changes kill order and therefore seeded loot draw consumption; the underlying reward odds were not changed.
- Terminal hit-stop no longer delays result readiness; while playing, existing hit-stop remains unchanged.
- Four example builds each completed one deterministic production-engine frost chapter stage5 run at level50 with forge blade2/armor2/core1, legacy drain1 and rank5 selected skills/passives. This is a smoke simulation, not a broad balance study. Values and CPU execution scope: tools/reports/skills049-simulation.json.
- Production images628,612bytes total; full originals/provenance remain source-only. Browser/device layout, touch feel and GPU performance are unverified because the supported browser-control capability is unavailable. No login, access-policy change or substitute preview path was attempted.

- Final range correction separates the lone-target400 detection from surrounded240 detection; its regression checks enemies at220 vs300 units. All447 tests and four deterministic build smoke runs passed after this correction.
