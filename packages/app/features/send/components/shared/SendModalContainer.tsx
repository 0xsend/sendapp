import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { isWeb, useMedia, useSafeAreaInsets, View } from '@my/ui'
import { isAndroid } from '@tamagui/constants'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'

export interface SendModalContainerProps {
  children: React.ReactNode
  open: boolean
  setOpen: (open: boolean) => void
  bottomSheetRef: React.RefObject<BottomSheet>
}

const DragHandle = () =>
  isWeb ? null : (
    <View
      ai="center"
      jc="center"
      width="100%"
      height={isAndroid ? 20 : 1}
      y={isAndroid ? 10 : 0}
      hitSlop={{ top: 20, bottom: 20, left: 0, right: 0 }}
      collapsable={false}
    />
  )

export const SendModalContainer = ({
  children,
  open,
  setOpen,
  bottomSheetRef,
}: SendModalContainerProps) => {
  const { lg } = useMedia()
  const { bottom, top } = useSafeAreaInsets()

  const [render, setRender] = useState(false)

  const renderHandle = useCallback(() => <DragHandle />, [])

  useEffect(() => {
    if (open) {
      setRender(true)
    }
  }, [open])

  if (lg && render) {
    return (
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['95%']}
        style={{ backgroundColor: 'transparent' }}
        enableDynamicSizing={false}
        enablePanDownToClose
        enableContentPanningGesture={false}
        detached
        onClose={() => {
          setOpen(false)
        }}
        animationConfigs={{
          damping: 35,
          stiffness: 400,
        }}
        handleComponent={renderHandle}
        backgroundStyle={{
          backgroundColor: 'transparent',
        }}
        bottomInset={bottom || 10}
        topInset={top}
        // @ts-expect-error - keyboardBehavior restore value is not typed properly
        keyboardBehavior="restore"
      >
        <BottomSheetView
          style={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            flex: 1,
            height: '100%',
          }}
        >
          {children}
        </BottomSheetView>
      </BottomSheet>
    )
  }

  if (!lg) {
    return (
      <View p="$8" jc="center" ai="flex-end" pos="absolute" inset={0} zi={1000}>
        {children}
      </View>
    )
  }

  return null
}
