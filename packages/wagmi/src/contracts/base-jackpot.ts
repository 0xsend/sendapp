import type { Abi, Address } from 'viem'
import { useReadContract } from 'wagmi'

/**
 * ABI for the BaseJackpot contract.
 * Provided externally.
 */
export const baseJackpotAbi = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  {
    inputs: [{ internalType: 'address', name: 'target', type: 'address' }],
    name: 'AddressEmptyCode',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'implementation', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
    type: 'error',
  },
  { inputs: [], name: 'ERC1967NonPayable', type: 'error' },
  { inputs: [], name: 'FailedCall', type: 'error' },
  { inputs: [], name: 'InvalidInitialization', type: 'error' },
  { inputs: [], name: 'NotInitializing', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  { inputs: [], name: 'UUPSUnauthorizedCallContext', type: 'error' },
  {
    inputs: [{ internalType: 'bytes32', name: 'slot', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint64', name: 'sequenceNumber', type: 'uint64' },
      { indexed: false, internalType: 'bytes32', name: 'randomNumber', type: 'bytes32' },
    ],
    name: 'EntropyResult',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint64', name: 'version', type: 'uint64' }],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'time', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'winner', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'winningTicket', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'winAmount', type: 'uint256' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'ticketsPurchasedTotalBps',
        type: 'uint256',
      },
    ],
    name: 'JackpotRun',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'user', type: 'address' }],
    name: 'JackpotRunRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'lpAddress', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'riskPercentage', type: 'uint256' },
    ],
    name: 'LpDeposit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'lpAddress', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'principalAmount', type: 'uint256' },
    ],
    name: 'LpPrincipalWithdrawal',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'lpAddress', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'principal', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'stake', type: 'uint256' },
    ],
    name: 'LpRebalance',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'lpAddress', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'riskPercentage', type: 'uint256' },
    ],
    name: 'LpRiskPercentageAdjustment',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'lpAddress', type: 'address' }],
    name: 'LpStakeWithdrawal',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferStarted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'ProtocolFeeWithdrawal',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'implementation', type: 'address' }],
    name: 'Upgraded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'UserReferralFeeWithdrawal',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'ticketsPurchasedTotalBps',
        type: 'uint256',
      },
      { indexed: true, internalType: 'address', name: 'referrer', type: 'address' },
      { indexed: true, internalType: 'address', name: 'buyer', type: 'address' },
    ],
    name: 'UserTicketPurchase',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'UserWinWithdrawal',
    type: 'event',
  },
  {
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint64', name: 'sequence', type: 'uint64' },
      { internalType: 'address', name: 'provider', type: 'address' },
      { internalType: 'bytes32', name: 'randomNumber', type: 'bytes32' },
    ],
    name: '_entropyCallback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'activeLpAddresses',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'allFeesTotal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'allowPurchasing',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address[]', name: 'lpAddresses', type: 'address[]' }],
    name: 'deactivateInactiveLPs',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'entropyCallbackLock',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fallbackWinner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'feeBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'forceReleaseJackpotLock',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getJackpotFee',
    outputs: [{ internalType: 'uint256', name: 'fee', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_entropyAddress', type: 'address' },
      { internalType: 'address', name: '_initialOwnerAddress', type: 'address' },
      { internalType: 'address', name: '_token', type: 'address' },
      { internalType: 'uint256', name: '_ticketPrice', type: 'uint256' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'jackpotLock',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lastJackpotEndTime',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lastWinnerAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'riskPercentage', type: 'uint256' }],
    name: 'lpAdjustRiskPercentage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'riskPercentage', type: 'uint256' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'lpDeposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lpFeesTotal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lpLimit',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lpPoolCap',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lpPoolTotal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'lpsInfo',
    outputs: [
      { internalType: 'uint256', name: 'principal', type: 'uint256' },
      { internalType: 'uint256', name: 'stake', type: 'uint256' },
      { internalType: 'uint256', name: 'riskPercentage', type: 'uint256' },
      { internalType: 'bool', name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minLpDeposit',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pendingOwner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFeeAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFeeClaimable',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFeeThreshold',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'referrer', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
    ],
    name: 'purchaseTickets',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'referralFeeBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'referralFeesClaimable',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'referralFeesTotal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'roundDurationInSeconds',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'userRandomNumber', type: 'bytes32' }],
    name: 'runJackpot',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bool', name: '_allow', type: 'bool' }],
    name: 'setAllowPurchasing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_fallbackWinner', type: 'address' }],
    name: 'setFallbackWinner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_feeBps', type: 'uint256' }],
    name: 'setFeeBps',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_lpLimit', type: 'uint256' }],
    name: 'setLpLimit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_cap', type: 'uint256' }],
    name: 'setLpPoolCap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_minDeposit', type: 'uint256' }],
    name: 'setMinLpDeposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_protocolFeeAddress', type: 'address' }],
    name: 'setProtocolFeeAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_protocolFeeThreshold', type: 'uint256' }],
    name: 'setProtocolFeeThreshold',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_referralFeeBps', type: 'uint256' }],
    name: 'setReferralFeeBps',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_newDuration', type: 'uint256' }],
    name: 'setRoundDurationInSeconds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_newTicketPrice', type: 'uint256' }],
    name: 'setTicketPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_userLimit', type: 'uint256' }],
    name: 'setUserLimit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ticketCountTotalBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ticketPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenDecimals',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'newImplementation', type: 'address' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'userLimit',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'userPoolTotal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'usersInfo',
    outputs: [
      { internalType: 'uint256', name: 'ticketsPurchasedTotalBps', type: 'uint256' },
      { internalType: 'uint256', name: 'winningsClaimable', type: 'uint256' },
      { internalType: 'bool', name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawAllLP',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawProtocolFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawReferralFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const satisfies Abi

/**
 * Address of the deployed BaseJackpot contract.
 */
export const baseJackpotAddress =
  '0xa0A5611b9A1071a1D8A308882065c48650bAeE8b' as const satisfies Address

// ================================================================================================
// READ HOOKS
// ================================================================================================

/**
 * Hook to read the total value locked in the LP pool.
 * @param config - Optional wagmi configuration.
 * @returns Result of the read operation.
 */
export const useReadBaseJackpotLpPoolTotal = (
  config: Parameters<typeof useReadContract>[0] = {}
) => {
  return useReadContract({
    abi: baseJackpotAbi,
    address: baseJackpotAddress,
    functionName: 'lpPoolTotal',
    ...config,
  })
}

/**
 * Hook to read the current price of a ticket.
 * @param config - Optional wagmi configuration.
 * @returns Result of the read operation.
 */
export const useReadBaseJackpotTicketPrice = (
  config: Parameters<typeof useReadContract>[0] = {}
) => {
  return useReadContract({
    abi: baseJackpotAbi,
    address: baseJackpotAddress,
    functionName: 'ticketPrice',
    ...config,
  })
}

/**
 * Hook to read information about a specific user.
 * @param args - Arguments for the usersInfo function (user address).
 * @param config - Optional wagmi configuration.
 * @returns Result of the read operation.
 */
export const useReadBaseJackpotUsersInfo = (
  args: { userAddress: Address },
  config: Parameters<typeof useReadContract>[0] = {}
) => {
  return useReadContract({
    abi: baseJackpotAbi,
    address: baseJackpotAddress,
    functionName: 'usersInfo',
    args: [args.userAddress],
    ...config,
  })
}

/**
 * Hook to read the total number of tickets purchased (in basis points).
 * @param config - Optional wagmi configuration.
 * @returns Result of the read operation.
 */
export const useReadBaseJackpotTicketCountTotalBps = (
  config: Parameters<typeof useReadContract>[0] = {}
) => {
  return useReadContract({
    abi: baseJackpotAbi,
    address: baseJackpotAddress,
    functionName: 'ticketCountTotalBps',
    ...config,
  })
}

/**
 * Hook to read the duration of a jackpot round in seconds.
 * @param config - Optional wagmi configuration.
 * @returns Result of the read operation.
 */
export const useReadBaseJackpotRoundDurationInSeconds = (
  config: Parameters<typeof useReadContract>[0] = {}
) => {
  return useReadContract({
    abi: baseJackpotAbi,
    address: baseJackpotAddress,
    functionName: 'roundDurationInSeconds',
    ...config,
  })
}

/**
 * Hook to read the timestamp of the last jackpot end time.
 * @param config - Optional wagmi configuration.
 * @returns Result of the read operation.
 */
export const useReadBaseJackpotLastJackpotEndTime = (
  config: Parameters<typeof useReadContract>[0] = {}
) => {
  return useReadContract({
    abi: baseJackpotAbi,
    address: baseJackpotAddress,
    functionName: 'lastJackpotEndTime',
    ...config,
  })
}

/**
 * Hook to read the decimals of the underlying token.
 * @param config - Optional wagmi configuration.
 * @returns Result of the read operation.
 */
export const useReadBaseJackpotTokenDecimals = (
  config: Parameters<typeof useReadContract>[0] = {}
) => {
  return useReadContract({
    abi: baseJackpotAbi,
    address: baseJackpotAddress,
    functionName: 'tokenDecimals',
    ...config,
  })
}

/**
 * Hook to read the address of the token used for tickets.
 * @param config - Optional wagmi configuration.
 * @returns Result of the read operation.
 */
export const useReadBaseJackpotToken = (config: Parameters<typeof useReadContract>[0] = {}) => {
  return useReadContract({
    abi: baseJackpotAbi,
    address: baseJackpotAddress,
    functionName: 'token',
    ...config,
  })
}
