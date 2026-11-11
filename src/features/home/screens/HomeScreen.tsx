import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { images } from '../../../config/images';
import { places } from '../../explore/repositories/placeRepository';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import { colors } from '../../../theme';
import { Button, Card, Label, PlacePhoto, Screen, SectionTitle, Tabs } from '../../../components';

export function HomeScreen() {
  const { app, navigate, trips, name, startCreate } = useHomeViewModel();

  return <Screen bottom={<Tabs active="home" />} tabs>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }}><View><Label size={21} weight="bold">Xin chào, {name.split(' ').at(-1)}</Label><Label size={12} color={colors.muted}>Hôm nay khám phá gì?</Label></View><Pressable onPress={() => app.tab('profile')} style={{ backgroundColor: colors.warm, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}><Label color={colors.primaryDark} weight="bold">{name.split(' ').at(-1)?.[0] ?? name[0]}</Label></Pressable></View>
    <View style={{ height: 132, overflow: 'hidden', borderRadius: 16, marginBottom: 10 }}><Image source={images.daNang} resizeMode="cover" style={{ width: '100%', height: 132 }} /><View style={{ position: 'absolute', left: 18, top: 10 }}><Label size={32} weight="bold" color={colors.white}>32°</Label><Label size={13} color={colors.white}>Đà Nẵng · Nắng nhẹ</Label></View><View style={{ position: 'absolute', bottom: 9, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>{['14:00  ☼ 31°', '16:00  ☼ 30°', '18:00  ☂ 27°'].map((x) => <Label key={x} size={12} color={colors.white}>{x}</Label>)}</View></View>
    <Button title="Lên lịch trình" icon="calendar-outline" onPress={startCreate} />
    <Card style={{ marginTop: 9 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Label size={12} color={colors.primaryDark}>Lịch trình sắp tới</Label><Label size={12} color={colors.primaryDark}>{trips.length} lịch</Label></View>{trips.map((trip, index) => <Pressable key={trip.id} onPress={() => navigate('tripDetail', trip.id)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: index ? 10 : 0, borderTopWidth: index ? 1 : 0, borderColor: colors.border }}><View><Label weight="bold">{trip.title}</Label><Label size={12} color={colors.muted}>{trip.date} · {trip.duration} ngày · {trip.stops.length} điểm đến · {trip.pace}</Label></View><Ionicons name="arrow-forward-circle" size={26} color={colors.primaryDark} /></Pressable>)}</Card>
    <SectionTitle title="Gợi ý địa điểm" action="Xem tất cả" onAction={() => app.tab('explore')} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }} style={{ flexGrow: 0, marginBottom: 8 }}>{places.slice(0, 4).map((place) => <Pressable key={place.id} onPress={() => navigate('place', place.id)} style={{ width: 152, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 8 }}><PlacePhoto source={place.image} name={place.name} height={100} /><View style={{ marginTop: 8 }}><Label weight="bold" size={13} style={{ height: 39 }}>{place.name}</Label><Label size={11} color={colors.muted}>{place.area}</Label></View></Pressable>)}</ScrollView>
    <SectionTitle title="Thử thách di sản" action="Xem thử thách" onAction={() => app.tab('game')} />
    <Card onPress={() => navigate('gameIntro')}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Image source={images.chamArtifact} style={{ width: 60, height: 60, borderRadius: 10 }} /><View><Label weight="bold">Hiện vật Chăm Pa</Label><Label size={12} color={colors.primaryDark}>Tiếp tục · Câu 2/5 · +50 điểm</Label></View></View></Card>
  </Screen>;
}
