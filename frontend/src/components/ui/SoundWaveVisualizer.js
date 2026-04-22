import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { COLORS } from '../../theme/designSystem';

export default function SoundWaveVisualizer({ active = false, color = COLORS.primary, size = 12 }) {
  const h1 = useSharedValue(0.3);
  const h2 = useSharedValue(0.6);
  const h3 = useSharedValue(0.4);

  useEffect(() => {
    if (active) {
      h1.value = withRepeat(withTiming(1, { duration: 400 }), -1, true);
      h2.value = withRepeat(withTiming(0.2, { duration: 500 }), -1, true);
      h3.value = withRepeat(withTiming(0.8, { duration: 350 }), -1, true);
    } else {
      h1.value = withTiming(0.3);
      h2.value = withTiming(0.3);
      h3.value = withTiming(0.3);
    }
  }, [active]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    height: interpolate(h1.value, [0, 1], [4, size])
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    height: interpolate(h2.value, [0, 1], [4, size])
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    height: interpolate(h3.value, [0, 1], [4, size])
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, { backgroundColor: color }, animatedStyle1]} />
      <Animated.View style={[styles.bar, { backgroundColor: color, marginHorizontal: 2 }, animatedStyle2]} />
      <Animated.View style={[styles.bar, { backgroundColor: color }, animatedStyle3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    width: 20
  },
  bar: {
    width: 3,
    borderRadius: 1.5
  }
});
