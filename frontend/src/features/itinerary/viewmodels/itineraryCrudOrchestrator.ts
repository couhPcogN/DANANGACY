import { Alert, Platform } from 'react-native';
import type { Route, RouteName, TabName } from '../../../app/navigation/types';
import type {
  BackendItineraryCreate,
  BackendItineraryUpdate,
} from '../../../services/api/itineraryService';
import { ItineraryApiError, itineraryApiService } from '../../../services/api/itineraryService';
import {
  mapItineraryToBackendCreate,
  mapItineraryToBackendUpdate,
} from '../../../services/api/itineraryMapping';
import {
  GUEST_ITINERARIES_KEY,
  getAccountStorageKey,
  itineraryStorage,
} from '../../../services/storage/itineraryStorage';
import type { AccountContext } from '../../../services/storage/itineraryStorage';
import { notify as defaultNotify } from '../../../shared/utils/notify';
import { cloneItinerary } from '../models/itinerary';
import type { Itinerary, SyncStatus } from '../types';
import { beginMutation, endMutation } from './itinerarySyncCoordinator';

export type CrudModelContext = {
  itineraries: Itinerary[];
  draft: Itinerary;
  editingId: string | null;
  saveDraft: () => Itinerary;
  saveEdit: () => string | null;
  deleteItinerary: (id: string) => boolean;
  restoreItinerary?: (itinerary: Itinerary, index?: number) => boolean;
  replaceItineraries: (itineraries: Itinerary[]) => void;
  attachRemoteMetadata: (localId: string, remoteId: number, version: number) => boolean;
  updateSyncStatus: (localId: string, status: SyncStatus) => boolean;
  getItinerary?: (id: string) => Itinerary | undefined;
};

export type CrudAuthContext = {
  signedIn: boolean;
  token: string | null;
  user: { uid?: string; id?: number; email?: string; display_name?: string } | null;
};

export type CrudNavigationContext = {
  navigate: (screen: RouteName, id?: string) => void;
  reset: (route: Route) => void;
  tab: (tabName: TabName) => void;
};

export type ConfirmFn = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  onCancel?: () => void,
) => void;

export const defaultConfirm: ConfirmFn = (title, message, onConfirm, onCancel) => {
  let settled = false;
  const handleCancel = () => {
    if (!settled) {
      settled = true;
      onCancel?.();
    }
  };
  const handleConfirm = () => {
    if (!settled) {
      settled = true;
      void onConfirm();
    }
  };

  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.confirm === 'function'
  ) {
    if (window.confirm(`${title}\n\n${message}`)) {
      handleConfirm();
    } else {
      handleCancel();
    }
    return;
  }

  try {
    Alert.alert(
      title,
      message,
      [
        { text: 'Hủy', style: 'cancel', onPress: handleCancel },
        { text: 'Xóa', style: 'destructive', onPress: handleConfirm },
      ],
      { cancelable: true, onDismiss: handleCancel },
    );
  } catch {
    handleCancel();
  }
};

export async function applyToPartitionStorage(
  accountKey: string,
  transform: (items: Itinerary[]) => Itinerary[],
): Promise<void> {
  const isGuest = accountKey === GUEST_ITINERARIES_KEY;
  const dummyCtx: AccountContext = isGuest
    ? { signedIn: false }
    : {
        signedIn: true,
        user: { uid: accountKey.replace('danangacy.itineraries.user.', '') },
      };
  const items = await itineraryStorage.loadItinerariesForAccount(dummyCtx);
  const updated = transform(items);
  const saved = await itineraryStorage.saveItinerariesForAccount(dummyCtx, updated);
  const flushed = await itineraryStorage.flush(dummyCtx);
  if (!saved || !flushed) {
    throw new Error('Không thể lưu trữ dữ liệu vào phân vùng thiết bị.');
  }
}

function isApiError(err: unknown): err is ItineraryApiError {
  return (
    err instanceof ItineraryApiError ||
    (typeof err === 'object' &&
      err !== null &&
      (err as { name?: string }).name === 'ItineraryApiError')
  );
}

