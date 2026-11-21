/**
 * DANANGACY — Itinerary Sync Coordinator
 *
 * Quản lý thứ tự (sequence), thế hệ phiên xác thực (auth session generation),
 * và thế hệ biến đổi dữ liệu (mutation generation) nhằm bảo vệ tính toàn vẹn dữ liệu,
 * ngăn chặn race conditions giữa Remote Fetch và CRUD mutations / Account transitions.
 */

// 1. Sequence toàn cục cho các yêu cầu Fetch
let globalFetchSeq = 0;

// 2. Auth Session Generation theo accountKey: Định danh phiên đăng nhập độc lập với account UID
const accountSessionGens = new Map<string, number>();
const accountTokens = new Map<string, string>();

// 3. Map theo dõi mutation generation và số lượng mutation đang in-flight theo accountKey
export interface AccountSyncState {
  mutationSeq: number;
  activeMutationsCount: number;
}
const accountStates = new Map<string, AccountSyncState>();

// 4. Map in-flight fetch promises: key = `${accountKey}:gen_${sessionGen}`
const inFlightFetches = new Map<string, Promise<unknown>>();

/**
 * Lấy sequence fetch hiện tại
 */
export function getFetchSeq(): number {
  return globalFetchSeq;
}

/**
 * Tăng và trả về sequence fetch tiếp theo
 */
export function nextFetchSeq(): number {
  return ++globalFetchSeq;
}

/**
 * Xác định thế hệ phiên đăng nhập (Session Generation ID) theo accountKey.
 * Tuyệt đối không log hay dùng raw token làm key public.
 */
export function getSessionGeneration(accountKey: string, token: string | null | undefined): number {
  if (!token || !token.trim()) {
    return 0;
  }
  const cleanToken = token.trim();
  let gen = accountSessionGens.get(accountKey) ?? 0;
  const lastToken = accountTokens.get(accountKey);
  if (cleanToken !== lastToken || gen === 0) {
    gen = (accountSessionGens.get(accountKey) ?? 0) + 1;
    accountSessionGens.set(accountKey, gen);
    accountTokens.set(accountKey, cleanToken);
  }
  return gen;
}

/**
 * Lấy thế hệ phiên đăng nhập hiện hành của một accountKey
 */
export function getCurrentSessionGeneration(accountKey: string): number {
  return accountSessionGens.get(accountKey) ?? 0;
}

/**
 * Vô hiệu hoá session của một account khi đăng xuất
 */
export function invalidateAccountSession(accountKey: string): void {
  const nextGen = (accountSessionGens.get(accountKey) ?? 0) + 1;
  accountSessionGens.set(accountKey, nextGen);
  accountTokens.delete(accountKey);
  for (const [key] of inFlightFetches) {
    if (key.startsWith(`${accountKey}:`)) {
      inFlightFetches.delete(key);
    }
  }
}

/**
 * Làm mới và vô hiệu hoá session khi đăng xuất hoặc đổi tài khoản.
 * Tăng session generation để loại bỏ toàn bộ các response đang in-flight của session trước.
 */
export function invalidateAuthSession(accountKey?: string): void {
  if (accountKey) {
    invalidateAccountSession(accountKey);
  } else {
    for (const [key, gen] of accountSessionGens) {
      accountSessionGens.set(key, gen + 1);
    }
    accountTokens.clear();
    inFlightFetches.clear();
  }
}

/**
 * Lấy mutation generation hiện tại của account
 */
export function getMutationSeq(accountKey: string): number {
  return accountStates.get(accountKey)?.mutationSeq ?? 0;
}

/**
 * Lấy số lượng mutation đang chạy in-flight của account
 */
export function getActiveMutationsCount(accountKey: string): number {
  return accountStates.get(accountKey)?.activeMutationsCount ?? 0;
}

/**
 * Đánh dấu bắt đầu một thao tác biến đổi dữ liệu (CRUD mutation: CREATE, UPDATE, DELETE).
 * Invalidate các GET đang in-flight của account này.
 */
export function beginMutation(accountKey: string): number {
  // Tăng globalFetchSeq để làm stale bất kỳ fetch nào đang chạy trước hoặc cùng lúc
  globalFetchSeq++;

  const state = accountStates.get(accountKey) ?? { mutationSeq: 0, activeMutationsCount: 0 };
  state.mutationSeq++;
  state.activeMutationsCount++;
  accountStates.set(accountKey, state);

  // Xóa các in-flight fetch của account này
  for (const [key] of inFlightFetches) {
    if (key.startsWith(`${accountKey}:`)) {
      inFlightFetches.delete(key);
    }
  }

  return state.mutationSeq;
}

/**
 * Đánh dấu kết thúc một thao tác biến đổi dữ liệu (thành công, thất bại, hoặc rollback).
 * Invalidate các GET có thể đã khởi chạy trong lúc mutation đang xử lý.
 */
export function endMutation(accountKey: string): number {
  // Tiếp tục tăng globalFetchSeq để bảo đảm mọi fetch khởi chạy trong lúc mutation đều bị stale
  globalFetchSeq++;

  const state = accountStates.get(accountKey) ?? { mutationSeq: 0, activeMutationsCount: 0 };
  state.mutationSeq++;
  state.activeMutationsCount = Math.max(0, state.activeMutationsCount - 1);
  accountStates.set(accountKey, state);

  return state.mutationSeq;
}

/**
 * Truy vấn in-flight fetch promise theo accountKey và sessionGen (F-02)
 */
export function getInFlightFetch<T>(
  accountKey: string,
  sessionGen: number,
): Promise<T> | undefined {
  const key = `${accountKey}:gen_${sessionGen}`;
  return inFlightFetches.get(key) as Promise<T> | undefined;
}

/**
 * Lưu in-flight fetch promise theo accountKey và sessionGen (F-02)
 */
export function setInFlightFetch<T>(
  accountKey: string,
  sessionGen: number,
  promise: Promise<T>,
): void {
  const key = `${accountKey}:gen_${sessionGen}`;
  inFlightFetches.set(key, promise);
}

/**
 * Dọn dẹp in-flight fetch promise khi hoàn thành (F-02)
 * Chỉ xóa nếu promise đang lưu đúng bằng promise kết thúc để tránh xóa nhầm request mới.
 */
export function clearInFlightFetch(
  accountKey: string,
  sessionGen: number,
  promise?: Promise<unknown>,
): void {
  const key = `${accountKey}:gen_${sessionGen}`;
  if (promise) {
    if (inFlightFetches.get(key) === promise) {
      inFlightFetches.delete(key);
    }
  } else {
    inFlightFetches.delete(key);
  }
}

/**
 * Reset toàn bộ sync coordinator (dùng trong test suite)
 */
export function resetSyncCoordinator(): void {
  globalFetchSeq = 0;
  accountSessionGens.clear();
  accountTokens.clear();
  accountStates.clear();
  inFlightFetches.clear();
}
