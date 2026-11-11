import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import {
  Button,
  Card,
  Field,
  Header,
  InfoBanner,
  Label,
  PlaceRow,
  Screen,
  SectionTitle,
  Tabs,
} from '../../../components';
import { colors } from '../../../theme';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';

export function ProfileScreen() {
  const {
    tab,
    signedIn,
    logout,
    rewardRedeemed,
    quizCompleted,
    favoriteItems,
    openSection,
    saveProfile,
    route,
    back,
    navigate,
    name,
    email,
    favorites,
    toggleFavorite,
    itineraries,
    points,
    draftName,
    setDraftName,
    draftEmail,
    setDraftEmail,
    draftPhone,
    setDraftPhone,
  } = useProfileViewModel();

  if (route.name === 'profile')
    return (
      <Screen bottom={<Tabs active="profile" />} tabs>
        <Header title="Hồ sơ" />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, margin: 4 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.warm,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Label size={25} weight="bold" color={colors.primaryDark}>
                {name.split(' ').at(-1)?.[0] ?? name[0]}
              </Label>
            </View>
            <View>
              <Label size={20} weight="bold">
                {name}
              </Label>
              <Label size={12} color={colors.muted}>
                {email}
              </Label>
            </View>
          </View>
          <Button
            title="Chỉnh sửa hồ sơ"
            kind="secondary"
            onPress={() => navigate('editProfile')}
            style={{ marginTop: 7 }}
          />
        </Card>
        <InfoBanner icon="extension-puzzle-outline">
          <Label weight="bold">{points} điểm di sản</Label>
          {'\n'}
          {points === 70
            ? 'Sau khi đổi ưu đãi Cà phê bên sông Hàn'
            : 'Tích lũy từ thử thách di sản'}
        </InfoBanner>
        <SectionTitle title="Hành trình của bạn" />
        <Card>
          {(
            [
              [
                'calendar-outline',
                'Lịch trình của tôi',
                `${itineraries.length} chuyến đi sắp tới`,
                'itinerary',
              ],
              ['heart-outline', 'Yêu thích', `${favorites.length} địa điểm đã lưu`, 'favorites'],
              [
                'ticket-outline',
                'Ưu đãi của tôi',
                `${rewardRedeemed ? 1 : 0} ưu đãi mô phỏng còn hiệu lực`,
                'myRewards',
              ],
              [
                'trophy-outline',
                'Thử thách di sản',
                `Hiện vật Chăm Pa · ${quizCompleted ? 'Đã hoàn thành' : 'Đang thực hiện'}`,
                'game',
              ],
            ] as const
          ).map(([icon, title, description, target]) => (
            <Pressable
              key={title}
              onPress={() => openSection(target)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58 }}
            >
              <Ionicons name={icon} size={21} color={colors.ink} />
              <View>
                <Label weight="bold" size={14}>
                  {title}
                </Label>
                <Label size={12} color={colors.muted}>
                  {description}
                </Label>
              </View>
            </Pressable>
          ))}
        </Card>
        <Label size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          DANANGACY · Chạm di sản, trọn hành trình
        </Label>
        {!signedIn ? (
          <Button
            title="Đăng nhập để lưu tài khoản"
            kind="outline"
            onPress={() => navigate('login')}
            style={{ marginTop: 24 }}
          />
        ) : null}
      </Screen>
    );

  if (route.name === 'editProfile')
    return (
      <Screen bottom={<Button title="Lưu thay đổi" icon="checkmark" onPress={saveProfile} />}>
        <Header title="Chỉnh sửa hồ sơ" onBack={back} />
        <View style={{ alignItems: 'center', marginTop: 26, marginBottom: 30 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.warm,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Label size={28} weight="bold" color={colors.primaryDark}>
              {draftName[0]}
            </Label>
          </View>
          <Label size={12} color={colors.muted} style={{ marginTop: 14 }}>
            Thông tin cá nhân của bạn
          </Label>
        </View>
        <Field
          label="Họ và tên"
          value={draftName}
          onChangeText={setDraftName}
          icon="person-outline"
        />
        <Field
          label="Email"
          value={draftEmail}
          onChangeText={setDraftEmail}
          keyboardType="email-address"
          icon="mail-outline"
        />
        <Field
          label="Số điện thoại (không bắt buộc)"
          value={draftPhone}
          onChangeText={setDraftPhone}
          keyboardType="phone-pad"
          placeholder="Chưa thêm số điện thoại"
          icon="call-outline"
        />
        <InfoBanner>
          Thông tin được dùng để quản lý tài khoản và lưu hành trình của bạn. Các thay đổi chỉ được
          cập nhật khi bạn lưu.
        </InfoBanner>
        {signedIn ? (
          <Pressable
            accessibilityRole="button"
            onPress={logout}
            style={{ alignSelf: 'center', padding: 14, marginTop: 12 }}
          >
            <Label size={13} color={colors.primaryDark}>
              Đăng xuất
            </Label>
          </Pressable>
        ) : null}
      </Screen>
    );

  return (
    <Screen bottom={<Tabs active="profile" />} tabs>
      <Header title="Yêu thích" subtitle={`${favorites.length} địa điểm đã lưu`} onBack={back} />
      <SectionTitle title="Các địa điểm yêu thích" />
      {favorites.length ? (
        favoriteItems.map(({ id, place }) => (
          <View key={id} style={{ position: 'relative' }}>
            <PlaceRow place={place} onPress={() => navigate('place', id)} />
            <Pressable
              accessibilityLabel={`Bỏ lưu ${place.name}`}
              onPress={() => toggleFavorite(id)}
              style={{
                position: 'absolute',
                top: 36,
                right: 20,
                width: 35,
                height: 35,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="heart" size={21} color={colors.primaryDark} />
            </Pressable>
          </View>
        ))
      ) : (
        <Card>
          <Label color={colors.muted}>Bạn chưa lưu địa điểm nào.</Label>
        </Card>
      )}
      <InfoBanner icon="heart-outline">
        Lưu một nơi, giữ một cảm hứng. Nhấn Lưu tại địa điểm hoặc trái tim tại trang chi tiết.
      </InfoBanner>
      <Button
        title="Xem lịch trình của tôi"
        onPress={() => tab('itinerary')}
        style={{ marginTop: 10 }}
      />
    </Screen>
  );
}
