import type { Tables } from '@my/supabase/database.types'
import {
  Button,
  ButtonIcon,
  ButtonText,
  Dialog,
  H2,
  H6,
  Paragraph,
  Separator,
  Sheet,
  SizableText,
  Tooltip,
  Unspaced,
  XStack,
  YStack,
} from '@my/ui'
import { Info, X, XCircle } from '@tamagui/lucide-icons'
import { IconInfoGreenCircle } from 'app/components/icons'
import { pricing, total } from 'app/data/sendtags'
import React, { useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { formatUnits } from 'viem'
import { usdcCoin } from 'app/data/coins'
import { useThemeSetting } from '@tamagui/next-theme'

export function SendTagPricingDialog({ name = '' }: { name: Tables<'tags'>['name'] }) {
  const price = useMemo(() => total([{ name }]), [name])
  const [isOpen, setIsOpen] = useState(false)

  // Shared content component to avoid duplication
  const dialogContent = (
    <>
      <H2
        ta={'left'}
        $theme-dark={{ col: '$white' }}
        $theme-light={{ col: '$black' }}
        fontFamily={'$mono'}
      >
        Sendtag Pricing
      </H2>
      <Paragraph size={'$4'} $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
        Sendtags are priced based on their length. The shorter the Sendtag, the more it costs.
      </Paragraph>
      <YStack gap="$4" jc="center">
        {pricing.map((item) => (
          <XStack key={item.length}>
            <SizableText
              fontWeight="900"
              $theme-dark={{ col: '$white' }}
              $theme-light={{ col: '$black' }}
              w="50%"
              fontFamily={'$mono'}
            >
              {item.length}
            </SizableText>
            <SizableText
              f={1}
              ta="left"
              $theme-dark={{ col: '$primary' }}
              $theme-light={{ col: '$color12' }}
              fontFamily={'$mono'}
            >
              {item.price} USDC
            </SizableText>
          </XStack>
        ))}
      </YStack>
      <XStack alignSelf="flex-end" gap="$4">
        {Platform.OS === 'web' && (
          <Dialog.Close asChild>
            <Button aria-label="Close">
              <ButtonText color="$color12">OK</ButtonText>
            </Button>
          </Dialog.Close>
        )}
      </XStack>
      {Platform.OS === 'web' && (
        <Unspaced>
          <Dialog.Close asChild>
            <Button position="absolute" top="$3" right="$3" size="$2" circular>
              <ButtonIcon>
                <X size={16} color="$color12" />
              </ButtonIcon>
            </Button>
          </Dialog.Close>
        </Unspaced>
      )}
    </>
  )

  // Web version using Dialog
  if (Platform.OS === 'web') {
    return (
      <Dialog modal onOpenChange={setIsOpen}>
        <Dialog.Trigger>
          <SendTagPricingButton isOpen={isOpen} name={name} price={price} />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevation={'$0.75'}
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            gap="$4"
            width="90%"
            maw={600}
            $theme-dark={{ bc: '$black' }}
            $theme-light={{ bc: '$gray4Light' }}
            testID={'sendtag-pricing-dialog'}
          >
            {dialogContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    )
  }

  // Native version using Sheet
  return (
    <>
      <SendTagPricingButton
        isOpen={isOpen}
        name={name}
        price={price}
        onPress={() => setIsOpen(true)}
      />
      <Sheet
        open={isOpen}
        onOpenChange={setIsOpen}
        modal
        dismissOnSnapToBottom
        dismissOnOverlayPress
        native
        snapPoints={[50]}
      >
        <Sheet.Frame key="sendtag-pricing-sheet" gap="$4" padding="$4">
          {dialogContent}
        </Sheet.Frame>
        <Sheet.Overlay />
      </Sheet>
    </>
  )
}

export function SendTagPricingTooltip({ name = '' }: { name: Tables<'tags'>['name'] }) {
  const price = useMemo(() => total([{ name }]), [name])
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <Tooltip placement="right" delay={0} allowFlip={false} offset={84} onOpenChange={setIsOpen}>
      <XStack pos="relative">
        <Tooltip.Trigger>
          <SendTagPricingButton isOpen={isOpen} name={name} price={price} />
        </Tooltip.Trigger>
        {isOpen && (
          <Separator
            w={68}
            theme="green"
            boc={'$color10'}
            borderStyle="dashed"
            pos={'absolute'}
            right={-69}
            top="50%"
            transform="translateY(-50%)"
          />
        )}
      </XStack>

      <Tooltip.Content
        enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        scale={1}
        x={0}
        y={0}
        opacity={1}
        maw={361}
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        $theme-dark={{ bc: '$black' }}
        $theme-light={{ bc: '$gray4Light' }}
        p={'$5'}
      >
        <Tooltip.Arrow $theme-dark={{ bc: '$black' }} $theme-light={{ bc: '$gray4Light' }} />
        <YStack testID="SendTagPricingTooltipContent" gap="$4">
          <H6
            ta={'left'}
            $theme-dark={{ col: '$white' }}
            $theme-light={{ col: '$black' }}
            fontFamily={'$mono'}
          >
            Sendtag Pricing
          </H6>
          <Paragraph size={'$4'} $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            Sendtag price is based on length — the shorter it is, the higher the price.
          </Paragraph>

          <YStack gap="$4" jc="center">
            {pricing.map((item) => (
              <XStack key={item.length}>
                <SizableText
                  fontWeight="900"
                  $theme-dark={{ col: '$white' }}
                  $theme-light={{ col: '$black' }}
                  w="50%"
                  fontFamily={'$mono'}
                >
                  {item.length}
                </SizableText>
                <SizableText
                  f={1}
                  ta="left"
                  $theme-dark={{ col: '$primary' }}
                  $theme-light={{ col: '$color12' }}
                  fontFamily={'$mono'}
                >
                  {item.price} USDC
                </SizableText>
              </XStack>
            ))}
          </YStack>
        </YStack>
      </Tooltip.Content>
    </Tooltip>
  )
}

const SendTagPricingButton = ({
  isOpen,
  name,
  price,
  onPress,
}: {
  isOpen: boolean
  name: string
  price: bigint
  onPress?: () => void
}) => {
  const { resolvedTheme } = useThemeSetting()
  const isDark = resolvedTheme?.startsWith('dark')

  return (
    <Button
      chromeless
      p={0}
      iconAfter={
        isOpen ? (
          <XCircle color={isDark ? '$primary' : '$black'} size={'$1'} />
        ) : isDark ? (
          <IconInfoGreenCircle color="$primary" size={'$1'} />
        ) : (
          <Info size={'$1'} />
        )
      }
      hoverStyle={{ bc: 'transparent' }}
      pressStyle={{ bc: 'transparent', borderColor: 'transparent' }}
      // @ts-expect-error tamagui doesn't support this yet
      type="button"
      onPress={onPress}
    >
      <ButtonText col={'$color12'} fontSize={'$5'}>
        {(() => {
          switch (true) {
            case name.length === 0:
              return 'Pricing'
            case name.length > 0 && price === BigInt(0):
              return 'Free'
            default:
              return `${formatUnits(price, usdcCoin.decimals)} USDC`
          }
        })()}
      </ButtonText>
    </Button>
  )
}
