import {
  Adapt,
  Button,
  Dialog,
  Image,
  Input,
  Label,
  ScrollView,
  Separator,
  Sheet,
  SizableText,
  Theme,
  ThemeName,
  XStack,
  YStack,
  styled
} from "@my/ui"
import { IconClose } from "app/components/icons/IconClose"
import { IconSearch } from "app/components/icons/IconSearch"
import { SendItButton } from "./SendItButton"
import { SendTagModalProps } from "../../types"
import { useThemeSetting } from "@tamagui/next-theme"

const CustomInput = styled(Input, {
  name: 'CustomInput',
  borderRadius: '$6',
  bg: '$color1',
  borderStyle: 'unset',
  paddingRight: '$9',
  fontSize: '$3',
  width: '100%',
  height: '$4.5'
})

export const SendTagModal = ({ sendAmount, asset, tags, showModal, setCurrentModal }: SendTagModalProps) => {
  const { resolvedTheme } = useThemeSetting()

  return (
    <Theme name={resolvedTheme as ThemeName}>
      <Dialog
        modal
        onOpenChange={(open) => {
          setCurrentModal('')
        }}
        open={showModal}
      >
        <Adapt when="sm" platform="touch">
          <Sheet animation="medium" animationConfig={{ type: 'direct' }} zIndex={200000} modal snapPoints={[100]}>
            <Sheet.Frame
              gap={'$5'}
              px={'$6'}
              pt={'$size.8'}
              pb={'$7'}
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
            gap={'$5'}
            px={'$6'}
            pt={'$size.8'}
            pb={'$7'}
            fullscreen
          >
            <XStack>
              <Dialog.Title>
                <SizableText fontSize={'$9'} mr={'$2.5'}>Send</SizableText>
                {asset?.icon}
                <SizableText fontSize={'$9'} fontWeight={'700'} ml={'$1.5'}>{sendAmount}</SizableText>
              </Dialog.Title>
            </XStack>
            <XStack ai={'center'}>
              <CustomInput placeholder="Name, Send Tag, Phone" />
              <XStack pos={'absolute'} r={'$3.5'} pe={'none'}>
                <IconSearch />
              </XStack>
            </XStack>
            <SizableText
              textTransform={'uppercase'}
              theme={'alt2'}
            >
              Suggestions
            </SizableText>
            <ScrollView horizontal fg={0} mr={'$-6'} showsHorizontalScrollIndicator={false}>
              {tags.map((tag, index) =>
                <YStack
                  key={`tag-${tag.name}`}
                  ai={'center'}
                  gap={'$3.5'}
                  mr={index === tags.length - 1 ? '$6' : '$5'}
                >
                  <Image
                    source={{ uri: tag.avatar }}
                    width={'$6'}
                    height={'$6'}
                    borderRadius={'$6'}
                  />
                  <SizableText color={'$primary'}>@{tag.name}</SizableText>
                </YStack>
              )}
            </ScrollView>

            <YStack fg={1} jc={'flex-end'}>
              <Separator />
              <XStack gap={'$3'} mt={'$5'} mb={'$6'}>
                <Label theme={'alt1'} fontSize={'$5'}>For</Label>
                <CustomInput placeholder="Add a note (optional)" />
              </XStack>
              <SendItButton onPress={() => setCurrentModal('send_it')} />
            </YStack>
            <Dialog.Close asChild displayWhenAdapted>
              <Button
                pos={'absolute'}
                top={'$size.8'}
                right={'$6'}
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
    </Theme>
  )
}