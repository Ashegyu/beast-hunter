# Alpha 0.72 — crowd clearing, area growth and loot visibility

The previous authored encounters contained 27–51 enemies across three waves,
with at most 18 alive. New normal encounters contain 56–116, with at most 32 alive
and excess arrivals queued until space opens. The additional roles are melee
skitters; ranged/heavy counts and elite quota retain their authored mix. Spawn
intervals become 0.065–0.11 seconds, retaining the 0.75 second warning and longer
elite warning. Survival batches use six arrivals. Stage 10 remains one boss with
no adds or barrels; normal/boss time limits remain 120/180 seconds.

Non-elite skitters use 72% of their former HP and 75% of their former damage.
Heavies, ranged enemies, elites and bosses retain their stats. This distinguishes
crowd-clearing fodder from priority targets rather than raising every HP bar.

Area coverage grows 10% at character levels 10, 20, 30 and 40, capped at 40%.
Circles/cones/nearby attacks grow in reach; placed areas grow in radius; lines
grow in width. Targeting distance and dash travel remain unchanged. Values are
captured once per cast and shared by its hits and bitmap effects. Single-target,
utility and defensive parry skills retain their prior coverage. The workshop
describes base range and the current growth bonus. Damage still comes from
existing character/weapon/skill-rank growth.

Item drop odds, rarity tables, pity, ownership and persistence format are
unchanged. More kills provide more opportunities. Kept legendary-or-better gear
receipts last four seconds and have priority over ordinary gear, converted items
and rare crafting-material receipts in the existing compact corner toast.
Existing grade-specific beams, burst, sound and automatic bag protection remain.

## Verification

- 558/558 tests passed. Tests include queue admission/pause/kill replacement,
  growing coverage boundaries and cast snapshots, single-target preservation,
  32-target clearing, once-only bulk loot recovery, quality receipt duration and
  the real UI priority path. Existing campaign/boss/timer/resource tests pass.
- A production spawn fixture of 32 forest skitters survives a level-one rank-one
  crescent; the same placement dies to one level-twenty rank-five crescent.
  This measures one cast, not a promise that every scattered on-screen enemy is
  always inside every skill.
- `node tools/measure-horde072.mjs` compares the previous published commit
  ceb64aa5ac6a7ef16261b666453bddcecf55cfaf with the new simulation. Three fresh
  chapters complete through normal assisted play without invulnerability or
  altered HP. Equipment/forge selection between chapters follows the existing
  regression scenario. Every chapter kills 770 enemies versus 339 previously;
  observed equipment drops are 154/155/152 versus 65/70/75. End levels are
  31/41/45 versus 25/32/38. All runs end in victory without timing out.
- Headless simulation CPU P95 per 0.05-second advance is 0.144/0.170/0.161 ms
  across chapters, compared with 0.072/0.054/0.057 ms previously. The stationary
  stress case reaches 32 alive; P95/P99 are 0.054/0.195 ms per 0.025-second
  advance. These are shared Work Linux Node measurements, not device FPS or GPU
  timing. Measurement summaries and scenario configuration are in simulation.json.
- `node --experimental-vm-modules tools/render-horde072.mjs` runs real app.js
  compositing with actual atlases and terrain at 390×780 DPR 1. Three chapters
  each have a 32-live-enemy crowd scene and a post-cast scene. With an invulnerable
  level-twenty presentation fixture, one bloodmoon kills 31/33/28 enemies,
  including replacement arrivals from the queue; cooldown remains about 58.85s.
  app-scenes.json and the PNGs retain this evidence. Invulnerability is only a
  repeatable visual fixture; normal assisted campaign runs above do not use it.

No textures or runtime dependencies were added. Decoration limits count live
actors instead of allowing old corpses to consume the status-render budget.
The 32-enemy cap, 64-projectile cap, bounded pending gear and existing text/burst
render caps remain the safety bounds for this iteration.

This is offline simulation/Canvas verification. Browser network, CSS layout,
mobile touch and actual device GPU performance remain unverified. Balance and
subjective feel will still need playtesting. No user computer, login or alternate
browser-control path was used.
