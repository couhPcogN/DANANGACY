import { useNavigationViewModel } from '../../../navigation/NavigationProvider';
import { useProfileModel } from '../../profile/providers/ProfileProvider';
import { useItineraryModel } from '../../itinerary/providers/ItineraryProvider';
import { useItineraryActions } from '../../itinerary/viewmodels/useItineraryActions';
import { placeRepository } from '../../explore/repositories/placeRepository';

export function useHomeViewModel() {
  const { navigate, tab } = useNavigationViewModel();
  const { name } = useProfileModel();
  const { itineraries } = useItineraryModel();
  const { startCreate } = useItineraryActions();
  const recommendedPlaces = placeRepository.list().slice(0, 4);
  return { navigate, tab, name, itineraries, startCreate, recommendedPlaces };
}
