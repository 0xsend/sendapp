import { Button, Image, YStack } from "@my/ui"
import SendLogo from "app/assets/img/logos/send-app-logo.svg"
import { LinearGradient } from "@tamagui/linear-gradient"
import { Stop } from "react-native-svg"

export const SendButton = () => {
  return (
    <YStack
      br={'$6'}
      px={16}
      py={12}
      style={{
        background: "linear-gradient(180deg, #FFF8EE -93.75%, #DAC5A5 -8.21%, #AB8F76 52.45%, #8F775D 90%, #A68B6E 127.2%, #B79A7A 185%)",
        boxShadow: "0px 9px 8px 0px rgba(167, 139, 114, 0.10)"
      }}
    >
      <Image source={{ uri: SendLogo.src }} width={'$9'} height={16} />
    </YStack>
  )
}
