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
import { IconClose } from "app/components/icons/IconClose"
import { SendButton } from "app/components/layout/footer/components/SendButton"
import { ConfirmModalProps } from "../../types"
import { useThemeSetting } from "@tamagui/next-theme"
import { IconEthereum } from "app/components/icons"

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

const tag = {
  name: 'ethentree',
  avatar: 'https://s3-alpha-sig.figma.com/img/4133/975a/0b108534bd4dd4c0583a2af270bbad58?Expires=1702252800&Signature=mYVUhTB3oUN0sTjkMnCN1wJ4os~qnnX-YJAXLFoZ3SqrgzMbUC8Yw0Y-IgCMMae2KIgDgDx93gNKngn6QZmAtLlzqdDvwCHqEyNZPjALg7kwrvsAw3jKxnUQ-G1FyYbSkYO64cK23JHc2QzMpJawR3Cr-JX8KkSQ8c-W72ChrNVZSm6T9sYCmgsjFCk1RT8YIW6a888kcuqVd4L~unAEFQUYTFXSqSAi5Pb21L5aelzGFDpMeJfbQ~sP1i0YgIPqKrd2JlkkfEtbGDyOQkjKTlkbX39~8WPj~bZZ2ae5cE6nmq6sJ9dU2itEvx~WSbdhGaxdzJBbb0JTLCkNFp7n-g__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4'
}
const sendAmount = 150
const USDAmount = 149.99
const fees = 0.1
const asset = { icon: <IconEthereum />, name: 'USDC' }

export const ConfirmModal = ({ showModal, setShowModal }: ConfirmModalProps) => {
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
              borderRadius={0}
            >
              <Adapt.Contents />
            </Sheet.Frame>
            <Sheet.Overlay
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
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
            fullscreen
          >
            <XStack>
              <Dialog.Title>
                <SizableText fontSize={'$9'} fontWeight={'700'}>Send it 🚀</SizableText>
              </Dialog.Title>
            </XStack>
            <YStack gap={'$6'} separator={<Separator />}>
              <YStack gap={'$5'} mt={'$8'}>
                <XStack jc={'space-between'}>
                  <SizableText theme={'alt2'}>To</SizableText>
                  <SizableText fontWeight={'700'}>{tag.name}</SizableText>
                </XStack>
                <XStack jc={'space-between'}>
                  <SizableText theme={'alt2'}>Amount</SizableText>
                  <SizableText fontWeight={'700'}>{sendAmount} {asset.name} (${USDAmount})</SizableText>
                </XStack>
                <XStack jc={'space-between'}>
                  <SizableText theme={'alt2'}>Fees</SizableText>
                  <SizableText fontWeight={'700'}>${fees}</SizableText>
                </XStack>
              </YStack>
              <YStack gap={'$7'}>
                <YStack gap={'$5'}>
                  <SizableText theme={'alt2'}>Add Note(optional)</SizableText>
                  <CustomInput placeholder="Type here..." />
                </YStack>
                <YStack fg={1} jc={'flex-end'}>
                  <SendButton height={'$6'} borderRadius={'$9'} />
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