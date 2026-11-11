import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import {
  Button,
  Card,
  Field,
  Header,
  InfoBanner,
  Label,
  Pill,
  PlacePhoto,
  PlaceRow,
  Progress,
  Screen,
  SectionTitle,
  Tabs,
} from '../../../components';
import { images } from '../../../config/images';
import { colors } from '../../../theme';
import { getPlace, places } from '../../explore/repositories/placeRepository';
import { StopCard } from '../components/StopCard';
import { TripStopsEditor } from '../components/TripStopsEditor';
import { TripSummary } from '../components/TripSummary';
import { getStopName } from '../utils/getStopName';
import { useItineraryViewModel } from '../viewmodels/useItineraryViewModel';

export function ItineraryScreen() {
  const {
    app,
    route,
    back,
    navigate,
    trips,
    draft,
    setDraft,
    startCreate,
    startEdit,
    cancelEdit,
    notify,
    replaceSonTra,
    filter,
    setFilter,
    search,
    setSearch,
    editingTime,
    selectedTrip,
    setTrip,
    continueFromInfo,
    submitDraft,
    submitEdit,
    beginTimeEdit,
    beginSavedTimeEdit,
    timeEditor,
  } = useItineraryViewModel();

  if (route.name === 'itinerary')
    return (
      <Screen bottom={<Tabs active="itinerary" />} tabs>
        <Header title="Lịch trình của tôi" subtitle="Lưu giữ những hành trình đáng nhớ" />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <Pill
            title={`Sắp tới · ${trips.length}`}
            selected={filter === 'Sắp tới'}
            onPress={() => setFilter('Sắp tới')}
          />
          <Pill
            title="Đã hoàn thành · 0"
            selected={filter === 'Đã hoàn thành'}
            onPress={() => setFilter('Đã hoàn thành')}
          />
        </View>
        {filter === 'Sắp tới' ? (
          trips.map((trip) => (
            <Card key={trip.id}>
              <PlacePhoto source={images.daNang} name={trip.title} height={150} />
              <View style={{ marginTop: 10, marginBottom: 7 }}>
                <Pill title="Sắp tới" selected />
              </View>
              <TripSummary trip={trip} />
              <Button
                title="Xem lịch trình"
                kind="secondary"
                onPress={() => navigate('tripDetail', trip.id)}
              />
            </Card>
          ))
        ) : (
          <Card>
            <Label color={colors.muted}>Chưa có lịch trình đã hoàn thành.</Label>
          </Card>
        )}
        <InfoBanner icon="git-merge-outline">
          Hành trình theo cách của bạn. Chọn sở thích, thêm điểm đến và để DANANGACY giúp bạn sắp
          xếp.
        </InfoBanner>
        <Button
          title="Tạo lịch trình mới"
          icon="add-outline"
          onPress={startCreate}
          style={{ marginTop: 20 }}
        />
      </Screen>
    );

  if (route.name === 'tripInfo')
    return (
      <Screen bottom={<Button title="Tiếp tục" icon="arrow-forward" onPress={continueFromInfo} />}>
        <Header title="Thông tin chuyến đi" onBack={back} />
        <Label size={12} color={colors.primaryDark} weight="bold">
          Bước 1/3 · Tạo lịch trình
        </Label>
        <Progress step={1} total={3} />
        <Label size={21} weight="bold" style={{ marginVertical: 12 }}>
          Chuyến đi của bạn
        </Label>
        <Label color={colors.muted} style={{ marginBottom: 20 }}>
          Bắt đầu với tên và thời gian. Bạn có thể chỉnh sửa sau khi lưu.
        </Label>
        <Field
          label="Tên lịch trình"
          value={draft.title}
          onChangeText={(v) => setTrip({ title: v })}
          icon="pencil-outline"
        />
        <Field
          label="Ngày khởi hành (DD/MM/YYYY)"
          value={draft.date}
          onChangeText={(v) => setTrip({ date: v })}
          icon="calendar-outline"
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Giờ bắt đầu"
              value={draft.stops[0]?.start ?? '09:00'}
              onChangeText={(v) =>
                setDraft({
                  ...draft,
                  stops: draft.stops.map((s, i) => (i === 0 ? { ...s, start: v } : s)),
                })
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Giờ kết thúc"
              value={draft.stops.at(-1)?.end ?? '18:00'}
              onChangeText={(v) =>
                setDraft({
                  ...draft,
                  stops: draft.stops.map((s, i) =>
                    i === draft.stops.length - 1 ? { ...s, end: v } : s,
                  ),
                })
              }
            />
          </View>
        </View>
        <SectionTitle title="Thời lượng" />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {[1, 2, 3].map((n) => (
            <Pill
              key={n}
              title={`${n} ngày`}
              selected={draft.duration === n}
              onPress={() => setTrip({ duration: n })}
            />
          ))}
        </View>
        <InfoBanner>
          Lịch trình trong ngày · Các điểm đến được sắp xếp từ sáng đến chiều.
        </InfoBanner>
      </Screen>
    );

  if (route.name === 'tripPreferences')
    return (
      <Screen
        bottom={
          <Button title="Tiếp tục" icon="arrow-forward" onPress={() => navigate('tripPlaces')} />
        }
      >
        <Header title="Sở thích & nhịp độ" onBack={back} />
        <Label size={12} color={colors.primaryDark} weight="bold">
          Bước 2/3 · Tạo lịch trình
        </Label>
        <Progress step={2} total={3} />
        <Label size={21} weight="bold" style={{ marginVertical: 13 }}>
          Bạn muốn trải nghiệm gì?
        </Label>
        <Label color={colors.muted} style={{ marginBottom: 14 }}>
          Chọn một hoặc nhiều sở thích để gợi ý điểm đến và sắp xếp lịch trình phù hợp.
        </Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 25 }}>
          {['Di sản & văn hóa', 'Bảo tàng', 'Thiên nhiên', 'Kiến trúc', 'Cảnh quan đô thị'].map(
            (x, i) => (
              <Pill
                key={x}
                title={x}
                selected={i < 3}
                onPress={() => notify(`Đã chọn sở thích ${x}.`)}
              />
            ),
          )}
        </View>
        <SectionTitle title="Nhịp độ khám phá" />
        <Label color={colors.muted} size={13} style={{ marginBottom: 14 }}>
          Số điểm/ngày chỉ là gợi ý, không giới hạn lựa chọn.
        </Label>
        {(['Thư thả', 'Cân bằng', 'Năng động'] as const).map((p, i) => (
          <Card
            key={p}
            onPress={() => setTrip({ pace: p })}
            style={
              draft.pace === p
                ? { backgroundColor: colors.warm, borderColor: colors.warmBorder }
                : undefined
            }
          >
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Ionicons
                name={(['cafe-outline', 'footsteps-outline', 'flash-outline'] as const)[i]}
                size={23}
                color={draft.pace === p ? colors.primaryDark : colors.ink}
              />
              <View>
                <Label weight="bold" color={draft.pace === p ? colors.primaryDark : colors.ink}>
                  {p}
                </Label>
                <Label size={12} color={colors.muted}>
                  Khoảng {[3, 4, 5][i]} điểm/ngày ·{' '}
                  {['Có thời gian nghỉ', 'Đa dạng trải nghiệm', 'Khám phá nhiều hơn'][i]}
                </Label>
              </View>
            </View>
          </Card>
        ))}
      </Screen>
    );

  if (route.name === 'tripPlaces') {
    const shown = places.filter((p) =>
      p.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')),
    );
    return (
      <Screen
        bottom={
          <Button
            title={`Xem lại lịch trình · ${draft.stops.length} điểm`}
            onPress={() =>
              draft.stops.length ? navigate('tripReview') : notify('Chọn ít nhất một điểm đến.')
            }
          />
        }
      >
        <Header title="Chọn điểm đến" onBack={back} />
        <Label size={12} color={colors.primaryDark} weight="bold">
          Bước 3/3 · Tạo lịch trình
        </Label>
        <Progress step={3} total={3} />
        <SectionTitle
          title="5 điểm đến"
          action={`Đã chọn ${draft.stops.length}`}
          onAction={() => {}}
        />
        <Field
          label=""
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm điểm đến"
          icon="search-outline"
        />
        <Label size={12} color={colors.muted} style={{ marginBottom: 10 }}>
          Ảnh / tên: xem chi tiết · Vòng tròn: chọn điểm đến
        </Label>
        {shown.map((p) => (
          <PlaceRow
            key={p.id}
            place={p}
            selected={draft.stops.some((s) => s.placeId === p.id)}
            trailing={
              draft.stops.some((s) => s.placeId === p.id)
                ? 'checkmark-circle-outline'
                : 'ellipse-outline'
            }
            onPress={() => {
              const exists = draft.stops.some((s) => s.placeId === p.id);
              setTrip({
                stops: exists
                  ? draft.stops.filter((s) => s.placeId !== p.id)
                  : [...draft.stops, { placeId: p.id, start: '11:00', end: '12:00' }],
              });
            }}
          />
        ))}
      </Screen>
    );
  }

  if (route.name === 'tripReview')
    return (
      <Screen
        bottom={<Button title="Lưu lịch trình" icon="bookmark-outline" onPress={submitDraft} />}
      >
        <Header title="Xem lại lịch trình" onBack={back} />
        <Pill title="Xem lại & xác nhận trước khi lưu" selected />
        <View style={{ marginTop: 15 }}>
          <TripSummary trip={draft} />
        </View>
        <Card>
          <Label weight="bold">
            Ngày 1 / {draft.duration} · {draft.date}
          </Label>
        </Card>
        <Label size={13} color={colors.muted} style={{ marginBottom: 14 }}>
          Khung giờ gợi ý · Chỉnh sửa trước khi lưu
        </Label>
        <TripStopsEditor
          stops={draft.stops}
          onEdit={beginTimeEdit}
          editing={editingTime}
          timeEditor={timeEditor}
        />
        <InfoBanner>
          Chỉnh sửa khung giờ gợi ý trước khi lưu. Thời gian bạn áp dụng sẽ được giữ nguyên.
        </InfoBanner>
      </Screen>
    );

  if (route.name === 'tripSaved')
    return (
      <Screen
        bottom={
          <View style={{ gap: 8 }}>
            <Button
              title="Xem lịch trình"
              icon="arrow-forward"
              onPress={() => navigate('tripDetail', route.id ?? draft.id)}
            />
            <Button title="Về trang chủ" kind="outline" onPress={() => app.tab('home')} />
          </View>
        }
      >
        <Header title="Hoàn tất lịch trình" onBack={() => app.tab('itinerary')} />
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Ionicons name="checkmark-circle-outline" size={90} color={colors.success} />
          <Label size={25} weight="bold" style={{ marginTop: 16 }}>
            Lịch trình đã sẵn sàng!
          </Label>
          <Label color={colors.muted} style={{ textAlign: 'center', marginTop: 10 }}>
            Chuyến đi của bạn đã được lập và lưu. Cùng chờ một ngày khám phá Đà Nẵng nhé!
          </Label>
        </View>
        <Card style={{ marginTop: 24 }}>
          <Pill title="Đã lưu" tone="green" />
          <View style={{ marginTop: 10 }}>
            <TripSummary trip={draft} />
          </View>
          {draft.stops.map((s, i) => (
            <Label key={i} style={{ marginVertical: 5 }}>
              {i + 1}
              {'.  '}
              {getStopName(s.placeId)}
            </Label>
          ))}
        </Card>
      </Screen>
    );

  if (route.name === 'tripDetail')
    return (
      <Screen
        bottom={
          <Button
            title="Chỉnh sửa lịch trình"
            kind="secondary"
            icon="pencil-outline"
            onPress={() => startEdit(selectedTrip.id)}
          />
        }
      >
        <Header
          title="Chi tiết lịch trình"
          onBack={() => app.tab('itinerary')}
          actionIcon="ellipsis-horizontal"
          action={() => startEdit(selectedTrip.id)}
        />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <Pill title="Đã lưu" tone="green" />
          <Pill title={`${selectedTrip.stops.length} điểm đến`} selected />
        </View>
        <TripSummary trip={selectedTrip} />
        {selectedTrip.stops.some((s) => s.placeId === 'son-tra') ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem gợi ý thay thế"
            onPress={() => navigate('weather', selectedTrip.id)}
          >
            <InfoBanner tone="blue" icon="rainy-outline">
              15/11 · 27–30°C · Có thể mưa 14:00–16:00 tại Sơn Trà. Xem gợi ý thay thế
            </InfoBanner>
          </Pressable>
        ) : (
          <InfoBanner tone="green">
            Lịch trình đã được cập nhật. Khung giờ của bạn được giữ nguyên.
          </InfoBanner>
        )}
        <Card>
          <Label weight="bold" color={colors.primaryDark}>
            {'Ngày 1 / 1  '}
            {selectedTrip.date.slice(0, 5)}
          </Label>
        </Card>
        <SectionTitle title={`Ngày 1 · ${selectedTrip.stops.length} điểm đến`} />
        {selectedTrip.stops.map((s, i) => (
          <StopCard
            key={`${s.placeId}-${i}`}
            stop={s}
            editing
            onPress={() => beginSavedTimeEdit(selectedTrip, i, s)}
          />
        ))}
        <Label size={12} color={colors.muted}>
          Chạm bút chì để chỉnh giờ. Chỉ cập nhật khi Áp dụng; giữ nguyên giờ đã duyệt.
        </Label>
      </Screen>
    );

  if (route.name === 'tripEdit')
    return (
      <Screen
        bottom={
          <View style={{ gap: 8 }}>
            <Button title="Lưu thay đổi" icon="checkmark" onPress={submitEdit} />
            <Button title="Hủy thay đổi" kind="secondary" onPress={cancelEdit} />
          </View>
        }
      >
        <Header title="Chỉnh sửa lịch trình" onBack={cancelEdit} />
        <Field
          label="Tên lịch trình"
          value={draft.title}
          onChangeText={(v) => setTrip({ title: v })}
        />
        <Field
          label="Ngày khởi hành"
          value={draft.date}
          onChangeText={(v) => setTrip({ date: v })}
        />
        <SectionTitle title="Điểm đến và khung giờ" />
        <TripStopsEditor
          stops={draft.stops}
          onEdit={beginTimeEdit}
          editing={editingTime}
          timeEditor={timeEditor}
        />
        <Button
          title="Thêm điểm đến đã lưu"
          kind="outline"
          icon="add"
          onPress={() => navigate('tripEditPlaces')}
        />
        <InfoBanner>Chỉ các thay đổi được xác nhận mới cập nhật vào lịch trình của bạn.</InfoBanner>
      </Screen>
    );

  if (route.name === 'tripEditPlaces')
    return (
      <Screen bottom={<Button title="Quay lại chỉnh sửa" onPress={back} />}>
        <Header title="Chọn địa điểm đã lưu" onBack={back} />
        {places
          .filter((p) => app.favorites.includes(p.id))
          .map((p) => (
            <PlaceRow
              key={p.id}
              place={p}
              onPress={() => {
                if (draft.stops.some((s) => s.placeId === p.id))
                  return notify('Điểm đến đã có trong lịch trình.');
                setTrip({
                  stops: [...draft.stops, { placeId: p.id, start: '19:00', end: '20:00' }],
                });
                back();
              }}
            />
          ))}
      </Screen>
    );

  if (route.name === 'weather')
    return (
      <Screen
        bottom={
          <View style={{ gap: 8 }}>
            <Button
              title="Xem gợi ý thay thế"
              icon="sync-outline"
              onPress={() => navigate('replacement', route.id)}
            />
            <Button
              title="Giữ nguyên lịch trình"
              kind="secondary"
              onPress={() => navigate('tripDetail', route.id)}
            />
          </View>
        }
      >
        <Header title="Cảnh báo mưa" onBack={back} />
        <View
          style={{
            backgroundColor: colors.infoBg,
            borderRadius: 16,
            padding: 16,
            marginTop: 25,
            marginBottom: 18,
          }}
        >
          <Label size={23} weight="bold" color={colors.info}>
            {'☂  Mưa có thể đến'}
          </Label>
          <Label color={colors.info}>15/11/2026 · 14:00–16:00 · 27°C</Label>
          <Label color={colors.info} style={{ marginTop: 12 }}>
            Khả năng mưa 80% tại Sơn Trà, trùng với điểm tham quan ngoài trời của bạn.
          </Label>
        </View>
        <SectionTitle title="Điểm đến bị ảnh hưởng" />
        <PlaceRow place={getPlace('son-tra')} onPress={() => navigate('place', 'son-tra')} />
        <Card>
          <Label weight="bold">{selectedTrip.title}</Label>
          <Label size={13} color={colors.muted}>
            2 điểm còn lại được giữ nguyên
          </Label>
          <Label size={13} color={colors.muted} style={{ marginTop: 9 }}>
            Chọn một điểm trong nhà để tiếp tục khám phá mà không thay đổi khung giờ.
          </Label>
        </Card>
        <Label size={12} color={colors.muted}>
          Dự báo minh họa cho lịch trình mẫu. Hãy kiểm tra thời tiết thực tế trước khi đi.
        </Label>
      </Screen>
    );

  if (route.name === 'replacement')
    return (
      <Screen
        bottom={
          <Button
            title="Chọn Bảo tàng Đà Nẵng"
            onPress={() => navigate('replacementConfirm', route.id)}
          />
        }
      >
        <Header title="Địa điểm thay thế" onBack={back} />
        <InfoBanner tone="blue" icon="rainy-outline">
          Thay Sơn Trà · 15/11, 14:00–16:00. Ưu tiên điểm trong nhà vì dự báo mưa.
        </InfoBanner>
        <SectionTitle title="Địa điểm thay thế trong nhà" />
        <PlaceRow
          place={getPlace('bao-tang-dn')}
          selected
          onPress={() => navigate('replacementConfirm', route.id)}
          trailing="checkmark-circle-outline"
        />
        <InfoBanner tone="orange">
          Trong nhà, hợp sở thích văn hóa; chưa có trong lịch trình.
        </InfoBanner>
        <SectionTitle title="Đã có trong lịch trình · Không thể chọn" />
        <PlaceRow
          place={getPlace('cham')}
          onPress={() => notify('Địa điểm này đã có trong lịch trình.')}
        />
        <Label size={12} color={colors.muted}>
          Lọc theo giờ mở cửa, thời gian di chuyển, vị trí và sở thích; phương án minh họa, chưa xác
          minh dữ liệu thực tế.
        </Label>
      </Screen>
    );

  return (
    <Screen
      bottom={
        <View style={{ gap: 8 }}>
          <Button title="Xác nhận thay thế" icon="checkmark" onPress={replaceSonTra} />
          <Button title="Hủy thay thế · Quay lại" kind="secondary" onPress={back} />
        </View>
      }
    >
      <Header title="Xác nhận thay thế" onBack={back} />
      <Label weight="bold" style={{ marginTop: 16 }}>
        {selectedTrip.title}
      </Label>
      <Pill title="15/11/2026 · 14:00–16:00" tone="blue" />
      <SectionTitle title="ĐIỂM ĐẾN HIỆN TẠI" />
      <PlaceRow place={getPlace('son-tra')} onPress={() => navigate('place', 'son-tra')} />
      <View style={{ alignItems: 'center' }}>
        <Ionicons name="arrow-down" size={25} color={colors.primaryDark} />
      </View>
      <SectionTitle title="ĐIỂM ĐẾN THAY THẾ" />
      <PlaceRow place={getPlace('bao-tang-dn')} selected onPress={() => {}} />
      <InfoBanner tone="green">
        Giữ nguyên khung giờ 14:00–16:00. Hai điểm còn lại không đổi. Chỉ cập nhật khi bạn xác nhận.
      </InfoBanner>
    </Screen>
  );
}
