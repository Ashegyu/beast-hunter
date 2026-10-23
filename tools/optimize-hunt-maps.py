"""Encode hunting maps as lossless WebP and verify decoded pixel identity."""

import json
from pathlib import Path

from PIL import Image


def main():
    root = Path(__file__).resolve().parents[1]
    assets = root / "dist" / "assets"
    results = []
    for region in ("forest", "ruins", "frost"):
        source = assets / f"hunt-map-{region}-v036.png"
        target = source.with_suffix(".webp")
        with Image.open(source) as original:
            rgba = original.convert("RGBA")
            rgba.save(target, "WEBP", lossless=True, exact=True, method=6)
            with Image.open(target) as encoded:
                decoded = encoded.convert("RGBA")
                rgba_equal = decoded.size == rgba.size and decoded.tobytes() == rgba.tobytes()
            entry = {
                "input": source.relative_to(root).as_posix(),
                "output": target.relative_to(root).as_posix(),
                "width": rgba.width,
                "height": rgba.height,
                "inputBytes": source.stat().st_size,
                "outputBytes": target.stat().st_size,
                "rgbaEqual": rgba_equal,
            }
            results.append(entry)
            if not rgba_equal:
                raise RuntimeError(f"Decoded RGBA mismatch: {target}")
    report = {
        "encoding": "WebP lossless=True, exact=True, method=6",
        "totalInputBytes": sum(row["inputBytes"] for row in results),
        "totalOutputBytes": sum(row["outputBytes"] for row in results),
        "allRgbaEqual": all(row["rgbaEqual"] for row in results),
        "maps": results,
    }
    report_path = root / "tools" / "reports" / "hunt-map-delivery-alpha036.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report))


if __name__ == "__main__":
    main()
