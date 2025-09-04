import { PrimaryButton } from '@my/ui'
import { Platform } from 'react-native'
import { baseMainnet, sendTokenAddress } from '@my/wagmi'
import { useLink } from 'solito/link'

export default function SendButton({
  identifier,
  idType,
}: {
  identifier: string | number
  idType: string
}) {
  const linkProps = useLink({
    href: `/send${Platform.OS === 'web' ? '' : '/form'}?idType=${idType}&recipient=${identifier}&sendToken=${sendTokenAddress[baseMainnet.id]}`,
  })

  return (
    <PrimaryButton testID={'profileSendButton'} key="profile-send-button" {...linkProps}>
      <PrimaryButton.Text>SEND</PrimaryButton.Text>
    </PrimaryButton>
  )
}
