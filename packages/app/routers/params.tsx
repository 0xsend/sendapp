import { createParam } from 'solito'

export type RootParams = { nav?: 'home' | 'settings'; token?: string }

const { useParam: useRootParam, useParams: useRootParams } = createParam<RootParams>()

const useNav = () => {
  const [nav, setNavParam] = useRootParam('nav')

  return [nav, setNavParam] as const
}

const useToken = () => {
  const [token, setTokenParam] = useRootParam('token')

  return [token, setTokenParam] as const
}

export const useRootScreenParams = () => {
  const { setParams } = useRootParams()
  const [nav] = useNav()
  const [token] = useToken()

  return [
    {
      nav,
      token,
    },
    setParams,
  ] as const
}

export type DistributionScreenParams = { distribution?: number }

const { useParam: useDistributionParam, useParams: useDistributionParams } =
  createParam<DistributionScreenParams>()

const useDistribution = () => {
  const [distribution, setDistributionParam] = useDistributionParam('distribution', {
    initial: undefined,
    parse: (value) => Number(value),
  })

  return [distribution, setDistributionParam] as const
}

export const useDistributionScreenParams = () => {
  const { setParams } = useDistributionParams()
  const [distributionNumber] = useDistribution()
  return [
    {
      distributionNumber,
    },
    setParams,
  ] as const
}

export type SendScreenParams = {
  recipient?: string
  amount?: string
  sendToken?: `0x${string}` | 'eth'
  note?: string
}

const { useParam: useSendParam, useParams: useSendParams } = createParam<SendScreenParams>()

const useRecipient = () => {
  const [recipient, setRecipientParam] = useSendParam('recipient')

  return [recipient, setRecipientParam] as const
}

const useAmount = () => {
  const [amount, setAmountParam] = useSendParam('amount')

  return [amount, setAmountParam] as const
}

const useSendToken = () => {
  const [sendToken, setSendTokenParam] = useSendParam('sendToken')

  return [sendToken, setSendTokenParam] as const
}

const useNote = () => {
  const [note, setNoteParam] = useSendParam('note')

  return [note, setNoteParam] as const
}

export const useSendScreenParams = () => {
  const { setParams } = useSendParams()
  const [recipient] = useRecipient()
  const [amount] = useAmount()
  const [sendToken] = useSendToken()
  const [note] = useNote()

  return [
    {
      recipient,
      amount,
      sendToken,
      note,
    },
    setParams,
  ] as const
}

export type ProfileScreenParams = undefined
