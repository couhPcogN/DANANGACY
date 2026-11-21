import type { AuthUser } from '../../features/auth/types';
import { initialItinerary } from '../../features/itinerary/data/demoItineraries';
import { cloneItinerary } from '../../features/itinerary/models/itinerary';
import type { Itinerary, Stop } from '../../features/itinerary/types';
import { localStorage } from './localStorage';

export type AccountContext = {
  signedIn?: boolean;
  user?: (Partial<AuthUser> & { uid?: string }) | null;
};

export const GUEST_ITINERARIES_KEY = 'danangacy.itineraries.guest';
export const LEGACY_STORAGE_KEY = 'danangacy.demo.v1';
export const UNCLAIMED_LEGACY_KEY = 'danangacy.itineraries.unclaimed_legacy';
export const QUARANTINE_KEY_PREFIX = 'danangacy.itineraries.quarantine.';

/**
 * Tạo khóa lưu trữ cô lập cho từng tài khoản.
 *
 * Tiêu chuẩn định danh Canonical:
 * 1. Khách (Guest) -> 'danangacy.itineraries.guest'
 * 2. Tài khoản Authenticated:
 *    - Ưu tiên 1 (Canonical Backend UID): 'danangacy.itineraries.user.<user.uid>'
 *    - Ưu tiên 2 (Legacy Demo/Mock ID): 'danangacy.itineraries.user.<user.id>'
 * 3. Nếu không xác định được định danh ổn định, ném lỗi rõ ràng (tuyệt đối không fallback sang unknown/email/JWT).
 */
export function getAccountStorageKey(account?: AccountContext | null): string {
  if (!account || !account.signedIn || !account.user) {
    return GUEST_ITINERARIES_KEY;
  }
  const { user } = account;

  // 1. Canonical Backend UID có độ ưu tiên cao nhất
  const userUid = typeof user.uid === 'string' && user.uid.trim() ? user.uid.trim() : null;
  if (userUid) {
    return `danangacy.itineraries.user.${userUid}`;
  }

  // 2. Legacy demo / mock identifier (hỗ trợ tương thích ngược)
  const legacyId =
    typeof user.id === 'number' && Number.isInteger(user.id) && user.id > 0
      ? String(user.id)
      : null;
  if (legacyId) {
    return `danangacy.itineraries.user.${legacyId}`;
  }

  throw new Error(
    'Không thể xác định định danh người dùng ổn định (user.uid/id) cho vùng lưu trữ tài khoản.',
  );
}

export type ValidationResult = {
  valid: Itinerary[];
  quarantined: unknown[];
};

/**
 * Kiểm định tính hợp lệ của dữ liệu lịch trình mà TUYỆT ĐỐI KHÔNG sửa ngầm (no silent repair).
 * - Nếu dữ liệu vi phạm (ví dụ dayIndex > duration, duration ngoài 1..3, thiếu trường bắt buộc):
 *   Đưa bản ghi gốc vào danh sách quarantined để bảo toàn và cách ly, không tự ý chọn ngày mới.
 * - Dữ liệu hợp lệ được bảo toàn 100% không biến đổi.
 */
export function validateAndQuarantineItineraries(items: unknown[]): ValidationResult {
  if (!Array.isArray(items)) return { valid: [], quarantined: [] };

  const valid: Itinerary[] = [];
  const quarantined: unknown[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      quarantined.push(item);
      continue;
    }
    const itin = item as Partial<Itinerary>;

    // Kiểm tra các trường bắt buộc
    if (typeof itin.id !== 'string' || !itin.id.trim()) {
      quarantined.push(item);
      continue;
    }
    if (typeof itin.title !== 'string' || !itin.title.trim()) {
      quarantined.push(item);
      continue;
    }
    if (
      typeof itin.duration !== 'number' ||
      !Number.isInteger(itin.duration) ||
      itin.duration < 1 ||
      itin.duration > 3
    ) {
      quarantined.push(item);
      continue;
    }
    if (!Array.isArray(itin.stops)) {
      quarantined.push(item);
      continue;
    }

    // Kiểm tra từng điểm dừng và ràng buộc stop.dayIndex <= duration
    let isStopsValid = true;
    for (const stop of itin.stops) {
      if (!stop || typeof stop !== 'object') {
        isStopsValid = false;
        break;
      }
      const s = stop as Partial<Stop>;
      if (!s.placeId || typeof s.placeId !== 'string' || !s.placeId.trim()) {
        isStopsValid = false;
        break;
      }
      // Ràng buộc nghiêm ngặt: dayIndex phải là số nguyên từ 1 đến duration
      if (s.dayIndex !== undefined) {
        if (
          typeof s.dayIndex !== 'number' ||
          !Number.isInteger(s.dayIndex) ||
          s.dayIndex < 1 ||
          s.dayIndex > itin.duration
        ) {
          isStopsValid = false;
          break;
        }
      }
    }

    if (!isStopsValid) {
      // Vi phạm ràng buộc -> Cách ly vào quarantine, TUYỆT ĐỐI KHÔNG sửa ngầm bằng Math.min!
      quarantined.push(item);
      continue;
    }

    // Dữ liệu hợp lệ: giữ nguyên vẹn
    valid.push(itin as Itinerary);
  }

  return { valid, quarantined };
}

/**
 * Làm sạch danh sách: chỉ giữ lại các bản ghi hợp lệ, loại bỏ các bản ghi vi phạm.
 */
export function sanitizeItineraries(items: unknown[]): Itinerary[] {
  return validateAndQuarantineItineraries(items).valid;
}

