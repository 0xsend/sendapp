import { LinkableButton, XStack } from '@my/ui'
import { IconArrowRight } from 'app/components/icons'

export const SendButton = ({
  identifier,
  idType,
}: { identifier: string | number; idType: string }) => (
  <LinkableButton
    href={`/send?idType=${idType}&recipient=${identifier}`}
    br="$4"
    px={'$3.5'}
    h={'$4.5'}
    w="100%"
    miw={150}
    theme={'green'}
    testID={profileSendButton}
  >
    <XStack w={'100%'} jc={'center'} ai={'center'} gap={'$2'} h="100%">
      <LinkableButton.Text
        fontWeight={'600'}
        textTransform={'uppercase'}
        $theme-dark={{ col: '$color0' }}
      >
        SEND
      </LinkableButton.Text>
      <LinkableButton.Icon>
        <IconArrowRight size={'$1'} $theme-dark={{ col: '$color0' }} />
      </LinkableButton.Icon>
    </XStack>
  </LinkableButton>
)
