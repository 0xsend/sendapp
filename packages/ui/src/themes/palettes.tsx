import { brandColors } from './colors'
import { objectFromEntries, objectKeys } from './helpers'
import { colorTokens } from './token-colors'

export const palettes = (() => {
  const getColorPalette = (colors: object, color = colors[-1]): string[] => {
    const colorPalette = Object.values(colors)
    const [head, tail] = [colorPalette.slice(0, 6), colorPalette.slice(colorPalette.length - 5)]

    return [...head, ...tail, color, color]
  }

  const lightColor = brandColors.darkest
  const darkColor = brandColors.white
  const lightPalette = [
    brandColors.white,
    brandColors.alabaster,
    brandColors.darkAlabaster,
    brandColors.silverChalice,
    brandColors.white,
    brandColors.white,
    brandColors.white,
    brandColors.white,
    brandColors.white,
    brandColors.darkAlabaster,
    brandColors.darkGrayTextField,
    brandColors.darkest,
    brandColors.darkest,
  ]

  const darkPalette = [
    brandColors.darkest,
    brandColors.aztec,
    brandColors.lunarGreen,
    brandColors.mineShaft,
    brandColors.darkGrayTextField,
    brandColors.darkest,
    brandColors.darkest,
    brandColors.darkest,
    brandColors.darkest,
    brandColors.darkGrayTextField,
    brandColors.silverChalice,
    brandColors.white,
    brandColors.white,
  ]

  const lightPalettes = objectFromEntries(
    objectKeys(colorTokens.light).map(
      (key) => [`light_${key}`, getColorPalette(colorTokens.light[key], lightColor)] as const
    )
  )

  const darkPalettes = objectFromEntries(
    objectKeys(colorTokens.dark).map(
      (key) => [`dark_${key}`, getColorPalette(colorTokens.dark[key], darkColor)] as const
    )
  )

  const colorPalettes = {
    ...lightPalettes,
    ...darkPalettes,
  }

  return {
    light: lightPalette,
    dark: darkPalette,
    ...colorPalettes,
  }
})()
