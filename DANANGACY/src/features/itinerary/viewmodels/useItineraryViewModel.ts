import { useState } from 'react';
import { useApp } from '../../../providers/AppProvider';
import { validateStops } from '../schemas';
import type { Stop, Trip } from '../types';

export function useItineraryViewModel() {
  const app = useApp();
  const {
    route,
    back,
    navigate,
    trips,
    draft,
    setDraft,
    startCreate,
    saveDraft,
    startEdit,
    saveEdit,
    cancelEdit,
    notify,
    replaceSonTra,
  } = app;
  const [filter, setFilter] = useState('Sắp tới');
  const [search, setSearch] = useState('');
  const [selectedStop, setSelectedStop] = useState(0);
  const [editingTime, setEditingTime] = useState(false);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');

  const selectedTrip = trips.find((t) => t.id === route.id) ?? trips[0];
  const setTrip = (patch: Partial<Trip>) => setDraft({ ...draft, ...patch });
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
  const beginSavedTimeEdit = (trip: Trip, index: number, stop: Stop) => {
    startEdit(trip.id);
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
    navigate('tripPreferences');
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

  return {
    continueFromInfo,
    submitDraft,
    submitEdit,
    app,
    route,
    back,
    navigate,
    trips,
    draft,
    setDraft,
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
    selectedTrip,
    setTrip,
    beginTimeEdit,
    beginSavedTimeEdit,
    timeEditor,
  };
}