export async function orchestrateCreateItinerary(params: {
  model: CrudModelContext;
  auth: CrudAuthContext;
  navigation: CrudNavigationContext;
  getCurrentAuth?: () => CrudAuthContext;
  notify?: (msg: string) => void;
  apiService?: typeof itineraryApiService;
}): Promise<Itinerary | null> {
  const notify = params.notify ?? defaultNotify;
  const apiService = params.apiService ?? itineraryApiService;
  const { model, auth, navigation } = params;

  // 1. Lưu giữ định danh tài khoản khởi tạo
  const originatingCtx: AccountContext = {
    signedIn: auth.signedIn,
    user: auth.user,
  };
  const originatingKey = getAccountStorageKey(originatingCtx);

  // 2. Lưu bản nháp cục bộ
  const saved = model.saveDraft();

  // 3. Phân nhánh Guest: hoàn tất cục bộ, điều hướng và thông báo ngay, tuyệt đối không gọi API
  if (!auth.signedIn || !auth.token) {
    navigation.navigate('itinerarySaved', saved.id);
    notify('Đã lưu lịch trình trên thiết bị.');
    return saved;
  }

  // 4. Phân nhánh Authenticated User: mapping và đồng bộ
  let payload: BackendItineraryCreate;
  try {
    payload = mapItineraryToBackendCreate(saved);
  } catch (err) {
    model.updateSyncStatus(saved.id, 'error');
    notify(err instanceof Error ? err.message : 'Dữ liệu lịch trình không hợp lệ.');
    return saved;
  }

  model.updateSyncStatus(saved.id, 'pending');
  beginMutation(originatingKey);

  try {
    const remote = await apiService.createItinerary(payload, auth.token);

    // Kiểm tra tính cô lập tài khoản khi phản hồi API trả về
    const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
    const currentKey = getAccountStorageKey({
      signedIn: currentAuth.signedIn,
      user: currentAuth.user,
    });

    if (currentKey === originatingKey) {
      model.attachRemoteMetadata(saved.id, remote.id, remote.version);
      // F-02: Chỉ điều hướng sang itinerarySaved khi POST máy chủ đã thành công và remoteId đã được gắn
      navigation.navigate('itinerarySaved', saved.id);
    } else {
      // Người dùng đã chuyển tài khoản hoặc đăng xuất trong lúc request đang xử lý:
      // Tuyệt đối không can thiệp vào in-memory model của tài khoản mới.
      await applyToPartitionStorage(originatingKey, (items) => {
        const exists = items.some((i) => i.id === saved.id);
        const syncedItem: Itinerary = {
          ...saved,
          remoteId: remote.id,
          version: remote.version,
          syncStatus: 'synced',
        };
        return exists
          ? items.map((i) => (i.id === saved.id ? syncedItem : i))
          : [syncedItem, ...items];
      });
    }
    notify('Đã lưu và đồng bộ lịch trình thành công.');
  } catch (error) {
    const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
    const currentKey = getAccountStorageKey({
      signedIn: currentAuth.signedIn,
      user: currentAuth.user,
    });

    if (currentKey === originatingKey) {
      model.updateSyncStatus(saved.id, 'error');
      // F-02: Khi POST thất bại hoặc timeout, điều hướng sang itineraryDetail để người dùng xem dữ liệu local an toàn
      navigation.navigate('itineraryDetail', saved.id);
    } else {
      await applyToPartitionStorage(originatingKey, (items) => {
        const exists = items.some((i) => i.id === saved.id);
        const errItem: Itinerary = {
          ...saved,
          syncStatus: 'error',
        };
        return exists ? items.map((i) => (i.id === saved.id ? errItem : i)) : [errItem, ...items];
      });
    }

    const isNetworkTimeout = isApiError(error) && error.status === 0;
    const message =
      isApiError(error) && error.message
        ? error.message
        : isNetworkTimeout
          ? 'Lỗi kết nối mạng khi lưu lên máy chủ. Lịch trình đã được lưu an toàn trên thiết bị (trạng thái đồng bộ chưa xác định).'
          : 'Lỗi đồng bộ lên máy chủ. Lịch trình đã được lưu an toàn trên thiết bị.';
    notify(message);
  } finally {
    endMutation(originatingKey);
  }

  return saved;
}

