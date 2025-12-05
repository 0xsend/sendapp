import { Toast, useToastState } from '@tamagui/toast'
import { YStack, XStack } from 'tamagui'
import { useSafeAreaInsets } from '../utils'
import { AlertTriangle } from '@tamagui/lucide-icons'

const errorStyles = {
  boc: '$red7',
  bw: 1,
} as const

export const NativeToast = () => {
  const currentToast = useToastState()
  const { top } = useSafeAreaInsets()

  if (!currentToast || currentToast.isHandledNatively) {
    return null
  }

  const isError = currentToast.burntOptions?.preset === 'error'

  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      viewportName={currentToast.viewportName}
      enterStyle={{ opacity: 0, scale: 0.8, y: -100 }}
      exitStyle={{ opacity: 0, scale: 0.8, y: -100 }}
      y={0}
      opacity={1}
      scale={1}
      animation="smoothResponsive"
      bg="$aztec3"
      maxWidth="$22"
      mt={top}
      elevation="$6"
      $theme-light={{
        elevation: '$6',
        shadowOpacity: 0.3,
        bg: '#fff',
      }}
      o={0.8}
      br="$6"
      {...(isError ? errorStyles : {})}
    >
      <XStack
        y={-2}
        ai="flex-start"
        w="100%"
        p={isError ? '$3' : '$2'}
        py={isError ? '$1.5' : '$2'}
      >
        {isError && (
          <XStack pos="absolute" x="-150%" y="5%">
            <AlertTriangle size={16} color="$red9" />
          </XStack>
        )}
        <YStack gap="$1.5" fs={0}>
          <Toast.Title>{currentToast.title}</Toast.Title>
          {!!currentToast.message && (
            <Toast.Description col="$gray11">{currentToast.message}</Toast.Description>
          )}
        </YStack>
      </XStack>
    </Toast>
  )
}
