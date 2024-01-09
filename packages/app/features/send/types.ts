import { ButtonProps } from '@my/ui'
import React from 'react'

export interface INumPadProps {
  value: string
  setValue: (val: string) => void
}

export interface INumpadButtonProps extends ButtonProps {
  value: string
  num?: boolean
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

export enum SendScreen {
  HOME = 'home',
  SEND = 'send',
  SEND_TAG = 'send-tag',
  SEND_IT = 'send-it',
}
export type SendScreenType =
  | SendScreen.HOME
  | SendScreen.SEND
  | SendScreen.SEND_TAG
  | SendScreen.SEND_IT

export enum ReceiveScreen {
  HOME = 'home',
  RECEIVE_QRCODE = 'receive-qrcode',
  RECEIVE_TAG = 'receive-tag',
  RECEIVE_AMOUNT = 'receive-amount',
}
export type ReceiveScreenType =
  | ReceiveScreen.HOME
  | ReceiveScreen.RECEIVE_QRCODE
  | ReceiveScreen.RECEIVE_TAG
  | ReceiveScreen.RECEIVE_AMOUNT

export enum QRScreen {
  HOME = 'home',
  QR_SCAN = 'qr-scan',
  QR_MYCODE = 'qr-mycode',
  QR_AMOUNT = 'qr-amount',
  QR_SHARE = 'qr-share',
}
export type QRScreenType =
  | QRScreen.HOME
  | QRScreen.QR_SCAN
  | QRScreen.QR_MYCODE
  | QRScreen.QR_AMOUNT
  | QRScreen.QR_SHARE

export const ANIMATE_DIRECTION_LEFT = -1
export const ANIMATE_DIRECTION_RIGHT = 1
export type ANIMATE_DIRECTION = typeof ANIMATE_DIRECTION_LEFT | typeof ANIMATE_DIRECTION_RIGHT
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
}

export interface ISubScreenContext {
  currentComponent: QRScreenType | SendScreenType | ReceiveScreenType
  direction: ANIMATE_DIRECTION
  sendOrRequest: 'Send' | 'Request' | undefined
  setCurrentComponent: ([newScreen, newDirection, newSendOrRequest]: [
    newScreen: QRScreenType | SendScreenType | ReceiveScreenType,
    newDirection: ANIMATE_DIRECTION,
    newSendOrRequest?: 'Send' | 'Request',
  ]) => void
}

export interface ITransferContextProviderProps {
  children: React.ReactNode
}

export interface ISubScreenContextProviderProps {
  children: React.ReactNode
}
