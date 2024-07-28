import {
  Avatar,
  Paragraph,
  Separator,
  XStack,
  YStack,
  Button,
  useToastController,
  TooltipSimple,
  useMedia,
  Theme,
  Card,
  View,
  Heading,
  isWeb,
  LinkableButton,
  Dialog,
  Adapt,
  Sheet,
} from '@my/ui'
import {
  IconAccount,
  IconCopy,
  IconDollar,
  IconGear,
  IconShare,
  IconBadgeCheck,
  IconInfoCircle,
  IconX,
} from 'app/components/icons'
import { getReferralHref } from 'app/utils/getReferralLink'
import { useUser } from 'app/utils/useUser'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import { useRootScreenParams } from 'app/routers/params'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useConfirmedTags } from 'app/utils/tags'

export function AccountScreen() {
  const media = useMedia()
  const toast = useToastController()
  const { profile } = useUser()
  const name = profile?.name
  const send_id = profile?.send_id
  const avatar_url = profile?.avatar_url
  const tags = useConfirmedTags()
  const refCode = profile?.referral_code ?? ''
  const referralHref = getReferralHref(refCode)
  const [queryParams, setRootParams] = useRootScreenParams()
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    const canShare = async () => {
      const canShare = await Sharing.isAvailableAsync()
      setCanShare(canShare)
    }
    canShare()
  }, [])

  const shareOrCopyOnPress = async () => {
    if (canShare) {
      return await Sharing.shareAsync(referralHref)
    }

    await Clipboard.setStringAsync(referralHref)
      .then(() => toast.show('Copied your referral link to the clipboard'))
      .catch(() =>
        toast.show('Something went wrong', {
          message: 'We were unable to copy your referral link to the clipboard',
          customData: {
            theme: 'red',
          },
        })
      )
  }

  const cards = [
    {
      label: 'Sendtags',
      description: 'Add a sendtag now!',
      child: (
        <LinkableButton
          href={'/account/sendtag'}
          theme={'green'}
          variant="outlined"
          bw={1}
          br={'$4'}
          p={'$3'}
          px={'$4'}
          $theme-light={{ color: '$color12', boc: '$color12' }}
        >
          <XStack gap={'$2'} ai={'center'}>
            <Button.Icon>
              <IconBadgeCheck size="$1.5" $theme-light={{ boc: '$color12' }} />
            </Button.Icon>
            <Button.Text
              textTransform="uppercase"
              size={'$6'}
              color="$color12"
              $theme-light={{ boc: '$color12' }}
            >
              Add
            </Button.Text>
          </XStack>
        </LinkableButton>
      ),
    },
    {
      label: 'Rewards',
      description: 'Start earning today!',
      child: (
        <LinkableButton
          href="/account/rewards"
          theme="green"
          variant="outlined"
          bw={1}
          br="$4"
          p={'$3'}
          px={'$4'}
          $theme-light={{ color: '$color12', boc: '$color12' }}
        >
          <XStack gap={'$2'} ai={'center'}>
            <Button.Icon>
              <IconDollar size="$1.5" $theme-light={{ color: '$color12', boc: '$color12' }} />
            </Button.Icon>
            <Button.Text
              textTransform="uppercase"
              size={'$6'}
              color="$color12"
              $theme-light={{ boc: '$color12' }}
            >
              Earn
            </Button.Text>
          </XStack>
        </LinkableButton>
      ),
    },
    {
      label: 'Referrals',
      description: 'Share your link',
      child: (
        <View py={'$2.5'} borderRadius={'$4'} flexShrink={1}>
          <TooltipSimple
            label={<Paragraph color="$white">{canShare ? 'Share' : 'Copy'}</Paragraph>}
          >
            <Button
              bc={'$color0'}
              br="$2"
              aria-label={canShare ? 'Share' : 'Copy'}
              f={1}
              fd="row"
              chromeless
              onPress={shareOrCopyOnPress}
              color="$color12"
              iconAfter={
                <Theme name="green_Button">
                  {canShare ? (
                    <IconShare
                      size="$1"
                      col={'$background'}
                      $platform-web={{ cursor: 'pointer' }}
                    />
                  ) : (
                    <IconCopy size="$1" col={'$background'} $platform-web={{ cursor: 'pointer' }} />
                  )}
                </Theme>
              }
            >
              <Button.Text size={'$6'}>SEND.APP/{refCode}</Button.Text>
            </Button>
          </TooltipSimple>
        </View>
      ),
    },
  ]

  return (
    <YStack w={'100%'} ai={'center'} gap={'$size.1.5'}>
      <Card p={'$size.3.5'} w={'100%'}>
        <XStack gap={'$size.3.5'} w={'100%'} flexWrap="wrap">
          <View width={'100%'} $gtMd={{ width: 'auto' }}>
            <Avatar
              $gtMd={{ miw: 316, mih: 264 }}
              size={'$10'}
              borderRadius={'$3'}
              href={`/profile/${profile?.send_id}`}
            >
              <Avatar.Image
                $gtMd={{ w: 316, h: 264 }}
                w={'$10'}
                h="$10"
                accessibilityLabel=""
                src={avatar_url ?? ''}
              />
              <Avatar.Fallback
                $gtMd={{ w: 316, h: 264 }}
                f={1}
                jc={'center'}
                ai={'center'}
                backgroundColor={'$decay'}
                $theme-light={{ backgroundColor: '$white' }}
              >
                <IconAccount size={256} color="$olive" />
              </Avatar.Fallback>
            </Avatar>
          </View>
          <YStack gap="$size.1.5" flex={1}>
            <YStack gap={'$size.0.75'}>
              <Heading fontSize={'$9'} fontWeight={'900'} color={'$color12'}>
                {name ? name.toUpperCase() : '---'}
              </Heading>

              {tags?.[0] ? (
                <Paragraph fontSize={'$7'} fontWeight={'600'} theme={'alt2'}>
                  /{tags[0].name}
                </Paragraph>
              ) : null}
            </YStack>

            <Separator />

            <YStack gap={'$3'}>
              {typeof send_id === 'number' && (
                <XStack gap={'$3.5'}>
                  <InfoLabel text="SEND ID" />
                  <InfoItem text={send_id?.toString()} />
                </XStack>
              )}

              {tags?.[0] && (
                <XStack gap={'$3.5'}>
                  <InfoLabel text="SENDTAGS" />
                  <XStack gap={'$3.5'} flexWrap="wrap" flex={1}>
                    {tags.map((tag) => (
                      <InfoItem text={`/${tag.name}`} key={tag.name} />
                    ))}
                  </XStack>
                </XStack>
              )}
            </YStack>

            <XStack pt={'$size.0.9'} mt="auto">
              <Theme name="green">
                <LinkableButton
                  href="/account/settings/edit-profile"
                  theme={'ghost'}
                  variant="outlined"
                  borderRadius={'$4'}
                  color="$borderColor"
                  $theme-light={{ boc: '$color12' }}
                  bw={1}
                  p={'$3.5'}
                  px="$6"
                  maw={301}
                  // on smaller screens, we don't want to navigate to the settings screen but open bottom sheet
                  {...(media.lg
                    ? {
                        onPress: (e) => {
                          if (media.lg) {
                            e.preventDefault()
                            setRootParams(
                              { ...queryParams, nav: 'settings' },
                              { webBehavior: 'replace' }
                            )
                          }
                        },
                      }
                    : {})}
                >
                  <XStack gap={'$1.5'} ai={'center'} jc="center">
                    <IconGear color="$color12" />
                    <Paragraph textTransform="uppercase" color={'$color12'}>
                      Settings
                    </Paragraph>
                  </XStack>
                </LinkableButton>
              </Theme>
            </XStack>
          </YStack>
        </XStack>
      </Card>

      <XStack gap={'$size.1.5'} w={'100%'} flexWrap="wrap">
        {cards.map((card) => (
          <ActionCard key={card.label} title={card.label} description={card.description}>
            {card.child}
          </ActionCard>
        ))}
      </XStack>
    </YStack>
  )
}

