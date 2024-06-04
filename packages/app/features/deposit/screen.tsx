import {
  AnimatePresence,
  Button,
  H3,
  H4,
  Stack,
  YStack,
  useToastController,
  type ButtonProps,
  type HeadingProps,
  type YStackProps,
} from '@my/ui'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { IconEthereum } from 'app/components/icons'
import { IconCoinbaseOnramp } from 'app/components/icons/IconCoinbaseOnramp'
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
      <DepositStackButton>
        <DepositButton
          icon={<IconEthereum size={'$2.5'} color={'$color12'} />}
          onPress={() => openConnectModal?.()}
        />
        <DepositStackSubheader>Connect to Deposit</DepositStackSubheader>
      </DepositStackButton>
    )
  }
  return (
    <DepositStackButton>
      <DepositButton
        icon={<IconEthereum size={'$2.5'} color={'$color12'} />}
        onPress={() => {
          console.log('Deposit to', sendAccount?.address, 'from', address)
          // show screen to send to send account
        }}
      />
      <DepositStackSubheader>Web3 Wallet</DepositStackSubheader>
    </DepositStackButton>
  )
}

function DespositCoinbasePay() {
  const toast = useToastController()
  return (
    <DepositStackButton disabled disabledStyle={{ opacity: 0.5 }}>
      <DepositButton
        icon={<IconCoinbaseOnramp size={'$2.5'} color={'$color12'} />}
        onPress={() => {
          console.log('Coinbase Pay')
          toast.show('Coming Soon')
        }}
      />
      {/* <DepositStackSubheader>Coinbase Pay</DepositStackSubheader> */}
      <DepositStackSubheader>Coming Soon</DepositStackSubheader>
    </DepositStackButton>
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

function DepositStackButton({ children, ...props }: YStackProps) {
  return (
    <YStack
      gap={'$4'}
      jc="center"
      ai="center"
      f={1}
      width="100%"
      $md={{
        width: '100%',
      }}
      $gtMd={{
        height: '$12',
      }}
      {...props}
    >
      {children}
    </YStack>
  )
}

function DepositStackSubheader({ children, ...props }: HeadingProps) {
  return (
    <H4 size={'$4'} fontWeight={'300'} color={'$color05'} ta="center" {...props}>
      {children}
    </H4>
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
      $gtMd={{
        height: '$12',
      }}
      {...props}
    >
      {children}
    </Button>
  )
}
