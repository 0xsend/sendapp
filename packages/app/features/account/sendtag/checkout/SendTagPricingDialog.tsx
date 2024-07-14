import type { Tables } from '@my/supabase/database.types'
import {
  Adapt,
  Button,
  ButtonIcon,
  ButtonText,
  Dialog,
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
import { total, pricing } from 'app/data/sendtags'
import React, { useMemo, useState } from 'react'
import { formatUnits } from 'viem'

export function SendTagPricingDialog({ name = '' }: { name: Tables<'tags'>['name'] }) {
  const price = useMemo(() => total([{ name }]), [name])
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Dialog modal onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <SendTagPricingButton isOpen={isOpen} name={name} price={price} />
      </Dialog.Trigger>
      <Adapt when="sm" platform="touch">
        <Sheet zIndex={200000} modal dismissOnSnapToBottom disableDrag>
          <Sheet.Frame padding="$4" gap="$4">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        </Sheet>
      </Adapt>

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
          elevate
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
          width="100%"
          maw={600}
          $theme-dark={{ bc: '$black' }}
          $theme-light={{ bc: '$gray4Light' }}
        >
          <Dialog.Title
            ta={'left'}
            $theme-dark={{ col: '$white' }}
            $theme-light={{ col: '$black' }}
            fontFamily={'$mono'}
          >
            Sendtag Pricing
          </Dialog.Title>
          <Dialog.Description
            size={'$4'}
            $theme-dark={{ col: '$white' }}
            $theme-light={{ col: '$black' }}
          >
            Sendtags are priced based on their length. The shorter the Sendtag, the more it costs.
          </Dialog.Description>
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
            <Dialog.Close displayWhenAdapted asChild>
              <Button aria-label="Close">
                <ButtonText color="$color12">OK</ButtonText>
              </Button>
            </Dialog.Close>
          </XStack>

          <Unspaced>
            <Dialog.Close asChild>
              <Button position="absolute" top="$3" right="$3" size="$2" circular>
                <ButtonIcon>
                  <X size={16} color="$color12" />
                </ButtonIcon>
              </Button>
            </Dialog.Close>
          </Unspaced>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
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
}: { isOpen: boolean; name: string; price: bigint }) => {
  return (
    <Button
      als="flex-end"
      maw="$20"
      chromeless
      $theme-dark={{
        iconAfter: isOpen ? (
          <XCircle color="$primary" size={'$2'} />
        ) : (
          <IconInfoGreenCircle color="$white" size={'$2'} />
        ),
      }}
      $theme-light={{
        iconAfter: isOpen ? <XCircle color="$black" size={'$2'} /> : <Info size={'$2'} />,
      }}
      hoverStyle={{ bc: 'transparent' }}
      pressStyle={{ bc: 'transparent' }}
      // @ts-expect-error tamagui doesn't support this yet
      type="button"
    >
      <ButtonText fontFamily={'$mono'} col={'$color12'} fontSize={'$5'}>
        {(() => {
          switch (true) {
            case name.length === 0:
              return 'Pricing'
            case name.length > 0 && price === BigInt(0):
              return 'Free'
            default:
              return `${formatUnits(price, 6)} USDC`
          }
        })()}
      </ButtonText>
    </Button>
  )
}
