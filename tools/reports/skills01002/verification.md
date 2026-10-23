# Alpha 0.100.2 · reference-derived skill parts

- Built-in imagegen used with user reference 6ae39827-561f-4aa1-8fd9-be0300e5cd04.png, specifically component breakdown.
- Generated nine new texture parts: panel, normal/selected card, normal/primary/hover button, equipped frame, icon frame, disclosure bar.
- Original skill artwork retained. All parts supplied as independent PNG and lossless WebP.
- Removed legacy 400%/200% background crops and doubled frame rendering. Decorative image inset is exactly 0px on all four sides of the actual control. 36px source slices preserve corners while native labels remain centered.
- Old reference-skin override block removed; dedicated skills-parts.css controls new art.
- 667×375 actual browser: workshop 336/336, library 322/322, editor 322/322, detail 288/288 clientHeight/scrollHeight; no horizontal overflow.
- 844×390 final screenshot captured from real app with a disposable Lv.35 test profile.
- Four existing skill regression tests passed, syntax/diff checks passed. No save data, skill costs or combat rules changed.
