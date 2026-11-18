const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export type BackendItineraryStop = {
  place_id: string;
  day?: number;
  start: string;
  end: string;
};

export type BackendItineraryCreate = {
  title: string;
  date: string;
  duration?: number;
  pace?: 'Thư thả' | 'Cân bằng' | 'Năng động';
  stops: BackendItineraryStop[];
};

export type BackendItineraryRead = {
  id: number;
  title: string;
  date: string;
  stops: BackendItineraryStop[];
  version: number;
  created_at: string;
  updated_at: string;
};

export const itineraryApiService = {
  async fetchItineraries(token?: string): Promise<BackendItineraryRead[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/itineraries`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async createItinerary(
    payload: BackendItineraryCreate,
    token?: string,
  ): Promise<BackendItineraryRead | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/itineraries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
