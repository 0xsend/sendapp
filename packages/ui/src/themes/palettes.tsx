import { brandColors } from './colors'
import { objectFromEntries, objectKeys } from './helpers'
import { colorTokens } from './token-colors'

export const palettes = (() => {
  const getColorPalette = (colors: object, color = colors[-1]): string[] => {
    const colorPalette = Object.values(colors)
    const [head, tail] = [colorPalette.slice(0, 6), colorPalette.slice(colorPalette.length - 5)]

    return [...head, ...tail, color, color]
  }

  const lightColor = 'hsla(0, 0%, 0%, 1)'
  const darkColor = 'hsla(0, 0%, 100%, 1)'
  const lightPalette = [
    'hsla(0, 0%, 100%, 1)',
    'hsla(0, 0%, 97%, 1)',
    'hsla(0, 0%, 88%, 1)',
    'hsla(0, 0%, 83%, 1)',
    'hsla(0, 0%, 77%, 1)',
    'hsla(0, 0%, 72%, 1)',
    'hsla(0, 0%, 66%, 1)',
    'hsla(0, 0%, 61%, 1)',
    'hsla(0, 0%, 50%, 1)',
    'hsla(0, 0%, 45%, 1)',
    'hsla(96, 16%, 25%, 1)',
    'hsla(191, 52%, 6%, 1)',
    'hsla(191, 52%, 6%, 1)',
  ]

  const darkPalette = [
    'hsla(191, 52%, 6%, 1)',
    'hsla(191, 32%, 10%, 1)',
    'hsla(0, 0%, 20%, 1)',
    'hsla(111, 10%, 26%, 1)',
    'hsla(111, 22%, 19%, 1)',
    'hsla(113, 22%, 24%, 1)',
    'hsla(112, 22%, 32%, 1)',
    'hsla(0, 0%, 70%, 1)',
    'hsla(112, 22%, 50%, 1)',
    'hsla(112, 22%, 59%, 1)',
    'hsla(112, 22%, 64%, 1)',
    'hsla(0, 0%, 100%, 1)',
    'hsla(0, 0%, 100%, 1)',
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
