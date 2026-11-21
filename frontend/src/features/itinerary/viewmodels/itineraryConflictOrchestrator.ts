import type { BackendItineraryRead } from '../../../services/api/itineraryService';
import { ItineraryApiError, itineraryApiService } from '../../../services/api/itineraryService';
import {
  isoDateToVietnam,
  normalizePace,
  mapItineraryToBackendUpdate,
  mapBackendToLocalItinerary,
} from '../../../services/api/itineraryMapping';
import {
  GUEST_ITINERARIES_KEY,
  getAccountStorageKey,
} from '../../../services/storage/itineraryStorage';
import type { AccountContext } from '../../../services/storage/itineraryStorage';
import { cloneItinerary } from '../models/itinerary';
import type { Itinerary, SyncStatus } from '../types';
import {
  beginMutation,
  endMutation,
  getCurrentSessionGeneration,
} from './itinerarySyncCoordinator';
import { applyToPartitionStorage, defaultConfirm } from './itineraryCrudOrchestrator';
import type { ConfirmFn } from './itineraryCrudOrchestrator';
import { notify as defaultNotify } from '../../../shared/utils/notify';

export type ConflictAuthContext = {
  signedIn: boolean;
  token: string | null;
  user: { uid?: string; id?: number; email?: string; display_name?: string } | null;
};

export type ConflictModelContext = {
  itineraries: Itinerary[];
  getItinerary?: (id: string) => Itinerary | undefined;
  replaceItinerary?: (id: string, updated: Itinerary) => boolean;
  replaceItineraries?: (itineraries: Itinerary[]) => void;
  attachRemoteMetadata: (localId: string, remoteId: number, version: number) => boolean;
  updateSyncStatus: (localId: string, status: SyncStatus) => boolean;
};

export type ConflictFetchResult = {
  success: boolean;
  remote?: BackendItineraryRead;
  isDeleted?: boolean;
  error?: string;
  statusCode?: number;
  cancelled?: boolean;
};

export type ConflictDiff = {
  titleChanged: boolean;
  dateChanged: boolean;
  durationChanged: boolean;
  paceChanged: boolean;
  stopsChanged: boolean;
  hasDifferences: boolean;
  remoteVietnamDate: string;
  remoteNormalizedPace: string;
};

export type KeepLocalResult = {
  success: boolean;
  updated?: BackendItineraryRead;
  conflictAgain?: boolean;
  timeout?: boolean;
  persistenceFailed?: boolean;
  error?: string;
  accountSwitched?: boolean;
};

export type UseServerResult = {
  success: boolean;
  cancelled?: boolean;
  localModifiedSinceOpen?: boolean;
  remoteChanged?: boolean;
  latestRemote?: BackendItineraryRead;
  error?: string;
};

export type ResolveLaterResult = {
  success: boolean;
  deferred: boolean;
};

function isApiError(err: unknown): err is ItineraryApiError {
  return (
    err instanceof ItineraryApiError ||
    (typeof err === 'object' &&
      err !== null &&
      (err as { name?: string }).name === 'ItineraryApiError')
  );
}

/**
 * Tải snapshot mới nhất từ máy chủ cho một remoteId cụ thể.
 * Xác minh tính hợp lệ của tài khoản, thế hệ phiên (session generation),
 * và định dạng dữ liệu trả về từ Backend.
 */
