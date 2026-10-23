# Common UI v2 integration — Alpha 0.102.0

- Imported 68 independent PNG assets unchanged from the supplied rpg_common_ui_v2.zip. No baked-text reference crop used as a live control.
- Applied supplied panels, buttons, tabs, cards, normal item frames, navigation/resource icons and pager controls to 474 existing elements. Item illustrations and game mechanics preserved.
- Nine-slice edges keep button and panel ornaments aligned with the actual clickable rectangle; card corners use fixed border widths.
- Removed duplicated equipment slot artwork; rarity halos retained.
- Fixed crafting materials to show both rows without internal scrolling.
- Skills retains six large equipped slots, paged library, compact detail, separate research foldout.

## Verification
- Targeted game UI tests: 49 passed, 0 failed.
- Byte identity: all 68 PNGs match uploaded source; every common stylesheet asset URL resolves locally.
- Browser visual checks: home, bag, crafting, equipment, codex, hunt map, growth dungeons, skills at 844×390; skills at 667×375 with no horizontal overflow and all six slots/actions visible.
- Actual browser screenshots: skills.jpg, craft.jpg.
- git diff --check passed.

## Source limitations
The supplied assets are screenshot-extracted small PNGs with estimated alpha. They retain the source's texture and resolution; this integration does not claim recovered original layers or extra image detail.
