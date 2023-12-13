import { Footer, Tabs, XStack, YStack } from "@my/ui"
import { IconHome, IconSettings } from "app/components/icons"
import { SendButton } from "./components/SendButton"

const MainFooter = () => {
  return (
    <Footer
      pos={'absolute'}
      b={0}
      px={36}
      width="100%"
      height={'$10'}
      $shorter={{
        height: '$8'
      }}
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
            <Tabs.List
              disablePassBorderRadius="bottom"
              aria-label="Footer menu"
              space={'$2.5'}
              jc={'space-around'}
              height={'100%'}
            >
              <Tabs.Tab flex={1} value="tab1" ai="flex-start" borderTopLeftRadius="$10" borderTopRightRadius="$10" height="100%" pt="$4.5">
                <IconHome />
              </Tabs.Tab>
              <Tabs.Tab flex={1} value="tab2" ai="flex-start" borderTopLeftRadius="$10" borderTopRightRadius="$10" height="100%" pt="$4">
                <SendButton />
              </Tabs.Tab>
              <Tabs.Tab flex={1} value="tab3" ai="flex-start" borderTopLeftRadius="$10" borderTopRightRadius="$10" height="100%" pt="$5">
                <IconSettings />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </XStack>
      </YStack>
    </Footer>
  )
}

export { MainFooter }