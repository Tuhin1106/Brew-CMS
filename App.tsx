import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppErrorBoundary from './components/AppErrorBoundary';
import { colors, spacing } from './constants/theme';
import RootNavigator from './navigation/RootNavigator';
import SignInScreen from './screens/SignInScreen';
import { useCafeStore } from './store/useCafeStore';

const window = Dimensions.get('window');
const initialSafeArea = {
  frame: { x: 0, y: 0, width: window.width, height: window.height },
  insets: {
    top: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 47,
    left: 0,
    right: 0,
    bottom: 0,
  },
};

export default function App() {
  const [hydrated, setHydrated] = useState(useCafeStore.persist.hasHydrated());
  const currentUser = useCafeStore((state) => state.currentUser);

  useEffect(() => {
    const unsubscribe = useCafeStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useCafeStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    const timeout = setTimeout(() => setHydrated(true), 2500);
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.boot}>
        <Text style={styles.webTitle}>Offline-Mode is mobile only</Text>
        <Text style={styles.webCopy}>
          Open Expo Go on your iPhone or Android phone and scan the QR from the terminal.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialSafeArea} style={styles.fill}>
      <AppErrorBoundary>
        <View style={styles.root} collapsable={false}>
          {!hydrated ? (
            <View style={styles.boot}>
              <ActivityIndicator color={colors.accent} size="large" />
            </View>
          ) : currentUser ? (
            <RootNavigator />
          ) : (
            <SignInScreen />
          )}
          <StatusBar style="dark" />
        </View>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  boot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  webTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  webCopy: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 360,
  },
});
