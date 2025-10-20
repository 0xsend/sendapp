import { ApplicationFailure } from '@temporalio/common'
import { baseMainnetClient } from '@my/wagmi'
import {
  sendVerifyingPaymasterAbi,
  sendVerifyingPaymasterAddress,
  tokenPaymasterAbi,
  tokenPaymasterAddress,
  usdcAbi,
  usdcAddress,
} from '@my/wagmi/generated'
import debug from 'debug'
import {
  createWalletClient,
  http,
  type Address,
  formatEther,
  parseEther,
  type Hex,
  formatUnits,
  parseUnits,
  erc20Abi,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseMainnet } from '@my/wagmi/chains'
import { BUNDLER_ADDRESS, type AccountConfig } from './config'

const log = debug('workflows:topoff')

/**
 * Get the funding wallet from environment variable
 */
function getFundingWallet() {
  const privateKey = process.env.FUNDING_TOPOFF_PRIVATE_KEY
  if (!privateKey) {
    throw ApplicationFailure.nonRetryable(
      'FUNDING_TOPOFF_PRIVATE_KEY environment variable is required',
      'ConfigurationError'
    )
  }
  return privateKeyToAccount(privateKey as Hex)
}

/**
 * Check ETH balance of an address
 */
export async function checkEthBalance(address: Address): Promise<bigint> {
  const balance = await baseMainnetClient.getBalance({ address })
  log(`ETH balance for ${address}: ${formatEther(balance)} ETH`)
  return balance
}

/**
 * Check paymaster deposit balance
 */
export async function checkPaymasterDeposit(address: Address): Promise<bigint> {
  const chainId = baseMainnetClient.chain.id
  let balance: bigint

  if (address.toLowerCase() === tokenPaymasterAddress[chainId].toLowerCase()) {
    balance = await baseMainnetClient.readContract({
      address: tokenPaymasterAddress[chainId],
      abi: tokenPaymasterAbi,
      functionName: 'getDeposit',
    })
  } else if (address.toLowerCase() === sendVerifyingPaymasterAddress[chainId].toLowerCase()) {
    balance = await baseMainnetClient.readContract({
      address: sendVerifyingPaymasterAddress[chainId],
      abi: sendVerifyingPaymasterAbi,
      functionName: 'getDeposit',
    })
  } else {
    throw ApplicationFailure.nonRetryable(
      `Unknown paymaster address: ${address}`,
      'ConfigurationError'
    )
  }

  log(`Paymaster deposit for ${address}: ${formatEther(balance)} ETH`)
  return balance
}

/**
 * Send ETH to an address
 */
export async function sendEth(to: Address, amount: bigint): Promise<Hex> {
  const account = getFundingWallet()

  const walletClient = createWalletClient({
    account,
    chain: baseMainnet,
    transport: http(baseMainnet.rpcUrls.default.http[0]),
  })

  log(`Sending ${formatEther(amount)} ETH to ${to}`)

  const hash = await walletClient.sendTransaction({
    to,
    value: amount,
  })

  log(`Transaction sent: ${hash}`)

  // Wait for transaction confirmation
  const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash })
  log(`Transaction confirmed in block ${receipt.blockNumber}`)

  return hash
}

/**
 * Send 0 ETH transaction to bundler (for bundler restart)
 */
export async function sendBundlerSelfTransaction(): Promise<Hex> {
  // Send 0 ETH from funding wallet to bundler to trigger restart
  const account = getFundingWallet()

  const walletClient = createWalletClient({
    account,
    chain: baseMainnet,
    transport: http(baseMainnet.rpcUrls.default.http[0]),
  })

  log(`Sending 0 ETH to bundler (${BUNDLER_ADDRESS}) for restart`)

  const hash = await walletClient.sendTransaction({
    to: BUNDLER_ADDRESS,
    value: 0n,
  })

  log(`Bundler restart transaction sent: ${hash}`)

  const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash })
  log(`Bundler restart transaction confirmed in block ${receipt.blockNumber}`)

  return hash
}

/**
 * Deposit ETH to a paymaster contract
 */
