import { generateEphemeralKeypair } from 'app/features/checks/utils/checkUtils'
import { createSendCheck } from 'app/features/checks/utils/useCreateSendCheck'
import type { ClaimSendCheckUserOpProps } from 'app/features/checks/types'
import type { UserOperation } from 'permissionless'
import * as mockMyWagmi from 'app/__mocks__/@my/wagmi'
import { getClaimSendCheckUserOp } from 'app/features/checks/utils/getClaimSendCheckUserOp'
import { claimSendCheck } from 'app/features/checks/utils/useClaimSendCheck'

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

describe('claim /send check', () => {
  let userOp: UserOperation<'v0.7'>

  beforeEach(async () => {
    const props: ClaimSendCheckUserOpProps = {
      senderAddress: '0xb0b0000000000000000000000000000000000000',
      nonce: 0n,
      ephemeralKeypair: generateEphemeralKeypair(),
      signature: '0x',
    }

    userOp = getClaimSendCheckUserOp(props)
  })

  it('can create /send check', async () => {
    const receipt = await claimSendCheck(userOp)
    expect(receipt).not.toBeNull()
  })

  it('throws if /send check userOp is not provided', async () => {
    expect(createSendCheck()).rejects.toThrow()
  })
})
