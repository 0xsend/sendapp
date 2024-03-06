import { shorthands } from '@tamagui/shorthands'
import { createTokens } from '@tamagui/web'
import { createTamagui } from 'tamagui'
import { animations } from './config/animations'
import { bodyFont, headingFont, monoFont } from './config/fonts'
import { media, mediaQueryDefaultActive } from './config/media'
import { radius } from './themes/token-radius'
import { size } from './themes/token-size'
import { space } from './themes/token-space'
import { zIndex } from './themes/token-z-index'

import * as themesIn from './themes/theme-generated'
import { color } from './themes/token-colors'

/**
 * This avoids shipping themes as JS. Instead, Tamagui will hydrate them from CSS.
 */
const shipThemes = process.env.NODE_ENV !== 'production' || process.env.TAMAGUI_IS_SERVER
const themes = shipThemes ? themesIn : ({} as typeof themesIn)

const conf = {
  themes,
  defaultFont: 'body',
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
    mono: monoFont,
  },
  tokens: createTokens({
    color,
    radius,
    zIndex,
    space,
    size,
  }),
  media,
} satisfies Parameters<typeof createTamagui>['0']

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - passing this directly breaks TS types
conf.mediaQueryDefaultActive = mediaQueryDefaultActive

export const config = createTamagui(conf)
