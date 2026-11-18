import { useState } from 'react';
import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { notify } from '../../../shared/utils/notify';
import type { RouteName } from '../../../app/navigation/types';
import { useProfileModel } from '../providers/ProfileProvider';
import { useAuthModel } from '../../auth/providers/AuthProvider';
import { useFavoritesModel } from '../../explore/providers/FavoritesProvider';
import { useGameModel } from '../../game/providers/GameProvider';
import { useItineraryModel } from '../../itinerary/providers/ItineraryProvider';
import { placeRepository } from '../../explore/repositories/placeRepository';
import { placeService } from '../../../services/api/placeService';
import { authService } from '../../../services/api/authService';

export function useProfileViewModel() {
  const { route, navigate, back, tab, reset } = useNavigationViewModel();
  const { name, email, phone, updateProfile } = useProfileModel();
  const auth = useAuthModel();
  const { signedIn, token } = auth;
  const { favorites, toggleFavorite } = useFavoritesModel();
  const { points, rewardRedeemed, quizCompleted } = useGameModel();
  const { itineraries } = useItineraryModel();
  const logout = () => {
    auth.logout();
    updateProfile({ name: 'Khách tham quan', email: '', phone: '' });
    notify('Đã đăng xuất tài khoản. Đang ở giao diện Khách.');
    reset({ name: 'home' });
  };
  const goToLogin = () => navigate('login');
  const goToRegister = () => navigate('register');
  const [draftName, setDraftName] = useState(name);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftPhone, setDraftPhone] = useState(phone);

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    if (token) {
      placeService.toggleFavorite(id, token).catch(() => {});
    }
  };

  const saveProfile = () => {
    if (!draftName.trim() || !draftEmail.includes('@'))
      return notify('Họ tên hoặc email không hợp lệ.');
    updateProfile({ name: draftName.trim(), email: draftEmail.trim(), phone: draftPhone.trim() });
    if (token) {
      authService.updateProfile(draftName.trim(), token).catch(() => {});
    }
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
    goToLogin,
    goToRegister,
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
    toggleFavorite: handleToggleFavorite,
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
