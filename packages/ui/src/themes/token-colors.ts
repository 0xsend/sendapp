import type { Variable } from '@tamagui/web'
import {
  blue,
  blueDark,
  gray,
  grayDark,
  orange,
  orangeDark,
  pink,
  pinkDark,
  purple,
  purpleDark,
  red,
  redDark,
  yellow,
  yellowDark,
  gold,
  goldDark,
} from '@tamagui/colors'

import { brandColors, greenPalette, aztec, neon } from './colors'

export const colorTokens = {
  light: {
    blue: blue,
    gray: gray,
    green: greenPalette.light,
    neon: neon.light,
    orange: orange,
    pink: pink,
    purple: purple,
    red: red,
    yellow: yellow,
    gold: gold,
    aztec: aztec.light,
  },
  dark: {
    blue: blueDark,
    gray: grayDark,
    green: greenPalette.dark,
    neon: neon.dark,
    orange: orangeDark,
    pink: pinkDark,
    purple: purpleDark,
    red: redDark,
    yellow: yellowDark,
    gold: goldDark,
    aztec: aztec.dark,
  },
}

export const darkColors = {
  ...colorTokens.dark.blue,
  ...colorTokens.dark.gray,
  ...colorTokens.dark.green,
  ...colorTokens.dark.neon,
  ...colorTokens.dark.orange,
  ...colorTokens.dark.pink,
  ...colorTokens.dark.purple,
  ...colorTokens.dark.red,
  ...colorTokens.dark.yellow,
  ...colorTokens.dark.gold,
  ...colorTokens.dark.aztec,
}

export const lightColors = {
  ...colorTokens.light.blue,
  ...colorTokens.light.gray,
  ...colorTokens.light.green,
  ...colorTokens.light.neon,
  ...colorTokens.light.orange,
  ...colorTokens.light.pink,
  ...colorTokens.light.purple,
  ...colorTokens.light.red,
  ...colorTokens.light.yellow,
  ...colorTokens.light.gold,
  ...colorTokens.light.aztec,
}

export const color = {
  ...postfixObjKeys(lightColors, 'Light'),
  ...postfixObjKeys(darkColors, 'Dark'),
  ...brandColors,
}

function postfixObjKeys<A extends { [key: string]: Variable<string> | string }, B extends string>(
  obj: A,
  postfix: B
): {
  [Key in `${keyof A extends string ? keyof A : never}${B}`]: Variable<string> | string
} {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [`${k}${postfix}`, v])) as never
}
