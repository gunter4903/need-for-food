import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext';
import AppAlert from './components/common/AppAlert';

export default function App() {
  return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FCF1E4" />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
        <AppAlert />
      </SafeAreaProvider>
  );
}