import {
  AnimatePresence,
  Button,
  ButtonText,
  H3,
  Paragraph,
  Stack,
  YStack,
  useToastController,
  type ButtonProps,
} from '@my/ui'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useSendAccount } from 'app/utils/send-accounts'
import { useAccount } from 'wagmi'

/**
 * Deposit screen shows the various options for depositing funds.
 * - Web3 Wallet (window.ethereum)
 * - Coinbase Pay
 * - ???
 */
export function DepositScreen() {
  return (
    <YStack $gtSm={{ minWidth: 500 }} mx="auto" width={'100%'} mt="auto">
      <YStack w={'100%'} gap={'$4'}>
        <YStack gap="$2">
          <H3 size={'$8'} fontWeight={'300'} color={'$color05'}>
            Deposit funds
          </H3>
        </YStack>

        <AnimateEnter>
          <Stack gap={'$4'} w={'100%'} $gtMd={{ flexDirection: 'row' }}>
            <DespositWeb3Wallet />
            <DespositCoinbasePay />
          </Stack>
        </AnimateEnter>
      </YStack>
    </YStack>
  )
}

function DespositWeb3Wallet() {
  const { openConnectModal } = useConnectModal()
  const { address, isConnected } = useAccount()
  const { data: sendAccount } = useSendAccount()

  if (!isConnected) {
    return (
      <DepositButton onPress={() => openConnectModal?.()}>
        <ButtonText>Connect to Deposit</ButtonText>
      </DepositButton>
    )
  }
  return (
    <DepositButton
      onPress={() => {
        console.log('Deposit to', sendAccount?.address, 'from', address)
        // show screen to send to send account
      }}
    >
      <ButtonText>Web3 Wallet</ButtonText>
    </DepositButton>
  )
}

function DespositCoinbasePay() {
  const toast = useToastController()
  return (
    <DepositButton
      onPress={() => {
        console.log('Coinbase Pay')
        toast.show('Coming Soon')
      }}
    >
      <ButtonText>Coinbase Pay</ButtonText>
    </DepositButton>
  )
}

function AnimateEnter({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'test') return <>{children}</> // figure out why mocking AnimatePresence is not working

  return (
    <AnimatePresence>
      <Stack
        key="enter"
        animateOnly={['transform', 'opacity']}
        animation="200ms"
        enterStyle={{ opacity: 0, scale: 0.9 }}
        exitStyle={{ opacity: 0, scale: 0.95 }}
        opacity={1}
      >
        {children}
      </Stack>
    </AnimatePresence>
  )
}

function DepositButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      chromeless
      f={1}
      bc={'$color2'}
      height={'$8'}
      width="100%"
      // minWidth={'$14'}
      $sm={
        {
          // minWidth: '$20',
        }
      }
      $gtMd={{
        // width: '50%',
        height: '$12',
      }}
      {...props}
    >
      {children}
    </Button>
  )
}
