import {
  Avatar,
  Container,
  Link,
  LinkProps,
  Paragraph,
  Separator,
  XStack,
  YStack,
  Button,
  useToastController,
  TooltipSimple,
  useMedia,
} from '@my/ui'
import { IconCopy, IconDollar, IconGear, IconPlus } from 'app/components/icons'
import { getReferralHref } from 'app/utils/getReferralLink'
import { useUser } from 'app/utils/useUser'
import { Square } from 'tamagui'
import * as Clipboard from 'expo-clipboard'
import { useNav } from 'app/routers/params'

export function AccountScreen() {
  const media = useMedia()
  const toast = useToastController()
  const { profile, tags } = useUser()
  const name = profile?.name
  const avatar_url = profile?.avatar_url
  const sendTags = tags?.reduce((prev, tag) => `${prev} @${tag.name}`, '')
  const refCode = profile?.referral_code ?? ''
  const referralHref = getReferralHref(refCode)
  const [, setNavParam] = useNav()

  const clickToCopy = async () => {
    await Clipboard.setStringAsync(referralHref)
      .then(() => toast.show('Copied your referral link to the clipboard'))
      .catch(() =>
        toast.show('Something went wrong', {
          message: 'We were unable to copy your referral link to the clipboard',
          customData: {
            theme: 'error',
          },
        })
      )
  }

  const facts = [
    { label: 'Name', value: name },
    { label: 'Sendtags', value: sendTags },
    {
      label: 'Referral Code',
      value: (
        <TooltipSimple label="Copy to clipboard">
          <Button
            f={1}
            fd="row"
            unstyled
            onPress={clickToCopy}
            color="$color12"
            iconAfter={<IconCopy size="$1" $platform-web={{ cursor: 'pointer' }} />}
          >
            <Button.Text>{refCode}</Button.Text>
          </Button>
        </TooltipSimple>
      ),
    },
  ]

  return (
    <>
      <Container>
        <YStack
          w={'100%'}
          ai={'center'}
          gap={'$6'}
          py="$6"
          $gtMd={{ pt: '$10' }}
          $gtLg={{ pt: '$0' }}
        >
          <XStack w={'100%'} ai={'center'} jc={'space-between'} $md={{ jc: 'center' }} zIndex={4}>
            <XStack ai={'center'} jc={'center'} gap={'$5'} $md={{ flexDirection: 'column' }}>
              {avatar_url ? (
                <Avatar size={'$8'} borderRadius={'$3'}>
                  <Avatar.Image accessibilityLabel="" src={avatar_url} />
                  <Avatar.Fallback backgroundColor="$blue10" />
                </Avatar>
              ) : (
                <Square size={'$8'} borderRadius={'$3'} backgroundColor="$color" elevation="$4" />
              )}
              <YStack gap={'$2'} $md={{ ai: 'center' }}>
                <Paragraph fontSize={'$9'} fontWeight={'700'} color={'$color12'}>
                  {name ? name : 'No Name'}
                </Paragraph>
                {tags?.[0] ? (
                  <Paragraph fontFamily={'$mono'} opacity={0.6}>
                    @{tags[0].name}
                  </Paragraph>
                ) : null}
              </YStack>
            </XStack>
            <XStack gap={'$5'} $md={{ display: 'none' }}>
              <BorderedLink href={'/account/sendtag'} icon={<IconPlus color={'$primary'} />}>
                Send Tags
              </BorderedLink>
              <BorderedLink href={'/account/earn'} icon={<IconDollar color={'$primary'} />}>
                Earn Tokens
              </BorderedLink>
              <BorderedLink
                href="/account/settings/edit-profile"
                icon={<IconGear color={'$primary'} size={'$1'} />}
                // on smaller screens, we don't want to navigate to the settings screen but open bottom sheet
                {...(media.lg
                  ? {
                      onPress: (e) => {
                        if (media.lg) {
                          e.preventDefault()
                          setNavParam('settings', { webBehavior: 'replace' })
                        }
                      },
                    }
                  : {})}
              >
                Settings
              </BorderedLink>
            </XStack>
          </XStack>
          <Separator w={'100%'} />
          <ProfileFacts facts={facts} />
          <XStack gap={'$5'} display={'none'} $md={{ display: 'flex' }}>
            <BorderedLink href={'/account/sendtag'} icon={<IconPlus color={'$primary'} />}>
              Send Tags
            </BorderedLink>
            <BorderedLink href={'/account/earn'} icon={<IconDollar color={'$primary'} />}>
              Earn Tokens
            </BorderedLink>
          </XStack>
        </YStack>
      </Container>
    </>
  )
}

const BorderedLink = ({ icon, children, ...props }: { icon?: JSX.Element } & LinkProps) => {
  return (
    <Link borderWidth={1} borderColor={'$primary'} borderRadius={'$4'} p={'$3'} px="$4" {...props}>
      <XStack gap={'$1.5'} ai={'center'}>
        {icon}
        <Paragraph color={'$primary'} textTransform="uppercase">
          {children}
        </Paragraph>
      </XStack>
    </Link>
  )
}

const ProfileFacts = ({ facts }: { facts: { label: string; value?: React.ReactNode }[] }) => {
  return (
    <>
      <XStack w={'100%'} $md={{ jc: 'center' }} $sm={{ display: 'none' }}>
        <YStack gap={'$5'} w={'$12'}>
          {facts.map((fact) => (
            <Paragraph key={fact.label} fontSize={'$5'} fontWeight={'500'}>
              {fact.label}
            </Paragraph>
          ))}
        </YStack>
        <YStack gap={'$5'}>
          {facts.map((fact) => (
            <Paragraph key={fact.label} color={'$color12'} fontSize={'$5'} fontWeight={'700'}>
              {fact.value ? fact.value : `No ${fact.label.toLowerCase()}`}
            </Paragraph>
          ))}
        </YStack>
      </XStack>
      <YStack w={'100%'} gap={'$6'} $gtSm={{ display: 'none' }}>
        {facts.map((fact) => (
          <YStack key={fact.label} gap={'$2'}>
            <Paragraph fontSize={'$5'} fontWeight={'500'}>
              {fact.label}
            </Paragraph>
            <Paragraph color={'$color12'} fontSize={'$5'} fontWeight={'500'}>
              {fact.value ? fact.value : `No ${fact.label.toLowerCase()}`}
            </Paragraph>
          </YStack>
        ))}
      </YStack>
    </>
  )
}
