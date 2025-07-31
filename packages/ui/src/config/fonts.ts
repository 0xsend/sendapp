import { createFont, isWeb } from 'tamagui'

export const headingFont = createFont({
  family: isWeb
    ? 'DM Sans, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif '
    : 'DM Sans, System',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    true: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 24,
    9: 32,
    10: 40,
    11: 48,
    12: 64,
    13: 96,
    14: 114,
  },
  lineHeight: {
    1: 16,
    2: 16,
    3: 16,
    4: 20,
    true: 20,
    5: 24,
    6: 24,
    7: 24,
    8: 32,
    9: 40,
    10: 40,
    11: 48,
    12: 48,
    13: 56,
    14: 114 + 10,
  },
  face: isWeb
    ? {
        900: { normal: 'DM Sans Bold' },
      }
    : {
        400: { normal: 'DM Sans' },
        500: { normal: 'DM Sans Medium' },
        600: { normal: 'DM Sans SemiBold' },
        700: { normal: 'DM Sans Bold' },
      },
})

export const bodyFont = createFont({
  family: isWeb
    ? 'DM Sans, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    : 'DM Sans, System',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    true: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 23,
    9: 32,
    10: 40,
    11: 48,
    12: 64,
    13: 96,
    14: 114,
  },
  lineHeight: {
    1: 16,
    2: 16,
    3: 16,
    4: 20,
    true: 20,
    5: 24,
    6: 24,
    7: 24,
    8: 24,
    9: 32,
    10: 40,
    11: 48,
    12: 48,
    13: 56,
    14: 114 + 10,
  },
  face: isWeb
    ? {
        900: { normal: 'DM Sans Bold' },
      }
    : {
        400: { normal: 'DM Sans' },
        500: { normal: 'DM Sans Medium' },
        600: { normal: 'DM Sans SemiBold' },
        700: { normal: 'DM Sans Bold' },
      },
})
export const monoFont = createFont({
  family: isWeb
    ? 'DM Mono, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, monospace'
    : 'DM Mono, System',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    true: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 23,
    9: 32,
    10: 40,
    11: 48,
    12: 64,
    13: 96,
    14: 114,
  },
  lineHeight: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    true: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 23,
    9: 32,
    10: 40,
    11: 48,
    12: 48,
    13: 56,
    14: 114 + 10,
  },
  weight: {
    3: '300',
    4: '400',
    5: '500',
  },
  face: {
    300: { normal: 'DM Mono' },
    400: { normal: 'DM Mono' },
    500: { normal: 'DM Mono' },
  },
})
