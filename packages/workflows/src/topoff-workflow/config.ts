import { parseEther, parseUnits, type Address } from 'viem'

export interface AccountConfig {
  address: Address
  name: string
  type: 'eth_transfer' | 'paymaster_deposit' | 'usdc_transfer'
  minThreshold: bigint
  targetBalance: bigint
}

/**
 * Bundler address for self-transaction (restart)
 */
export const BUNDLER_ADDRESS: Address = '0x9d1478044F781Ca722ff257e70D05e4Ad673f443'

/**
 * Configuration for all accounts that need automated top-offs
 * Runs every 15 minutes to check and top off balances
 */
export const TOPOFF_ACCOUNTS: AccountConfig[] = [
  {
    address: BUNDLER_ADDRESS,
    name: 'Bundler',
    type: 'eth_transfer', // Bundler is just an EOA so that's why its an eth_transfer
    minThreshold: parseEther('0.10'),
    targetBalance: parseEther('0.25'),
  },
  {
    address: '0x592e1224D203Be4214B15e205F6081FbbaCFcD2D',
    name: 'Transaction Paymaster',
    type: 'paymaster_deposit',
    minThreshold: parseEther('0.10'),
    targetBalance: parseEther('0.25'),
  },
  {
    address: '0x8A77aE0c07047c5b307B2319A8F4Bd9d3604DdD8',
    name: 'Sponsored Paymaster',
    type: 'paymaster_deposit',
    minThreshold: parseEther('0.10'),
    targetBalance: parseEther('0.25'),
  },
  {
    address: '0xC4b42349E919e6c66B57d4832B20029b3D0f79Bd',
    name: 'Preburn',
    type: 'usdc_transfer',
    minThreshold: parseUnits('20', 6), // 20 USDC
    targetBalance: parseUnits('100', 6), // 100 USDC
  },
]
/**
 * Schedule interval (cron expression for every 15 minutes)
 */
export const TOPOFF_SCHEDULE_INTERVAL = '*/15 * * * *'

/**
 * Workflow task queue
 */
export const TOPOFF_TASK_QUEUE = 'topoff-workflow'

/**
 * USDC token address on Base
 */
export const USDC_ADDRESS: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
