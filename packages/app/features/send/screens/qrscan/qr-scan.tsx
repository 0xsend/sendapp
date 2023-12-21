import { useEffect, useState } from "react"
import {
  Button,
  SizableText,
  XStack,
  YStack,
} from "@my/ui"
import { Link } from '@my/ui/src/components'
import { useTransferContext } from "app/features/send/providers"
import { Switch } from "app/features/send/components/switch"
import { IQRScreenProps } from "app/features/send/types"
import { IconArrowLeft } from "app/components/icons"
import { SendRequestModal } from "../../components/modal/send-request-modal"

export const QRScanScreen = ({ setCurrentScreen }: IQRScreenProps) => {
  const { transferState, updateTransferContext } = useTransferContext()

  const { sendTo } = transferState

  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    updateTransferContext({
      sendTo: {
        name: 'Kith',
        avatar: 'https://s3-alpha-sig.figma.com/img/4133/975a/0b108534bd4dd4c0583a2af270bbad58?Expires=1702252800&Signature=mYVUhTB3oUN0sTjkMnCN1wJ4os~qnnX-YJAXLFoZ3SqrgzMbUC8Yw0Y-IgCMMae2KIgDgDx93gNKngn6QZmAtLlzqdDvwCHqEyNZPjALg7kwrvsAw3jKxnUQ-G1FyYbSkYO64cK23JHc2QzMpJawR3Cr-JX8KkSQ8c-W72ChrNVZSm6T9sYCmgsjFCk1RT8YIW6a888kcuqVd4L~unAEFQUYTFXSqSAi5Pb21L5aelzGFDpMeJfbQ~sP1i0YgIPqKrd2JlkkfEtbGDyOQkjKTlkbX39~8WPj~bZZ2ae5cE6nmq6sJ9dU2itEvx~WSbdhGaxdzJBbb0JTLCkNFp7n-g__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4'
      },
      requestTo: {
        name: 'Kith',
        avatar: 'https://s3-alpha-sig.figma.com/img/4133/975a/0b108534bd4dd4c0583a2af270bbad58?Expires=1702252800&Signature=mYVUhTB3oUN0sTjkMnCN1wJ4os~qnnX-YJAXLFoZ3SqrgzMbUC8Yw0Y-IgCMMae2KIgDgDx93gNKngn6QZmAtLlzqdDvwCHqEyNZPjALg7kwrvsAw3jKxnUQ-G1FyYbSkYO64cK23JHc2QzMpJawR3Cr-JX8KkSQ8c-W72ChrNVZSm6T9sYCmgsjFCk1RT8YIW6a888kcuqVd4L~unAEFQUYTFXSqSAi5Pb21L5aelzGFDpMeJfbQ~sP1i0YgIPqKrd2JlkkfEtbGDyOQkjKTlkbX39~8WPj~bZZ2ae5cE6nmq6sJ9dU2itEvx~WSbdhGaxdzJBbb0JTLCkNFp7n-g__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4'
      }
    })
    setTimeout(() => {
      setShowModal(true)
    }, 3000)
  }, [])

  return (
    <>
      <YStack
        gap={'$5'}
        px={'$5'}
        pt={'$size.8'}
        pb={'$7'}
        jc={'space-between'}
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
            mr={'$2.5'}
            $shorter={{ fontSize: '$8' }}
          >
            QR Code
          </SizableText>
        </XStack>

        <YStack ai={'center'} gap={'$5'}>
          <SizableText color={'$white'}>Scan QR Code to pay!</SizableText>
          <Switch
            leftText="Scan"
            rightText="My Code"
            leftHandler={() => { }}
            rightHandler={() => setCurrentScreen(['qr-mycode', 1])}
            active="left"
          />
        </YStack>
        <Button
          pos={'absolute'}
          top={'$size.8'}
          left={'$5'}
          size="$2.5"
          circular
          bg={'$backgroundTransparent'}
          $shorter={{ top: '$size.4' }}
        >
          <Link href={'/'} display={'flex'}>
            <IconArrowLeft />
          </Link>
        </Button>
      </YStack>
      <SendRequestModal
        showModal={showModal}
        setShowModal={setShowModal}
        to={sendTo}
        setCurrentScreen={setCurrentScreen}
      />
    </>
  )
}