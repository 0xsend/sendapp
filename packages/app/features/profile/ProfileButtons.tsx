import { type ButtonProps, LinkableButton, XStack } from '@my/ui'

export const SendButton = ({
  identifier,
  idType,
  children,
  disabled = false,
}: React.PropsWithChildren<Pick<ButtonProps, 'disabled'>> & {
  identifier: string | number
  idType: string
}) => {
  return (
    <LinkableButton
      href={`/send?idType=${idType}&recipient=${identifier}`}
      br="$4"
      px={'$3.5'}
      h={'$4.5'}
      w="100%"
      miw={150}
      theme={'green'}
      testID={'profileSendButton'}
      key="profile-send-button"
      animation="200ms"
      disabled={disabled}
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
    >
      <XStack w={'100%'} jc={'center'} ai={'center'} gap={'$2'} h="100%">
        {children || (
          <LinkableButton.Text
            fontWeight={'600'}
            textTransform={'uppercase'}
            $theme-dark={{ col: '$color0' }}
          >
            SEND
          </LinkableButton.Text>
        )}
      </XStack>
    </LinkableButton>
  )
}

export const ProfileButtons = {
  SendButton: SendButton,
}
