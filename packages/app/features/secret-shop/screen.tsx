import { Paragraph, YStack, useAppToast, Spinner, Anchor, FadeCard, PrimaryButton } from '@my/ui'
import { useSendAccounts } from 'app/utils/send-accounts'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import {
  baseMainnet,
  baseMainnetClient,
  sendTokenAddress,
  sendTokenV0Address,
  spx6900Address,
  usdcAddress,
} from '@my/wagmi'
import { api } from 'app/utils/api'
import {
  createTestClient,
  http,
  parseEther,
  publicActions,
  type HttpTransport,
  type PublicActions,
  type TestClient,
} from 'viem'
import { shorten } from 'app/utils/strings'
import { useTranslation } from 'react-i18next'

const testClient = createTestClient({
  chain: baseMainnetClient.chain,
  transport: http(baseMainnetClient.transport.url),
  mode: 'anvil',
}).extend(publicActions) as unknown as TestClient<'anvil', HttpTransport, typeof baseMainnet> &
  PublicActions

export function SecretShopScreen() {
  const toast = useAppToast()
  const {
    mutate: fundMutation,
    error: fundError,
    data: fundData,
    isPending: isFundPending,
  } = api.secretShop.fund.useMutation()
  const { data: sendAccts, isPending } = useSendAccounts()
  const sendAcct = sendAccts?.[0]
  const { t } = useTranslation('secretShop')

  if (isPending) {
    return (
      <YStack f={1} ai="center" jc="center">
        <Spinner size="large" color="$color12" />
      </YStack>
    )
  }

  if (!sendAcct) {
    return (
      <YStack w="100%" gap="$3.5">
        <Paragraph size="$5" color="$color12">
          {t('status.missingAccount')}
        </Paragraph>
      </YStack>
    )
  }

  return (
    <YStack w="100%" gap="$5">
      <FadeCard>
        <YStack gap="$3">
          <Paragraph size="$5" color="$color12">
            {t('status.networkNotice', { network: baseMainnet.name })}
          </Paragraph>
          <Paragraph
            size="$4"
            fontWeight="bold"
            fontFamily="$mono"
            color="$primary"
            $theme-light={{ color: '$color12' }}
          >
            <Anchor href={`${baseMainnet.blockExplorers.default.url}/address/${sendAcct.address}`}>
              {sendAcct.address}
            </Anchor>
          </Paragraph>
        </YStack>
      </FadeCard>

      <YStack gap="$3">
        {__DEV__ && baseMainnet.id !== 84532 ? (
          <>
            <PrimaryButton
              onPress={async () => {
                await testClient.setBalance({
                  address: sendAcct.address,
                  value: parseEther('10'),
                })
                toast.show(t('dev.toasts.fundEth'))
              }}
            >
              <PrimaryButton.Text>{t('dev.buttons.fundEth')}</PrimaryButton.Text>
            </PrimaryButton>
            <PrimaryButton
              onPress={async () => {
                await setERC20Balance({
                  client: testClient,
                  address: sendAcct.address,
                  tokenAddress: usdcAddress[baseMainnetClient.chain.id],
                  value: BigInt(100000000),
                })
                toast.show(t('dev.toasts.fundUsdc'))
              }}
            >
              <PrimaryButton.Text>{t('dev.buttons.fundUsdc')}</PrimaryButton.Text>
            </PrimaryButton>
            {/* send v1 has 18 decimals and 1B supply */}
            <PrimaryButton
              onPress={async () => {
                await setERC20Balance({
                  client: testClient,
                  address: sendAcct.address,
                  tokenAddress: sendTokenAddress[baseMainnetClient.chain.id],
                  value: BigInt(parseEther('10000')),
                })
                toast.show(t('dev.toasts.fundSend'))
              }}
            >
              <PrimaryButton.Text>{t('dev.buttons.fundSend')}</PrimaryButton.Text>
            </PrimaryButton>
            {/* send v0 has 0 decimals and 100B supply */}
            <PrimaryButton
              onPress={async () => {
                await setERC20Balance({
                  client: testClient,
                  address: sendAcct.address,
                  tokenAddress: sendTokenV0Address[baseMainnetClient.chain.id],
                  value: BigInt(1_000_000),
                })
                toast.show(t('dev.toasts.fundSendV0'))
              }}
            >
              <PrimaryButton.Text>{t('dev.buttons.fundSendV0')}</PrimaryButton.Text>
            </PrimaryButton>
            <PrimaryButton
              onPress={async () => {
                await setERC20Balance({
                  client: testClient,
                  address: sendAcct.address,
                  tokenAddress: spx6900Address[baseMainnetClient.chain.id],
                  value: BigInt(6900 * 1e8),
                })
                toast.show(t('dev.toasts.fundSpx'))
              }}
            >
              <PrimaryButton.Text>{t('dev.buttons.fundSpx')}</PrimaryButton.Text>
            </PrimaryButton>
          </>
        ) : (
          <YStack gap="$3">
            <PrimaryButton
              disabled={isFundPending}
              iconAfter={isFundPending ? <Spinner size="small" /> : undefined}
              onPress={() => {
                fundMutation({ address: sendAcct.address })
              }}
            >
              <PrimaryButton.Text>{t('actions.fundAccount')}</PrimaryButton.Text>
            </PrimaryButton>
            {fundError && (
              <Paragraph size="$5" color="$error">
                {fundError.message}
              </Paragraph>
            )}
            {fundData && (
              <FadeCard>
                <YStack gap="$2">
                  <Paragraph size="$5" color="$color12">
                    {t('result.title')}
                  </Paragraph>
                  {Object.entries(fundData).map(([key, value]) =>
                    value ? (
                      <Paragraph
                        key={key}
                        size="$4"
                        color="$primary"
                        $theme-light={{ color: '$color12' }}
                      >
                        <Anchor href={`${baseMainnet.blockExplorers.default.url}/tx/${value}`}>
                          {t('result.transaction', { type: key, hash: shorten(value) })}
                        </Anchor>
                      </Paragraph>
                    ) : (
                      <Paragraph key={key} size="$4" color="$color11">
                        {t('result.skipped', { type: key })}
                      </Paragraph>
                    )
                  )}
                </YStack>
              </FadeCard>
            )}
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
