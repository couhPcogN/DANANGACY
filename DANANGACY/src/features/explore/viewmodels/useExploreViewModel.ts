import { useMemo, useState } from 'react';
import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { useFavoritesModel } from '../providers/FavoritesProvider';
import { placeRepository } from '../repositories/placeRepository';
import { filterPlaces } from '../repositories/placeRepository';

export function useExploreViewModel() {
  const { route, navigate, back, tab } = useNavigationViewModel();
  const { favorites, toggleFavorite } = useFavoritesModel();
  const places = placeRepository.list();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Tất cả');
  const [categoryFilter, setCategoryFilter] = useState('Tất cả');
  const categories = Array.from(new Set(places.map((place) => place.category))).sort();
  const visible = useMemo(
    () => filterPlaces(places, query, filter, categoryFilter),
    [query, filter, categoryFilter, places],
  );

  const place = route.id ? placeRepository.findById(route.id) : placeRepository.getById('cham');
  const placeFound = place !== undefined;
  const saved = place ? favorites.includes(place.id) : false;

  const filteredMapPlaces = filterPlaces(places, query, filter, categoryFilter);
  const mapPlaces = filteredMapPlaces;
  const featuredPlace = filteredMapPlaces[0];

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
    toggleFavorite,
    query,
    setQuery,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    visible,
  };
}
