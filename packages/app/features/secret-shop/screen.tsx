import {
  Paragraph,
  Stack,
  YStack,
  Theme,
  useToastController,
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

const testClient = createTestClient({
  chain: baseMainnetClient.chain,
  transport: http(baseMainnetClient.transport.url),
  mode: 'anvil',
}).extend(publicActions) as unknown as TestClient<'anvil', HttpTransport, typeof baseMainnet> &
  PublicActions

export function SecretShopScreen() {
  const toast = useToastController()
  const {
    mutate: fundMutation,
    error: fundError,
    data: fundData,
    isPending: isFundPending,
  } = api.secretShop.fund.useMutation()
  const { data: sendAccts, isPending } = useSendAccounts()
  const sendAcct = sendAccts?.[0]

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
        <Paragraph>No Send Account found. Did you create one?</Paragraph>
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
                <Paragraph>
                  Available on {baseMainnet.name} only. Your Send Account Address:
                </Paragraph>
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
                  {/* send v1 has 18 decimals and 1B supply */}
                  <Button
                    onPress={async () => {
                      await setERC20Balance({
                        client: testClient,
                        address: sendAcct.address,
                        tokenAddress: sendTokenAddress[baseMainnetClient.chain.id],
                        value: BigInt(parseEther('10000')),
                      })
                      toast.show('Funded with 10K Send')
                    }}
                  >
                    Fund with 100K Send
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
                      toast.show('Funded with 1M Send V0')
                    }}
                  >
                    Fund with 1M Send V0 - 100B supply
                  </Button>
                  <Button
                    onPress={async () => {
                      await setERC20Balance({
                        client: testClient,
                        address: sendAcct.address,
                        tokenAddress: spx6900Address[baseMainnetClient.chain.id],
                        value: BigInt(6900 * 1e8),
                      })
                      toast.show('Funded with 69K SPX6900')
                    }}
                  >
                    Fund with 69K SPX6900
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
                    Fund Account
                  </Button>
                  {fundError && <Paragraph color="$error">{fundError.message}</Paragraph>}
                  {fundData && (
                    <YStack gap="$2" mt="$4">
                      <Paragraph>Result</Paragraph>
                      {Object.entries(fundData).map(([key, value]) =>
                        value ? (
                          <Paragraph key={key}>
                            <Anchor href={`${baseMainnet.blockExplorers.default.url}/tx/${value}`}>
                              {key} transaction: {shorten(value)}
                            </Anchor>
                          </Paragraph>
                        ) : (
                          <Paragraph key={key}>{key}: too much balance.</Paragraph>
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
