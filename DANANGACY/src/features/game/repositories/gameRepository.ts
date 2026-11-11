import { demoQuiz } from '../data/demoQuiz';

export const gameRepository = {
  getQuestions: () => demoQuiz,
  getChallengeNames: () => ['Hiện vật Chăm Pa', 'Dấu ấn bên sông Hàn', 'Di sản phố cổ Hội An'],
};