export async function depositToPaymaster(address: Address, amount: bigint): Promise<Hex> {
  const account = getFundingWallet()
  const chainId = baseMainnetClient.chain.id

  const walletClient = createWalletClient({
    account,
    chain: baseMainnet,
    transport: http(baseMainnet.rpcUrls.default.http[0]),
  })

  log(`Depositing ${formatEther(amount)} ETH to paymaster ${address}`)

  let hash: Hex

  if (address.toLowerCase() === tokenPaymasterAddress[chainId].toLowerCase()) {
    hash = await walletClient.writeContract({
      address: tokenPaymasterAddress[chainId],
      abi: tokenPaymasterAbi,
      functionName: 'deposit',
      value: amount,
    })
  } else if (address.toLowerCase() === sendVerifyingPaymasterAddress[chainId].toLowerCase()) {
    hash = await walletClient.writeContract({
      address: sendVerifyingPaymasterAddress[chainId],
      abi: sendVerifyingPaymasterAbi,
      functionName: 'deposit',
      value: amount,
    })
  } else {
    throw ApplicationFailure.nonRetryable(
      `Unknown paymaster address: ${address}`,
      'ConfigurationError'
    )
  }

  log(`Paymaster deposit transaction sent: ${hash}`)

  const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash })
  log(`Paymaster deposit confirmed in block ${receipt.blockNumber}`)

  return hash
}

/**
 * Check and top off a single account
 */
export async function checkAndTopOffAccount(config: AccountConfig): Promise<{
  address: Address
  name: string
  currentBalance: string
  topped: boolean
  txHash?: Hex
}> {
  log(`Checking account: ${config.name} (${config.address})`)

  let currentBalance: bigint
  let balanceFormatted: string

  // Check balance based on account type
  if (config.type === 'paymaster_deposit') {
    currentBalance = await checkPaymasterDeposit(config.address)
    balanceFormatted = formatEther(currentBalance)
  } else if (config.type === 'usdc_transfer') {
    currentBalance = await checkUsdcBalanceOf(config.address)
    balanceFormatted = formatUnits(currentBalance, 6)
  } else {
    currentBalance = await checkEthBalance(config.address)
    balanceFormatted = formatEther(currentBalance)
  }

  const result = {
    address: config.address,
    name: config.name,
    currentBalance: balanceFormatted,
    topped: false,
    txHash: undefined as Hex | undefined,
  }

  // Check if balance is below threshold
  if (currentBalance >= config.minThreshold) {
    const unit = config.type === 'usdc_transfer' ? 'USDC' : 'ETH'
    log(`✓ ${config.name} balance is sufficient: ${balanceFormatted} ${unit}`)
    return result
  }

  // Calculate amount to top off
  const topOffAmount = config.targetBalance - currentBalance
  const unit = config.type === 'usdc_transfer' ? 'USDC' : 'ETH'

  const currentFormatted =
    config.type === 'usdc_transfer' ? formatUnits(currentBalance, 6) : formatEther(currentBalance)
  const targetFormatted =
    config.type === 'usdc_transfer'
      ? formatUnits(config.targetBalance, 6)
      : formatEther(config.targetBalance)
  const amountFormatted =
    config.type === 'usdc_transfer' ? formatUnits(topOffAmount, 6) : formatEther(topOffAmount)

  log(
    `🔄 ${config.name} needs top-off: current=${currentFormatted} ${unit}, target=${targetFormatted} ${unit}, amount=${amountFormatted} ${unit}`
  )

  // Perform top-off based on account type
  let txHash: Hex

  switch (config.type) {
    case 'eth_transfer':
      txHash = await sendEth(config.address, topOffAmount)

      // If this is the bundler, also send a self-transaction to trigger restart
      if (config.address.toLowerCase() === BUNDLER_ADDRESS.toLowerCase()) {
        log('Sending bundler self-transaction to trigger restart')
        await sendBundlerSelfTransaction()
      }
      break

    case 'paymaster_deposit':
      txHash = await depositToPaymaster(config.address, topOffAmount)
      break

    case 'usdc_transfer':
      txHash = await sendUsdc(config.address, topOffAmount)
      break

    default:
      throw ApplicationFailure.nonRetryable(
        `Unknown account type: ${config.type}`,
        'ConfigurationError'
      )
  }

  result.topped = true
  result.txHash = txHash

  log(`✓ ${config.name} topped off successfully: ${txHash}`)

  return result
}

