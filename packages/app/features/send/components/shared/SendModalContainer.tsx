import type React from 'react'
import { useEffect, useState } from 'react'
import { useMedia, useSafeAreaInsets, View } from '@my/ui'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'

export interface SendModalContainerProps {
  children: React.ReactNode
  open: boolean
  setOpen: (open: boolean) => void
  bottomSheetRef: React.RefObject<BottomSheet>
}

export const SendModalContainer = ({
  children,
  open,
  setOpen,
  bottomSheetRef,
}: SendModalContainerProps) => {
  const { lg } = useMedia()
  const { bottom, top } = useSafeAreaInsets()

  const [render, setRender] = useState(false)

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
        detached
        onClose={() => {
          setOpen(false)
        }}
        animationConfigs={{
          damping: 35,
          stiffness: 400,
        }}
        handleComponent={null}
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
