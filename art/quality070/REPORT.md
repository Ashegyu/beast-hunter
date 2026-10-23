# Alpha 0.70 — monster VFX visibility

## Reproduced cause

The Alpha 0.69 assets were loaded and drawImage was called. That check did not
establish visible integration. In the actual app composite, drawCombatProjectile
painted its opaque orange core and trail after the new hostile bitmap. The small
56×34 bitmap also cycled into its dissolving frame while still flying. Slam/slash
sprites were flattened by the ground transform, and their own frame fade was
multiplied by a second full-lifetime alpha fade. The result resembled the old
projectiles and small ground rings despite the presence of new images.

## Correction

- A successfully drawn hostile bitmap replaces the old projectile geometry.
  Friendly/reflected shots and missing-image fallback retain their existing path.
- Live projectiles use the two sustained core frames, a 90×58 presentation size,
  and additive compositing. The measured source pivots, physical anchor, projected
  velocity and 35px flight height remain unchanged.
- Volumetric contact sprites cancel the ground squash. Slash uses projected aim;
  slam is upright at the contact point. Scale and additive glow are increased.
- Contact alpha stays at full strength until the last third. The old decorative
  impact ring is used only when the bitmap cannot draw. Damage warning outlines
  remain in the final telegraph pass.
- Charge trails extend behind the body at a larger size. This does not add a
  persistent trail queue, new textures, an offscreen surface, or decode memory.
- Versioned app/module URLs advance to 0.70.0. This is normal release versioning;
  stale public HTTP caching was not established as the cause.

## Evidence and reproduction

Run from the checkout with the preinstalled Work Canvas runtime:

```
node --experimental-vm-modules tools/render-monster-app070.mjs before
node --experimental-vm-modules tools/render-monster-app070.mjs after
npm test
```

The renderer reuses the integration DOM host but substitutes a native Canvas and
actual decoded WebP images. It executes the real app.js tick/draw loop, including
terrain, actors, effects, projectile pass, telegraphs and lighting, with a
390×780 viewport and DPR 1. Attack data comes from the production spawn/update
functions. The before variant reads app.js and monster-fx.js from published
commit 9302471fee0e7f7bb6a3904b215c252dc25a4a2e; the after variant uses the working
source. Both use matching deterministic state and timing.

before-app-contact-sheet.png and after-app-contact-sheet.png show twelve actual
app scenes: slash, projectile, impact and charge in each of three chapters. The
individual full-height arena outputs are retained beside them. Review confirmed
visible new projectile shapes instead of orange bars and increased vertical
contact/charge presence against each region's actual terrain.

553/553 automated tests passed, including an app-level regression that detects
the old orange stroke being drawn over a hostile bitmap, checks friendly
reflection/fallback, and retains pause/terminal/resource tests. Unit checks cover
sustained live frames, upright height, eight projected projectile directions,
canvas state restoration and immutable presentation inputs. The complete suite
also covers existing damage timing, telegraphs, resource ownership and campaigns.

This is offline Canvas/VM verification. It does not verify browser network/cache,
CSS/DOM layout, phone touch input or device GPU performance. Browser control was
unavailable; no preview server, browser installation, login or user computer was
used.
