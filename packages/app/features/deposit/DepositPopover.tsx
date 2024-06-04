import {
  Button,
  Paragraph,
  XStack,
  YStack,
  Adapt,
  Popover,
  type PopoverProps,
  useMedia,
} from '@my/ui'
import { IconClose, IconDeposit } from 'app/components/icons'
import { DepositScreen } from './screen'

export function DepositPopover(props: PopoverProps) {
  const media = useMedia()
  return (
    <Popover
      size="$5"
      allowFlip
      stayInFrame
      {...(media.gtLg ? { placement: 'right' } : {})}
      {...props}
      offset={{ mainAxis: 0, crossAxis: 0, alignmentAxis: 0 }}
    >
      <Popover.Trigger asChild>
        <Button px={'$3.5'} h={'$4.5'} width={'100%'} theme="accent" borderRadius={'$4'}>
          <XStack w={'100%'} jc={'space-between'} ai={'center'}>
            <Paragraph fontWeight={'500'} textTransform={'uppercase'} color={'$black'}>
              Deposit
            </Paragraph>
            <XStack alignItems={'center'} justifyContent={'center'} zIndex={2}>
              <IconDeposit size={'$2.5'} color={'$black'} />
            </XStack>
          </XStack>
        </Button>
      </Popover.Trigger>

      <Adapt when="sm" platform="touch">
        <Popover.Sheet dismissOnSnapToBottom dismissOnOverlayPress modal>
          <Popover.Sheet.Frame padding="$4">
            <Adapt.Contents />
          </Popover.Sheet.Frame>
          <Popover.Sheet.Overlay
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Popover.Sheet>
      </Adapt>

      <Popover.Content
        borderWidth={1}
        borderColor="$borderColor"
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        elevate
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
      >
        <Popover.Arrow borderWidth={1} borderColor="$borderColor" />

        <YStack gap="$3">
          <DepositScreen />

          <Popover.Close asChild>
            <Button
              chromeless
              position="absolute"
              borderWidth={0}
              borderColor={'transparent'}
              top={-5}
              right={-10}
              size="$3"
              onPress={() => {
                /* Custom code goes here, does not interfere with popover closure */
              }}
              icon={<IconClose size={'$2.5'} color={'$color11'} />}
            />
          </Popover.Close>
        </YStack>
      </Popover.Content>
    </Popover>
  )
}
