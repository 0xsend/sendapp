import { Stack, Button, ButtonText } from '@my/ui'

export const ContinueButton = ({ nextScreen }: { nextScreen: () => void }) => (
  <Stack w="100%" jc="center" py="$5" gap="$2">
    <Button
      variant="outlined"
      theme={'green_ghost_dim'}
      hoverStyle={{ boc: '$borderColor' }}
      bw={1}
      br="$5"
      onPress={nextScreen}
    >
      <ButtonText>CONTINUE</ButtonText>
    </Button>
  </Stack>
)
