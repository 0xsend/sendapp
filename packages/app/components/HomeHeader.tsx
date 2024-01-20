import { Anchor, Button, H1, Header, Link, Text, View, XStack, useToastController } from '@my/ui'
import { useNav } from 'app/routers/params'
import { useUserReferralsCount } from 'app/utils/UseUserReferralsCount'
import { getReferralHref } from 'app/utils/getReferralLink'
import { useUser } from 'app/utils/useUser'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { IconClose, IconCopy, IconHamburger, IconSettings, IconStar } from './icons'
import { usePathname } from 'app/utils/usePathname'

// TODO: this should probably named HomeTopNav
export function HomeHeader({ children }: { children: string }) {
  const [nav, setNavParam] = useNav()
  const handleHomeBottomSheet = () => {
    setNavParam(nav ? undefined : 'home', { webBehavior: 'replace' })
  }

  return (
    <Header w="100%">
      <XStack jc="space-between" fd="row" ai="center">
        <H1 fontWeight={'100'}>{children}</H1>
        <XStack $lg={{ display: 'none' }} ai="center" space="$2" height="$4" $gtSm={{ fd: 'row' }}>
          <ReferralCodeCard />
          <PointsCount />
          <SettingsButton />
          <WagmiAccountInfo />
        </XStack>
        <XStack $gtLg={{ display: 'none' }} ai="center" space="$2" height="$4">
          <Button
            onPress={handleHomeBottomSheet}
            bg="transparent"
            icon={<IconHamburger size={'$3'} />}
          />
        </XStack>
      </XStack>
    </Header>
  )
}

function ReferralCodeCard() {
  const user = useUser()
  const toast = useToastController()
  const referralHref = getReferralHref(user?.profile?.referral_code ?? '')

  if (!user?.profile?.referral_code) {
    return null
  }

  return (
    <XStack ai="center" space="$2" bg="$background" h="100%" f={1} px={'$3'} br="$4">
      <Anchor href={referralHref} textDecorationLine="none">
        <XStack ai="center" space="$2" jc="space-around">
          <Text color="$gray11" fontSize={'$2'}>
            Referral Link
          </Text>
          <Text theme={'gold'} color="$gold11" fontWeight={'600'}>
            send.it/{user?.profile?.referral_code}
          </Text>
        </XStack>
      </Anchor>
      <Button
        size="$2"
        icon={<IconCopy />}
        // @ts-expect-error tamagui doesn't support this yet
        type="button"
        onPress={() => {
          if (user?.profile?.referral_code) {
            try {
              // write the referral link to clipboard
              // @TODO: implement a native clipboard solution
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
  const pathname = usePathname()
  const { referralsCount, error } = useUserReferralsCount()
  const points = error ? '?' : referralsCount || 0
  if (pathname === '/referrals') {
    return (
      <XStack
        ai="center"
        space="$2"
        $gtSm={{ fd: 'row' }}
        h="100%"
        bw={2}
        boc={'$greenVibrant'}
        f={1}
        px={'$3'}
        br="$4"
        $theme-dark={{ bg: '$greenVibrant' }}
        $theme-light={{ bg: '$black' }}
      >
        <IconStar
          size={'$2'}
          $theme-dark={{ color: '$background' }}
          $theme-light={{ color: '$background' }}
        />
        <Text
          $theme-dark={{ color: '$background' }}
          $theme-light={{ color: '$background' }}
          fontSize={'$1'}
          fontWeight={'600'}
        >
          {points}
        </Text>
      </XStack>
    )
  }
  return (
    <View h="100%" $gtSm={{ fd: 'row' }} display="flex">
      <Link
        href="/referrals"
        bg="$background"
        borderWidth={2}
        boc={'$backgroundAccent'}
        px={'$3'}
        h="100%"
        br="$4"
      >
        <XStack ai="center" space="$2" h="100%">
          <IconStar size={'$2'} color={'$backgroundAccent'} />
          <Text color={'$backgroundAccent'} fontSize={'$1'} fontWeight={'600'}>
            {points}
          </Text>
        </XStack>
      </Link>
    </View>
  )
}

function SettingsButton() {
  return (
    <XStack
      ai="center"
      space="$2"
      $gtSm={{ fd: 'row' }}
      cursor="not-allowed"
      bg="$background"
      h="100%"
      f={1}
      px={'$3'}
      br="$4"
    >
      <Link href="" cursor="not-allowed" alignSelf="stretch">
        <IconSettings size={'$2'} />
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
      <XStack
        ai="center"
        space="$2"
        $gtSm={{ fd: 'row' }}
        cursor="not-allowed"
        bg="$background"
        h="100%"
        f={1}
        px={'$3'}
        br="$4"
      >
        <Button bg="transparent" disabled={true} onPress={() => connectAsync()}>
          Connect Wallet
        </Button>
      </XStack>
    )
  }
  return (
    <XStack
      ai="center"
      space="$2"
      $gtSm={{ fd: 'row' }}
      cursor="not-allowed"
      bg="$background"
      h="100%"
      f={1}
      px={'$3'}
      br="$4"
    >
      <Text fontWeight={'100'}>{address}</Text>
      <Button
        disabled={true}
        icon={<IconClose />}
        onPress={() => disconnect()}
        cursor="not-allowed"
      />
    </XStack>
  )
}
