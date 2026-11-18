import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { useItineraryModel } from '../providers/ItineraryProvider';
import { useAuthModel } from '../../auth/providers/AuthProvider';
import { itineraryApiService } from '../../../services/api/itineraryService';

function toIsoDate(val: string): string {
  const parts = val.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(val) ? val : '2026-11-20';
}

export function useItineraryActions() {
  const model = useItineraryModel();
  const navigation = useNavigationViewModel();
  const { token } = useAuthModel();
  return {
    startCreate() {
      model.startCreate();
      navigation.navigate('itineraryInfo');
    },
    saveDraft() {
      const saved = model.saveDraft();
      navigation.navigate('itinerarySaved', saved.id);
      if (token && saved.stops.length > 0) {
        itineraryApiService
          .createItinerary(
            {
              title: saved.title || 'Lịch trình khám phá Đà Nẵng',
              date: toIsoDate(saved.date || '20/11/2026'),
              duration: saved.duration >= 1 && saved.duration <= 3 ? saved.duration : 1,
              pace: (['Thư thả', 'Cân bằng', 'Năng động'].includes(saved.pace)
                ? saved.pace
                : 'Thư thả') as 'Thư thả' | 'Cân bằng' | 'Năng động',
              stops: saved.stops.map((s) => ({
                place_id: s.placeId,
                day: s.dayIndex ?? 1,
                start: s.start || '08:00',
                end: s.end || '10:00',
              })),
            },
            token,
          )
          .catch(() => {});
      }
    },
    startEdit(id: string) {
      if (model.startEdit(id)) navigation.navigate('itineraryEdit', id);
    },
    saveEdit() {
      const id = model.saveEdit();
      if (id) navigation.reset({ name: 'itineraryDetail', id });
    },
    cancelEdit() {
      if (model.editingId) navigation.reset({ name: 'itineraryDetail', id: model.editingId });
    },
    replaceSonTra() {
      const id = model.replaceSonTra(navigation.route.id);
      if (id) navigation.reset({ name: 'itineraryDetail', id });
    },
  };
}
