import { XStack, YStackProps, XStackProps } from "@my/ui";
import { ReactElement } from "react";


export const SideBarWrapper = ({ children, sidebar, ...props }: { children?: React.ReactNode, sidebar: ReactElement<YStackProps> } & XStackProps) => {
  return (
    <XStack {...props}>
      {sidebar}
      {children}
    </XStack>
  )
}