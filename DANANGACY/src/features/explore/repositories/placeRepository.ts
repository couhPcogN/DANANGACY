import { images } from '../../../config/images';
import type { Place } from '../types';

export const places: Place[] = [
  {
    id: 'cham',
    name: 'Bảo tàng Điêu khắc Chăm',
    area: 'Hải Châu · Trung tâm',
    category: 'Trong nhà',
    tags: 'Văn hóa · Bảo tàng',
    image: images.chamMuseum,
    address: '02 đường 2 Tháng 9, Đà Nẵng',
    description:
      'Khám phá các tác phẩm điêu khắc Chăm và những câu chuyện về nghệ thuật, tín ngưỡng qua bộ sưu tập hiện vật.',
  },
  {
    id: 'son-tra',
    name: 'Bán đảo Sơn Trà',
    area: 'Bán đảo Sơn Trà',
    category: 'Ngoài trời',
    tags: 'Thiên nhiên · Ven biển',
    image: images.sonTra,
    address: 'Bán đảo Sơn Trà, Đà Nẵng',
    description:
      'Không gian thiên nhiên ven biển với những điểm ngắm cảnh ngoạn mục. Khám phá cảnh quan Sơn Trà cùng hệ sinh thái của bán đảo.',
  },
  {
    id: 'cau-rong',
    name: 'Cầu Rồng',
    area: 'Bên sông Hàn',
    category: 'Ngoài trời',
    tags: 'Kiến trúc · Đô thị',
    image: images.dragonBridge,
    address: 'Sông Hàn, Đà Nẵng',
    description:
      'Biểu tượng kiến trúc đô thị bên sông Hàn, mang hình dáng rồng thời Lý hướng ra biển.',
  },
  {
    id: 'ngu-hanh-son',
    name: 'Ngũ Hành Sơn',
    area: 'Ngũ Hành Sơn',
    category: 'Ngoài trời',
    tags: 'Cảnh quan · Tâm linh',
    image: images.marbleMountains,
    address: 'Ngũ Hành Sơn, Đà Nẵng',
    description:
      'Quần thể núi đá, hang động và cảnh quan gắn với không gian tâm linh. Hành trình tham quan mở ra những góc nhìn về thiên nhiên và văn hóa.',
  },
  {
    id: 'bao-tang-dn',
    name: 'Bảo tàng Đà Nẵng',
    area: 'Văn hóa · Trung tâm',
    category: 'Trong nhà',
    tags: 'Văn hóa · Bảo tàng',
    image: images.daNangMuseum,
    address: '42–44 Bạch Đằng và 31 Trần Phú, Đà Nẵng',
    description: 'Tìm hiểu lịch sử, văn hóa và thành phố Đà Nẵng qua các trưng bày tại cơ sở mới.',
  },
];

export const getPlace = (id: string) => places.find((place) => place.id === id) ?? places[0];
