import { ScrollView, YStack } from "@my/ui";
import { LinearGradient } from "@tamagui/linear-gradient";
import { MainFooter } from "./footer";



const MainLayout = ({ scrollable = false, children }: { scrollable?: boolean, children?: React.ReactNode }) => {
  return (
    <YStack>
      <YStack height={'100vh'} pb={'$size.10'} $shorter={{ pb: '$size.8' }}>
        {scrollable ?
          <>
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
              pointerEvents={'none'}
              b={'$size.10'}
              $shorter={{ b: '$size.8' }}
            />
          </>
          : <>{children}</>
        }
      </YStack>
      <MainFooter />
    </YStack>

  )
}

export { MainLayout };