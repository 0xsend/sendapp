import { AnimatePresence, Container, H4, Spinner, Text, YStack } from '@my/ui'
import Search from 'app/components/SearchBar'
import { TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import { useSendScreenParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { SendAmountForm } from './SendAmountForm'

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
  const { isLoading, error } = useTagSearch()

  return (
    <AnimatePresence>
      {isLoading && (
        <YStack key="loading" gap="$4" mb="$4">
          <Spinner size="large" color="$send1" />
        </YStack>
      )}
      {error && (
        <YStack key="error" gap="$4" mb="$4">
          <H4 theme={'alt2'}>Error</H4>
          <Text>{error.message}</Text>
        </YStack>
      )}
      <Search.Results />
    </AnimatePresence>
  )
}
