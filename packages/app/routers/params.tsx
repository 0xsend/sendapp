import type { Enums } from '@my/supabase/database.types'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { createParam } from 'solito'
import type { Address } from 'viem'

export type RootParams = { nav?: 'home' | 'settings'; token?: string; search?: string }

const { useParam: useRootParam, useParams: useRootParams } = createParam<RootParams>()

const useNav = () => {
  const [nav, setNavParam] = useRootParam('nav')

  return [nav, setNavParam] as const
}

const useToken = () => {
  const [token, setTokenParam] = useRootParam('token')

  return [token, setTokenParam] as const
}

const useSearch = () => {
  const [search, setSearchParam] = useRootParam('search')

  return [search, setSearchParam] as const
}

export const useRootScreenParams = () => {
  const { setParams } = useRootParams()
  const [nav] = useNav()
  const [token] = useToken()
  const [search] = useSearch()

  return [
    {
      nav,
      token,
      search,
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

export const useRewardsScreenParams = () => {
  const { setParams } = useDistributionParams()
  const [distribution] = useDistribution()
  return [
    {
      distribution,
    },
    setParams,
  ] as const
}

export type SendScreenParams = {
  idType?: Enums<'lookup_type_enum'> | Address
  recipient?: string
  amount?: string
  sendToken?: `0x${string}` | 'eth'
  note?: string
}

const { useParam: useSendParam, useParams: useSendParams } = createParam<SendScreenParams>()

const useIdType = () => {
  const [idType, setIdTypeParam] = useSendParam('idType', {
    initial: undefined,
    parse: (value) => value as Enums<'lookup_type_enum'>,
  })

  return [idType, setIdTypeParam] as const
}

const useRecipient = () => {
  const [recipient, setRecipientParam] = useSendParam('recipient')

  return [recipient, setRecipientParam] as const
}

const useAmount = () => {
  const [amount, setAmountParam] = useSendParam('amount')

  return [amount, setAmountParam] as const
}

export const useSendToken = () => {
  const [sendToken, setSendTokenParam] = useSendParam('sendToken', {
    initial: usdcAddress[baseMainnet.id],
  })

  return [sendToken, setSendTokenParam] as const
}

const useNote = () => {
  const [note, setNoteParam] = useSendParam('note')

  return [note, setNoteParam] as const
}

export const useSendScreenParams = () => {
  const { setParams } = useSendParams()
  const [idType] = useIdType()
  const [recipient] = useRecipient()
  const [amount] = useAmount()
  const [sendToken] = useSendToken()
  const [note] = useNote()

  return [
    {
      idType,
      recipient,
      amount,
      sendToken,
      note,
    },
    setParams,
  ] as const
}

export type ProfileScreenParams = undefined

export type AuthScreenParams = {
  redirectUri?: string
}

const { useParam: useAuthParam, useParams: useAuthParams } = createParam<AuthScreenParams>()

export const useRedirectUri = () => {
  const [redirectUri, setRedirectUriParam] = useAuthParam('redirectUri', {
    initial: undefined,
    parse: (value) => {
      if (value === undefined) return undefined
      if (value.includes('/auth/')) return undefined
      return Array.isArray(value) ? decodeURIComponent(value[0] ?? '') : decodeURIComponent(value)
    },
  })

  return [redirectUri, setRedirectUriParam] as const
}

export const useAuthScreenParams = () => {
  const { setParams } = useAuthParams()
  const [redirectUri] = useRedirectUri()

  return [
    {
      redirectUri,
    },
    setParams,
  ] as const
}
