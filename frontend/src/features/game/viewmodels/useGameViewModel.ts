import { useState } from 'react';
import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { notify } from '../../../shared/utils/notify';
import { useGameModel } from '../providers/GameProvider';
import { gameRepository } from '../repositories/gameRepository';
import { useAuthModel } from '../../auth/providers/AuthProvider';
import { gameService } from '../../../services/api/gameService';

export function useGameViewModel() {
  const { route, navigate, back, tab } = useNavigationViewModel();
  const { token } = useAuthModel();
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
    completionAwarded,
  } = model;
  const quiz = gameRepository.getQuestions();
  const startQuiz = () => {
    model.startQuiz();
    navigate('quiz');
  };
  const nextQuestion = () => {
    const isFinished = model.nextQuestion();
    if (isFinished) {
      navigate('quizResult');
      if (token) {
        // Sync to backend quiz 1
        const payload = quizAnswers.map((selected, qIdx) => ({
          question_id: qIdx + 1,
          selected_option_id: (selected ?? 0) + 1,
        }));
        gameService.submitQuiz(1, payload, token).catch(() => {});
      }
    }
  };
  const redeemReward = () => {
    if (model.redeemReward()) {
      navigate('redeemed');
      if (token) {
        gameService.claimVoucher(1, token).catch(() => {});
      }
    }
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
    if (index === 0) {
      if (quizCompleted) {
        model.acknowledgeCompletionAward();
        navigate('quizResult');
      } else navigate('gameIntro');
    } else notify('Thử thách này sẽ có trong bản tiếp theo.');
  };
  const continueChallenge = () => {
    if (quizCompleted) {
      model.acknowledgeCompletionAward();
      navigate('quizResult');
    } else startQuiz();
  };
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
    completionAwarded,
    notify,
    visibleGameTab,
    voucherFilter,
    setVoucherFilter,
    current,
    score,
    displayQuestion,
  };
}
