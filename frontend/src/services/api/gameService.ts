const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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
