import { ButtonProps } from "@my/ui"

export type INumPadProps = {
  value: string
  setValue: (val: string) => void
}

export interface INumpadButtonProps extends ButtonProps {
  value: string,
  num?: boolean,
  pressHandler: (val: string) => void
}

export type IConfirmModalProps = {
  showModal: boolean
  setShowModal: (showModal: boolean) => void
}

export type IToken = {
  icon?: React.ReactNode
  name: string
  price: number
}

export type ITag = {
  name: string
  avatar: string
}

export type ISendScreenType = 'send' | 'send-tag' | 'send-it'

export type IReceiveScreenType = 'receive-qrcode' | 'receive-tag' | 'receive-amount'

export type ISendScreenProps = {
  setCurrentScreen: ([currentScreen, direction]: [currentScreen: ISendScreenType, direction: number]) => void
}

export type IReceiveScreenProps = {
  setCurrentScreen: ([currentScreen, direction]: [currentScreen: IReceiveScreenType, direction: number]) => void
}

export type ITransferContextType = {
  sendAmount: string
  requestAmount: string
  balance: number
  tokens: IToken[]
  currentToken: IToken
  tags: ITag[]
  sendTo?: ITag
  requestTo?: ITag
};

export type ITransferContextContextType = {
  transferContext: ITransferContextType;
  updateTransferContext: (newState: Partial<ITransferContextType>) => void;
};

export type ITransferContextProviderProps = {
  children: React.ReactNode;
};