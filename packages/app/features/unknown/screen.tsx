import { Container, H1, H2, YStack, LinkableButton } from '@my/ui'

export function UnknownScreen() {
  return (
    <Container>
      <YStack jc={'center'} alignItems="center" f={1} gap="$6">
        <H1>Not found.</H1>
        <H2>Send, Instant Payments.</H2>
        <LinkableButton href="/">Need to sign in?</LinkableButton>
      </YStack>
    </Container>
  )
}
