import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SHADOWS, SIZES } from '../../theme/designSystem';

export default function GlassCard({ children, style, intensity = 80, tint = 'light' }) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.webGlass, style]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint={tint} style={[styles.container, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radiusLarge,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...SHADOWS.medium,
  },
  webGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)', // For modern browsers
  },
});
