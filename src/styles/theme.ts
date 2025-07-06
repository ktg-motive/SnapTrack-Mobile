// SnapTrack Mobile - Vegas Neon Design System
export const colors = {
  // SnapTrack Brand Colors (from web app)
  primary: '#009f86',        // Main teal
  secondary: '#2457d9',      // Blue accent
  success: '#00bf8a',        // Light teal
  
  // Vegas Neon Colors (Mobile Optimized)
  neonBlue: '#66ccff',
  neonPink: '#ff69b4', 
  neonGold: '#ffcc00',
  neonGreen: '#66ff99',
  neonPurple: '#bb88ff',
  
  // Surfaces
  background: '#ffffff',
  surface: '#f8f9fa',
  card: '#ffffff',
  
  // Text
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  textMuted: '#adb5bd',
  
  // Status
  error: '#dc3545',
  warning: '#ffc107',
  
  // Additional missing colors
  accent: '#2457d9',          // Alias for secondary
  border: '#dee2e6',          // Border color
  outline: '#adb5bd',         // Outline color
  primaryContainer: '#009f8620', // Primary with opacity
};

export const typography = {
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  title2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  money: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0.5,
    fontFamily: 'Menlo',
  },
  number: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.3,
    fontFamily: 'Menlo',
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 18,
  }
};

export const shadows = {
  card: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    shadowColor: colors.neonBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Create a theme object for components that expect theme.colors, theme.spacing, etc.
export const theme = {
  colors: {
    ...colors,
    // Additional colors that components might expect
    surface: colors.surface,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.textMuted,
    outlineVariant: colors.textMuted,
    primaryContainer: colors.primary + '20', // 20% opacity
    onPrimaryContainer: colors.primary,
    secondaryContainer: colors.secondary + '20',
    onSecondaryContainer: colors.secondary,
    onPrimary: '#ffffff',
    placeholder: colors.textMuted,
    shadow: colors.textPrimary,
  },
  spacing: {
    ...spacing,
    xxs: 2, // Add missing xxs
  },
  borderRadius,
  typography,
  shadows,
};