/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#10151F',
    textSecondary: '#5B6472',
    background: '#F6F8FC',
    backgroundElement: '#F1F4F9',
    backgroundSelected: '#E7ECF5',
    surface: '#FFFFFF',
    border: '#E1E7F0',
    accent: '#3D7DE0',
    accentSecondary: '#7C6FE8',
    sun: '#E8A33D',
    moon: '#C9A466',
    iss: '#2FAE8B',
    error: '#E8533D',
  },
  dark: {
    text: '#F5F8FC',
    textSecondary: '#9AA5B4',
    background: '#0B1016',
    backgroundElement: '#1B222C',
    backgroundSelected: '#232B36',
    surface: '#141A22',
    border: '#FFFFFF1F',
    accent: '#6FA8FF',
    accentSecondary: '#9B8FFF',
    sun: '#E8A33D',
    moon: '#E8D3A0',
    iss: '#5FD3A6',
    error: '#E8533D',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
