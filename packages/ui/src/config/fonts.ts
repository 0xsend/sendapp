import { createFont, isWeb } from 'tamagui'

export const headingFont = createFont({
  family: isWeb
    ? 'DM Sans, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif '
    : 'DM Sans, sans-serif',
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
    9: 30,
    10: 40,
  },
  face: {
    900: { normal: 'DM Sans Bold' },
  },
})

export const bodyFont = createFont({
  family: isWeb
    ? 'DM Sans, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    : 'DM Sans, sans-serif',
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
    9: 30,
    10: 40,
    11: 46,
    12: 55,
    13: 62,
    14: 72,
    15: 92,
    16: 114,
  },

  face: {
    900: { normal: 'DM Sans Bold' },
  },
})
export const monoFont = createFont({
  family: isWeb
    ? 'DM Mono, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, monospace'
    : 'DM Mono, monospace',
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
    9: 30,
    10: 40,
    11: 46,
    12: 55,
    13: 62,
    14: 72,
    15: 92,
    16: 114,
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
    9: 30,
    10: 40,
    11: 46,
    12: 55,
    13: 62,
    14: 72,
    15: 92,
    16: 114,
  },
  weight: {
    3: '300',
    4: '400',
    5: '500',
  },
  face: {
    500: { normal: 'DM Mono' },
  },
})
