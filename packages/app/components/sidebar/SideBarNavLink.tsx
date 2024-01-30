import { Button, ButtonIcon, ButtonText, Link, Theme, type LinkProps } from '@my/ui'
import { usePathname } from 'app/utils/usePathname'
import { type ReactElement } from 'react'

export function SideBarNavLink({
  icon,
  text,
  ...props
}: { icon?: ReactElement; text: string } & Omit<LinkProps, 'children'>): ReactElement {
  const location = usePathname()
  const isActiveRoute = location === props.href

  return (
    <Link {...props} href={props.disabled ? '' : props.href}>
      <Theme inverse={isActiveRoute}>
        <Button
          width={'100%'}
          disabled={props.disabled}
          bg={isActiveRoute ? '$background05' : 'transparent'}
          hoverStyle={{ scale: '105%' }}
          fontSize={'$4'}
          fontFamily={'$heading'}
        >
          <ButtonIcon>{icon}</ButtonIcon>
          <ButtonText f={1} fontWeight={isActiveRoute ? 'bold' : 'normal'}>
            {text}
          </ButtonText>
        </Button>
      </Theme>
    </Link>
  )
}
