import {
  type GetProps,
  Paragraph,
  ScrollView,
  SSheet as Sheet,
  useMedia,
  XStack,
  type XStackProps,
  YStack,
} from '@my/ui'
import { Adapt, isWeb, Popover, styled, useControllableState, type PopoverProps } from 'tamagui'
import { IconCoin } from 'app/components/icons/IconCoin'
import type { coin } from 'app/data/coins'

interface CoinsModalProps extends PopoverProps {
  trigger: React.ReactNode
}

export const CoinsModal = ({ children, trigger, ...props }: CoinsModalProps) => {
  const media = useMedia()

  const [open, setOpen] = useControllableState({
    prop: props.open,
    defaultProp: false,
    onChange: props.onOpenChange,
  })

  Sheet.useSheetIosBackgroundScale({
    isSheetOpen: open ?? false,
    onSheetOpenChange: setOpen,
    enabled: media.md,
  })

  return (
    <Popover
      offset={{
        mainAxis: -184,
      }}
      open={open}
      onOpenChange={setOpen}
      {...props}
    >
      {trigger}
      <Adapt when="md">
        <Sheet
          modal={media.md}
          dismissOnSnapToBottom
          snapPoints={[isWeb ? 95 : 80]}
          snapPointsMode="percent"
          animation="smoothResponsive"
          zIndex={100_000}
        >
          <Sheet.Frame pb={100} elevation="$5" bc="$color1">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay
            animation="100ms"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            $theme-dark={{
              o: 0,
            }}
          />
        </Sheet>
      </Adapt>
      {children}
    </Popover>
  )
}

const Item = ({ coin, ...props }: { coin: coin } & XStackProps) => {
  return (
    <XStack
      hoverStyle={{
        bg: '$aztec2',
      }}
      $theme-dark={{
        hoverStyle: {
          bg: '$aztec5',
        },
      }}
      gap={'$2'}
      jc={'space-between'}
      py="$2.5"
      px="$3.5"
      {...props}
    >
      <XStack gap="$3" ai="center">
        <IconCoin symbol={coin.symbol} />
        <Paragraph fontSize="$5" fontWeight="500" color="$color11">
          {coin.label}
        </Paragraph>
      </XStack>
    </XStack>
  )
}

const Items = ({ children, ...props }: GetProps<typeof Sheet.ScrollView>) => {
  return (
    <Popover.Close w="100%">
      <ScrollView {...props}>
        <XStack als="flex-start" w="100%" boc={'transparent'} f={1} jc={'flex-start'}>
          <YStack gap="$1" w="100%">
            {children}
          </YStack>
        </XStack>
      </ScrollView>
    </Popover.Close>
  )
}

const ConisModalContent = styled(Popover.Content, {
  rotate: '0deg',
  transformOrigin: 'center top',
  o: 1,
  enterStyle: { o: 0, y: 50 },
  exitStyle: { o: 0, y: 50 },
  elevation: '$5',
  shadowOpacity: 0.3,
  '$theme-dark': {
    elevation: '$5',
  },
  animateOnly: ['transform', 'opacity', 'filter'],
  w: '100%',
  p: 0,
  ov: 'hidden',
  br: '$6',
  animation: [
    'responsive',
    {
      opacity: {
        overshootClamping: true,
      },
    },
  ],
})

CoinsModal.Content = ConisModalContent
CoinsModal.Item = Item
CoinsModal.Items = Items
CoinsModal.Close = Popover.Close
CoinsModal.Trigger = Popover.Trigger
