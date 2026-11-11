import { useState } from 'react';
import { useApp } from '../../../providers/AppProvider';
import { quiz } from '../repositories/gameRepository';

export function useGameViewModel() {
  const app = useApp();
  const {
    route,
    navigate,
    back,
    quizIndex,
    quizSelected,
    quizConfirmed,
    quizAnswers,
    quizCompleted,
    points,
    startQuiz,
    selectAnswer,
    confirmAnswer,
    nextQuestion,
    rewardRedeemed,
    redeemReward,
    notify,
  } = app;
  const [gameTab, setGameTab] = useState<'challenge' | 'rewards'>(
    route.name === 'rewards' ? 'rewards' : 'challenge',
  );
  const visibleGameTab = route.name === 'rewards' ? 'rewards' : gameTab;
  const [voucherFilter, setVoucherFilter] = useState<'active' | 'used'>('active');
  const current = quiz[quizIndex];
  const score = quizAnswers.filter((answer, index) => answer === quiz[index].correct).length;
  const nextQuizIndex = quizAnswers.findIndex((answer) => answer === null);
  const displayQuestion = quizCompleted
    ? 5
    : Math.min(5, (nextQuizIndex < 0 ? 4 : nextQuizIndex) + 1);

  const redeemSelectedReward = () =>
    rewardRedeemed
      ? notify('Bạn đã đổi ưu đãi này.')
      : points < 100
        ? notify('Bạn chưa đủ 100 điểm.')
        : redeemReward();

  return {
    redeemSelectedReward,
    app,
    route,
    navigate,
    back,
    quizIndex,
    quizSelected,
    quizConfirmed,
    quizAnswers,
    quizCompleted,
    points,
    startQuiz,
    selectAnswer,
    confirmAnswer,
    nextQuestion,
    rewardRedeemed,
    notify,
    setGameTab,
    visibleGameTab,
    voucherFilter,
    setVoucherFilter,
    current,
    score,
    displayQuestion,
  };
}
