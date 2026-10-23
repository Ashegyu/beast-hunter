# Alpha 0.82: remove equipped weapons from character composition

The game now renders the original character artwork and animation without attaching the equipped weapon image. Inventory equipment slots still show the selected item.

## Applied

- Removed the weapon image and foreground hand patch from the armory portrait, their placement calculation, and their CSS anchors/container.
- Removed the actor renderer's back/front equipped-weapon draws and the original-weapon cutout mask. Idle, walk, attack, dash, hurt, death and skill/afterimage poses share this renderer and retain their original sprite artwork.
- The character preview uses one frozen empty visual loadout and is labelled as the base character. This value is scoped to preview drawing; gameplay/effect loadouts still use the real equipped items and committed attack snapshot.
- Kept equipment slot images, item ownership, stats, synergies, unique effects, attack VFX, rarity auras, drops and save data. Original sprites/portrait images are unchanged, including any weapon painted into those original images. No new image or runtime dependency was introduced.
- Existing equipment-visual helper APIs remain compatible; the gameplay app no longer calls their weapon attachment or cutout paths. The preview passes an empty visual loadout.

## Validation

- **172/172 UI integration checks passed**: tools/reports/weapon082-ui-tests.txt. Existing appearance checks were updated to the new requested behavior instead of asserting weapon attachment. No unrelated engine changes were made.
- Recorded the actual app's eight directional base poses: no normal/ancient equipment atlas draw and no even-odd cutout mask, while original body frames and mirror direction remain valid.
- All existing ancient-weapon × eight-direction integration cases retain item icon identities, committed attack rarity and attack effect geometry while issuing zero character weapon atlas draws.
- Equip/build/reload checks retain selected slot images, equipment IDs, stats and synergy changes. Basic preview remains the base character after swapping equipment and reopening the app.
- Targeted checks: tools/reports/weapon082-targeted.txt. Static audit: 1,478 unique IDs, 123 local CSS/script/image/font references with no missing paths, no remaining portrait weapon/hand patch elements. Evidence: tools/reports/weapon082-structure.json.
- JavaScript syntax and git diff whitespace checks passed.

The integration host executes real app code and records DOM/Canvas operations, but it is not a browser CSS renderer. Direct browser/device visual QA is unavailable in this environment; phone font rendering, GPU behavior and exact device appearance were not measured.
