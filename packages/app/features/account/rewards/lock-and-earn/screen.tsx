import {
  YStack,
  Card,
  Paragraph,
  H2,
  XStack,
  Spinner,
  Tooltip,
  type TooltipProps,
  LinkableButton,
  Button,
  isWeb,
  Stack,
  AnimatePresence,
  useMedia,
} from '@my/ui'
import {
  IconDollar,
  IconError,
  IconExclamationCircle,
  IconPlus,
  IconTriangleDown,
} from 'app/components/icons'
import { coins, type coin } from 'app/data/coins'
import { useSendAccount } from 'app/utils/send-accounts'
import { useBalance, type UseBalanceReturnType } from 'wagmi'
import { baseMainnet } from '@my/wagmi'
import formatAmount from 'app/utils/formatAmount'
import { IconCoin } from 'app/components/icons/IconCoin'
import { useState } from 'react'
import { useThemeSetting } from 'app/provider/theme'

export function LockAndEarnScreen() {
  return (
    <YStack f={1} $gtMd={{ ml: '$4' }} pt={'$size.3.5'} $gtLg={{ pt: 0 }}>
      <YStack pb={'$size.3.5'}>
        <YStack gap={'$size.3.5'}>
          <BalancesSection />
          <PositionsSection />
        </YStack>
      </YStack>
    </YStack>
  )
}

const BalancesSection = () => {
  return (
    <YStack f={1} gap={'$size.1.5'}>
      <H2 fontWeight={600} size={'$7'}>
        Your Balances
      </H2>
      <YStack
        bg={'$color0'}
        borderRadius={'$6'}
        gap={'$size.1'}
        $gtMd={{ fd: 'row', gap: '$size.2' }}
      >
        {coins.map((coin) => {
          return <TokenBalanceCard key={coin.label} coin={coin} />
        })}
      </YStack>
    </YStack>
  )
}

const TokenBalanceCard = ({
  coin,
}: {
  coin: coin
}) => {
  const { data: sendAccount } = useSendAccount()
  const { gtMd } = useMedia()
  const balance = useBalance({
    address: sendAccount?.address,
    token: coin.token === 'eth' ? undefined : coin.token,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })
  const iconSize = gtMd ? '$size.3.5' : '$size.1.5'

  return (
    <Card
      fg={1}
      p={'$size.1.5'}
      $gtMd={{
        fb: 0,
        fd: 'column',
        p: '$size.3.5',
      }}
    >
      <XStack
        gap={'$size.0.9'}
        jc={'space-between'}
        ai={'center'}
        $gtMd={{ fd: 'column', ai: 'flex-start' }}
      >
        <XStack gap={'$size.0.75'} ai="center">
          <IconCoin coin={coin} size={iconSize} />
          <Paragraph fontWeight={600} size={'$7'}>
            {coin.label}
          </Paragraph>
        </XStack>
        <TokenBalance balance={balance} />
      </XStack>
    </Card>
  )
}

const TokenBalance = ({ balance }: { balance: UseBalanceReturnType }) => {
  if (balance.isError) {
    return (
      <XStack gap={'$size.1'}>
        <Paragraph fontSize={'$9'} fontWeight={'500'} color={'$color12'}>
          --
        </Paragraph>
        <ErrorTooltip groupId="1" placement="right" Icon={<IconError color={'$red10Dark'} />}>
          Error occurred while fetching balance. {balance?.error?.message}
        </ErrorTooltip>
      </XStack>
    )
  }

  if (balance.isFetching && balance.isPending) {
    return <Spinner size={'small'} />
  }
  if (balance?.data?.value === undefined) {
    return <></>
  }
  return (
    <Paragraph fontWeight={500} ff={'$mono'} $gtMd={{ fontWeight: 600, size: '$9' }} size={'$7'}>
      {formatAmount(
        (Number(balance.data?.value) / 10 ** (balance.data?.decimals ?? 0)).toString(),
        10,
        5
      )}
    </Paragraph>
  )
}

// @TODO: This is duplicated from TokenBalanceList
const ErrorTooltip = ({ Icon, children, ...props }: TooltipProps & { Icon?: JSX.Element }) => {
  return (
    <Tooltip {...props}>
      <Tooltip.Trigger>{Icon}</Tooltip.Trigger>
      <Tooltip.Content
        enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        scale={1}
        x={0}
        y={0}
        opacity={1}
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        bc={'transparent'}
        borderWidth={1}
        borderColor={'$redVibrant'}
      >
        <Paragraph color={'$color12'} fontWeight={'500'}>
          {children}
        </Paragraph>
      </Tooltip.Content>
    </Tooltip>
  )
}

const PositionsSection = () => {
  const [positionsCount, setPositionsCount] = useState(0)

  return (
    <YStack f={1} gap={'$size.1.5'}>
      <XStack gap={'$4'}>
        <H2 fontWeight={600} size={'$7'} ai="center">
          Your Positions &#91;{positionsCount}&#93;
        </H2>
        <Button onPress={() => setPositionsCount(positionsCount + 1)} unstyled>
          +
        </Button>
      </XStack>

      <YStack gap={'$size.1.5'} ai={'flex-start'} $gtMd={{ fd: 'row', flexWrap: 'wrap' }}>
        {positionsCount > 0 ? (
          [...Array(positionsCount)].map((n) => {
            return <PositionCard key={n} />
          })
        ) : (
          <Paragraph
            size={'$10'}
            fontWeight={200}
            opacity={0.4}
            mt={'$size.3'}
            $gtMd={{ display: 'none' }}
          >
            You don&apos;t have any open positions.
          </Paragraph>
        )}

        <OpenPosition />
      </YStack>
    </YStack>
  )
}

