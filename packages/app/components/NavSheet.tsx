import { Sheet, type SheetProps, isWeb, Button, Stack, Separator } from '@my/ui'
import { IconX } from './icons'
import { useNav, type Nav } from 'app/routers/params'

export function NavSheet({ children, open, navId, ...props }: SheetProps & { navId: Nav['nav'] }) {
  const [nav, setNavParam] = useNav()
  const onOpenChange = () => {
    if (open) setNavParam(navId, { webBehavior: 'replace' })
    else setNavParam(undefined, { webBehavior: 'replace' })
  }
  return (
    <Sheet
      disableDrag
      modal
      animation={'quick'}
      dismissOnSnapToBottom
      snapPointsMode="fit"
      open={nav === navId}
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
