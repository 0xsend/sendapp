import { Button } from '@my/ui'

export const OpenButton = () => (
  <Button borderRadius={'$4'} theme={'green'}>
    <Button.Text fontWeight={500} ff={'$mono'} tt={'uppercase'}>
      Open a new position
    </Button.Text>
  </Button>
)

export const LockAndEarnButtons = {
  OpenButton: OpenButton,
}
