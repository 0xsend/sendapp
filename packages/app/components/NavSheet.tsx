import {
  Button,
  isWeb,
  Paragraph,
  Sheet,
  type SheetProps,
  Stack,
  usePwa,
  useSafeAreaInsets,
  XStack,
} from '@my/ui'
import { IconX } from './icons'
import { type RootParams, useRootScreenParams } from 'app/routers/params'

export function NavSheet({
  children,
  open,
  navId,
  ...props
}: SheetProps & { navId: RootParams['nav'] }) {
  const [queryParams, setRootParams] = useRootScreenParams()
  const isPwa = usePwa()
  const { sat } = useSafeAreaInsets()
  const onOpenChange = () => {
    if (open) setRootParams({ ...queryParams, nav: navId }, { webBehavior: 'replace' })
    else setRootParams({ ...queryParams, nav: undefined }, { webBehavior: 'replace' })
  }
  return (
    <Sheet
      disableDrag
      modal
      animation={'quick'}
      dismissOnSnapToBottom
      snapPointsMode="fit"
      open={queryParams.nav === navId}
      onOpenChange={onOpenChange}
      {...props}
    >
      <Sheet.Overlay />
      <Sheet.Frame zIndex={1} height={isWeb ? '100vh' : '100%'} pt={isPwa && sat}>
        <XStack w="100%" ai="center" jc="space-between" px="$4" pt="$6" pb="$2">
          <Paragraph size={'$10'}>/send</Paragraph>
          <Button
            size="$4"
            transparent
            chromeless
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ backgroundColor: 'transparent' }}
            focusStyle={{ backgroundColor: 'transparent' }}
            circular
            icon={<IconX size="$2" color="$primary" $theme-light={{ color: '$color12' }} />}
            onPress={() => onOpenChange()}
            theme="green"
          />
        </XStack>
        <Stack p="$4" f={1} justifyContent="space-around">
          {children}
        </Stack>
      </Sheet.Frame>
    </Sheet>
  )
}
