import type { Itinerary, Stop, DayIndex } from '../../features/itinerary/types';
import { parseVietnamDate } from '../../shared/utils/date';
import type {
  BackendItineraryCreate,
  BackendItineraryRead,
  BackendItineraryStop,
  BackendItineraryUpdate,
} from './itineraryService';

/**
 * Chuyển đổi ngày định dạng Việt Nam DD/MM/YYYY sang định dạng ISO YYYY-MM-DD.
 * Tuyệt đối tránh sử dụng new Date(chuỗi) gây lệch ngày theo múi giờ client.
 */
export function vietnamDateToIso(value: string): string {
  if (!value || typeof value !== 'string') {
    throw new Error('Ngày lịch trình không được để trống.');
  }
  const trimmed = value.trim();
  const parsed = parseVietnamDate(trimmed);
  if (!parsed) {
    throw new Error(
      `Định dạng ngày không hợp lệ hoặc không tồn tại: "${trimmed}". Cần định dạng DD/MM/YYYY.`,
    );
  }
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Chuyển đổi ngày định dạng ISO YYYY-MM-DD từ Backend sang DD/MM/YYYY hiển thị tại Frontend.
 * Kiểm tra tính hợp lệ của ngày theo lịch dương và năm nhuận, không bị ảnh hưởng múi giờ.
 */
export function isoDateToVietnam(value: string): string {
  if (!value || typeof value !== 'string') {
    throw new Error('Ngày ISO từ máy chủ không được để trống.');
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new Error(`Định dạng ngày ISO không hợp lệ: "${value}". Cần định dạng YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Kiểm tra tính hợp lệ bằng UTC date
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Ngày ISO không hợp lệ hoặc không tồn tại trên lịch: "${value}".`);
  }
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dd}/${mm}/${year}`;
}

/**
 * Chuẩn hóa giá trị pace sang tập Literal hợp lệ của Backend cho mục đích đọc/tương thích.
 */
export function normalizePace(pace?: string): 'Thư thả' | 'Cân bằng' | 'Năng động' {
  if (pace === 'Thư thả' || pace === 'Cân bằng' || pace === 'Năng động') {
    return pace;
  }
  return 'Thư thả';
}

/**
 * Xác thực nghiêm ngặt giá trị pace khi chuẩn bị payload gửi lên Backend.
 * Không âm thầm fallback khi giá trị cố tình sai định dạng.
 */
export function validatePace(pace?: string): 'Thư thả' | 'Cân bằng' | 'Năng động' {
  if (pace === undefined || pace === null || pace === '') {
    return 'Thư thả';
  }
  if (pace === 'Thư thả' || pace === 'Cân bằng' || pace === 'Năng động') {
    return pace;
  }
  throw new Error(
    `Nhịp độ lịch trình (pace) không hợp lệ: "${pace}". Chỉ chấp nhận: "Thư thả", "Cân bằng", "Năng động".`,
  );
}

/**
 * Chuyển đổi điểm dừng cục bộ (Stop) sang điểm dừng Backend (BackendItineraryStop).
 * Xác thực nghiêm ngặt dayIndex không âm thầm fallback nếu sai định dạng.
 */
export function mapLocalStopToBackend(stop: Stop): BackendItineraryStop {
  if (!stop.placeId || !stop.placeId.trim()) {
    throw new Error('Mỗi điểm dừng bắt buộc phải có mã địa điểm (placeId).');
  }
  if (stop.dayIndex !== undefined) {
    if (
      typeof stop.dayIndex !== 'number' ||
      !Number.isInteger(stop.dayIndex) ||
      stop.dayIndex < 1 ||
      stop.dayIndex > 3
    ) {
      throw new Error(
        `Ngày của điểm dừng (dayIndex) không hợp lệ: "${stop.dayIndex}". Phải là số nguyên từ 1 đến 3.`,
      );
    }
  }
  return {
    place_id: stop.placeId.trim(),
    day: stop.dayIndex ?? 1,
    start: stop.start,
    end: stop.end,
  };
}

/**
 * Chuyển đổi điểm dừng Backend sang điểm dừng Frontend.
 */
export function mapBackendStopToLocal(stop: BackendItineraryStop): Stop {
  const day = stop.day ?? 1;
  const dayIndex: DayIndex = day >= 1 && day <= 3 ? (day as DayIndex) : 1;
  return {
    placeId: stop.place_id,
    dayIndex,
    start: stop.start,
    end: stop.end,
  };
}

/**
 * Map từ Itinerary cục bộ sang payload tạo mới trên Backend (ItineraryCreate).
 * Xác thực nghiêm ngặt duration, pace và stop dayIndex, không âm thầm sửa dữ liệu sai.
 */
export function mapItineraryToBackendCreate(itinerary: Itinerary): BackendItineraryCreate {
  if (!itinerary.title || !itinerary.title.trim()) {
    throw new Error('Tên lịch trình không được để trống.');
  }
  if (
    typeof itinerary.duration !== 'number' ||
    !Number.isInteger(itinerary.duration) ||
    itinerary.duration < 1 ||
    itinerary.duration > 3
  ) {
    throw new Error(
      `Thời lượng lịch trình (duration) không hợp lệ: "${itinerary.duration}". Phải là số nguyên từ 1 đến 3 ngày.`,
    );
  }
  if (!Array.isArray(itinerary.stops) || itinerary.stops.length === 0) {
    throw new Error('Lịch trình phải chứa ít nhất 1 điểm dừng.');
  }
  if (itinerary.stops.length > 8) {
    throw new Error('Lịch trình không được vượt quá 8 điểm dừng theo quy định của hệ thống.');
  }

  // Ràng buộc nghiệp vụ: ngày của điểm dừng không được vượt quá thời lượng lịch trình
  for (const stop of itinerary.stops) {
    const day = stop.dayIndex ?? 1;
    if (day > itinerary.duration) {
      throw new Error(
        `Ngày của điểm dừng (${day}) vượt quá thời lượng lịch trình (${itinerary.duration} ngày).`,
      );
    }
  }

  return {
    title: itinerary.title.trim(),
    date: vietnamDateToIso(itinerary.date),
    duration: itinerary.duration,
    pace: validatePace(itinerary.pace),
    stops: itinerary.stops.map(mapLocalStopToBackend),
  };
}

/**
 * Map từ Itinerary cục bộ sang payload cập nhật trên Backend (ItineraryUpdate).
 * version là tham số bắt buộc để kích hoạt optimistic concurrency control trên Backend.
 */
export function mapItineraryToBackendUpdate(
  itinerary: Itinerary,
  version: number,
): BackendItineraryUpdate {
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new Error(
      'Phiên bản (version) phải là số nguyên dương hợp lệ (>= 1) để cập nhật lịch trình.',
    );
  }
  if (!itinerary.title || !itinerary.title.trim()) {
    throw new Error('Tên lịch trình không được để trống.');
  }
  if (
    typeof itinerary.duration !== 'number' ||
    !Number.isInteger(itinerary.duration) ||
    itinerary.duration < 1 ||
    itinerary.duration > 3
  ) {
    throw new Error(
      `Thời lượng lịch trình (duration) không hợp lệ: "${itinerary.duration}". Phải là số nguyên từ 1 đến 3 ngày.`,
    );
  }
  if (!Array.isArray(itinerary.stops) || itinerary.stops.length === 0) {
    throw new Error('Lịch trình phải chứa ít nhất 1 điểm dừng.');
  }
  if (itinerary.stops.length > 8) {
    throw new Error('Lịch trình không được vượt quá 8 điểm dừng theo quy định của hệ thống.');
  }

  for (const stop of itinerary.stops) {
    const day = stop.dayIndex ?? 1;
    if (day > itinerary.duration) {
      throw new Error(
        `Ngày của điểm dừng (${day}) vượt quá thời lượng lịch trình (${itinerary.duration} ngày).`,
      );
    }
  }

  return {
    title: itinerary.title.trim(),
    date: vietnamDateToIso(itinerary.date),
    duration: itinerary.duration,
    pace: validatePace(itinerary.pace),
    stops: itinerary.stops.map(mapLocalStopToBackend),
    version,
  };
}

/**
 * Map từ phản hồi ItineraryRead của Backend sang Itinerary model của Frontend.
 * remoteId và version được lưu giữ nguyên bản từ Backend.
 */
export function mapBackendToLocalItinerary(
  backend: BackendItineraryRead,
  existingLocalId?: string,
): Itinerary {
  if (typeof backend.id !== 'number' || !Number.isInteger(backend.id) || backend.id <= 0) {
    throw new Error(`Dữ liệu máy chủ không hợp lệ: id "${backend.id}" không phải số nguyên dương.`);
  }
  if (
    typeof backend.version !== 'number' ||
    !Number.isInteger(backend.version) ||
    backend.version < 1
  ) {
    throw new Error(
      `Dữ liệu máy chủ không hợp lệ: version "${backend.version}" không phải số nguyên dương.`,
    );
  }

  return {
    id: existingLocalId || `itin-${backend.id}`,
    remoteId: backend.id,
    version: backend.version,
    syncStatus: 'synced',
    title: backend.title,
    date: isoDateToVietnam(backend.date),
    duration: backend.duration ?? 1,
    pace: normalizePace(backend.pace),
    stops: (backend.stops || []).map(mapBackendStopToLocal),
    saved: true,
  };
}
