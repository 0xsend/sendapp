import { LinkableButton, XStack } from '@my/ui'
import { Platform } from 'react-native'
import { baseMainnet, sendTokenAddress } from '@my/wagmi'

export const SendButton = ({
  identifier,
  idType,
}: {
  identifier: string | number
  idType: string
}) => (
  <LinkableButton
    href={`/send${Platform.OS === 'web' ? '' : '/form'}?idType=${idType}&recipient=${identifier}&sendToken=${sendTokenAddress[baseMainnet.id]}`}
    br="$4"
    px={'$3.5'}
    h={'$4.5'}
    w="100%"
    miw={150}
    theme={'green'}
    testID={'profileSendButton'}
    key="profile-send-button"
    animation="200ms"
    enterStyle={{
      opacity: 0,
    }}
    exitStyle={{
      opacity: 0,
    }}
    elevation={5}
  >
    <XStack w={'100%'} jc={'center'} ai={'center'} gap={'$2'} h="100%">
      <LinkableButton.Text
        fontWeight={'600'}
        textTransform={'uppercase'}
        $theme-dark={{ col: '$color0' }}
      >
        SEND
      </LinkableButton.Text>
    </XStack>
  </LinkableButton>
)

export const ProfileButtons = {
  SendButton: SendButton,
}
