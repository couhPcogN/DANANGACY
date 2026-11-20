import type { AuthTokenResponse, AuthUser } from '../../features/auth/types';
import { API_BASE_URL } from '../../config/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Yêu cầu thất bại (mã ${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data?.detail)) {
        errorMessage = data.detail
          .map((d: { msg?: string }) => d.msg || 'Dữ liệu không hợp lệ')
          .join(', ');
      }
    } catch {
      // Dùng thông báo mặc định nếu không parse được JSON
    }
    throw new Error(errorMessage);
  }
  return res.json() as Promise<T>;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthTokenResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await handleResponse<AuthTokenResponse>(res);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes('fetch') || err.message.includes('Network'))
      ) {
        throw new Error(`Không thể kết nối đến máy chủ API (${API_BASE_URL}).`);
      }
      throw err;
    }
  },

  async register(email: string, password: string, displayName: string): Promise<AuthTokenResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName,
        }),
      });
      return await handleResponse<AuthTokenResponse>(res);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes('fetch') || err.message.includes('Network'))
      ) {
        throw new Error(`Không thể kết nối đến máy chủ API (${API_BASE_URL}).`);
      }
      throw err;
    }
  },

  async getMe(token: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await handleResponse<AuthUser>(res);
  },

  async updateProfile(displayName: string, token: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ display_name: displayName }),
    });
    return await handleResponse<AuthUser>(res);
  },
};
