import { Button, Card, H4, Paragraph, Spinner, useThemeName, XStack, YStack } from '@my/ui'
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import { Platform } from 'react-native'
import { useMemo, useState } from 'react'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useCoingeckoCoin } from 'app/utils/coin-gecko'

const MAX_LINES = 3 // 3 lines * 24px lineHeight = 72px
const CLAMP_HEIGHT = 24 * MAX_LINES

export const TokenAbout = () => {
  const { coin, isLoading: isLoadingCoin } = useCoinFromTokenParam()
  const { data: coingeckoCoin, isLoading: isLoadingCoingeckoCoin } = useCoingeckoCoin(
    coin?.coingeckoTokenId
  )
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')
  const isLoading = !!isLoadingCoin || isLoadingCoingeckoCoin
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const [measuredHeight, setMeasuredHeight] = useState<number>(0)

  const raw = coingeckoCoin?.description?.en ?? ''
  const aboutFromApi = typeof raw === 'string' ? raw.replace(/\r\n/g, '\n').trim() : ''
  const about = useMemo(() => {
    if (coin?.coingeckoTokenId === 'send-token-2') {
      return 'Send, Save, Invest. Your global wallet app, built for real life.'
    }
    if (coin?.coingeckoTokenId === 'canton-network') {
      return 'Canton Network enables selective privacy, data protection, and regulatory compliance for institutional financial markets through synchronized, real-time settlement across applications.'
    }
    return aboutFromApi
  }, [coin?.coingeckoTokenId, aboutFromApi])

  const showReadMore = useMemo(
    () => !expanded && (isTruncated || measuredHeight > CLAMP_HEIGHT),
    [expanded, isTruncated, measuredHeight]
  )
  const showCollapse = useMemo(
    () => expanded && (isTruncated || measuredHeight > CLAMP_HEIGHT),
    [expanded, isTruncated, measuredHeight]
  )

  const handleTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    // When the full text spans more than MAX_LINES, enable the Read More control
    if (!expanded) {
      const lines = e?.nativeEvent?.lines?.length ?? 0
      setIsTruncated(lines > MAX_LINES)
    }
  }

  // Don't render if coin doesn't have CoinGecko ID
  if (!coin?.coingeckoTokenId) {
    return null
  }

  // Don't render if there's no description
  if (!isLoading && !about) {
    return null
  }

  return (
    <YStack gap={'$3'}>
      <H4 fontWeight={600} size={'$7'}>
        About {coin?.label ?? 'This Coin'}
      </H4>
      {isLoading ? (
        <Spinner size="small" color={'$color12'} />
      ) : (
        <Card
          py="$5"
          px="$4"
          w={'100%'}
          elevation={1}
          $platform-native={{
            elevation: 1,
            shadowOpacity: 0.1,
          }}
        >
          <YStack gap={'$3'}>
            <Paragraph
              color={'$color12'}
              // Clamp to 72px (3 lines at 24px) when not expanded
              numberOfLines={expanded ? undefined : MAX_LINES}
              lineHeight={24}
              textOverflow={'ellipsis'}
              {...(Platform.OS !== 'web' ? { onTextLayout: handleTextLayout } : {})}
            >
              {about}
            </Paragraph>
            {showReadMore ? (
              <XStack>
                <Button size="$3" chromeless onPress={() => setExpanded(true)}>
                  <Paragraph
                    textDecorationLine="underline"
                    color={isDark ? '$primary' : '$color12'}
                  >
                    Read More
                  </Paragraph>
                </Button>
              </XStack>
            ) : null}
            {showCollapse ? (
              <XStack>
                <Button size="$3" chromeless onPress={() => setExpanded(false)}>
                  <Paragraph textDecorationLine="underline" color={'$primary'}>
                    Show Less
                  </Paragraph>
                </Button>
              </XStack>
            ) : null}

            {/* Hidden measurement block to detect overflow on web */}
            {!expanded ? (
              <YStack
                pos="absolute"
                o={0}
                zi={-1}
                pe="none"
                w={'100%'}
                onLayout={(e) => setMeasuredHeight(e.nativeEvent.layout.height)}
              >
                <Paragraph lineHeight={24}>{about}</Paragraph>
              </YStack>
            ) : null}
          </YStack>
        </Card>
      )}
    </YStack>
  )
}
