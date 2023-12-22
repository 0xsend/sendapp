import { Button, ButtonIcon, ButtonText, Link, type LinkProps } from "@my/ui";
import { type ReactElement } from "react";

export function SideBarNavLink({ icon, text, isActive, ...props }: { icon?: ReactElement, text: string, isActive: boolean } & Omit<LinkProps, "children">): ReactElement {

  return (
    <Link {...props} href={props.disabled ? "" : props.href} >
      <Button disabled={props.disabled} color={isActive ? "$white" : "$gold10"} bg={isActive ? "$gold7" : "transparent"} hoverStyle={{ scale: "105%" }} fontSize={"$4"} fontFamily={"$heading"}>
        <ButtonIcon>
          {icon}
        </ButtonIcon>
        <ButtonText fontWeight={isActive ? "bold" : "normal"}>{text}</ButtonText>
      </Button>
    </Link >
  )
}