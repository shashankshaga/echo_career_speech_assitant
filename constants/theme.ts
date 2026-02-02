/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

export const Colors = {
  dark: {
    // Text colors
    text: "#FFFFFF",
    textSecondary: "#AAAAAA",
    textTertiary: "#666666",
    textMuted: "#444444",

    // Background colors
    background: "#050505", // Deep matte black
    backgroundElevated: "#0A0A0A",
    backgroundCard: "#111111",
    backgroundInput: "#0D0D0D",

    // Brand/Accent colors (Dark Orange theme)
    primary: "#FF6B00", // Electric Orange
    primaryDark: "#CC5500",
    primaryLight: "#FF8533",
    accent: "#FF9500",
    accentDark: "#E68500",

    // Status colors
    success: "#00FF88",
    warning: "#FFB800",
    error: "#FF1A1A",
    errorDark: "#800000",
    info: "#00A8FF",

    // UI elements
    tint: "#FF6B00",
    border: "#222222",
    borderLight: "#333333",
    borderDark: "#111111",
    divider: "#1A1A1A",

    // Tab/Navigation
    tabIconDefault: "#333333",
    tabIconSelected: "#FF6B00",
    tabBarBackground: "#0A0A0A",

    // Interactive states
    overlay: "rgba(0, 0, 0, 0.7)",
    ripple: "rgba(255, 107, 0, 0.2)",
    disabled: "#1A1A1A",
    disabledText: "#444444",

    // Gradients (for LinearGradient)
    gradientPrimary: ["#FF6B00", "#FF9500"],
    gradientDanger: ["#FF1A1A", "#800000"],
    gradientDark: ["#111111", "#050505"],
  },
  light: {
    // Text colors
    text: "#0A0A0A",
    textSecondary: "#555555",
    textTertiary: "#888888",
    textMuted: "#AAAAAA",

    // Background colors
    background: "#FFFFFF",
    backgroundElevated: "#FAFAFA",
    backgroundCard: "#F5F5F5",
    backgroundInput: "#F8F8F8",

    // Brand/Accent colors (Dark Orange theme)
    primary: "#FF6B00",
    primaryDark: "#CC5500",
    primaryLight: "#FF8533",
    accent: "#FF9500",
    accentDark: "#E68500",

    // Status colors
    success: "#00CC70",
    warning: "#FF9900",
    error: "#FF3333",
    errorDark: "#CC0000",
    info: "#0088CC",

    // UI elements
    tint: "#FF6B00",
    border: "#E0E0E0",
    borderLight: "#F0F0F0",
    borderDark: "#CCCCCC",
    divider: "#EEEEEE",

    // Tab/Navigation
    tabIconDefault: "#CCCCCC",
    tabIconSelected: "#FF6B00",
    tabBarBackground: "#FFFFFF",

    // Interactive states
    overlay: "rgba(0, 0, 0, 0.3)",
    ripple: "rgba(255, 107, 0, 0.15)",
    disabled: "#F0F0F0",
    disabledText: "#CCCCCC",

    // Gradients (for LinearGradient)
    gradientPrimary: ["#FF6B00", "#FF9500"],
    gradientDanger: ["#FF3333", "#CC0000"],
    gradientDark: ["#FFFFFF", "#F5F5F5"],
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Spacing scale for consistent padding/margins
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius scale
export const BorderRadius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  full: 9999,
};

// Font sizes
export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  title: 32,
  display: 48,
};

// Shadow presets (for iOS)
export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
