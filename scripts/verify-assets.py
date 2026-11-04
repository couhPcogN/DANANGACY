"""Verify every embedded image from the SVG export has a local, matching app asset."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "design/exports/manifest.json").read_text(encoding="utf-8"))
figma_nodes = json.loads((ROOT / "design/figma-nodes.json").read_text(encoding="utf-8"))
data_code = (ROOT / "src/data.ts").read_text(encoding="utf-8")
expected = set(manifest["images"])
for asset in expected:
    path = ROOT / "assets/images" / asset
    assert path.is_file() and path.stat().st_size > 0, f"Missing or empty: {asset}"
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    assert asset.startswith(f"asset-{digest}."), f"Hash mismatch: {asset}"
    assert asset in data_code, f"No app callsite: {asset}"
for frame in manifest["frames"]:
    assert (ROOT / "design/exports" / frame["source"]).is_file(), frame["id"]
    assert (ROOT / "design/previews" / f"{frame['id']}.png").is_file(), frame["id"]
    for image in frame["images"]:
        assert Path(image["asset"]).name in expected, frame["id"]
local_ids = {frame["id"] for frame in manifest["frames"]}
mapped_ids = {frame["id"] for frame in figma_nodes["frames"]}
node_ids = [frame["nodeId"] for frame in figma_nodes["frames"]]
assert mapped_ids == local_ids and len(figma_nodes["frames"]) == len(local_ids), "Incomplete Figma node mapping"
assert len(node_ids) == len(set(node_ids)) and all(re.fullmatch(r"\d+:\d+", node) for node in node_ids), "Invalid or duplicate Figma node ID"
assert not re.search(r"https?://[^\s]+figma", data_code), "Remote Figma URL in app assets"
print(f"Verified {len(manifest['frames'])} Figma frame mappings and {len(expected)} exact local image assets")
