// ==========================================
// Interior Invoice System - App Entry Point
// ==========================================

import React, { useEffect, useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { PaperProvider, ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { darkTheme } from './src/theme/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { getDatabase, seedSampleCompany } from './src/database/db';
import { useCompanyStore } from './src/store/companyStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ToastProvider } from './src/components/Toast';

function AppContent() {
  const [ready, setReady] = useState(false);
  const { loadCompanies, loadActiveCompany } = useCompanyStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await getDatabase();
      // Seed sample company if empty
      await seedSampleCompany();
      // Load companies and set active
      await loadCompanies();
      await loadActiveCompany();
      setReady(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setReady(true); // Still show app even if init fails
    }
  };

  if (!ready) {
    return (
      <View style={styles.splash}>
        <MaterialCommunityIcons name="receipt" size={72} color="#6C63FF" />
        <Text variant="headlineMedium" style={styles.splashTitle}>
          Interior Invoice
        </Text>
        <Text variant="bodyMedium" style={styles.splashSubtitle}>
          Professional Invoicing System
        </Text>
        <ActivityIndicator
          size="large"
          color="#6C63FF"
          style={{ marginTop: 40 }}
        />
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={darkTheme}>
          <ToastProvider>
            <StatusBar
              barStyle="light-content"
              backgroundColor="#0F0F1A"
            />
            <AppContent />
          </ToastProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
  },
  splashTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 16,
  },
  splashSubtitle: {
    color: '#A0A0B8',
    marginTop: 4,
  },
});
