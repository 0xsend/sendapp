import React, { type ReactNode } from 'react'
import { YStack } from '@tamagui/stacks'
import QRCodeSVG, { type QRCodeProps } from 'react-native-qrcode-svg'

type CustomQRCodeProps = QRCodeProps & {
  centerComponent?: ReactNode
}

export function QRCode({ centerComponent, ...qrProps }: CustomQRCodeProps) {
  if (!centerComponent) {
    return <QRCodeSVG {...qrProps} />
  }

  return (
    <YStack position="relative" alignItems="center" justifyContent="center">
      <QRCodeSVG {...qrProps} />
      <YStack position="absolute">{centerComponent}</YStack>
    </YStack>
  )
}
