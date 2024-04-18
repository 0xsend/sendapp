import {
  Button,
  Container,
  Paragraph,
  Separator,
  XStack,
  YStack,
  useMedia,
  useToastController,
  Stack,
  Label,
  H1,
  Spinner,
  BigHeading,
} from '@my/ui'
import { IconDeposit, IconPlus } from 'app/components/icons'
import { TokenBalanceList } from './TokenBalanceList'
import { coins } from 'app/data/coins'
import { TokenBalanceCard } from './TokenBalanceCard'
import { type UseBalanceReturnType, useAccount, useBalance } from 'wagmi'
import { useToken } from 'app/routers/params'
import { OpenConnectModalWrapper } from 'app/utils/OpenConnectModalWrapper'
import { useThemeSetting } from '@tamagui/next-theme'
import { useTokenPrice } from '../../utils/coin-gecko'
import { useSendAccounts } from 'app/utils/send-accounts'
import { baseMainnet } from '@my/wagmi'
import formatAmount from 'app/utils/formatAmount'

export function HomeScreen() {
  const media = useMedia()
  const toast = useToastController()
  const [tokenParam] = useToken()
  const { address } = useAccount()
  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'

  const selectedCoin = coins.find((c) => c.token === tokenParam)

  return (
    <Container fd={'column'} $gtMd={{ pt: '$6' }}>
      <XStack w={'100%'} jc={'space-between'} $gtLg={{ gap: '$11' }} f={1}>
        {(selectedCoin === undefined || media.gtLg) && (
          <YStack $gtLg={{ width: 360 }} width="100%" ai={'center'}>
            <XStack w={'100%'} jc={'center'} ai="center" $lg={{ f: 1 }}>
              <TokenBalanceCard />
            </XStack>

            <Separator $gtLg={{ display: 'none' }} w={'100%'} borderColor={separatorColor} />
            <YStack w={'100%'} ai={'center'}>
              <XStack w={'100%'} ai={'center'} pt={'$7'}>
                <OpenConnectModalWrapper
                  h={'$6'}
                  width={'100%'}
                  disabled={selectedCoin !== undefined}
                >
                  <Button
                    px={'$3.5'}
                    h={'$6'}
                    width={'100%'}
                    theme="accent"
                    borderRadius={'$4'}
                    onPress={() => {
                      // @todo onramp / deposit
                      if (address === undefined) return
                      toast.show('Coming Soon: Deposit')
                    }}
                    disabled={selectedCoin !== undefined}
                    disabledStyle={{ opacity: 0.5 }}
                  >
                    <XStack w={'100%'} jc={'space-between'} ai={'center'}>
                      <Paragraph
                        // fontFamily={'$mono'}
                        fontWeight={'500'}
                        textTransform={'uppercase'}
                        color={'$black'}
                      >
                        {address ? 'Deposit' : 'Connect Wallet'}
                      </Paragraph>
                      <XStack alignItems={'center'} justifyContent={'center'} zIndex={2}>
                        {address ? (
                          <IconDeposit size={'$2.5'} color={'$black'} />
                        ) : (
                          <IconPlus size={'$2.5'} color={'$black'} />
                        )}
                      </XStack>
                    </XStack>
                  </Button>
                </OpenConnectModalWrapper>
              </XStack>

              <YStack width="100%" pt="$6" pb="$12">
                <TokenBalanceList coins={coins} />
              </YStack>
            </YStack>
          </YStack>
        )}
        {selectedCoin !== undefined && <TokenDetails coin={selectedCoin} />}
      </XStack>
    </Container>
  )
}

const TokenDetails = ({ coin }: { coin: coins[number] }) => {
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]
  const balance = useBalance({
    address: sendAccount?.address,
    token: coin.token === 'eth' ? undefined : coin.token,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  return (
    <YStack f={1}>
      {/* This goes in TopNav
      <Stack jc="flex-end" ai="flex-end">
        <Button
          bc="transparent"
          chromeless
          circular
          jc={'center'}
          ai={'center'}
          hoverStyle={{
            backgroundColor: 'transparent',
            borderColor: '$color11',
          }}
          pressStyle={{
            backgroundColor: 'transparent',
          }}
          focusStyle={{
            backgroundColor: 'transparent',
          }}
          icon={<X size={'$2.5'} color={'$color11'} />}
          onPress={() => {
            setTokenParam(undefined)
          }}
        />
      </Stack> */}
      {coin.label !== 'USDC' && (
        <XStack w={'100%'} ai={'center'} jc={'space-between'} mt={'$6'}>
          <Separator $theme-dark={{ boc: '$decay' }} $theme-light={{ boc: '$gray4Light' }} />
          <Stack
            bw={1}
            br={'$2'}
            $theme-dark={{ boc: '$decay' }}
            $theme-light={{ boc: '$gray4Light' }}
            p={'$2'}
          >
            <TokenDetailsPrice coin={coin} />
          </Stack>
        </XStack>
      )}
      <YStack>
        <Label fontSize={'$5'} fontWeight={'500'} color={'$color11'}>
          {`${coin.label} Balance`}
        </Label>
        <TokenDetailsBalance balance={balance} />
      </YStack>
      <Stack w={'100%'} py={'$6'}>
        <Separator $theme-dark={{ boc: '$decay' }} $theme-light={{ boc: '$gray4Light' }} />
      </Stack>

      <YStack>
        <Label fontSize="$7" fontWeight="500" color={'$color11'}>
          History
        </Label>
        <H1 fontSize="$9" fontWeight="700" color={'$color12'}>
          Coming Soon
        </H1>
      </YStack>
    </YStack>
  )
}

const TokenDetailsPrice = ({ coin }: { coin: coins[number] }) => {
  const { data: tokenPriceData, status } = useTokenPrice(coin.coingeckoTokenId)

  const maybePrice = tokenPriceData?.[coin.coingeckoTokenId]?.usd

  const tokenPrice = () => {
    switch (status) {
      case 'pending':
        return <Spinner size="small" />
      case 'error' || !maybePrice:
        return <Paragraph>?</Paragraph>
      default:
        return maybePrice
    }
  }

  return (
    <Paragraph fontSize="$5" fontWeight="500" color={'$color11'}>
      {`1 ${coin.label} = ${tokenPrice()} USD`}
    </Paragraph>
  )
}

const TokenDetailsBalance = ({ balance }: { balance: UseBalanceReturnType }) => {
  if (balance) {
    if (balance.isError) {
      return <>---</>
    }
    if (balance.isPending) {
      return <Spinner size={'small'} />
    }
    if (balance?.data?.value === undefined) {
      return <></>
    }
    return (
      <BigHeading color={'$color12'}>
        {formatAmount(
          (Number(balance.data.value) / 10 ** (balance.data?.decimals ?? 0)).toString()
        )}
      </BigHeading>
    )
  }
}
