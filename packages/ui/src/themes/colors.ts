export const brandColors = {
  primary: '#40FB50',
  charcoal: '#081619',
  white: '#FFFFFF',
  black: '#122023',
  networkLightEthereum: '#393939',
  networkDarkEthereum: '#e6e6e6',
  networkOptimism: '#FA2B39',
  networkPolygon: '#a26af3',
  networkArbitrum: '#28A0F0',
  networkBase: '#2151F5',
  networkBnb: '#F0B90B',
  fiatOnRampBanner: '#FB36D0',
  khaki900: '#9f7750',
  khaki: '#C3B29E',
  cinereous: '#1D1D20',
  olive: '#86AE80',
  decay: '#3E4A3C',
  darkest: '#081619',
  jet: '#343434',
  metalTouch: '#1C2A2D',
  darkGrayTextField: '#666666', // hsla(0, 0%, 40%, 1)
  lightGrayTextField: '#B3B3B3', // hsla(0, 0%, 70%, 1)
  error: '#DE4747', // hsla(0, 70%, 57%, 1)
  warning: '#FFD66E', // hsla(43, 100%, 72%, 1)
  everglade: '#1E461F',
  bottleGreen: '#0B4129',
  darkBottleGreen: '#082B1B',
  jewel: '#12643F',
  alabaster: '#F7F7F7',
  darkAlabaster: '#E6E6E6',
  silverChalice: '#B2B2B2',
  aztec: '#111f22',
  lunarGreen: '#3E4A3C',
  mineShaft: '#343434',
} as const

export const greenPalette = {
  light: {
    green1: brandColors.white,
    green2: brandColors.primary,
    green3: brandColors.olive,
    green4: brandColors.bottleGreen,
    green5: brandColors.primary,
    green6: brandColors.white,
    green7: brandColors.white,
    green8: brandColors.white,
    green9: brandColors.primary,
    green10: brandColors.olive,
    green11: brandColors.bottleGreen,
    green12: brandColors.darkest,
  },
  dark: {
    green1: brandColors.darkest,
    green2: brandColors.darkBottleGreen,
    green3: brandColors.olive,
    green4: brandColors.jewel,
    green5: brandColors.primary,
    green6: brandColors.darkest,
    green7: brandColors.darkest,
    green8: brandColors.darkest,
    green9: brandColors.decay,
    green10: brandColors.olive,
    green11: brandColors.primary,
    green12: brandColors.white,
  },
}
