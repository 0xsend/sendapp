import { PrimaryButton } from '@my/ui'
import { Platform } from 'react-native'
import { baseMainnet, sendTokenAddress } from '@my/wagmi'
import { useRouter } from 'expo-router'

export default function SendButton({
  identifier,
  idType,
}: {
  identifier: string | number
  idType: string
}) {
  const router = useRouter()

  const onPress = () => {
    router.push(
      `/send${Platform.OS === 'web' ? '' : '/form'}?idType=${idType}&recipient=${identifier}&sendToken=${sendTokenAddress[baseMainnet.id]}`
    )
  }

  return (
    <PrimaryButton testID={'profileSendButton'} key="profile-send-button" onPress={onPress}>
      <PrimaryButton.Text>SEND</PrimaryButton.Text>
    </PrimaryButton>
  )
}
