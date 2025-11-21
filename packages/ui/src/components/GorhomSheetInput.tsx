import { styled } from 'tamagui'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'

import type { SizeVariantSpreadFunction } from '@tamagui/core'
import { getVariableValue, isWeb } from '@tamagui/core'
import { getButtonSized } from '@tamagui/get-button-sized'
import { getFontSized } from '@tamagui/get-font-sized'
import { getSpace } from '@tamagui/get-token'

// Note: following ignores are fine as we are copying tamagui code

// biome-ignore lint/style/useDefaultParameterLast:
// biome-ignore lint/suspicious/noExplicitAny:
export const inputSizeVariant: SizeVariantSpreadFunction<any> = (val = '$true', extras) => {
  if (extras.props.multiline || extras.props.numberOfLines > 1) {
    return textAreaSizeVariant(val, extras)
  }
  const buttonStyles = getButtonSized(val, extras)
  const paddingHorizontal = getSpace(val, {
    shift: -1,
    bounds: [2],
  })
  // biome-ignore lint/suspicious/noExplicitAny:
  const fontStyle = getFontSized(val as any, extras)
  // lineHeight messes up input on native
  if (!isWeb && fontStyle) {
    // biome-ignore lint/performance/noDelete:
    // biome-ignore lint/complexity/useLiteralKeys:
    delete fontStyle['lineHeight']
  }
  return {
    ...fontStyle,
    ...buttonStyles,
    paddingHorizontal,
  }
}

// biome-ignore lint/style/useDefaultParameterLast:
// biome-ignore lint/suspicious/noExplicitAny:
export const textAreaSizeVariant: SizeVariantSpreadFunction<any> = (val = '$true', extras) => {
  const { props } = extras
  const buttonStyles = getButtonSized(val, extras)

  // biome-ignore lint/suspicious/noExplicitAny: this is fine, copied from tamagui
  // biome-ignore lint/style/noNonNullAssertion: this is fine, copied from tamagui
  const fontStyle = getFontSized(val as any, extras)!
  const lines = props.rows ?? props.numberOfLines
  const height = typeof lines === 'number' ? lines * getVariableValue(fontStyle.lineHeight) : 'auto'
  const paddingVertical = getSpace(val, {
    shift: -2,
    bounds: [2],
  })
  const paddingHorizontal = getSpace(val, {
    shift: -1,
    bounds: [2],
  })
  return {
    ...buttonStyles,
    ...fontStyle,
    paddingVertical,
    paddingHorizontal,
    height,
  }
}

const defaultStyles = {
  size: '$true',
  fontFamily: '$body',
  borderWidth: 1,
  outlineWidth: 0,
  color: '$color',

  ...(isWeb
    ? {
        tabIndex: 0 as const,
      }
    : {
        focusable: true,
      }),

  borderColor: '$borderColor',
  backgroundColor: '$background',

  // this fixes a flex bug where it overflows container
  minWidth: 0,

  hoverStyle: {
    borderColor: '$borderColorHover',
  },

  focusStyle: {
    borderColor: '$borderColorFocus',
  },

  focusVisibleStyle: {
    outlineColor: '$outlineColor',
    outlineWidth: 2,
    outlineStyle: 'solid',
  },
} as const

export const GorhomSheetInput = styled(
  BottomSheetTextInput,
  {
    name: 'Input',

    variants: {
      unstyled: {
        false: defaultStyles,
      },

      size: {
        '...size': inputSizeVariant,
      },

      disabled: {
        true: {},
      },
    } as const,

    defaultVariants: {
      unstyled: process.env.TAMAGUI_HEADLESS === '1',
    },
  },
  {
    isInput: true,

    accept: {
      placeholderTextColor: 'color',
      selectionColor: 'color',
    } as const,
  }
)
