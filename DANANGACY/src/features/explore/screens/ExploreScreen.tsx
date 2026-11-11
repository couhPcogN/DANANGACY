import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import {
  Button,
  Card,
  Field,
  Header,
  Label,
  Pill,
  PlacePhoto,
  PlaceRow,
  Screen,
  SectionTitle,
  Tabs,
} from '../../../components';
import { colors } from '../../../theme';
import { useExploreViewModel } from '../viewmodels/useExploreViewModel';

export function ExploreScreen() {
  const {
    mapPlaces,
    featuredPlace,
    place,
    saved,
    route,
    navigate,
    back,
    toggleFavorite,
    query,
    setQuery,
    filter,
    setFilter,
    visible,
  } = useExploreViewModel();

  if (route.name === 'explore')
    return (
      <Screen bottom={<Tabs active="explore" />} tabs>
        <Header
          title="Khám phá"
          subtitle="Tìm những điểm đến thú vị tại Đà Nẵng"
          actionIcon="map-outline"
          action={() => navigate('map')}
        />
        <Field
          label=""
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm kiếm địa điểm..."
          icon="search-outline"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          style={{ flexGrow: 0, marginBottom: 10 }}
        >
          {['Tất cả', 'Trong nhà', 'Ngoài trời', 'Bảo tàng'].map((x) => (
            <Pill key={x} title={x} selected={filter === x} onPress={() => setFilter(x)} />
          ))}
        </ScrollView>
        <SectionTitle
          title="Điểm đến nổi bật"
          action={`${visible.length} địa điểm`}
          onAction={() => {}}
        />
        {visible.length ? (
          visible.map((place) => (
            <PlaceRow key={place.id} place={place} onPress={() => navigate('place', place.id)} />
          ))
        ) : (
          <Card>
            <Label color={colors.muted}>Không tìm thấy địa điểm phù hợp.</Label>
          </Card>
        )}
      </Screen>
    );

  if (route.name === 'map')
    return (
      <Screen bottom={<Tabs active="explore" />} tabs>
        <Header title="Bản đồ" subtitle="5 điểm đến tại Đà Nẵng" onBack={back} />
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 15 }}>
          {['Tất cả', 'Trong nhà', 'Ngoài trời'].map((x) => (
            <Pill key={x} title={x} selected={filter === x} onPress={() => setFilter(x)} />
          ))}
        </View>
        <View
          style={{
            height: 340,
            backgroundColor: '#F5F5F5',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 14,
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: '55%',
              width: 45,
              top: -15,
              height: 380,
              backgroundColor: '#C8E4ED',
              transform: [{ rotate: '16deg' }],
            }}
          />
          {mapPlaces.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => navigate('place', p.id)}
              style={{
                position: 'absolute',
                left: `${[18, 72, 35, 78, 20][i]}%`,
                top: `${[34, 14, 57, 78, 12][i]}%`,
                alignItems: 'center',
              }}
            >
              <Ionicons name="location" size={29} color={colors.primary} />
              <Label size={10} weight="bold">
                {p.name.replace('Bảo tàng Điêu khắc ', 'BT ')}
              </Label>
            </Pressable>
          ))}
        </View>
        <Label size={12} color={colors.muted} style={{ marginBottom: 12 }}>
          Bản đồ sơ đồ · Vị trí mang tính minh họa
        </Label>
        <PlaceRow place={featuredPlace} onPress={() => navigate('place', 'cham')} />
      </Screen>
    );

  return (
    <Screen
      bottom={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            title={saved ? 'Đã lưu địa điểm' : 'Lưu địa điểm'}
            icon={saved ? 'heart' : 'heart-outline'}
            onPress={() => toggleFavorite(place.id)}
            style={{ flex: 1 }}
          />
          <Button
            title="Xem bản đồ"
            kind="secondary"
            icon="map-outline"
            onPress={() => navigate('map')}
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <Header
        title="Chi tiết địa điểm"
        onBack={back}
        actionIcon={saved ? 'heart' : 'heart-outline'}
        action={() => toggleFavorite(place.id)}
      />
      <PlacePhoto
        source={place.id === 'bao-tang-dn' ? undefined : place.image}
        name={place.name}
        height={176}
      />
      <Label size={21} weight="bold" style={{ marginTop: 16, marginBottom: 12 }}>
        {place.name}
      </Label>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <Pill title={place.category} tone={place.category === 'Trong nhà' ? 'green' : 'blue'} />
        <Pill title={place.tags} tone="orange" selected />
      </View>
      {place.id === 'cham' ? (
        <Label color={colors.muted} style={{ marginBottom: 14 }}>
          {place.description}
        </Label>
      ) : null}
      <Card>
        <Label weight="bold" size={16}>
          {place.id === 'cham' ? 'Giới thiệu' : 'Thông tin tham quan'}
        </Label>
        {place.id !== 'cham' ? (
          <>
            <Label style={{ marginTop: 10 }}>{place.address}</Label>
            <Label color={colors.muted}>Giờ: Kiểm tra trước khi đi</Label>
            <Label color={colors.muted}>Vé: Kiểm tra trước khi đi</Label>
          </>
        ) : (
          <Label color={colors.muted} style={{ marginTop: 10 }}>
            Bảo tàng Điêu khắc Chăm là nơi trưng bày và bảo tồn những tác phẩm điêu khắc đặc sắc của
            văn hóa Chăm. Với không gian trong nhà, du khách có thể chiêm ngưỡng các hiện vật, tìm
            hiểu về nghệ thuật, tín ngưỡng và những câu chuyện đằng sau từng tác phẩm.
          </Label>
        )}
      </Card>
      {place.id !== 'cham' ? (
        <Card>
          <Label weight="bold" size={16}>
            Giới thiệu
          </Label>
          <Label color={colors.muted} style={{ marginTop: 10 }}>
            {place.description}
          </Label>
        </Card>
      ) : null}
      <Card>
        <Label weight="bold" size={16}>
          Lịch sử
        </Label>
        <Label color={colors.muted} style={{ marginTop: 9 }}>
          Khám phá câu chuyện di sản của {place.name} trong hành trình Đà Nẵng.
        </Label>
      </Card>
    </Screen>
  );
}
