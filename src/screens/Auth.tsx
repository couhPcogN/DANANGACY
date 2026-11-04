import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { images } from '../data';
import { useApp } from '../state';
import { colors } from '../theme';
import { Button, Card, Field, Header, InfoBanner, Label, PlacePhoto, Screen } from '../ui';

export function AuthScreen() {
  const app = useApp();
  const { route, navigate, back, login, notify } = app;
  const [fullName, setFullName] = useState(app.name);
  const [email, setEmail] = useState(app.email);
  const [password, setPassword] = useState('12345678');
  const [confirm, setConfirm] = useState('12345678');
  const [code, setCode] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  if (route.name === 'welcome') return <Screen bottom={<View style={{ gap: 8 }}><Button title="Bắt đầu" onPress={() => navigate('login')} /><Button title="Khám phá ngay" kind="secondary" onPress={() => app.tab('explore')} /></View>}>
    <Label size={21} weight="bold" style={{ marginTop: 8, marginBottom: 24 }}>DANANGACY</Label>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 9 }}><Ionicons name="business-outline" size={22} color={colors.primaryDark} /><Label size={12} weight="bold" color={colors.primaryDark}>DI SẢN ĐÀ NẴNG TRONG TAY BẠN</Label></View>
    <PlacePhoto source={images.daNang} name="Toàn cảnh Đà Nẵng" height={296} />
    <Label size={25} weight="bold" style={{ marginTop: 16, lineHeight: 29 }}>Chạm di sản,{"\n"}trọn hành trình</Label>
    <Label size={15} color={colors.muted} style={{ marginTop: 10 }}>Khám phá vẻ đẹp Đà Nẵng, lên lịch trình theo sở thích và kết nối với di sản qua từng thử thách.</Label>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 }}><Ionicons name="location-outline" size={20} color={colors.primaryDark} /><Label size={12}>Khám phá · Lên lịch · Trải nghiệm</Label></View>
  </Screen>;

  if (route.name === 'login') return <Screen bottom={<Label size={12} color={colors.muted} style={{ textAlign: 'center', marginVertical: 8 }}>DANANGACY · Đồng hành cùng di sản</Label>}>
    <Header title="Đăng nhập" onBack={back} />
    <Ionicons name="business-outline" size={38} color={colors.primary} style={{ marginTop: 8 }} />
    <Label size={25} weight="bold" style={{ marginTop: 12 }}>Chào mừng bạn trở lại</Label>
    <Label color={colors.muted} style={{ marginTop: 8, marginBottom: 24 }}>Đăng nhập để lưu lịch trình và tiếp tục hành trình khám phá của bạn.</Label>
    <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" />
    <Field label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} icon={showPassword ? 'eye-outline' : 'eye-off-outline'} />
    <Pressable onPress={() => setShowPassword((s) => !s)} style={{ alignSelf: 'flex-end', marginBottom: 8 }}><Label size={12} color={colors.muted}>{showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</Label></Pressable>
    <Pressable onPress={() => navigate('forgot')} style={{ marginBottom: 16 }}><Label size={13} weight="medium" color={colors.primaryDark}>Quên mật khẩu?</Label></Pressable>
    <Button title="Đăng nhập" onPress={() => email.includes('@') && password.length >= 8 ? login() : notify('Vui lòng nhập email hợp lệ và mật khẩu ít nhất 8 ký tự.')} />
    <Divider />
    <GoogleButton title="Đăng nhập bằng Google" onPress={() => notify('Đăng nhập Google chưa được kết nối trong bản demo.')} />
    <Label size={13} style={{ textAlign: 'center', marginVertical: 10 }}>Bạn chưa có tài khoản?</Label>
    <Button title="Đăng ký tài khoản" kind="secondary" onPress={() => navigate('register')} />
    <InfoBanner>Bạn vẫn có thể khám phá địa điểm mà không cần đăng nhập.</InfoBanner>
  </Screen>;

  if (route.name === 'register') return <Screen bottom={<Pressable onPress={() => navigate('login')} style={{ alignSelf: 'center', marginVertical: 6 }}><Label size={13} color={colors.primaryDark}>Đã có tài khoản? Đăng nhập</Label></Pressable>}>
    <Header title="Đăng ký" onBack={back} />
    <Label size={23} weight="bold">Bắt đầu hành trình của bạn</Label>
    <Label color={colors.muted} style={{ marginTop: 7, marginBottom: 14 }}>Tạo tài khoản để lưu điểm đến yêu thích, lịch trình và điểm thưởng.</Label>
    <Field label="Họ và tên" value={fullName} onChangeText={setFullName} icon="person-outline" />
    <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" />
    <Field label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry icon="eye-off-outline" />
    <Field label="Xác nhận mật khẩu" value={confirm} onChangeText={setConfirm} secureTextEntry icon="eye-off-outline" />
    <InfoBanner>Sử dụng ít nhất 8 ký tự, gồm chữ và số. Không chia sẻ mật khẩu của bạn.</InfoBanner>
    <Button title="Đăng ký" onPress={() => {
      if (!fullName.trim() || !email.includes('@') || password.length < 8 || password !== confirm) return notify('Kiểm tra họ tên, email và hai mật khẩu trước khi đăng ký.');
      app.setName(fullName.trim()); app.setEmail(email.trim()); login();
    }} />
    <Divider />
    <GoogleButton title="Đăng ký bằng Google" onPress={() => notify('Đăng ký Google chưa được kết nối trong bản demo.')} />
  </Screen>;

  if (route.name === 'forgot') return <Screen bottom={<Button title="Quay lại đăng nhập" kind="secondary" onPress={() => navigate('login')} />}>
    <Header title="Quên mật khẩu" onBack={back} />
    <Ionicons name="key-outline" size={42} color={colors.primary} style={{ marginTop: 36 }} />
    <Label size={25} weight="bold" style={{ marginTop: 18 }}>Lấy lại quyền truy cập</Label>
    <Label color={colors.muted} style={{ marginTop: 10, marginBottom: 24 }}>Nhập email đã đăng ký để nhận mã xác nhận và đặt lại mật khẩu.</Label>
    <Field label="Email đăng ký" value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" />
    <Button title="Gửi mã xác nhận" onPress={() => email.includes('@') ? navigate('verify') : notify('Vui lòng nhập email hợp lệ.')} />
    <Card style={{ marginTop: 16 }}><Label weight="bold">Kiểm tra hộp thư của bạn</Label><Label size={13} color={colors.muted} style={{ marginTop: 8 }}>Nếu email có tài khoản, bạn sẽ nhận được mã xác nhận gồm 6 chữ số. Đừng quên kiểm tra thư rác.</Label></Card>
  </Screen>;

  if (route.name === 'verify') return <Screen>
    <Header title="Nhập mã xác nhận" onBack={back} />
    <Ionicons name="mail-outline" size={42} color={colors.primary} style={{ marginTop: 36 }} />
    <Label size={25} weight="bold" style={{ marginTop: 18 }}>Kiểm tra email của bạn</Label>
    <Label color={colors.muted} style={{ marginTop: 10, marginBottom: 22 }}>Nếu email đã đăng ký, mã xác nhận gồm 6 chữ số đã được gửi đến địa chỉ bên dưới.</Label>
    <Label weight="medium" style={{ marginBottom: 22 }}>{email.replace(/(.{2}).*(@.*)/, '$1••••••••$2')}</Label>
    <Field label="Mã xác nhận" value={code} onChangeText={setCode} keyboardType="numeric" />
    <Label size={12} color={colors.muted} style={{ marginBottom: 16 }}>Mã trên chỉ là dữ liệu minh họa giao diện.</Label>
    <Button title="Xác nhận mã" onPress={() => code.length === 6 ? navigate('reset') : notify('Mã xác nhận gồm 6 chữ số.')} />
    <Card style={{ marginTop: 16 }}><Label weight="bold">Bạn chưa nhận được mã?</Label><Label size={13} color={colors.muted} style={{ marginTop: 8 }}>Kiểm tra thư rác hoặc chờ hết đếm ngược để gửi lại.</Label></Card>
  </Screen>;

  return <Screen bottom={<Button title="Quay lại đăng nhập" kind="secondary" onPress={() => navigate('login')} />}>
    <Header title="Đặt lại mật khẩu" onBack={back} />
    <Ionicons name="key-outline" size={42} color={colors.primary} style={{ marginTop: 48 }} />
    <Label size={25} weight="bold" style={{ marginTop: 18 }}>Tạo mật khẩu mới</Label>
    <Label color={colors.muted} style={{ marginTop: 10, marginBottom: 24 }}>Mã xác nhận hợp lệ. Hãy đặt mật khẩu mới để lấy lại quyền truy cập tài khoản.</Label>
    <Field label="Mật khẩu mới" value={password} onChangeText={setPassword} secureTextEntry icon="eye-off-outline" />
    <Field label="Xác nhận mật khẩu mới" value={confirm} onChangeText={setConfirm} secureTextEntry icon="eye-off-outline" />
    <InfoBanner>Sử dụng ít nhất 8 ký tự, gồm chữ và số. Không chia sẻ mật khẩu của bạn.</InfoBanner>
    <Button title="Lưu mật khẩu mới" onPress={() => password.length >= 8 && password === confirm ? (notify('Đã đặt lại mật khẩu trong bản demo.'), navigate('login')) : notify('Hai mật khẩu chưa trùng khớp hoặc quá ngắn.')} />
  </Screen>;
}

function Divider() { return <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 10 }}><View style={{ flex: 1, height: 1, backgroundColor: colors.border }} /><Label size={13} color={colors.muted}>Hoặc</Label><View style={{ flex: 1, height: 1, backgroundColor: colors.border }} /></View>; }
function GoogleButton({ title, onPress }: { title: string; onPress: () => void }) { return <Card onPress={onPress} style={{ minHeight: 52, justifyContent: 'center', marginBottom: 0 }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Image source={images.google} style={{ width: 20, height: 20 }} /><Label weight="bold">{title}</Label></View></Card>; }
