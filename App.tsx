import React from 'react';
import { AppProviders } from './src/providers/AppProviders';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return <AppProviders><AppNavigator /></AppProviders>;
}
