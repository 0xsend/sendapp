import { Button, Card, H4, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { useCoinData } from 'app/utils/coin-gecko'
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import { useMemo, useState } from 'react'

const MAX_LINES = 3 // 3 lines * 24px lineHeight = 72px
const CLAMP_HEIGHT = 24 * MAX_LINES

export const TokenAbout = ({ coin }: { coin: CoinWithBalance }) => {
  const { data, isLoading } = useCoinData(coin.coingeckoTokenId)
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const [measuredHeight, setMeasuredHeight] = useState<number>(0)

  const raw = data?.description?.en ?? ''
  const aboutFromApi = typeof raw === 'string' ? raw.replace(/\r\n/g, '\n').trim() : ''
  const about = useMemo(() => {
    if (coin.coingeckoTokenId === 'send-token-2') {
      return 'Send, Save, Invest. Your global wallet app, built for real life.'
    }
    return aboutFromApi
  }, [coin.coingeckoTokenId, aboutFromApi])

  const showReadMore = useMemo(
    () => !expanded && (isTruncated || measuredHeight > CLAMP_HEIGHT),
    [expanded, isTruncated, measuredHeight]
  )
  const showCollapse = useMemo(
    () => expanded && (isTruncated || measuredHeight > CLAMP_HEIGHT),
    [expanded, isTruncated, measuredHeight]
  )

  if (isLoading) return <Spinner size="small" color={'$color12'} />
  if (!about) return null

  const handleTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    // When the full text spans more than MAX_LINES, enable the Read More control
    if (!expanded) {
      const lines = e?.nativeEvent?.lines?.length ?? 0
      setIsTruncated(lines > MAX_LINES)
    }
  }

  return (
    <YStack gap={'$3'}>
      <H4 fontWeight={600} size={'$7'}>
        About {coin.label}
      </H4>
      <Card py="$5" px="$4" w={'100%'} elevation={'$0.75'}>
        <YStack gap={'$3'}>
          <Paragraph
            color={'$color12'}
            // Clamp to 72px (3 lines at 24px) when not expanded
            numberOfLines={expanded ? undefined : MAX_LINES}
            lineHeight={24}
            textOverflow={'ellipsis'}
            onTextLayout={handleTextLayout}
          >
            {about}
          </Paragraph>
          {showReadMore ? (
            <XStack>
              <Button size="$3" chromeless onPress={() => setExpanded(true)}>
                <Paragraph textDecorationLine="underline" color={'$primary'}>
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
    </YStack>
  )
}
