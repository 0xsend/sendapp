import { generateEphemeralKeypair } from 'app/features/checks/utils/checkUtils'
import { createSendCheck } from 'app/features/checks/utils/useCreateSendCheck'
import { getCreateSendCheckUserOp } from 'app/features/checks/utils/useCreateSendCheckUserOp'
import type { CreateSendCheckUserOpProps } from 'app/features/checks/types'
import type { UserOperation } from 'permissionless'
import * as mockMyWagmi from 'app/__mocks__/@my/wagmi'

const userOpReceiptStub = {
  receipt: {
    transactionHash: '0x',
  },
}

jest.mock('app/utils/useUserOpTransferMutation', () => ({
  __esModule: true,
  ...jest.requireActual('app/utils/useUserOpTransferMutation'),
  sendUserOpTransfer: jest.fn().mockReturnValue(userOpReceiptStub),
}))

jest.mock('app/utils/userop.ts', () => ({
  signChallenge: jest.fn(),
  signUserOp: jest.fn(),
}))

jest.mock('@my/wagmi', () => ({
  __esModule: true,
  ...jest.requireActual('@my/wagmi'),
  ...mockMyWagmi,
}))

beforeEach(() => {
  window.location = {
    ...window.location,
    hostname: '127.0.0.1',
  }
})

describe('/send check creation', () => {
  let createSendCheckUserOp: UserOperation<'v0.7'>

  beforeEach(() => {
    const props: CreateSendCheckUserOpProps = {
      senderAddress: '0xb0b0000000000000000000000000000000000000',
      nonce: 0n,
      // /send token address
      tokenAddress: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
      ephemeralKeypair: generateEphemeralKeypair(),
      amount: 1n,
    }

    createSendCheckUserOp = getCreateSendCheckUserOp(props)
  })

  it('can create /send check', async () => {
    const receipt = await createSendCheck(createSendCheckUserOp)
    expect(receipt).not.toBeNull()
  })

  it('throws if /send check userOp is not provided', async () => {
    expect(createSendCheck()).rejects.toThrow()
  })
})
