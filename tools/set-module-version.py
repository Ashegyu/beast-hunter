"""Give every local script, module import and stylesheet in dist/ the same `?v=` query (Alpha 0.140).

Usage: python3 tools/set-module-version.py 0.141.0

Before 0.140 each module kept the query of the version that last touched it (0.48 … 0.140) and a few imports had
none. A browser caches each URL separately, so after a deploy an unchanged importer could keep importing an old
copy of a changed module. Now every release sets one version for all of them: run this, then check that nothing
outside dist/*.js, dist/*.html and dist/*.css needs it. Image and data URLs keep their versioned file names.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'

# './name.js' / './name.css' in imports and dynamic import(), with or without a query.
MODULE = re.compile(r"""(?P<q>['"])(?P<path>\./[\w-]+\.(?:js|css))(?:\?v=[\w.]+)?(?P=q)""")
# src="name.js" / href="name.css" in the html pages, with or without a query.
TAG = re.compile(r"""(?P<attr>(?:src|href)=)(?P<q>['"])(?P<path>[\w-]+\.(?:js|css))(?:\?v=[\w.]+)?(?P=q)""")


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r'\d+\.\d+\.\d+', sys.argv[1]):
        sys.exit('usage: set-module-version.py X.Y.Z')
    version = sys.argv[1]
    changed = 0
    for path in sorted([*DIST.glob('*.js'), *DIST.glob('*.html')]):
        text = path.read_text(encoding='utf-8')
        out = MODULE.sub(lambda m: f"{m['q']}{m['path']}?v={version}{m['q']}", text)
        if path.suffix == '.html':
            out = TAG.sub(lambda m: f"{m['attr']}{m['q']}{m['path']}?v={version}{m['q']}", out)
            # 0.144.8: 더보기 화면 아래 버전 표기도 같이 올린다(0.103.1에 멈춰 있었음).
            out = re.sub(r'(<p class="more-version">[^<]*?ALPHA )[\d.]+', lambda m: m[1] + version, out)
        if out != text:
            path.write_text(out, encoding='utf-8')
            changed += 1
    # Every local reference now carries exactly this version.
    left = set()
    for path in [*DIST.glob('*.js'), *DIST.glob('*.html')]:
        text = path.read_text(encoding='utf-8')
        left |= {m['path'] for m in MODULE.finditer(text) if f"?v={version}" not in m[0]}
        if path.suffix == '.html':
            left |= {m['path'] for m in TAG.finditer(text) if f"?v={version}" not in m[0]}
    assert not left, sorted(left)
    print(f'{changed} files set to ?v={version}')


if __name__ == '__main__':
    main()
