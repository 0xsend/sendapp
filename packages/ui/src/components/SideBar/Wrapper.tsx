import type { ReactElement } from 'react'
import { XStack, type XStackProps, type YStackProps } from 'tamagui'

export const SideBarWrapper = ({
  children,
  sidebar,
  ...props
}: { children?: React.ReactNode; sidebar: ReactElement<YStackProps> } & XStackProps) => {
  return (
    <XStack height={'100%'} {...props}>
      {sidebar}
      {children}
    </XStack>
  )
}
