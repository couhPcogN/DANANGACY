import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';
import { Label } from '../../../components';
import type { Trip } from '../types';

export function TripSummary({ trip }: { trip: Trip }) { return <><Label size={21} weight="bold" style={{ marginBottom: 14 }}>{trip.title}</Label><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}><Ionicons name="calendar-outline" size={21} color={colors.ink} /><View><Label size={14} weight="medium">{trip.date} · {trip.duration} ngày</Label><Label size={12} color={colors.muted}>{trip.stops.length} điểm đến · Nhịp độ {trip.pace.toLowerCase()}</Label></View></View></>; }
