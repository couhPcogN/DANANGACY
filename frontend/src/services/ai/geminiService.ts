export interface GeminiResponse {
  success: boolean;
  text: string;
  source: 'gemini-3.8-flash' | 'local-fallback';
  errorDetails?: string;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

export async function generateGeminiContent(
  prompt: string,
  systemInstruction?: string,
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      text: getFallbackAnswer(prompt),
      source: 'local-fallback',
      errorDetails: 'Chưa cấu hình GEMINI_API_KEY trong môi trường.',
    };
  }

  const fullPrompt = systemInstruction
    ? `${systemInstruction}\n\nCâu hỏi/Yêu cầu: ${prompt}`
    : prompt;

  const payload = {
    contents: [
      {
        parts: [{ text: fullPrompt }],
      },
    ],
  };

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 402) {
      return {
        success: false,
        text: `${getFallbackAnswer(prompt)}\n\n*(Lưu ý: Gemini API key đã hết hạn mức credit thanh toán trên AI Studio, hệ thống đang dùng dữ liệu di sản địa phương)*`,
        source: 'local-fallback',
        errorDetails:
          'HTTP 402 Payment Required: Your prepayment credits are depleted on AI Studio.',
      };
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        text: getFallbackAnswer(prompt),
        source: 'local-fallback',
        errorDetails:
          (errJson as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (candidateText) {
      return {
        success: true,
        text: candidateText.trim(),
        source: 'gemini-3.8-flash',
      };
    }

    return {
      success: false,
      text: getFallbackAnswer(prompt),
      source: 'local-fallback',
    };
  } catch (error) {
    return {
      success: false,
      text: getFallbackAnswer(prompt),
      source: 'local-fallback',
      errorDetails: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function askGeminiHeritageGuide(
  placeName: string,
  placeSlug?: string,
): Promise<GeminiResponse> {
  const system =
    'Bạn là trợ lý AI chuyên gia du lịch & di sản văn hóa Đà Nẵng (DANANGACY). ' +
    'Hãy giới thiệu súc tích trong 2-3 câu về nét đặc sắc lịch sử, văn hóa và đưa ra 1 lời khuyên trải nghiệm thực tế.';
  const prompt = `Hãy thuyết minh và đưa ra lời khuyên hữu ích khi đến tham quan "${placeName}" tại Đà Nẵng.`;

  const res = await generateGeminiContent(prompt, system);
  if (!res.success && placeSlug && LOCAL_HERITAGE_KNOWLEDGE[placeSlug]) {
    res.text = LOCAL_HERITAGE_KNOWLEDGE[placeSlug];
  }
  return res;
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
