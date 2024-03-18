import { Avatar, Container, Link, LinkProps, Paragraph, Separator, XStack, YStack } from '@my/ui'
import { IconDollar, IconGear, IconPlus } from 'app/components/icons'
import { formatPhoneNumber } from 'app/utils/formatPhoneNumber'
import { useUser } from 'app/utils/useUser'
import { Square } from 'tamagui'

export function AccountScreen() {
  const { profile, user, tags } = useUser()
  const name = profile?.name
  const avatar_url = profile?.avatar_url
  const sendTags = tags?.reduce((prev, tag) => `${prev} @${tag.name}`, '')

  return (
    <>
      <Container>
        <YStack w={'100%'} ai={'center'} gap={'$7'}>
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
                <Paragraph fontFamily={'$mono'} fontSize={'$5'} fontWeight={'400'} opacity={0.6}>
                  @{tags?.[0]?.name}
                </Paragraph>
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
                href={'/account/settings/edit-profile'}
                icon={<IconGear color={'$primary'} size={'$1'} />}
              >
                Settings
              </BorderedLink>
            </XStack>
          </XStack>
          <Separator w={'100%'} />
          <XStack w={'100%'} $md={{ jc: 'center' }} $sm={{ display: 'none' }}>
            <YStack gap={'$5'} w={'$12'}>
              <Paragraph fontSize={'$5'} fontWeight={'500'}>
                Name
              </Paragraph>
              <Paragraph fontSize={'$5'} fontWeight={'500'}>
                Sendtags
              </Paragraph>
              <Paragraph fontSize={'$5'} fontWeight={'500'}>
                Phone
              </Paragraph>
            </YStack>
            <YStack gap={'$5'}>
              <Paragraph color={'$color12'} fontSize={'$5'} fontWeight={'700'}>
                {name ? name : 'No Name'}
              </Paragraph>
              <Paragraph color={'$color12'} fontSize={'$5'} fontWeight={'700'}>
                {sendTags !== '' ? sendTags : 'No tags'}
              </Paragraph>
              <Paragraph color={'$color12'} fontSize={'$5'} fontWeight={'700'}>
                {formatPhoneNumber(user?.phone) ?? ''}
              </Paragraph>
            </YStack>
          </XStack>
          <YStack w={'100%'} gap={'$6'} $gtSm={{ display: 'none' }}>
            <YStack gap={'$2'}>
              <Paragraph fontSize={'$5'} fontWeight={'500'}>
                Name
              </Paragraph>
              <Paragraph color={'$color12'} fontSize={'$5'} fontWeight={'500'}>
                {name ? name : 'No Name'}
              </Paragraph>
            </YStack>
            <YStack gap={'$2'}>
              <Paragraph fontSize={'$5'} fontWeight={'500'}>
                Sendtags
              </Paragraph>
              <Paragraph color={'$color12'} fontSize={'$5'} fontWeight={'500'}>
                {sendTags !== '' ? sendTags : 'No tags'}
              </Paragraph>
            </YStack>
            <YStack gap={'$2'}>
              <Paragraph fontSize={'$5'} fontWeight={'500'}>
                Send ID
              </Paragraph>
              <Paragraph color={'$color12'} fontSize={'$5'} fontWeight={'500'}>
                {profile?.id ?? ''}
              </Paragraph>
            </YStack>
            <YStack gap={'$2'}>
              <Paragraph fontSize={'$5'} fontWeight={'500'}>
                Phone
              </Paragraph>
              <Paragraph color={'$color12'} fontSize={'$5'} fontWeight={'500'}>
                {user?.phone ?? ''}
              </Paragraph>
            </YStack>
            <YStack gap={'$2'}>
              <Paragraph fontSize={'$5'} fontWeight={'500'}>
                Address
              </Paragraph>
              <Paragraph color={'$color12'} fontSize={'$5'} fontWeight={'500'}>
                12, Main street, CA, USA
              </Paragraph>
            </YStack>
          </YStack>
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
    <Link borderWidth={1} borderColor={'$primary'} borderRadius={'$4'} p={'$3.5'} {...props}>
      <XStack gap={'$3'} ai={'center'}>
        {icon}
        <Paragraph color={'$primary'} textTransform="uppercase">
          {children}
        </Paragraph>
      </XStack>
    </Link>
  )
}
