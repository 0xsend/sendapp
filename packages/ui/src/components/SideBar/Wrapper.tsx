import { ReactElement } from 'react'
import { XStack, XStackProps, YStackProps } from 'tamagui'

export const SideBarWrapper = ({
  children,
  sidebar,
  ...props
}: { children?: ReactElement; sidebar: ReactElement<YStackProps> } & XStackProps) => {
  return (
    <XStack {...props}>
      {sidebar}
      {children}
    </XStack>
  )
}
