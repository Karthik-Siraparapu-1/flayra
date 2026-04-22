import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#FB7185', // Rose Flame
  primaryDark: '#BE123C', // Ruby Aura
  primaryLight: '#FDA4AF', // Soft Flame
  secondary: '#2E1065', // Deep Aura Purple
  accent: '#FDE68A', // Golden Aura Glow
  glass: 'rgba(255, 255, 255, 0.70)', 
  glassDark: 'rgba(30, 10, 60, 0.45)', // Tinted with Aura Purple
  white: '#FFFFFF',
  black: '#000000',
  gray: '#94A3B8',
  lightGray: '#F1F5F9',
  error: '#F43F5E',
  success: '#10B981',
  warning: '#F59E0B',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SIZES = {
  width,
  height,
  radiusSmall: 10,
  radiusMedium: 20,
  radiusLarge: 32, // Smoother, premium radius
  radiusExtraLarge: 48,
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  heavy: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 20,
  },
};

export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '800' },
  h2: { fontSize: 24, fontWeight: '700' },
  h3: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400' },
  bodySmall: { fontSize: 14, fontWeight: '400' },
  label: { fontSize: 14, fontWeight: '600' },
};
