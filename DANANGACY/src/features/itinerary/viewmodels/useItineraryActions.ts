import { useNavigationViewModel } from '../../../navigation/NavigationProvider';
import { useItineraryModel } from '../providers/ItineraryProvider';

export function useItineraryActions() {
  const model = useItineraryModel();
  const navigation = useNavigationViewModel();
  return {
    startCreate() {
      model.startCreate();
      navigation.navigate('itineraryInfo');
    },
    saveDraft() {
      const saved = model.saveDraft();
      navigation.navigate('itinerarySaved', saved.id);
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
