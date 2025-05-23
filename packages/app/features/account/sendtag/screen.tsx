import type { Tables } from '@my/supabase/database.types'
import { Fade, H2, LinkableButton, Paragraph, Spinner, Stack, XStack, YGroup, YStack } from '@my/ui'
import { IconPlus, IconSlash } from 'app/components/icons'
import { maxNumSendTags } from 'app/data/sendtags'
import { useUser } from 'app/utils/useUser'

export function SendTagScreen() {
  const { tags, isLoading } = useUser()
  const isFirstSendtagClaimable = Array.isArray(tags) && tags.length === 0
  const confirmedTags = Array.isArray(tags) ? tags.filter((tag) => tag.status === 'confirmed') : []

  if (isLoading)
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'}>
        <Spinner color="$primary" size="large" />
      </Stack>
    )

  return (
    <YStack
      width={'100%'}
      gap="$5"
      jc={'space-between'}
      $gtLg={{
        width: '50%',
        pb: '$3.5',
      }}
    >
      <YStack gap="$5">
        <YStack gap="$3">
          <H2 tt={'uppercase'}>
            {isFirstSendtagClaimable ? 'Register your first Sendtag' : 'Your verified Sendtags'}
          </H2>
          <Paragraph
            fontSize={'$5'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            Own your identity on Send. Register up to 5 verified tags and make them yours.
          </Paragraph>
        </YStack>
        <Paragraph fontSize={'$7'} fontWeight={'500'}>
          Registered [ {`${confirmedTags?.length || 0}/${maxNumSendTags}`} ]
        </Paragraph>
        <SendtagList tags={confirmedTags} />
      </YStack>
      <AddNewTagButton tags={confirmedTags} isFirstSendtagClaimable={isFirstSendtagClaimable} />
    </YStack>
  )
}

function AddNewTagButton({
  tags,
  isFirstSendtagClaimable,
}: {
  tags?: Tables<'tags'>[]
  isFirstSendtagClaimable: boolean
}) {
  if (tags && tags.length >= maxNumSendTags) {
    return null
  }

  return (
    <LinkableButton
      elevation={5}
      theme="green"
      py={'$5'}
      br={'$4'}
      href={isFirstSendtagClaimable ? '/account/sendtag/first' : '/account/sendtag/add'}
    >
      {!isFirstSendtagClaimable && (
        <LinkableButton.Icon>
          <IconPlus size={'$1'} color={'$black'} />
        </LinkableButton.Icon>
      )}
      <LinkableButton.Text
        ff={'$mono'}
        fontWeight={'500'}
        tt="uppercase"
        size={'$5'}
        color={'$black'}
      >
        {isFirstSendtagClaimable ? 'register free sendtag' : 'add new'}
      </LinkableButton.Text>
    </LinkableButton>
  )
}

function SendtagList({ tags }: { tags?: Tables<'tags'>[] }) {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <Fade>
      <YGroup
        elevation={'$0.75'}
        bc={'$color1'}
        p={'$2'}
        $gtLg={{ p: '$3.5' }}
        testID={'sendtags-list'}
      >
        {tags.map((tag) => (
          <YGroup.Item key={tag.name}>
            <TagItem tag={tag} />
          </YGroup.Item>
        ))}
      </YGroup>
    </Fade>
  )
}

function TagItem({ tag }: { tag: Tables<'tags'> }) {
  return (
    <XStack ai="center" gap="$3" p="$3.5" br={'$4'} $gtLg={{ p: '$5' }}>
      <IconSlash size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
      <Paragraph size={'$8'} fontWeight={'500'} width={'80%'} testID={`confirmed-tag-${tag.name}`}>
        {tag.name}
      </Paragraph>
    </XStack>
  )
}
