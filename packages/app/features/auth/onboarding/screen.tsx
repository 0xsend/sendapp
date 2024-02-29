/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import { Paragraph, Stack, YStack, Theme, useMedia, useToastController, Button } from '@my/ui'
import { useSendAccounts } from 'app/utils/send-accounts'
import { IconSendLogo } from 'app/components/icons'
import { OnboardingForm } from './onboarding-form'
import { Carousel } from '../components/Carousel'
import { testClient } from 'app/utils/userop'
import { parseEther } from 'viem'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import { baseMainnetClient, usdcAddress } from '@my/wagmi'
import { useAuthCarouselContext } from 'app/features/auth/AuthCarouselContext'

export function OnboardingScreen() {
  const { carouselProgress } = useAuthCarouselContext()
  const media = useMedia()

  if (media.gtMd)
    return (
      <YStack f={3} jc="center" miw={0} maw={'100%'} space="$4" gap="$4">
        <YStack jc="flex-end" f={1} gap="$2" $gtMd={{ pb: '$8' }} ml="auto" w="100%" maw={738}>
          <Carousel currentKey={carouselProgress.toString()} fullscreen={false} />
        </YStack>
      </YStack>
    )

  return (
    <YStack w="100%" h={'100%'} jc="flex-start" pt="$7">
      <Stack $gtMd={{ dsp: 'none' }}>
        <Theme inverse={true}>
          <IconSendLogo size={'$2'} color="$background" />
        </Theme>
      </Stack>

      <YStack f={3} jc="center" maw={'100%'} space="$4" gap="$4">
        <OnboardingForm />
      </YStack>
    </YStack>
  )
}
export function SendSecretStore() {
  const toast = useToastController()
  const { data: sendAccts } = useSendAccounts()
  const sendAcct = sendAccts?.[0]

  return (
    <YStack w="100%" space="$4" f={1}>
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
    </YStack>
  )
}
