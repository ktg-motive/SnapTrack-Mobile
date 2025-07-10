// SnapTrack Mobile - Professional Design System
import { Platform } from 'react-native';

// Platform-specific font selection
const getSystemFont = () => {
  return Platform.select({
    ios: {
      regular: 'SF Pro Text',
      display: 'SF Pro Display',
      monospace: 'SF Mono',
    },
    android: {
      regular: 'Roboto',
      display: 'Roboto',
      monospace: 'Roboto Mono',
    },
    default: {
      regular: undefined,
      display: undefined,
      monospace: 'Menlo',
    },
  });
};

const systemFonts = getSystemFont();

export const colors = {
  // SnapTrack Brand Colors (Professional Update)
  primary: '#009f86',        // Main teal
  secondary: '#1e3a8a',      // Professional navy blue
  secondaryLight: '#3b82f6', // Lighter variant for backgrounds
  secondaryDark: '#1e40af',  // Darker variant for pressed states
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
  surfaceElevated: '#ffffff',    // Clean white with elevation
  card: '#ffffff',
  
  // Text
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  textMuted: '#adb5bd',
  onSurface: '#212529',         // Alias for textPrimary
  onBackground: '#212529',      // Alias for textPrimary
  onSurfaceVariant: '#6c757d',  // Alias for textSecondary
  
  // Status
  error: '#dc3545',
  warning: '#ffc107',
  
  // Additional missing colors
  accent: '#1e3a8a',          // Alias for secondary (updated to navy)
  border: '#dee2e6',          // Border color
  outline: '#adb5bd',         // Outline color
  outlineVariant: '#dee2e6',  // Alias for border
  primaryContainer: '#009f8620', // Primary with opacity
  onPrimaryContainer: '#004d40', // Dark text on primary container
  secondaryContainer: 'rgba(30, 58, 138, 0.08)', // Secondary with navy RGB opacity
  onSecondaryContainer: '#1e3a8a', // Navy text on secondary container
};

export const typography = {
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.5,
    fontFamily: systemFonts?.display,
  },
  title2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 30,
    letterSpacing: -0.3,
    fontFamily: systemFonts?.display,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    fontFamily: systemFonts?.display,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    fontFamily: systemFonts?.regular,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    fontFamily: systemFonts?.regular,
  },
  money: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0.5,
    fontFamily: systemFonts?.monospace || 'Menlo',
  },
  number: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.3,
    fontFamily: systemFonts?.monospace || 'Menlo',
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 18,
    fontFamily: systemFonts?.regular,
  }
};

export const shadows = {
  card: {
    shadowColor: '#000000',       // Professional black shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,          // Subtle shadow
    shadowRadius: 8,
    elevation: 3,                 // Reduced elevation
  },
  button: {
    shadowColor: '#000000',       // Professional black shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,          // More visible for buttons
    shadowRadius: 12,
    elevation: 6,
  },
  premium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
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
// Stats Cards Color Scheme (Sophisticated Neutrals)
export const statsCardColors = {
  background: '#ffffff',           // Clean white with elevation
  border: '#e5e7eb',              // Subtle border
  value: '#1f2937',               // Strong text hierarchy
  title: '#6b7280',               // Supporting text
  accent: '#009f86',              // SnapTrack teal for highlights
  pressed: 'rgba(0, 159, 134, 0.08)',     // 8% primary tint for press state
  pressedBorder: 'rgba(0, 159, 134, 0.20)', // 20% primary for pressed border
};

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
    secondaryContainer: 'rgba(30, 58, 138, 0.08)', // Navy with opacity
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