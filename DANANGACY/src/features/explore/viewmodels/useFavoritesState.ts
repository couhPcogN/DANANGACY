import { useState } from 'react';

export function useFavoritesState() {
  const [favorites, setFavorites] = useState(['cham', 'son-tra', 'cau-rong']);
  const toggleFavorite = (id: string) =>
    setFavorites((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return { favorites, setFavorites, toggleFavorite };
}
