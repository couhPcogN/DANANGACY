import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, InfoBanner, Label, Pill } from '../../../shared/components';
import { colors } from '../../../theme';
import type { BackendItineraryRead } from '../../../services/api/itineraryService';
import type { Itinerary } from '../types';

export type ConflictResolutionModalProps = {
  visible: boolean;
  localItinerary: Itinerary | null;
  remoteItinerary: BackendItineraryRead | null;
  isLoading: boolean;
  error: string | null;
  isResolving: boolean;
  onKeepLocal: () => void | Promise<void>;
  onUseServer: () => void | Promise<void>;
  onResolveLater: () => void;
  onRetryFetch: () => void | Promise<void>;
};

export function ConflictResolutionModal({
  visible,
  localItinerary,
  remoteItinerary,
  isLoading,
  error,
  isResolving,
  onKeepLocal,
  onUseServer,
  onResolveLater,
  onRetryFetch,
}: ConflictResolutionModalProps) {
  if (!visible || !localItinerary) {
    return null;
  }

  // Format date helper (safe parse YYYY-MM-DD -> DD/MM/YYYY)
  const formatIsoToVietnam = (isoDate?: string): string => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  const remoteDateFormatted = remoteItinerary ? formatIsoToVietnam(remoteItinerary.date) : '';
  const remotePaceFormatted = remoteItinerary?.pace || 'Thư thả';

  // Compare fields to detect differences
  const titleDiff = remoteItinerary
    ? localItinerary.title.trim() !== remoteItinerary.title.trim()
    : false;
  const dateDiff = remoteItinerary
    ? localItinerary.date.trim() !== remoteDateFormatted.trim()
    : false;
  const durationDiff = remoteItinerary
    ? localItinerary.duration !== (remoteItinerary.duration ?? 1)
    : false;
  const paceDiff = remoteItinerary ? localItinerary.pace !== remotePaceFormatted : false;

  // F-04: So sánh chi tiết danh sách điểm dừng (số lượng, địa điểm, thứ tự, khung giờ, ngày)
  let stopsDiff = false;
  if (remoteItinerary) {
    if (localItinerary.stops.length !== remoteItinerary.stops.length) {
      stopsDiff = true;
    } else {
      for (let i = 0; i < localItinerary.stops.length; i++) {
        const ls = localItinerary.stops[i];
        const rs = remoteItinerary.stops[i];
        if (
          ls.placeId !== rs.place_id ||
          (ls.dayIndex ?? 1) !== (rs.day ?? 1) ||
          ls.start !== rs.start ||
          ls.end !== rs.end
        ) {
          stopsDiff = true;
          break;
        }
      }
    }
  }

  const isLocalStopDifferent = (index: number): boolean => {
    if (!remoteItinerary) return false;
    const rs = remoteItinerary.stops[index];
    if (!rs) return true;
    const ls = localItinerary.stops[index];
    return (
      ls.placeId !== rs.place_id ||
      (ls.dayIndex ?? 1) !== (rs.day ?? 1) ||
      ls.start !== rs.start ||
      ls.end !== rs.end
    );
  };

  const isRemoteStopDifferent = (index: number): boolean => {
    if (!localItinerary || !remoteItinerary) return false;
    const ls = localItinerary.stops[index];
    if (!ls) return true;
    const rs = remoteItinerary.stops[index];
    return (
      ls.placeId !== rs.place_id ||
      (ls.dayIndex ?? 1) !== (rs.day ?? 1) ||
      ls.start !== rs.start ||
      ls.end !== rs.end
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onResolveLater}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.dialogHeader}>
            <View style={{ flex: 1 }}>
              <Label size={18} weight="bold" color={colors.ink}>
                Xử lý xung đột lịch trình
              </Label>
              <Label size={12} color={colors.muted} style={{ marginTop: 2 }}>
                Lịch trình đã có thay đổi trên máy chủ. Hãy so sánh và chọn phiên bản muốn giữ.
              </Label>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Đóng và để sau"
              onPress={onResolveLater}
              disabled={isResolving}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.dialogBody}
            contentContainerStyle={styles.dialogContent}
            showsVerticalScrollIndicator
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Label size={14} color={colors.muted} style={{ marginTop: 12 }}>
                  Đang tải phiên bản mới nhất từ máy chủ...
                </Label>
              </View>
            ) : error ? (
              <View style={{ gap: 12 }}>
                <InfoBanner tone="orange" icon="alert-circle-outline">
                  {error}
                </InfoBanner>
                <Button
                  title="Thử tải lại"
                  kind="outline"
                  icon="refresh-outline"
                  onPress={onRetryFetch}
                />
              </View>
            ) : remoteItinerary ? (
              <View style={{ gap: 14 }}>
                <InfoBanner tone="blue" icon="git-compare-outline">
                  Các mục có viền cam làm nổi bật các trường có sự khác biệt giữa hai phiên bản.
                </InfoBanner>

                {/* 1. Bản trên thiết bị (Local) */}
                <Card style={[styles.versionCard, styles.localBorder]}>
                  <View style={styles.cardHeaderRow}>
                    <Pill title="Bản trên thiết bị" tone="orange" />
                    <Pill title={`v${localItinerary.version ?? 1}`} tone="gray" />
                  </View>

                  <View style={[styles.fieldRow, titleDiff && styles.diffHighlight]}>
                    <Label size={12} color={colors.muted}>
                      Tên lịch trình:
                    </Label>
                    <Label size={14} weight="bold" color={colors.ink}>
                      {localItinerary.title}
                    </Label>
                  </View>

                  <View style={[styles.fieldRow, dateDiff && styles.diffHighlight]}>
                    <Label size={12} color={colors.muted}>
                      Ngày khởi hành:
                    </Label>
                    <Label size={14} weight="medium" color={colors.ink}>
                      {localItinerary.date}
                    </Label>
                  </View>

                  <View
                    style={[styles.fieldRow, (durationDiff || paceDiff) && styles.diffHighlight]}
                  >
                    <Label size={12} color={colors.muted}>
                      Thời lượng & Nhịp độ:
                    </Label>
                    <Label size={14} weight="medium" color={colors.ink}>
                      {localItinerary.duration} ngày · {localItinerary.pace}
                    </Label>
                  </View>

                  <View style={[styles.stopsSection, stopsDiff && styles.diffHighlight]}>
                    <Label size={13} weight="bold" color={colors.ink} style={{ marginBottom: 6 }}>
                      Điểm đến ({localItinerary.stops.length} điểm):
                    </Label>
                    {localItinerary.stops.map((stop, index) => (
                      <View
                        key={index}
                        style={[
                          styles.stopItemRow,
                          isLocalStopDifferent(index) && styles.stopDiffBadge,
                        ]}
                      >
                        <Label size={12} color={colors.ink}>
                          {index + 1}. Ngày {stop.dayIndex ?? 1} · {stop.start} - {stop.end} ·{' '}
                          {stop.placeId}
                        </Label>
                      </View>
                    ))}
                  </View>
                </Card>

                {/* 2. Bản trên máy chủ (Remote) */}
                <Card style={[styles.versionCard, styles.remoteBorder]}>
                  <View style={styles.cardHeaderRow}>
                    <Pill title="Bản trên máy chủ" tone="green" />
                    <Pill title={`v${remoteItinerary.version}`} tone="blue" />
                  </View>

                  <View style={[styles.fieldRow, titleDiff && styles.diffHighlight]}>
                    <Label size={12} color={colors.muted}>
                      Tên lịch trình:
                    </Label>
                    <Label size={14} weight="bold" color={colors.ink}>
                      {remoteItinerary.title}
                    </Label>
                  </View>

                  <View style={[styles.fieldRow, dateDiff && styles.diffHighlight]}>
                    <Label size={12} color={colors.muted}>
                      Ngày khởi hành:
                    </Label>
                    <Label size={14} weight="medium" color={colors.ink}>
                      {remoteDateFormatted}
                    </Label>
                  </View>

                  <View
                    style={[styles.fieldRow, (durationDiff || paceDiff) && styles.diffHighlight]}
                  >
                    <Label size={12} color={colors.muted}>
                      Thời lượng & Nhịp độ:
                    </Label>
                    <Label size={14} weight="medium" color={colors.ink}>
                      {remoteItinerary.duration ?? 1} ngày · {remotePaceFormatted}
                    </Label>
                  </View>

                  <View style={[styles.stopsSection, stopsDiff && styles.diffHighlight]}>
                    <Label size={13} weight="bold" color={colors.ink} style={{ marginBottom: 6 }}>
                      Điểm đến ({remoteItinerary.stops.length} điểm):
                    </Label>
                    {remoteItinerary.stops.map((stop, index) => (
                      <View
                        key={index}
                        style={[
                          styles.stopItemRow,
                          isRemoteStopDifferent(index) && styles.stopDiffBadge,
                        ]}
                      >
                        <Label size={12} color={colors.ink}>
                          {index + 1}. Ngày {stop.day ?? 1} · {stop.start} - {stop.end} ·{' '}
                          {stop.place_id}
                        </Label>
                      </View>
                    ))}
                  </View>
                </Card>

                <InfoBanner icon="information-circle-outline">
                  Chọn "Giữ bản của tôi" để cập nhật bản trên máy chủ theo dữ liệu thiết bị. Chọn
                  "Dùng bản máy chủ" để thay thế các thay đổi trên thiết bị bằng dữ liệu từ máy chủ.
                </InfoBanner>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.dialogFooter}>
            <Button
              title={isResolving ? 'Đang gửi cập nhật...' : 'Giữ bản của tôi (Gửi lên máy chủ)'}
              kind="primary"
              icon="cloud-upload-outline"
              disabled={isLoading || isResolving || !remoteItinerary}
              onPress={onKeepLocal}
            />
            <Button
              title={isResolving ? 'Đang thay thế...' : 'Dùng bản máy chủ (Ghi đè thiết bị)'}
              kind="secondary"
              icon="cloud-download-outline"
              disabled={isLoading || isResolving || !remoteItinerary}
              onPress={onUseServer}
            />
            <Button title="Để sau" kind="outline" disabled={isResolving} onPress={onResolveLater} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 6,
    marginLeft: 8,
  },
  dialogBody: {
    flexGrow: 1,
  },
  dialogContent: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionCard: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  localBorder: {
    borderColor: colors.warmBorder,
    backgroundColor: '#FFFCF9',
  },
  remoteBorder: {
    borderColor: '#C6E7DE',
    backgroundColor: '#F9FCFB',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldRow: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  diffHighlight: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.warm,
  },
  stopsSection: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  stopItemRow: {
    paddingVertical: 2,
  },
  stopDiffBadge: {
    backgroundColor: '#FFEAD1',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  dialogFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
    backgroundColor: colors.white,
  },
});
