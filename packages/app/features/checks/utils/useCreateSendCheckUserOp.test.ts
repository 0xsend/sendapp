import { sendAccountAbi, sendCheckAddress, sendCheckAbi, tokenPaymasterAddress } from '@my/wagmi'
import { generateEphemeralKeypair } from 'app/features/checks/utils/checkUtils'
import type { CreateSendCheckUserOpProps } from 'app/features/checks/types'
import { getCreateSendCheckUserOp } from 'app/features/checks/utils/useCreateSendCheckUserOp'
import type { UserOperation } from 'permissionless'
import { type Hex, decodeFunctionData, erc20Abi, isAddress, maxUint256 } from 'viem'
import * as mockMyWagmi from 'app/__mocks__/@my/wagmi'

jest.mock('@my/wagmi', () => ({
  __esModule: true,
  ...jest.requireActual('@my/wagmi'),
  ...mockMyWagmi,
}))

describe('/send check userOps', () => {
  const ephemeralKeypair = generateEphemeralKeypair()
  let createSendCheckUserOpsProps: CreateSendCheckUserOpProps
  let createSendCheckUserOp: UserOperation<'v0.7'>

  beforeEach(() => {
    createSendCheckUserOpsProps = {
      senderAddress: '0xb0b0000000000000000000000000000000000000',
      // /send token address
      tokenAddress: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
      ephemeralKeypair: ephemeralKeypair,
      amount: 1n,
      nonce: 0n,
    }

    createSendCheckUserOp = getCreateSendCheckUserOp(createSendCheckUserOpsProps)
  })

  it('userOp properties are as expected', () => {
    expect(createSendCheckUserOp.sender).toEqual(createSendCheckUserOpsProps.senderAddress)
    expect(createSendCheckUserOp.nonce).toEqual(createSendCheckUserOpsProps.nonce)
    expect(createSendCheckUserOp.paymaster).toEqual(tokenPaymasterAddress[845337])
    expect(createSendCheckUserOp.paymasterData).toEqual('0x')
    expect(createSendCheckUserOp.paymasterAndData).toEqual('0x')
    expect(createSendCheckUserOp.signature).toEqual('0x')

    // TODO: assert on gas limits
  })

  it('callData is as expected', () => {
    const { functionName, args } = decodeFunctionData({
      abi: sendAccountAbi,
      data: createSendCheckUserOp.callData,
    })

    expect(functionName).toEqual('executeBatch')
    expect(args.length).toEqual(1)

    const batchTrns = args[0]
    expect(batchTrns.length).toEqual(2)

    // first trn should be an approval trn
    const approvalTrn = batchTrns[0]
    const approvalTrnData = decodeFunctionData({
      abi: erc20Abi,
      data: approvalTrn.data,
    })
    expect(approvalTrn.dest).toEqual('0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A')
    expect(approvalTrn.value).toEqual(0n)

    // should approve send check contract to spend token
    expect(approvalTrnData.functionName).toEqual('approve')
    expect(approvalTrnData.args[0]).toEqual(sendCheckAddress[845337])
    expect(approvalTrnData.args[1]).toEqual(maxUint256)

    // second trn should be /create check trn
    const createSendCheckTrn = batchTrns[1]
    const createSendCheckTrnData = decodeFunctionData({
      abi: sendCheckAbi,
      data: createSendCheckTrn.data,
    })
    expect(createSendCheckTrn.dest).toEqual(sendCheckAddress[845337])
    expect(createSendCheckTrn.value).toEqual(0n)

    // should contain send check creation payload
    expect(createSendCheckTrnData.functionName).toEqual('createCheck')
    expect(createSendCheckTrnData.args.length).toEqual(3)
    expect(createSendCheckTrnData.args[0]).toEqual(createSendCheckUserOpsProps.tokenAddress)
    expect(createSendCheckTrnData.args[1]).toEqual(
      createSendCheckUserOpsProps.ephemeralKeypair.ephemeralAddress
    )
    expect(createSendCheckTrnData.args[2]).toEqual(createSendCheckUserOpsProps.amount)
  })

  it('invalid sender address', () => {
    const invalidSenderAddress: Hex = '0x'
    createSendCheckUserOpsProps.senderAddress = invalidSenderAddress
    expect(isAddress(invalidSenderAddress)).toEqual(false)
    expect(() => getCreateSendCheckUserOp(createSendCheckUserOpsProps)).toThrow(
      'Invalid send account address'
    )
  })

  it('invalid nonce', () => {
    createSendCheckUserOpsProps.nonce = -1n
    expect(() => getCreateSendCheckUserOp(createSendCheckUserOpsProps)).toThrow('Invalid nonce')
  })

  it('invalid amount', () => {
    createSendCheckUserOpsProps.amount = -1n
    expect(() => getCreateSendCheckUserOp(createSendCheckUserOpsProps)).toThrow()
  })
})
