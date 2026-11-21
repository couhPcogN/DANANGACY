import { API_BASE_URL } from '../../config/api';

export type BackendItineraryStop = {
  place_id: string;
  day?: number;
  start: string;
  end: string;
};

export type BackendItineraryCreate = {
  title: string;
  date: string; // ISO YYYY-MM-DD
  duration?: number;
  pace?: 'Thư thả' | 'Cân bằng' | 'Năng động';
  stops: BackendItineraryStop[];
};

export type BackendItineraryUpdate = {
  title?: string;
  date?: string; // ISO YYYY-MM-DD
  duration?: number;
  pace?: 'Thư thả' | 'Cân bằng' | 'Năng động';
  stops?: BackendItineraryStop[];
  version: number; // MANDATORY on client to enforce optimistic locking
};

export type BackendItineraryRead = {
  id: number;
  title: string;
  date: string; // ISO YYYY-MM-DD
  duration?: number;
  pace?: 'Thư thả' | 'Cân bằng' | 'Năng động';
  stops: BackendItineraryStop[];
  version: number;
  created_at: string;
  updated_at: string;
};

export class ItineraryApiError extends Error {
  status?: number;
  detail?: string;

  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = 'ItineraryApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function extractErrorDetail(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.detail === 'string') {
      return data.detail;
    }
    if (data && Array.isArray(data.detail)) {
      return data.detail.map((item: { msg?: string }) => item.msg || '').join(', ');
    }
  } catch {
    // Ignore JSON parse failure on non-JSON response
  }
  return '';
}

