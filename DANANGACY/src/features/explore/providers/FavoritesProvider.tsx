import { createModelContext } from '../../../providers/createModelContext';
import { createFavoritesRepository } from '../repositories/favoritesRepository';

const context = createModelContext('Favorites', createFavoritesRepository);
export const FavoritesProvider = context.Provider;
export const useFavoritesModel = context.useModel;
