import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { parseEther, parseUnits, type Address, type Hex } from 'viem'
import type { AccountConfig } from './config'

// Mock the Temporal workflow module
const mockCalculateTotalETHNeeded = jest.fn<() => Promise<bigint>>()
const mockCalculateTotalUSDCNeeded = jest.fn<() => Promise<bigint>>()
const mockCheckFundingWalletEthBalance = jest.fn<() => Promise<bigint>>()
const mockCheckUSDCBalance = jest.fn<() => Promise<bigint>>()
const mockCheckAndTopOffAccount =
  jest.fn<
    () => Promise<{
      address: Address
      name: string
      currentBalance: string
      topped: boolean
      txHash?: Hex
    }>
  >()
const mockLogTopOffSummary = jest.fn<() => Promise<void>>()
const mockWorkflowLog = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}

jest.mock('@temporalio/workflow', () => ({
  proxyActivities: jest.fn(() => ({
    calculateTotalETHNeeded: mockCalculateTotalETHNeeded,
    calculateTotalUSDCNeeded: mockCalculateTotalUSDCNeeded,
    checkFundingWalletEthBalance: mockCheckFundingWalletEthBalance,
    checkUSDCBalance: mockCheckUSDCBalance,
    checkAndTopOffAccount: mockCheckAndTopOffAccount,
    logTopOffSummary: mockLogTopOffSummary,
  })),
  log: mockWorkflowLog,
}))

// Mock config
jest.mock('./config', () => ({
  TOPOFF_ACCOUNTS: [
    {
      address: '0x1111111111111111111111111111111111111111',
      name: 'Account 1',
      type: 'eth_transfer',
      minThreshold: parseEther('0.5'),
      targetBalance: parseEther('2'),
    },
    {
      address: '0x2222222222222222222222222222222222222222',
      name: 'Account 2',
      type: 'paymaster_deposit',
      minThreshold: parseEther('0.1'),
      targetBalance: parseEther('1'),
    },
  ] as AccountConfig[],
}))

// Import after mocks
import { topOffAccounts } from './workflow'
import { TOPOFF_ACCOUNTS } from './config'

