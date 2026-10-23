# Ultimate video split — Alpha 0.53

User upload preserved byte-for-byte as video-source.mp4. The uploaded file is 6.016 seconds including audio; its video track is exactly 144 frames / 6.000 seconds at 24 fps.

Inspected a quarter-second contact sheet, all frames around both transitions, individual full-size boundary frames, and the re-encoded clips' first/last frames. Scene detection at 0.01 and 0.06 was used only to locate changes; crossfade boundaries were determined visually.

| Skill | Source frames, inclusive | Source time, start-inclusive / end-exclusive | Clip frames | Duration | Bytes |
| --- | --- | --- | --- | --- | --- |
| bloodmoon | 0–60 | 0–2.541667 | 61 | 2.541667 s | 700,103 |
| eclipse | 68–113 | 2.833333–4.750000 | 46 | 1.916667 s | 351,954 |
| phantoms | 119–143 | 4.958333–6.000000 | 25 | 1.041667 s | 215,064 |

Frames 61–67 and 114–118 were excluded to avoid adjacent-scene crossfade remnants. In particular, eclipse frames 66/67 retain a faint red scene remnant, so the final eclipse clip begins at frame 68. The final phantoms clip starts after the visible sword/character ghost from the preceding scene disappears at frame 119.

Runtime files retain the full 16:9 composition, scaled from 1280×720 to 960×540. Existing black bars in bloodmoon are part of the upload and were not cropped. H.264 Main, yuv420p, 24 fps, no audio, independent timestamp zero, faststart. Combined size: **1,267,121 bytes**.

All clips fully decoded without ffmpeg errors; frame counts/durations/codecs/dimensions/start times verified with ffprobe. MP4 moov atoms precede mdat. Original copy SHA-256 matches upload. Detailed hashes, paths, counts, source bounds and suggested rates for an unchanged 1.35-second gameplay cutin are in media.json.

Reproduce with tools/prepare-ultimate-video053.py. No runtime, app, gameplay or manifest files changed. No browser or login used.
