import { ButtonProps } from "@my/ui"

export type NumPadProps = {
  value: string
  setValue: (val: string) => void
  balance: number
}

export interface NumpadButtonProps extends ButtonProps {
  value: string,
  num?: boolean,
  pressHandler: (val: string) => void
}

export type ConfirmModalProps = {
  showModal: boolean
  setShowModal: (showModal: boolean) => void
}

export type Coin = {
  icon?: React.ReactNode
  name: string
}

export type Tag = {
  name: string
  avatar: string
}

export type SendScreenType = 'send' | 'send-tag' | 'send-it'

export type ReceiveScreenType = 'receive-tag' | 'receive-amount'

export type SendScreenProps = {
  setCurrentScreen: ([currentScreen, direction]: [currentScreen: SendScreenType, direction: number]) => void
}

export type ReceiveScreenProps = {
  setCurrentScreen: ([currentScreen, direction]: [currentScreen: ReceiveScreenType, direction: number]) => void
}