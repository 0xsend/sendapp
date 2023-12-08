import { ButtonProps } from "@my/ui"

export type NumPadProps = {
  value: string
  setValue: (val: string) => void
}

export interface NumpadButtonProps extends ButtonProps {
  value: string,
  num?: boolean,
  pressHandler: (val: string) => void
}

export type SendTagModalProps = {
  sendAmount: string
  asset?: Coin
  tags: Tag[]
  showModal: boolean
  setCurrentModal: (currentModal: ModalType) => void
}

export type SendItModalProps = {
  sendAmount: string
  asset?: Coin
  tag?: Tag
  showModal: boolean
  setCurrentModal: (currentModal: ModalType) => void
}

export type Coin = {
  icon?: React.ReactNode
  name: string
}

export type Tag = {
  name: string
  avatar: string
}

export type ModalType = '' | 'send_tag' | 'send_it'