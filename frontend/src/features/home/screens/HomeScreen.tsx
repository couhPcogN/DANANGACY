import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, View } from 'react-native';
import {
  Button,
  Card,
  Label,
  PlacePhoto,
  Screen,
  SectionTitle,
  Tabs,
} from '../../../shared/components';
import { images } from '../../../config/images';
import { colors } from '../../../theme';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import { formatVietnamDate } from '../../../shared/utils/date';

export function HomeScreen() {
  const {
    navigate,
    tab,
    name,
    itineraries,
    startCreate,
    recommendedPlaces,
    quizCompleted,
    displayQuestion,
    weather,
    aiAdvice,
    signedIn,
    goToLogin,
    goToRegister,
  } = useHomeViewModel();

  return (
    <Screen bottom={<Tabs active="home" />} tabs>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 13,
        }}
      >
        <View style={{ flex: 1 }}>
          <Label size={21} weight="bold">
            {signedIn ? `Xin chào, ${name.split(' ').at(-1) || name}` : 'Chào bạn đến Đà Nẵng'}
          </Label>
          <Label size={12} color={colors.muted}>
            {signedIn ? 'Hôm nay khám phá gì?' : 'Chế độ Khách tham quan'}
          </Label>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {!signedIn && (
            <Pressable
              onPress={goToLogin}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 20,
              }}
            >
              <Label color={colors.white} weight="bold" size={12}>
                Đăng nhập
              </Label>
            </Pressable>
          )}
          <Pressable
            onPress={() => (signedIn ? tab('profile') : goToLogin())}
            style={{
              backgroundColor: colors.warm,
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Label color={colors.primaryDark} weight="bold">
              {signedIn ? (name.split(' ').at(-1)?.[0] ?? name[0]) : '?'}
            </Label>
          </Pressable>
        </View>
      </View>
      <View style={{ height: 132, overflow: 'hidden', borderRadius: 16, marginBottom: 10 }}>
        <Image source={images.daNang} resizeMode="cover" style={{ width: '100%', height: 132 }} />
        <View style={{ position: 'absolute', left: 18, top: 10 }}>
          <Label size={32} weight="bold" color={colors.white}>
            {weather.temperature}°
          </Label>
          <Label size={13} color={colors.white}>
            Đà Nẵng · {weather.conditionText}
          </Label>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: 9,
            left: 16,
            right: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          {weather.hourly.map((x) => (
            <Label key={x.time} size={12} color={colors.white}>
              {x.label}
            </Label>
          ))}
        </View>
      </View>
      {aiAdvice ? (
        <Card
          style={{
            marginBottom: 10,
            backgroundColor: '#F0F9FF',
            borderColor: '#BAE6FD',
            borderWidth: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ionicons name="sparkles" size={15} color="#0284C7" />
            <Label size={12} weight="bold" color="#0369A1">
              Gemini 3.8 Flash · Lời khuyên du lịch
            </Label>
          </View>
          <Label size={12} color="#0C4A6E" style={{ lineHeight: 18 }}>
            {aiAdvice}
          </Label>
        </Card>
      ) : null}
      {!signedIn ? (
        <Card
          style={{
            marginBottom: 10,
            backgroundColor: '#F8FAFC',
            borderColor: '#CBD5E1',
            borderWidth: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.warm,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person-outline" size={22} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Label size={15} weight="bold">
                Bạn đang duyệt với tư cách Khách
              </Label>
              <Label size={12} color={colors.muted}>
                Đăng nhập hoặc đăng ký tài khoản để lưu lịch trình cá nhân, tích lũy điểm thưởng thử
                thách và đổi voucher ưu đãi.
              </Label>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Button title="Đăng nhập" onPress={goToLogin} style={{ flex: 1, minHeight: 40 }} />
            <Button
              title="Đăng ký tài khoản"
              kind="secondary"
              onPress={goToRegister}
              style={{ flex: 1, minHeight: 40 }}
            />
          </View>
        </Card>
      ) : null}
      <Button title="Lên lịch trình" icon="calendar-outline" onPress={startCreate} />
      <Card style={{ marginTop: 9 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Label size={12} color={colors.primaryDark}>
            Lịch trình sắp tới
          </Label>
          <Label size={12} color={colors.primaryDark}>
            {itineraries.length} lịch
          </Label>
        </View>
        {itineraries.length === 0 ? (
          <Label size={12} color={colors.muted} style={{ marginTop: 10 }}>
            Chưa có lịch trình sắp tới.
          </Label>
        ) : null}
        {itineraries.map((itinerary, index) => (
          <Pressable
            key={itinerary.id}
            onPress={() => navigate('itineraryDetail', itinerary.id)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
              paddingTop: index ? 10 : 0,
              borderTopWidth: index ? 1 : 0,
              borderColor: colors.border,
            }}
          >
            <View>
              <Label weight="bold">{itinerary.title}</Label>
              <Label size={12} color={colors.muted}>
                {formatVietnamDate(itinerary.date)} · {itinerary.duration} ngày ·{' '}
                {itinerary.stops.length} điểm đến · {itinerary.pace}
              </Label>
            </View>
            <Ionicons name="arrow-forward-circle" size={26} color={colors.primaryDark} />
          </Pressable>
        ))}
      </Card>
      <SectionTitle title="Gợi ý địa điểm" action="Xem tất cả" onAction={() => tab('explore')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
        style={{ flexGrow: 0, marginBottom: 8 }}
      >
        {recommendedPlaces.map((place) => (
          <Pressable
            key={place.id}
            onPress={() => navigate('place', place.id)}
            style={{
              width: 152,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 8,
            }}
          >
            <PlacePhoto source={place.image} name={place.name} height={100} />
            <View style={{ marginTop: 8 }}>
              <Label weight="bold" size={13} style={{ height: 39 }}>
                {place.name}
              </Label>
              <Label size={11} color={colors.muted}>
                {place.area}
              </Label>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <SectionTitle title="Thử thách di sản" action="Xem thử thách" onAction={() => tab('game')} />
      <Card onPress={() => navigate('gameIntro')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Image source={images.chamArtifact} style={{ width: 60, height: 60, borderRadius: 10 }} />
          <View>
            <Label weight="bold">Hiện vật Chăm Pa</Label>
            <Label size={12} color={colors.primaryDark}>
              {quizCompleted
                ? `Đã hoàn thành · Câu ${displayQuestion}/5 · Đã nhận 50 điểm`
                : `Tiếp tục · Câu ${displayQuestion}/5 · +50 điểm`}
            </Label>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
