import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';
import { Card, Label } from '../../../components';
import type { Stop } from '../types';
import { getPlace } from '../../explore/repositories/placeRepository';
import { hoiAnNames } from '../repositories/itineraryRepository';

const stopName = (id: string) => hoiAnNames[id] ?? getPlace(id).name;

export function StopCard({ stop, onPress, index, editing = false }: { stop: Stop; onPress?: () => void; index?: number; editing?: boolean }) { return <Card onPress={onPress}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Label size={12} weight="bold" color={colors.primaryDark}>{stop.start} – {stop.end}{editing ? ' · Khung giờ gợi ý' : ''}</Label>{onPress ? <Ionicons name={editing ? 'create-outline' : 'ellipsis-horizontal'} size={19} color={colors.primaryDark} /> : null}</View><View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 }}><Ionicons name="location-outline" size={22} color={colors.ink} /><View><Label size={14} weight="bold">{stopName(stop.placeId)}</Label><Label size={12} color={colors.muted}>{stop.placeId === 'cham' || stop.placeId === 'bao-tang-dn' ? 'Trong nhà · Tìm hiểu di sản' : 'Ngoài trời · Khám phá cảnh quan'}</Label></View></View></Card>; }