const InfoLabel = ({ text }: { text: string }) => {
  return (
    <Paragraph fontSize={'$5'} minWidth={'$size.8'} fontWeight={'500'}>
      {text}:
    </Paragraph>
  )
}
const InfoItem = ({ text }: { text: string }) => {
  return (
    <Paragraph fontSize={'$5'} fontWeight={'500'}>
      {text}
    </Paragraph>
  )
}

const ActionCard = ({
  title,
  description,
  children,
}: { title: string; description: string; children: React.ReactNode }) => {
  return (
    <Card
      p={'$size.3.5'}
      flex={1}
      width="100%"
      $gtLg={{
        width: isWeb ? 'calc((100% - 48px) / 3)' : '100%',
      }}
    >
      <XStack ai={'center'} gap={'$size.0.75'} mb="$size.0.75">
        <Heading fontSize={'$9'} fontWeight={'600'} color={'$color12'} textTransform="uppercase">
          {title}
        </Heading>
        {title === 'Sendtags' && <InfoDialog />}
      </XStack>
      <Paragraph size={'$6'} color="$color10" mb="$size.1.5">
        {description}
      </Paragraph>
      <XStack>{children}</XStack>
    </Card>
  )
}

const InfoDialog = () => {
  const steps = [
    'Qualify for Send.it Rewards based on your token balance',
    'Send and receive funds using your personalized, easy-to-remember Sendtag',
    'Claim your preferred Sendtag before someone else does',
  ]
  return (
    <Dialog modal>
      <Dialog.Trigger>
        <Button unstyled cursor="pointer">
          <IconInfoCircle size={'$1'} color={'$color10'} />
        </Button>
      </Dialog.Trigger>
      <Adapt when="sm" platform="touch">
        <Sheet zIndex={200000} modal dismissOnSnapToBottom disableDrag>
          <Sheet.Frame padding="$4" gap="$4">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
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
          maxWidth={400}
          p={'$size.3.5'}
          position="relative"
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
        >
          <YStack gap={'$size.1.5'}>
            <YStack>
              <Dialog.Close position="absolute" right={-20} top={-20}>
                <Button unstyled cursor="pointer" hoverStyle={{ opacity: 0.5 }}>
                  <IconX width={24} height={24} color="$color12" />
                </Button>
              </Dialog.Close>
              <Dialog.Title ta={'left'} col={'$color12'} fontWeight={'600'} fontSize={'$9'}>
                By registering a Sendtag, you can:
              </Dialog.Title>
            </YStack>

            <Separator
              borderColor="$darkGrayTextField"
              $theme-light={{ borderColor: '$lightGrayTextField' }}
            />
            {/* @TODO: font color */}
            {steps.map((step, i) => (
              <XStack key={step} gap={'$2'}>
                <Paragraph>{i + 1}.</Paragraph>
                <Paragraph>{step}</Paragraph>
              </XStack>
            ))}

            <Separator
              borderColor="$darkGrayTextField"
              $theme-light={{ borderColor: '$lightGrayTextField' }}
            />
            <Paragraph color={'$color10'} fontSize={'$2'}>
              Join 7000+ Senders in shaping the Future of Finance.
            </Paragraph>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
