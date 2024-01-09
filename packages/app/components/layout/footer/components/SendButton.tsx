import { Button, ButtonProps } from "@my/ui"
import { IconSendLogo } from "app/components/icons"

export const SendButton = ({ iconHeight, blackIcon, ...props }: ButtonProps & { iconHeight?: number, blackIcon?: boolean }) => {
  return (
    <Button
      br={'$6'}
      px={16}
      py={12}
      style={{
        backgroundImage: "linear-gradient(180deg, #FFF8EE -93.75%, #DAC5A5 -8.21%, #AB8F76 52.45%, #8F775D 90%, #A68B6E 127.2%, #B79A7A 185%)",
        boxShadow: "0px 9px 8px 0px rgba(167, 139, 114, 0.10)"
      }}
      {...props}
    >
      {blackIcon
        ? <IconSendLogo size={iconHeight} color={'#161619'} />
        : <IconSendLogo size={iconHeight} />
      }
    </Button>
  )
}
