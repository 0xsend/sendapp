import {
  Link,
  Paragraph,
  Separator,
  Spinner,
  Theme,
  Tooltip,
  XStack,
  type LinkProps,
  type TooltipProps,
} from '@my/ui'
import { baseMainnet } from '@my/wagmi'
import { IconArrowRight, IconError } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import type { coin, coins } from 'app/data/coins'
import { useRootScreenParams } from 'app/routers/params'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { Fragment } from 'react'
import { useBalance, type UseBalanceReturnType } from 'wagmi'

export const TokenBalanceList = ({ coins }: { coins: coins }) => {
  const [{ token: tokenParam }] = useRootScreenParams()

  return coins.map((coin, index) => (
    <Fragment key={`token-balance-list-${coin.label}`}>
      <TokenBalanceItem
        coin={coin}
        jc={'space-between'}
        ai={'center'}
        py={'$3.5'}
        disabled={tokenParam !== undefined && tokenParam !== coin.token}
        disabledStyle={{ opacity: 0.5 }}
        href={{
          pathname: '/',
          query: { token: coin.token },
        }}
      />
      {index !== coins.length - 1 && <Separator />}
    </Fragment>
  ))
}

const TokenBalanceItem = ({
  coin,
  ...props
}: {
  coin: coin
} & Omit<LinkProps, 'children'>) => {
  const { data: sendAccount } = useSendAccount()

  const balance = useBalance({
    address: sendAccount?.address,
    token: coin.token === 'eth' ? undefined : coin.token,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  return (
    <Link display="flex" {...props}>
      <XStack gap={'$2'} $gtLg={{ gap: '$3.5' }} ai={'center'}>
        <IconCoin coin={coin} />
        <Paragraph
          fontSize={'$5'}
          fontWeight={'500'}
          textTransform={'uppercase'}
          color={'$color12'}
        >
          {coin.label}
        </Paragraph>
      </XStack>
      <XStack gap={'$3.5'} ai={'center'}>
        <TokenBalance balance={balance} />
      </XStack>
    </Link>
  )
}

const TokenBalance = ({ balance }: { balance: UseBalanceReturnType }) => {
  if (balance) {
    if (balance.isError) {
      return (
        <>
          <Paragraph fontSize={'$9'} fontWeight={'500'} color={'$color12'}>
            --
          </Paragraph>
          <ErrorTooltip groupId="1" placement="right" Icon={<IconError color={'$redVibrant'} />}>
            Error occurred while fetching balance. {balance.error.message}
          </ErrorTooltip>
        </>
      )
    }
    if (balance.isFetching && balance.isPending) {
      return <Spinner size={'small'} />
    }
    if (balance?.data?.value === undefined) {
      return <></>
    }
    return (
      <Theme name="green">
        <Paragraph fontFamily={'$mono'} fontSize={'$9'} fontWeight={'500'}>
          {formatAmount(
            (Number(balance.data.value) / 10 ** (balance.data?.decimals ?? 0)).toString(),
            10,
            5
          )}
        </Paragraph>

        <XStack $lg={{ display: 'none' }} theme="green">
          <IconArrowRight col={'$background'} />
        </XStack>
      </Theme>
    )
  }
}

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
