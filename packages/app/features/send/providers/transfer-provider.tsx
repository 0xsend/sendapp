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
      avatar:
        'https://s3-alpha-sig.figma.com/img/eb19/3f8f/977bdbf2f05c1a17618f3ce2e06626d5?Expires=1702252800&Signature=C1er2rIICnn8qt7OmAxLKSmjXz2WM3idiguTKKKlLIfo4JG-m1Pnp2yaQBiKC0BDsd2If5wOO-f5gpeBGVGr9loIJyrDl-lgCd0LcSCXrTQwzem4R48AoZI5Pj0bup3ktx-VivSWhABO182Bm72qZ5rEUVnhk~hhdXahYJ7lDS5zZRVuZyuQPD6uyh2ndYAUre2P2e~gOKbZwmWlIjvHyV04hoOKsaxy4a2EzXklSky9ufuMEnvmwser2PqjLEtDh4pNZC3eAWctu4S1lTg~w2vxVMFEr6Ff1ShrAjEuCWhHE80XmSOXbtUwUf9naKmp2EA0ccWTA8ymYchD78hIBQ__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4',
    },
    {
      name: 'Damien',
      avatar:
        'https://s3-alpha-sig.figma.com/img/a851/fe91/3718702dc113ede9f0812c65a867c043?Expires=1702252800&Signature=B8JD4aTdCCuSsXAjacmQafK~eS81YNg5LoktXvtTooxUneBnTSbHThu05-IrMUldc1BPvrdiR6cjIPG0tdeKzzPL8vVcnsrwzJNm3seEt8fEIK-h0-p4ddI-6gCjjisI6akj3DwNfVFro9Yj8mq-ANyAd9WlDiK3N0xgE928-bBTIdxWLPqFR1F0qP8jF5rsTHRnu1g8v2moC7iqpuP1MxSs3-VbZ-gKIhlSOWJUl6imfQZAq7naYFdladCT4MV5HN5H9Rpgb3kDv2q-F7rAIi7HGCOoC-blQZW8YHb9rGnIpKTykAXUcfZgVp3ckbZy7e9aO3-gJiL8LdM8jQzmmw__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4',
    },
    {
      name: 'Elisha',
      avatar:
        'https://s3-alpha-sig.figma.com/img/4133/975a/0b108534bd4dd4c0583a2af270bbad58?Expires=1702252800&Signature=mYVUhTB3oUN0sTjkMnCN1wJ4os~qnnX-YJAXLFoZ3SqrgzMbUC8Yw0Y-IgCMMae2KIgDgDx93gNKngn6QZmAtLlzqdDvwCHqEyNZPjALg7kwrvsAw3jKxnUQ-G1FyYbSkYO64cK23JHc2QzMpJawR3Cr-JX8KkSQ8c-W72ChrNVZSm6T9sYCmgsjFCk1RT8YIW6a888kcuqVd4L~unAEFQUYTFXSqSAi5Pb21L5aelzGFDpMeJfbQ~sP1i0YgIPqKrd2JlkkfEtbGDyOQkjKTlkbX39~8WPj~bZZ2ae5cE6nmq6sJ9dU2itEvx~WSbdhGaxdzJBbb0JTLCkNFp7n-g__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4',
    },
    {
      name: 'Migrut',
      avatar:
        'https://s3-alpha-sig.figma.com/img/e5f1/c231/96d9c17181e09c0c069fb92abf5dcd9b?Expires=1702252800&Signature=ZHy8auRkpijZs9Iv1LymJ7kRcl~mNBoBntRkx3q09rKroNMi7fNDItCRKYI7-z0VPiqpUPmdhpP4~getREore6Ga2wBJoIdb2CorG8fF6MzWhQv5HrsIapj3dvF~QYHm1RfP~GHiQ36aJCpHK6-CQuT8q7~MoCQMh1Hj7NmwatmHbziiyHkM0YP6YHmC88-PMm3rXtBduCH3ivRuusnCPqdHPIZJ9lmUrM5JvLWJMHj4dACXxV4F2js4BjHVqrpTl58WX4xmO3ngxOmZgDHATWln-SIxR65cAc5kshfFY93Tzt-~OFuYWlGhlSD~JkGXlzR5kZfu23Fbe27K-9sZng__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4',
    },
    {
      name: 'Jane',
      avatar:
        'https://s3-alpha-sig.figma.com/img/6891/b163/706b318f4281f7751f15952875b3da85?Expires=1702252800&Signature=SAS8B1bj6NLgHvJAYyFuf~hl8JaR2xn-7EECMZEYATHhpUs3offebZwhjijPs~zGkafqVR8MvA-bCnSDrSEftLpAVjRW7qx46qdGK-awyuPTFZ5Zp600rB~GrqrF0WWEp6ikTmuERBGgztMRjQZ2c03Pqgzx3Pgn8dJ6BgEZufysX4tieFYkNNjMp9zF9ccX1tWmoSrhNmK-dliY30MYq6wHzrf-OGsRDaGJKpOv08h8cYxStHZoDCkus1FUh6jHOPuAlxSL3QBxOz2kUhBKZRik6Yue1RRCey5ugXfbngwhtA3ToBdb~lOQJ4f8SLTRZEDbuFcFWEOnRe1cE3EgNg__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4',
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
