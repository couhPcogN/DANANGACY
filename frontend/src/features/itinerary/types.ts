export type DayIndex = 1 | 2 | 3;

export type Stop = {
  placeId: string;
  start: string;
  end: string;
  dayIndex?: DayIndex;
};

export type SyncStatus = 'local' | 'synced' | 'pending' | 'conflict' | 'error';

export type Itinerary = {
  id: string;
  remoteId?: number;
  version?: number;
  syncStatus?: SyncStatus;
  title: string;
  date: string;
  duration: number;
  pace: string;
  stops: Stop[];
  saved: boolean;
};

export type StopView = Stop & { name: string; description: string };
