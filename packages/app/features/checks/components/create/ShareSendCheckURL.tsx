import {
  XStack,
  YStack,
  Text,
  Label,
  useToastController,
  styled,
  ScrollView,
  Card,
  Tooltip,
} from '@my/ui'
import { ManageChecksBtn } from 'app/features/checks/components/ManageChecksBtn'
import { GreenSquare } from 'app/features/home/TokenBalanceCard'
import { Clipboard as IconClipboard } from '@tamagui/lucide-icons'
import * as Clipboard from 'expo-clipboard'

interface Props {
  url: string
}

const SelectableText = styled(Text, {
  variants: {
    selectable: {
      true: {
        userSelect: 'text',
        cursor: 'text',
        selectable: true,
      },
      false: {
        userSelect: 'none',
        cursor: 'default',
        selectable: true,
      },
    },
  },
})

export const ShareSendCheckURL = (props: Props) => {
  const toast = useToastController()

  const onPress = async () => {
    await Clipboard.setStringAsync(props.url)
    toast.show('Copied to clipboard', {
      type: 'success',
      duration: 5000,
    })
  }

  const showCopyLink = () => {
    return (
      <SelectableText
        onPress={onPress}
        p="$3"
        br={12}
        bw={1}
        cursor="pointer"
        hoverStyle={{
          bc: '$color2',
        }}
      >
        <ScrollView horizontal={true} scrollbarWidth="none">
          <XStack gap="$2" alignItems="center">
            <IconClipboard size={20} />
            <Text
              opacity={70}
              fontSize="$5"
              hoverStyle={{
                opacity: 100,
              }}
            >
              {props.url}
            </Text>
          </XStack>
        </ScrollView>
      </SelectableText>
    )
  }

  return (
    <YStack>
      <Card
        $gtLg={{ p: 36 }}
        $lg={{ bc: 'transparent' }}
        py={'$9'}
        px={'$2'}
        w={'100%'}
        jc="space-between"
        br={12}
        gap="$6"
        maxWidth={'40%'}
      >
        <YStack gap="$3">
          <XStack gap="$2.5" jc="flex-start" ai="center">
            <GreenSquare />
            <Label
              fontSize={'$4'}
              zIndex={1}
              fontWeight={'500'}
              textTransform={'uppercase'}
              lineHeight={0}
              col={'$color10'}
            >
              Success
            </Label>
          </XStack>
          <Text fontSize="$9" fontWeight="bold">
            Check created
          </Text>
          <Text color="$darkGrayTextField" fontSize="$6">
            Sharing the URL below will allow recipients to claim your check:
          </Text>

          <Tooltip placement="bottom">
            <Tooltip.Trigger>{showCopyLink()}</Tooltip.Trigger>
            <Tooltip.Content
              enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
              exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
              scale={1}
              opacity={1}
              animation={[
                'quick',
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
            >
              <Tooltip.Arrow />
              <Text>Click to copy to clipboard</Text>
            </Tooltip.Content>
          </Tooltip>
        </YStack>
        <ManageChecksBtn />
      </Card>
    </YStack>
  )
}
