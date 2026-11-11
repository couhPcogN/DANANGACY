import { useMemo, useState } from 'react';
import { useNavigationViewModel } from '../../../navigation/NavigationProvider';
import { useFavoritesModel } from '../providers/FavoritesProvider';
import { placeRepository } from '../repositories/placeRepository';

export function useExploreViewModel() {
  const { route, navigate, back } = useNavigationViewModel();
  const { favorites, toggleFavorite } = useFavoritesModel();
  const places = placeRepository.list();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Tất cả');
  const visible = useMemo(
    () =>
      places.filter(
        (p) =>
          (filter === 'Tất cả' ||
            (filter === 'Bảo tàng' && p.tags.includes('Bảo tàng')) ||
            p.category === filter) &&
          p.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')),
      ),
    [query, filter],
  );

  const place = placeRepository.getById(route.id ?? 'cham');
  const saved = favorites.includes(place.id);

  const mapPlaces = places.filter((place) => filter === 'Tất cả' || place.category === filter);
  const featuredPlace = places[0];

  return {
    mapPlaces,
    featuredPlace,

    place,
    saved,
    route,
    navigate,
    back,
    toggleFavorite,
    query,
    setQuery,
    filter,
    setFilter,
    visible,
  };
}
