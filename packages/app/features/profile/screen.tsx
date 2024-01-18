import { Avatar, Container, H1, Text, YStack } from '@my/ui'
// import { useProfileLookup } from 'app/utils/useProfileLookup'
// import { useEffect } from 'react'
import { createParam } from 'solito'

const { useParam } = createParam<{ tag: string }>()

export function ProfileScreen() {
  const [tag] = useParam('tag')
  // const result = useProfileLookup(tag)
  // useEffect(() => {
  //   console.log(result)
  // }, [result])
  return (
    <Container>
      <YStack>
        <H1>Profile: {tag}</H1>
        {/* {result.error && <Text>{result.error.message}</Text>}
        {result.isLoading && <Text>Loading...</Text>}
        {result.data && (
          <>
            <H1>{result.data.name}</H1>
            <Avatar size="$4" br="$4" space="$2">
              <Avatar.Image
                src={
                  result.data.avatar_url ??
                  '`https://ui-avatars.com/api.jpg?name=${result.data.name ?? ' ??
                  '}&size=256`'
                }
              />
              <Avatar.Fallback bc="$background">??</Avatar.Fallback>
            </Avatar>
          </>
        )} */}
      </YStack>
    </Container>
  )
}
