import { createModelContext } from '../../../providers/createModelContext';
import { createGameStateRepository } from '../repositories/gameStateRepository';

const context = createModelContext('Game', createGameStateRepository);
export const GameProvider = context.Provider;
export const useGameModel = context.useModel;
