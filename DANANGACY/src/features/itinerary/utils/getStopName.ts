import { getPlace } from '../../explore/repositories/placeRepository';
import { hoiAnNames } from '../repositories/itineraryRepository';

export const getStopName = (id: string) => hoiAnNames[id] ?? getPlace(id).name;
