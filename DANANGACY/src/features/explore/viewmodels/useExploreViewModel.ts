import { useMemo, useState } from 'react';
import { useApp } from '../../../providers/AppProvider';
import { getPlace, places } from '../repositories/placeRepository';

export function useExploreViewModel() {
  const app = useApp();
  const { route, navigate, back, favorites, toggleFavorite } = app;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Tất cả');
  const visible = useMemo(() => places.filter((p) => (filter === 'Tất cả' || filter === 'Bảo tàng' && p.tags.includes('Bảo tàng') || p.category === filter) && p.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))), [query, filter]);

  const place = getPlace(route.id ?? 'cham');
  const saved = favorites.includes(place.id);

  return { place, saved, app, route, navigate, back, favorites, toggleFavorite, query, setQuery, filter, setFilter, visible };
}
