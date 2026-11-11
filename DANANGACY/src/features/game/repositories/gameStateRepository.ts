import { createStore } from '../../../lib/state/createStore';
import { gameRepository } from './gameRepository';

export type GameProgress = {
  quizCompleted: boolean;
  quizAnswers: (number | null)[];
  points: number;
  rewardRedeemed: boolean;
};

export function createGameStateRepository(initial?: Partial<GameProgress>) {
  const quiz = gameRepository.getQuestions();
  const store = createStore({
    quizIndex: 0,
    quizSelected: null as number | null,
    quizConfirmed: false,
    quizAnswers:
      Array.isArray(initial?.quizAnswers) && initial.quizAnswers.length === quiz.length
        ? initial.quizAnswers
        : [quiz[0].correct, ...Array<number | null>(quiz.length - 1).fill(null)],
    quizCompleted: initial?.quizCompleted === true,
    points: typeof initial?.points === 'number' ? initial.points : 120,
    rewardRedeemed: initial?.rewardRedeemed === true,
  });
  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    actions: {
      startQuiz() {
        store.update((state) => {
          const next = state.quizAnswers.findIndex((answer) => answer === null);
          return {
            ...state,
            quizIndex: next < 0 ? 0 : next,
            quizSelected: null,
            quizConfirmed: false,
          };
        });
      },
      selectAnswer(index: number) {
        store.update((state) => (state.quizConfirmed ? state : { ...state, quizSelected: index }));
      },
      confirmAnswer() {
        store.update((state) =>
          state.quizSelected === null
            ? state
            : {
                ...state,
                quizConfirmed: true,
                quizAnswers: state.quizAnswers.map((value, index) =>
                  index === state.quizIndex ? state.quizSelected : value,
                ),
              },
        );
      },
      nextQuestion(): boolean {
        const state = store.getSnapshot();
        if (state.quizIndex < quiz.length - 1) {
          store.update((current) => ({
            ...current,
            quizIndex: current.quizIndex + 1,
            quizSelected: null,
            quizConfirmed: false,
          }));
          return false;
        }
        if (!state.quizCompleted)
          store.update((current) => ({
            ...current,
            points: current.points + 50,
            quizCompleted: true,
          }));
        return true;
      },
      redeemReward(): boolean {
        const state = store.getSnapshot();
        if (state.rewardRedeemed || state.points < 100) return false;
        store.update((current) => ({
          ...current,
          points: current.points - 100,
          rewardRedeemed: true,
        }));
        return true;
      },
    },
  };
}
