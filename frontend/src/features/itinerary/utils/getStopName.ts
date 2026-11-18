import { placeRepository } from '../../explore/repositories/placeRepository';
import { hoiAnNames } from '../data/demoItineraries';

export const getStopName = (id: string) => hoiAnNames[id] ?? placeRepository.getById(id).name;
