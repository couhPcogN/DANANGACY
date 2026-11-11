class ItineraryNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__("Không tìm thấy lịch trình.")


class InvalidScheduleError(Exception):
    """A schedule violates a business rule."""


class ItineraryConflictError(Exception):
    """The client attempted to edit an outdated itinerary version."""
