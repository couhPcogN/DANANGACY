const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export type BackendDestination = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  environment: 'INDOOR' | 'OUTDOOR';
  category: string | null;
  status: string;
};

export type BackendFavoriteItem = {
  destination_id: number;
  slug: string;
  name: string;
  environment: string;
  category: string | null;
  created_at: string;
};

export const placeService = {
  async fetchDestinations(): Promise<BackendDestination[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/destinations`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async fetchFavorites(token?: string): Promise<BackendFavoriteItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/favorites`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async toggleFavorite(
    idOrSlug: string | number,
    token?: string,
  ): Promise<{ is_favorite: boolean; message: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/favorites/${idOrSlug}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
