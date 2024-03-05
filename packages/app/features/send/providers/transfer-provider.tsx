import { IconEthereum, IconUSDC } from 'app/components/icons'
import { createContext, useContext, useMemo, useState } from 'react'
import { ITag, IToken, ITransferContext, ITransferContextProviderProps } from '../types'

const TransferContext = createContext<ITransferContext | undefined>(undefined)

export const useTransferContext = () => {
  const context = useContext(TransferContext)
  if (!context) {
    throw new Error('useTransferContext must be used within a TransferContextProvider')
  }
  return context
}

export const TransferProvider = ({ children }: ITransferContextProviderProps) => {
  const [sendAmount, setSendAmount] = useState('0')
  const [requestAmount, setRequestAmount] = useState('0')
  const [balance, setBalance] = useState(9.25)
  const [tokens, setTokens] = useState<IToken[]>([
    { icon: <IconEthereum />, name: 'ETH', price: 2284 },
    { icon: <IconUSDC />, name: 'USDC', price: 0.999 },
    { icon: <IconEthereum />, name: 'SEND', price: 0.0001 },
  ])
  const [currentToken, setCurrentToken] = useState<IToken>({
    icon: <IconEthereum />,
    name: 'ETH',
    price: 2284,
  })
  const [tags, setTags] = useState<ITag[]>([
    {
      name: 'John',
      avatar: 'https://ui-avatars.com/api.jpg?name=John&size=256',
    },
    {
      name: 'Damien',
      avatar: 'https://ui-avatars.com/api.jpg?name=Damien&size=256',
    },
    {
      name: 'Elisha',
      avatar: 'https://ui-avatars.com/api.jpg?name=Elisha&size=256',
    },
    {
      name: 'Migrut',
      avatar: 'https://ui-avatars.com/api.jpg?name=Migrut&size=256',
    },
    {
      name: 'Jane',
      avatar: 'https://ui-avatars.com/api.jpg?name=Jane&size=256',
    },
    {
      name: 'BigBoss',
      avatar: 'https://avatars.githubusercontent.com/u/95193764?v=4',
    },
    {
      name: 'LeO',
      avatar: 'https://avatars.githubusercontent.com/u/101268960?v=4',
    },
  ])
  const [sendTo, setSendTo] = useState<ITag>()
  const [requestTo, setRequestTo] = useState<ITag>()

  const value = useMemo(
    () => ({
      sendAmount,
      requestAmount,
      balance,
      tokens,
      currentToken,
      tags,
      sendTo,
      requestTo,
      setSendAmount,
      setRequestAmount,
      setBalance,
      setTokens,
      setCurrentToken,
      setTags,
      setSendTo,
      setRequestTo,
    }),
    [sendAmount, requestAmount, balance, tokens, currentToken, tags, sendTo, requestTo]
  )

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>
}
