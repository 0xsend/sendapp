import type { Tables } from '@my/supabase/database.types'
import {
  Adapt,
  Button,
  Dialog,
  KVTable,
  ScrollView,
  Section,
  Sheet,
  SizableText,
  Unspaced,
  XStack,
  ButtonText,
  Tooltip,
  Paragraph,
  Separator,
  YStack,
  H6,
} from '@my/ui'
import { Info, X } from '@tamagui/lucide-icons'
import React, { useMemo } from 'react'
import { getPriceInWei } from './checkout-utils'

import { formatEther } from 'viem'
import { useUser } from 'app/utils/useUser'

export function SendTagPricingDialog({ name = '' }: { name: Tables<'tags'>['name'] }) {
  const { tags } = useUser()
  const price = useMemo(() => getPriceInWei([{ name }], tags || []), [name, tags])
  return (
    <Dialog modal>
      <Dialog.Trigger asChild>
        <Button
          als="flex-end"
          maw="$20"
          chromeless
          iconAfter={<Info size={'$2'} />}
          px={0}
          hoverStyle={{ bc: 'transparent', borderColor: 'transparent' }}
          pressStyle={{ bc: 'transparent', borderColor: 'transparent' }}
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
                  return `${formatEther(price)} ETH`
              }
            })()}
          </ButtonText>
        </Button>
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
        >
          <Dialog.Title>Sendtag Pricing</Dialog.Title>
          <Dialog.Description>
            Sendtags are priced based on their length. The shorter the Sendtag, the more it costs.
          </Dialog.Description>
          <ScrollView>
            <Section>
              <KVTable>
                <KVTable.Row>
                  <KVTable.Key>
                    <SizableText fontWeight="900">5+ characters</SizableText>
                  </KVTable.Key>
                  <KVTable.Value>
                    <SizableText>{(0.01).toLocaleString()} ETH</SizableText>
                  </KVTable.Value>
                </KVTable.Row>
                <KVTable.Row>
                  <KVTable.Key>
                    <SizableText fontWeight="900">4 characters</SizableText>
                  </KVTable.Key>
                  <KVTable.Value>
                    <SizableText>{(0.02).toLocaleString()} ETH</SizableText>
                  </KVTable.Value>
                </KVTable.Row>
                <KVTable.Row>
                  <KVTable.Key>
                    <SizableText fontWeight="900">1-3 characters</SizableText>
                  </KVTable.Key>
                  <KVTable.Value>
                    <SizableText>{(0.03).toLocaleString()} ETH</SizableText>
                  </KVTable.Value>
                </KVTable.Row>
              </KVTable>
            </Section>
          </ScrollView>

          <XStack alignSelf="flex-end" gap="$4">
            <Dialog.Close displayWhenAdapted asChild>
              <Button theme="alt1" aria-label="Close">
                Ok
              </Button>
            </Dialog.Close>
          </XStack>

          <Unspaced>
            <Dialog.Close asChild>
              <Button position="absolute" top="$3" right="$3" size="$2" circular icon={X} />
            </Dialog.Close>
          </Unspaced>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export function SendTagPricingTooltip({ name = '' }: { name: Tables<'tags'>['name'] }) {
  const { tags } = useUser()
  const price = useMemo(() => getPriceInWei([{ name }], tags || []), [name, tags])
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <Tooltip placement="right" delay={0} allowFlip={false} offset={84} onOpenChange={setIsOpen}>
      <XStack pos="relative">
        <Tooltip.Trigger>
          <Button
            als="flex-end"
            maw="$20"
            chromeless
            iconAfter={<Info size={'$2'} />}
            px={0}
            hoverStyle={{ bc: 'transparent', borderColor: 'transparent', scale: 1.05 }}
            pressStyle={{
              bc: 'transparent',
              borderColor: 'transparent',
              outlineColor: 'transparent',
            }}
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
                    return `${formatEther(price)} ETH`
                }
              })()}
            </ButtonText>
          </Button>
        </Tooltip.Trigger>
        {isOpen && (
          <Separator
            enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            w={68}
            boc={'$color10'}
            borderStyle="dashed"
            pos={'absolute'}
            right={-72}
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
        <Tooltip.Arrow $theme-dark={{ boc: '$black' }} $theme-light={{ boc: '$gray4Light' }} />
        <YStack gap="$4">
          <H6
            ta={'left'}
            $theme-dark={{ col: '$white' }}
            $theme-light={{ col: '$black' }}
            fontFamily={'$mono'}
          >
            Send Tag Pricing
          </H6>
          <Paragraph size={'$4'} $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            Sendtag price is based on length — the shorter it is, the higher the price.
          </Paragraph>

          <YStack gap="$4" jc="center">
            <XStack>
              <SizableText
                fontWeight="900"
                $theme-dark={{ col: '$white' }}
                $theme-light={{ col: '$black' }}
                w="50%"
                fontFamily={'$mono'}
              >
                6+ characters
              </SizableText>

              <SizableText
                f={1}
                ta="left"
                $theme-dark={{ col: '$primary' }}
                $theme-light={{ col: '$color12' }}
                fontFamily={'$mono'}
              >
                {(0.005).toLocaleString()} ETH
              </SizableText>
            </XStack>
            <XStack>
              <SizableText
                fontWeight="900"
                $theme-dark={{ col: '$white' }}
                $theme-light={{ col: '$black' }}
                w="50%"
                fontFamily={'$mono'}
              >
                5 characters
              </SizableText>

              <SizableText
                f={1}
                ta="left"
                $theme-dark={{ col: '$primary' }}
                $theme-light={{ col: '$color12' }}
                fontFamily={'$mono'}
              >
                {(0.01).toLocaleString()} ETH
              </SizableText>
            </XStack>
            <XStack>
              <SizableText
                fontWeight="900"
                $theme-dark={{ col: '$white' }}
                $theme-light={{ col: '$black' }}
                w="50%"
                fontFamily={'$mono'}
              >
                4 characters
              </SizableText>
              <SizableText
                f={1}
                ta="left"
                $theme-dark={{ col: '$primary' }}
                $theme-light={{ col: '$color12' }}
                fontFamily={'$mono'}
              >
                {(0.02).toLocaleString()} ETH
              </SizableText>
            </XStack>
            <XStack>
              <SizableText
                fontWeight="900"
                $theme-dark={{ col: '$white' }}
                $theme-light={{ col: '$black' }}
                w="50%"
                fontFamily={'$mono'}
              >
                1-3 characters
              </SizableText>

              <SizableText
                f={1}
                ta="left"
                $theme-dark={{ col: '$primary' }}
                $theme-light={{ col: '$color12' }}
                fontFamily={'$mono'}
              >
                {(0.03).toLocaleString()} ETH
              </SizableText>
            </XStack>
          </YStack>
        </YStack>
      </Tooltip.Content>
    </Tooltip>
  )
}
