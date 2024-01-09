import {
  Button,
  Image,
  Input,
  Label,
  Link,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  XStack,
  YStack,
  styled,
} from '@my/ui'
import { IconArrowLeft, IconSearch } from 'app/components/icons'
import { useSubScreenContext, useTransferContext } from 'app/features/send/providers'
import { ANIMATE_DIRECTION_RIGHT } from 'app/features/send/types'

const CustomInput = styled(Input, {
  name: 'CustomInput',
  borderRadius: '$6',
  bg: '$color1',
  borderStyle: 'unset',
  paddingRight: '$9',
  fontSize: '$3',
  width: '100%',
  height: '$4.5',
})

export const ReceiveTagScreen = () => {
  const { setCurrentComponent } = useSubScreenContext()
  const { tags, requestTo, setRequestTo } = useTransferContext()

  return (
    <YStack
      gap={'$5'}
      px={'$5'}
      pt={'$size.8'}
      pb={'$7'}
      fullscreen
      $shorter={{
        pt: '$8',
        pb: '$6',
      }}
    >
      <XStack jc={'center'}>
        <SizableText fontSize={'$9'} fontWeight={'700'} mr={'$2.5'} $shorter={{ fontSize: '$8' }}>
          Request
        </SizableText>
      </XStack>
      <XStack ai={'center'}>
        <CustomInput placeholder="Name, Send Tag, Phone" />
        <XStack pos={'absolute'} r={'$3.5'} pe={'none'}>
          <IconSearch />
        </XStack>
      </XStack>
      <SizableText textTransform={'uppercase'} theme={'alt2'}>
        Suggestions
      </SizableText>
      <ScrollView horizontal fg={0} space={'$5'} showsHorizontalScrollIndicator={false}>
        {tags.map((tag) => (
          <YStack
            key={`tag-${tag.name}`}
            ai={'center'}
            gap={'$3.5'}
            onPress={() => setRequestTo(tag)}
          >
            <Image source={{ uri: tag.avatar }} width={'$6'} height={'$6'} borderRadius={'$6'} />
            <SizableText color={'$primary'} fontWeight={requestTo === tag ? '700' : '400'}>
              @{tag.name}
            </SizableText>
          </YStack>
        ))}
      </ScrollView>

      <YStack fg={1} jc={'flex-end'}>
        <Separator />
        <XStack gap={'$3'} mt={'$5'} mb={'$6'}>
          <Label theme={'alt1'} fontSize={'$5'}>
            For
          </Label>
          <CustomInput placeholder="Add a note (optional)" />
        </XStack>
        <Button
          /* just hide when no tags selected, need to disable */
          /* btn later coz no design for disabled status */
          style={{ visibility: requestTo ? 'visible' : 'hidden' }}
          my={'$5'}
          py={'$6'}
          br={'$9'}
          bc={'$backgroundTransparent'}
          boc={'$borderColorFocus'}
          width={'100%'}
          onPress={() => setCurrentComponent(['receive-amount', ANIMATE_DIRECTION_RIGHT])}
        >
          <Paragraph size={'$6'} fontWeight={'700'}>
            Continue
          </Paragraph>
        </Button>
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
  )
}
