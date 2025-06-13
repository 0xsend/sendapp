import { useSendAccount } from 'app/utils/send-accounts'
import { DepositAddressQR } from 'app/features/deposit/components/DepositAddressQR'
import { Button, FadeCard, Paragraph, Spinner, useToastController, YStack } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import * as Clipboard from 'expo-clipboard'
import { useState } from 'react'
import { IconCopy } from 'app/components/icons'
import { CopyAddressDialog } from 'app/features/deposit/components/CopyAddressDialog'
import { Platform } from 'react-native'

export function DepositCryptoScreen() {
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  const toast = useToastController()
  const [hasCopied, setHasCopied] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [copyAddressDialogIsOpen, setCopyAddressDialogIsOpen] = useState(false)

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(sendAccount?.address || '').catch(() =>
      toast.show('Something went wrong', {
        message: 'We were unable to copy your address to the clipboard',
        customData: {
          theme: 'red',
        },
      })
    )
    setHasCopied(true)
  }

  const copyOnPress = async () => {
    if (!isConfirmed) {
      setCopyAddressDialogIsOpen(true)
      return
    }

    void copyToClipboard()
  }

  if (isLoadingSendAccount) return <Spinner size="large" />

  return (
    <YStack
      w={'100%'}
      gap="$5"
      py={'$3.5'}
      ai={'center'}
      $gtLg={{
        w: '50%',
        ai: 'flex-start',
      }}
    >
      <YStack gap={'$3.5'}>
        <FadeCard>
          <Paragraph size={'$7'}>Base Network</Paragraph>
          {Platform.OS === 'web' && (
            <DepositAddressQR
              address={sendAccount?.address}
              onPress={() => setCopyAddressDialogIsOpen(true)}
              isConfirmed={isConfirmed}
            />
          )}
        </FadeCard>
      </YStack>
      <YStack width={'100%'}>
        <YStack
          marginHorizontal={'auto'}
          maxWidth={'100%'}
          gap={'$3.5'}
          $gtLg={{ marginHorizontal: 0 }}
        >
          <Paragraph w={'100%'} size={'$7'}>
            Wallet Address
          </Paragraph>
          <FadeCard maxWidth={'100%'}>
            <Button
              chromeless
              backgroundColor="transparent"
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{
                backgroundColor: 'transparent',
                borderColor: 'transparent',
              }}
              focusStyle={{ backgroundColor: 'transparent' }}
              p={0}
              height={'auto'}
              onPress={copyOnPress}
            >
              <Button.Text fontSize={'$5'}>{sendAccount?.address}</Button.Text>
              <Button.Icon>
                {hasCopied ? (
                  <Check color="$primary" size="$1" $theme-light={{ color: '$color12' }} />
                ) : (
                  <IconCopy
                    flexShrink={0}
                    size="$1"
                    $theme-dark={{ color: '$primary' }}
                    $theme-light={{ color: '$color12' }}
                  />
                )}
              </Button.Icon>
            </Button>
          </FadeCard>
        </YStack>
      </YStack>
      <CopyAddressDialog
        isOpen={copyAddressDialogIsOpen}
        onClose={() => {
          setCopyAddressDialogIsOpen(false)
        }}
        onConfirm={() => {
          setIsConfirmed(true)
          setCopyAddressDialogIsOpen(false)
          void copyToClipboard()
        }}
      />
    </YStack>
  )
}
