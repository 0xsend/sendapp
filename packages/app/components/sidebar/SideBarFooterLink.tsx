import { Button, ButtonIcon, Link } from '@my/ui'
import type { LinkProps } from '@my/ui'
import type { ReactElement } from 'react'

export const SideBarFooterLink = ({
  icon,
  ...props
}: { icon?: ReactElement; text?: string } & Omit<LinkProps, 'children'>): ReactElement => {
  return (
    <Link {...props}>
      <Button borderRadius={9999}>
        <ButtonIcon>{icon}</ButtonIcon>
      </Button>
    </Link>
  )
}
