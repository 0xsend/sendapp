import { Card, Paragraph, useMedia, useThemeName, XStack, YStack } from '@my/ui'
import { FileSignature, ListChecks } from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'solito/router'

interface SendCheckButtonProps {
  onPress: () => void
}

export const SendCheckButton = ({ onPress }: SendCheckButtonProps) => {
  const { t } = useTranslation('send')
  const router = useRouter()
  const { xs } = useMedia()
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')

  const sendButtonText = xs ? t('check.buttonShort') : t('check.button')
  const manageButtonText = xs ? t('check.manageButtonShort') : t('check.manageButton')

  return (
    <XStack gap="$3" maw={600} ai="stretch" $sm={{ maw: '100%' }}>
      <Card
        size="$4"
        padded
        elevation={1}
        $platform-native={{
          elevation: 1,
          shadowOpacity: 0.1,
        }}
        br="$5"
        cur="pointer"
        hoverStyle={{ opacity: 0.9, scale: 0.995 }}
        pressStyle={{ scale: 0.98 }}
        animation="100ms"
        onPress={onPress}
        bc={isDark ? '$aztec4' : '$white'}
        f={1}
        fb={0}
      >
        <XStack ai="center" gap="$3">
          <XStack
            w="$4"
            h="$4"
            br="$4"
            ai="center"
            jc="center"
            bc={isDark ? '$aztec6' : '$gray3'}
            flexShrink={0}
          >
            <FileSignature size="$1.5" color="$neon9" />
          </XStack>
          <YStack f={1} gap="$1" flexShrink={1}>
            {!xs && (
              <Paragraph size="$5" fontWeight="600" color="$color12" numberOfLines={1}>
                {t('check.button')}
              </Paragraph>
            )}
            <Paragraph size={xs ? '$4' : '$3'} color="$color10">
              {t('check.buttonDescription')}
            </Paragraph>
          </YStack>
        </XStack>
      </Card>

      <Card
        size="$4"
        padded
        elevation={1}
        $platform-native={{
          elevation: 1,
          shadowOpacity: 0.1,
        }}
        br="$5"
        cur="pointer"
        hoverStyle={{ opacity: 0.9, scale: 0.995 }}
        pressStyle={{ scale: 0.98 }}
        animation="100ms"
        onPress={() => router.push('/check')}
        bc={isDark ? '$aztec4' : '$white'}
        f={1}
        fb={0}
      >
        <XStack ai="center" gap="$3">
          <XStack
            w="$4"
            h="$4"
            br="$4"
            ai="center"
            jc="center"
            bc={isDark ? '$aztec6' : '$gray3'}
            flexShrink={0}
          >
            <ListChecks size="$1.5" color="$neon9" />
          </XStack>
          <YStack f={1} gap="$1" flexShrink={1}>
            {!xs && (
              <Paragraph size="$5" fontWeight="600" color="$color12" numberOfLines={1}>
                {t('check.manageButton')}
              </Paragraph>
            )}
            <Paragraph size={xs ? '$4' : '$3'} color="$color10">
              {t('check.manageButtonDescription')}
            </Paragraph>
          </YStack>
        </XStack>
      </Card>
    </XStack>
  )
}
