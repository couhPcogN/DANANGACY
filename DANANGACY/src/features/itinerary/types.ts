export type Stop = { placeId: string; start: string; end: string };
export type Itinerary = {
  id: string;
  title: string;
  date: string;
  duration: number;
  pace: string;
  stops: Stop[];
  saved: boolean;
};

export type StopView = Stop & { name: string; description: string };
