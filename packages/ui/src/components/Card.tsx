import { ThemeableStack } from '@tamagui/stacks'
import type { GetProps, SizeTokens } from '@tamagui/web'
import type { ViewProps } from 'tamagui'
import { createStyledContext, isWeb, styled, withStaticProperties } from '@tamagui/web'

const CardContext = createStyledContext({
  size: '$true' as SizeTokens,
})

// TODO: refactor onces new themes are ready
export const CardFrame = styled(ThemeableStack, {
  name: 'Card',
  context: CardContext,
  '$theme-dark':
    process.env.TAMAGUI_TARGET === 'web'
      ? {
          shadowColor: '$shadowColor',
          shadowOpacity: 1,
        }
      : {},
  variants: {
    unstyled: {
      false: {
        //@ts-ignore
        size: '$true',
        backgroundColor: '$background',
        position: 'relative',
        elevation: process.env.TAMAGUI_TARGET === 'web' ? '$0.75' : '$0.25',
        shadowOpacity: process.env.TAMAGUI_TARGET === 'web' ? 0.3 : 0.1,
      },
    },
    materialInteractive: {
      true: (isWeb
        ? {
            cursor: 'pointer',
            tag: 'button',
            role: 'button',
            focusable: true,
            hoverStyle: {
              elevation: '$1',
              shadowOpacity: 0.3,
              scale: 1.005,
            },
            pressStyle: {
              elevation: '$0.75',
              shadowOpacity: 0.3,
              scale: 1,
            },
            focusVisibleStyle: {
              elevation: '$1',
              shadowOpacity: 0.3,
              scale: 1.005,
            },
            '$platform-web': {
              transition:
                'box-shadow 150ms linear, background-color 150ms linear, transform 50ms ease-out',
              willChange: 'transform',
            },
            '$theme-dark': {
              elevation: '$0.75',
              hoverStyle: {
                shadowOpacity: 1,
                backgroundColor: '$aztec3',
                scale: 1.005,
              },
              pressStyle: {
                shadowOpacity: 1,
                scale: 1,
              },
              focusVisibleStyle: {
                shadowOpacity: 1,
                backgroundColor: '$aztec3',
                scale: 1.005,
              },
            },
          }
        : {}) as ViewProps,
    },

    size: {
      '...size': (val, { tokens }) => {
        return {
          borderRadius: tokens.radius[val] ?? val,
        }
      },
    },
  } as const,

  defaultVariants: {
    //@ts-ignore
    unstyled: process.env.TAMAGUI_HEADLESS === '1',
  },
})

export const CardHeader = styled(ThemeableStack, {
  name: 'CardHeader',
  context: CardContext,

  variants: {
    unstyled: {
      false: {
        zIndex: 10,
        backgroundColor: 'transparent',
        marginBottom: 'auto',
      },
    },

    size: {
      '...size': (val, { tokens }) => {
        return {
          padding: tokens.space[val] ?? val,
        }
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === '1',
  },
})

export const CardFooter = styled(CardHeader, {
  name: 'CardFooter',

  variants: {
    unstyled: {
      false: {
        zIndex: 5,
        flexDirection: 'row',
        marginTop: 'auto',
        marginBottom: 0,
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === '1',
  },
})

export const CardBackground = styled(ThemeableStack, {
  name: 'CardBackground',

  variants: {
    unstyled: {
      false: {
        zIndex: 0,
        fullscreen: true,
        overflow: 'hidden',
        pointerEvents: 'none',
        padding: 0,
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === '1',
  },
})

export type CardHeaderProps = GetProps<typeof CardHeader>
export type CardFooterProps = GetProps<typeof CardFooter>
export type CardProps = GetProps<typeof CardFrame>

export const Card = withStaticProperties(CardFrame, {
  Header: CardHeader,
  Footer: CardFooter,
  Background: CardBackground,
})
