import {
  Container,
  H3,
  Label,
  ListItem,
  Paragraph,
  Spinner,
  Stack,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
import { useUser } from 'app/utils/useUser'

const maxNumSendTags = 5

export function SendTagScreen() {
  const { tags, isLoading } = useUser()

  const allTags = tags?.concat(Array(maxNumSendTags - tags.length).fill(undefined))

  if (isLoading)
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'}>
        <Spinner color="$color" size="large" />
      </Stack>
    )

  return (
    <Container>
      <YStack f={1} $lg={{ gap: '$2' }}>
        <Stack gap="$2" $gtSm={{ py: '$6', gap: '$6' }}>
          <Label fontFamily={'$mono'} fontSize={'$5'}>
            REGISTERED SENDTAGS [
            <Paragraph fontFamily={'$mono'} fontSize={'$5'} theme={'accent'}>
              {`${tags?.length} / ${maxNumSendTags}`}
            </Paragraph>
            ]
          </Label>
        </Stack>
        <YStack gap="$5">
          {allTags?.map((tag) => {
            return tag === undefined ? (
              <ListItem
                key={tag}
                w={200}
                h={54}
                br={8}
                borderWidth={1}
                borderStyle="dashed"
                $theme-dark={{ borderColor: '$gray4Light' }}
                $theme-light={{ borderColor: '$gray4Dark' }}
              />
            ) : (
              <ListItem
                key={tag.name}
                h={54}
                br={8}
                $theme-dark={{ bc: '$darkest' }}
                $theme-light={{ bc: '$gray4Light' }}
              >
                <H3 fontSize={'$5'} fontWeight={'500'} theme="accent">
                  {tag.name}
                </H3>
              </ListItem>
            )
          })}
        </YStack>
      </YStack>
    </Container>
  )
}
