import type { BackendItineraryRead } from '../../../services/api/itineraryService';
import { ItineraryApiError, itineraryApiService } from '../../../services/api/itineraryService';
import {
  GUEST_ITINERARIES_KEY,
  getAccountStorageKey,
  itineraryStorage,
} from '../../../services/storage/itineraryStorage';
import type { AccountContext } from '../../../services/storage/itineraryStorage';
import { reconcileRemoteItineraries } from '../models/itineraryReconciliation';
import type { ReconciliationResult } from '../models/itineraryReconciliation';
import type { Itinerary } from '../types';
import {
  getFetchSeq,
  nextFetchSeq,
  getSessionGeneration,
  getCurrentSessionGeneration,
  getMutationSeq,
  getActiveMutationsCount,
  getInFlightFetch,
  setInFlightFetch,
  clearInFlightFetch,
  resetSyncCoordinator,
  invalidateAuthSession,
} from './itinerarySyncCoordinator';

export type FetchModelContext = {
  itineraries: Itinerary[];
  reconcileRemote: (remote: BackendItineraryRead[]) => ReconciliationResult;
  setRemoteRefreshing?: (isRefreshing: boolean) => void;
  setRemoteRefreshError?: (error: string | null) => void;
};

export type FetchAuthContext = {
  signedIn: boolean;
  token: string | null;
  user: { uid?: string; id?: number; email?: string; display_name?: string } | null;
};

export type FetchResult = {
  success: boolean;
  reconciliation?: ReconciliationResult;
  error?: string;
  statusCode?: number;
  skipped?: boolean;
};

// Re-export backward-compatible functions for existing test suites
export const resetFetchTracker = resetSyncCoordinator;
export const getGlobalFetchSeq = getFetchSeq;
export { invalidateAuthSession };

function isApiError(err: unknown): err is ItineraryApiError {
  return (
    err instanceof ItineraryApiError ||
    (typeof err === 'object' &&
      err !== null &&
      (err as { name?: string }).name === 'ItineraryApiError')
  );
}