describe('Top-Off Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should exit early if no ETH or USDC is needed', async () => {
    mockCalculateTotalETHNeeded.mockResolvedValueOnce(0n)
    mockCalculateTotalUSDCNeeded.mockResolvedValueOnce(0n)

    await topOffAccounts()

    expect(mockCalculateTotalETHNeeded).toHaveBeenCalledWith(TOPOFF_ACCOUNTS)
    expect(mockCalculateTotalUSDCNeeded).toHaveBeenCalledWith(TOPOFF_ACCOUNTS)
    expect(mockCheckFundingWalletEthBalance).not.toHaveBeenCalled()
    expect(mockCheckUSDCBalance).not.toHaveBeenCalled()
    expect(mockCheckAndTopOffAccount).not.toHaveBeenCalled()
    expect(mockWorkflowLog.info).toHaveBeenCalledWith(
      'No top-offs needed, all accounts have sufficient balance'
    )
  })

  it('should check funding wallet ETH balance and warn if insufficient', async () => {
    const totalETHNeeded = parseEther('2')
    const totalUSDCNeeded = parseUnits('0', 6)
    const ethBalance = parseEther('1') // Only have 1 ETH, need 2

    mockCalculateTotalETHNeeded.mockResolvedValueOnce(totalETHNeeded)
    mockCalculateTotalUSDCNeeded.mockResolvedValueOnce(totalUSDCNeeded)
    mockCheckFundingWalletEthBalance.mockResolvedValueOnce(ethBalance)
    mockCheckAndTopOffAccount.mockResolvedValue({
      address: '0x1111111111111111111111111111111111111111',
      name: 'Account 1',
      currentBalance: '0.5',
      topped: false,
    })

    await topOffAccounts()

    expect(mockCalculateTotalETHNeeded).toHaveBeenCalledWith(TOPOFF_ACCOUNTS)
    expect(mockCalculateTotalUSDCNeeded).toHaveBeenCalledWith(TOPOFF_ACCOUNTS)
    expect(mockCheckFundingWalletEthBalance).toHaveBeenCalled()
    expect(mockWorkflowLog.warn).toHaveBeenCalledWith(
      expect.stringContaining('Insufficient ETH in funding wallet')
    )
    expect(mockCheckAndTopOffAccount).toHaveBeenCalledTimes(TOPOFF_ACCOUNTS.length)
  })

  it('should check funding wallet USDC balance and warn if insufficient', async () => {
    const totalETHNeeded = parseEther('0')
    const totalUSDCNeeded = parseUnits('100', 6)
    const usdcBalance = parseUnits('50', 6) // Only have 50 USDC, need 100

    mockCalculateTotalETHNeeded.mockResolvedValueOnce(totalETHNeeded)
    mockCalculateTotalUSDCNeeded.mockResolvedValueOnce(totalUSDCNeeded)
    mockCheckUSDCBalance.mockResolvedValueOnce(usdcBalance)
    mockCheckAndTopOffAccount.mockResolvedValue({
      address: '0x1111111111111111111111111111111111111111',
      name: 'Account 1',
      currentBalance: '0.5',
      topped: false,
    })

    await topOffAccounts()

    expect(mockCalculateTotalETHNeeded).toHaveBeenCalledWith(TOPOFF_ACCOUNTS)
    expect(mockCalculateTotalUSDCNeeded).toHaveBeenCalledWith(TOPOFF_ACCOUNTS)
    expect(mockCheckUSDCBalance).toHaveBeenCalled()
    expect(mockWorkflowLog.warn).toHaveBeenCalledWith(
      expect.stringContaining('Insufficient USDC in funding wallet')
    )
    expect(mockCheckAndTopOffAccount).toHaveBeenCalledTimes(TOPOFF_ACCOUNTS.length)
  })

  it('should perform all top-offs sequentially', async () => {
    const totalETHNeeded = parseEther('0') // No ETH needed
    const totalUSDCNeeded = parseUnits('100', 6) // But USDC needed
    const usdcBalance = parseUnits('1000', 6) // Sufficient USDC

    mockCalculateTotalETHNeeded.mockResolvedValueOnce(totalETHNeeded)
    mockCalculateTotalUSDCNeeded.mockResolvedValueOnce(totalUSDCNeeded)
    mockCheckUSDCBalance.mockResolvedValueOnce(usdcBalance)

    const mockResult = {
      address:
        TOPOFF_ACCOUNTS[0]?.address ?? ('0x0000000000000000000000000000000000000000' as Address),
      name: TOPOFF_ACCOUNTS[0]?.name ?? 'Default',
      currentBalance: '1',
      topped: false,
    }

    mockCheckAndTopOffAccount.mockResolvedValue(mockResult)

    await topOffAccounts()

    // Verify all accounts were processed
    expect(mockCheckAndTopOffAccount).toHaveBeenCalledTimes(TOPOFF_ACCOUNTS.length)

    // Verify each account config was passed
    for (const account of TOPOFF_ACCOUNTS) {
      expect(mockCheckAndTopOffAccount).toHaveBeenCalledWith(account)
    }

    expect(mockLogTopOffSummary).toHaveBeenCalled()
  })

  it('should log comprehensive workflow progress', async () => {
    const totalETHNeeded = parseEther('0.5')
    const totalUSDCNeeded = parseUnits('20', 6)
    const ethBalance = parseEther('5')
    const usdcBalance = parseUnits('1000', 6)

    mockCalculateTotalETHNeeded.mockResolvedValueOnce(totalETHNeeded)
    mockCalculateTotalUSDCNeeded.mockResolvedValueOnce(totalUSDCNeeded)
    mockCheckFundingWalletEthBalance.mockResolvedValueOnce(ethBalance)
    mockCheckUSDCBalance.mockResolvedValueOnce(usdcBalance)
    mockCheckAndTopOffAccount.mockResolvedValue({
      address: '0x1111111111111111111111111111111111111111',
      name: 'Account 1',
      currentBalance: '1',
      topped: true,
      txHash: '0xtopoff',
    })

    await topOffAccounts()

    expect(mockWorkflowLog.info).toHaveBeenCalledWith('Starting top-off workflow')
    expect(mockWorkflowLog.info).toHaveBeenCalledWith(expect.stringContaining('Total ETH needed'))
    expect(mockWorkflowLog.info).toHaveBeenCalledWith(expect.stringContaining('Total USDC needed'))
    expect(mockWorkflowLog.info).toHaveBeenCalledWith('Starting account top-offs')
    expect(mockWorkflowLog.info).toHaveBeenCalledWith('Top-off workflow completed')
  })
})