export async function fetchConflictRemoteSnapshot(params: {
  remoteId: number;
  auth: ConflictAuthContext;
  getCurrentAuth?: () => ConflictAuthContext;
  apiService?: typeof itineraryApiService;
}): Promise<ConflictFetchResult> {
  const { remoteId, auth } = params;
  const apiService = params.apiService ?? itineraryApiService;

  if (!auth.signedIn || !auth.token) {
    return { success: false, error: 'Yêu cầu đăng nhập để kiểm tra phiên bản máy chủ.' };
  }

  if (!auth.user?.uid && !auth.user?.id) {
    return { success: false, error: 'Thiếu định danh tài khoản hợp lệ.' };
  }

  const originatingCtx: AccountContext = {
    signedIn: auth.signedIn,
    user: auth.user,
  };
  const originatingKey = getAccountStorageKey(originatingCtx);

  if (originatingKey === GUEST_ITINERARIES_KEY) {
    return { success: false, error: 'Tài khoản khách không thể xử lý xung đột máy chủ.' };
  }

  const sessionGen = getCurrentSessionGeneration(originatingKey);

  if (!Number.isInteger(remoteId) || remoteId <= 0) {
    return { success: false, error: 'Mã lịch trình máy chủ không hợp lệ.' };
  }

  try {
    const remote = await apiService.getItinerary(remoteId, auth.token);

    const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
    const currentKey = getAccountStorageKey({
      signedIn: currentAuth.signedIn,
      user: currentAuth.user,
    });
    const currentSessionGen = getCurrentSessionGeneration(originatingKey);

    if (currentKey !== originatingKey || currentSessionGen !== sessionGen) {
      return { success: false, cancelled: true, error: 'Phiên làm việc đã thay đổi.' };
    }

    if (!remote) {
      return {
        success: false,
        isDeleted: true,
        statusCode: 404,
        error: 'Lịch trình không còn tồn tại trên máy chủ (đã bị xóa).',
      };
    }

    if (
      typeof remote.id !== 'number' ||
      typeof remote.version !== 'number' ||
      remote.version < 1 ||
      !remote.title ||
      !remote.date ||
      !Array.isArray(remote.stops)
    ) {
      return { success: false, error: 'Dữ liệu lịch trình từ máy chủ không đúng cấu trúc chuẩn.' };
    }

    return { success: true, remote };
  } catch (error) {
    const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
    const currentKey = getAccountStorageKey({
      signedIn: currentAuth.signedIn,
      user: currentAuth.user,
    });
    const currentSessionGen = getCurrentSessionGeneration(originatingKey);

    if (currentKey !== originatingKey || currentSessionGen !== sessionGen) {
      return { success: false, cancelled: true, error: 'Phiên làm việc đã thay đổi.' };
    }

    if (isApiError(error)) {
      if (error.status === 404) {
        return {
          success: false,
          isDeleted: true,
          statusCode: 404,
          error: 'Lịch trình không còn tồn tại trên máy chủ (đã bị xóa).',
        };
      }
      if (error.status === 401) {
        return {
          success: false,
          statusCode: 401,
          error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        };
      }
      if (error.status === 403) {
        return {
          success: false,
          statusCode: 403,
          error: 'Bạn không có quyền truy cập vào lịch trình này.',
        };
      }
      if (error.status === 0) {
        return {
          success: false,
          statusCode: 0,
          error: 'Lỗi kết nối mạng khi tải bản ghi từ máy chủ.',
        };
      }
      return {
        success: false,
        statusCode: error.status,
        error: error.message || 'Lỗi khi tải lịch trình từ máy chủ.',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định khi tải dữ liệu máy chủ.',
    };
  }
}

/**
 * Hàm thuần (pure function) so sánh chi tiết giữa bản ghi cục bộ và bản ghi máy chủ.
 * Làm nổi bật các trường khác nhau mà không đánh dấu xung đột giả khi dữ liệu giống nhau.
 */
export function compareItineraryWithRemote(
  local: Itinerary,
  remote: BackendItineraryRead,
): ConflictDiff {
  let remoteVietnamDate = '';
  try {
    remoteVietnamDate = isoDateToVietnam(remote.date);
  } catch {
    remoteVietnamDate = remote.date;
  }

  const remoteNormalizedPace = normalizePace(remote.pace);

  const titleChanged = local.title.trim() !== remote.title.trim();
  const dateChanged = local.date.trim() !== remoteVietnamDate.trim();
  const durationChanged = local.duration !== (remote.duration ?? 1);
  const paceChanged = local.pace !== remoteNormalizedPace;

  let stopsChanged = local.stops.length !== remote.stops.length;
  if (!stopsChanged) {
    for (let i = 0; i < local.stops.length; i++) {
      const ls = local.stops[i];
      const rs = remote.stops[i];
      if (
        ls.placeId !== rs.place_id ||
        (ls.dayIndex ?? 1) !== (rs.day ?? 1) ||
        ls.start !== rs.start ||
        ls.end !== rs.end
      ) {
        stopsChanged = true;
        break;
      }
    }
  }

  const hasDifferences =
    titleChanged || dateChanged || durationChanged || paceChanged || stopsChanged;

  return {
    titleChanged,
    dateChanged,
    durationChanged,
    paceChanged,
    stopsChanged,
    hasDifferences,
    remoteVietnamDate,
    remoteNormalizedPace,
  };
}

/**
 * OPTION A — "Giữ bản của tôi"
 * Gửi các thay đổi cục bộ lên Backend bằng PATCH với version mới nhất đã được xác minh từ Backend.
 * Tuân thủ quy tắc mutation coordinator, downgrade protection, và xử lý repeated HTTP 409.
 */
export async function orchestrateKeepLocal(params: {
  localItinerary: Itinerary;
  remoteSnapshot: BackendItineraryRead;
  model: ConflictModelContext;
  auth: ConflictAuthContext;
  getCurrentAuth?: () => ConflictAuthContext;
  apiService?: typeof itineraryApiService;
  notify?: (msg: string) => void;
}): Promise<KeepLocalResult> {
  const notify = params.notify ?? defaultNotify;
  const apiService = params.apiService ?? itineraryApiService;
  const { localItinerary, remoteSnapshot, model, auth } = params;

  if (!auth.signedIn || !auth.token) {
    notify('Yêu cầu đăng nhập để cập nhật lịch trình lên máy chủ.');
    return { success: false, error: 'Chưa đăng nhập' };
  }

  if (localItinerary.remoteId !== remoteSnapshot.id) {
    notify('Mã lịch trình máy chủ không khớp.');
    return { success: false, error: 'Remote ID mismatch' };
  }

  if (typeof remoteSnapshot.version !== 'number' || remoteSnapshot.version < 1) {
    notify('Phiên bản máy chủ không hợp lệ.');
    return { success: false, error: 'Invalid remote version' };
  }

  const originatingCtx: AccountContext = {
    signedIn: auth.signedIn,
    user: auth.user,
  };
  const originatingKey = getAccountStorageKey(originatingCtx);
  const sessionGen = getCurrentSessionGeneration(originatingKey);

  const localSnapshot = cloneItinerary(localItinerary);

  let payload;
  try {
    payload = mapItineraryToBackendUpdate(localSnapshot, remoteSnapshot.version);
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Dữ liệu lịch trình không hợp lệ.');
    return { success: false, error: 'Invalid update payload' };
  }

  model.updateSyncStatus(localSnapshot.id, 'pending');
  beginMutation(originatingKey);

  let updatedRemote: BackendItineraryRead;
  try {
    updatedRemote = await apiService.updateItinerary(remoteSnapshot.id, payload, auth.token);
  } catch (error) {
    const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
    const currentKey = getAccountStorageKey({
      signedIn: currentAuth.signedIn,
      user: currentAuth.user,
    });
    const currentSessionGen = getCurrentSessionGeneration(originatingKey);

    const isConflictAgain = isApiError(error) && error.status === 409;
    const isTimeout = isApiError(error) && error.status === 0;

    if (currentKey === originatingKey && currentSessionGen === sessionGen) {
      model.updateSyncStatus(localSnapshot.id, 'conflict');

      if (isConflictAgain) {
        notify(
          'Lịch trình lại có thay đổi mới hơn trên máy chủ (HTTP 409). Vui lòng tải lại bản máy chủ để so sánh tiếp.',
        );
        return {
          success: false,
          conflictAgain: true,
          error: 'Xung đột phiên bản máy chủ tiếp tục xảy ra.',
        };
      }

      if (isTimeout) {
        notify(
          'Lỗi kết nối mạng khi gửi dữ liệu lên máy chủ. Bản trên thiết bị vẫn được bảo toàn an toàn.',
        );
        return { success: false, timeout: true, error: 'Lỗi kết nối mạng timeout.' };
      }

      notify(isApiError(error) && error.message ? error.message : 'Lỗi khi cập nhật lên máy chủ.');
      return {
        success: false,
        error: isApiError(error) ? error.message : 'Lỗi cập nhật máy chủ.',
      };
    } else {
      return { success: false, error: 'Session invalidated.' };
    }
  } finally {
    endMutation(originatingKey);
  }

  // F-02: TÁCH BIỆT: PATCH 200 đã thành công trên Backend.
  // Xử lý cập nhật in-memory model và await persistence TRƯỚC KHI thông báo thành công.
  const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
  const currentKey = getAccountStorageKey({
    signedIn: currentAuth.signedIn,
    user: currentAuth.user,
  });
  const currentSessionGen = getCurrentSessionGeneration(originatingKey);

  if (currentKey === originatingKey && currentSessionGen === sessionGen) {
    const currentItem = model.getItinerary ? model.getItinerary(localSnapshot.id) : null;
    const isContentDirty = currentItem
      ? currentItem.title !== localSnapshot.title ||
        currentItem.date !== localSnapshot.date ||
        currentItem.duration !== localSnapshot.duration ||
        currentItem.pace !== localSnapshot.pace ||
        JSON.stringify(currentItem.stops) !== JSON.stringify(localSnapshot.stops)
      : false;

    model.attachRemoteMetadata(localSnapshot.id, updatedRemote.id, updatedRemote.version);
    model.updateSyncStatus(localSnapshot.id, isContentDirty ? 'local' : 'synced');

    try {
      await applyToPartitionStorage(originatingKey, (items) =>
        items.map((i) =>
          i.id === localSnapshot.id
            ? {
                ...i,
                remoteId: updatedRemote.id,
                version: updatedRemote.version,
                syncStatus: isContentDirty ? ('local' as SyncStatus) : ('synced' as SyncStatus),
              }
            : i,
        ),
      );

      // CHỈ thông báo thành công đầy đủ sau khi persistence thành công!
      if (isContentDirty) {
        notify(
          'Máy chủ đã xác nhận phiên bản trước. Các thay đổi mới nhất của bạn vẫn đang được lưu trên thiết bị.',
        );
      } else {
        notify('Đã cập nhật bản của bạn lên máy chủ thành công.');
      }

      return { success: true, updated: updatedRemote };
    } catch (persistError) {
      // F-02: Persistence thất bại KHÔNG được coi là PATCH thất bại hay tạo conflict giả.
      // Giữ nguyên remoteId và version thật vừa nhận từ server.
      notify('Máy chủ đã cập nhật thành công, nhưng không thể lưu bản ghi vào bộ nhớ thiết bị.');
      return {
        success: true,
        updated: updatedRemote,
        persistenceFailed: true,
        error: 'Persistence failure after successful PATCH',
      };
    }
  } else {
    // Tài khoản đã thay đổi hoặc phiên bị vô hiệu hoá: lưu vào partition cũ
    try {
      await applyToPartitionStorage(originatingKey, (items) =>
        items.map((i) =>
          i.id === localSnapshot.id
            ? {
                ...i,
                remoteId: updatedRemote.id,
                version: updatedRemote.version,
                syncStatus: 'synced' as SyncStatus,
              }
            : i,
        ),
      );
    } catch {
      // Bỏ qua lỗi lưu ngầm tài khoản cũ
    }
    return { success: true, updated: updatedRemote, accountSwitched: true };
  }
}

/**
 * OPTION B — "Dùng bản máy chủ"
 * Thay thế nội dung lịch trình trên thiết bị bằng phiên bản máy chủ đã xác minh.
 * Bắt buộc xác nhận trước khi áp dụng, giữ nguyên Local ID, không gửi thêm request mạng mutating.
 */
export async function orchestrateUseServer(params: {
  localItinerary: Itinerary;
  remoteSnapshot: BackendItineraryRead;
  model: ConflictModelContext;
  auth: ConflictAuthContext;
  getCurrentAuth?: () => ConflictAuthContext;
  apiService?: typeof itineraryApiService;
  notify?: (msg: string) => void;
  confirm?: ConfirmFn;
  initialLocalSnapshot?: Itinerary;
}): Promise<UseServerResult> {
  const notify = params.notify ?? defaultNotify;
  const confirm = params.confirm ?? defaultConfirm;
  const { localItinerary, remoteSnapshot, model, auth, initialLocalSnapshot } = params;

  if (typeof remoteSnapshot.id !== 'number' || typeof remoteSnapshot.version !== 'number') {
    notify('Dữ liệu máy chủ không hợp lệ để áp dụng.');
    return { success: false, error: 'Invalid remote snapshot' };
  }

  const originatingCtx: AccountContext = {
    signedIn: auth.signedIn,
    user: auth.user,
  };
  const originatingKey = getAccountStorageKey(originatingCtx);
  const sessionGen = getCurrentSessionGeneration(originatingKey);

  // Bước 1: Yêu cầu người dùng xác nhận thao tác thay thế
  const confirmed = await new Promise<boolean>((resolve) => {
    confirm(
      'Xác nhận sử dụng bản máy chủ',
      'Các thay đổi chưa đồng bộ trên thiết bị sẽ bị thay thế bằng phiên bản từ máy chủ. Thao tác này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?',
      () => resolve(true),
      () => resolve(false),
    );
  });

  if (!confirmed) {
    return { success: false, cancelled: true };
  }

  // Bước 2: Kiểm tra tính hợp lệ của phiên đăng nhập trước khi áp dụng
  const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
  const currentKey = getAccountStorageKey({
    signedIn: currentAuth.signedIn,
    user: currentAuth.user,
  });
  const currentSessionGen = getCurrentSessionGeneration(originatingKey);

  if (currentKey !== originatingKey || currentSessionGen !== sessionGen) {
    notify('Tài khoản hoặc phiên đăng nhập đã thay đổi, thao tác bị hủy bỏ.');
    return { success: false, error: 'Session invalidated or account switched' };
  }

  // F-03: Bắt đầu mutation sau khi user đã xác nhận để vô hiệu hoá bất kỳ Fetch nào in-flight
  beginMutation(originatingKey);

  try {
    // Bước 3: F-05 - Kiểm tra Freshness của remote snapshot từ máy chủ nếu có apiService
    let targetRemote = remoteSnapshot;
    if (params.apiService && auth.token) {
      try {
        const fresh = await params.apiService.getItinerary(remoteSnapshot.id, auth.token);
        if (!fresh) {
          notify('Lịch trình không còn tồn tại trên máy chủ (đã bị xóa). Thao tác bị hủy bỏ.');
          return { success: false, error: 'Remote deleted on server' };
        }
        if (fresh.version !== remoteSnapshot.version) {
          notify(
            `Máy chủ đã có phiên bản mới hơn (v${fresh.version}) kể từ khi mở bảng so sánh. Vui lòng kiểm tra lại bản mới nhất.`,
          );
          return {
            success: false,
            remoteChanged: true,
            latestRemote: fresh,
            error: 'Remote version changed on server',
          };
        }
        targetRemote = fresh;
      } catch (checkErr) {
        if (isApiError(checkErr) && checkErr.status === 0) {
          notify(
            'Lỗi kết nối mạng khi xác minh phiên bản máy chủ. Bản trên thiết bị vẫn được bảo toàn.',
          );
          return { success: false, error: 'Network failure during freshness check' };
        }
        if (isApiError(checkErr) && checkErr.status === 404) {
          notify('Lịch trình không còn tồn tại trên máy chủ (đã bị xóa). Thao tác bị hủy bỏ.');
          return { success: false, error: 'Remote deleted on server' };
        }
        if (checkErr instanceof Error && checkErr.message === 'Remote deleted on server') {
          return { success: false, error: 'Remote deleted on server' };
        }
        notify('Không thể xác minh tính tươi mới của phiên bản máy chủ.');
        return { success: false, error: 'Freshness verification failed' };
      }
    }

    // Bước 4: Kiểm tra xem local item có bị chỉnh sửa kể từ lúc mở Modal so sánh hay không
    if (initialLocalSnapshot) {
      const currentLocal = model.getItinerary ? model.getItinerary(localItinerary.id) : null;
      if (
        currentLocal &&
        (currentLocal.title !== initialLocalSnapshot.title ||
          currentLocal.date !== initialLocalSnapshot.date ||
          currentLocal.duration !== initialLocalSnapshot.duration ||
          currentLocal.pace !== initialLocalSnapshot.pace ||
          JSON.stringify(currentLocal.stops) !== JSON.stringify(initialLocalSnapshot.stops))
      ) {
        notify(
          'Bản trên thiết bị đã có chỉnh sửa mới kể từ khi mở bảng so sánh. Vui lòng kiểm tra lại.',
        );
        return { success: false, localModifiedSinceOpen: true };
      }
    }

    // Bước 5: Ánh xạ dữ liệu máy chủ thành model cục bộ với ID cục bộ được bảo toàn
    let mapped: Itinerary;
    try {
      mapped = mapBackendToLocalItinerary(targetRemote, localItinerary.id);
    } catch (err) {
      notify('Lỗi chuyển đổi dữ liệu máy chủ sang định dạng thiết bị.');
      return { success: false, error: err instanceof Error ? err.message : 'Mapping error' };
    }

    // F-01: Chụp snapshot bất biến của local item trước khi thay thế in-memory
    const originalLocalSnapshot = cloneItinerary(localItinerary);

    // Bước 6: Cập nhật in-memory model
    if (model.replaceItinerary) {
      model.replaceItinerary(localItinerary.id, mapped);
    } else if (model.replaceItineraries) {
      model.replaceItineraries(
        model.itineraries.map((item) => (item.id === localItinerary.id ? mapped : item)),
      );
    } else {
      model.attachRemoteMetadata(localItinerary.id, targetRemote.id, targetRemote.version);
      model.updateSyncStatus(localItinerary.id, 'synced');
    }

    // Bước 7: Lưu bền vững vào AsyncStorage theo partition tài khoản với cơ chế Rollback
    try {
      await applyToPartitionStorage(originatingKey, (items) =>
        items.map((item) => (item.id === localItinerary.id ? mapped : item)),
      );
      notify('Đã áp dụng phiên bản máy chủ thành công.');
      return { success: true };
    } catch (persistError) {
      // F-01: ROLLBACK IN-MEMORY STATE KHI PERSISTENCE THẤT BẠI
      const currentItem = model.getItinerary ? model.getItinerary(localItinerary.id) : null;
      const isUnmodifiedMapped =
        currentItem &&
        currentItem.title === mapped.title &&
        currentItem.date === mapped.date &&
        currentItem.duration === mapped.duration &&
        currentItem.pace === mapped.pace &&
        JSON.stringify(currentItem.stops) === JSON.stringify(mapped.stops);
      if (isUnmodifiedMapped) {
        if (model.replaceItinerary) {
          model.replaceItinerary(localItinerary.id, originalLocalSnapshot);
        } else if (model.replaceItineraries) {
          model.replaceItineraries(
            model.itineraries.map((item) =>
              item.id === localItinerary.id ? originalLocalSnapshot : item,
            ),
          );
        }
      }
      notify(
        'Không thể lưu bản ghi máy chủ vào bộ nhớ thiết bị. Đã khôi phục bản sửa đổi trên thiết bị.',
      );
      return { success: false, error: 'Persistence failure' };
    }
  } finally {
    // F-03: Luôn giải phóng mutation counter trong finally
    endMutation(originatingKey);
  }
}

/**
 * OPTION C — "Để sau"
 * Đóng giao diện xử lý xung đột mà không thay đổi bất kỳ dữ liệu nào, không gửi HTTP mutation.
 */
export function orchestrateResolveLater(params: { onClose: () => void }): ResolveLaterResult {
  params.onClose();
  return { success: true, deferred: true };
}
