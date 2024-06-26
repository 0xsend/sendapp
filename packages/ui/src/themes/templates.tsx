import type { MaskOptions } from '@tamagui/create-theme'

export const { templates, maskOptions } = (() => {
  const templateColorsSpecific = {
    color0: 0,
    color1: 1,
    color2: 2,
    color3: 3,
    color4: 4,
    color5: 5,
    color6: 6,
    color7: 7,
    color8: 8,
    color9: 9,
    color10: 10,
    color11: 11,
    color12: 12,
  }

  // templates use the palette and specify index
  // negative goes backwards from end so -1 is the last item
  const template = {
    ...templateColorsSpecific,
    // the background, color, etc keys here work like generics - they make it so you
    // can publish components for others to use without mandating a specific color scale
    // the @tamagui/button Button component looks for `$background`, so you set the
    // dark_red_Button theme to have a stronger background than the dark_red theme.a
    // Integer value represent the index of color in 12 color palette. The palette values can be located in token-colors.ts file
    background: 0,
    backgroundHover: 1,
    backgroundPress: 0,
    backgroundFocus: 1,
    backgroundStrong: 2,
    backgroundTransparent: 'transparent',
    color: -0,
    colorHover: -1,
    colorPress: -0,
    colorFocus: -1,
    colorTransparent: 'transparent',
    borderColor: 0,
    borderColorHover: 7,
    borderColorFocus: 7,
    borderColorPress: 7,
    placeholderColor: 7,
  }

  const templates = {
    base: template,
    colorLight: {
      ...template,
      // light color themes are a bit less sensitive
      borderColor: 4,
      borderColorHover: 5,
      borderColorFocus: 4,
      borderColorPress: 4,
    },
  }

  const shadows = {
    shadowColor: 0,
    shadowColorHover: 0,
    shadowColorPress: 0,
    shadowColorFocus: 0,
  }

  const baseMaskOptions: MaskOptions = {
    override: shadows,
    skip: shadows,
  }

  const skipShadowsAndSpecificColors = {
    ...shadows,
    ...templateColorsSpecific,
  }

  const maskOptions = {
    component: {
      ...baseMaskOptions,
      override: shadows,
      skip: skipShadowsAndSpecificColors,
    },
    alt: {
      ...baseMaskOptions,
    },
    button: {
      ...baseMaskOptions,
      override: shadows,
      skip: skipShadowsAndSpecificColors,
    },
  } satisfies Record<string, MaskOptions>

  return {
    templates,
    maskOptions,
  }
})()
