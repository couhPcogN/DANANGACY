import type { ImageSourcePropType } from 'react-native';

export type Place = {
  id: string;
  name: string;
  area: string;
  space: 'INDOOR' | 'OUTDOOR';
  category: 'Thiên nhiên' | 'Văn hóa' | 'Kiến trúc' | 'Lịch sử';
  characteristics: string[];
  image?: ImageSourcePropType;
  description: string;
  address: string;
};
