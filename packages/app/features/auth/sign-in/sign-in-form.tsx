import {
  ButtonText,
  BigHeading,
  Paragraph,
  SubmitButton,
  XStack,
  YStack,
  H3,
  Anchor,
  type AnchorProps,
} from '@my/ui'
import { useState } from 'react'
import AccountRecovery from 'app/features/auth/account-recovery/account-recovery'

export const SignInForm = () => {
  const [showRecoveryForm, setShowRecoveryForm] = useState<boolean>(false)

  return (
    <>
      {showRecoveryForm ? (
        <AccountRecovery onClose={() => setShowRecoveryForm(false)} />
      ) : (
        <YStack gap="$5" jc="center" $sm={{ f: 1 }}>
          <BigHeading color="$color12">WELCOME BACK</BigHeading>
          <H3
            lineHeight={28}
            $platform-web={{ fontFamily: '$mono' }}
            $theme-light={{ col: '$gray10Light' }}
            $theme-dark={{ col: '$olive' }}
            fontWeight={'300'}
            $sm={{ size: '$5' }}
          >
            Sign in with your passkey.
          </H3>

          <YStack gap="$4">
            <SubmitButton
              onPress={() => setShowRecoveryForm(true)}
              br="$3"
              bc={'$green9Light'}
              $sm={{ w: '100%' }}
            >
              <ButtonText size={'$2'} padding={'unset'} ta="center" margin={'unset'} col="black">
                {'/SIGN IN'}
              </ButtonText>
            </SubmitButton>
          </YStack>
        </YStack>
      )}
    </>
  )
}