export async function orchestrateRemoteFetchItineraries(params: {
  model: FetchModelContext;
  auth: FetchAuthContext;
  getCurrentAuth?: () => FetchAuthContext;
  notify?: (msg: string) => void;
  apiService?: typeof itineraryApiService;
  isInitialFetch?: boolean;
  force?: boolean;
}): Promise<FetchResult> {
  const { model, auth, isInitialFetch, force } = params;
  const apiService = params.apiService ?? itineraryApiService;

  // 1. Kiểm tra điều kiện tiên quyết: Guest và người dùng chưa xác thực tuyệt đối KHÔNG fetch
  if (!auth.signedIn || !auth.token) {
    return { success: false, skipped: true, error: 'Unauthenticated or Guest' };
  }

  // Canonical account identity check trước khi tạo storage key
  if (!auth.user?.uid && !auth.user?.id) {
    return { success: false, skipped: true, error: 'Missing canonical user identity' };
  }

  const originatingCtx: AccountContext = {
    signedIn: auth.signedIn,
    user: auth.user,
  };
  const originatingKey = getAccountStorageKey(originatingCtx);

  // Không fetch cho Guest key
  if (originatingKey === GUEST_ITINERARIES_KEY) {
    return { success: false, skipped: true, error: 'Guest partition' };
  }

  // Xác định Session Generation ID (F-02: Auth Session-Scoped Fetch)
  const sessionGen = getSessionGeneration(originatingKey, auth.token);
  if (sessionGen === 0) {
    return { success: false, skipped: true, error: 'Invalid auth token session' };
  }

  // In-flight deduplication: Scoped theo cả accountKey VÀ sessionGen (F-02)
  if (!force) {
    const existingFetch = getInFlightFetch<FetchResult>(originatingKey, sessionGen);
    if (existingFetch) {
      return existingFetch;
    }
  }

  const seq = nextFetchSeq();
  const initialMutationSeq = getMutationSeq(originatingKey);

  model.setRemoteRefreshing?.(true);
  model.setRemoteRefreshError?.(null);

  let activePromise: Promise<FetchResult> | null = null;
  const execute = async (): Promise<FetchResult> => {
    try {
      const remoteList = await apiService.fetchItineraries(auth.token!);

      // Kiểm tra trạng thái auth sau khi phản hồi trả về
      const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
      const currentKey = getAccountStorageKey({
        signedIn: currentAuth.signedIn,
        user: currentAuth.user,
      });

      // 1. Stale Sequence Guard: Nếu có request fetch mới hơn đã phát sinh, bỏ qua response cũ
      if (seq < getFetchSeq()) {
        return { success: false, skipped: true, error: 'Stale sequence' };
      }

      // 2. Auth Session Guard (F-02): Nếu phiên đăng nhập của account này đã bị invalidate hoặc đổi token
      const currentOriginatingSessionGen = getCurrentSessionGeneration(originatingKey);
      if (currentOriginatingSessionGen !== sessionGen) {
        return { success: false, skipped: true, error: 'Session invalidated' };
      }

      // 3. Mutation Generation Guard (F-01 & F-03):
      // Nếu có bất kỳ CRUD mutation nào đã xảy ra hoặc đang in-flight trong khoảng thời gian fetch,
      // snapshot từ server không còn tương thích -> DISCARD, không merge và không hồi sinh item đã xóa!
      const currentMutationSeq = getMutationSeq(originatingKey);
      const activeMutations = getActiveMutationsCount(originatingKey);
      if (currentMutationSeq !== initialMutationSeq || activeMutations > 0) {
        return { success: false, skipped: true, error: 'Mutation occurred during fetch' };
      }

      // 4. Account Switch Guard:
      if (currentKey === originatingKey) {
        // Vẫn cùng tài khoản và không có mutation: áp dụng reconciliation vào in-memory model an toàn
        const reconciliation = model.reconcileRemote(remoteList);

        // Lưu trữ kết quả đối soát vào account partition
        await itineraryStorage.saveItinerariesForAccount(originatingCtx, reconciliation.reconciled);
        await itineraryStorage.flush(originatingCtx);

        model.setRemoteRefreshing?.(false);
        model.setRemoteRefreshError?.(null);

        if (!isInitialFetch && params.notify) {
          params.notify('Đã làm mới lịch trình từ máy chủ.');
        }

        return { success: true, reconciliation };
      } else {
        // Tài khoản đã thay đổi trong khi fetch in-flight:
        // TUYỆT ĐỐI KHÔNG chạm vào model của tài khoản mới!
        // Lưu an toàn vào partition của tài khoản gốc
        const originatingItems = await itineraryStorage.loadItinerariesForAccount(originatingCtx);
        const reconciliation = reconcileRemoteItineraries(originatingItems, remoteList);
        await itineraryStorage.saveItinerariesForAccount(originatingCtx, reconciliation.reconciled);
        await itineraryStorage.flush(originatingCtx);

        return { success: true, reconciliation, skipped: true };
      }
    } catch (error) {
      const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
      const currentKey = getAccountStorageKey({
        signedIn: currentAuth.signedIn,
        user: currentAuth.user,
      });

      let errorMsg = 'Lỗi đồng bộ lịch trình từ máy chủ.';
      let statusCode = 500;

      if (isApiError(error)) {
        statusCode = error.status ?? 500;
        if (statusCode === 401 || statusCode === 403) {
          errorMsg = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (statusCode === 0) {
          errorMsg = 'Mất kết nối mạng khi tải danh sách lịch trình.';
        } else {
          errorMsg = error.message || `Lỗi tải lịch trình (HTTP ${statusCode}).`;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      if (currentKey === originatingKey) {
        model.setRemoteRefreshing?.(false);
        model.setRemoteRefreshError?.(errorMsg);
        if (!isInitialFetch && params.notify) {
          params.notify(errorMsg);
        }
      }

      return { success: false, error: errorMsg, statusCode };
    } finally {
      if (activePromise) {
        clearInFlightFetch(originatingKey, sessionGen, activePromise);
      }
    }
  };

  activePromise = execute();
  setInFlightFetch(originatingKey, sessionGen, activePromise);
  return activePromise;
}
