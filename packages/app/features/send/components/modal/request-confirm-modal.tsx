import {
  Adapt,
  Button,
  Dialog,
  Input,
  Separator,
  Sheet,
  SizableText,
  Theme,
  ThemeName,
  XStack,
  YStack,
  styled,
} from "@my/ui"
import { useThemeSetting } from "@tamagui/next-theme"
import { IConfirmModalProps } from "app/features/send/types"
import { IconClose } from "app/components/icons"
import { GradientButton } from "./GradientButton"
import { useTransferContext } from "app/features/send/providers/transfer-provider"

const CustomInput = styled(Input, {
  name: 'CustomInput',
  borderRadius: '$6',
  bg: '$color1',
  borderStyle: 'unset',
  paddingRight: '$9',
  fontSize: '$3',
  fontStyle: 'italic',
  width: '100%',
  height: '$4.5'
})

export const RequestConfirmModal = ({ showModal, setShowModal }: IConfirmModalProps) => {
  const { transferState } = useTransferContext()

  const { requestAmount, requestTo, currentToken } = transferState

  const { resolvedTheme } = useThemeSetting()

  return (
    <Theme name={resolvedTheme as ThemeName}>
      <Dialog
        modal
        onOpenChange={(open) => {
          setShowModal(open)
        }}
        open={showModal}
      >
        <Adapt when="sm" platform="touch">
          <Sheet animation="medium" zIndex={200000} modal snapPointsMode="fit">
            <Sheet.Frame
              px={'$5'}
              py={'$7'}
              borderRadius={'$11'}
              backgroundColor={resolvedTheme === 'dark' ? '$black' : '$white'}
            >
              <Adapt.Contents />
            </Sheet.Frame>
            <Sheet.Overlay
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              opacity={0.7}
            />
          </Sheet>
        </Adapt>

        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />

          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            px={'$5'}
            py={'$7'}
            backgroundColor={resolvedTheme === 'dark' ? '$black' : '$white'}
            fullscreen
          >
            <XStack>
              <Dialog.Title>
                <SizableText fontSize={'$9'} fontWeight={'700'}>Request 📌</SizableText>
              </Dialog.Title>
            </XStack>
            <YStack gap={'$6'} separator={<Separator />}>
              <YStack gap={'$5'} mt={'$8'}>
                <XStack jc={'space-between'}>
                  <SizableText theme={'alt2'}>From</SizableText>
                  <SizableText fontWeight={'700'}>{requestTo?.name}</SizableText>
                </XStack>
                <XStack jc={'space-between'}>
                  <SizableText theme={'alt2'}>Amount</SizableText>
                  <SizableText fontWeight={'700'}>
                    {requestAmount} {currentToken.name} (${Number(requestAmount) * currentToken.price})
                  </SizableText>
                </XStack>
                <XStack jc={'space-between'}>
                  <SizableText theme={'alt2'}>Fees</SizableText>
                  <SizableText fontWeight={'700'}>0.1</SizableText>
                </XStack>
              </YStack>
              <YStack gap={'$7'}>
                <YStack gap={'$5'}>
                  <SizableText theme={'alt2'}>Add Note(optional)</SizableText>
                  <CustomInput placeholder="Type here..." />
                </YStack>
                <YStack fg={1} jc={'flex-end'}>
                  <GradientButton>
                    <SizableText size={'$6'} fontWeight={'700'} color={'white'}>Send Request</SizableText>
                  </GradientButton>
                </YStack>
              </YStack>
            </YStack>
            <Dialog.Close asChild displayWhenAdapted>
              <Button
                pos={'absolute'}
                top={'$7'}
                right={'$4.5'}
                size="$2.5"
                circular
                bg={'$backgroundTransparent'}
              >
                <IconClose />
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </Theme >
  )
}