const PositionCard = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)
  const { resolvedTheme } = useThemeSetting()

  return (
    <Card
      width={'100%'}
      $gtMd={{
        width: isWeb ? 'calc((100% - 48px) / 3)' : '100%',
      }}
      p={'$size.3.5'}
      borderRadius={'$6'}
    >
      <YStack gap={'$size.3.5'}>
        <XStack
          jc={'space-between'}
          ai={'center'}
          borderBottomWidth={1}
          borderBottomColor={'$color9'}
          pb={'$size.0.9'}
        >
          <Paragraph ff={'$mono'} fontWeight={600} fontSize={'$7'}>
            USDC/SEND
          </Paragraph>

          <Button
            unstyled
            h={32}
            w={32}
            display="flex"
            jc="center"
            ai="center"
            hoverStyle={{ bg: '$color2' }}
            cursor="pointer"
            borderRadius={'$1'}
            onPress={() => setIsOpen(!isOpen)}
          >
            <Stack
              animation={['quick', { transform: { overshootClamping: true } }]}
              animateOnly={['transform']}
              transform={[{ rotate: isOpen ? '180deg' : '0deg' }]}
            >
              <Button.Icon>
                <IconTriangleDown
                  size={10}
                  color={resolvedTheme === 'dark' ? '$primary' : '$color12'}
                />
              </Button.Icon>
            </Stack>
          </Button>
        </XStack>

        <YStack gap={'$size.0.5'}>
          <PositionCardLineText left="USDC" right="785 USDC" />
          <PositionCardLineText left="SEND" right="125,000 SEND" />
          <AnimatePresence exitBeforeEnter>
            {isOpen && (
              <>
                <PositionCardLineText left="Created On" right="09/13/2024" />
                <PositionCardLineText left="Total Rewards" right="650,000 SEND" />
              </>
            )}
          </AnimatePresence>
        </YStack>

        <YStack gap={'$size.0.9'}>
          <Button
            variant="outlined"
            disabled={isClaimed}
            borderRadius={'$4'}
            onPress={() => setIsClaimed(true)}
            borderColor={isClaimed ? '$color2' : '$primary'}
          >
            <Button.Icon>
              <IconDollar size={20} color={isClaimed ? '$color2' : '$primary'} />
            </Button.Icon>
            <Button.Text fontWeight={600} tt="uppercase" color={isClaimed ? '$color2' : '$color12'}>
              {isClaimed ? 'Claimed' : 'CLAIM 15,000 SEND'}
            </Button.Text>
          </Button>
          <AnimatePresence exitBeforeEnter>
            {isOpen && (
              <>
                <AddLiquidityButton />
                <ClosePositionButton />
              </>
            )}
          </AnimatePresence>
        </YStack>
      </YStack>
    </Card>
  )
}

const AddLiquidityButton = () => {
  return (
    <Button
      variant="outlined"
      theme={'green'}
      borderRadius={'$4'}
      $theme-light={{ borderColor: '$primary' }}
      animateOnly={['transform', 'opacity']}
      animation={['quick', { opacity: { overshootClamping: true } }]}
      enterStyle={{ x: 0, y: -5, opacity: 0 }}
      exitStyle={{ x: 0, y: -5, opacity: 0 }}
    >
      <Button.Icon>
        <IconPlus size={20} color={'$primary'} />
      </Button.Icon>
      <Button.Text fontWeight={600} color={'$color12'} tt="uppercase">
        Add Liquidity
      </Button.Text>
    </Button>
  )
}

const ClosePositionButton = () => {
  return (
    <Button
      variant="outlined"
      borderColor={'$red8Dark'}
      borderRadius={'$4'}
      animateOnly={['transform', 'opacity']}
      animation={['quick', { opacity: { overshootClamping: true } }]}
      enterStyle={{ x: 0, y: -5, opacity: 0 }}
      exitStyle={{ x: 0, y: -5, opacity: 0 }}
    >
      <Button.Icon>
        <IconExclamationCircle size={12} color={'$red8Dark'} />
      </Button.Icon>
      <Button.Text fontWeight={600} tt="uppercase">
        Close Position
      </Button.Text>
    </Button>
  )
}

const PositionCardLineText = ({ left, right }: { left: string; right: string }) => {
  return (
    <XStack
      jc="space-between"
      animateOnly={['transform', 'opacity']}
      animation={['quick', { opacity: { overshootClamping: true } }]}
      enterStyle={{ x: 0, y: -5, opacity: 0 }}
      exitStyle={{ x: 0, y: -5, opacity: 0 }}
    >
      <Paragraph fontSize={'$4'} color={'$color10'} tt={'uppercase'}>
        {left}
      </Paragraph>
      <Paragraph fontSize={'$4'}>{right}</Paragraph>
    </XStack>
  )
}

const OpenPosition = () => {
  return (
    <Card
      borderRadius={'$6'}
      width={'100%'}
      $gtMd={{
        width: isWeb ? 'calc((100% - 48px) / 3)' : '100%',
        h: 305,
        display: 'block',
      }}
      p={'$size.3.5'}
      display="none"
    >
      <YStack jc={'space-between'} h={'100%'}>
        <LinkableButton
          href="/account/rewards/lock-and-earn/open-position"
          theme={'green'}
          variant="outlined"
          $theme-light={{ borderColor: '$color12' }}
          borderColor="$primary"
          borderRadius={40}
          h={40}
          w={40}
          p={0}
        >
          <Button.Icon>
            <IconPlus size={20} color={'$color12'} />
          </Button.Icon>
        </LinkableButton>

        <Paragraph fontWeight={600} size={'$7'} ta={'center'}>
          Open a New Position
        </Paragraph>
      </YStack>
    </Card>
  )
}
