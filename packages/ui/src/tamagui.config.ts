import { defaultConfig } from '@tamagui/config/v4'
import { shorthands } from '@tamagui/shorthands'
import { createTokens, createTamagui, setupDev } from 'tamagui'

import { animations } from './config/animations'
import { bodyFont, headingFont, monoFont } from './config/fonts'
import { media, mediaQueryDefaultActive } from './config/media'
import { themes as themesGen } from './themes/theme-generated'
import { color } from './themes/token-colors'
import { radius } from './themes/token-radius'
import { size } from './themes/token-size'
import { space } from './themes/token-space'
import { zIndex } from './themes/token-z-index'

setupDev({
  // can just be true as well for defaulting to key: Alt + delay: 800
  visualizer: {
    key: 'Alt',
    delay: 800,
  },
})
/**
 * This avoids shipping themes as JS. Instead, Tamagui will hydrate them from CSS.
 */

const themes =
  process.env.TAMAGUI_TARGET !== 'web' || process.env.TAMAGUI_IS_SERVER || process.env.STORYBOOK
    ? themesGen
    : ({} as typeof themesGen)

export const config = createTamagui({
  ...defaultConfig,
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
  mediaQueryDefaultActive,
  selectionStyles: (theme) => ({
    backgroundColor: theme.color5,
    color: theme.color11,
  }),
  settings: {
    allowedStyleValues: 'somewhat-strict',
    autocompleteSpecificTokens: 'except-special',
    fastSchemeChange: true,
  },
})
