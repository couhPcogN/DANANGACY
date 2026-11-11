import { useState } from 'react';
import type { RouteName } from '../../../navigation/types';
import { quiz } from '../repositories/gameRepository';

export function useGameState(navigate: (name: RouteName, id?: string) => void) {
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(() => [quiz[0].correct, ...Array(quiz.length - 1).fill(null)]);
  const [quizConfirmed, setQuizConfirmed] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [points, setPoints] = useState(120);
  const [rewardRedeemed, setRewardRedeemed] = useState(false);
  const startQuiz = () => { const next = quizAnswers.findIndex((answer) => answer === null); setQuizIndex(next < 0 ? 0 : next); setQuizSelected(null); setQuizConfirmed(false); navigate('quiz'); };
  const selectAnswer = (index: number) => { if (!quizConfirmed) setQuizSelected(index); };
  const confirmAnswer = () => {
    if (quizSelected === null) return;
    setQuizAnswers((s) => s.map((v, i) => i === quizIndex ? quizSelected : v));
    setQuizConfirmed(true);
  };
  const nextQuestion = () => {
    if (quizIndex < quiz.length - 1) {
      setQuizIndex((s) => s + 1); setQuizSelected(null); setQuizConfirmed(false);
    } else {
      if (!quizCompleted) { setPoints((s) => s + 50); setQuizCompleted(true); }
      navigate('quizResult');
    }
  };
  const redeemReward = () => {
    if (rewardRedeemed || points < 100) return;
    setPoints((s) => s - 100); setRewardRedeemed(true); navigate('redeemed');
  };

  return { quizIndex, quizSelected, quizAnswers, setQuizAnswers, quizConfirmed, quizCompleted, setQuizCompleted, points, setPoints, startQuiz, selectAnswer, confirmAnswer, nextQuestion, rewardRedeemed, setRewardRedeemed, redeemReward };
}
