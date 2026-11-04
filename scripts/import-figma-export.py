"""Import the user-provided SVG frame export and extract its embedded photos.

Usage: python scripts/import-figma-export.py D:/Downloads/danangacy
The generated SVG files are design references, never runtime screen assets.
"""

from __future__ import annotations

import base64
import hashlib
import json
import shutil
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXPORTS = ROOT / "design" / "exports"
IMAGES = ROOT / "assets" / "images"


def main(source: Path) -> None:
    if not source.is_dir():
        raise SystemExit(f"Export directory does not exist: {source}")
    EXPORTS.mkdir(parents=True, exist_ok=True)
    IMAGES.mkdir(parents=True, exist_ok=True)

    frames = []
    image_index = {}
    for number, path in enumerate(sorted(source.glob("*.svg"), key=lambda p: p.name.casefold()), 1):
        frame_id = f"frame-{number:03d}"
        tree = ET.parse(path)
        root = tree.getroot()
        images = []
        for node in root.iter():
            if node.tag.rsplit("}", 1)[-1] != "image":
                continue
            href = next((value for key, value in node.attrib.items() if key.endswith("href")), "")
            if not href.startswith("data:image/"):
                continue
            header, payload = href.split(",", 1)
            media_type = header.removeprefix("data:").split(";", 1)[0]
            suffix = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(media_type)
            if not suffix:
                raise ValueError(f"Unsupported image format: {media_type}")
            data = base64.b64decode(payload)
            digest = hashlib.sha256(data).hexdigest()[:12]
            asset_name = f"asset-{digest}.{suffix}"
            target = IMAGES / asset_name
            if not target.exists():
                target.write_bytes(data)
            image_index[asset_name] = {"bytes": len(data), "format": suffix}
            images.append({"asset": f"../../assets/images/{asset_name}", "width": node.get("width"), "height": node.get("height")})

        target_name = f"{frame_id}.svg"
        shutil.copy2(path, EXPORTS / target_name)
        frames.append({
            "id": frame_id,
            "name": path.stem,
            "source": target_name,
            "width": root.get("width"),
            "height": root.get("height"),
            "images": images,
        })

    manifest = {"source": str(source), "frame_count": len(frames), "image_count": len(image_index), "images": image_index, "frames": frames}
    (EXPORTS / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Imported {len(frames)} frames and {len(image_index)} unique images")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/import-figma-export.py <export-directory>")
    main(Path(sys.argv[1]))
