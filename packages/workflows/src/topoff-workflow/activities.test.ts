import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { Address, Hex } from 'viem'
import { parseEther, parseUnits } from 'viem'
import { createTopoffActivities } from './activities'
import type { AccountConfig } from './config'

// Mock dependencies
jest.mock('@my/wagmi', () => ({
  baseMainnetClient: {
    getBalance: jest.fn(),
    readContract: jest.fn(),
    waitForTransactionReceipt: jest.fn(),
    chain: { id: 8453 },
  },
}))

jest.mock('@my/wagmi/generated', () => ({
  sendVerifyingPaymasterAbi: [],
  sendVerifyingPaymasterAddress: { 8453: '0x8A77aE0c07047c5b307B2319A8F4Bd9d3604DdD8' },
  tokenPaymasterAbi: [],
  tokenPaymasterAddress: { 8453: '0x592e1224D203Be4214B15e205F6081FbbaCFcD2D' },
  usdcAbi: [],
  usdcAddress: { 8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
}))

jest.mock('viem', () => {
  const actual = jest.requireActual('viem') as object
  return {
    ...actual,
    createWalletClient: jest.fn<() => { sendTransaction: jest.Mock; writeContract: jest.Mock }>(),
  }
})

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address,
  })),
}))

// Mock global fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

// Import mocked modules
import { baseMainnetClient } from '@my/wagmi'
import {
  tokenPaymasterAddress,
  sendVerifyingPaymasterAddress,
  usdcAddress,
} from '@my/wagmi/generated'
import { createWalletClient } from 'viem'

const mockedBaseMainnetClient = baseMainnetClient as jest.Mocked<typeof baseMainnetClient>
const mockedCreateWalletClient = createWalletClient as jest.MockedFunction<
  typeof createWalletClient
