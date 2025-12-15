import { RecentActivity } from './RecentActivity'
import { H4, LinearGradient, Spinner, Text, useMedia, useTheme, YStack } from '@my/ui'
import { TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import Search from '../../components/SearchBar'
import { Platform } from 'react-native'
import { useTranslation } from 'react-i18next'

export function ActivityScreen() {
  const theme = useTheme()

  return (
    <TagSearchProvider>
      <YStack
        f={1}
        width={'100%'}
        pb={Platform.OS === 'web' ? '$3' : 0}
        pt="$3"
        gap="$6"
        px={Platform.OS === 'web' ? 0 : '$4'}
        $gtMd={{ px: Platform.OS === 'web' ? 0 : '$6' }}
        $gtLg={{ pt: 0, gap: '$7', px: Platform.OS === 'web' ? 0 : '$11' }}
      >
        {Platform.OS === 'web' ? (
          <YStack width={'100%'} gap="$1.5" $gtSm={{ gap: '$2.5' }} $gtLg={{ display: 'none' }}>
            <Search />
          </YStack>
        ) : (
          <>
            <LinearGradient
              start={[0, 0]}
              end={[0, 1]}
              height={40}
              fullscreen
              zIndex={1}
              colors={['$background', '$background', `${theme.background.val}00`]}
              locations={[0, 0.3, 1]}
            />
            <YStack
              position={'absolute'}
              top={0}
              left={0}
              right={0}
              zIndex={1}
              paddingTop={'$3'}
              px={'$4'}
              $gtMd={{ px: '$6' }}
              $gtLg={{ px: '$11' }}
            >
              <Search />
            </YStack>
          </>
        )}
        <ActivityBody />
      </YStack>
    </TagSearchProvider>
  )
}

function ActivityBody() {
  const { isLoading, results, error } = useTagSearch()
  const media = useMedia()
  const { t } = useTranslation('activity')

  const recentActivity = (
    <YStack
      gap={'$4'}
      key="suggestions"
      animation="quick"
      exitStyle={{
        opacity: 0,
        y: 10,
      }}
      f={1}
    >
      <RecentActivity />
    </YStack>
  )

  if (media.gtLg) {
    return recentActivity
  }

  return (
    <YStack
      als="center"
      pos="absolute"
      b={0}
      mih="100%"
      w="100%"
      f={1}
      pt="$10"
      $platform-web={{
        y: '$6',
      }}
    >
      {isLoading && (
        <YStack
          key="loading"
          $gtLg={{
            maxWidth: 600,
          }}
        >
          <Spinner size="small" />
        </YStack>
      )}

      {error && (
        <YStack key="red" gap="$4" mb="$4">
          <H4 theme={'alt2'}>{t('errors.title')}</H4>
          <Text>{error.message.split('.').at(0) ?? t('errors.fallback')}</Text>
        </YStack>
      )}

      <Search.Results key="results" />

      {results === null && !isLoading && !error && recentActivity}
    </YStack>
  )
}
