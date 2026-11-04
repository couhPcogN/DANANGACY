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

export const images = {
  daNang: require('../assets/images/asset-767638f9cfe9.jpg'),
  chamMuseum: require('../assets/images/asset-d2086cd1b860.jpg'),
  sonTra: require('../assets/images/asset-92a5828ee3ad.jpg'),
  dragonBridge: require('../assets/images/asset-1544b7b32269.jpg'),
  marbleMountains: require('../assets/images/asset-87f5109464f0.jpg'),
  daNangMuseum: require('../assets/images/asset-3b59e2b537ce.jpg'),
  hoiAn: require('../assets/images/asset-0195e69a627e.jpg'),
  chamArtifact: require('../assets/images/asset-6b99d91a985a.png'),
  google: require('../assets/images/asset-d1ce9c2af0b1.png'),
};

export const places: Place[] = [
  { id: 'cham', name: 'Bảo tàng Điêu khắc Chăm', area: 'Hải Châu · Trung tâm', category: 'Trong nhà', tags: 'Văn hóa · Bảo tàng', image: images.chamMuseum, address: '02 đường 2 Tháng 9, Đà Nẵng', description: 'Khám phá các tác phẩm điêu khắc Chăm và những câu chuyện về nghệ thuật, tín ngưỡng qua bộ sưu tập hiện vật.' },
  { id: 'son-tra', name: 'Bán đảo Sơn Trà', area: 'Bán đảo Sơn Trà', category: 'Ngoài trời', tags: 'Thiên nhiên · Ven biển', image: images.sonTra, address: 'Bán đảo Sơn Trà, Đà Nẵng', description: 'Không gian thiên nhiên ven biển với những điểm ngắm cảnh ngoạn mục. Khám phá cảnh quan Sơn Trà cùng hệ sinh thái của bán đảo.' },
  { id: 'cau-rong', name: 'Cầu Rồng', area: 'Bên sông Hàn', category: 'Ngoài trời', tags: 'Kiến trúc · Đô thị', image: images.dragonBridge, address: 'Sông Hàn, Đà Nẵng', description: 'Biểu tượng kiến trúc đô thị bên sông Hàn, mang hình dáng rồng thời Lý hướng ra biển.' },
  { id: 'ngu-hanh-son', name: 'Ngũ Hành Sơn', area: 'Ngũ Hành Sơn', category: 'Ngoài trời', tags: 'Cảnh quan · Tâm linh', image: images.marbleMountains, address: 'Ngũ Hành Sơn, Đà Nẵng', description: 'Quần thể núi đá, hang động và cảnh quan gắn với không gian tâm linh. Hành trình tham quan mở ra những góc nhìn về thiên nhiên và văn hóa.' },
  { id: 'bao-tang-dn', name: 'Bảo tàng Đà Nẵng', area: 'Văn hóa · Trung tâm', category: 'Trong nhà', tags: 'Văn hóa · Bảo tàng', image: images.daNangMuseum, address: '42–44 Bạch Đằng và 31 Trần Phú, Đà Nẵng', description: 'Tìm hiểu lịch sử, văn hóa và thành phố Đà Nẵng qua các trưng bày tại cơ sở mới.' },
];

export const getPlace = (id: string) => places.find((place) => place.id === id) ?? places[0];

export type Stop = { placeId: string; start: string; end: string };
export type Trip = { id: string; title: string; date: string; duration: number; pace: string; stops: Stop[]; saved: boolean };

export const defaultTrip: Trip = {
  id: 'heritage-day', title: 'Một ngày di sản Đà Nẵng', date: '15/11/2026', duration: 1, pace: 'Thư thả', saved: false,
  stops: [
    { placeId: 'cham', start: '09:00', end: '10:30' },
    { placeId: 'son-tra', start: '14:00', end: '16:00' },
    { placeId: 'cau-rong', start: '17:00', end: '18:00' },
  ],
};

export const initialTrip: Trip = {
  id: 'hoi-an', title: 'Hội An trong tôi', date: '19/11/2026', duration: 1, pace: 'Thư thả', saved: true,
  stops: [
    { placeId: 'chua-cau', start: '09:00', end: '10:30' },
    { placeId: 'tan-ky', start: '14:00', end: '15:30' },
    { placeId: 'hoai-river', start: '17:00', end: '18:30' },
  ],
};

export const hoiAnNames: Record<string, string> = { 'chua-cau': 'Chùa Cầu', 'tan-ky': 'Nhà cổ Tấn Ký', 'hoai-river': 'Bờ sông Hoài' };

export type QuizQuestion = { question: string; answers: string[]; correct: number; explanation: string };
export const quiz: QuizQuestion[] = [
  { question: 'Muốn biết tên một hiện vật, bạn nên làm gì?', answers: ['Đọc bảng thông tin bên cạnh', 'Đoán theo kích thước', 'Chỉ nhìn màu sắc', 'Bỏ qua phần giới thiệu'], correct: 0, explanation: 'Bảng thông tin giúp bạn hiểu đúng tên và ý nghĩa của hiện vật.' },
  { question: 'Bảo tàng Điêu khắc Chăm chủ yếu giới thiệu loại hình nghệ thuật nào?', answers: ['Đồ gốm hiện đại', 'Điêu khắc Chăm', 'Tranh sơn dầu châu Âu', 'Nghệ thuật in ấn'], correct: 1, explanation: 'Bảo tàng lưu giữ và giới thiệu nhiều tác phẩm điêu khắc Chăm.' },
  { question: 'Để hiểu thêm về hiện vật, bạn có thể hỏi ai?', answers: ['Người bán hàng bên ngoài', 'Hướng dẫn viên bảo tàng', 'Bất kỳ người qua đường', 'Không cần hỏi ai'], correct: 1, explanation: 'Hướng dẫn viên bảo tàng có thể giải thích bối cảnh và giá trị của hiện vật.' },
  { question: 'Khi ngắm hiện vật, bạn nên làm gì để bảo vệ tác phẩm?', answers: ['Chạm tay để cảm nhận', 'Quan sát, không chạm tay', 'Tựa vào hiện vật để chụp ảnh', 'Di chuyển hiện vật cho dễ nhìn'], correct: 1, explanation: 'Quan sát và không chạm tay giúp bảo vệ hiện vật.' },
  { question: 'Cách nào giúp chia sẻ di sản có trách nhiệm?', answers: ['Viết thêm chi tiết cho hấp dẫn', 'Đăng tin chưa kiểm chứng', 'Chia sẻ thông tin từ bảo tàng', 'Bỏ qua nguồn thông tin'], correct: 2, explanation: 'Chia sẻ thông tin đã được bảo tàng xác nhận để giữ tính chính xác.' },
];
