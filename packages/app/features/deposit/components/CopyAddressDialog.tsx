import { Button, Dialog, Paragraph, Separator, YStack } from '@my/ui'
import { allCoins } from 'app/data/coins'

export function CopyAddressDialog({ isOpen, onClose, onConfirm }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          width={'85%'}
          br={'$5'}
          p={'$5'}
          gap={'$3.5'}
          maxWidth={'400px'}
          $gtLg={{ p: '$7', gap: '$5' }}
        >
          <Paragraph size={'$8'} fontWeight={500}>
            Confirm External Deposit
          </Paragraph>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <Paragraph color={'$lightGrayTextField'} $theme-light={{ color: '$darkGrayTextField' }}>
            Please confirm you agree to the following before proceeding:
          </Paragraph>
          <Paragraph color={'$lightGrayTextField'} $theme-light={{ color: '$darkGrayTextField' }}>
            1. The external address is on the Base Network and{' '}
            <a
              target="_blank"
              href="https://support.send.app/en/articles/9809554-smart-contract-deposit-issue"
              rel="noreferrer"
            >
              can receive transfers from Smart Contracts
            </a>
          </Paragraph>
          <Paragraph color={'$lightGrayTextField'} $theme-light={{ color: '$darkGrayTextField' }}>
            2. I have double checked that the tokens{' '}
            {allCoins.map((coin) => coin.symbol).join(', ')} are on Base Network.
          </Paragraph>
          <Paragraph color={'$lightGrayTextField'} $theme-light={{ color: '$darkGrayTextField' }}>
            3. I understand that if I make any mistakes, there is no way to recover the funds.
          </Paragraph>
          <YStack
            justifyContent="space-between"
            marginTop="$4"
            gap="$4"
            $gtLg={{ flexDirection: 'row-reverse' }}
          >
            <Button
              theme="green"
              borderRadius={'$4'}
              p={'$4'}
              onPress={onConfirm}
              focusStyle={{ outlineWidth: 0 }}
            >
              <Button.Text
                ff={'$mono'}
                fontWeight={'500'}
                tt="uppercase"
                size={'$5'}
                color={'$black'}
              >
                i agree & proceed
              </Button.Text>
            </Button>
            <Dialog.Close asChild>
              <Button borderRadius={'$4'} p={'$4'} focusStyle={{ outlineWidth: 0 }}>
                <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'}>
                  cancel
                </Button.Text>
              </Button>
            </Dialog.Close>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