export async function orchestrateUpdateItinerary(params: {
  model: CrudModelContext;
  auth: CrudAuthContext;
  navigation: CrudNavigationContext;
  getCurrentAuth?: () => CrudAuthContext;
  notify?: (msg: string) => void;
  apiService?: typeof itineraryApiService;
}): Promise<string | null> {
  const notify = params.notify ?? defaultNotify;
  const apiService = params.apiService ?? itineraryApiService;
  const { model, auth, navigation } = params;

  const originatingCtx: AccountContext = {
    signedIn: auth.signedIn,
    user: auth.user,
  };
  const originatingKey = getAccountStorageKey(originatingCtx);

  // Snapshot bản nháp trước khi lưu đè
  const draftSnapshot = cloneItinerary(model.draft);

  // Lưu cục bộ trước
  const editedId = model.saveEdit();
  if (!editedId) return null;

  navigation.reset({ name: 'itineraryDetail', id: editedId });

  // Kiểm tra xem lịch trình có remoteId máy chủ hợp lệ và user đã đăng nhập chưa
  const isRemote =
    typeof draftSnapshot.remoteId === 'number' &&
    Number.isInteger(draftSnapshot.remoteId) &&
    draftSnapshot.remoteId > 0;

  if (!isRemote || !auth.signedIn || !auth.token) {
    notify('Đã cập nhật lịch trình trên thiết bị.');
    return editedId;
  }

  // Cập nhật máy chủ bắt buộc phải có version >= 1
  const version = draftSnapshot.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    model.updateSyncStatus(editedId, 'error');
    notify('Không thể đồng bộ: Phiên bản lịch trình không hợp lệ.');
    return editedId;
  }

  let payload: BackendItineraryUpdate;
  try {
    payload = mapItineraryToBackendUpdate(draftSnapshot, version);
  } catch (err) {
    model.updateSyncStatus(editedId, 'error');
    notify(err instanceof Error ? err.message : 'Dữ liệu cập nhật không hợp lệ.');
    return editedId;
  }

  model.updateSyncStatus(editedId, 'pending');
  beginMutation(originatingKey);

  try {
    const remote = await apiService.updateItinerary(draftSnapshot.remoteId!, payload, auth.token);

    const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
    const currentKey = getAccountStorageKey({
      signedIn: currentAuth.signedIn,
      user: currentAuth.user,
    });

    if (currentKey === originatingKey) {
      // F-04: Kiểm tra bản ghi hiện hành trong repository có bị sửa đổi thêm trong lúc PATCH in-flight không
      const currentItem = model.getItinerary ? model.getItinerary(editedId) : null;
      const isContentDirty = currentItem
        ? currentItem.title !== draftSnapshot.title ||
          currentItem.date !== draftSnapshot.date ||
          currentItem.pace !== draftSnapshot.pace ||
          currentItem.duration !== draftSnapshot.duration ||
          JSON.stringify(currentItem.stops) !== JSON.stringify(draftSnapshot.stops)
        : false;

      if (isContentDirty && currentItem) {
        // Người dùng đã chỉnh sửa bản ghi cục bộ sang phiên bản mới hơn trong khi PATCH cũ đang in-flight!
        // Cập nhật base version từ máy chủ để chuẩn bị cho lượt lưu tiếp theo, nhưng TUYỆT ĐỐI không đánh dấu 'synced'
        model.attachRemoteMetadata(editedId, remote.id, remote.version);
        model.updateSyncStatus(editedId, 'local');
        notify(
          'Máy chủ đã xác nhận phiên bản trước. Các thay đổi mới nhất của bạn vẫn đang được lưu trên thiết bị.',
        );
      } else {
        model.attachRemoteMetadata(editedId, remote.id, remote.version);
        notify('Đã đồng bộ cập nhật lịch trình thành công.');
      }
    } else {
      await applyToPartitionStorage(originatingKey, (items) =>
        items.map((i) => {
          if (i.id !== editedId) return i;
          const isDirty =
            i.title !== draftSnapshot.title ||
            i.date !== draftSnapshot.date ||
            i.pace !== draftSnapshot.pace ||
            i.duration !== draftSnapshot.duration ||
            JSON.stringify(i.stops) !== JSON.stringify(draftSnapshot.stops);
          return {
            ...i,
            remoteId: remote.id,
            version: remote.version,
            syncStatus: isDirty ? ('local' as SyncStatus) : ('synced' as SyncStatus),
          };
        }),
      );
      notify('Đã đồng bộ cập nhật lịch trình thành công.');
    }
  } catch (error) {
    const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
    const currentKey = getAccountStorageKey({
      signedIn: currentAuth.signedIn,
      user: currentAuth.user,
    });

    const isConflict = isApiError(error) && error.status === 409;
    const targetStatus: SyncStatus = isConflict ? 'conflict' : 'error';

    if (currentKey === originatingKey) {
      model.updateSyncStatus(editedId, targetStatus);
    } else {
      await applyToPartitionStorage(originatingKey, (items) =>
        items.map((i) => (i.id === editedId ? { ...i, syncStatus: targetStatus } : i)),
      );
    }

    if (isConflict) {
      notify(
        'Xung đột phiên bản: Lịch trình đã được thay đổi trên máy chủ. Bản sửa đổi của bạn được giữ lại cục bộ.',
      );
    } else {
      const isTimeout = isApiError(error) && error.status === 0;
      const message =
        isApiError(error) && error.message
          ? error.message
          : isTimeout
            ? 'Lỗi kết nối mạng khi cập nhật lên máy chủ. Thay đổi được giữ an toàn trên thiết bị.'
            : 'Lỗi đồng bộ cập nhật lên máy chủ. Thay đổi được giữ trên thiết bị.';
      notify(message);
    }
  } finally {
    endMutation(originatingKey);
  }

  return editedId;
}

