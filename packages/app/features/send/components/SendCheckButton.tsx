import { Card, Paragraph, useThemeName, XStack, YStack } from '@my/ui'
import { FileSignature } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'

export const SendCheckButton = () => {
  const { t } = useTranslation('send')
  const router = useRouter()
  const isDark = useThemeName()?.startsWith('dark')

  return (
    <Card
      size="$4"
      padded
      elevation={1}
      br="$5"
      cur="pointer"
      hoverStyle={{ opacity: 0.9, scale: 0.995 }}
      pressStyle={{ scale: 0.98 }}
      animation="100ms"
      onPress={() => router.push('/check/send')}
      bc={isDark ? '$color2' : '$gray2'}
      maw={600}
      $sm={{ maw: '100%' }}
    >
      <XStack ai="center" gap="$3">
        <XStack
          w="$4"
          h="$4"
          br="$4"
          ai="center"
          jc="center"
          bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
        >
          <FileSignature size="$1.5" color={isDark ? '$primary' : '$color12'} />
        </XStack>
        <YStack f={1} gap="$1">
          <Paragraph size="$5" fontWeight="600" color="$color12">
            {t('check.button')}
          </Paragraph>
          <Paragraph size="$3" color="$color10">
            {t('check.buttonDescription')}
          </Paragraph>
        </YStack>
      </XStack>
    </Card>
  )
}
