# Alpha 0.46 image UI

Generated with built-in image_gen; final prompt: prompt.txt; source: combat-ui-atlas-v046.png. Mechanical atlas extraction only, no redraw or resampling. Alpha >16 determines crop bounds; original pixels inside those bounds remain unchanged. Each lossless WebP was decoded and compared to the extracted RGBA pixels. Budget and exact source regions: assets.json.

Applied to 3 skills, joystick base/thumb, utility controls, hunter/mission/boss panels, notice/reward/tracker. Live labels, resource bars, cooldown text, accessible names and original event targets remain native DOM. No changes to JS, combat, save schemas, input geometry or asset boot requirements. CSS artwork is decorative and never owns pointer events.

Validation: npm test 421/421; git diff --check passed; all 9 CSS image references resolve. Cropped hunter and boss frames were inspected and corrected to retain the full frame. Existing test host is DOM/Canvas integration, not browser visual QA. Browser control skill unavailable in managed Linux: no preview server or alternative browser path was started. Actual browser layout, Android touch and GPU performance remain unverified.

## Alpha 0.46.1 source review

The button artwork reserves about its lower quarter for text. At the 50px small skill size that is about 12.5px, shorter than two live text lines plus margins. Skill names now anchor in the inset and cooldown text uses a separate badge below the button. Hidden SVGs no longer occupy the button flex layout. Existing 50–72px button hit areas, positions and touch handlers are unchanged; text overlays ignore pointer input. The 12px badge extension stays inside the existing minimum 18px bottom margin.

Portrait CSS had a 76px boss HUD top offset while the mission occupied the second top-HUD row. Boss HUD now starts at 128px plus safe-area; mission is bounded to 56px and remains above it. Announcement offsets move below the boss area. Boss name uses ellipsis and HP remains unwrapped. These are source-derived layout corrections, not browser screenshots or physical-device evidence. Browser visual QA remains unavailable and must not be inferred from passing DOM-host tests.

## Alpha 0.48.1 source geometry review

Confirmed from the final stylesheet cascade, not a browser:
- The 122px ability group placed the 52px thunder at y=0 and the 72px attack at y=50. Thunder status starts at y=54, so its badge intersects the attack artwork. At <=340px the group was 118px and attack started at y=50 as well. A final 164px group height now places attack at y=92 (or 96 for the 68px small-screen variant), leaving room for the two-line status badge. Button sizes, horizontal positions, IDs and input handlers are preserved. The raised group moves thunder upward; the attack and dash remain anchored to the same bottom edge.
- The high-specificity artwork rule forced landscape boss HUD back to top=128px and full width, overriding the earlier landscape rule. The artwork stylesheet now has an equally specific landscape rule: top=10px plus safe inset, left=228px, right=12px. The 200px top HUD starts at x=12 and ends at x=212, leaving a 16px gap. The game shell is capped at 480px, so the old left=270/right=72 landscape rule would itself leave only 138px of boss width; the new bounds leave 240px at that shell width.

The game remains unverified in a real browser. No login, access-policy change or alternate preview path was attempted. npm tests exercise a stub DOM/Canvas host; they cannot certify typography or touch layout. Remaining visual concerns include raster panel aspect distortion, text in image insets, and compact top-HUD mission clipping; no speculative restyling is included for those concerns.
