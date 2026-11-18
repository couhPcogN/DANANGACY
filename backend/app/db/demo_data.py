# Stable slugs link mobile demo places to database-generated IDs.
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

DEMO_QUIZ = {
    "destination_slug": "cham",
    "title": "Hiện vật Chăm Pa",
    "description": "Thử thách kiến thức văn hóa và hiện vật Chăm Pa tại Đà Nẵng.",
    "pass_score": 3,
    "reward_points": 50,
    "questions": [
        {
            "question": "Muốn biết tên một hiện vật, bạn nên làm gì?",
            "options": [
                "Đọc bảng thông tin bên cạnh",
                "Đoán theo kích thước",
                "Chỉ nhìn màu sắc",
                "Bỏ qua phần giới thiệu",
            ],
            "correct_index": 0,
            "explanation": "Bảng thông tin giúp bạn hiểu đúng tên và ý nghĩa của hiện vật.",
        },
        {
            "question": "Bảo tàng Điêu khắc Chăm chủ yếu giới thiệu loại hình nghệ thuật nào?",
            "options": [
                "Đồ gốm hiện đại",
                "Điêu khắc Chăm",
                "Tranh sơn dầu châu Âu",
                "Nghệ thuật in ấn",
            ],
            "correct_index": 1,
            "explanation": "Bảo tàng lưu giữ và giới thiệu nhiều tác phẩm điêu khắc Chăm.",
        },
        {
            "question": "Để hiểu thêm về hiện vật, bạn có thể hỏi ai?",
            "options": [
                "Người bán hàng bên ngoài",
                "Hướng dẫn viên bảo tàng",
                "Bất kỳ người qua đường",
                "Không cần hỏi ai",
            ],
            "correct_index": 1,
            "explanation": "Hướng dẫn viên bảo tàng có thể giải thích bối cảnh hiện vật.",
        },
        {
            "question": "Khi ngắm hiện vật, bạn nên làm gì để bảo vệ tác phẩm?",
            "options": [
                "Chạm tay để cảm nhận",
                "Quan sát, không chạm tay",
                "Tựa vào hiện vật để chụp ảnh",
                "Di chuyển hiện vật cho dễ nhìn",
            ],
            "correct_index": 1,
            "explanation": "Quan sát và không chạm tay giúp bảo vệ hiện vật.",
        },
        {
            "question": "Cách nào giúp chia sẻ di sản có trách nhiệm?",
            "options": [
                "Viết thêm chi tiết cho hấp dẫn",
                "Đăng tin chưa kiểm chứng",
                "Chia sẻ thông tin từ bảo tàng",
                "Bỏ qua nguồn thông tin",
            ],
            "correct_index": 2,
            "explanation": "Chia sẻ thông tin đã được bảo tàng xác nhận để giữ tính chính xác.",
        },
    ],
}

DEMO_VOUCHERS = [
    {
        "title": "Cà phê bên sông Hàn",
        "description": "Giảm 20% đồ uống tại các quán cà phê ngắm cảnh sông Hàn.",
        "merchant_name": "Góc Hàn River",
        "points_cost": 100,
        "total_stock": 50,
    },
    {
        "title": "Bưu thiếp Đà Nẵng",
        "description": "Một bộ bưu thiếp ảnh nghệ thuật phong cảnh danh thắng Đà Nẵng.",
        "merchant_name": "Quà tặng Di sản",
        "points_cost": 80,
        "total_stock": 30,
    },
    {
        "title": "Trải nghiệm thủ công",
        "description": "Giảm 15% trải nghiệm tự tay tạc đá mỹ nghệ Non Nước.",
        "merchant_name": "Làng nghề Non Nước",
        "points_cost": 150,
        "total_stock": 20,
    },
]
