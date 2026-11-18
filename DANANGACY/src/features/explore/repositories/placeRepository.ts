import { demoPlaces } from '../data/demoPlaces';
import type { Place } from '../types';

export function filterPlaces(
  places: Place[],
  query = '',
  spaceFilter = 'Tất cả',
  categoryFilter = 'Tất cả',
) {
  const normalizedQuery = query.toLocaleLowerCase('vi');
  return places.filter(
    (place) =>
      (spaceFilter === 'Tất cả' ||
        (spaceFilter === 'Trong nhà' && place.space === 'INDOOR') ||
        (spaceFilter === 'Ngoài trời' && place.space === 'OUTDOOR')) &&
      (categoryFilter === 'Tất cả' || place.category === categoryFilter) &&
      place.name.toLocaleLowerCase('vi').includes(normalizedQuery),
  );
}

export const placeRepository = {
  list: () => demoPlaces,
  findById: (id: string) => demoPlaces.find((place) => place.id === id),
  getById: (id: string) => demoPlaces.find((place) => place.id === id) ?? demoPlaces[0],
};
