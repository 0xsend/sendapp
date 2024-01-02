import { Anchor, Button, Card, H1, Header, Link, XStack, useToastController, Text } from "@my/ui";
import { useUser } from "app/utils/useUser";
import { Copy, X } from "@tamagui/lucide-icons";
import { getReferralHref } from "app/utils/getReferralLink";
import { IconClose, IconSettings } from "./icons";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { IconStar } from "./icons/IconStar";



export function HomeHeader({ children }: { children: string }) {
  return (
    <Header w="100%" miw={804}>
      <XStack jc="space-between" fd="column" ai="center" $gtSm={{ fd: 'row' }}>
        <H1 fontWeight={"100"}>{children}</H1>
        <XStack $sm={{ display: "none" }} ai="center" space="$2" height="$4" $gtSm={{ fd: 'row' }}>
          <ReferralCodeCard />
          <PointsCount />
          <SettingsButton />
          <WagmiAccountInfo />
        </XStack>
      </XStack>
    </Header >)
}


function ReferralCodeCard() {
  const user = useUser()
  const toast = useToastController()
  const referralHref = getReferralHref(user?.profile?.referral_code ?? '')!

  if (!user?.profile?.referral_code) {
    return null
  }

  return (
    <XStack ai="center" space="$2" bg="$background" h="100%" f={1} px={"$3"} br="$4" >
      <Anchor href={referralHref} textDecorationLine="none">
        <XStack ai="center" space="$2" jc="space-around" >
          <Text color="$gray11" fontSize={"$2"} >
            Referral Link
          </Text>
          <Text theme={"gold"} color="$gold11" fontWeight={"600"}>send.it/{user?.profile?.referral_code}</Text>
        </XStack>
      </Anchor>
      <Button

        size="$2"
        icon={<Copy />}
        // @ts-expect-error tamagui doesn't support this yet
        type="button"
        onPress={() => {
          if (user?.profile?.referral_code) {
            try {
              // write the referral link to clipboard
              navigator.clipboard.writeText(referralHref)
            } catch (e) {
              console.warn(e)
              prompt('Copy to clipboard: Ctrl+C, Enter', referralHref)
            }
            toast.show('Copied your referral link to clipboard')
          }
        }}
      />
    </XStack>


  )
}

function PointsCount() {
  // const user = useUser()
  // const points = user?.profile?.points ?? 0
  const points = 0

  return (

    <XStack ai="center" space="$2" $gtSm={{ fd: 'row' }} cursor="not-allowed" bg="$background" h="100%" borderWidth={2} boc={"$goldVibrant"} f={1} px={"$3"} br="$4" >
      <IconStar size={"$2"} color={"$goldVibrant"} />
      <Text color={"$goldVibrant"} fontSize={"$1"} fontWeight={"600"}>{points}</Text>
    </XStack >


  )
}


function SettingsButton() {
  return (
    <XStack ai="center" space="$2" $gtSm={{ fd: 'row' }} cursor="not-allowed" bg="$background" h="100%" f={1} px={"$3"} br="$4" >
      <Link href="" cursor="not-allowed" alignSelf="stretch">
        <IconSettings size={"$2"} />
      </Link>
    </XStack>
  )
}

function WagmiAccountInfo() {
  const { address, isConnected } = useAccount()
  const { connectAsync } = useConnect()
  const { disconnect } = useDisconnect()

  if (!isConnected || !address) {
    return (
      <XStack ai="center" space="$2" $gtSm={{ fd: 'row' }} cursor="not-allowed" bg="$background" h="100%" f={1} px={"$3"} br="$4" >
        <Button bg="transparent" disabled={true} onPress={() => connectAsync()}>Connect Wallet</Button>
      </XStack>)

  }
  return (
    <XStack ai="center" space="$2" $gtSm={{ fd: 'row' }} cursor="not-allowed" bg="$background" h="100%" f={1} px={"$3"} br="$4" >
      <Text fontWeight={"100"}>{address}</Text>
      <Button disabled={true} icon={<IconClose />} onPress={() => disconnect()} cursor="not-allowed" />
    </XStack>


  )
}