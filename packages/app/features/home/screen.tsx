import { Button, Container, Paragraph, XStack, YStack, useToastController } from '@my/ui'
import { IconDeposit } from 'app/components/icons'
import { TokenBalanceList } from './TokenBalanceList'
import { coins } from 'app/data/coins'
import { TokenBalanceCard } from './TokenBalanceCard'

export function HomeScreen() {
  const toast = useToastController()

  return (
    <Container fd={'column'} $gtMd={{ pt: '$6' }}>
      <YStack
        $gtLg={{ width: 360 }}
        $sm={{ width: '100%' }}
        $gtSm={{ width: '100%' }}
        ai={'center'}
      >
        <TokenBalanceCard />
        <XStack w={'100%'} ai={'center'} pt={'$7'}>
          <OpenConnectModalWrapper h={'$6'} width={'100%'}>
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
    </Container>
  )
}
