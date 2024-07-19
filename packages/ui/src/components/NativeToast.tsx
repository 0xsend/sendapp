import { Toast, useToastState } from '@tamagui/toast'
import { YStack, Theme } from 'tamagui'

export const NativeToast = () => {
  const currentToast = useToastState()

  if (!currentToast || currentToast.isHandledNatively) {
    return null
  }

  return (
    <Theme name={currentToast?.customData?.theme}>
      <Toast
        key={currentToast.id}
        duration={currentToast.duration}
        viewportName={currentToast.viewportName}
        enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
        exitStyle={{ opacity: 0, scale: 1, y: -20 }}
        y={0}
        opacity={1}
        scale={1}
        animation="quick"
        bw={1}
        boc="color12"
        $theme-dark={{ boc: '$primary' }}
      >
        <YStack py="$1.5" px="$2">
          <Toast.Title>{currentToast.title}</Toast.Title>
          {!!currentToast.message && <Toast.Description>{currentToast.message}</Toast.Description>}
        </YStack>
      </Toast>
    </Theme>
  )
}
