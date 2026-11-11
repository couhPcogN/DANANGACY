from uuid import NAMESPACE_URL, UUID, uuid5

# Stable IDs allow the frontend's existing string IDs to be mapped to destination UUIDs.
DEMO_DESTINATIONS = (
    ("cham", "Bảo tàng Điêu khắc Chăm", "INDOOR"),
    ("son-tra", "Bán đảo Sơn Trà", "OUTDOOR"),
    ("cau-rong", "Cầu Rồng", "OUTDOOR"),
    ("ngu-hanh-son", "Ngũ Hành Sơn", "OUTDOOR"),
    ("bao-tang-dn", "Bảo tàng Đà Nẵng", "INDOOR"),
    ("chua-cau", "Chùa Cầu", "OUTDOOR"),
    ("tan-ky", "Nhà cổ Tấn Ký", "INDOOR"),
    ("hoai-river", "Bờ sông Hoài", "OUTDOOR"),
)


def destination_uuid(slug: str) -> UUID:
    return uuid5(NAMESPACE_URL, f"danangacy:destination:{slug}")
