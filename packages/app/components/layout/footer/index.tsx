import { Footer, Paragraph, Tabs, Theme, ThemeName, XStack, YStack } from '@my/ui'
import { IconActivity, IconHome, IconSLogo } from 'app/components/icons'
import { useThemeSetting } from 'app/provider/theme'

const MainFooter = () => {
  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$color12'
  return (
    <Footer
      pos={'absolute'}
      b={0}
      px={40}
      pt={'$3.5'}
      pb={'$5'}
      width="100%"
      borderColor={separatorColor}
      borderTopWidth={1}
    >
      <YStack height={'100%'}>
        <XStack pos="relative" fg={1} space="$3" bg="$background">
          <Tabs
            defaultValue="tab1"
            orientation="horizontal"
            fd={'column'}
            width={'100%'}
            overflow={'hidden'}
            space={'$10'}
          >
            <Tabs.List aria-label="Footer menu" space={'$2.5'} jc={'space-around'} height={'100%'}>
              <Tabs.Tab flex={1} value="tab1" p={0} height="100%" borderRadius={0}>
                <YStack width={64} ai="center">
                  <XStack h={'$2.5'} ai={'center'}>
                    <IconHome color={'$color12'} />
                  </XStack>
                  <Paragraph color={'$color12'} fontSize={'$3'} lineHeight={'$1'}>
                    Home
                  </Paragraph>
                </YStack>
              </Tabs.Tab>
              <Tabs.Tab flex={1} value="tab2" p={0} height="100%" opacity={0.7}>
                <YStack width={64} ai="center">
                  <IconSLogo color={iconColor} />
                </YStack>
              </Tabs.Tab>
              <Tabs.Tab flex={1} value="tab3" p={0} height="100%" opacity={0.7} borderRadius={0}>
                <YStack width={64} ai="center">
                  <XStack h={'$2.5'} ai={'center'}>
                    <IconActivity color={iconColor} />
                  </XStack>
                  <Paragraph color={iconColor} fontSize={'$3'} lineHeight={'$1'}>
                    Activity
                  </Paragraph>
                </YStack>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </XStack>
      </YStack>
    </Footer>
  )
}

export { MainFooter }
