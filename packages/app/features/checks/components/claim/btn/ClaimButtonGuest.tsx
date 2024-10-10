import {
  ClaimButton,
  type ClaimSendCheckBtnProps,
} from 'app/features/checks/components/claim/btn/ClaimButton'
import { useRouter } from 'solito/router'

interface Props extends ClaimSendCheckBtnProps {}

export const ClaimButtonGuest = (props: Props) => {
  const router = useRouter()

  const onPress = () => {
    router.push('/auth/onboarding')
  }

  return <ClaimButton tokenId={props.tokenId} tokenAmount={props.tokenAmount} onPress={onPress} />
}
