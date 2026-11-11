import type { QuizQuestion } from '../types';

export const quiz: QuizQuestion[] = [
  {
    question: 'Muốn biết tên một hiện vật, bạn nên làm gì?',
    answers: [
      'Đọc bảng thông tin bên cạnh',
      'Đoán theo kích thước',
      'Chỉ nhìn màu sắc',
      'Bỏ qua phần giới thiệu',
    ],
    correct: 0,
    explanation: 'Bảng thông tin giúp bạn hiểu đúng tên và ý nghĩa của hiện vật.',
  },
  {
    question: 'Bảo tàng Điêu khắc Chăm chủ yếu giới thiệu loại hình nghệ thuật nào?',
    answers: ['Đồ gốm hiện đại', 'Điêu khắc Chăm', 'Tranh sơn dầu châu Âu', 'Nghệ thuật in ấn'],
    correct: 1,
    explanation: 'Bảo tàng lưu giữ và giới thiệu nhiều tác phẩm điêu khắc Chăm.',
  },
  {
    question: 'Để hiểu thêm về hiện vật, bạn có thể hỏi ai?',
    answers: [
      'Người bán hàng bên ngoài',
      'Hướng dẫn viên bảo tàng',
      'Bất kỳ người qua đường',
      'Không cần hỏi ai',
    ],
    correct: 1,
    explanation: 'Hướng dẫn viên bảo tàng có thể giải thích bối cảnh và giá trị của hiện vật.',
  },
  {
    question: 'Khi ngắm hiện vật, bạn nên làm gì để bảo vệ tác phẩm?',
    answers: [
      'Chạm tay để cảm nhận',
      'Quan sát, không chạm tay',
      'Tựa vào hiện vật để chụp ảnh',
      'Di chuyển hiện vật cho dễ nhìn',
    ],
    correct: 1,
    explanation: 'Quan sát và không chạm tay giúp bảo vệ hiện vật.',
  },
  {
    question: 'Cách nào giúp chia sẻ di sản có trách nhiệm?',
    answers: [
      'Viết thêm chi tiết cho hấp dẫn',
      'Đăng tin chưa kiểm chứng',
      'Chia sẻ thông tin từ bảo tàng',
      'Bỏ qua nguồn thông tin',
    ],
    correct: 2,
    explanation: 'Chia sẻ thông tin đã được bảo tàng xác nhận để giữ tính chính xác.',
  },
];
