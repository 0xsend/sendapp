import { ButtonProps } from "@my/ui"
import React from "react"

export interface INumPadProps {
  value: string
  setValue: (val: string) => void
}

export interface INumpadButtonProps extends ButtonProps {
  value: string,
  num?: boolean,
  pressHandler: (val: string) => void
}

export interface IConfirmModalProps {
  showModal: boolean
  setShowModal: (showModal: boolean) => void
}

export interface ISendRequestModalProps {
  showModal: boolean
  setShowModal: (showModal: boolean) => void
  to?: ITag
}

export interface IProfileModalProps {
  showModal: boolean
  setShowModal: (showModal: boolean) => void
  tag?: ITag
}

export interface IProfileQRModalProps {
  showModal: boolean
  setShowModal: (showModal: boolean) => void
  to?: ITag
}

export interface IToken {
  icon?: React.ReactNode
  name: string
  price: number
}

export interface ITag {
  name: string
  avatar: string
}

export type SendScreenType = 'home' | 'send' | 'send-tag' | 'send-it'

export type ReceiveScreenType = 'home' | 'receive-qrcode' | 'receive-tag' | 'receive-amount'

export type QRScreenType = 'home' | 'qr-scan' | 'qr-mycode' | 'qr-amount' | 'qr-share'

export interface ITransferContext {
  sendAmount: string
  requestAmount: string
  balance: number
  tokens: IToken[]
  currentToken: IToken
  tags: ITag[]
  sendTo?: ITag
  requestTo?: ITag
  setSendAmount: (sendAmount: string) => void
  setRequestAmount: (requestAmount: string) => void
  setBalance: (balance: number) => void
  setTokens: (tokens: IToken[]) => void
  setCurrentToken: (currentToken: IToken) => void
  setTags: (tags: ITag[]) => void
  setSendTo: (sendTo: ITag) => void
  setRequestTo: (requestTo: ITag) => void
};

export interface ISubScreenContext {
  currentComponent: QRScreenType | SendScreenType | ReceiveScreenType
  direction: number
  sendOrRequest: 'Send' | 'Request' | undefined
  setCurrentComponent: ([
    newScreen,
    newDirection,
    newSendOrRequest
  ]: [
      newScreen: QRScreenType | SendScreenType | ReceiveScreenType,
      newDirection: number,
      newSendOrRequest?: 'Send' | 'Request'
    ]) => void
}

export interface ITransferContextProviderProps {
  children: React.ReactNode;
};

export interface ISubScreenContextProviderProps {
  children: React.ReactNode;
}