export const itineraryApiService = {
  async fetchItineraries(token?: string): Promise<BackendItineraryRead[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/itineraries`, {
        headers: token ? { Authorization: `Bearer ${token.trim()}` } : {},
      });
      if (res.status === 401) {
        const detail = await extractErrorDetail(res);
        throw new ItineraryApiError(
          detail || 'Yêu cầu đăng nhập hoặc phiên đăng nhập đã hết hạn.',
          401,
          detail,
        );
      }
      if (!res.ok) {
        const detail = await extractErrorDetail(res);
        throw new ItineraryApiError(
          detail || `Lỗi tải danh sách lịch trình (HTTP ${res.status}).`,
          res.status,
          detail,
        );
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new ItineraryApiError('Dữ liệu danh sách lịch trình từ máy chủ không hợp lệ.', 502);
      }
      for (const item of data) {
        if (
          !item ||
          typeof item.id !== 'number' ||
          !Number.isInteger(item.id) ||
          item.id <= 0 ||
          typeof item.version !== 'number' ||
          !Number.isInteger(item.version) ||
          item.version < 1
        ) {
          throw new ItineraryApiError('Bản ghi lịch trình từ máy chủ không đúng cấu trúc.', 502);
        }
      }
      return data;
    } catch (error) {
      if (error instanceof ItineraryApiError) throw error;
      throw new ItineraryApiError('Lỗi kết nối mạng khi tải danh sách lịch trình.', 0);
    }
  },

  async getItinerary(id: number, token?: string): Promise<BackendItineraryRead | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ItineraryApiError('Mã lịch trình máy chủ không hợp lệ.', 400);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/itineraries/${id}`, {
        headers: token ? { Authorization: `Bearer ${token.trim()}` } : {},
      });
      if (res.status === 404) {
        return null;
      }
      if (res.status === 401) {
        const detail = await extractErrorDetail(res);
        throw new ItineraryApiError(
          detail || 'Yêu cầu đăng nhập hoặc phiên đăng nhập đã hết hạn.',
          401,
          detail,
        );
      }
      if (!res.ok) {
        const detail = await extractErrorDetail(res);
        throw new ItineraryApiError(
          detail || `Lỗi lấy thông tin lịch trình (HTTP ${res.status}).`,
          res.status,
          detail,
        );
      }
      return await res.json();
    } catch (error) {
      if (error instanceof ItineraryApiError) throw error;
      throw new ItineraryApiError('Lỗi kết nối mạng khi lấy thông tin lịch trình.', 0);
    }
  },

  async createItinerary(
    payload: BackendItineraryCreate,
    token?: string,
  ): Promise<BackendItineraryRead> {
    if (!token || !token.trim()) {
      throw new ItineraryApiError('Yêu cầu token xác thực để tạo lịch trình trên máy chủ.', 401);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/itineraries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        return await res.json();
      }

      const detail = await extractErrorDetail(res);
      if (res.status === 401) {
        throw new ItineraryApiError(
          detail || 'Yêu cầu đăng nhập để thực hiện thao tác này.',
          401,
          detail,
        );
      }
      if (res.status === 422) {
        throw new ItineraryApiError(
          detail || 'Dữ liệu lịch trình không hợp lệ theo quy định máy chủ.',
          422,
          detail,
        );
      }
      throw new ItineraryApiError(
        detail || `Lỗi tạo lịch trình trên máy chủ (HTTP ${res.status}).`,
        res.status,
        detail,
      );
    } catch (error) {
      if (error instanceof ItineraryApiError) throw error;
      throw new ItineraryApiError('Lỗi kết nối mạng khi tạo lịch trình.', 0);
    }
  },

  async updateItinerary(
    id: number,
    payload: BackendItineraryUpdate,
    token?: string,
  ): Promise<BackendItineraryRead> {
    if (!token || !token.trim()) {
      throw new ItineraryApiError(
        'Yêu cầu token xác thực để cập nhật lịch trình trên máy chủ.',
        401,
      );
    }
    if (!Number.isInteger(id) || id <= 0) {
      throw new ItineraryApiError('Mã lịch trình máy chủ (id) không hợp lệ.', 400);
    }
    if (
      payload.version === undefined ||
      payload.version === null ||
      typeof payload.version !== 'number' ||
      !Number.isInteger(payload.version) ||
      payload.version < 1
    ) {
      throw new ItineraryApiError(
        'Bắt buộc phải có phiên bản hợp lệ (version >= 1) để cập nhật lịch trình.',
        400,
      );
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/itineraries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 200) {
        return await res.json();
      }

      const detail = await extractErrorDetail(res);
      if (res.status === 409) {
        throw new ItineraryApiError(
          detail || 'Lịch trình đã thay đổi trên máy chủ. Hãy tải lại trước khi sửa.',
          409,
          detail,
        );
      }
      if (res.status === 401) {
        throw new ItineraryApiError(
          detail || 'Yêu cầu đăng nhập để thực hiện thao tác này.',
          401,
          detail,
        );
      }
      if (res.status === 404) {
        throw new ItineraryApiError(
          detail || 'Không tìm thấy lịch trình cần cập nhật trên máy chủ.',
          404,
          detail,
        );
      }
      if (res.status === 422) {
        throw new ItineraryApiError(detail || 'Dữ liệu cập nhật không hợp lệ.', 422, detail);
      }
      throw new ItineraryApiError(
        detail || `Lỗi cập nhật lịch trình (HTTP ${res.status}).`,
        res.status,
        detail,
      );
    } catch (error) {
      if (error instanceof ItineraryApiError) throw error;
      throw new ItineraryApiError('Lỗi kết nối mạng khi cập nhật lịch trình.', 0);
    }
  },

  async deleteItinerary(id: number | string, token?: string): Promise<boolean> {
    if (!token || !token.trim()) {
      throw new ItineraryApiError('Yêu cầu token xác thực để xóa lịch trình trên máy chủ.', 401);
    }
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
      throw new ItineraryApiError('Mã lịch trình máy chủ không hợp lệ.', 400);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/itineraries/${numId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      if (res.status === 204) {
        // Quan trọng: Phản hồi 204 có thân rỗng b"", tuyệt đối không parse res.json()
        return true;
      }

      const detail = await extractErrorDetail(res);
      if (res.status === 404) {
        throw new ItineraryApiError(
          detail || 'Không tìm thấy lịch trình cần xóa trên máy chủ.',
          404,
          detail,
        );
      }
      if (res.status === 401) {
        throw new ItineraryApiError(
          detail || 'Yêu cầu đăng nhập để thực hiện thao tác này.',
          401,
          detail,
        );
      }
      throw new ItineraryApiError(
        detail || `Lỗi xóa lịch trình (HTTP ${res.status}).`,
        res.status,
        detail,
      );
    } catch (error) {
      if (error instanceof ItineraryApiError) throw error;
      throw new ItineraryApiError('Lỗi kết nối mạng khi xóa lịch trình.', 0);
    }
  },
};

export * from './itineraryMapping';
