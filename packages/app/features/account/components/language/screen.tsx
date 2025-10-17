import { Card, Paragraph, Separator, Spinner, XStack, YStack } from '@my/ui'
import { SettingsHeader } from 'app/features/account/components/SettingsHeader'
import { useTranslation } from 'react-i18next'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, Platform } from 'react-native'
import { Check } from '@tamagui/lucide-icons'
import { getSupportedLocaleOptions } from 'app/i18n/locales'
import { useHoverStyles } from 'app/utils/useHoverStyles'

export const LanguagePreferences = () => {
  const { i18n, t } = useTranslation('settings')
  const [pendingLocale, setPendingLocale] = useState<string | null>(null)
  const resolvedLanguage = i18n.resolvedLanguage ?? i18n.language

  const options = useMemo(() => getSupportedLocaleOptions(), [])
  const hoverStyles = useHoverStyles()

  const handleSelect = useCallback(
    async (locale: string) => {
      if (locale === resolvedLanguage || pendingLocale === locale) {
        return
      }

      setPendingLocale(locale)
      try {
        await i18n.changeLanguage(locale)
      } finally {
        setPendingLocale(null)
      }
    },
    [i18n, pendingLocale, resolvedLanguage]
  )

  return (
    <YStack gap={'$3.5'} w={'100%'}>
      {Platform.OS === 'web' && <SettingsHeader>{t('language.title')}</SettingsHeader>}
      <Card gap={'$3'} padded size={'$4'}>
        <Paragraph size={'$4'} color={'$color12'}>
          {t('language.description')}
        </Paragraph>
        {pendingLocale ? (
          <Paragraph size={'$2'} color={'$lightGrayTextField'}>
            {t('language.updating')}
          </Paragraph>
        ) : null}
        <Separator boc={'$darkGrayTextField'} opacity={0.2} />
        <YStack>
          {options.map((option, index) => {
            const isActive = option.value === resolvedLanguage
            const isPending = pendingLocale === option.value

            return (
              <YStack key={option.value}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive, busy: isPending }}
                  disabled={isPending}
                  onPress={() => handleSelect(option.value)}
                >
                  <XStack
                    ai="center"
                    jc="space-between"
                    px={'$2'}
                    py={'$3'}
                    br={'$4'}
                    hoverStyle={hoverStyles}
                  >
                    <Paragraph size={'$5'}>{option.autonym}</Paragraph>
                    {isPending ? (
                      <Spinner size="small" />
                    ) : isActive ? (
                      <Check size={16} color={'$primary'} />
                    ) : null}
                  </XStack>
                </Pressable>
                {index < options.length - 1 && (
                  <Separator boc={'$darkGrayTextField'} opacity={0.15} />
                )}
              </YStack>
            )
          })}
        </YStack>
      </Card>
    </YStack>
  )
}
