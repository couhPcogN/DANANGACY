import type { Itinerary } from '../types';

export const cloneItinerary = (itinerary: Itinerary): Itinerary => ({
  ...itinerary,
  stops: itinerary.stops.map((stop) => ({ ...stop })),
});
export const createSavedItinerary = (itinerary: Itinerary): Itinerary => ({
  ...itinerary,
  id: `itinerary-${Date.now()}`,
  saved: true,
});
export const updateItinerary = (
  itineraries: Itinerary[],
  id: string,
  draft: Itinerary,
): Itinerary[] =>
  itineraries.map((itinerary) => (itinerary.id === id ? { ...draft, id, saved: true } : itinerary));
export const replaceOutdoorStop = (itineraries: Itinerary[], id: string): Itinerary[] =>
  itineraries.map((itinerary) =>
    itinerary.id === id
      ? {
          ...itinerary,
          stops: itinerary.stops.map((stop) =>
            stop.placeId === 'son-tra' ? { ...stop, placeId: 'bao-tang-dn' } : stop,
          ),
        }
      : itinerary,
  );
