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
import { setupDev } from '@tamagui/core'

setupDev({
  // can just be true as well for defaulting to key: Alt + delay: 800
  visualizer: {
    key: 'Alt',
    delay: 800,
  },
})

import * as themes from './themes/theme-generated'
import { color } from './themes/token-colors'

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
    mono: process.env.NODE_ENV === 'test' && monoFont === undefined ? bodyFont : monoFont, // monoFont doesn't work in jest tests for some reason
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
