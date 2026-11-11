import { demoPlaces } from '../data/demoPlaces';

export const placeRepository = {
  list: () => demoPlaces,
  getById: (id: string) => demoPlaces.find((place) => place.id === id) ?? demoPlaces[0],
};
