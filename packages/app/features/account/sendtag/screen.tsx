import { Tables } from '@my/supabase/database.types'
import { Container, H3, Label, ListItem, Paragraph, Spinner, Stack, YStack, Link } from '@my/ui'

import { useUser } from 'app/utils/useUser'

const maxNumSendTags = 5

export function SendTagScreen() {
  const { tags, isLoading } = useUser()

  const allTags: (Tables<'tags'> | undefined)[] =
    tags === undefined
      ? new Array(maxNumSendTags).fill(undefined)
      : [...tags, ...Array.from({ length: maxNumSendTags - tags.length })]
  const nextTagIndex = allTags?.findIndex((tag) => tag === undefined)

  if (isLoading)
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'}>
        <Spinner color="$color" size="large" />
      </Stack>
    )

  return (
    <Container>
      <YStack
        f={1}
        $lg={{ gap: '$2', ai: 'center' }}
        $theme-dark={{ btc: '$gray7Dark' }}
        $theme-light={{ btc: '$gray4Light' }}
        $gtSm={{ borderTopWidth: '$1' }}
      >
        <Stack gap="$2" $gtSm={{ py: '$6', gap: '$6' }}>
          <Label fontFamily={'$mono'} fontSize={'$5'} $theme-dark={{ col: '$olive' }}>
            REGISTERED SENDTAGS [
            <Paragraph fontFamily={'$mono'} fontSize={'$5'} $theme-dark={{ col: '$primary' }}>
              {`${tags?.length || 0} / ${maxNumSendTags}`}
            </Paragraph>
            ]
          </Label>
        </Stack>
        <YStack gap="$5">
          {allTags.map((tag, i) => (
            <TagItem key={tag?.name} tag={tag} isNextTag={i === nextTagIndex} />
          ))}
        </YStack>
      </YStack>
    </Container>
  )
}

function TagItem({ tag, isNextTag }: { tag?: Tables<'tags'>; isNextTag: boolean }) {
  if (isNextTag)
    return (
      <Link
        href={'/account/sendtag/checkout'}
        w={200}
        h={54}
        br={12}
        bc={'$primary'}
        p={0}
        display="flex"
        jc="center"
        ai="center"
      >
        <Paragraph fontSize={'$4'} fontWeight={'500'} fontFamily={'$mono'} theme="accent">
          + New Tag
        </Paragraph>
      </Link>
    )

  if (tag === undefined)
    return (
      <ListItem
        key={tag}
        w={200}
        h={54}
        br={8}
        borderWidth={1}
        borderStyle="dashed"
        $theme-dark={{ borderColor: '$decay' }}
        $theme-light={{ borderColor: '$gray4Dark' }}
      />
    )

  return (
    <ListItem h={54} br={12} $theme-dark={{ bc: '$darkest' }} $theme-light={{ bc: '$gray4Light' }}>
      <H3 fontSize={'$5'} fontWeight={'500'} theme="accent">
        {tag.name}
      </H3>
    </ListItem>
  )
}
