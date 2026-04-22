import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from './src/theme/designSystem';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();


import AuthNavigator from './src/navigation/AuthNavigator';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import useAuthStore from './src/store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    
    try {
      // In production, configure eas.json with project ID.
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch (e) {
      console.log("Push token fetch failed. Run `eas init` to configure project ID.", e);
    }
  }
  return token;
}

export default function App() {
  const { isAuthenticated, user, initAuthListener, isInitializing, updateUser } = useAuthStore();

  useEffect(() => {
    initAuthListener();
    setTimeout(async () => {
      await SplashScreen.hideAsync().catch(console.warn);
    }, 1500);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      registerForPushNotificationsAsync().then(token => {
        if (token && token !== user.pushToken) {
          // TODO: Send token to backend API
          console.log('Push token:', token);
          updateUser({ pushToken: token });
        }
      });
    }
  }, [isAuthenticated, user?.id]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.secondary, '#0f172a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Flayra</Text>
          <Text style={styles.loadingSubtext}>Enter the Aura</Text>
        </View>
      </View>
    );
  }

  const isSetupRequired = isAuthenticated && user && !user.profileCompleted;

  return (
    <>
      <NavigationContainer>
        {!isAuthenticated || isSetupRequired ? (
          <AuthNavigator />
        ) : (
          <MainTabNavigator />
        )}
      </NavigationContainer>
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.secondary },
  loadingContent: { alignItems: 'center' },
  loadingText: { fontSize: 32, fontWeight: '900', color: COLORS.white, marginTop: 24, letterSpacing: 2, textTransform: 'uppercase' },
  loadingSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: '600', letterSpacing: 1 }
});
