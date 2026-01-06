import { forwardRef, memo } from 'react'
import {
  styled,
  ButtonText,
  ButtonIcon,
  ButtonContext,
  Button,
  type ButtonProps,
  useEvent,
} from 'tamagui'
import { withStaticProperties } from '@tamagui/helpers'
import { useLink, type LinkProps } from 'solito/link'
import type { TamaguiElement } from '@tamagui/core'

import { getButtonSized } from '@tamagui/get-button-sized'
import { usePrefetch } from '../hooks/usePrefetch'
const BUTTON_NAME = 'Button'

const LinkableButtonFrame = styled(Button, {
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
        opacity: 0.5,
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === '1',
  },
})

const LinkableButtonFrameMemoized = memo(LinkableButtonFrame)
LinkableButtonFrameMemoized.displayName = 'LinkableButtonFrameMemoized'

const LinkableButton_ = forwardRef<TamaguiElement, LinkableButtonProps>(
  ({ href, prefetch, ...props }, ref) => {
    const { onPress: linkOnPress, ...linkProps } = useLink({ href })
    usePrefetch(prefetch ? href?.toString() : undefined)

    const handlePress = useEvent((e) => {
      e.stopPropagation()
      linkOnPress(e)
    })

    return <LinkableButtonFrameMemoized ref={ref} onPress={handlePress} {...props} {...linkProps} />
  }
)

export const LinkableButton = withStaticProperties(LinkableButton_, {
  Text: memo(ButtonText),
  Icon: memo(ButtonIcon),
})
LinkableButton.Icon.displayName = 'LinkableButton.Icon'
LinkableButton.Text.displayName = 'LinkableButton.Text'

LinkableButton.displayName = 'LinkableButton'

export type LinkableButtonProps = Omit<ButtonProps, 'href'> & LinkProps
