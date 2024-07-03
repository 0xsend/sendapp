import { Button, ButtonText, XStack, Theme } from '@my/ui'
import { useRouter } from 'solito/router'

export const SignUpButtons = ({ nextScreen }: { nextScreen: () => void }) => {
  const router = useRouter()

  return (
    <XStack w="100%" jc="center" py="$5" gap="$4">
      <Theme name={'green'}>
        <Button f={1} br="$5" onPress={nextScreen}>
          <ButtonText>SIGN UP</ButtonText>
        </Button>
        <Button
          variant="outlined"
          theme="ghost_dim"
          bw={1}
          f={1}
          br="$5"
          onPress={() => router.push('/sign-in')}
        >
          <ButtonText>LOGIN</ButtonText>
        </Button>
      </Theme>
    </XStack>
  )
}
