import { useEffect, useMemo, useState } from 'react';
import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { useFavoritesModel } from '../providers/FavoritesProvider';
import { placeRepository } from '../repositories/placeRepository';
import { filterPlaces } from '../repositories/placeRepository';
import { askGeminiHeritageGuide } from '../../../services/ai/geminiService';
import { useAuthModel } from '../../auth/providers/AuthProvider';
import { placeService } from '../../../services/api/placeService';

export function useExploreViewModel() {
  const { route, navigate, back, tab } = useNavigationViewModel();
  const { favorites, toggleFavorite } = useFavoritesModel();
  const { token } = useAuthModel();
  const places = placeRepository.list();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Tất cả');
  const [categoryFilter, setCategoryFilter] = useState('Tất cả');
  const [aiGuide, setAiGuide] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const categories = Array.from(new Set(places.map((place) => place.category))).sort();
  const visible = useMemo(
    () => filterPlaces(places, query, filter, categoryFilter),
    [query, filter, categoryFilter, places],
  );

  const place = route.id ? placeRepository.findById(route.id) : placeRepository.getById('cham');
  const placeFound = place !== undefined;
  const saved = place ? favorites.includes(place.id) : false;

  useEffect(() => {
    if (!place) return;
    let active = true;
    setIsAiLoading(true);
    askGeminiHeritageGuide(place.name, place.id).then((res) => {
      if (!active) return;
      setAiGuide(res.text);
      setIsAiLoading(false);
    });
    return () => {
      active = false;
    };
  }, [place?.id, place?.name]);

  const filteredMapPlaces = filterPlaces(places, query, filter, categoryFilter);
  const mapPlaces = filteredMapPlaces;
  const featuredPlace = filteredMapPlaces[0];

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    if (token) {
      placeService.toggleFavorite(id, token).catch(() => {});
    }
  };

  return {
    tab,
    mapPlaces,
    featuredPlace,

    place,
    placeFound,
    saved,
    route,
    navigate,
    back,
    toggleFavorite: handleToggleFavorite,
    query,
    setQuery,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    visible,
    aiGuide,
    isAiLoading,
  };
}
