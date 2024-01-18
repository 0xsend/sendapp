import { Button, Card, Container, Image, Link, Paragraph, Theme, XStack, YStack } from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import {
  IconDownlod,
  IconNext,
  IconNotification,
  IconPersonal,
  IconQr,
  IconReferral,
  IconSecurity,
  IconSupport,
} from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { Square } from 'tamagui'

export function AccountScreen() {
  const { profile } = useUser()
  const name = profile?.name
  const code = profile?.referral_code
  const about = profile?.about
  const avatar_url = profile?.avatar_url
  const { resolvedTheme } = useThemeSetting()
  const accountSettings = [
    {
      icon: <IconPersonal />,
      label: 'Personal',
    },
    {
      icon: <IconSecurity />,
      label: 'Security & Privacy',
    },
    {
      icon: <IconNotification />,
      label: 'Notifications',
    },
    {
      icon: <IconSupport />,
      label: 'Support',
    },
  ]
  return (
    <>
      <Theme name="send">
        <YStack
          $gtLg={{ width: '100%' }}
          $sm={{ width: '100%' }}
          $gtSm={{ width: '100%' }}
          ai={'center'}
          // paddingTop={'$6'}
          gap={'$space.6'}
        >
          <XStack
            w={'90%'}
            ai={'center'}
            jc={'space-between'}
            marginHorizontal={'5%'}
            // paddingTop={'$6'}
          >
            <Paragraph size={'$9'} fontWeight={'700'}>
              Account
            </Paragraph>
            {/* <Link href={'/'}>
              <XStack>
                <IconClose color={resolvedTheme?.startsWith('dark') ? 'white' : 'black'} />
              </XStack>
            </Link> */}
          </XStack>
          <XStack w={'90%'} ai={'center'} jc={'space-between'} zIndex={4}>
            <Card
              cur={'pointer'}
              w={'100%'}
              h={'$21'}
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
                      backgroundColor="$primary"
                      elevation="$4"
                    />
                  )}
                  <Paragraph fontSize={20} fontWeight={'700'} marginTop={'$3'}>
                    {name ? name : 'No Name'}
                  </Paragraph>
                  <Paragraph fontSize={13} fontWeight={'400'} opacity={0.6}>
                    {about}
                  </Paragraph>
                  <Link href={'/profile/edit'} w={'100%'}>
                    <Button
                      f={1}
                      br={'$radius.true'}
                      bw={'$0.5'}
                      borderColor={'#C3AB8E'}
                      bg={'transparent'}
                      shadowColor={'rgba(0, 0, 0, 0.1)'}
                      shadowOffset={{ width: 0, height: 4 }}
                      shadowRadius={8}
                      shadowOpacity={0.1}
                      marginTop={'$5'}
                    >
                      <Paragraph color={'$primary'} fontWeight={'700'}>
                        Edit Profile
                      </Paragraph>
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
              h={'$16'}
              borderRadius={'$8'}
              shadowColor={'rgba(0, 0, 0, 0.1)'}
              shadowOffset={{ width: 0, height: 4 }}
              shadowRadius={8}
              shadowOpacity={0.1}
            >
              <YStack h={'inherit'} padding={'$5'}>
                {accountSettings.map((account) => (
                  <XStack jc={'space-between'} paddingBottom={20} key={account.label}>
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
                ))}
              </YStack>
            </Card>
          </YStack>
        </YStack>
      </Theme>
    </>
  )
}
