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
} from '@my/ui'
import { IconDeposit, IconPlus } from 'app/components/icons'
import { TokenBalanceList } from './TokenBalanceList'
import { coins } from 'app/data/coins'
import { TokenBalanceCard } from './TokenBalanceCard'
import { useAccount } from 'wagmi'
import { useToken } from 'app/routers/params'
import { OpenConnectModalWrapper } from 'app/utils/OpenConnectModalWrapper'
import { useThemeSetting } from '@tamagui/next-theme'
import { X } from '@tamagui/lucide-icons'
import { TokenDetails } from './TokenDetails'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'

export function HomeScreen() {
  const media = useMedia()
  const toast = useToastController()
  const [, setTokenParam] = useToken()
  const { address } = useAccount()
  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'

  const selectedCoin = useCoinFromTokenParam()

  return (
    <Container fd={'column'} $gtMd={{ pt: '$6' }}>
      {selectedCoin !== undefined && media.gtLg && (
        <Stack>
          <Button
            top={'$-8'}
            right={0}
            position="absolute"
            bc="transparent"
            chromeless
            circular
            jc={'center'}
            ai={'center'}
            $lg={{ display: 'none' }}
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
        </Stack>
      )}
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
