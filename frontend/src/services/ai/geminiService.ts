import { API_BASE_URL } from '../../config/api';

export interface GeminiResponse {
  success: boolean;
  text: string;
  source: 'gemini-3.8-flash' | 'local-fallback';
  errorDetails?: string;
}

const LOCAL_HERITAGE_KNOWLEDGE: Record<string, string> = {
  cham: 'Bảo tàng Điêu khắc Chăm Đà Nẵng thành lập năm 1915, sở hữu bộ sưu tập hiện vật điêu khắc Champa quy mô và giá trị nhất thế giới. Lời khuyên: Tham quan gian phòng Trà Kiệu, Mỹ Sơn và Đồng Dương.',
  'son-tra':
    'Bán đảo Sơn Trà được mệnh danh là "lá phổi xanh" của Đà Nẵng với hệ sinh thái đa dạng, nơi cư trú của loài Voọc chà và chân nâu quý hiếm. Điểm dừng nổi bật: Chùa Linh Ứng, Đỉnh Bàn Cờ, Cây đa ngàn năm.',
  'ngu-hanh-son':
    'Danh thắng Ngũ Hành Sơn gồm 5 ngọn núi đá vôi: Kim, Mộc, Thủy, Hỏa, Thổ mang giá trị tâm linh và lịch sử sâu sắc. Đừng bỏ lỡ Động Huyền Không và Chùa Tam Thai.',
  'cau-rong':
    'Cầu Rồng biểu tượng kiến trúc độc đáo của Đà Nẵng bắc qua sông Hàn, có khả năng phun lửa và phun nước vào lúc 21:00 thứ Bảy và Chủ Nhật hàng tuần.',
  'bao-tang-dn':
    'Bảo tàng Đà Nẵng lưu giữ hơn 2.500 hiện vật, tài liệu về lịch sử tự nhiên, xã hội và văn hóa của vùng đất Đà Nẵng qua các thời kỳ phát triển.',
};

function getFallbackAnswer(query: string): string {
  const lower = query.toLowerCase();
  for (const [key, val] of Object.entries(LOCAL_HERITAGE_KNOWLEDGE)) {
    if (
      lower.includes(key) ||
      (key === 'cham' && lower.includes('chăm')) ||
      (key === 'son-tra' && lower.includes('sơn trà'))
    ) {
      return val;
    }
  }
  return 'Đà Nẵng là thành phố di sản và du lịch tuyệt đẹp với các điểm đến nổi tiếng như Bán đảo Sơn Trà, Ngũ Hành Sơn, Cầu Rồng và Bảo tàng Điêu khắc Chăm. Khi đi du lịch, bạn nên mang theo ô/nón và kiểm tra tình hình thời tiết trước khi di chuyển.';
}

export async function generateGeminiContent(
  prompt: string,
  systemInstruction?: string,
): Promise<GeminiResponse> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    return {
      success: false,
      text: getFallbackAnswer(''),
      source: 'local-fallback',
      errorDetails: 'Nội dung yêu cầu không được để trống.',
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: cleanPrompt.slice(0, 2000),
        system_instruction: systemInstruction ? systemInstruction.slice(0, 1000) : null,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        text: getFallbackAnswer(cleanPrompt),
        source: 'local-fallback',
        errorDetails:
          (errJson as { detail?: string; message?: string })?.detail ||
          (errJson as { message?: string })?.message ||
          `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      success: Boolean(data.success),
      text: data.text ? data.text.trim() : getFallbackAnswer(cleanPrompt),
      source: data.source === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'local-fallback',
      errorDetails: data.message || undefined,
    };
  } catch (error) {
    return {
      success: false,
      text: getFallbackAnswer(cleanPrompt),
      source: 'local-fallback',
      errorDetails: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function askGeminiHeritageGuide(
  placeName: string,
  placeSlug?: string,
): Promise<GeminiResponse> {
  const fallbackText =
    (placeSlug && LOCAL_HERITAGE_KNOWLEDGE[placeSlug]) || getFallbackAnswer(placeName);

  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/heritage-guide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination_name: placeName,
        slug: placeSlug || null,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        text: fallbackText,
        source: 'local-fallback',
        errorDetails:
          (errJson as { detail?: string; message?: string })?.detail ||
          (errJson as { message?: string })?.message ||
          `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    if (!data.success && placeSlug && LOCAL_HERITAGE_KNOWLEDGE[placeSlug]) {
      return {
        success: false,
        text: LOCAL_HERITAGE_KNOWLEDGE[placeSlug],
        source: 'local-fallback',
        errorDetails: data.message || undefined,
      };
    }

    return {
      success: Boolean(data.success),
      text: (data.text || fallbackText).trim(),
      source: data.source === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'local-fallback',
      errorDetails: data.message || undefined,
    };
  } catch (error) {
    return {
      success: false,
      text: fallbackText,
      source: 'local-fallback',
      errorDetails: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function askGeminiWeatherAdvice(
  weatherText: string,
  temp: number,
  isRaining: boolean,
): Promise<GeminiResponse> {
  const system =
    'Bạn là trợ lý điều hướng du lịch Đà Nẵng DANANGACY. Đưa ra 1-2 câu lời khuyên ngắn gọn về trang phục hoặc lựa chọn điểm đến phù hợp với thời tiết.';
  const prompt = `Thời tiết Đà Nẵng hiện tại là ${temp}°C, ${weatherText}${isRaining ? ', có khả năng mưa' : ''}. Du khách nên lưu ý điều gì?`;

  return generateGeminiContent(prompt, system);
}
