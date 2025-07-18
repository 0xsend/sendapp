import { styled, ButtonText, ButtonIcon, ButtonContext, Button, type ButtonProps } from 'tamagui'
import { withStaticProperties } from '@tamagui/helpers'
import { useLink, type LinkProps } from 'solito/link'

import { getButtonSized } from '@tamagui/get-button-sized'

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

const LinkableButton_ = ({ href, ...props }: LinkableButtonProps) => {
  const { onPress: linkOnPress, ...linkProps } = useLink({ href })
  return (
    <LinkableButtonFrame
      onPress={(e) => {
        e.stopPropagation()
        linkOnPress(e)
      }}
      {...props}
      {...linkProps}
    />
  )
}

export const LinkableButton = withStaticProperties(LinkableButton_, {
  Text: ButtonText,
  Icon: ButtonIcon,
})

export type LinkableButtonProps = Omit<ButtonProps, 'href'> & LinkProps
