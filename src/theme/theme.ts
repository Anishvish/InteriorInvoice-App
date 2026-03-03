// ==========================================
// App Theme - React Native Paper
// ==========================================

import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const brandColors = {
    primary: '#6C63FF',
    primaryDark: '#5A52D5',
    secondary: '#00D9A6',
    secondaryDark: '#00B88C',
    accent: '#FF6B6B',
    warning: '#FFB347',
    success: '#4CAF50',
    info: '#29B6F6',
};

export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: brandColors.primary,
        primaryContainer: '#E8E6FF',
        secondary: brandColors.secondary,
        secondaryContainer: '#D4F8EF',
        tertiary: brandColors.accent,
        background: '#F8F9FE',
        surface: '#FFFFFF',
        surfaceVariant: '#F0F1FA',
        error: '#E53935',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onBackground: '#1A1A2E',
        onSurface: '#1A1A2E',
        onSurfaceVariant: '#5C5C7A',
        outline: '#D1D1E0',
        elevation: {
            level0: 'transparent',
            level1: '#FFFFFF',
            level2: '#F5F5FF',
            level3: '#EDEDFF',
            level4: '#E8E8FF',
            level5: '#E0E0FF',
        },
    },
    roundness: 12,
};

export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: brandColors.primary,
        primaryContainer: '#2D2A5E',
        secondary: brandColors.secondary,
        secondaryContainer: '#0A3D32',
        tertiary: brandColors.accent,
        background: '#0F0F1A',
        surface: '#1A1A2E',
        surfaceVariant: '#252540',
        error: '#FF5252',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onBackground: '#E8E8F0',
        onSurface: '#E8E8F0',
        onSurfaceVariant: '#A0A0B8',
        outline: '#3A3A52',
        elevation: {
            level0: 'transparent',
            level1: '#1A1A2E',
            level2: '#222238',
            level3: '#2A2A42',
            level4: '#30304A',
            level5: '#383852',
        },
    },
    roundness: 12,
};

export const appColors = brandColors;
