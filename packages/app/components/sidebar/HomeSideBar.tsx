
import { SideBarWrapper, Button, Sheet, ButtonIcon, XStack, YStack, Nav, SideBar, YStackProps, BottomSheet, useMedia } from "@my/ui";
import { Link } from "@my/ui";
import { IconSendLogo, IconSLogo, IconTelegramLogo, IconXLogo, IconDistributions, IconDashboard } from "app/components/icons";
import { SideBarNavLink } from "app/components/sidebar/SideBarNavLink";
import { SideBarFooterLink } from "app/components/sidebar/SideBarFooterLink";
import { twitter as twitterSocial, telegram as telegramSocial } from 'app/data/socialLinks'
import { usePathname } from "app/utils/usePathname";



const HomeSideBar = ({ ...props }: YStackProps) => {
  const pathName = usePathname()
  return (
    <SideBar {...props}>
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
          <SideBarNavLink icon={<IconDashboard size={"$2"} />} text={"Dashboard"} href={"/"} isActive={pathName === "/"} />
          <SideBarNavLink icon={<IconDistributions size={"$2"} />} text={"Distributions"} href={"/distributions"} isActive={pathName.includes("/distributions")} />
          <SideBarNavLink icon={<IconSLogo size={"$2"} />} text={"Leaderboard"} href={"/leaderboard"} isActive={pathName.includes("/leaderboard")} disabled={true} hoverStyle={{ cursor: "not-allowed" }} />
        </YStack>
      </Nav>
      <YStack gap="$4" alignItems='center'>
        <IconSendLogo />
        <XStack gap="$2">
          <SideBarFooterLink icon={<IconXLogo />} href={twitterSocial} target='_blank' borderRadius={9999} />
          <SideBarFooterLink icon={<IconTelegramLogo />} href={telegramSocial} target='_blank' borderRadius={9999} />
        </XStack>
      </YStack>
    </SideBar >)
}

const HomeBottomSheet = () => {
  const pathName = usePathname()
  return (
    <BottomSheet open>
      <Link href={"/"} marginTop={"$4"}>
        <Button borderRadius={9999} w={"$11"} h={"$11"} bg={"transparent"}>
          {/* TODO: Implement Radial Gradient UI Element. Curently not in TamaGUI */}
          <ButtonIcon>
            <IconSLogo size={"$10"} />
          </ButtonIcon>
        </Button  >
      </Link>
      <Nav display="flex" flex={2} justifyContent={"center"} alignItems="center">
        <YStack gap={"$4"} alignItems='flex-start' justifyContent='center'>
          <SideBarNavLink icon={<IconDashboard size={"$2"} />} text={"Dashboard"} href={"/"} isActive={pathName === "/"} />
          <SideBarNavLink icon={<IconDistributions size={"$2"} />} text={"Distributions"} href={"/distributions"} isActive={pathName.includes("/distributions")} />
          <SideBarNavLink icon={<IconSLogo size={"$2"} />} text={"Leaderboard"} href={"/leaderboard"} isActive={pathName.includes("/leaderboard")} disabled={true} hoverStyle={{ cursor: "not-allowed" }} />
        </YStack>
      </Nav>
      <YStack gap="$4" py="$4" alignItems='center'>
        <IconSendLogo />
        <XStack gap="$2">
          <SideBarFooterLink icon={<IconXLogo />} href={twitterSocial} target='_blank' borderRadius={9999} />
          <SideBarFooterLink icon={<IconTelegramLogo />} href={telegramSocial} target='_blank' borderRadius={9999} />
        </XStack>
      </YStack>
    </BottomSheet>
  )
}

export const HomeSideBarWrapper = ({ children }: { children?: React.ReactNode }) => {
  const media = useMedia()
  if (media.gtMd)
    return (
      <SideBarWrapper sidebar={< HomeSideBar backgroundColor={"$backgroundStrong"} />}>
        {children}
      </SideBarWrapper >

    )
  return (
    <>
      <HomeBottomSheet />
      {children}
    </>

  )
}