/**
 * Check ETH balance of funding wallet
 */
export async function checkFundingWalletEthBalance(): Promise<bigint> {
  const account = getFundingWallet()
  const balance = await baseMainnetClient.getBalance({ address: account.address })
  log(`ETH balance for funding wallet: ${formatEther(balance)} ETH`)
  return balance
}

/**
 * Check USDC balance of funding wallet
 */
export async function checkUSDCBalance(): Promise<bigint> {
  const account = getFundingWallet()
  const chainId = baseMainnetClient.chain.id
  const balance = await baseMainnetClient.readContract({
    address: usdcAddress[chainId],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })
  log(`USDC balance for funding wallet: ${formatUnits(balance, 6)} USDC`)
  return balance
}

/**
 * Check USDC balance of a specific address
 */
export async function checkUsdcBalanceOf(address: Address): Promise<bigint> {
  const chainId = baseMainnetClient.chain.id
  const balance = await baseMainnetClient.readContract({
    address: usdcAddress[chainId],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  })
  log(`USDC balance for ${address}: ${formatUnits(balance, 6)} USDC`)
  return balance
}

/**
 * Send USDC to an address
 */
export async function sendUsdc(to: Address, amount: bigint): Promise<Hex> {
  const account = getFundingWallet()
  const chainId = baseMainnetClient.chain.id

  const walletClient = createWalletClient({
    account,
    chain: baseMainnet,
    transport: http(baseMainnet.rpcUrls.default.http[0]),
  })

  log(`Sending ${formatUnits(amount, 6)} USDC to ${to}`)

  const hash = await walletClient.writeContract({
    address: usdcAddress[chainId],
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, amount],
  })

  log(`USDC transfer transaction sent: ${hash}`)

  // Wait for transaction confirmation
  const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash })
  log(`USDC transfer confirmed in block ${receipt.blockNumber}`)

  return hash
}

/**
 * Calculate total ETH needed for all top-offs
 */
export async function calculateTotalETHNeeded(configs: AccountConfig[]): Promise<bigint> {
  let totalNeeded = 0n

  for (const config of configs) {
    // Skip USDC transfer accounts (they don't need ETH)
    if (config.type === 'usdc_transfer') {
      continue
    }

    // Check current balance
    let currentBalance: bigint
    if (config.type === 'paymaster_deposit') {
      currentBalance = await checkPaymasterDeposit(config.address)
    } else {
      currentBalance = await checkEthBalance(config.address)
    }

    // If below threshold, add the needed amount
    if (currentBalance < config.minThreshold) {
      const needed = config.targetBalance - currentBalance
      totalNeeded += needed
    }
  }

  log(`Total ETH needed: ${formatEther(totalNeeded)} ETH`)

  return totalNeeded
}

/**
 * Calculate total USDC needed for all USDC top-offs
 */
export async function calculateTotalUSDCNeeded(configs: AccountConfig[]): Promise<bigint> {
  let totalNeeded = 0n

  for (const config of configs) {
    // Only process USDC transfer accounts
    if (config.type !== 'usdc_transfer') {
      continue
    }

    // Check current USDC balance
    const currentBalance = await checkUsdcBalanceOf(config.address)

    // If below threshold, add the needed amount
    if (currentBalance < config.minThreshold) {
      const needed = config.targetBalance - currentBalance
      totalNeeded += needed
    }
  }

  log(`Total USDC needed: ${formatUnits(totalNeeded, 6)} USDC`)

  return totalNeeded
}

/**
 * Log summary of top-off results
 */
export async function logTopOffSummary(
  results: Array<{
    address: Address
    name: string
    currentBalance: string
    topped: boolean
    txHash?: Hex
  }>
): Promise<void> {
  log('=== Top-Off Summary ===')
  for (const result of results) {
    if (result.topped) {
      log(`✓ ${result.name}: Topped off (${result.txHash})`)
    } else {
      log(`- ${result.name}: No action needed (${result.currentBalance} ETH)`)
    }
  }
  log('======================')
}
