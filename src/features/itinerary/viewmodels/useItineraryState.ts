import { useState } from 'react';
import type { Route, RouteName } from '../../../navigation/types';
import type { Trip } from '../types';
import { defaultTrip, initialTrip, cloneTrip, createSavedTrip, updateTrip, replaceOutdoorStop } from '../repositories/itineraryRepository';

export function useItineraryState(route: Route, navigate: (name: RouteName, id?: string) => void, reset: (route: Route) => void) {
  const [trips, setTrips] = useState<Trip[]>([initialTrip]);
  const [draft, setDraft] = useState<Trip>(defaultTrip);
  const [editingId, setEditingId] = useState<string | null>(null);
  const startCreate = () => { setEditingId(null); setDraft(cloneTrip(defaultTrip)); navigate('tripInfo'); };
  const saveDraft = () => {
    const saved = createSavedTrip(draft);
    setTrips((s) => [saved, ...s]);
    setDraft(saved);
    navigate('tripSaved', saved.id);
  };
  const startEdit = (id: string) => {
    const found = trips.find((trip) => trip.id === id);
    if (!found) return;
    setEditingId(id);
    setDraft(cloneTrip(found));
    navigate('tripEdit', id);
  };
  const saveEdit = () => {
    if (!editingId) return;
    setTrips((s) => updateTrip(s, editingId, draft));
    reset({ name: 'tripDetail', id: editingId });
  };
  const cancelEdit = () => {
    if (!editingId) return;
    reset({ name: 'tripDetail', id: editingId });
  };
  const replaceSonTra = () => {
    const trip = trips.find((item) => item.id === route.id) ?? trips.find((item) => item.id !== 'hoi-an');
    if (!trip) return;
    setTrips((s) => replaceOutdoorStop(s, trip.id));
    reset({ name: 'tripDetail', id: trip.id });
  };
  return { trips, setTrips, draft, setDraft, startCreate, saveDraft, startEdit, saveEdit, cancelEdit, replaceSonTra };
}
