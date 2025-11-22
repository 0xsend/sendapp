import {
  Paragraph,
  Stack,
  YStack,
  Theme,
  useAppToast,
  Button,
  XStack,
  Container,
  Spinner,
  Anchor,
} from '@my/ui'
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
      <Container>
        <Theme>
          <Spinner fullscreen size="large" color={'$green10Light'} />
        </Theme>
      </Container>
    )
  }

  if (!sendAcct) {
    return (
      <Container>
        <Paragraph>{t('status.missingAccount')}</Paragraph>
      </Container>
    )
  }

  return (
    <Container>
      <YStack w="100%" space="$4" f={1}>
        <Stack f={1} maw={600}>
          <Theme name="alt1">
            <YStack pt="$4" gap="$4">
              <YStack gap="$2">
                <Paragraph>{t('status.networkNotice', { network: baseMainnet.name })}</Paragraph>
                <XStack>
                  <Paragraph ta="center" fontWeight="bold" fontFamily="$mono">
                    <Anchor
                      href={`${baseMainnet.blockExplorers.default.url}/address/${sendAcct.address}`}
                    >
                      {sendAcct.address}
                    </Anchor>
                  </Paragraph>
                </XStack>
              </YStack>
              {__DEV__ && baseMainnet.id !== 84532 ? (
                <>
                  <Button
                    onPress={async () => {
                      await testClient.setBalance({
                        address: sendAcct.address,
                        value: parseEther('10'),
                      })
                      toast.show(t('dev.toasts.fundEth'))
                    }}
                  >
                    {t('dev.buttons.fundEth')}
                  </Button>
                  <Button
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
                    {t('dev.buttons.fundUsdc')}
                  </Button>
                  {/* send v1 has 18 decimals and 1B supply */}
                  <Button
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
                    {t('dev.buttons.fundSend')}
                  </Button>
                  {/* send v0 has 0 decimals and 100B supply */}
                  <Button
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
                    {t('dev.buttons.fundSendV0')}
                  </Button>
                  <Button
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
                    {t('dev.buttons.fundSpx')}
                  </Button>
                </>
              ) : (
                <YStack>
                  <Button
                    disabled={isFundPending}
                    iconAfter={isFundPending ? <Spinner size="small" /> : undefined}
                    onPress={() => {
                      fundMutation({ address: sendAcct.address })
                    }}
                  >
                    {t('actions.fundAccount')}
                  </Button>
                  {fundError && <Paragraph color="$error">{fundError.message}</Paragraph>}
                  {fundData && (
                    <YStack gap="$2" mt="$4">
                      <Paragraph>{t('result.title')}</Paragraph>
                      {Object.entries(fundData).map(([key, value]) =>
                        value ? (
                          <Paragraph key={key}>
                            <Anchor href={`${baseMainnet.blockExplorers.default.url}/tx/${value}`}>
                              {t('result.transaction', { type: key, hash: shorten(value) })}
                            </Anchor>
                          </Paragraph>
                        ) : (
                          <Paragraph key={key}>{t('result.skipped', { type: key })}</Paragraph>
                        )
                      )}
                    </YStack>
                  )}
                </YStack>
              )}
            </YStack>
          </Theme>
        </Stack>
      </YStack>
    </Container>
  )
}
