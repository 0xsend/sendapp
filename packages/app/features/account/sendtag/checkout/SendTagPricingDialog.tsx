import { Tables } from '@my/supabase/database.types'
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
          <Dialog.Title>Send Tag Pricing</Dialog.Title>
          <Dialog.Description>
            Send Tags are priced based on their length. The shorter the Send Tag, the more it costs.
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
