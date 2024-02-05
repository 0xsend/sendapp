import { Button, Container, H1, H2, YStack } from '@my/ui'
import { Link } from 'solito/link'

export function UnknownScreen() {
  return (
    <Container>
      <YStack jc={'center'} alignItems="center" f={1} gap="$6">
        <H1>Not found.</H1>
        <H2>Send, Instant Payments.</H2>
        <Link href="/sign-in">
          <Button>Need to sign in?</Button>
        </Link>
      </YStack>
    </Container>
  )
}
