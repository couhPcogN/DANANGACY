import type { BackendItineraryRead } from '../../../services/api/itineraryService';
import { mapBackendToLocalItinerary } from '../../../services/api/itineraryMapping';
import type { Itinerary } from '../types';

export type ReconciliationResult = {
  reconciled: Itinerary[];
  addedCount: number;
  updatedCount: number;
  conflictedCount: number;
  unmodifiedCount: number;
};

/**
 * Thuật toán thuần (pure function) đối soát và điều hòa danh sách lịch trình từ Backend vào danh sách cục bộ.
 * Không gây tác dụng phụ, đảm bảo tính bất biến (immutability) và tất định (determinism).
 *
 * Nguyên tắc:
 * 1. Chống trùng lặp (deduplication): Mỗi remoteId chỉ tồn tại tối đa một lần trong kết quả.
 * 2. Ổn định khóa (ID stability): Khi cập nhật mục local đã gắn remoteId, giữ nguyên `item.id`.
 * 3. Bảo vệ thay đổi chưa đồng bộ (conflict-safe):
 *    - Áp dụng cho cả 3 trạng thái: 'pending', 'conflict', và 'error'.
 *    - Nếu remote.version !== local.version: Đánh dấu local là 'conflict', KHÔNG ghi đè nội dung local.
 *    - Nếu version trùng nhau: Giữ nguyên trạng thái chưa đồng bộ của local.
 * 4. Đồng bộ in-place:
 *    - Nếu local có trạng thái 'synced' và remote.version !== local.version: Cập nhật in-place từ remote.
 * 5. Thêm mới từ máy chủ:
 *    - Nếu remoteId chưa có trong local: tạo mới với `id = 'itin-' + remote.id`.
 *    - Nếu trùng id, tự động sinh khóa tất định không va chạm (`remote-${remote.id}-${counter}`).
 *    - Tuyệt đối không dùng Date.now() hay Math.random() để đảm bảo tính tất định.
 * 6. Bảo toàn dữ liệu cục bộ:
 *    - Các mục chỉ có ở cục bộ (remoteId === undefined) được giữ nguyên không thay đổi.
 * 7. Lũy đẳng (Idempotent):
 *    - Chạy lại nhiều lần với cùng dữ liệu đầu vào cho kết quả giống hệt nhau.
 */
export function reconcileRemoteItineraries(
  currentItineraries: Itinerary[],
  remoteItineraries: BackendItineraryRead[],
): ReconciliationResult {
  let addedCount = 0;
  let updatedCount = 0;
  let conflictedCount = 0;
  let unmodifiedCount = 0;

  const existingLocalIds = new Set(currentItineraries.map((item) => item.id));
  const remoteMap = new Map<number, BackendItineraryRead>();
  for (const remote of remoteItineraries) {
    // Nếu có duplicate remote.id trong mảng remote, chỉ lấy bản ghi đầu tiên
    if (!remoteMap.has(remote.id)) {
      remoteMap.set(remote.id, remote);
    }
  }

  const processedRemoteIds = new Set<number>();
  const updatedCurrent: Itinerary[] = [];

  for (const localItem of currentItineraries) {
    // Mục thuần local, không có remoteId -> giữ nguyên
    if (localItem.remoteId === undefined) {
      updatedCurrent.push(localItem);
      unmodifiedCount++;
      continue;
    }

    // Nếu remoteId này đã được xử lý bởi một mục local khác (chống trùng lặp trong local data)
    if (processedRemoteIds.has(localItem.remoteId)) {
      continue;
    }

    const matchingRemote = remoteMap.get(localItem.remoteId);

    // Không tìm thấy trên remote (remote bị xóa hoặc endpoint chỉ trả về trang hiện tại)
    if (!matchingRemote) {
      updatedCurrent.push(localItem);
      unmodifiedCount++;
      continue;
    }

    processedRemoteIds.add(matchingRemote.id);

    // Xử lý conflict khi local đang sửa dở, lỗi mạng, hoặc có thay đổi cục bộ chưa đồng bộ (pending, conflict, error, hoặc local)
    const isUnsynced =
      localItem.syncStatus === 'pending' ||
      localItem.syncStatus === 'conflict' ||
      localItem.syncStatus === 'error' ||
      localItem.syncStatus === 'local';

    if (isUnsynced) {
      if (matchingRemote.version !== localItem.version) {
        conflictedCount++;
        updatedCurrent.push({
          ...localItem,
          syncStatus: 'conflict',
        });
      } else {
        // Cùng version, giữ nguyên nội dung chưa đồng bộ của local
        unmodifiedCount++;
        updatedCurrent.push(localItem);
      }
      continue;
    }

    // Nếu đã 'synced':
    if (localItem.syncStatus === 'synced') {
      const localVersion = localItem.version ?? 0;
      if (matchingRemote.version > localVersion) {
        // Version mới hơn từ remote: cập nhật in-place
        const mapped = mapBackendToLocalItinerary(matchingRemote, localItem.id);
        updatedCount++;
        updatedCurrent.push(mapped);
      } else {
        // matchingRemote.version <= localVersion:
        // Phiên bản bằng nhau hoặc remote thấp hơn -> KHÔNG DOWNGRADE, giữ nguyên
        unmodifiedCount++;
        updatedCurrent.push(localItem);
      }
      continue;
    }

    // Fallback an toàn cho các trường hợp khác
    const mapped = mapBackendToLocalItinerary(matchingRemote, localItem.id);
    updatedCount++;
    updatedCurrent.push(mapped);
  }

  // Thêm các mục remote chưa có trong local
  const newlyAdded: Itinerary[] = [];
  for (const remote of remoteItineraries) {
    if (!processedRemoteIds.has(remote.id)) {
      let uniqueId = `itin-${remote.id}`;
      let counter = 1;
      while (existingLocalIds.has(uniqueId)) {
        uniqueId = `remote-${remote.id}-${counter++}`;
      }
      existingLocalIds.add(uniqueId);

      const newItem = mapBackendToLocalItinerary(remote, uniqueId);
      newlyAdded.push(newItem);
      processedRemoteIds.add(remote.id);
      addedCount++;
    }
  }

  return {
    reconciled: [...updatedCurrent, ...newlyAdded],
    addedCount,
    updatedCount,
    conflictedCount,
    unmodifiedCount,
  };
}
