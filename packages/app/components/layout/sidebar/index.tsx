
import { SideBar as SideBarUI, Button, ButtonIcon, XStack, YStack, Nav } from "@my/ui";
import { Link } from "@my/ui";
import { IconSendLogo, IconSendLogoSmall, IconTelegramLogo, IconTwitterLogo } from "../../icons";
import { SideBarNavLink } from "./SideBarNavLink";
import { SideBarFooterLink } from "./SideBarFooterLink";
import { twitter as twitterSocial, telegram as telegramSocial } from '../../../data/socialLinks'

export const SideBar = ({ location }: { location: string }) => (
  <SideBarUI>
    <Link href={"/"} marginTop={"$10"}>
      <Button borderRadius={9999} w={"$11"} h={"$11"} bg={"transparent"}>
        {/* TODO: Implement Radial Gradient UI Element. Curently not in TamaGUI */}
        <ButtonIcon>
          <IconSendLogoSmall size={"$10"} />
        </ButtonIcon>
      </Button  >
    </Link>
    <Nav display="flex" flex={2} justifyContent={"center"} alignItems="center">
      <YStack gap={"$4"} alignItems='flex-start' justifyContent='center'>
        <SideBarNavLink location={location} icon={<IconSendLogoSmall />} text={"Dashboard"} href={"/"} />
        <SideBarNavLink location={location} icon={<IconSendLogoSmall />} text={"Distributions"} href={"/distributions"} />
        <SideBarNavLink location={location} icon={<IconSendLogoSmall />} text={"Leaderboard"} href={"/leaderboard"} disabled={true} hoverStyle={{ cursor: "not-allowed" }} />
      </YStack>
    </Nav>
    <YStack gap="$4" alignItems='center'>
      <IconSendLogo color={"$gold10"} />
      <XStack gap="$2">
        <SideBarFooterLink icon={<IconTwitterLogo />} href={twitterSocial} target='_blank' borderRadius={9999} />
        <SideBarFooterLink icon={<IconTelegramLogo />} href={telegramSocial} target='_blank' borderRadius={9999} />
      </XStack>
    </YStack>
  </SideBarUI >
)