import {
  baseMainnetClient,
  sendAccountAbi,
  sendCheckAbi,
  sendCheckAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import type { ClaimSendCheckUserOpProps } from 'app/features/checks/types'
import { generateEphemeralKeypair } from 'app/features/checks/utils/checkUtils'
import { getClaimSendCheckUserOp } from 'app/features/checks/utils/getClaimSendCheckUserOp'
import type { UserOperation } from 'permissionless'
import { decodeFunctionData } from 'viem'
import * as mockMyWagmi from 'app/__mocks__/@my/wagmi'

jest.mock('@my/wagmi', () => ({
  __esModule: true,
  ...jest.requireActual('@my/wagmi'),
  ...mockMyWagmi,
}))

describe('claim /send check userOp', () => {
  let userOpProps: ClaimSendCheckUserOpProps
  let userOp: UserOperation<'v0.7'>

  beforeEach(() => {
    userOpProps = {
      senderAddress: '0xb0b0000000000000000000000000000000000000',
      nonce: 0n,
      ephemeralKeypair: generateEphemeralKeypair(),
      signature: '0x',
    }

    userOp = getClaimSendCheckUserOp(userOpProps)
  })

  it('userOp properties are as expected', () => {
    expect(userOp.sender).toEqual(userOpProps.senderAddress)
    expect(userOp.nonce).toEqual(userOpProps.nonce)
    expect(userOp.paymaster).toEqual(tokenPaymasterAddress[baseMainnetClient.chain.id])

    // TODO: assert on paymaster sponsorship args once paymaster sponsorship is implemented
    expect(userOp.paymasterData).toEqual('0x')
    expect(userOp.signature).toEqual('0x')
  })

  it('callData is as expected', () => {
    const { functionName, args } = decodeFunctionData({
      abi: sendAccountAbi,
      data: userOp.callData,
    })

    expect(functionName).toEqual('executeBatch')
    expect(args.length).toEqual(1)

    const batchTrns = args[0]
    expect(batchTrns.length).toEqual(1)

    // claimCheck trn
    const claimCheckTrn = batchTrns[0]
    const claimCheckTrnData = decodeFunctionData({
      abi: sendCheckAbi,
      data: claimCheckTrn.data,
    })
    expect(claimCheckTrn.dest).toEqual(sendCheckAddress[baseMainnetClient.chain.id])
    expect(claimCheckTrn.value).toEqual(0n)

    // claimCheck trn data
    expect(claimCheckTrnData.functionName).toEqual('claimCheck')
    expect(claimCheckTrnData.args.length).toEqual(2)
    expect(claimCheckTrnData.args[0]).toEqual(userOpProps.ephemeralKeypair.ephemeralAddress)
    expect(claimCheckTrnData.args[1]).toEqual(userOpProps.signature)
  })

  describe('cannot create userOp with invalid properties', () => {
    it('invalid senderAddress', () => {
      userOpProps.senderAddress = undefined
      expect(() => getClaimSendCheckUserOp(userOpProps)).toThrow('Invalid senderAddress')
    })

    it('invalid nonce', () => {
      userOpProps.nonce = -1n
      expect(() => getClaimSendCheckUserOp(userOpProps)).toThrow('Invalid nonce')
    })

    it('invalid signature', () => {
      userOpProps.signature = undefined
      expect(() => getClaimSendCheckUserOp(userOpProps)).toThrow('Invalid signature')
    })

    it('invalid ephemeralPrivateKey', () => {
      userOpProps.ephemeralKeypair.ephemeralPrivateKey = undefined
      expect(() => getClaimSendCheckUserOp(userOpProps)).toThrow('Invalid ephemeralPrivateKey')
    })

    it('invalid ephemeralAddress', () => {
      userOpProps.ephemeralKeypair.ephemeralAddress = '0x'
      expect(() => getClaimSendCheckUserOp(userOpProps)).toThrow('Invalid ephemeralAddress')
    })
  })
})
