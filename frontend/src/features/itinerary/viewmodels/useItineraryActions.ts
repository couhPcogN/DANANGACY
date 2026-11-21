import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { useItineraryModel } from '../providers/ItineraryProvider';
import { useAuthModel } from '../../auth/providers/AuthProvider';
import { notify } from '../../../shared/utils/notify';
import {
  orchestrateCreateItinerary,
  orchestrateUpdateItinerary,
  orchestrateDeleteItinerary,
} from './itineraryCrudOrchestrator';

export function useItineraryActions() {
  const model = useItineraryModel();
  const navigation = useNavigationViewModel();
  const auth = useAuthModel();

  return {
    startCreate() {
      model.startCreate();
      navigation.navigate('itineraryInfo');
    },
    async saveDraft() {
      return orchestrateCreateItinerary({
        model,
        auth,
        navigation,
        getCurrentAuth: () => auth,
      });
    },
    startEdit(id: string) {
      const target = model.itineraries.find((item) => item.id === id);
      if (target?.syncStatus === 'pending') {
        notify('Lịch trình đang được đồng bộ với máy chủ, vui lòng đợi trong giây lát.');
        return false;
      }
      if (model.startEdit(id)) {
        navigation.navigate('itineraryEdit', id);
        return true;
      }
      return false;
    },
    async saveEdit() {
      return orchestrateUpdateItinerary({
        model,
        auth,
        navigation,
        getCurrentAuth: () => auth,
      });
    },
    cancelEdit() {
      if (model.editingId) navigation.reset({ name: 'itineraryDetail', id: model.editingId });
    },
    replaceSonTra() {
      const id = model.replaceSonTra(navigation.route.id);
      if (id) navigation.reset({ name: 'itineraryDetail', id });
    },
    async deleteItinerary(id: string) {
      return orchestrateDeleteItinerary({
        id,
        model,
        auth,
        navigation,
        getCurrentAuth: () => auth,
      });
    },
  };
}