/**
 * Persistence Coordinator: Tuần tự hoá thao tác ghi theo từng account partition.
 * - Đảm bảo thứ tự FIFO qua Promise chaining.
 * - Tự động coalescing: luôn ghi snapshot mới nhất, loại bỏ out-of-order writes.
 * - Báo cáo lỗi chính xác, không nuốt ngoại lệ.
 * - Cung cấp hàm flush() có thể await tại các ranh giới chuyển đổi tài khoản.
 */
class ItineraryPersistenceCoordinator {
  private writeQueues = new Map<string, Promise<void>>();
  private pendingByAccount = new Map<string, Itinerary[]>();
  private lastError: Error | null = null;

  public getLastError(): Error | null {
    return this.lastError;
  }

  public clearLastError(): void {
    this.lastError = null;
  }

  public hasPending(account?: AccountContext | null): boolean {
    const key = getAccountStorageKey(account);
    return this.pendingByAccount.has(key);
  }

  public getPendingSnapshot(account?: AccountContext | null): Itinerary[] | null {
    const key = getAccountStorageKey(account);
    return this.pendingByAccount.get(key) ?? null;
  }

  public enqueueSave(
    account: AccountContext | null | undefined,
    itineraries: Itinerary[],
  ): Promise<boolean> {
    const key = getAccountStorageKey(account);
    this.pendingByAccount.set(key, itineraries);

    const currentChain = this.writeQueues.get(key) || Promise.resolve();

    const nextChain = currentChain
      .then(async () => {
        const latestSnapshot = this.pendingByAccount.get(key);
        if (!latestSnapshot) return;
        this.pendingByAccount.delete(key);

        await localStorage.write(key, latestSnapshot);
        this.lastError = null;
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        this.lastError = error;
        throw error;
      });

    this.writeQueues.set(
      key,
      nextChain.catch(() => {}),
    );

    return nextChain.then(
      () => true,
      () => false,
    );
  }

  public async flush(account?: AccountContext | null): Promise<boolean> {
    if (account) {
      const key = getAccountStorageKey(account);
      if (this.pendingByAccount.has(key)) {
        await this.enqueueSave(account, this.pendingByAccount.get(key)!);
      }
      const queue = this.writeQueues.get(key);
      if (queue) {
        await queue;
      }
      return this.lastError === null;
    }

    // Flush tất cả các partitions đang có pending writes
    const keys = Array.from(this.pendingByAccount.keys());
    for (const k of keys) {
      const snap = this.pendingByAccount.get(k);
      if (snap) {
        const dummyCtx: AccountContext =
          k === GUEST_ITINERARIES_KEY
            ? { signedIn: false }
            : { signedIn: true, user: { uid: k.replace('danangacy.itineraries.user.', '') } };
        await this.enqueueSave(dummyCtx, snap);
      }
    }
    const allQueues = Array.from(this.writeQueues.values());
    await Promise.all(allQueues);
    return this.lastError === null;
  }
}

export const itineraryPersistence = new ItineraryPersistenceCoordinator();

export const itineraryStorage = {
  getAccountStorageKey,
  validateAndQuarantineItineraries,

  /**
   * Tải danh sách lịch trình theo tài khoản hiện tại.
   */
  async loadItinerariesForAccount(account?: AccountContext | null): Promise<Itinerary[]> {
    try {
      const key = getAccountStorageKey(account);
      const isGuest = key === GUEST_ITINERARIES_KEY;

      const direct = await localStorage.read<unknown>(key);
      if (Array.isArray(direct)) {
        const { valid, quarantined } = validateAndQuarantineItineraries(direct);
        if (quarantined.length > 0) {
          // Lưu dữ liệu vi phạm vào partition cách ly riêng mà không xóa bỏ
          const quarantineKey = `${QUARANTINE_KEY_PREFIX}${key}`;
          await localStorage.write(quarantineKey, quarantined);
        }
        return valid;
      }

      if (isGuest) {
        // Kiểm tra legacy storage để cách ly an toàn
        const legacy = await localStorage.read<{
          signedIn?: boolean;
          user?: unknown;
          itineraries?: unknown[];
          trips?: unknown[];
        }>(LEGACY_STORAGE_KEY);

        const legacyList = legacy?.itineraries || legacy?.trips;
        if (Array.isArray(legacyList) && legacyList.length > 0) {
          // Bảo tồn dữ liệu legacy vào phân vùng chờ xác nhận mà không gán cho Guest
          await localStorage.write(UNCLAIMED_LEGACY_KEY, legacyList);
        }

        const defaultList = [cloneItinerary(initialItinerary)];
        await localStorage.write(GUEST_ITINERARIES_KEY, defaultList);
        return defaultList;
      }

      // User account bắt đầu rỗng nếu chưa có dữ liệu lưu
      return [];
    } catch {
      const isGuest = !account || !account.signedIn;
      return isGuest ? [cloneItinerary(initialItinerary)] : [];
    }
  },

  /**
   * Lưu danh sách lịch trình vào khóa cô lập của tài khoản thông qua Persistence Coordinator.
   */
  async saveItinerariesForAccount(
    account: AccountContext | null | undefined,
    itineraries: Itinerary[],
  ): Promise<boolean> {
    return itineraryPersistence.enqueueSave(account, itineraries);
  },

  /**
   * Chờ toàn bộ các thao tác ghi của tài khoản hoàn tất bền vững xuống đĩa.
   */
  async flush(account?: AccountContext | null): Promise<boolean> {
    return itineraryPersistence.flush(account);
  },
};
