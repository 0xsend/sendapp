import type { Functions } from '@my/supabase/database.types'
import {
  Anchor,
  AnimatePresence,
  Button,
  Fade,
  H4,
  Paragraph,
  Spinner,
  Text,
  YStack,
  useToastController,
} from '@my/ui'
import Search from 'app/components/SearchBar'
import { TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import { useSendScreenParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useState } from 'react'
import { SendAmountForm } from './SendAmountForm'
import { SendRecipient } from './confirm/screen'

export const SendScreen = () => {
  const [{ recipient, idType }] = useSendScreenParams()
  const { data: profile, isLoading, error } = useProfileLookup(idType ?? 'tag', recipient ?? '')
  if (isLoading) return <Spinner size="large" />
  if (error) throw new Error(error.message)
  if (!profile)
    return (
      <TagSearchProvider>
        <YStack f={1} width={'100%'} pb="$4" gap="$6">
          <YStack width={'100%'} gap="$size.1.5" $gtSm={{ gap: '$size.2.5' }}>
            <Search />
          </YStack>
          <SendSearchBody />
        </YStack>
      </TagSearchProvider>
    )

  if (!profile.address)
    // handle when user has no send account
    return <NoSendAccount profile={profile} />

  return (
    <SendAmountForm profile={profile} />
    // <Container $gtLg={{ jc: 'flex-start' }} flexDirection="column" jc="center" ai="center" f={1}>
    //   <SendAmountForm />
    // </Container>
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
        <YStack key="red" gap="$4" mb="$4">
          <H4 theme={'alt2'}>Error</H4>
          <Text>{error.message}</Text>
        </YStack>
      )}
      <Search.Results />
    </AnimatePresence>
  )
}

function NoSendAccount({ profile }: { profile: Functions<'profile_lookup'>[number] }) {
  const toast = useToastController()
  const [clicked, setClicked] = useState(false)
  return (
    <YStack testID="NoSendAccount" gap="$4" mb="$4" maw={600} $lg={{ mx: 'auto' }} width={'100%'}>
      <SendRecipient width={'100%'} profile={profile} />
      <H4 theme={'alt2'} color="$olive">
        No send account
      </H4>
      <Anchor
        testID="NoSendAccountLink"
        href={`/profile/${profile.sendid}`}
        textDecorationLine="none"
        color="$color12"
      >
        <Text fontWeight="bold" display="flex" color="$color12">
          {(() => {
            if (profile.tag) return `@${profile.tag}`
            if (profile.name) return profile.name
            return `#${profile.sendid}`
          })()}
        </Text>
        <Text display="flex" color="$color12">
          {' '}
          has no send account! Ask them to create one or write a /send Check.
        </Text>
      </Anchor>

      <Button
        mx="auto"
        miw="$16"
        maw="$20"
        disabled={clicked}
        onPress={() => {
          setClicked(true)
          console.error('TODO: create send account')
          toast.show('Coming soon')
        }}
      >
        Write /send Check
      </Button>
      {clicked && (
        <Fade>
          <Paragraph width={'100%'} textAlign="center" color="$color12">
            <Text>/send Checks Coming Soon</Text>
          </Paragraph>
        </Fade>
      )}
    </YStack>
  )
}
