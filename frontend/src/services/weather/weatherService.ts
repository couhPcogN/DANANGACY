export interface WeatherHourlyItem {
  time: string;
  temp: number;
  weatherCode: number;
  icon: string;
  label: string;
  rainProbability: number;
}

export interface DaNangWeather {
  temperature: number;
  conditionText: string;
  weatherCode: number;
  isRaining: boolean;
  rainProbabilityMax: number;
  hourly: WeatherHourlyItem[];
  updatedAt: string;
}

const DA_NANG_COORDS = {
  latitude: 16.0544,
  longitude: 108.2022,
};

const DEFAULT_WEATHER: DaNangWeather = {
  temperature: 28,
  conditionText: 'Nắng nhẹ',
  weatherCode: 1,
  isRaining: false,
  rainProbabilityMax: 20,
  hourly: [
    {
      time: '14:00',
      temp: 31,
      weatherCode: 1,
      icon: '☼',
      label: '14:00  ☼ 31°',
      rainProbability: 15,
    },
    {
      time: '16:00',
      temp: 30,
      weatherCode: 2,
      icon: '☼',
      label: '16:00  ☼ 30°',
      rainProbability: 20,
    },
    {
      time: '18:00',
      temp: 27,
      weatherCode: 61,
      icon: '☂',
      label: '18:00  ☂ 27°',
      rainProbability: 70,
    },
  ],
  updatedAt: new Date().toISOString(),
};

export function interpretWeatherCode(code: number): {
  text: string;
  icon: string;
  isRain: boolean;
} {
  if (code === 0) return { text: 'Quang đãng', icon: '☼', isRain: false };
  if (code >= 1 && code <= 3) return { text: 'Nắng nhẹ', icon: '☼', isRain: false };
  if (code === 45 || code === 48) return { text: 'Có sương mù', icon: '☁', isRain: false };
  if (code >= 51 && code <= 57) return { text: 'Mưa phùn', icon: '☂', isRain: true };
  if (code >= 61 && code <= 67) return { text: 'Mưa rào', icon: '☂', isRain: true };
  if (code >= 71 && code <= 77) return { text: 'Thời tiết lạnh', icon: '☁', isRain: false };
  if (code >= 80 && code <= 82) return { text: 'Mưa rào lớn', icon: '☂', isRain: true };
  if (code >= 95) return { text: 'Có dông sét', icon: '⚡', isRain: true };
  return { text: 'Có mây', icon: '⛅', isRain: false };
}

export async function fetchDaNangWeather(): Promise<DaNangWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${DA_NANG_COORDS.latitude}&longitude=${DA_NANG_COORDS.longitude}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&timezone=Asia%2FBangkok`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return DEFAULT_WEATHER;
    }

    const data = await response.json();
    const current = data.current_weather;
    const hourly = data.hourly;

    if (!current || !hourly) {
      return DEFAULT_WEATHER;
    }

    const currentCode = Math.round(current.weathercode ?? 1);
    const { text: conditionText, isRain } = interpretWeatherCode(currentCode);
    const currentTemp = Math.round(current.temperature ?? 28);

    const nowHour = new Date().getHours();
    const targetHours = [
      Math.max(nowHour + 1, 14) % 24,
      Math.max(nowHour + 3, 16) % 24,
      Math.max(nowHour + 5, 18) % 24,
    ];

    const hourlyTimes: string[] = hourly.time || [];
    const hourlyTemps: number[] = hourly.temperature_2m || [];
    const hourlyCodes: number[] = hourly.weathercode || [];
    const hourlyProbs: number[] = hourly.precipitation_probability || [];

    let maxRainProb = 0;
    const selectedHourly: WeatherHourlyItem[] = targetHours.map((targetH) => {
      const idx = hourlyTimes.findIndex((t: string) => {
        const h = parseInt(t.slice(11, 13), 10);
        return h === targetH;
      });

      const slotTemp = idx >= 0 ? Math.round(hourlyTemps[idx]) : 30;
      const slotCode = idx >= 0 ? Math.round(hourlyCodes[idx]) : 1;
      const slotProb = idx >= 0 ? Math.round(hourlyProbs[idx] ?? 0) : 10;
      if (slotProb > maxRainProb) maxRainProb = slotProb;

      const { icon } = interpretWeatherCode(slotCode);
      const timeStr = `${String(targetH).padStart(2, '0')}:00`;

      return {
        time: timeStr,
        temp: slotTemp,
        weatherCode: slotCode,
        icon,
        label: `${timeStr}  ${icon} ${slotTemp}°`,
        rainProbability: slotProb,
      };
    });

    return {
      temperature: currentTemp,
      conditionText,
      weatherCode: currentCode,
      isRaining: isRain || maxRainProb >= 50,
      rainProbabilityMax: maxRainProb,
      hourly: selectedHourly,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return DEFAULT_WEATHER;
  }
}