>
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Top-Off Workflow Activities', () => {
  const mockFundingPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

  let activities: ReturnType<typeof createTopoffActivities>

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.FUNDING_TOPOFF_PRIVATE_KEY = mockFundingPrivateKey
    process.env.NEXT_PUBLIC_KYBER_SWAP_BASE_URL = 'https://aggregator-api.kyberswap.com'
    process.env.NEXT_PUBLIC_KYBER_CLIENT_ID = 'test-client'

    activities = createTopoffActivities({
      FUNDING_TOPOFF_PRIVATE_KEY: mockFundingPrivateKey,
    })
  })

  describe('checkEthBalance', () => {
    it('should return ETH balance for an address', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890' as Address
      const mockBalance = parseEther('1.5')

      mockedBaseMainnetClient.getBalance.mockResolvedValueOnce(mockBalance)

      const balance = await activities.checkEthBalance(mockAddress)

      expect(balance).toBe(mockBalance)
      expect(mockedBaseMainnetClient.getBalance).toHaveBeenCalledWith({ address: mockAddress })
    })
  })

  describe('checkPaymasterDeposit', () => {
    it('should return deposit balance for TokenPaymaster', async () => {
      const mockDeposit = parseEther('0.5')

      mockedBaseMainnetClient.readContract.mockResolvedValueOnce(mockDeposit)

      const balance = await activities.checkPaymasterDeposit(tokenPaymasterAddress[8453])

      expect(balance).toBe(mockDeposit)
      expect(mockedBaseMainnetClient.readContract).toHaveBeenCalledWith({
        address: tokenPaymasterAddress[8453],
        abi: expect.any(Array),
        functionName: 'getDeposit',
      })
    })

    it('should return deposit balance for SendVerifyingPaymaster', async () => {
      const mockDeposit = parseEther('0.3')

      mockedBaseMainnetClient.readContract.mockResolvedValueOnce(mockDeposit)

      const balance = await activities.checkPaymasterDeposit(sendVerifyingPaymasterAddress[8453])

      expect(balance).toBe(mockDeposit)
      expect(mockedBaseMainnetClient.readContract).toHaveBeenCalledWith({
        address: sendVerifyingPaymasterAddress[8453],
        abi: expect.any(Array),
        functionName: 'getDeposit',
      })
    })

    it('should throw error for unknown paymaster address', async () => {
      const unknownAddress = '0x0000000000000000000000000000000000000000' as Address

      await expect(activities.checkPaymasterDeposit(unknownAddress)).rejects.toThrow(
        'Unknown paymaster address'
      )
    })
  })

  describe('checkUSDCBalance', () => {
    it('should return USDC balance for funding wallet', async () => {
      const mockBalance = parseUnits('1000', 6) // 1000 USDC

      mockedBaseMainnetClient.readContract.mockResolvedValueOnce(mockBalance)

      const balance = await activities.checkUSDCBalance()

      expect(balance).toBe(mockBalance)
      expect(mockedBaseMainnetClient.readContract).toHaveBeenCalledWith({
        address: usdcAddress[8453],
        abi: expect.any(Array),
        functionName: 'balanceOf',
        args: [expect.any(String)],
      })
    })
  })

  describe('checkUsdcBalanceOf', () => {
    it('should return USDC balance for a specific address', async () => {
      const testAddress = '0xC4b42349E919e6c66B57d4832B20029b3D0f79Bd' as Address
      const mockBalance = parseUnits('50', 6) // 50 USDC

      mockedBaseMainnetClient.readContract.mockResolvedValueOnce(mockBalance)

      const balance = await activities.checkUsdcBalanceOf(testAddress)

      expect(balance).toBe(mockBalance)
      expect(mockedBaseMainnetClient.readContract).toHaveBeenCalledWith({
        address: usdcAddress[8453],
        abi: expect.any(Array),
        functionName: 'balanceOf',
        args: [testAddress],
      })
    })
  })

  describe('sendUsdc', () => {
    it('should send USDC to an address', async () => {
      const toAddress = '0xC4b42349E919e6c66B57d4832B20029b3D0f79Bd' as Address
      const amount = parseUnits('80', 6) // 80 USDC
      const mockTxHash = '0xusdctxhash' as Hex

      const mockWalletClient = {
        writeContract: jest.fn<() => Promise<Hex>>().mockResolvedValue(mockTxHash),
      }

      mockedCreateWalletClient.mockReturnValueOnce(mockWalletClient as never)
      mockedBaseMainnetClient.waitForTransactionReceipt.mockResolvedValueOnce({
        blockNumber: 123n,
      } as never)

      const txHash = await activities.sendUsdc(toAddress, amount)

      expect(txHash).toBe(mockTxHash)
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith({
        address: usdcAddress[8453],
        abi: expect.any(Array),
        functionName: 'transfer',
        args: [toAddress, amount],
      })
    })
  })

  describe('calculateTotalETHNeeded', () => {
    it('should calculate total ETH needed', async () => {
      const mockConfigs: AccountConfig[] = [
        {
          address: '0x1111111111111111111111111111111111111111' as Address,
          name: 'Account 1',
          type: 'eth_transfer',
          minThreshold: parseEther('0.5'),
          targetBalance: parseEther('2'),
        },
        {
          address: '0x592e1224D203Be4214B15e205F6081FbbaCFcD2D' as Address,
          name: 'Account 2',
          type: 'paymaster_deposit',
          minThreshold: parseEther('0.1'),
          targetBalance: parseEther('1'),
        },
        {
          address: '0xC4b42349E919e6c66B57d4832B20029b3D0f79Bd' as Address,
          name: 'Preburn USDC',
          type: 'usdc_transfer',
          minThreshold: parseUnits('20', 6),
          targetBalance: parseUnits('100', 6),
        },
      ]

      // Mock balances below threshold
      mockedBaseMainnetClient.getBalance.mockResolvedValueOnce(parseEther('0.3')) // Account 1
      mockedBaseMainnetClient.readContract.mockResolvedValueOnce(parseEther('0.05')) // Account 2

      const totalNeeded = await activities.calculateTotalETHNeeded(mockConfigs)

      // Account 1 needs: 2 - 0.3 = 1.7 ETH
      // Account 2 needs: 1 - 0.05 = 0.95 ETH
      // Total: 2.65 ETH (no buffer)
      const expectedTotal = parseEther('2.65')

      expect(totalNeeded).toBe(expectedTotal)
    })

    it('should return 0 if all accounts are above threshold', async () => {
      const mockConfigs: AccountConfig[] = [
        {
          address: '0x1111111111111111111111111111111111111111' as Address,
          name: 'Account 1',
          type: 'eth_transfer',
          minThreshold: parseEther('0.5'),
          targetBalance: parseEther('2'),
        },
      ]

      // Mock balance above threshold
      mockedBaseMainnetClient.getBalance.mockResolvedValueOnce(parseEther('1'))

      const totalNeeded = await activities.calculateTotalETHNeeded(mockConfigs)

      expect(totalNeeded).toBe(0n)
    })
  })

  describe('calculateTotalUSDCNeeded', () => {
    it('should calculate total USDC needed for USDC accounts', async () => {
      const mockConfigs: AccountConfig[] = [
        {
          address: '0x1111111111111111111111111111111111111111' as Address,
          name: 'ETH Account',
          type: 'eth_transfer',
          minThreshold: parseEther('0.5'),
          targetBalance: parseEther('2'),
        },
        {
          address: '0xC4b42349E919e6c66B57d4832B20029b3D0f79Bd' as Address,
          name: 'Preburn',
          type: 'usdc_transfer',
          minThreshold: parseUnits('20', 6), // 20 USDC
          targetBalance: parseUnits('100', 6), // 100 USDC
        },
      ]

      // Mock USDC balance below threshold (15 USDC)
      mockedBaseMainnetClient.readContract.mockResolvedValueOnce(parseUnits('15', 6))

      const totalNeeded = await activities.calculateTotalUSDCNeeded(mockConfigs)

      // Preburn needs: 100 - 15 = 85 USDC
      const expectedTotal = parseUnits('85', 6)

      expect(totalNeeded).toBe(expectedTotal)
    })

    it('should return 0 if all USDC accounts are above threshold', async () => {
      const mockConfigs: AccountConfig[] = [
        {
          address: '0xC4b42349E919e6c66B57d4832B20029b3D0f79Bd' as Address,
          name: 'Preburn',
          type: 'usdc_transfer',
          minThreshold: parseUnits('20', 6),
          targetBalance: parseUnits('100', 6),
        },
      ]

      // Mock balance above threshold (50 USDC)
      mockedBaseMainnetClient.readContract.mockResolvedValueOnce(parseUnits('50', 6))

      const totalNeeded = await activities.calculateTotalUSDCNeeded(mockConfigs)

      expect(totalNeeded).toBe(0n)
    })

    it('should skip non-USDC accounts', async () => {
      const mockConfigs: AccountConfig[] = [
        {
          address: '0x1111111111111111111111111111111111111111' as Address,
          name: 'ETH Account',
          type: 'eth_transfer',
          minThreshold: parseEther('0.5'),
          targetBalance: parseEther('2'),
        },
      ]

      const totalNeeded = await activities.calculateTotalUSDCNeeded(mockConfigs)

      expect(totalNeeded).toBe(0n)
      expect(mockedBaseMainnetClient.readContract).not.toHaveBeenCalled()
    })
  })

  describe('checkAndTopOffAccount', () => {
    it('should not top off if balance is sufficient', async () => {
      const mockConfig: AccountConfig = {
        address: '0x1111111111111111111111111111111111111111' as Address,
        name: 'Test Account',
        type: 'eth_transfer',
        minThreshold: parseEther('0.5'),
        targetBalance: parseEther('2'),
      }

      mockedBaseMainnetClient.getBalance.mockResolvedValueOnce(parseEther('1'))

      const result = await activities.checkAndTopOffAccount(mockConfig)

      expect(result.topped).toBe(false)
      expect(result.txHash).toBeUndefined()
    })

    it('should top off ETH transfer account', async () => {
      const mockConfig: AccountConfig = {
        address: '0x1111111111111111111111111111111111111111' as Address,
        name: 'Test Account',
        type: 'eth_transfer',
        minThreshold: parseEther('0.5'),
        targetBalance: parseEther('2'),
      }

      const mockWalletClient = {
        sendTransaction: jest.fn<() => Promise<Hex>>().mockResolvedValue('0xtxhash' as Hex),
      }

      mockedCreateWalletClient.mockReturnValue(mockWalletClient as never)
      mockedBaseMainnetClient.getBalance.mockResolvedValueOnce(parseEther('0.3'))
      mockedBaseMainnetClient.waitForTransactionReceipt.mockResolvedValueOnce({
        blockNumber: 123n,
      } as never)

      const result = await activities.checkAndTopOffAccount(mockConfig)

      expect(result.topped).toBe(true)
      expect(result.txHash).toBe('0xtxhash')
      expect(mockWalletClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockConfig.address,
          value: parseEther('1.7'), // 2 - 0.3
        })
      )
    })

    it('should top off USDC transfer account', async () => {
      const mockConfig: AccountConfig = {
        address: '0xC4b42349E919e6c66B57d4832B20029b3D0f79Bd' as Address,
        name: 'Preburn',
        type: 'usdc_transfer',
        minThreshold: parseUnits('20', 6), // 20 USDC
        targetBalance: parseUnits('100', 6), // 100 USDC
      }

      const mockWalletClient = {
        writeContract: jest.fn<() => Promise<Hex>>().mockResolvedValue('0xusdctx' as Hex),
      }

      mockedCreateWalletClient.mockReturnValue(mockWalletClient as never)
      mockedBaseMainnetClient.readContract.mockResolvedValueOnce(parseUnits('15', 6)) // 15 USDC
      mockedBaseMainnetClient.waitForTransactionReceipt.mockResolvedValueOnce({
        blockNumber: 123n,
      } as never)

      const result = await activities.checkAndTopOffAccount(mockConfig)

      expect(result.topped).toBe(true)
      expect(result.txHash).toBe('0xusdctx')
      expect(result.currentBalance).toBe('15')
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith({
        address: usdcAddress[8453],
        abi: expect.any(Array),
        functionName: 'transfer',
        args: [mockConfig.address, parseUnits('85', 6)], // 100 - 15
      })
    })
  })
})
