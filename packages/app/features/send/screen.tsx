import { AnimatePresence, Container, H4, Separator, Spinner, Text, YStack } from '@my/ui'
import { useSendScreenParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { SendAmountForm } from './SendAmountForm'
import { TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import Search from 'app/components/SearchBar'
import { RecentActivity } from '../activity/RecentActivity'

export const SendScreen = () => {
  const [{ recipient }] = useSendScreenParams()
  const { data: profile, isLoading, error } = useProfileLookup('tag', recipient ?? '')
  if (isLoading) return <Spinner size="large" />
  if (error) throw new Error(error.message)
  if (!profile)
    return (
      <TagSearchProvider>
        <Container>
          <YStack f={1} width={'100%'} pb="$4" gap="$6">
            <YStack width={'100%'} gap="$size.1.5" $gtSm={{ gap: '$size.2.5' }}>
              <Search />
            </YStack>
            <SendSearchBody />
          </YStack>
        </Container>
      </TagSearchProvider>
    )
  return (
    <Container $gtLg={{ jc: 'flex-start' }} flexDirection="column" jc="center" ai="center" f={1}>
      <SendAmountForm />
    </Container>
  )
}

function SendSearchBody() {
  const [queryParams] = useSendScreenParams()
  const { isLoading, results, error } = useTagSearch()

  return (
    <AnimatePresence>
      {error && (
        <YStack key="error" gap="$4" mb="$4">
          <H4 theme={'alt2'}>Error</H4>
          <Text>{error.message}</Text>
        </YStack>
      )}
      <Search.Results to="/send" queryParams={queryParams} />
      {results === null && !isLoading && !error && (
        <YStack
          key="suggestions"
          animation="quick"
          gap="$size.1.5"
          mb="$4"
          mt="$6"
          $gtSm={{ gap: '$size.2.5' }}
          exitStyle={{
            opacity: 0,
            y: 10,
          }}
        >
          {/*
            <Separator $gtMd={{ display: 'none' }} />
            <Suggestions />
          */}

          <Separator $gtMd={{ display: 'none' }} />
          <RecentActivity />
        </YStack>
      )}
    </AnimatePresence>
  )
}
