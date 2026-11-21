import { useEffect, useState } from 'react';
import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { notify } from '../../../shared/utils/notify';
import { useGameModel } from '../providers/GameProvider';
import { gameRepository } from '../repositories/gameRepository';
import { useAuthModel } from '../../auth/providers/AuthProvider';
import {
  gameService,
  buildQuizSubmissionPayload,
  findQuizForChallenge,
  convertBackendQuiz,
  type BackendQuiz,
  type BackendQuizSubmitResult,
  type DisplayQuizQuestion,
} from '../../../services/api/gameService';

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
    confirmAnswer: baseConfirmAnswer,
    rewardRedeemed,
    completionAwarded,
  } = model;

  const demoQuestions = gameRepository.getQuestions();
  const [backendQuiz, setBackendQuiz] = useState<BackendQuiz | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<DisplayQuizQuestion[]>(demoQuestions);
  const [selectedOptionsByQId, setSelectedOptionsByQId] = useState<Record<number, number>>({});
  const [backendResult, setBackendResult] = useState<BackendQuizSubmitResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (token) {
      setQuizLoading(true);
      gameService
        .fetchQuizzes()
        .then((quizzes) => {
          if (!mounted) return;
          const matched = findQuizForChallenge(quizzes, 'Hiện vật Chăm Pa');
          if (matched && matched.questions.length > 0) {
            setBackendQuiz(matched);
            setQuizError(null);
            if (route.name !== 'quiz') {
              setActiveQuestions(convertBackendQuiz(matched));
            }
          } else {
            setQuizError('Không tìm thấy bài trắc nghiệm phù hợp.');
          }
        })
        .catch(() => {
          if (mounted) setQuizError('Không thể tải bài trắc nghiệm từ máy chủ.');
        })
        .finally(() => {
          if (mounted) setQuizLoading(false);
        });
    } else {
      setBackendQuiz(null);
      if (route.name !== 'quiz') {
        setActiveQuestions(demoQuestions);
      }
    }
    return () => {
      mounted = false;
    };
  }, [token]);

  const quiz = activeQuestions;

  const startQuiz = () => {
    model.startQuiz();
    setBackendResult(null);
    setSelectedOptionsByQId({});
    if (token && backendQuiz) {
      setActiveQuestions(convertBackendQuiz(backendQuiz));
    } else {
      setActiveQuestions(demoQuestions);
    }
    navigate('quiz');
  };

  const confirmAnswer = () => {
    if (quizSelected !== null) {
      const currentQ = quiz[quizIndex];
      if (currentQ?.id && currentQ.options && currentQ.options[quizSelected]) {
        const chosenOptId = currentQ.options[quizSelected].id;
        setSelectedOptionsByQId((prev) => ({
          ...prev,
          [currentQ.id!]: chosenOptId,
        }));
      }
    }
    baseConfirmAnswer();
  };

  const nextQuestion = () => {
    const isFinished = model.nextQuestion();
    if (isFinished) {
      navigate('quizResult');
      if (token && backendQuiz) {
        setSubmitting(true);
        (async () => {
          try {
            const payload = buildQuizSubmissionPayload(backendQuiz, selectedOptionsByQId);
            if (payload.length === 0) {
              return;
            }
            const result = await gameService.submitQuiz(backendQuiz.id, payload, token);
            if (result) {
              setBackendResult(result);
              if (typeof result.balance_points === 'number') {
                (model as { setQuizResult?: (pts: number, awd: number) => void }).setQuizResult?.(
                  result.balance_points,
                  result.points_awarded,
                );
              }
            }
          } catch {
            // Error handled gracefully
          } finally {
            setSubmitting(false);
          }
        })();
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
  const current = quiz[quizIndex] || quiz[0] || demoQuestions[0];

  // Backend is authoritative for score when available
  const score = backendResult
    ? backendResult.correct_count
    : quizAnswers.filter((answer, index) => quiz[index] && answer === quiz[index].correct).length;

  const nextQuizIndex = quizAnswers.findIndex((answer) => answer === null);
  const displayQuestion = quizCompleted
    ? quiz.length
    : Math.min(quiz.length, (nextQuizIndex < 0 ? quiz.length - 1 : nextQuizIndex) + 1);

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

    // Expose backend synchronization state
    backendResult,
    submitting,
    quizLoading,
    quizError,
    isGuest: !token,
  };
}
