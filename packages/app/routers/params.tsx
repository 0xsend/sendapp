import type { Enums } from '@my/supabase/database.types'
import { baseMainnet, sendTokenAddress, usdcAddress } from '@my/wagmi'
import { type allCoins, allCoinsDict } from 'app/data/coins'
import { createParam } from 'solito'
import { type Address, isAddress } from 'viem'
import { useCoin } from 'app/provider/coins'

export type RootParams = {
  nav?: 'home'
  token?: allCoins[number]['token']
  search?: string
  profile?: string
}

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

const useProfile = () => {
  const [profile, setProfileParam] = useRootParam('profile')

  return [profile, setProfileParam] as const
}

export const useRootScreenParams = () => {
  const { setParams } = useRootParams()
  const [nav] = useNav()
  const [token] = useToken()
  const [search] = useSearch()
  const [profile] = useProfile()

  return [
    {
      nav,
      token,
      search,
      profile,
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
  sendToken?: allCoins[number]['token']
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

const parseTokenParam = (value) => {
  if (Array.isArray(value)) {
    return isAddress(value[0] ?? '') || Object.keys(allCoinsDict).includes(value[0] ?? '')
      ? (value[0] as allCoins[number]['token'])
      : usdcAddress[baseMainnet.id]
  }

  return isAddress(value ?? '') || Object.keys(allCoinsDict).includes(value ?? '')
    ? (value as allCoins[number]['token'])
    : usdcAddress[baseMainnet.id]
}

export const useSendToken = () => {
  const { coin: sendCoin } = useCoin('SEND')
  const [sendToken, setSendTokenParam] = useSendParam('sendToken', {
    initial:
      sendCoin?.balance && sendCoin.balance > 0n
        ? sendTokenAddress[baseMainnet.id]
        : usdcAddress[baseMainnet.id],
    parse: parseTokenParam,
  })

  return [sendToken, setSendTokenParam] as const
}

export const useNote = () => {
  const [note, setNoteParam] = useSendParam('note', {
    initial: undefined,
    parse: (value) => {
      if (value === '') return undefined
      if (!value || !value[0]) return undefined
      return Array.isArray(value) ? decodeURIComponent(value[0]) : decodeURIComponent(value)
    },
  })
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

export type ProfileScreenParams = {
  sendid?: string
  tag?: string
}

const { useParam: useProfileParam, useParams: useProfileParams } =
  createParam<ProfileScreenParams>()

export const useSendId = () => {
  const [sendid, setSendid] = useProfileParam('sendid')
  return [sendid, setSendid] as const
}

export const useTag = () => {
  const [tag, setTag] = useProfileParam('tag')
  return [tag, setTag] as const
}

export const useProfileScreenParams = () => {
  const { setParams } = useProfileParams()
  const [sendid] = useSendId()
  const [tag] = useTag()

  return [{ sendid, tag }, setParams] as const
}

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

export type SwapScreenParams = {
  outToken: allCoins[number]['token']
  inToken: allCoins[number]['token']
  inAmount?: string
  slippage?: string
}

const { useParam: useSwapParam, useParams: useSwapParams } = createParam<SwapScreenParams>()

const useInToken = () => {
  const [inToken, setInToken] = useSwapParam('inToken', {
    initial: usdcAddress[baseMainnet.id],
    parse: parseTokenParam,
  })

  return [inToken, setInToken] as const
}

const useOutToken = () => {
  const [outToken, setOutToken] = useSwapParam('outToken', {
    initial: sendTokenAddress[baseMainnet.id],
    parse: parseTokenParam,
  })

  return [outToken, setOutToken] as const
}

const useInAmount = () => {
  const [inAmount, setInAmount] = useSwapParam('inAmount')

  return [inAmount, setInAmount] as const
}

const useSlippage = () => {
  const [slippage, setSlippage] = useSwapParam('slippage')

  return [slippage, setSlippage] as const
}

export const useSwapScreenParams = () => {
  const { setParams } = useSwapParams()
  const [outToken] = useOutToken()
  const [inToken] = useInToken()
  const [inAmount] = useInAmount()
  const [slippage] = useSlippage()

  return [
    {
      outToken,
      inToken,
      inAmount,
      slippage,
    },
    setParams,
  ] as const
}

export type DepositScreenParams = {
  depositAmount?: string
}

const { useParam: useDepositParam, useParams: useDepositParams } =
  createParam<DepositScreenParams>()

const useDepositAmount = () => {
  const [depositAmount, setDepositAmount] = useDepositParam('depositAmount')

  return [depositAmount, setDepositAmount] as const
}

export const useDepositScreenParams = () => {
  const { setParams } = useDepositParams()
  const [depositAmount] = useDepositAmount()

  return [
    {
      depositAmount,
    },
    setParams,
  ] as const
}
