import { ButtonProps } from "@my/ui"

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

export interface IToken {
  icon?: React.ReactNode
  name: string
  price: number
}

export interface ITag {
  name: string
  avatar: string
}

export type SendScreenType = 'send' | 'send-tag' | 'send-it'

export type ReceiveScreenType = 'receive-qrcode' | 'receive-tag' | 'receive-amount'

export interface ISendScreenProps {
  setCurrentScreen: ([currentScreen, direction]: [currentScreen: SendScreenType, direction: number]) => void
}

export interface IReceiveScreenProps {
  setCurrentScreen: ([currentScreen, direction]: [currentScreen: ReceiveScreenType, direction: number]) => void
}

export interface ITransferState {
  sendAmount: string
  requestAmount: string
  balance: number
  tokens: IToken[]
  currentToken: IToken
  tags: ITag[]
  sendTo?: ITag
  requestTo?: ITag
};

export interface ITransferContext {
  transferState: ITransferState;
  updateTransferContext: (newState: Partial<ITransferState>) => void;
};

export interface ITransferContextProviderProps {
  children: React.ReactNode;
};