import { Text, Card, Theme, useAppToast, useMedia, XStack, YStack } from '@my/ui'
import { IconArrowUp, IconPlus } from 'app/components/icons'
import { Minus, Plus } from '@tamagui/lucide-icons'
import type { LinkableButtonProps } from '@my/ui'
import { type CoinWithBalance, stableCoins, usdcCoin } from 'app/data/coins'
import { useLink } from 'solito/link'
import { Platform } from 'react-native'

const QuickActionButton = ({
  href,
  children,
  onPress,
}: LinkableButtonProps & { onPress?: () => void }) => {
  const linkProps = useLink({ href })
  const isIOS = Platform.OS === 'ios'

  return (
    <Card
      materialInteractive
      f={1}
      height={'auto'}
      w="100%"
      {...(isIOS && onPress ? { onPress } : linkProps)}
    >
      {children}
    </Card>
  )
}

const BuyButton = ({ coin }: { coin: CoinWithBalance }) => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs
  const toast = useAppToast()
  const isIOS = Platform.OS === 'ios'

  const getBuyUrl = () => `/trade?inToken=${usdcCoin.token}&outToken=${coin.token}`

  const handlePress = () => {
    toast.show('Temporarily disabled', {
      burntOptions: {
        preset: 'none',
      },
    })
  }

  return (
    <QuickActionButton href={getBuyUrl()} onPress={isIOS ? handlePress : undefined}>
      <YStack
        testID={'buy-quick-action'}
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <Theme name="green">
          <Plus size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
        </Theme>
        <Text
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Buy
        </Text>
      </YStack>
    </QuickActionButton>
  )
}

const SellButton = ({ coin }: { coin: CoinWithBalance }) => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs
  const toast = useAppToast()
  const isIOS = Platform.OS === 'ios'

  const getSellUrl = () => `/trade?inToken=${coin.token}&outToken=${usdcCoin.token}`

  const handlePress = () => {
    toast.show('Temporarily disabled', {
      burntOptions: {
        preset: 'none',
      },
    })
  }

  return (
    <QuickActionButton href={getSellUrl()} onPress={isIOS ? handlePress : undefined}>
      <YStack
        testID={'sell-quick-action'}
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <Theme name="red">
          <Minus size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
        </Theme>
        <Text
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Sell
        </Text>
      </YStack>
    </QuickActionButton>
  )
}

const AddMoneyButton = () => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  return (
    <QuickActionButton href={'/deposit'}>
      <YStack
        testID={'add-money-quick-action'}
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <IconPlus size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
        <Text
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Add Money
        </Text>
      </YStack>
    </QuickActionButton>
  )
}

const WithdrawButton = ({ coin }: { coin: CoinWithBalance }) => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  const getWithdrawUrl = () => `/send?sendToken=${coin.token}`

  return (
    <QuickActionButton href={getWithdrawUrl()}>
      <YStack
        testID={'withdraw-quick-action'}
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <IconArrowUp size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
        <Text
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Withdraw
        </Text>
      </YStack>
    </QuickActionButton>
  )
}

export const TokenQuickActions = ({ coin }: { coin: CoinWithBalance }) => {
  const isStableCoin = stableCoins.some((c) => c.token === coin.token)
  return (
    <XStack w={'100%'} gap={'$3'}>
      {isStableCoin ? (
        <>
          <AddMoneyButton />
          <WithdrawButton coin={coin} />
        </>
      ) : (
        <>
          <SellButton coin={coin} />
          <BuyButton coin={coin} />
        </>
      )}
    </XStack>
  )
}
