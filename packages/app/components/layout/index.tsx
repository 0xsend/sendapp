import { ScrollView, YStack } from "@my/ui";
import { LinearGradient } from "@tamagui/linear-gradient";
import { MainFooter } from "./footer";

const MainLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <YStack>
      <YStack height={'100vh'} pb={'$13'}>
        <ScrollView>
          {children}
        </ScrollView>
        <LinearGradient
          start={[0, 1]}
          end={[0, 0]}
          width={'100%'}
          height={'$6'}
          colors={['$background', '$backgroundTransparent']}
          pos={'absolute'}
          b={'$13'}
        />
      </YStack>
      <MainFooter />
    </YStack>
  )
}

export { MainLayout };