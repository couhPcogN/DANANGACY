import { useState } from 'react';
import { useNavigationViewModel } from '../../../navigation/NavigationProvider';
import { notify } from '../../../utils/notify';
import { useAuthModel } from '../providers/AuthProvider';
import { useProfileModel } from '../../profile/providers/ProfileProvider';

export function useAuthViewModel() {
  const { route, navigate, back, tab } = useNavigationViewModel();
  const auth = useAuthModel();
  const profile = useProfileModel();
  const login = () => {
    auth.login();
    tab('home');
  };
  const [fullName, setFullName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('12345678');
  const [confirm, setConfirm] = useState('12345678');
  const [code, setCode] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  const submitLogin = () =>
    email.includes('@') && password.length >= 8
      ? login()
      : notify('Vui lòng nhập email hợp lệ và mật khẩu ít nhất 8 ký tự.');
  const submitRegistration = () => {
    if (!fullName.trim() || !email.includes('@') || password.length < 8 || password !== confirm)
      return notify('Kiểm tra họ tên, email và hai mật khẩu trước khi đăng ký.');
    profile.updateProfile({ name: fullName.trim(), email: email.trim() });
    login();
  };
  const requestResetCode = () =>
    email.includes('@') ? navigate('verify') : notify('Vui lòng nhập email hợp lệ.');
  const verifyCode = () =>
    code.length === 6 ? navigate('reset') : notify('Mã xác nhận gồm 6 chữ số.');
  const submitPasswordReset = () =>
    password.length >= 8 && password === confirm
      ? (notify('Đã đặt lại mật khẩu trong bản demo.'), navigate('login'))
      : notify('Hai mật khẩu chưa trùng khớp hoặc quá ngắn.');

  return {
    tab,

    submitLogin,
    submitRegistration,
    requestResetCode,
    verifyCode,
    submitPasswordReset,
    route,
    navigate,
    back,
    notify,
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirm,
    setConfirm,
    code,
    setCode,
    showPassword,
    setShowPassword,
  };
}
