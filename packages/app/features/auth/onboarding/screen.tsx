/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import { createPasskey } from '@daimo/expo-passkeys'
import {
  Paragraph,
  Stack,
  YStack,
  XStack,
  Theme,
  useMedia,
  H3,
  H1,
  useToastController,
  Button,
} from '@my/ui'
import { useSendAccounts } from 'app/utils/send-accounts'
import { IconSendLogo, IconCopy } from 'app/components/icons'
import { shorten } from 'app/utils/strings'
import { OnboardingForm } from './onboarding-form'
import { Carousel } from '../components/Carousel'
import { testClient } from 'app/utils/userop'
import { parseEther } from 'viem'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import { baseMainnetClient, usdcAddress } from '@my/wagmi'

export function OnboardingScreen() {
  const media = useMedia()
  const {
    data: sendAccts,
    // error: sendAcctsError,
    // isLoading: sendAcctsIsLoading,
  } = useSendAccounts()

  if (media.gtMd)
    return (
      <YStack f={3} jc="center" maw="100%" space="$4" gap="$4">
        <YStack jc="flex-end" f={1} gap="$2" $gtMd={{ pb: '$8' }} mx="auto" maw={738}>
          <Carousel />
        </YStack>
      </YStack>
    )

  return (
    <YStack w="100%" h={'100%'} jc="flex-start" py="$7">
      <Stack f={1} $gtMd={{ dsp: 'none' }}>
        <IconSendLogo size={'$2'} color="$white" />
      </Stack>

      <YStack f={3} jc="center" maw="100%" space="$4" gap="$4">
        {sendAccts?.length === 0 ? (
          <>
            <Theme inverse={true}>
              <H1 col="$background" size="$11">
                SETUP PASSKEY
              </H1>
            </Theme>
            <H3 fontWeight="normal" theme="active" $sm={{ size: '$4' }}>
              Start by creating a Passkey below. Send uses passkeys to secure your account.
            </H3>
            <OnboardingForm />
          </>
        ) : (
          <SendAccountCongratulations />
        )}
      </YStack>
    </YStack>
  )
}

export function SendAccountCongratulations() {
  const toast = useToastController()
  const { data: sendAccts } = useSendAccounts()
  const sendAcct = sendAccts?.[0]

  return (
    <YStack w="100%" space="$4" f={1}>
      <H3>Congratulations on opening your first Send Account! </H3>
      <Paragraph>Let&apos;s get you sending</Paragraph>
      <Stack f={1} jc="center" ai="center">
        <Paragraph ta="center">First, fund your account by sending ETH here</Paragraph>
        <XStack>
          <Paragraph ta="center" fontWeight="bold">
            ${shorten(sendAcct?.address)}
          </Paragraph>
          <IconCopy />
        </XStack>

        {__DEV__ && !!sendAcct && (
          <Theme name="dim">
            <YStack pt="$4" gap="$4">
              <YStack gap="$2">
                <Paragraph mx="auto">⭐️ Secret Shop ⭐️</Paragraph>
                <Paragraph mx="auto">Available on Localnet/Testnet only.</Paragraph>
              </YStack>
              <Button
                onPress={async () => {
                  await testClient.setBalance({
                    address: sendAcct.address,
                    value: parseEther('10'),
                  })
                  toast.show('Funded with 10 ETH')
                }}
              >
                Fund with 10 ETH
              </Button>
              <Button
                onPress={async () => {
                  await setERC20Balance({
                    client: testClient,
                    address: sendAcct.address,
                    tokenAddress: usdcAddress[baseMainnetClient.chain.id],
                    value: BigInt(100e6),
                  })
                  toast.show('Funded with 100 USDC')
                }}
              >
                Fund with 100 USDC
              </Button>
            </YStack>
          </Theme>
        )}
      </Stack>
    </YStack>
  )
}
