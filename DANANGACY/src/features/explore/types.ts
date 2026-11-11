import type { ImageSourcePropType } from 'react-native';

export type Place = {
  id: string;
  name: string;
  area: string;
  category: 'Trong nhà' | 'Ngoài trời';
  tags: string;
  image?: ImageSourcePropType;
  description: string;
  address: string;
};
