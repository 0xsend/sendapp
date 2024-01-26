import { Button, Card, Image, Link, Paragraph, Separator, XStack, YStack } from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import {
  IconDownlod,
  IconLogout,
  IconNext,
  IconNotification,
  IconOur,
  IconPhone,
  IconQr,
  IconReferral,
  IconSecurity,
  IconSupport,
  IconTelegram,
  IconTheme,
} from 'app/components/icons'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { useEffect, useState } from 'react'
import { Square } from 'tamagui'

export function SettingsScreen() {
  const { profile, user } = useUser()
  const name = profile?.name
  const code = profile?.referral_code
  const about = profile?.about
  const avatar_url = profile?.avatar_url
  const supabase = useSupabase()
  const { toggle, current } = useThemeSetting()
  const [mode, setMode] = useState('')

  useEffect(() => {
    setMode(current ? current : '')
  }, [current])

  const accountSettings = [
    {
      icon: <IconPhone />,
      label: 'Change Phone',
      href: '/settings/change-phone',
    },
    {
      icon: <IconSecurity />,
      label: 'Security & Privacy',
      href: '/settings',
    },
    {
      icon: <IconNotification />,
      label: 'Notifications',
      href: '/settings',
    },
  ]

  const accountSocialMedia = [
    {
      icon: <IconOur />,
      label: 'Our X',
      href: 'https://x.com/send',
    },
    {
      icon: <IconTelegram />,
      label: 'Our Telegram',
      href: 'https://go.send.it/tg',
    },
  ]

  const accountTheme = [
    {
      icon: <IconTheme />,
      label: 'Theme',
      action: () => toggle(),
    },
    {
      icon: <IconSupport />,
      label: 'Support',
      action: () => console.log('Support'),
    },
    {
      icon: <IconLogout />,
      label: 'Log Out',
      action: () => supabase.auth.signOut(),
    },
  ]

  return (
    <>
      <YStack
        $gtLg={{ width: '100%' }}
        $sm={{ width: '100%' }}
        $gtSm={{ width: '100%' }}
        ai={'center'}
        gap={'$space.6'}
      >
        <XStack w={'90%'} ai={'center'} jc={'space-between'} marginHorizontal={'5%'}>
          <Paragraph size={'$9'} fontWeight={'700'}>
            Account
          </Paragraph>
        </XStack>
        <XStack w={'90%'} ai={'center'} jc={'space-between'} zIndex={4}>
          <Card
            cur={'pointer'}
            w={'100%'}
            h={'$22'}
            borderRadius={'$8'}
            shadowColor={'rgba(0, 0, 0, 0.1)'}
            shadowOffset={{ width: 0, height: 4 }}
            shadowRadius={8}
            shadowOpacity={0.1}
          >
            <YStack>
              <XStack
                w={'90%'}
                ai={'center'}
                jc={'space-between'}
                marginHorizontal={'5%'}
                paddingTop={'$5'}
              >
                <IconQr />
                <IconDownlod />
              </XStack>
              <YStack ai={'center'} jc={'center'} marginTop={'$5'}>
                {avatar_url ? (
                  <Image source={{ uri: avatar_url }} width={128} height={128} />
                ) : (
                  <Square
                    size={'$11'}
                    borderRadius={'$8'}
                    backgroundColor="$color"
                    elevation="$4"
                  />
                )}
                <Paragraph fontSize={20} fontWeight={'700'} marginTop={'$3'}>
                  {name ? name : 'No Name'}
                </Paragraph>
                <Paragraph fontSize={14} fontWeight={'700'} marginTop={'$2'}>
                  {user?.phone}
                </Paragraph>
                <Paragraph fontSize={13} fontWeight={'400'} opacity={0.6}>
                  {about}
                </Paragraph>

                <Link href={'/settings/profile'} w={'100%'}>
                  <Button f={1} bw={'$0.5'} marginTop={'$5'} width={'$18'}>
                    Edit Profile
                  </Button>
                </Link>
              </YStack>
            </YStack>
          </Card>
        </XStack>
        <XStack w={'90%'} ai={'center'} jc={'space-between'} zIndex={4}>
          <Card
            cur={'pointer'}
            w={'100%'}
            h={'$8'}
            borderRadius={'$8'}
            shadowColor={'rgba(0, 0, 0, 0.1)'}
            shadowOffset={{ width: 0, height: 4 }}
            shadowRadius={8}
            shadowOpacity={0.1}
          >
            <XStack h={'inherit'} ai="center" padding={'$5'} paddingRight={'$3'}>
              <IconReferral />
              <YStack f={1}>
                <XStack f={1} h={'Inherit'} paddingLeft={'$3'}>
                  <Paragraph fontSize={20} fontWeight={'400'}>
                    Referral Link
                  </Paragraph>
                </XStack>
                <XStack f={1} h={'Inherit'} paddingLeft={'$3'}>
                  <Paragraph fontSize={16} fontWeight={'400'} opacity={0.6}>
                    {code}
                  </Paragraph>
                </XStack>
              </YStack>
            </XStack>
          </Card>
        </XStack>
        <YStack w={'90%'} jc={'space-between'} zIndex={4} mb={'$7'}>
          <Paragraph fontSize={16} fontWeight={'400'} opacity={0.6} mb={'$5'}>
            ACCOUNT & SETTINGS
          </Paragraph>
          <Card
            cur={'pointer'}
            w={'100%'}
            borderRadius={'$8'}
            shadowColor={'rgba(0, 0, 0, 0.1)'}
            shadowOffset={{ width: 0, height: 4 }}
            shadowRadius={8}
            shadowOpacity={0.1}
          >
            <YStack h={'inherit'} padding={'$5'}>
              {accountSettings.map((account) => (
                <Link href={account.href} key={account.label}>
                  <XStack jc={'space-between'} marginBottom={20}>
                    <XStack>
                      {account.icon}
                      <Paragraph paddingLeft={'$3'} fontSize={16} fontWeight={'400'}>
                        {account.label}
                      </Paragraph>
                    </XStack>
                    <XStack>
                      <IconNext />
                    </XStack>
                  </XStack>
                </Link>
              ))}
              <Separator
                marginBottom={20}
                backgroundColor={'$color'}
                borderColor={'$color'}
                opacity={0.3}
              />
              {accountSocialMedia.map((account) => (
                <Link href={account.href} key={account.label}>
                  <XStack jc={'space-between'} marginBottom={20}>
                    <XStack>
                      {account.icon}
                      <Paragraph paddingLeft={'$3'} fontSize={16} fontWeight={'400'}>
                        {account.label}
                      </Paragraph>
                    </XStack>
                    <XStack>
                      <IconNext />
                    </XStack>
                  </XStack>
                </Link>
              ))}
              <Separator
                marginBottom={20}
                backgroundColor={'$color'}
                borderColor={'$color'}
                opacity={0.3}
              />
              {accountTheme.map((account) => (
                <XStack
                  jc={'space-between'}
                  marginBottom={20}
                  key={account.label}
                  onPress={() => account.action()}
                >
                  <XStack>
                    {account.icon}
                    <Paragraph paddingLeft={'$3'} fontSize={16} fontWeight={'400'}>
                      {account.label}
                    </Paragraph>
                  </XStack>
                  <XStack>
                    {account.label !== 'Theme' ? (
                      <IconNext />
                    ) : (
                      <Paragraph
                        fontWeight={'700'}
                        borderRadius={'$6'}
                        borderWidth={1}
                        paddingLeft={20}
                        paddingRight={20}
                      >
                        {mode?.toUpperCase()}
                      </Paragraph>
                    )}
                  </XStack>
                </XStack>
              ))}
            </YStack>
          </Card>
        </YStack>
      </YStack>
    </>
  )
}
