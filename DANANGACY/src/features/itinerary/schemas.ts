import type { Stop } from './types';

const timeValue = (time: string) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
    : -1;
export function validateStops(stops: Stop[]): string | null {
  for (let i = 0; i < stops.length; i++) {
    const start = timeValue(stops[i].start),
      end = timeValue(stops[i].end);
    if (start < 0 || end < 0 || start >= end)
      return 'Giờ bắt đầu phải sớm hơn giờ kết thúc và đúng định dạng HH:mm.';
    if (start < 360 || end > 1320) return 'Khung giờ nằm ngoài giờ tham quan gợi ý 06:00–22:00.';
    if (
      stops.some(
        (other, j) => j !== i && timeValue(other.start) < end && timeValue(other.end) > start,
      )
    )
      return 'Khung giờ này trùng với một điểm đến khác.';
  }
  return null;
}
