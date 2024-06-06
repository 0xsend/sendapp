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
import { IconEthereum } from 'app/components/icons'
import { IconCoinbaseOnramp } from 'app/components/icons/IconCoinbaseOnramp'
import { usePathname } from 'app/utils/usePathname'
import { createParam } from 'solito'
import { useLink } from 'solito/link'
import { z } from 'zod'

const DepositSchema = z.object({
  d: z.string().regex(/^0x[a-fA-F0-9]{40}$/i, 'Invalid token'),
})

type DepositSchema = z.infer<typeof DepositSchema>

const { useParams } = createParam<DepositSchema>()

/**
 * Deposit screen shows the various options for depositing funds.
 * - Web3 Wallet (window.ethereum)
 * - Coinbase Pay
 * - ???
 */
export function DepositScreen() {
  const pathname = usePathname()
  const params = useParams()

  console.log('pathname', pathname)
  console.log('params', params)

  return <DepositWelcome />
}

export function DepositWelcome(props: YStackProps) {
  return (
    <YStack mt="$4" mx="auto" width={'100%'} {...props}>
      <YStack w={'100%'} gap={'$4'}>
        <YStack gap="$2">
          <H3 size={'$8'} fontWeight={'300'} color={'$color05'}>
            Deposit funds
          </H3>
        </YStack>

        <AnimateEnter>
          <Stack gap={'$4'} w={'100%'} $gtMd={{ flexDirection: 'row' }}>
            <DespositWeb3Link />
            <DespositCoinbasePay />
          </Stack>
        </AnimateEnter>
      </YStack>
    </YStack>
  )
}

function DespositWeb3Link() {
  return (
    <DepositStackButton>
      <DepositButton
        icon={<IconEthereum size={'$2.5'} color={'$color12'} />}
        {...useLink({
          href: '/deposit/web3',
        })}
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
      bc={'$color3'}
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
