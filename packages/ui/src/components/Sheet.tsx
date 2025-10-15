import { Sheet as TSheet } from '@tamagui/sheet'

import { useState, useEffect } from 'react'
import { YStack, createStyledContext, isWeb, withStaticProperties } from 'tamagui'

const SheetIosModalContext = createStyledContext<{
  isBackgroundScaleApplied: boolean
  onBackgroundScaleChange: React.Dispatch<React.SetStateAction<boolean>>
}>()

interface UseSheetIosBackgroundScaleProps {
  isSheetOpen: boolean
  onSheetOpenChange?: (value: boolean) => void
  enabled: boolean
}

export const useSheetIosBackgroundScale = ({
  isSheetOpen,
  onSheetOpenChange,
  enabled,
}: UseSheetIosBackgroundScaleProps) => {
  const context = SheetIosModalContext.useStyledContext()

  // biome-ignore lint/correctness/useExhaustiveDependencies: this is fine
  useEffect(() => {
    return () => {
      context?.onBackgroundScaleChange(false)
      onSheetOpenChange?.(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    context?.onBackgroundScaleChange(isSheetOpen)
  }, [isSheetOpen, context?.onBackgroundScaleChange, enabled])

  return context
}

/**
 * Web only
 * make the background page to scale down to mimic iOS modal sheet */
export const SheetIosBackgroundScale = YStack.styleable(({ children, ...props }) => {
  const [isBackgroundScaleApplied, setIsBackgroundScaleApplied] = useState(false)

  if (!isWeb) return children

  return (
    <SheetIosModalContext.Provider
      isBackgroundScaleApplied={isBackgroundScaleApplied}
      onBackgroundScaleChange={setIsBackgroundScaleApplied}
    >
      <YStack
        h="100%"
        bg="$background"
        animation={isBackgroundScaleApplied ? '200ms' : '200ms'}
        br={isBackgroundScaleApplied ? 20 : 0}
        scale={isBackgroundScaleApplied ? 0.9 : 1}
        y={isBackgroundScaleApplied ? -60 : 0}
        animateOnly={['transform', 'opacity']}
        transformOrigin="bottom"
        $platform-web={{
          transition: `border-radius  200ms ease ${isBackgroundScaleApplied ? '0ms' : '100ms'}`,
          willChange: 'transform',
          height: '100%',
          minHeight: '100%',
        }}
        {...props}
      >
        {children}
      </YStack>
    </SheetIosModalContext.Provider>
  )
})

export const Sheet = withStaticProperties(TSheet, {
  SheetIosBackgroundScale,
  useSheetIosBackgroundScale,
  Frame: TSheet.Frame,
  Overlay: TSheet.Overlay,
  Handle: TSheet.Handle,
})
