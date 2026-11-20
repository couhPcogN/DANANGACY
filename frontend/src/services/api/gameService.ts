import { API_BASE_URL } from '../../config/api';

export type BackendQuiz = {
  id: number;
  destination_id: number;
  title: string;
  description: string | null;
  pass_score: number;
  reward_points: number;
  questions: {
    id: number;
    question_text: string;
    position: number;
    explanation: string | null;
    options: {
      id: number;
      option_text: string;
      position: number;
    }[];
  }[];
};

export type BackendQuizSubmitResult = {
  attempt_id: number;
  quiz_id: number;
  correct_count: number;
  total_questions: number;
  passed: boolean;
  points_awarded: number;
  balance_points: number;
  message: string;
};

export type BackendVoucherOffer = {
  id: number;
  title: string;
  description: string | null;
  merchant_name: string | null;
  points_cost: number;
  total_stock: number;
  remaining_stock: number;
  status: string;
};

export type BackendVoucherClaim = {
  id: number;
  offer_id: number;
  points_spent: number;
  voucher_code: string;
  status: string;
  issued_at: string;
  expires_at: string;
};

export type DisplayQuizQuestion = {
  id?: number;
  question: string;
  answers: string[];
  options?: { id: number; text: string; position: number }[];
  correct: number;
  explanation: string;
};

export function convertBackendQuiz(bq: BackendQuiz): DisplayQuizQuestion[] {
  return bq.questions.map((q) => ({
    id: q.id,
    question: q.question_text,
    answers: q.options.map((opt) => opt.option_text),
    options: q.options.map((opt) => ({
      id: opt.id,
      text: opt.option_text,
      position: opt.position,
    })),
    correct: -1, // Server-evaluated: client does not infer answers from demo data
    explanation: q.explanation || '',
  }));
}

export function findQuizForChallenge(
  quizzes: BackendQuiz[],
  challengeTitle: string = 'Hiện vật Chăm Pa',
): BackendQuiz | null {
  if (!Array.isArray(quizzes) || quizzes.length === 0) return null;
  const match = quizzes.find(
    (q) => q.title.trim().toLowerCase() === challengeTitle.trim().toLowerCase(),
  );
  if (match) return match;
  if (quizzes.length === 1) return quizzes[0];
  return null;
}

export function buildQuizSubmissionPayload(
  backendQuiz: BackendQuiz,
  quizAnswers: (number | null)[] | Record<number, number>,
): { question_id: number; selected_option_id: number }[] {
  if (!Array.isArray(quizAnswers)) {
    // Map of question_id -> selected_option_id
    return backendQuiz.questions
      .map((q) => {
        const selectedOptId = quizAnswers[q.id];
        if (typeof selectedOptId !== 'number') return null;
        const matched = q.options.find((opt) => opt.id === selectedOptId);
        if (!matched) return null;
        return {
          question_id: q.id,
          selected_option_id: selectedOptId,
        };
      })
      .filter((item): item is { question_id: number; selected_option_id: number } => item !== null);
  }

  // Array of option indices/positions
  return backendQuiz.questions
    .map((q, qIdx) => {
      const selectedPosition = quizAnswers[qIdx];
      if (selectedPosition === null || selectedPosition === undefined) {
        return null;
      }
      const matchedOpt =
        q.options.find((opt) => opt.position === selectedPosition) || q.options[selectedPosition];
      if (!matchedOpt) return null;
      return {
        question_id: q.id,
        selected_option_id: matchedOpt.id,
      };
    })
    .filter((item): item is { question_id: number; selected_option_id: number } => item !== null);
}

export const gameService = {
  async fetchQuizzes(): Promise<BackendQuiz[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/quizzes`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async submitQuiz(
    quizId: number,
    answers: { question_id: number; selected_option_id: number }[],
    token?: string,
  ): Promise<BackendQuizSubmitResult | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async fetchVouchers(): Promise<BackendVoucherOffer[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vouchers`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async claimVoucher(offerId: number, token?: string): Promise<BackendVoucherClaim | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vouchers/${offerId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async fetchWallet(token?: string): Promise<{ balance_points: number } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wallet/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
