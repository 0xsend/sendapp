import { styled, ButtonText, ButtonIcon, ButtonContext } from 'tamagui'
import { withStaticProperties } from '@tamagui/helpers'
import { Link } from './Link'

import { getButtonSized } from '@tamagui/get-button-sized'

const BUTTON_NAME = 'Button'

const LinkButtonFrame = styled(Link, {
  name: BUTTON_NAME,
  tag: 'a',
  context: ButtonContext,
  role: 'button',

  variants: {
    unstyled: {
      false: {
        display: 'flex',
        size: '$true',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'nowrap',
        flexDirection: 'row',
        cursor: 'pointer',

        bc: '$background',
        hoverStyle: {
          bc: '$backgroundHover',
        },
        pressStyle: {
          bc: '$backgroundPress',
        },
        focusStyle: {
          bc: '$backgroundFocus',
        },

        borderWidth: 1,
        borderColor: 'transparent',

        focusVisibleStyle: {
          outlineColor: '$outlineColor',
          outlineStyle: 'solid',
          outlineWidth: 2,
        },
      },
    },

    variant: {
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '$borderColor',
        color: '$borderColor',
        hoverStyle: {
          backgroundColor: 'transparent',
          borderColor: '$borderColorHover',
        },

        pressStyle: {
          backgroundColor: 'transparent',
          borderColor: '$borderColorPress',
        },

        focusVisibleStyle: {
          backgroundColor: 'transparent',
          borderColor: '$borderColorFocus',
        },
      },
    },

    size: {
      '...size': getButtonSized,
      ':number': getButtonSized,
    },

    disabled: {
      true: {
        pointerEvents: 'none',
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === '1' ? true : false,
  },
})

export const LinkButton = withStaticProperties(LinkButtonFrame, {
  Text: ButtonText,
  Icon: ButtonIcon,
})

export type LinkButtonProps = React.ComponentProps<typeof LinkButtonFrame>
