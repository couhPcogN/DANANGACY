class ItineraryNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__("Không tìm thấy lịch trình.")


class InvalidScheduleError(Exception):
    """A schedule violates a business rule."""


class ItineraryConflictError(Exception):
    """The client attempted to edit an outdated itinerary version."""


class AuthenticationError(Exception):
    """Missing, invalid or expired credentials (HTTP 401)."""


class EmailAlreadyRegisteredError(Exception):
    def __init__(self) -> None:
        super().__init__("Email này đã được đăng ký.")


class DestinationNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__("Không tìm thấy địa điểm.")


class QuizNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__("Không tìm thấy bài trắc nghiệm di sản.")


class InvalidQuizSubmissionError(Exception):
    def __init__(self, message: str = "Bài nộp trắc nghiệm không hợp lệ.") -> None:
        super().__init__(message)


class VoucherOfferNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__("Không tìm thấy ưu đãi.")


class InsufficientPointsError(Exception):
    def __init__(self, required: int, current: int) -> None:
        super().__init__(f"Điểm tích lũy không đủ ({current}/{required} điểm).")


class VoucherAlreadyClaimedError(Exception):
    def __init__(self) -> None:
        super().__init__("Bạn đã nhận ưu đãi này trước đó.")


class VoucherOutOfStockError(Exception):
    def __init__(self) -> None:
        super().__init__("Ưu đãi này đã hết lượt đổi.")