export function orchestrateDeleteItinerary(params: {
  id: string;
  model: CrudModelContext;
  auth: CrudAuthContext;
  navigation: CrudNavigationContext;
  getCurrentAuth?: () => CrudAuthContext;
  notify?: (msg: string) => void;
  confirm?: ConfirmFn;
  apiService?: typeof itineraryApiService;
}): Promise<boolean> {
  const notify = params.notify ?? defaultNotify;
  const confirm = params.confirm ?? defaultConfirm;
  const apiService = params.apiService ?? itineraryApiService;
  const { id, model, auth, navigation } = params;

  const targetIndex = model.itineraries.findIndex((item) => item.id === id);
  const target = targetIndex >= 0 ? model.itineraries[targetIndex] : undefined;
  if (!target) {
    notify('Không tìm thấy lịch trình cần xóa.');
    return Promise.resolve(false);
  }

  const originalIndex = targetIndex;
  const snapshot = cloneItinerary(target);

  const isRemote =
    typeof target.remoteId === 'number' &&
    Number.isInteger(target.remoteId) &&
    target.remoteId > 0 &&
    auth.signedIn &&
    !!auth.token;

  const confirmTitle = 'Xác nhận xóa';
  const confirmMsg = isRemote
    ? `Bạn có chắc chắn muốn xóa lịch trình "${target.title}" khỏi tài khoản và máy chủ?`
    : `Bạn có chắc chắn muốn xóa lịch trình "${target.title}"?`;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const safeResolve = (val: boolean) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };

    confirm(
      confirmTitle,
      confirmMsg,
      async () => {
        try {
          // Nếu là lịch trình cục bộ (Guest hoặc chưa đồng bộ): chỉ xóa trên thiết bị
          if (!isRemote) {
            model.deleteItinerary(id);
            notify('Đã xóa lịch trình thành công.');
            navigation.tab('itinerary');
            safeResolve(true);
            return;
          }

          // Luồng xóa lịch trình máy chủ
          const originatingCtx: AccountContext = {
            signedIn: auth.signedIn,
            user: auth.user,
          };
          const originatingKey = getAccountStorageKey(originatingCtx);

          beginMutation(originatingKey);
          // Optimistic delete: xóa khỏi model cục bộ trước
          model.deleteItinerary(id);
          navigation.tab('itinerary');

          try {
            // BẮT BUỘC dùng target.remoteId, tuyệt đối không dùng local id hay parseInt(id)
            await apiService.deleteItinerary(target.remoteId!, auth.token!);
            notify('Đã xóa lịch trình thành công.');
            safeResolve(true);
          } catch (error) {
            // F-01: Phân biệt chính xác HTTP 404 (đã bị xóa trên máy chủ) vs các lỗi khác
            if (isApiError(error) && error.status === 404) {
              // Không rollback vô hạn! Tôn trọng ý định xóa của người dùng và hoàn tất xóa trên máy
              notify(
                'Lịch trình không còn tồn tại trên máy chủ hoặc đã được xóa trước đó. Đã dọn dẹp bản lưu trên thiết bị.',
              );
              safeResolve(true);
              return;
            }

            // F-06: Rollback phục hồi bản ghi về ĐÚNG VỊ TRÍ BAN ĐẦU
            const rolledBackItem: Itinerary = { ...cloneItinerary(snapshot), syncStatus: 'error' };

            const currentAuth = params.getCurrentAuth ? params.getCurrentAuth() : auth;
            const currentKey = getAccountStorageKey({
              signedIn: currentAuth.signedIn,
              user: currentAuth.user,
            });

            if (currentKey === originatingKey) {
              if (typeof model.restoreItinerary === 'function') {
                model.restoreItinerary(rolledBackItem, originalIndex);
              } else {
                const next = [...model.itineraries];
                const alreadyHasRemote =
                  rolledBackItem.remoteId !== undefined &&
                  next.some((i) => i.remoteId === rolledBackItem.remoteId);
                const alreadyHasLocal = next.some((i) => i.id === rolledBackItem.id);
                if (!alreadyHasRemote && !alreadyHasLocal) {
                  next.splice(originalIndex, 0, rolledBackItem);
                  model.replaceItineraries(next);
                }
              }
            } else {
              // Tài khoản đã thay đổi: khôi phục vào vùng lưu trữ tài khoản gốc mà không làm bẩn tài khoản mới
              await applyToPartitionStorage(originatingKey, (items) => {
                if (
                  items.some(
                    (i) =>
                      i.id === rolledBackItem.id ||
                      (rolledBackItem.remoteId !== undefined &&
                        i.remoteId === rolledBackItem.remoteId),
                  )
                ) {
                  return items;
                }
                const idx = originalIndex <= items.length ? originalIndex : 0;
                const next = [...items];
                next.splice(idx, 0, rolledBackItem);
                return next;
              });
            }

            if (isApiError(error) && error.status === 0) {
              const msg =
                error.message ||
                'Lỗi kết nối mạng khi xóa. Trạng thái xóa trên máy chủ chưa được xác nhận; lịch trình tạm thời được giữ lại để đối soát.';
              notify(msg);
            } else if (isApiError(error) && (error.status === 401 || error.status === 403)) {
              notify(
                'Phiên đăng nhập hết hạn hoặc bạn không có quyền xóa lịch trình này. Lịch trình đã được khôi phục.',
              );
            } else {
              notify('Không thể xóa lịch trình trên máy chủ. Lịch trình đã được khôi phục.');
            }
            safeResolve(false);
          } finally {
            endMutation(originatingKey);
          }
        } catch {
          safeResolve(false);
        }
      },
      () => {
        safeResolve(false);
      },
    );
  });
}
