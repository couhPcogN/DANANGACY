import { useState } from 'react';
import { useNavigationViewModel } from '../../../navigation/NavigationProvider';
import { notify } from '../../../utils/notify';
import { useItineraryModel } from '../providers/ItineraryProvider';
import { useItineraryActions } from './useItineraryActions';
import { useFavoritesModel } from '../../explore/providers/FavoritesProvider';
import { placeRepository } from '../../explore/repositories/placeRepository';
import { getStopName } from '../utils/getStopName';
import { validateStops } from '../schemas';
import type { Stop, Itinerary } from '../types';

export function useItineraryViewModel() {
  const { route, back, navigate, tab } = useNavigationViewModel();
  const { itineraries, draft, setDraft } = useItineraryModel();
  const { favorites } = useFavoritesModel();
  const { startCreate, saveDraft, startEdit, saveEdit, cancelEdit, replaceSonTra } =
    useItineraryActions();
  const [filter, setFilter] = useState('Sắp tới');
  const [search, setSearch] = useState('');
  const [selectedStop, setSelectedStop] = useState(0);
  const [editingTime, setEditingTime] = useState(false);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');

  const selectedItinerary = itineraries.find((t) => t.id === route.id) ?? itineraries[0];
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

  const beginTimeEdit = (index: number, stop: Stop) => {
    setSelectedStop(index);
    setStartTime(stop.start);
    setEndTime(stop.end);
    setEditingTime(true);
  };
  const beginSavedTimeEdit = (itinerary: Itinerary, index: number, stop: Stop) => {
    startEdit(itinerary.id);
    beginTimeEdit(index, stop);
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
    if (!draft.title.trim() || !/^\d{2}\/\d{2}\/\d{4}$/.test(draft.date))
      return notify('Vui lòng nhập tên lịch trình và ngày theo DD/MM/YYYY.');
    navigate('itineraryPreferences');
  };
  const submitDraft = () => {
    const error = validateStops(draft.stops);
    if (error) return notify(error);
    saveDraft();
  };
  const submitEdit = () => {
    const error = validateStops(draft.stops);
    if (error) return notify(error);
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(draft.date))
      return notify('Ngày không hợp lệ. Dùng định dạng DD/MM/YYYY.');
    saveEdit();
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

  return {
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
    setItinerary,
    beginTimeEdit,
    beginSavedTimeEdit,
    timeEditor,
  };
}
