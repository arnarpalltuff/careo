import { Platform, TextStyle } from 'react-native';

// Font family names after loading with expo-font / useFonts
export const fontFamily = {
  // Display font — elegant serif for headings & emotional text
  displayRegular: 'PlayfairDisplay_400Regular',
  displayMedium: 'PlayfairDisplay_500Medium',
  displaySemiBold: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',

  // Body font — clean sans-serif for UI text
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

// Fallback-safe font getter (returns system font if custom fonts haven't loaded)
const sf = (font: string, fallbackWeight: TextStyle['fontWeight'] = '400'): TextStyle =>
  Platform.select({
    web: { fontFamily: font, fontWeight: fallbackWeight },
    default: { fontFamily: font },
  }) as TextStyle;

// Pre-built typography styles
// Line heights follow 1.5–1.75× body ratio for readability (UX guideline)
// Minimum body font: 16px for accessibility (WCAG)
export const typography = {
  // Display / Headings (Playfair Display)
  displayLarge: { ...sf(fontFamily.displayBold, '700'), fontSize: 34, lineHeight: 44, letterSpacing: -0.5 } as TextStyle,
  displayMedium: { ...sf(fontFamily.displaySemiBold, '600'), fontSize: 28, lineHeight: 38, letterSpacing: -0.3 } as TextStyle,
  displaySmall: { ...sf(fontFamily.displayMedium, '500'), fontSize: 22, lineHeight: 32 } as TextStyle,

  // Headings (Inter)
  headingLarge: { ...sf(fontFamily.bodyBold, '700'), fontSize: 20, lineHeight: 30 } as TextStyle,
  headingMedium: { ...sf(fontFamily.bodySemiBold, '600'), fontSize: 17, lineHeight: 26 } as TextStyle,
  headingSmall: { ...sf(fontFamily.bodySemiBold, '600'), fontSize: 15, lineHeight: 24 } as TextStyle,

  // Body (Inter) — minimum 14px, prefer 16px+
  bodyLarge: { ...sf(fontFamily.bodyRegular, '400'), fontSize: 17, lineHeight: 28 } as TextStyle,
  bodyMedium: { ...sf(fontFamily.bodyRegular, '400'), fontSize: 16, lineHeight: 26 } as TextStyle,
  bodySmall: { ...sf(fontFamily.bodyRegular, '400'), fontSize: 14, lineHeight: 22 } as TextStyle,

  // Labels (Inter)
  labelLarge: { ...sf(fontFamily.bodySemiBold, '600'), fontSize: 16, lineHeight: 24 } as TextStyle,
  labelMedium: { ...sf(fontFamily.bodyMedium, '500'), fontSize: 14, lineHeight: 22 } as TextStyle,
  labelSmall: { ...sf(fontFamily.bodyMedium, '500'), fontSize: 12, lineHeight: 18 } as TextStyle,

  // Button text — 44px min touch target height
  button: { ...sf(fontFamily.bodySemiBold, '600'), fontSize: 16, lineHeight: 24, letterSpacing: 0.2 } as TextStyle,
};

// Accessibility constants
export const a11y = {
  minTouchTarget: 44,   // 44x44px minimum (WCAG / Apple HIG)
  minTouchGap: 8,       // 8px minimum between touch targets
  focusRingWidth: 3,    // 3-4px focus ring for keyboard nav
};
