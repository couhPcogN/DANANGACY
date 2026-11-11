import { useState } from 'react';
import { useApp } from '../../../providers/AppProvider';

export function useProfileViewModel() {
  const app = useApp();
  const { route, back, navigate, name, email, phone, setName, setEmail, setPhone, favorites, toggleFavorite, trips, points, notify } = app;
  const [draftName, setDraftName] = useState(name);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftPhone, setDraftPhone] = useState(phone);

  const saveProfile = () => { if (!draftName.trim() || !draftEmail.includes('@')) return notify('Họ tên hoặc email không hợp lệ.'); setName(draftName.trim()); setEmail(draftEmail.trim()); setPhone(draftPhone.trim()); notify('Đã lưu thông tin hồ sơ.'); back(); };

  return { saveProfile, app, route, back, navigate, name, email, phone, setName, setEmail, setPhone, favorites, toggleFavorite, trips, points, notify, draftName, setDraftName, draftEmail, setDraftEmail, draftPhone, setDraftPhone };
}
