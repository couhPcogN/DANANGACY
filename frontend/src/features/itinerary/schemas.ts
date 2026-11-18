import type { Stop } from './types';

const timeValue = (time: string) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
    : -1;
export function validateStops(stops: Stop[], duration = 1): string | null {
  if (!Number.isInteger(duration) || duration < 1 || duration > 3)
    return 'Lịch trình phải kéo dài từ 1 đến 3 ngày.';
  if (stops.length < 1 || stops.length > 8) return 'Lịch trình phải có từ 1 đến 8 điểm dừng.';
  const placeIds = new Set<string>();
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const dayIndex = stop.dayIndex ?? 1;
    if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > duration)
      return `Điểm "${stop.placeId}" thuộc ngày vượt quá số ngày của lịch trình.`;
    if (placeIds.has(stop.placeId))
      return 'Không được có hai điểm trùng nhau trong cùng lịch trình.';
    placeIds.add(stop.placeId);
    const start = timeValue(stop.start),
      end = timeValue(stop.end);
    if (start < 0 || end < 0 || start >= end)
      return 'Giờ bắt đầu phải sớm hơn giờ kết thúc và đúng định dạng HH:mm.';
    if (end - start < 30) return 'Mỗi điểm dừng phải có thời lượng ít nhất 30 phút.';
    if (start < 360 || end > 1320) return 'Khung giờ nằm ngoài giờ tham quan gợi ý 06:00–22:00.';
    if (stops.some((other, j) =>
      j !== i &&
      (other.dayIndex ?? 1) === dayIndex &&
      timeValue(other.start) < end &&
      timeValue(other.end) > start
    ))
      return 'Khung giờ này trùng với một điểm đến khác.';
  }
  return null;
}

export function validateItineraryStops(
  stops: Stop[],
  duration: number,
  nextDuration?: number,
): string | null {
  const targetDuration = nextDuration ?? duration;
  if (targetDuration < duration) {
    const removedDayStops = stops.some(
      (stop) => (stop.dayIndex ?? 1) > targetDuration,
    );
    if (removedDayStops)
      return 'Có điểm tham quan thuộc ngày bị loại bỏ. Hãy chuyển hoặc xóa các điểm trước khi giảm số ngày.';
  }
  return validateStops(stops, targetDuration);
}
