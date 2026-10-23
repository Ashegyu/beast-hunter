"""Technically pack 60 generated ancient sprites; never alter their source artwork.

Usage: python tools/pack-ancient-equipment.py PLAN_JSON RESULTS_JSON
Results may be a list of {id, path}, or {results: [...]}; IDs own frame identity.
Only alpha bounds, nearest-neighbour scaling, atlas layout and lossless encoding
are performed. Source PNGs and full prompts are retained for provenance/review.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import argparse
from collections import Counter
import hashlib
import json
import math
import shutil
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
CELL = 224
TARGET = 200
COLS = 10
ROWS = 6


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def result_paths(raw):
    if isinstance(raw, dict):
        raw = raw.get("results", raw.get("images", raw))
        if isinstance(raw, dict):
            raw = [{"id": key, "path": value} for key, value in raw.items()]
    assert isinstance(raw, list), "Expected a list of generated image result records"
    output = {}
    for row in raw:
        key = row["id"]
        assert key not in output, f"Duplicate generated identity: {key}"
        value = row.get("path", row.get("image_path", row.get("nativePath")))
        assert isinstance(value, str), f"Missing native image path for {key}"
        output[key] = Path(value)
    return output


def anchors(sprite):
    """Estimate the prompted SW grip at 14% of the sword's NE axis.

    Both coordinates snap onto the final packed opaque pixels. This makes hand
    placement reproducible and avoids anchors in transparent resizing gaps.
    The provenance report records the heuristic; physical grip review remains
    a separate visual acceptance step.
    """
    pixels = np.asarray(sprite)
    yy, xx = np.where(pixels[:, :, 3] > 128)
    assert len(xx) > 20, "Weapon has insufficient opaque pixels"
    dx, dy = math.cos(math.radians(55)), -math.sin(math.radians(55))
    projections = xx * dx + yy * dy
    low, high = float(projections.min()), float(projections.max())
    bottom = int(np.argmin(projections))
    top = int(np.argmax(projections))
    target_x = float(xx[bottom]) * .86 + float(xx[top]) * .14
    target_y = float(yy[bottom]) * .86 + float(yy[top]) * .14
    wanted = low + (high - low) * .14
    # Give axis placement more weight than transverse displacement, keeping
    # the chosen pixel on the handle rather than an extended crossguard.
    cost = (projections - wanted) ** 2 * 8 + (xx - target_x) ** 2 + (yy - target_y) ** 2
    grip = int(np.argmin(cost))
    gx, gy, tx, ty = int(xx[grip]), int(yy[grip]), int(xx[top]), int(yy[top])
    assert pixels[gy, gx, 3] > 128 and pixels[ty, tx, 3] > 128
    assert math.hypot(tx - gx, ty - gy) >= sprite.height * .3
    transverse = xx * -dy + yy * dx
    def width_at(fraction):
        section = transverse[np.abs(projections - (low + (high - low) * fraction)) <= max(1, (high - low) * .018)]
        return float(section.max() - section.min()) if len(section) else 0
    handle_width, guard_width = width_at(.14), width_at(.27)
    max_width = float(transverse.max() - transverse.min())
    review_flags = []
    if guard_width and handle_width > guard_width * 1.15:
        review_flags.append("estimated handle cross-section wider than prompted guard")
    if max_width and handle_width > max_width * .55:
        review_flags.append("estimated handle occupies over 55 percent of full transverse width")
    return {"gripX": gx + .5, "gripY": gy + .5, "tipX": tx + .5, "tipY": ty + .5}, {
        "method": "55 degree NE projection; prompted grip 14 percent; nearest opaque final pixel",
        "opaqueGripAlpha": int(pixels[gy, gx, 3]),
        "opaqueTipAlpha": int(pixels[ty, tx, 3]),
        "axisGripFraction": float((projections[grip] - low) / (high - low)),
        "handleWidth": handle_width, "guardWidth": guard_width,
        "overallTransverseWidth": max_width, "manualGripReviewFlags": review_flags,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("plan")
    parser.add_argument("results")
    args = parser.parse_args()
    plan = load_json(args.plan)
    paths = result_paths(load_json(args.results))
    assert isinstance(plan, list) and len(plan) == COLS * ROWS
    ids = [row["id"] for row in plan]
    assert len(set(ids)) == len(ids) and set(ids) == set(paths)
    counts = Counter(row["slot"] for row in plan)
    assert counts == {"weapon": 24, "armor": 18, "charm": 18}, counts
    assets = ROOT / "dist/assets"
    originals = ROOT / "art" / "equipment-source-originals"
    prompts = assets / "prompts"
    delivery = ROOT.parents[1] / "outputs/ancient-individual-v019"
    for folder in [originals, prompts, delivery, ROOT / "tools/reports"]:
        folder.mkdir(parents=True, exist_ok=True)
    atlas = Image.new("RGBA", (CELL * COLS, CELL * ROWS))
    contact = Image.new("RGB", (CELL * COLS, (CELL + 34) * ROWS), "#161d2b")
    draw = ImageDraw.Draw(contact)
    weapon_contact = Image.new("RGB", (CELL * 4, (CELL + 42) * 6), "#161d2b")
    weapon_draw = ImageDraw.Draw(weapon_contact)
    weapon_index = 0
    font = ImageFont.load_default()
    frames, records = [], []
    for index, row in enumerate(plan):
        item_id, slot = row["id"], row["slot"]
        assert slot in ("weapon", "armor", "charm")
        native = paths[item_id].resolve(strict=True)
        source_bytes = native.read_bytes()
        source_image = Image.open(native)
        assert source_image.format == "PNG", (item_id, "Expected native PNG")
        assert source_image.mode in ("RGBA", "LA", "P"), (item_id, "Missing alpha channel")
        rgba = source_image.convert("RGBA")
        alpha = np.asarray(rgba)[:, :, 3]
        zero_ratio = float((alpha == 0).mean())
        assert zero_ratio > .2, (item_id, "Insufficient true transparency", zero_ratio)
        bbox = rgba.getbbox()
        assert bbox and bbox[0] >= 0 and bbox[2] <= rgba.width
        crop = rgba.crop(bbox)
        assert int((np.asarray(crop)[:, :, 3] > 0).sum()) == int((alpha > 0).sum()), (item_id, "Source alpha outside crop")
        scale = min(TARGET / crop.width, TARGET / crop.height)
        width, height = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
        sprite = crop.resize((width, height), Image.Resampling.NEAREST)
        # Independently reproduce nearest sampling; ensure technical resizing
        # has not painted, blended or substituted any source pixel.
        # Coordinate planes reproduce Pillow's edge tie rounding exactly;
        # float arithmetic alone can differ by one pixel on rational ties.
        nearest_x = np.asarray(Image.fromarray(np.arange(crop.width, dtype=np.int32)[None, :]).resize((width, 1), Image.Resampling.NEAREST))[0]
        nearest_y = np.asarray(Image.fromarray(np.arange(crop.height, dtype=np.int32)[:, None]).resize((1, height), Image.Resampling.NEAREST))[:, 0]
        source_pixels = np.asarray(crop)
        assert np.array_equal(np.asarray(sprite), source_pixels[nearest_y[:, None], nearest_x[None, :]]), (item_id, "Nearest sample mismatch")
        column, line = index % COLS, index // COLS
        x, y = column * CELL + (CELL - width) // 2, line * CELL + (CELL - height) // 2
        atlas.paste(sprite, (x, y))
        assert atlas.crop((x, y, x + width, y + height)).tobytes() == sprite.tobytes(), (item_id, "Atlas cell RGBA changed")
        frame = {"x": x, "y": y, "w": width, "h": height,
                 "pivotX": width / 2, "pivotY": height, "duration": 1, "slot": slot}
        anchor_report = None
        if slot == "weapon":
            measured, anchor_report = anchors(sprite)
            frame.update(measured)
            sx, sy = int(nearest_x[int(measured["gripX"])]), int(nearest_y[int(measured["gripY"])])
            assert source_pixels[sy, sx, 3] > 128, (item_id, "Native grip not opaque")
            anchor_report.update(sourceGripX=sx + bbox[0], sourceGripY=sy + bbox[1],
                                 sourceGripAlpha=int(source_pixels[sy, sx, 3]),
                                 sourceAndPackedGripPixelsEqual=True)
        frames.append(frame)
        name = item_id + "-v019.png"
        for destination in [originals / name, delivery / name]:
            shutil.copyfile(native, destination)
            assert sha(destination.read_bytes()) == sha(source_bytes)
        (prompts / (item_id + "-v019.prompt.txt")).write_text(row["prompt"], encoding="utf-8")
        cx, cy = column * CELL, line * (CELL + 34)
        contact.paste(sprite, (cx + (CELL - width) // 2, cy + (CELL - height) // 2), sprite)
        draw.text((cx + 6, cy + CELL + 3), item_id, fill="#e2e8f0", font=font)
        draw.text((cx + 6, cy + CELL + 17), slot + " / boss " + str(row["tier"]), fill="#93afc4", font=font)
        if slot == "weapon":
            wx, wy = weapon_index % 4 * CELL, weapon_index // 4 * (CELL + 42)
            left, top = wx + (CELL - width) // 2, wy + (CELL - height) // 2
            weapon_contact.paste(sprite, (left, top), sprite)
            for ax, ay, color in [(frame["gripX"], frame["gripY"], "#ff405b"), (frame["tipX"], frame["tipY"], "#40ff9e")]:
                weapon_draw.ellipse((left + ax - 3, top + ay - 3, left + ax + 3, top + ay + 3), outline=color, width=2)
            weapon_draw.text((wx + 6, wy + CELL + 3), item_id, fill="#e2e8f0", font=font)
            weapon_draw.text((wx + 6, wy + CELL + 17), "RED grip / GREEN tip", fill="#93afc4", font=font)
            if anchor_report["manualGripReviewFlags"]:
                weapon_draw.text((wx + 6, wy + CELL + 29), "CHECK HANDLE SHAPE", fill="#ffb87d", font=font)
            weapon_index += 1
        records.append({"id": item_id, "name": row["name"], "slot": slot, "tier": row["tier"],
                        "nativePath": str(native), "sourceAssetPath": str(originals / name),
                        "outputAssetPath": str(delivery / name), "sourceBytes": len(source_bytes),
                        "sourceFileSHA256": sha(source_bytes), "sourceRGBAsha256": sha(rgba.tobytes()),
                        "spriteRGBAsha256": sha(sprite.tobytes()), "sourceSize": list(rgba.size),
                        "sourceAlphaZeroRatio": zero_ratio, "sourceRect": list(bbox),
                        "retainsAllSourceNonzeroAlphaBounds": True,
                        "nearestSamplesSourcePixelsExactly": True,
                        "atlasCellRGBAEqualsNearestSprite": True,
                        "frame": frame, "anchor": anchor_report})
        print(item_id, width, height, flush=True)
    assert len({row["sourceFileSHA256"] for row in records}) == len(plan), "Duplicate generated source file"
    assert len({row["spriteRGBAsha256"] for row in records}) == len(plan), "Duplicate packed sprite"
    png = assets / "ancient-individual-v019.png"
    webp = assets / "ancient-individual-v019.webp"
    atlas.save(png)
    atlas.save(webp, format="WEBP", lossless=True, exact=True, method=4)
    assert Image.open(webp).convert("RGBA").tobytes() == atlas.tobytes(), "Lossless RGBA mismatch"
    assert Image.open(png).convert("RGBA").tobytes() == atlas.tobytes(), "PNG RGBA mismatch"
    shutil.copyfile(png, delivery / png.name)
    contact.save(delivery / "ancient-individual-contact-sheet-v019.png")
    weapon_contact.save(delivery / "ancient-weapon-anchor-contact-sheet-v019.png")
    # Read the current manifest only after all preparation has succeeded, so
    # unrelated concurrent edits stay intact. Replace only this atlas property
    # and its delivery mapping; historical assets remain available in source.
    manifest_path = assets / "manifest.json"
    manifest = load_json(manifest_path)
    manifest["equipmentRarities"] = {"id": "ancient_individual_v019", "actor": "equipment",
                                     "name": "ancient_individual", "image": png.name,
                                     "fps": 1, "loop": False, "frames": frames, "designIds": ids}
    manifest.setdefault("delivery", {})[png.name] = webp.name
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {"atlasSize": list(atlas.size), "cellSize": CELL, "targetSpriteSize": TARGET,
              "rgbaBytes": atlas.width * atlas.height * 4, "pngBytes": png.stat().st_size,
              "webpBytes": webp.stat().st_size, "rgbaEqual": True,
              "uniqueSourceFileHashes": len({row["sourceFileSHA256"] for row in records}),
              "uniqueSpriteHashes": len({row["spriteRGBAsha256"] for row in records}),
              "weaponGripCount": sum(row["slot"] == "weapon" for row in records),
              "slotCounts": dict(counts),
              "manualGripReviewIds": [row["id"] for row in records if row["anchor"] and row["anchor"]["manualGripReviewFlags"]],
              "scope": "60 independently generated silhouettes; original files preserved byte for byte; technical alpha bounds, nearest resize, atlas packing and lossless encoding only",
              "sprites": records}
    (ROOT / "tools/reports/ancient-art-alpha019.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    provenance = ["도구: built-in image_gen, 각 아이템별 투명 배경 이미지 생성.",
                  "기술 후처리: 알파 경계 자르기, NEAREST 크기 조절, 10x6 아틀라스 배치, lossless WebP.",
                  "생성 원본 PNG는 변경 없이 보존. 손잡이 앵커는 프롬프트 14% 위치의 불투명 픽셀로 추정하며 실제 착용 검수는 별도로 수행.",
                  "최종 저장 폴더: " + str(delivery), ""]
    for row, record in zip(plan, records):
        provenance.extend([row["id"] + " | " + row["name"], "원본 경로: " + record["nativePath"],
                           "최종 경로: " + record["outputAssetPath"], row["prompt"], "", "---", ""])
    (ROOT.parents[1] / "outputs/고대-개별장비-제작-프롬프트.txt").write_text("\n".join(provenance), encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "sprites"}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
