import { useState } from 'react';
import { useNavigationViewModel } from '../../../navigation/NavigationProvider';
import { notify } from '../../../utils/notify';
import type { RouteName } from '../../../navigation/types';
import { useProfileModel } from '../providers/ProfileProvider';
import { useAuthModel } from '../../auth/providers/AuthProvider';
import { useFavoritesModel } from '../../explore/providers/FavoritesProvider';
import { useGameModel } from '../../game/providers/GameProvider';
import { useItineraryModel } from '../../itinerary/providers/ItineraryProvider';
import { placeRepository } from '../../explore/repositories/placeRepository';

export function useProfileViewModel() {
  const { route, navigate, back, tab, reset } = useNavigationViewModel();
  const { name, email, phone, updateProfile } = useProfileModel();
  const auth = useAuthModel();
  const { signedIn } = auth;
  const { favorites, toggleFavorite } = useFavoritesModel();
  const { points, rewardRedeemed, quizCompleted } = useGameModel();
  const { itineraries } = useItineraryModel();
  const logout = () => {
    auth.logout();
    reset({ name: 'welcome' });
  };
  const [draftName, setDraftName] = useState(name);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftPhone, setDraftPhone] = useState(phone);

  const saveProfile = () => {
    if (!draftName.trim() || !draftEmail.includes('@'))
      return notify('Họ tên hoặc email không hợp lệ.');
    updateProfile({ name: draftName.trim(), email: draftEmail.trim(), phone: draftPhone.trim() });
    notify('Đã lưu thông tin hồ sơ.');
    back();
  };

  const favoriteItems = favorites.map((id) => ({ id, place: placeRepository.getById(id) }));
  const openSection = (target: RouteName) =>
    target === 'itinerary' || target === 'game' ? tab(target) : navigate(target);

  return {
    tab,
    signedIn,
    logout,
    rewardRedeemed,
    quizCompleted,
    favoriteItems,
    openSection,

    saveProfile,
    route,
    back,
    navigate,
    name,
    email,
    favorites,
    toggleFavorite,
    itineraries,
    points,
    draftName,
    setDraftName,
    draftEmail,
    setDraftEmail,
    draftPhone,
    setDraftPhone,
  };
}
