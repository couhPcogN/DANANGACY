import { createModelContext } from '../../../providers/createModelContext';
import { createItineraryRepository } from '../repositories/itineraryRepository';

const context = createModelContext('Itinerary', createItineraryRepository);
export const ItineraryProvider = context.Provider;
export const useItineraryModel = context.useModel;
