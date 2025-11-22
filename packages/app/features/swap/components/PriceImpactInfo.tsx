import { Paragraph, Popover, PrimaryButton, Sheet, useMedia, XStack, YStack } from '@my/ui'
import { Info } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Platform } from 'react-native'
import { useTranslation } from 'react-i18next'

interface PriceImpactInfoProps {
  color: '$warning' | '$error' | '$orange8' | '$color12'
}

export const PriceImpactInfo = ({ color }: PriceImpactInfoProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const media = useMedia()
  const { t } = useTranslation('trade')
  const tips = t('priceImpactInfo.tips', { returnObjects: true }) as string[]

  // Use sheet for mobile/tablet, popover for desktop
  const shouldUseSheet = Platform.OS !== 'web' || media.sm || media.md

  if (shouldUseSheet) {
    return (
      <>
        <XStack
          ai="center"
          onPress={() => setIsOpen(true)}
          pressStyle={{ opacity: 0.7 }}
          cursor="pointer"
        >
          <Info size={16} color={color} />
        </XStack>

        <Sheet
          open={isOpen}
          onOpenChange={setIsOpen}
          modal
          dismissOnSnapToBottom
          dismissOnOverlayPress
          native={Platform.OS !== 'web'}
          snapPoints={['fit']}
          snapPointsMode="fit"
        >
          <Sheet.Frame key="price-impact-info-sheet" gap="$4" padding="$4" pb="$6">
            <YStack gap="$4">
              <Paragraph fontWeight="600" size="$6">
                {t('priceImpactInfo.title')}
              </Paragraph>
              <Paragraph size="$4" lineHeight={22}>
                {t('priceImpactInfo.description')}
              </Paragraph>
              <YStack gap="$2.5" mt="$2">
                <Paragraph size="$4" fontWeight="600">
                  {t('priceImpactInfo.tipsTitle')}
                </Paragraph>
                {tips.map((tip) => (
                  <XStack key={tip} gap="$2" ai="flex-start">
                    <Paragraph size="$4" color="$color11">
                      •
                    </Paragraph>
                    <Paragraph size="$4" color="$color11" f={1}>
                      {tip}
                    </Paragraph>
                  </XStack>
                ))}
              </YStack>
              <XStack justifyContent="flex-end" marginTop="$2">
                <PrimaryButton onPress={() => setIsOpen(false)}>
                  <PrimaryButton.Text>{t('priceImpactInfo.dismiss')}</PrimaryButton.Text>
                </PrimaryButton>
              </XStack>
            </YStack>
          </Sheet.Frame>
          <Sheet.Overlay />
        </Sheet>
      </>
    )
  }

  // Desktop: Show popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} size="$5" allowFlip placement="top">
      <Popover.Trigger asChild>
        <XStack ai="center" hoverStyle={{ opacity: 0.8 }}>
          <Info size={16} color={color} />
        </XStack>
      </Popover.Trigger>

      <Popover.Content
        borderWidth={1}
        borderColor="$borderColor"
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        elevate
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        padding="$4"
        maxWidth={340}
      >
        <Popover.Arrow borderWidth={1} borderColor="$borderColor" />
        <YStack gap="$3">
          <Paragraph fontWeight="600" size="$5">
            {t('priceImpactInfo.title')}
          </Paragraph>
          <Paragraph size="$3" lineHeight={20} color="$color11">
            {t('priceImpactInfo.description')}
          </Paragraph>
          <YStack gap="$2" mt="$1">
            <Paragraph size="$3" fontWeight="600">
              {t('priceImpactInfo.tipsTitle')}
            </Paragraph>
            {tips.map((tip) => (
              <XStack key={tip} gap="$2" ai="flex-start">
                <Paragraph size="$3" color="$color11">
                  •
                </Paragraph>
                <Paragraph size="$3" color="$color11" f={1}>
                  {tip}
                </Paragraph>
              </XStack>
            ))}
          </YStack>
        </YStack>
      </Popover.Content>
    </Popover>
  )
}
