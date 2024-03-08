import { Paragraph, Stack, YStack, Theme, useToastController, Button, H3, XStack } from '@my/ui'
import { useSendAccounts } from 'app/utils/send-accounts'
import { IconCopy } from 'app/components/icons'
import { testClient } from 'app/utils/userop'
import { parseEther } from 'viem'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import { baseMainnetClient, sendTokenAddress, usdcAddress } from '@my/wagmi'
import { shorten } from 'app/utils/strings'

export function SecretShopScreen() {
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
                    value: BigInt(100000000),
                  })
                  toast.show('Funded with 100 USDC')
                }}
              >
                Fund with 100 USDC
              </Button>
              <Button
                onPress={async () => {
                  await setERC20Balance({
                    client: testClient,
                    address: sendAcct.address,
                    tokenAddress: sendTokenAddress[baseMainnetClient.chain.id],
                    value: BigInt(1000000),
                  })
                  toast.show('Funded with 1M Send')
                }}
              >
                Fund with 1M Send
              </Button>
            </YStack>
          </Theme>
        )}
      </Stack>
    </YStack>
  )
}
