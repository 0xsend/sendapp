
import { SideBar as SideBarUI, Button, ButtonIcon, XStack, YStack, Nav } from "@my/ui";
import { Link } from "@my/ui";
import { IconSendLogo, IconSLogo, IconTelegramLogo, IconXLogo, IconDistributions, IconDashboard } from "app/components/icons";
import { SideBarNavLink } from "./SideBarNavLink";
import { SideBarFooterLink } from "./SideBarFooterLink";
import { twitter as twitterSocial, telegram as telegramSocial } from 'app/data/socialLinks'

export const SideBar = ({ location }: { location: string }) => (
  <SideBarUI >
    <Link href={"/"} marginTop={"$10"}>
      <Button borderRadius={9999} w={"$11"} h={"$11"} bg={"transparent"}>
        {/* TODO: Implement Radial Gradient UI Element. Curently not in TamaGUI */}
        <ButtonIcon>
          <IconSLogo size={"$10"} />
        </ButtonIcon>
      </Button  >
    </Link>
    <Nav display="flex" flex={2} justifyContent={"center"} alignItems="center">
      <YStack gap={"$4"} alignItems='flex-start' justifyContent='center'>
        <SideBarNavLink icon={<IconDashboard size={"$2"} />} text={"Dashboard"} href={"/"} isActive={location === "/"} />
        <SideBarNavLink icon={<IconDistributions size={"$2"} />} text={"Distributions"} href={"/distributions"} isActive={location.includes("/distributions")} />
        <SideBarNavLink icon={<IconSLogo size={"$2"} />} text={"Leaderboard"} href={"/leaderboard"} isActive={location.includes("/leaderboard")} disabled={true} hoverStyle={{ cursor: "not-allowed" }} />
      </YStack>
    </Nav>
    <YStack gap="$4" alignItems='center'>
      <IconSendLogo />
      <XStack gap="$2">
        <SideBarFooterLink icon={<IconXLogo />} href={twitterSocial} target='_blank' borderRadius={9999} />
        <SideBarFooterLink icon={<IconTelegramLogo />} href={telegramSocial} target='_blank' borderRadius={9999} />
      </XStack>
    </YStack>
  </SideBarUI >
)