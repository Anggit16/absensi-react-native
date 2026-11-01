import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components/common/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppProvider } from './src/store/AppProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </ToastProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
