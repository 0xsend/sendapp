import { Button, Container, Sheet, type SheetProps, Stack } from '@my/ui'
import { IconSendLogo, IconX } from './icons'
import { type RootParams, useRootScreenParams } from 'app/routers/params'
import { Link } from 'solito/link'

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
      animation={'200ms'}
      dismissOnSnapToBottom
      snapPoints={[100]}
      open={queryParams.nav === navId}
      onOpenChange={onOpenChange}
      {...props}
    >
      <Sheet.Overlay />
      <Sheet.Frame zIndex={1} pt="$6" pb="$2">
        <Container safeArea="t" w="100%" ai="center" jc="space-between" f={'unset'}>
          <Link href="/">
            <IconSendLogo size={'$2.5'} color={'$color12'} />
          </Link>
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
        </Container>
        <Stack p="$4" f={1} justifyContent="space-around">
          {children}
        </Stack>
      </Sheet.Frame>
    </Sheet>
  )
}
