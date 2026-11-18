import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { useProfileModel } from '../../profile/providers/ProfileProvider';
import { useItineraryModel } from '../../itinerary/providers/ItineraryProvider';
import { useItineraryActions } from '../../itinerary/viewmodels/useItineraryActions';
import { placeRepository } from '../../explore/repositories/placeRepository';
import { useGameModel } from '../../game/providers/GameProvider';

export function useHomeViewModel() {
  const { navigate, tab } = useNavigationViewModel();
  const { name } = useProfileModel();
  const { itineraries } = useItineraryModel();
  const { startCreate } = useItineraryActions();
  const { quizIndex, quizCompleted, quizAnswers, points } = useGameModel();
  const nextQuizIndex = quizAnswers.findIndex((answer) => answer === null);
  const displayQuestion = quizCompleted
    ? 5
    : Math.min(5, nextQuizIndex < 0 ? quizIndex + 1 : nextQuizIndex + 1);
  const recommendedPlaces = placeRepository.list().slice(0, 4);
  return {
    navigate,
    tab,
    name,
    itineraries,
    startCreate,
    recommendedPlaces,
    quizCompleted,
    displayQuestion,
    points,
  };
}
