import { useState, useRef } from 'react';
import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { notify } from '../../../shared/utils/notify';
import { useItineraryModel } from '../providers/ItineraryProvider';
import { useItineraryActions } from './useItineraryActions';
import { useFavoritesModel } from '../../explore/providers/FavoritesProvider';
import { useAuthModel } from '../../auth/providers/AuthProvider';
import { placeRepository } from '../../explore/repositories/placeRepository';
import { getStopName } from '../utils/getStopName';
import { validateStops } from '../schemas';
import type { Stop, Itinerary } from '../types';
import { isValidVietnamDate } from '../../../shared/utils/date';
import {
  orchestrateCreateItinerary,
  orchestrateUpdateItinerary,
  orchestrateDeleteItinerary,
} from './itineraryCrudOrchestrator';
import { orchestrateRemoteFetchItineraries } from './itineraryFetchOrchestrator';
import {
  itineraryApiService,
  type BackendItineraryRead,
} from '../../../services/api/itineraryService';
import { cloneItinerary } from '../models/itinerary';
import {
  fetchConflictRemoteSnapshot,
  orchestrateKeepLocal,
  orchestrateUseServer,
  orchestrateResolveLater,
} from './itineraryConflictOrchestrator';

export function useItineraryViewModel() {
  const { route, back, navigate, tab, reset } = useNavigationViewModel();
  const model = useItineraryModel();
  const { itineraries, draft, setDraft, selectedPreferences, togglePreference } = model;
  const isRemoteRefreshing = model.isRemoteRefreshing ?? false;
  const remoteRefreshError = model.remoteRefreshError ?? null;
  const { favorites } = useFavoritesModel();
  const auth = useAuthModel();
  const {
    startCreate,
    startEdit: baseStartEdit,
    cancelEdit,
    replaceSonTra,
  } = useItineraryActions();
  const isSavingRef = useRef(false);
  const isDeletingRef = useRef(false);
  const isResolvingConflictRef = useRef(false);
  const initialLocalSnapshotRef = useRef<Itinerary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [conflictItinerary, setConflictItinerary] = useState<Itinerary | null>(null);
  const [conflictRemoteItem, setConflictRemoteItem] = useState<BackendItineraryRead | null>(null);
  const [isLoadingConflictRemote, setIsLoadingConflictRemote] = useState(false);
  const [conflictRemoteError, setConflictRemoteError] = useState<string | null>(null);
  const [filter, setFilter] = useState('Sắp tới');
  const [search, setSearch] = useState('');
  const [selectedStop, setSelectedStop] = useState(0);
  const [editingTime, setEditingTime] = useState(false);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');

  const selectedItinerary =
    (route.id ? itineraries.find((t) => t.id === route.id) : itineraries[0]) ?? itineraries[0];
  const selectedItineraryFound =
    route.id === undefined || itineraries.some((itinerary) => itinerary.id === route.id);
  const setItinerary = (patch: Partial<Itinerary>) => setDraft({ ...draft, ...patch });
  const timeError = editingTime
    ? validateStops(
        draft.stops.map((s, i) =>
          i === selectedStop ? { ...s, start: startTime, end: endTime } : s,
        ),
      )
    : null;
  const applyTime = () => {
    const stops = draft.stops.map((s, i) =>
      i === selectedStop ? { ...s, start: startTime, end: endTime } : s,
    );
    const error = validateStops(stops);
    if (error) return notify(error);
    setDraft({ ...draft, stops });
    setEditingTime(false);
  };

  const startEdit = (id: string) => {
    const target = itineraries.find((item) => item.id === id);
    if (target?.syncStatus === 'pending') {
      notify('Lịch trình đang được đồng bộ với máy chủ, vui lòng đợi trong giây lát.');
      return false;
    }
    return baseStartEdit(id);
  };

  const beginTimeEdit = (index: number, stop: Stop) => {
    setSelectedStop(index);
    setStartTime(stop.start);
    setEndTime(stop.end);
    setEditingTime(true);
  };
  const beginSavedTimeEdit = (itinerary: Itinerary, index: number, stop: Stop) => {
    if (itinerary.syncStatus === 'pending') {
      return notify('Lịch trình đang được đồng bộ với máy chủ, vui lòng đợi trong giây lát.');
    }
    if (startEdit(itinerary.id)) {
      beginTimeEdit(index, stop);
    }
  };
  const timeEditor = {
    start: startTime,
    end: endTime,
    setStart: setStartTime,
    setEnd: setEndTime,
    apply: applyTime,
    cancel: () => setEditingTime(false),
    error: timeError,
  };

  const continueFromInfo = () => {
    if (!draft.title.trim() || !isValidVietnamDate(draft.date))
      return notify('Vui lòng nhập tên lịch trình và ngày theo DD/MM/YYYY.');
    navigate('itineraryPreferences');
  };
  const submitDraft = async () => {
    if (isSavingRef.current || isSaving) return;
    const error = validateStops(draft.stops);
    if (error) return notify(error);
    if (!draft.title.trim() || !isValidVietnamDate(draft.date)) {
      return notify('Vui lòng nhập tên lịch trình và ngày theo DD/MM/YYYY.');
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      await orchestrateCreateItinerary({
        model,
        auth,
        navigation: { navigate, reset, tab },
        getCurrentAuth: () => auth,
        notify,
      });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };
  const submitEdit = async () => {
    if (isSavingRef.current || isSaving) return;
    const error = validateStops(draft.stops);
    if (error) return notify(error);
    if (!isValidVietnamDate(draft.date)) {
      return notify('Ngày không hợp lệ. Dùng định dạng DD/MM/YYYY.');
    }
    if (!draft.title.trim()) {
      return notify('Vui lòng nhập tên lịch trình.');
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      await orchestrateUpdateItinerary({
        model,
        auth,
        navigation: { navigate, reset, tab },
        getCurrentAuth: () => auth,
        notify,
      });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const places = placeRepository.list();
  const availablePlaces = places.filter((place) =>
    place.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')),
  );
  const favoritePlaces = places.filter((place) => favorites.includes(place.id));
  const describeStop = (stop: Stop) => ({
    ...stop,
    name: getStopName(stop.placeId),
    description:
      stop.placeId === 'cham' || stop.placeId === 'bao-tang-dn'
        ? 'Trong nhà · Tìm hiểu di sản'
        : 'Ngoài trời · Khám phá cảnh quan',
  });
  const draftStopViews = draft.stops.map(describeStop);
  const selectedStopViews = selectedItinerary?.stops.map(describeStop) ?? [];
  const hasWeatherWarning = selectedItinerary?.stops.some((stop) => stop.placeId === 'son-tra');
  const weatherPlace = placeRepository.getById('son-tra');
  const replacementPlace = placeRepository.getById('bao-tang-dn');
  const museumPlace = placeRepository.getById('cham');
  const setFirstStart = (start: string) =>
    setDraft({
      ...draft,
      stops: draft.stops.map((stop, index) => (index === 0 ? { ...stop, start } : stop)),
    });
  const setLastEnd = (end: string) =>
    setDraft({
      ...draft,
      stops: draft.stops.map((stop, index) =>
        index === draft.stops.length - 1 ? { ...stop, end } : stop,
      ),
    });
  const togglePlace = (id: string) => {
    const exists = draft.stops.some((stop) => stop.placeId === id);
    setItinerary({
      stops: exists
        ? draft.stops.filter((stop) => stop.placeId !== id)
        : [...draft.stops, { placeId: id, start: '11:00', end: '12:00' }],
    });
  };
  const addFavoritePlace = (id: string) => {
    if (draft.stops.some((stop) => stop.placeId === id))
      return notify('Điểm đến đã có trong lịch trình.');
    setItinerary({ stops: [...draft.stops, { placeId: id, start: '19:00', end: '20:00' }] });
    back();
  };
  const reviewDraft = () =>
    draft.stops.length ? navigate('itineraryReview') : notify('Chọn ít nhất một điểm đến.');

  const removeDraftStop = (index: number) => {
    if (draft.stops.length <= 1) {
      return notify('Lịch trình cần có ít nhất 1 điểm dừng.');
    }
    const success = model.removeDraftStop(index);
    if (success) {
      notify('Đã xóa điểm dừng khỏi lịch trình.');
    }
  };

  const deleteItinerary = async (id: string) => {
    if (isDeletingRef.current || isDeleting) return;
    isDeletingRef.current = true;
    setIsDeleting(true);
    try {
      await orchestrateDeleteItinerary({
        id,
        model,
        auth,
        navigation: { navigate, reset, tab },
        getCurrentAuth: () => auth,
        notify,
      });
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  const refreshRemoteItineraries = async () => {
    return orchestrateRemoteFetchItineraries({
      model,
      auth,
      getCurrentAuth: () => auth,
      notify,
    });
  };

  const openConflictResolution = async (itinerary: Itinerary) => {
    if (!auth.signedIn || !auth.token) {
      notify('Vui lòng đăng nhập để xử lý xung đột với máy chủ.');
      return;
    }
    if (typeof itinerary.remoteId !== 'number' || itinerary.remoteId <= 0) {
      notify('Lịch trình chưa được đồng bộ lên máy chủ, không thể xử lý xung đột.');
      return;
    }
    setConflictItinerary(itinerary);
    initialLocalSnapshotRef.current = cloneItinerary(itinerary);
    setConflictModalVisible(true);
    setIsLoadingConflictRemote(true);
    setConflictRemoteError(null);
    setConflictRemoteItem(null);

    try {
      const result = await fetchConflictRemoteSnapshot({
        remoteId: itinerary.remoteId,
        auth,
        getCurrentAuth: () => auth,
      });
      if (result.cancelled) return;
      if (result.success && result.remote) {
        setConflictRemoteItem(result.remote);
      } else {
        setConflictRemoteError(result.error || 'Không thể tải bản ghi từ máy chủ.');
      }
    } catch (err) {
      setConflictRemoteError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoadingConflictRemote(false);
    }
  };

  const retryFetchConflictRemote = async () => {
    if (!conflictItinerary?.remoteId) return;
    setIsLoadingConflictRemote(true);
    setConflictRemoteError(null);
    try {
      const result = await fetchConflictRemoteSnapshot({
        remoteId: conflictItinerary.remoteId,
        auth,
        getCurrentAuth: () => auth,
      });
      if (result.cancelled) return;
      if (result.success && result.remote) {
        setConflictRemoteItem(result.remote);
      } else {
        setConflictRemoteError(result.error || 'Không thể tải bản ghi từ máy chủ.');
      }
    } catch (err) {
      setConflictRemoteError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoadingConflictRemote(false);
    }
  };

  const closeConflictResolution = () => {
    orchestrateResolveLater({
      onClose: () => {
        setConflictModalVisible(false);
        setConflictItinerary(null);
        setConflictRemoteItem(null);
        setConflictRemoteError(null);
        setIsLoadingConflictRemote(false);
        initialLocalSnapshotRef.current = null;
      },
    });
  };

  const resolveConflictKeepLocal = async () => {
    if (isResolvingConflictRef.current || !conflictItinerary || !conflictRemoteItem) return;
    isResolvingConflictRef.current = true;
    setIsResolvingConflict(true);
    try {
      const result = await orchestrateKeepLocal({
        localItinerary: conflictItinerary,
        remoteSnapshot: conflictRemoteItem,
        model,
        auth,
        getCurrentAuth: () => auth,
        notify,
      });
      if (result.success) {
        closeConflictResolution();
      } else if (result.conflictAgain) {
        await retryFetchConflictRemote();
      }
    } finally {
      isResolvingConflictRef.current = false;
      setIsResolvingConflict(false);
    }
  };

  const resolveConflictUseServer = async () => {
    if (isResolvingConflictRef.current || !conflictItinerary || !conflictRemoteItem) return;
    isResolvingConflictRef.current = true;
    setIsResolvingConflict(true);
    try {
      const result = await orchestrateUseServer({
        localItinerary: conflictItinerary,
        remoteSnapshot: conflictRemoteItem,
        model,
        auth,
        getCurrentAuth: () => auth,
        notify,
        apiService: itineraryApiService,
        initialLocalSnapshot: initialLocalSnapshotRef.current ?? undefined,
      });
      if (result.success) {
        closeConflictResolution();
      } else if (result.remoteChanged) {
        await retryFetchConflictRemote();
      }
    } finally {
      isResolvingConflictRef.current = false;
      setIsResolvingConflict(false);
    }
  };

  return {
    isSaving,
    isDeleting,
    isRemoteRefreshing,
    remoteRefreshError,
    refreshRemoteItineraries,
    conflictModalVisible,
    conflictItinerary,
    conflictRemoteItem,
    isLoadingConflictRemote,
    conflictRemoteError,
    isResolvingConflict,
    openConflictResolution,
    closeConflictResolution,
    resolveConflictKeepLocal,
    resolveConflictUseServer,
    retryFetchConflictRemote,
    tab,
    availablePlaces,
    favoritePlaces,
    draftStopViews,
    selectedStopViews,
    hasWeatherWarning,
    weatherPlace,
    replacementPlace,
    museumPlace,
    setFirstStart,
    setLastEnd,
    togglePlace,
    addFavoritePlace,
    reviewDraft,
    removeDraftStop,
    deleteItinerary,

    continueFromInfo,
    submitDraft,
    submitEdit,
    route,
    back,
    navigate,
    itineraries,
    draft,
    startCreate,
    startEdit,
    cancelEdit,
    notify,
    replaceSonTra,
    filter,
    setFilter,
    search,
    setSearch,
    editingTime,
    selectedItinerary,
    selectedItineraryFound,
    setItinerary,
    beginTimeEdit,
    beginSavedTimeEdit,
    timeEditor,
    selectedPreferences,
    togglePreference,
  };
}
