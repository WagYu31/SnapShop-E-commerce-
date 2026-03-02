export const Colors = {
  primary: '#000000',
  primaryText: '#1E1E1E',
  secondaryText: '#808080',
  white: '#FFFFFF',
  background: '#FFFFFF',
  lightGray: '#F5F5F5',
  border: '#E5E5E5',
  gray: '#999999',
  darkGray: '#404040',
  mediumGray: '#666666',
  blue: '#3B82F6',
  red: '#EF4444',
  green: '#22C55E',
  overlay: 'rgba(0,0,0,0.5)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  h4: 22,
  h3: 24,
  h2: 28,
  h1: 32,
  hero: 48,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const formatRupiah = (amount: number): string => {
  return 'Rp' + amount.toLocaleString('id-ID');
};
