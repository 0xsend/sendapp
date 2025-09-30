import {
  type GetProps,
  Paragraph,
  ScrollView,
  Sheet,
  type SheetProps,
  useMedia,
  XStack,
  type XStackProps,
  YStack,
} from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import type { coin } from 'app/data/coins'
import { IconX } from './icons'

export const CoinSheet = ({ children, ...props }: SheetProps) => {
  const media = useMedia()
  return (
    <Sheet
      modal={media.lg}
      dismissOnSnapToBottom
      snapPoints={['fit']}
      snapPointsMode="fit"
      animation={'quick'}
      zIndex={100_000}
      {...props}
    >
      <Sheet.Frame elevation={'$5'} w={'100%'} bc={'$color1'}>
        {children}
      </Sheet.Frame>
      {media.lg ? (
        <Sheet.Overlay animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      ) : (
        <Sheet.Overlay opacity={0} />
      )}
    </Sheet>
  )
}

const Handle = ({ children, ...props }: GetProps<typeof Sheet.Handle>) => (
  <Sheet.Handle py="$6" f={1} bc="transparent" jc={'space-between'} opacity={1} m={0} {...props}>
    <XStack ai="center" jc="space-between" w="100%" px="$4">
      <Paragraph fontSize={'$5'} fontWeight={'700'} color={'$color12'}>
        {children}
      </Paragraph>
      <IconX color={'$color12'} size={'$2'} />
    </XStack>
  </Sheet.Handle>
)

const Item = ({ coin, ...props }: { coin: coin } & XStackProps) => {
  return (
    <XStack gap={'$2'} jc={'space-between'} py="$2.5" px="$3.5" {...props}>
      <XStack gap={'$2'} ai={'center'}>
        <IconCoin tokenAddress={coin.token} />
        <Paragraph
          fontSize={'$5'}
          fontWeight={'500'}
          textTransform={'uppercase'}
          color={'$color12'}
        >
          {coin.label}
        </Paragraph>
      </XStack>
    </XStack>
  )
}

const Items = ({ children, ...props }: GetProps<typeof Sheet.ScrollView>) => {
  return (
    <ScrollView {...props}>
      <XStack als="flex-start" w="100%" boc={'transparent'} f={1} jc={'flex-start'}>
        <YStack gap="$1" px={'$2'} pt={'$3'} pb={'$5'} w="100%">
          {children}
        </YStack>
      </XStack>
    </ScrollView>
  )
}

CoinSheet.Item = Item
CoinSheet.Handle = Handle
CoinSheet.Items = Items
