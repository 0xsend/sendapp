import {
  Button,
  Image,
  Input,
  SizableText,
  XStack,
  YStack,
  styled,
} from "@my/ui"
import { useState } from "react"
import { Link } from '@my/ui/src/components'
import { IconBack, IconClose, IconEthereum } from "app/components/icons"
import { SendButton } from "app/components/layout/footer/components/SendButton"
import { SendConfirmModal } from "../../components/modal"
import { SendScreenProps } from "../../types"

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
const sendAmount = 0.25
const asset = { icon: <IconEthereum />, name: 'ETH' }

export const SendItScreen = ({ setCurrentScreen }: SendScreenProps) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <YStack
        px={'$5'}
        pt={'$size.8'}
        pb={'$9'}
        fullscreen
        $shorter={{
          pt: '$8',
          pb: '$6'
        }}
      >
        <XStack jc={'center'}>
          <SizableText
            fontSize={'$9'}
            fontWeight={'700'}
            $shorter={{ fontSize: '$8' }}
          >
            Send it 🚀
          </SizableText>
        </XStack>
        <YStack gap={'$8'} mt={'$10'}>
          <YStack gap={'$5'}>
            <SizableText theme={'alt2'}>To</SizableText>
            <XStack ai={'center'} gap={'$3.5'}>
              <Image
                source={{ uri: tag?.avatar }}
                width={'$4.5'}
                height={'$4.5'}
                borderRadius={'$6'}
              />
              <SizableText fontSize={'$8'} fontWeight={'700'} color={'$primary'}>{tag?.name}</SizableText>
            </XStack>
          </YStack>
          <YStack gap={'$5'}>
            <SizableText theme={'alt2'}>Amount</SizableText>
            <XStack ai={'center'}>
              {asset?.icon}
              <SizableText fontSize={'$9'} ml={'$1.5'}>{asset?.name}</SizableText>
              <SizableText fontSize={'$9'} fontWeight={'700'} ml={'$2'}>{sendAmount}</SizableText>
            </XStack>
          </YStack>
          <YStack gap={'$5'}>
            <SizableText theme={'alt2'}>Add Note(optional)</SizableText>
            <CustomInput placeholder="Type here..." />
          </YStack>
        </YStack>

        <YStack fg={1} jc={'flex-end'}>
          <SendButton height={'$6'} borderRadius={'$9'} onPress={() => setShowModal(true)} />
        </YStack>
        <Button
          pos={'absolute'}
          top={'$size.8'}
          left={'$5'}
          size="$2.5"
          circular
          bg={'$backgroundTransparent'}
          $shorter={{ top: '$size.4' }}
          onPress={() => setCurrentScreen(['send-tag', -1])}
        >
          <IconBack />
        </Button>
        <Button
          pos={'absolute'}
          top={'$size.8'}
          right={'$5'}
          size="$2.5"
          circular
          bg={'$backgroundTransparent'}
          $shorter={{ top: '$size.4' }}
        >
          <Link href={'/'} display={'flex'}>
            <IconClose />
          </Link>
        </Button>
      </YStack>
      <SendConfirmModal showModal={showModal} setShowModal={setShowModal} />
    </>
  )
}