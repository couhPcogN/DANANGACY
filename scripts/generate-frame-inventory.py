"""Regenerate the Danangacy frame inventory from the imported SVG manifest."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "design" / "exports" / "manifest.json"
FIGMA_NODES = ROOT / "design" / "figma-nodes.json"
OUTPUT = ROOT / "docs" / "docs" / "figma" / "FRAME_INVENTORY.md"


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    live = json.loads(FIGMA_NODES.read_text(encoding="utf-8"))
    nodes = {frame["id"]: frame["nodeId"] for frame in live["frames"]}
    lines = [
        "# DANANGACY — danh mục frame xuất từ Figma",
        "",
        f"Có **{data['frame_count']} frame SVG** do chủ dự án cung cấp. ID `frame-xxx` là ID cục bộ trong export. Node ID trực tuyến được đối chiếu ngày {live['verifiedAt']} và lưu tại [figma-nodes.json](../../../design/figma-nodes.json). Tên gốc và kích thước SVG nằm trong [manifest](../../../design/exports/manifest.json).",
        "",
        "SVG chứa hình học và ảnh nhưng chữ đã chuyển thành path. PNG bên dưới chỉ để tham chiếu; không được dùng làm màn hình app.",
        "",
        "| ID | Tên frame | Kích thước SVG | Ảnh gốc | Xem | Figma |",
        "|---|---|---:|---:|---|---|",
    ]
    for frame in data["frames"]:
        frame_id = frame["id"]
        name = frame["name"].replace("|", "\\|")
        size = f"{frame['width']}×{frame['height']}"
        node_id = nodes[frame_id]
        figma_url = f"https://www.figma.com/design/{live['fileKey']}/danangacy?node-id={node_id.replace(':', '-')}"
        lines.append(f"| `{frame_id}` | {name} | {size} | {len(frame['images'])} | [PNG](../../../design/previews/{frame_id}.png) · [SVG](../../../design/exports/{frame_id}.svg) | [{node_id}]({figma_url}) |")
    lines += [
        "",
        "## Nhóm luồng",
        "",
        "- A01–A06: xác thực và khách xem trước.",
        "- B01–B06, Explore: khám phá, chi tiết điểm đến, bản đồ và yêu thích.",
        "- C01–C07J: lịch trình có sẵn, tạo, lưu, xem, chỉnh sửa và các lỗi thời gian.",
        "- D01–D03: cảnh báo mưa, gợi ý và xác nhận thay thế.",
        "- E01–E05: thử thách, 5 câu với trạng thái chọn/xác nhận, kết quả và xem lại.",
        "- F01–F04: điểm di sản, ưu đãi và đổi điểm mô phỏng.",
        "- G01–G03A: hồ sơ, chỉnh sửa và yêu thích.",
        "- Hai frame Home: trước và sau khi tạo lịch mới.",
        "",
    ]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({len(data['frames'])} frames)")


if __name__ == "__main__":
    main()
