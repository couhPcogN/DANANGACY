import React from 'react';
import { View } from 'react-native';
import { Card, Label } from '../../../components';
import { Image } from 'react-native';
import { images } from '../../../config/images';

export function GoogleButton({ title, onPress }: { title: string; onPress: () => void }) { return <Card onPress={onPress} style={{ minHeight: 52, justifyContent: 'center', marginBottom: 0 }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Image source={images.google} style={{ width: 20, height: 20 }} /><Label weight="bold">{title}</Label></View></Card>; }
