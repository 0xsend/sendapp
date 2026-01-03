import { useState, useMemo } from 'react'
import {
  Anchor,
  Button,
  Card,
  H3,
  Link,
  Paragraph,
  Spinner,
  Stack,
  Text,
  useMedia,
  useThemeName,
  XStack,
  YStack,
  useAppToast,
} from '@my/ui'
import { Check, Copy, ExternalLink } from '@tamagui/lucide-icons'
import * as Clipboard from 'expo-clipboard'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import { useBalance, useReadContracts } from 'wagmi'
import { baseMainnet, erc20Abi, multicall3Address, sendTokenAddress, usdcAddress } from '@my/wagmi'
import { IconArrowUp } from 'app/components/icons'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { sendCoin, usdcCoin } from 'app/data/coins'

interface ExternalAddressScreenProps {
  address: Address
}

export function ExternalAddressScreen({ address }: ExternalAddressScreenProps) {
  const media = useMedia()
  const toast = useAppToast()
  const isDark = useThemeName()?.startsWith('dark')
  const [hasCopied, setHasCopied] = useState(false)

  // Truncate address for display
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  // Fetch ETH balance
  const { data: ethBalance, isLoading: isLoadingEth } = useBalance({
    address,
    chainId: baseMainnet.id,
  })

  // Fetch SEND and USDC balances
  const tokenContracts = useMemo(
    () => [
      {
        address: sendTokenAddress[baseMainnet.id],
        abi: erc20Abi,
        chainId: baseMainnet.id,
        functionName: 'balanceOf',
        args: [address],
      },
      {
        address: usdcAddress[baseMainnet.id],
        abi: erc20Abi,
        chainId: baseMainnet.id,
        functionName: 'balanceOf',
        args: [address],
      },
    ],
    [address]
  )

  const { data: tokenBalances, isLoading: isLoadingTokens } = useReadContracts({
    contracts: tokenContracts,
    multicallAddress: multicall3Address[baseMainnet.id],
  })

  const {
    query: { data: tokenPrices, isLoading: isLoadingPrices },
  } = useTokenPrices()

  const isLoading = isLoadingEth || isLoadingTokens || isLoadingPrices

  // Extract balances
  const sendBalance =
    tokenBalances?.[0]?.status === 'success' ? BigInt(tokenBalances[0].result as bigint) : 0n
  const usdcBalance =
    tokenBalances?.[1]?.status === 'success' ? BigInt(tokenBalances[1].result as bigint) : 0n

  // Format balances for display
  const formattedSendBalance = formatUnits(sendBalance, sendCoin.decimals)
  const formattedUsdcBalance = formatUnits(usdcBalance, usdcCoin.decimals)
  const formattedEthBalance = ethBalance ? formatUnits(ethBalance.value, 18) : '0'

  // Calculate USD values
  const sendPrice = tokenPrices?.[sendTokenAddress[baseMainnet.id]] ?? 0
  const sendUsdValue = Number(formattedSendBalance) * sendPrice
  const usdcUsdValue = Number(formattedUsdcBalance) // USDC is 1:1 with USD

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(address).catch(() => toast.error('Failed to copy address'))
    setHasCopied(true)
    toast.show('Address copied')
    setTimeout(() => setHasCopied(false), 2000)
  }

  // Block explorer URL for Base chain
  const blockExplorerUrl = `https://basescan.org/address/${address}`

  return (
    <YStack gap="$4" ai="center" w="100%" maw={1024} p="$4">
      <Card gap="$4" size={media.gtMd ? '$7' : '$5'} padded elevation={1} w="100%">
        {/* Address Display */}
        <YStack gap="$3" ai="center">
          <H3 lineHeight={32} color="$color12" testID="externalAddress">
            External Address
          </H3>

          {/* Address with Copy Button */}
          <Button
            chromeless
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{
              backgroundColor: 'transparent',
              borderColor: 'transparent',
            }}
            focusStyle={{ backgroundColor: 'transparent' }}
            p={0}
            height="auto"
            onPress={copyToClipboard}
            testID="copyAddressButton"
          >
            <XStack gap="$2" ai="center">
              <Paragraph fontSize="$6" fontFamily="$mono" color="$color12">
                {truncatedAddress}
              </Paragraph>
              {hasCopied ? (
                <Check color="$primary" size="$1" $theme-light={{ color: '$color12' }} />
              ) : (
                <Copy
                  flexShrink={0}
                  size="$1"
                  color="$primary"
                  $theme-light={{ color: '$color12' }}
                />
              )}
            </XStack>
          </Button>

          <Paragraph fontSize="$2" color="$color10" fontFamily="$mono">
            {address}
          </Paragraph>
        </YStack>

        {/* On-chain Balances */}
        <YStack gap="$3" w="100%">
          <Paragraph color="$color10" fontSize="$4" fontWeight="600">
            On-chain Balances (Base)
          </Paragraph>

          {isLoading ? (
            <Stack ai="center" jc="center" p="$4">
              <Spinner size="small" color="$primary" />
            </Stack>
          ) : (
            <YStack gap="$2">
              {/* SEND Balance */}
              <XStack jc="space-between" ai="center" p="$2" br="$3" bc="$background">
                <Text color="$color12" fontWeight="500">
                  SEND
                </Text>
                <YStack ai="flex-end">
                  <Text color="$color12" fontWeight="600">
                    {Number(formattedSendBalance).toLocaleString(undefined, {
                      maximumFractionDigits: sendCoin.formatDecimals,
                    })}
                  </Text>
                  <Text color="$color10" fontSize="$2">
                    ${sendUsdValue.toFixed(2)}
                  </Text>
                </YStack>
              </XStack>

              {/* USDC Balance */}
              <XStack jc="space-between" ai="center" p="$2" br="$3" bc="$background">
                <Text color="$color12" fontWeight="500">
                  USDC
                </Text>
                <YStack ai="flex-end">
                  <Text color="$color12" fontWeight="600">
                    {Number(formattedUsdcBalance).toLocaleString(undefined, {
                      maximumFractionDigits: usdcCoin.formatDecimals,
                    })}
                  </Text>
                  <Text color="$color10" fontSize="$2">
                    ${usdcUsdValue.toFixed(2)}
                  </Text>
                </YStack>
              </XStack>

              {/* ETH Balance */}
              <XStack jc="space-between" ai="center" p="$2" br="$3" bc="$background">
                <Text color="$color12" fontWeight="500">
                  ETH
                </Text>
                <Text color="$color12" fontWeight="600">
                  {Number(formattedEthBalance).toLocaleString(undefined, {
                    maximumFractionDigits: 5,
                  })}
                </Text>
              </XStack>
            </YStack>
          )}
        </YStack>

        {/* Action Buttons */}
        <XStack w="100%" gap="$4">
          {/* Send Button */}
          <Link href={`/send?recipient=${address}&idType=address`} asChild f={1}>
            <Button
              borderRadius="$4"
              jc="center"
              ai="center"
              bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              f={1}
              testID="externalAddressSendButton"
            >
              <Button.Icon>
                <IconArrowUp size="$1" color={isDark ? '$primary' : '$color12'} />
              </Button.Icon>
              <Button.Text color="$color12" fontSize="$4" fontWeight="400" textAlign="center">
                Send
              </Button.Text>
            </Button>
          </Link>
        </XStack>

        {/* Links */}
        <XStack w="100%" gap="$4" jc="center">
          {/* History Link */}
          <Link
            href={`/profile/${address}/history`}
            textDecorationLine="underline"
            fontSize="$4"
            color="$color10"
          >
            View History
          </Link>

          {/* Block Explorer Link */}
          <Anchor
            href={blockExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            textDecorationLine="underline"
            fontSize="$4"
            color="$color10"
          >
            <XStack gap="$1" ai="center">
              <Text color="$color10">Basescan</Text>
              <ExternalLink size={14} color="$color10" />
            </XStack>
          </Anchor>
        </XStack>
      </Card>
    </YStack>
  )
}
