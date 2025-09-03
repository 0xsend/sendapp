import type { GetProps, SizeTokens } from '@tamagui/core'
import { styled } from '@tamagui/core'
import { BlurView } from 'expo-blur'

export type BlurStackProps = GetProps<typeof BlurStack>

// Custom variants for BlurView that are compatible with its props
const blurStackVariants = {
  backgrounded: {
    true: {
      backgroundColor: '$background',
    },
  },

  radiused: {
    true: (_, extras) => {
      const { tokens, props } = extras
      return {
        borderRadius: tokens.radius[props.size] || tokens.radius.$true,
      }
    },
  },

  transparent: {
    true: {
      backgroundColor: 'transparent',
    },
  },

  padded: {
    true: (_, extras) => {
      const { tokens, props } = extras
      return {
        padding: tokens.space[props.size] || tokens.space.$true,
      }
    },
  },

  circular: {
    true: (_, { props, tokens }) => {
      const circularStyle = {
        borderRadius: 100_000,
        padding: 0,
      }
      if (!('size' in props)) {
        return circularStyle
      }
      const size = typeof props.size === 'number' ? props.size : tokens.size[props.size]
      return {
        ...circularStyle,
        width: size,
        height: size,
        maxWidth: size,
        maxHeight: size,
        minWidth: size,
        minHeight: size,
      }
    },
  },

  fullscreen: {
    true: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  },

  chromeless: {
    true: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    all: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  },
} as const

// TODO BlurView is not working on android, its experimental feature on android
/**
 * @summary A view that arranges its children in a vertical line and applies a blur effect.
 * @description Utilizes Expo's BlurView for cross-platform blur effect.
 * @see — Docs https://docs.expo.dev/versions/latest/sdk/blur-view/
 * @see — Docs https://tamagui.dev/ui/stacks#xstack-ystack-zstack
 */
export const BlurStack = styled(
  BlurView,
  {
    name: 'BlurStack',
    display: 'flex',
    flexDirection: 'column',
    variants: blurStackVariants,
  },
  {
    defaultProps: {
      experimentalBlurMethod: 'dimezisBlurView',
      intensity: 10,
    },
  }
)

BlurStack.displayName = 'BlurStack'

// Export additional Stack variants
export const BlurXStack = styled(BlurStack, {
  flexDirection: 'row',
})

BlurXStack.displayName = 'BlurXStack'

export const BlurZStack = styled(
  BlurStack,
  {
    position: 'relative',
  },
  {
    neverFlatten: true,
    isZStack: true,
  }
)

BlurZStack.displayName = 'BlurZStack'
