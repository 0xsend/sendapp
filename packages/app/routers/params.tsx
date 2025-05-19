import type { Enums } from '@my/supabase/database.types'
import { baseMainnet, sendTokenAddress, usdcAddress } from '@my/wagmi'
import { type allCoins, allCoinsDict } from 'app/data/coins'
import { createParam } from 'solito'
import { type Address, isAddress } from 'viem'
import { useCoin } from 'app/provider/coins'
import { useCallback } from 'react'

export type AuthScreenParams = {
  redirectUri?: string
}

const { useParam: useAuthParam, useParams: useAuthParams } = createParam<AuthScreenParams>()

const useRedirectUri = () => {
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

export type RootParams = {
  nav?: 'home'
  token?: allCoins[number]['token']
  search?: string
  profile?: string
  activity?: string
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

const useActivity = () => {
  const [activity, setActivityParam] = useRootParam('activity')
  return [activity, setActivityParam] as const
}

export const useRootScreenParams = () => {
  const { setParams } = useRootParams()
  const [nav] = useNav()
  const [token] = useToken()
  const [search] = useSearch()
  const [profile] = useProfile()
  const [activity] = useActivity()

  return [
    {
      nav,
      token,
      search,
      profile,
      activity,
    },
    setParams,
  ] as const
}

type SetStateOptions = {
  webBehavior?: 'push' | 'replace'
}

type ParamsHook<T> = () => readonly [T, (params: Partial<T>, options?: SetStateOptions) => void]

// Exclude RootParams keys from T
type ExcludeRootParams<T> = {
  [K in keyof T]: K extends keyof RootParams ? never : T[K]
}

const withRootParams = <T extends object>(
  useScreenParamsHook: ParamsHook<ExcludeRootParams<T>>
) => {
  return (): readonly [
    RootParams & T,
    (params: Partial<RootParams & T>, options?: SetStateOptions) => void,
  ] => {
    const [rootParamsData, setRootParams] = useRootScreenParams()
    const [screenParams, setScreenParams] = useScreenParamsHook()

    const setCombinedParams = useCallback(
      (params: Partial<RootParams & T>, options?: SetStateOptions) => {
        const rootKeys = Object.keys(params).filter((key) => key in rootParamsData)
        const screenKeys = Object.keys(params).filter((key) => key in screenParams)

        if (rootKeys.length > 0) {
          const rootUpdate = Object.fromEntries(rootKeys.map((key) => [key, params[key]]))
          setRootParams(rootUpdate, options)
        }

        if (screenKeys.length > 0) {
          const screenUpdate = Object.fromEntries(
            screenKeys.map((key) => [key, params[key]])
          ) as ExcludeRootParams<T>
          setScreenParams(screenUpdate, options)
        }
      },
      [rootParamsData, screenParams, setRootParams, setScreenParams]
    )

    return [
      {
        ...rootParamsData,
        ...screenParams,
      },
      setCombinedParams,
    ] as const
  }
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

const useRewardsScreenParamsBase = () => {
  const { setParams } = useDistributionParams()
  const [distribution] = useDistribution()

  return [
    {
      distribution,
    },
    setParams,
  ] as const
}

export const useRewardsScreenParams = withRootParams(useRewardsScreenParamsBase)

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

const useSendToken = () => {
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

const useNote = () => {
  const [note, setNoteParam] = useSendParam('note', {
    initial: undefined,
    stringify: (note) => {
      if (!note) return ''
      return encodeURIComponent(note)
    },
    parse: (value) => {
      if (!value || !value[0] || value === '') return undefined
      return Array.isArray(value) ? decodeURIComponent(value[0]) : decodeURIComponent(value)
    },
  })
  return [note, setNoteParam] as const
}

const useSendScreenParamsBase = () => {
  const { setParams } = useSendParams()
  const [idType] = useIdType()
  const [recipient] = useRecipient()
  const [amount] = useAmount()
  const [sendToken] = useSendToken()
  const [note] = useNote()

  const setEncodedParams = useCallback(
    (params, options) => {
      const encodedParams = {
        ...params,
        note: params.note ? encodeURIComponent(params.note) : undefined,
      }

      setParams(encodedParams, options)
    },
    [setParams]
  )

  return [
    {
      idType,
      recipient,
      amount,
      sendToken,
      note,
    },
    setEncodedParams,
  ] as const
}

export const useSendScreenParams = withRootParams(useSendScreenParamsBase)

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

const useProfileScreenParamsBase = () => {
  const { setParams } = useProfileParams()
  const [sendid] = useSendId()
  const [tag] = useTag()

  return [
    {
      sendid,
      tag,
    },
    setParams,
  ] as const
}

export const useProfileScreenParams = withRootParams(useProfileScreenParamsBase)

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

const useSwapScreenParamsBase = () => {
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

export const useSwapScreenParams = withRootParams(useSwapScreenParamsBase)

export type DepositScreenParams = {
  depositAmount?: string
}

const { useParam: useDepositParam, useParams: useDepositParams } =
  createParam<DepositScreenParams>()

const useDepositAmount = () => {
  const [depositAmount, setDepositAmount] = useDepositParam('depositAmount')

  return [depositAmount, setDepositAmount] as const
}

const useDepositScreenParamsBase = () => {
  const { setParams } = useDepositParams()
  const [depositAmount] = useDepositAmount()

  return [
    {
      depositAmount,
    },
    setParams,
  ] as const
}

export const useDepositScreenParams = withRootParams(useDepositScreenParamsBase)
