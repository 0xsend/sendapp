import { Card, Paragraph, XStack, YStack } from '@my/ui'
import { FileSignature, ListChecks } from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'solito/router'

interface SendCheckButtonProps {
  onPress: () => void
}

export const SendCheckButton = ({ onPress }: SendCheckButtonProps) => {
  const { t } = useTranslation('send')
  const router = useRouter()

  return (
    <XStack gap="$3" maw={600} $sm={{ maw: '100%' }}>
      <Card
        size="$4"
        padded
        elevation={1}
        br="$5"
        cur="pointer"
        hoverStyle={{ opacity: 0.9, scale: 0.995 }}
        pressStyle={{ scale: 0.98 }}
        animation="100ms"
        onPress={onPress}
        bc="$aztec4"
        $theme-light={{ bc: '$white' }}
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
            bc="$aztec6"
            $theme-light={{ bc: '$gray3' }}
          >
            <FileSignature size="$1.5" color="$neon9" />
          </XStack>
          <YStack f={1} gap="$1" miw={0}>
            <Paragraph size="$5" fontWeight="600" color="$color12" numberOfLines={1}>
              {t('check.button')}
            </Paragraph>
            <Paragraph size="$3" color="$color10" numberOfLines={2}>
              {t('check.buttonDescription')}
            </Paragraph>
          </YStack>
        </XStack>
      </Card>

      <Card
        size="$4"
        padded
        elevation={1}
        br="$5"
        cur="pointer"
        hoverStyle={{ opacity: 0.9, scale: 0.995 }}
        pressStyle={{ scale: 0.98 }}
        animation="100ms"
        onPress={() => router.push('/check')}
        bc="$aztec4"
        $theme-light={{ bc: '$white' }}
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
            bc="$aztec6"
            $theme-light={{ bc: '$gray3' }}
          >
            <ListChecks size="$1.5" color="$neon9" />
          </XStack>
          <YStack f={1} gap="$1" miw={0}>
            <Paragraph size="$5" fontWeight="600" color="$color12" numberOfLines={1}>
              {t('check.manageButton', 'Manage Checks')}
            </Paragraph>
            <Paragraph size="$3" color="$color10" numberOfLines={2}>
              {t('check.manageButtonDescription', 'View and cancel checks')}
            </Paragraph>
          </YStack>
        </XStack>
      </Card>
    </XStack>
  )
}
