import { createFont, isWeb } from 'tamagui'

export const headingFont = createFont({
  family: isWeb
    ? 'DM Sans, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    : 'DM Sans',
  size: {
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
    : 'DM Sans',
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
    10: 46,
    11: 55,
    12: 62,
    13: 72,
    14: 92,
    15: 114,
    16: 134,
  },

  face: {
    900: { normal: 'DM Sans Bold' },
  },
})
export const monoFont = createFont({
  family: isWeb
    ? 'DM Mono, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    : 'DM Mono',
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
    10: 46,
    11: 55,
    12: 62,
    13: 72,
    14: 92,
    15: 114,
    16: 134,
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
    10: 46,
    11: 55,
    12: 62,
    13: 72,
    14: 92,
    15: 114,
    16: 134,
  },
  weight: {
    6: '400',
    7: '500',
  },
  face: {
    500: { normal: 'DM Mono' },
  },
})
