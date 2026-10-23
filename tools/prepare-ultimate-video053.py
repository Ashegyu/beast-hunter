#!/usr/bin/env python3
"""Reproduce clean ultimate clips from the user's six-second uploaded video.

Frame bounds were visually checked at every transition frame, zero based.
Run: python tools/prepare-ultimate-video053.py [original-upload.mp4]
"""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'art/skills053'
SOURCE = ART / 'video-source.mp4'
CUTS = [('bloodmoon', 0, 61), ('eclipse', 68, 114), ('phantoms', 119, 144)]

def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True).stdout

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def probe(path):
    return json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)))

def main():
    ART.mkdir(parents=True, exist_ok=True)
    if len(sys.argv) > 1:
        uploaded = Path(sys.argv[1])
        if uploaded.resolve() != SOURCE.resolve():
            if SOURCE.exists() and digest(SOURCE) != digest(uploaded):
                raise RuntimeError('Refusing to replace a different preserved original')
            shutil.copyfile(uploaded, SOURCE)
            assert digest(uploaded) == digest(SOURCE)
    original = probe(SOURCE)
    video = next(s for s in original['streams'] if s['codec_type'] == 'video')
    assert video['r_frame_rate'] == '24/1' and int(video['nb_frames']) == 144
    report = {'source': {'path': str(SOURCE.relative_to(ROOT)), 'sha256': digest(SOURCE), 'bytes': SOURCE.stat().st_size,
        'durationSeconds': float(original['format']['duration']), 'videoDurationSeconds': float(video['duration']),
        'width': int(video['width']), 'height': int(video['height']), 'frames': 144, 'fps': 24,
        'provenance': 'User-uploaded gemini_generated_video_86c369c7.mp4; preserved byte-for-byte'},
        'inspection': {'contactIntervalSeconds': .25, 'frameBoundsZeroBased': True,
            'excludedCrossfadeFramesInclusive': [[61,67], [114,118]],
            'method': 'Low-threshold ffmpeg scene detector plus quarter-second contact sheet and individual transition-frame visual review. Crossfades are deliberately excluded.'},
        'clips': {}}
    for id, start, end in CUTS:
        dest = ROOT / f'dist/assets/ultimate-{id}-v053.mp4'
        dest.parent.mkdir(parents=True, exist_ok=True)
        run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(SOURCE), '-map', '0:v:0',
            '-vf', f'trim=start_frame={start}:end_frame={end},setpts=PTS-STARTPTS,scale=960:540:flags=lanczos',
            '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-profile:v', 'main', '-level:v', '3.1',
            '-pix_fmt', 'yuv420p', '-r', '24', '-g', '24', '-movflags', '+faststart', '-map_metadata', '-1', str(dest))
        encoded = probe(dest)
        streams = encoded['streams']
        assert len(streams) == 1 and streams[0]['codec_type'] == 'video'
        v = streams[0]
        assert int(v['nb_frames']) == end-start and int(v['width']) == 960 and int(v['height']) == 540
        assert v['pix_fmt'] == 'yuv420p' and float(v.get('start_time', 0)) == 0
        assert dest.stat().st_size < 2*1024*1024
        # Decode every output frame: this also detects truncated or corrupt exports.
        run('ffmpeg', '-v', 'error', '-i', str(dest), '-f', 'null', '-')
        report['clips'][id] = {'path': str(dest.relative_to(ROOT)), 'sha256': digest(dest), 'bytes': dest.stat().st_size,
            'sourceStartFrameInclusive': start, 'sourceEndFrameExclusive': end, 'sourceLastFrameInclusive': end-1,
            'sourceStartSeconds': start/24, 'sourceEndSecondsExclusive': end/24,
            'durationSeconds': float(v['duration']), 'frames': end-start, 'fps': 24, 'width': 960, 'height': 540,
            'codec': v['codec_name'], 'profile': v['profile'], 'pixelFormat': v['pix_fmt'], 'startTime': float(v.get('start_time', 0)),
            'audio': False, 'faststart': True, 'composition': 'Entire 1280x720 source scaled proportionally; no cropping',
            'gameDurationSeconds': 1.35, 'suggestedPlaybackRate': (end-start)/24/1.35}
    report['totalRuntimeBytes'] = sum(c['bytes'] for c in report['clips'].values())
    assert report['totalRuntimeBytes'] <= 4*1024*1024
    (ART / 'media.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'clips': report['clips'], 'totalRuntimeBytes': report['totalRuntimeBytes']}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
