import { Button, Spinner } from '@my/ui'
import { useCantonWallet } from 'app/utils/useCantonWallet'

export function CantonWalletInviteButton() {
  const { generatePriorityToken, isGenerating } = useCantonWallet()

  return (
    <Button
      onPress={generatePriorityToken}
      disabled={isGenerating}
      icon={isGenerating ? <Spinner size="small" /> : undefined}
    >
      <Button.Text>Get Priority Invite</Button.Text>
    </Button>
  )
}
