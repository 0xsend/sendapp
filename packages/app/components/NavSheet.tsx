import { Sheet, type SheetProps, isWeb, Button, Stack, Separator } from '@my/ui'
import { IconX } from './icons'
import { type RootParams, useRootScreenParams } from 'app/routers/params'

export function NavSheet({
  children,
  open,
  navId,
  ...props
}: SheetProps & { navId: RootParams['nav'] }) {
  const [queryParams, setRootParams] = useRootScreenParams()
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
      <Sheet.Frame zIndex={1} height={isWeb ? '100vh' : '100%'}>
        <Stack w="100%" ai="flex-end" jc="flex-end" px="$6" pt="$6" pb="$2">
          <Button
            size="$4"
            transparent
            chromeless
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ backgroundColor: 'transparent' }}
            focusStyle={{ backgroundColor: 'transparent' }}
            circular
            icon={<IconX size="$3" $theme-light={{ color: '$color12' }} color="$color9" />}
            onPress={() => onOpenChange()}
            theme="accent"
          />
        </Stack>
        <Separator $theme-dark={{ bc: '$decay' }} />
        <Stack p="$6" f={1} justifyContent="space-around">
          {children}
        </Stack>
      </Sheet.Frame>
    </Sheet>
  )
}
