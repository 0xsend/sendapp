import { Anchor, Button, Card, H1, Header, Link, XStack, useToastController, Text } from "@my/ui";
import { useUser } from "app/utils/useUser";
import { Copy, X } from "@tamagui/lucide-icons";
import { getReferralHref } from "app/utils/getReferralLink";
import { IconClose, IconSettings } from "./icons";
import { useAccount, useConnect, useDisconnect } from "wagmi";



export function HomeHeader({ children }: { children: string }) {
  return (
    <Header w="100%" miw={804}>
      <XStack jc="space-between" fd="column" ai="center" $gtSm={{ fd: 'row' }}>
        <H1 fontWeight={"100"}>{children}</H1>
        <XStack $sm={{ display: "none" }} ai="center" space="$2" $gtSm={{ fd: 'row' }}>
          <ReferralCodeCard />
          <SettingsButton />
          <WagmiAccountInfo />
        </XStack>
      </XStack>
    </Header>)
}


function ReferralCodeCard() {
  const user = useUser()
  const toast = useToastController()
  const referralHref = getReferralHref(user?.profile?.referral_code ?? '')!

  if (!user?.profile?.referral_code) {
    return null
  }

  return (

    <Card size="$1" ai="center" f={1} br={"$4"}>
      <Card.Header>
        <XStack ai="center" theme="alt2" space="$2" px={"$2"} py={"$1"} >
          <Anchor href={referralHref} textDecorationLine="none">
            <XStack ai="center" space="$2" jc="space-around" >
              <Text color="$gray11" fontSize={"$3"} >
                Referral Link
              </Text>
              <Text theme={"gold"} color="$gold11" fontWeight={"600"}>send.it/{user?.profile?.referral_code}</Text>
            </XStack>
          </Anchor>
          <Button
            theme="alt2"
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
      </Card.Header>
    </Card>

  )
}

function SettingsButton() {
  return (
    <Link href="" disabled={true} cursor="not-allowed">
      <Button disabled={true} size="$3" icon={<IconSettings size={"$1"} />} />
    </Link>
  )
}

function WagmiAccountInfo() {
  const { address, isConnected } = useAccount()
  const { connectAsync } = useConnect()
  const { disconnect } = useDisconnect()

  if (!isConnected || !address) {
    return <Button size={"$3"} cursor="not-allowed" disabled={true} onPress={() => connectAsync()}>Connect Wallet</Button>
  }
  return (
    <XStack h="$3" ai="center" space="$2" $gtSm={{ fd: 'row' }} cursor="not-allowed">
      <Text fontWeight={"100"}>{address}</Text>
      <Button disabled={true} icon={<IconClose />} onPress={() => disconnect()} cursor="not-allowed" />
    </XStack>
  )
}