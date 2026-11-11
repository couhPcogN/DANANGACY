import { useState } from 'react';
import { useNavigationViewModel } from '../../../navigation/NavigationProvider';
import { notify } from '../../../utils/notify';
import { useGameModel } from '../providers/GameProvider';
import { gameRepository } from '../repositories/gameRepository';

export function useGameViewModel() {
  const { route, navigate, back, tab } = useNavigationViewModel();
  const model = useGameModel();
  const {
    quizIndex,
    quizSelected,
    quizConfirmed,
    quizAnswers,
    quizCompleted,
    points,
    selectAnswer,
    confirmAnswer,
    rewardRedeemed,
  } = model;
  const quiz = gameRepository.getQuestions();
  const startQuiz = () => {
    model.startQuiz();
    navigate('quiz');
  };
  const nextQuestion = () => {
    if (model.nextQuestion()) navigate('quizResult');
  };
  const redeemReward = () => {
    if (model.redeemReward()) navigate('redeemed');
  };
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

  const names = gameRepository.getChallengeNames();
  const selectGameTab = (value: 'challenge' | 'rewards') => {
    if (value === 'challenge' && route.name === 'rewards') tab('game');
    else setGameTab(value);
  };
  const openChallenge = (index: number) => {
    if (index === 0) navigate(quizCompleted ? 'quizResult' : 'gameIntro');
    else notify('Thử thách này sẽ có trong bản tiếp theo.');
  };
  const continueChallenge = () => (quizCompleted ? navigate('quizResult') : startQuiz());
  const submitAnswer = () => (quizConfirmed ? nextQuestion() : confirmAnswer());

  return {
    tab,
    quiz,
    names,
    selectGameTab,
    openChallenge,
    continueChallenge,
    submitAnswer,

    redeemSelectedReward,
    route,
    navigate,
    back,
    quizIndex,
    quizSelected,
    quizConfirmed,
    quizAnswers,
    quizCompleted,
    points,
    selectAnswer,
    rewardRedeemed,
    notify,
    visibleGameTab,
    voucherFilter,
    setVoucherFilter,
    current,
    score,
    displayQuestion,
  };
}
