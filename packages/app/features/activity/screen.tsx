import { RecentActivity } from './RecentActivity'
import { AnimatePresence, H4, Spinner, Text, useMedia, YStack } from '@my/ui'
import { TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import Search from '../../components/SearchBar'

export function ActivityScreen() {
  return (
    <TagSearchProvider>
      <YStack f={1} width={'100%'} pb="$3" pt="$3" gap="$6" $gtLg={{ pt: 0, gap: '$7' }}>
        <YStack width={'100%'} gap="$1.5" $gtSm={{ gap: '$2.5' }} $gtLg={{ display: 'none' }}>
          <Search />
        </YStack>
        <AnimatePresence>
          <ActivityBody />
        </AnimatePresence>
      </YStack>
    </TagSearchProvider>
  )
}

function ActivityBody() {
  const { isLoading, results, error } = useTagSearch()
  const media = useMedia()

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
    <>
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
          <H4 theme={'alt2'}>Error</H4>
          <Text>{error.message.split('.').at(0)}</Text>
        </YStack>
      )}

      <Search.Results key="results" />

      {results === null && !isLoading && !error && recentActivity}
    </>
  )
}
