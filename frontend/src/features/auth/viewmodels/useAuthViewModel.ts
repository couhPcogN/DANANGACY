import { useState } from 'react';
import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { notify } from '../../../shared/utils/notify';
import { useAuthModel } from '../providers/AuthProvider';
import { useProfileModel } from '../../profile/providers/ProfileProvider';
import { authService } from '../../../services/api/authService';

export function useAuthViewModel() {
  const { route, navigate, back, tab, canGoBack } = useNavigationViewModel();
  const handleBack = () => {
    if (canGoBack()) {
      back();
    } else {
      tab('home');
    }
  };
  const auth = useAuthModel();
  const profile = useProfileModel();

  const [fullName, setFullName] = useState(profile.name || 'Người dùng Đà Nẵng');
  const [email, setEmail] = useState(
    profile.email?.includes('@') ? profile.email : 'han_danang@danangacy.vn',
  );
  const [password, setPassword] = useState('SecurePassword123');
  const [confirm, setConfirm] = useState('SecurePassword123');
  const [code, setCode] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitLogin = async () => {
    if (!email.includes('@') || password.length < 8) {
      notify('Vui lòng nhập email hợp lệ và mật khẩu ít nhất 8 ký tự.');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.login(email.trim(), password);
      auth.setAuthenticated(result.access_token, result.user);
      profile.updateProfile({
        name: result.user.display_name,
        email: result.user.email,
      });
      notify(`Đăng nhập thành công! Chào mừng ${result.user.display_name}`);
      tab('home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập không thành công';
      notify(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async () => {
    if (!fullName.trim() || !email.includes('@') || password.length < 8 || password !== confirm) {
      notify('Kiểm tra họ tên, email và hai mật khẩu trước khi đăng ký.');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.register(email.trim(), password, fullName.trim());
      auth.setAuthenticated(result.access_token, result.user);
      profile.updateProfile({
        name: result.user.display_name,
        email: result.user.email,
      });
      notify(`Đăng ký thành công! Chào mừng ${result.user.display_name}`);
      tab('home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng ký không thành công';
      notify(msg);
    } finally {
      setLoading(false);
    }
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
    loading,
    submitLogin,
    submitRegistration,
    requestResetCode,
    verifyCode,
    submitPasswordReset,
    route,
    navigate,
    back: handleBack,
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
