import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING } from '../../theme/designSystem';

export default function PremiumInput({ label, icon, ...props }) {
  const [isFocused, setIsFocused] = useState(false);
  const borderScale = useState(new Animated.Value(0))[0];

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderScale, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderScale, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const borderBottomWidth = borderScale.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, isFocused && styles.focusedWrapper]}>
        {icon && <Icon name={icon} size={20} color={isFocused ? COLORS.primary : COLORS.gray} style={styles.icon} />}
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.gray + '80'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        <Animated.View 
          style={[
            styles.animatedBorder, 
            { 
              width: borderScale.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }),
              backgroundColor: COLORS.primary 
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  focusedWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    height: '100%',
  },
  animatedBorder: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    height: 2,
    borderRadius: 1,
    transform: [{ translateX: -0.5 }], // Not perfect centered but works
  }
});
