import { ScrollView, YStack, XStack, Avatar, Paragraph, Theme } from "@my/ui";
import { LinearGradient } from "@tamagui/linear-gradient";
import { MainFooter } from "./footer";
import { IconQr } from 'app/components/icons';
import { Square } from 'tamagui'



const MainLayout = ({ scrollable = false, children }: { scrollable?: boolean, children?: React.ReactNode }) => {
  return (
    <YStack>
      <YStack height={'100vh'} pb={'$size.10'} $shorter={{ pb: '$size.8' }}>
        <Theme name={"send"}>
          <XStack w={"90%"} ai={"center"} jc={"space-between"} marginHorizontal={"5%"} paddingTop={"$6"}>
            <Avatar br={"$6"} size={"$4.5"}>
              <Square size={"$4"} backgroundColor="$color" elevation="$4" />
            </Avatar>
            <Paragraph size={"$9"} fontWeight={'700'}>Money</Paragraph>
            <IconQr />
          </XStack>
        </Theme>
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