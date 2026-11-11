import type { Itinerary } from '../types';

export const defaultItinerary: Itinerary = {
  id: 'heritage-day',
  title: 'Một ngày di sản Đà Nẵng',
  date: '15/11/2026',
  duration: 1,
  pace: 'Thư thả',
  saved: false,
  stops: [
    { placeId: 'cham', start: '09:00', end: '10:30' },
    { placeId: 'son-tra', start: '14:00', end: '16:00' },
    { placeId: 'cau-rong', start: '17:00', end: '18:00' },
  ],
};

export const initialItinerary: Itinerary = {
  id: 'hoi-an',
  title: 'Hội An trong tôi',
  date: '19/11/2026',
  duration: 1,
  pace: 'Thư thả',
  saved: true,
  stops: [
    { placeId: 'chua-cau', start: '09:00', end: '10:30' },
    { placeId: 'tan-ky', start: '14:00', end: '15:30' },
    { placeId: 'hoai-river', start: '17:00', end: '18:30' },
  ],
};

export const hoiAnNames: Record<string, string> = {
  'chua-cau': 'Chùa Cầu',
  'tan-ky': 'Nhà cổ Tấn Ký',
  'hoai-river': 'Bờ sông Hoài',
};
