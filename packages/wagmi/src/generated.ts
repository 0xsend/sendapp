import {
  createReadContract,
  createWriteContract,
  createSimulateContract,
  createWatchContractEvent,
} from 'wagmi/codegen'

import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoAccount
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoAccountAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_daimoVerifier', internalType: 'contract DaimoVerifier', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'slot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
    ],
    name: 'addSigningKey',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct DaimoAccount.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'dest', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'executeBatch',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getActiveSigningKeys',
    outputs: [
      { name: 'activeSigningKeys', internalType: 'bytes32[2][]', type: 'bytes32[2][]' },
      { name: 'activeSigningKeySlots', internalType: 'uint8[]', type: 'uint8[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'slot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
      {
        name: 'initCalls',
        internalType: 'struct DaimoAccount.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'dest', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'message', internalType: 'bytes32', type: 'bytes32' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ name: 'magicValue', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint8', type: 'uint8' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'keys',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'maxKeys',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'numActiveKeys',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'slot', internalType: 'uint8', type: 'uint8' }],
    name: 'removeSigningKey',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'sig',
        internalType: 'struct Signature',
        type: 'tuple',
        components: [
          { name: 'authenticatorData', internalType: 'bytes', type: 'bytes' },
          { name: 'clientDataJSON', internalType: 'string', type: 'string' },
          { name: 'challengeLocation', internalType: 'uint256', type: 'uint256' },
          { name: 'responseTypeLocation', internalType: 'uint256', type: 'uint256' },
          { name: 'r', internalType: 'uint256', type: 'uint256' },
          { name: 's', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'signatureStruct',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'missingAccountFunds', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'validateUserOp',
    outputs: [{ name: 'validationData', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'verifier',
    outputs: [{ name: '', internalType: 'contract DaimoVerifier', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'entryPoint', internalType: 'contract IEntryPoint', type: 'address', indexed: true },
    ],
    name: 'AccountInitialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'version', internalType: 'uint64', type: 'uint64', indexed: false }],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'contract IAccount', type: 'address', indexed: true },
      { name: 'keySlot', internalType: 'uint8', type: 'uint8', indexed: false },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]', indexed: false },
    ],
    name: 'SigningKeyAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'contract IAccount', type: 'address', indexed: true },
      { name: 'keySlot', internalType: 'uint8', type: 'uint8', indexed: false },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]', indexed: false },
    ],
    name: 'SigningKeyRemoved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  { type: 'error', inputs: [], name: 'UUPSUnauthorizedCallContext' },
  {
    type: 'error',
    inputs: [{ name: 'slot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoAccountFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const daimoAccountFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_verifier', internalType: 'contract DaimoVerifier', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'accountImplementation',
    outputs: [{ name: '', internalType: 'contract DaimoAccount', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'keySlot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
      {
        name: 'initCalls',
        internalType: 'struct DaimoAccount.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'dest', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'salt', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createAccount',
    outputs: [{ name: 'ret', internalType: 'contract DaimoAccount', type: 'address' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'keySlot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
      {
        name: 'initCalls',
        internalType: 'struct DaimoAccount.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'dest', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'salt', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'verifier',
    outputs: [{ name: '', internalType: 'contract DaimoVerifier', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 *
 */
export const daimoAccountFactoryAddress = {
  845337: '0x22125D5129b1562CE447dE9FFb5612CdE4Bd63b0',
} as const

/**
 *
 */
export const daimoAccountFactoryConfig = {
  address: daimoAccountFactoryAddress,
  abi: daimoAccountFactoryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoVerifier
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const daimoVerifierAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initialOwner', internalType: 'address', type: 'address' }],
    name: 'init',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newImplementation', internalType: 'address', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'message', internalType: 'bytes', type: 'bytes' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
      { name: 'x', internalType: 'uint256', type: 'uint256' },
      { name: 'y', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'verifySignature',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'version', internalType: 'uint64', type: 'uint64', indexed: false }],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'previousOwner', internalType: 'address', type: 'address', indexed: true },
      { name: 'newOwner', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'UUPSUnauthorizedCallContext' },
  {
    type: 'error',
    inputs: [{ name: 'slot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
  },
] as const

/**
 *
 */
export const daimoVerifierAddress = {
  845337: '0x4fEeA13233e0cEB7B5f872aFBdDA57F463bfD88F',
} as const

/**
 *
 */
export const daimoVerifierConfig = { address: daimoVerifierAddress, abi: daimoVerifierAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoVerifierProxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const daimoVerifierProxyAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_logic', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
] as const

/**
 *
 */
export const daimoVerifierProxyAddress = {
  845337: '0xdAAb03239f5CC5b3452837E557295F790D9ab319',
} as const

/**
 *
 */
export const daimoVerifierProxyConfig = {
  address: daimoVerifierProxyAddress,
  abi: daimoVerifierProxyAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC165
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc165Abi = [
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Proxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967ProxyAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'implementation', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'payable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Utils
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967UtilsAbi = [
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'previousAdmin', internalType: 'address', type: 'address', indexed: false },
      { name: 'newAdmin', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'AdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'beacon', internalType: 'address', type: 'address', indexed: true }],
    name: 'BeaconUpgraded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    type: 'error',
    inputs: [{ name: 'admin', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidAdmin',
  },
  {
    type: 'error',
    inputs: [{ name: 'beacon', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidBeacon',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20Abi = [
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address', indexed: true },
      { name: 'spender', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Transfer',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EntryPoint
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const entryPointAbi = [
  {
    type: 'function',
    inputs: [{ name: '_unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'delegateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint256', type: 'uint256' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct PackedUserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
              { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
              { name: 'signature', internalType: 'bytes', type: 'bytes' },
            ],
          },
          { name: 'aggregator', internalType: 'contract IAggregator', type: 'address' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct PackedUserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'function', inputs: [], name: 'unlockStake', outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'factory', internalType: 'address', type: 'address', indexed: false },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'AccountDeployed',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'BeforeExecution' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalDeposit', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Deposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'PostOpRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address', indexed: true }],
    name: 'SignatureAggregatorChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalStaked', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeLocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawTime', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'success', internalType: 'bool', type: 'bool', indexed: false },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'actualGasUsed', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationEvent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationPrefundTooLow',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'UserOperationRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Withdrawn',
  },
  {
    type: 'error',
    inputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'ret', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'DelegateAndRevert',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'FailedOp',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
      { name: 'inner', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'FailedOpWithRevert',
  },
  {
    type: 'error',
    inputs: [{ name: 'returnData', internalType: 'bytes', type: 'bytes' }],
    name: 'PostOpReverted',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const entryPointAddress = {
  1: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  1337: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  8008: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  8453: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  84532: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  845337: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const entryPointConfig = { address: entryPointAddress, abi: entryPointAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EntryPointSimulations
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const entryPointSimulationsAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [
      { name: 'initCode', internalType: 'bytes', type: 'bytes' },
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
    ],
    name: '_validateSenderAndPaymaster',
    outputs: [],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'delegateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'deposits',
    outputs: [
      { name: 'deposit', internalType: 'uint256', type: 'uint256' },
      { name: 'staked', internalType: 'bool', type: 'bool' },
      { name: 'stake', internalType: 'uint112', type: 'uint112' },
      { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
      { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint256', type: 'uint256' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct PackedUserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
              { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
              { name: 'signature', internalType: 'bytes', type: 'bytes' },
            ],
          },
          { name: 'aggregator', internalType: 'contract IAggregator', type: 'address' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct PackedUserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'callData', internalType: 'bytes', type: 'bytes' },
      {
        name: 'opInfo',
        internalType: 'struct EntryPoint.UserOpInfo',
        type: 'tuple',
        components: [
          {
            name: 'mUserOp',
            internalType: 'struct EntryPoint.MemoryUserOp',
            type: 'tuple',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterVerificationGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterPostOpGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'paymaster', internalType: 'address', type: 'address' },
              { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
              { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
            ],
          },
          { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'contextOffset', internalType: 'uint256', type: 'uint256' },
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
        ],
      },
      { name: 'context', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'innerHandleOp',
    outputs: [{ name: 'actualGasCost', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'nonceSequenceNumber',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'op',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'targetCallData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateHandleOp',
    outputs: [
      {
        name: '',
        internalType: 'struct IEntryPointSimulations.ExecutionResult',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paid', internalType: 'uint256', type: 'uint256' },
          { name: 'accountValidationData', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterValidationData', internalType: 'uint256', type: 'uint256' },
          { name: 'targetSuccess', internalType: 'bool', type: 'bool' },
          { name: 'targetResult', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'simulateValidation',
    outputs: [
      {
        name: '',
        internalType: 'struct IEntryPointSimulations.ValidationResult',
        type: 'tuple',
        components: [
          {
            name: 'returnInfo',
            internalType: 'struct IEntryPoint.ReturnInfo',
            type: 'tuple',
            components: [
              { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
              { name: 'prefund', internalType: 'uint256', type: 'uint256' },
              { name: 'accountValidationData', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterValidationData', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterContext', internalType: 'bytes', type: 'bytes' },
            ],
          },
          {
            name: 'senderInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'factoryInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'paymasterInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'aggregatorInfo',
            internalType: 'struct IEntryPoint.AggregatorStakeInfo',
            type: 'tuple',
            components: [
              { name: 'aggregator', internalType: 'address', type: 'address' },
              {
                name: 'stakeInfo',
                internalType: 'struct IStakeManager.StakeInfo',
                type: 'tuple',
                components: [
                  { name: 'stake', internalType: 'uint256', type: 'uint256' },
                  { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
                ],
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  { type: 'function', inputs: [], name: 'unlockStake', outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'factory', internalType: 'address', type: 'address', indexed: false },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'AccountDeployed',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'BeforeExecution' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalDeposit', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Deposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'PostOpRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address', indexed: true }],
    name: 'SignatureAggregatorChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalStaked', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeLocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawTime', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'success', internalType: 'bool', type: 'bool', indexed: false },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'actualGasUsed', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationEvent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationPrefundTooLow',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'UserOperationRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Withdrawn',
  },
  {
    type: 'error',
    inputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'ret', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'DelegateAndRevert',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'FailedOp',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
      { name: 'inner', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'FailedOpWithRevert',
  },
  {
    type: 'error',
    inputs: [{ name: 'returnData', internalType: 'bytes', type: 'bytes' }],
    name: 'PostOpReverted',
  },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IEntryPoint
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iEntryPointAbi = [
  {
    type: 'function',
    inputs: [{ name: '_unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'delegateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint256', type: 'uint256' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct PackedUserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
              { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
              { name: 'signature', internalType: 'bytes', type: 'bytes' },
            ],
          },
          { name: 'aggregator', internalType: 'contract IAggregator', type: 'address' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct PackedUserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'function', inputs: [], name: 'unlockStake', outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'factory', internalType: 'address', type: 'address', indexed: false },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'AccountDeployed',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'BeforeExecution' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalDeposit', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Deposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'PostOpRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address', indexed: true }],
    name: 'SignatureAggregatorChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalStaked', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeLocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawTime', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'success', internalType: 'bool', type: 'bool', indexed: false },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'actualGasUsed', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationEvent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationPrefundTooLow',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'UserOperationRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Withdrawn',
  },
  {
    type: 'error',
    inputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'ret', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'DelegateAndRevert',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'FailedOp',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
      { name: 'inner', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'FailedOpWithRevert',
  },
  {
    type: 'error',
    inputs: [{ name: 'returnData', internalType: 'bytes', type: 'bytes' }],
    name: 'PostOpReverted',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IEntryPointSimulations
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iEntryPointSimulationsAbi = [
  {
    type: 'function',
    inputs: [{ name: '_unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'delegateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint256', type: 'uint256' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct PackedUserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
              { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
              { name: 'signature', internalType: 'bytes', type: 'bytes' },
            ],
          },
          { name: 'aggregator', internalType: 'contract IAggregator', type: 'address' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct PackedUserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'op',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'targetCallData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateHandleOp',
    outputs: [
      {
        name: '',
        internalType: 'struct IEntryPointSimulations.ExecutionResult',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paid', internalType: 'uint256', type: 'uint256' },
          { name: 'accountValidationData', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterValidationData', internalType: 'uint256', type: 'uint256' },
          { name: 'targetSuccess', internalType: 'bool', type: 'bool' },
          { name: 'targetResult', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'simulateValidation',
    outputs: [
      {
        name: '',
        internalType: 'struct IEntryPointSimulations.ValidationResult',
        type: 'tuple',
        components: [
          {
            name: 'returnInfo',
            internalType: 'struct IEntryPoint.ReturnInfo',
            type: 'tuple',
            components: [
              { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
              { name: 'prefund', internalType: 'uint256', type: 'uint256' },
              { name: 'accountValidationData', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterValidationData', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterContext', internalType: 'bytes', type: 'bytes' },
            ],
          },
          {
            name: 'senderInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'factoryInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'paymasterInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'aggregatorInfo',
            internalType: 'struct IEntryPoint.AggregatorStakeInfo',
            type: 'tuple',
            components: [
              { name: 'aggregator', internalType: 'address', type: 'address' },
              {
                name: 'stakeInfo',
                internalType: 'struct IStakeManager.StakeInfo',
                type: 'tuple',
                components: [
                  { name: 'stake', internalType: 'uint256', type: 'uint256' },
                  { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
                ],
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'function', inputs: [], name: 'unlockStake', outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'factory', internalType: 'address', type: 'address', indexed: false },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'AccountDeployed',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'BeforeExecution' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalDeposit', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Deposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'PostOpRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address', indexed: true }],
    name: 'SignatureAggregatorChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalStaked', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeLocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawTime', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'success', internalType: 'bool', type: 'bool', indexed: false },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'actualGasUsed', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationEvent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationPrefundTooLow',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'UserOperationRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Withdrawn',
  },
  {
    type: 'error',
    inputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'ret', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'DelegateAndRevert',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'FailedOp',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
      { name: 'inner', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'FailedOpWithRevert',
  },
  {
    type: 'error',
    inputs: [{ name: 'returnData', internalType: 'bytes', type: 'bytes' }],
    name: 'PostOpReverted',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendAirdropsSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendAirdropsSafeAbi = [] as const

export const sendAirdropsSafeAddress = '0x6204Bc0662ccd8a9A762d59fe7906733f251E3b7' as const

export const sendAirdropsSafeConfig = {
  address: sendAirdropsSafeAddress,
  abi: sendAirdropsSafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendContributorIncentivesSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendContributorIncentivesSafeAbi = [] as const

export const sendContributorIncentivesSafeAddress =
  '0x4F30818f5c1a20803AB2075B813DBDE810e51b98' as const

export const sendContributorIncentivesSafeConfig = {
  address: sendContributorIncentivesSafeAddress,
  abi: sendContributorIncentivesSafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendCoreTeamSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendCoreTeamSafeAbi = [] as const

export const sendCoreTeamSafeAddress = '0xE52D0967A2eE242098d11c209f53C8158E329eCC' as const

export const sendCoreTeamSafeConfig = {
  address: sendCoreTeamSafeAddress,
  abi: sendCoreTeamSafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendEXListingsSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendExListingsSafeAbi = [] as const

export const sendExListingsSafeAddress = '0xF530e6E60e7a65Ea717f843a8b2e6fcdC727aC9E' as const

export const sendExListingsSafeConfig = {
  address: sendExListingsSafeAddress,
  abi: sendExListingsSafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendMerkleDrop
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const sendMerkleDropAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_token', internalType: 'contract IERC20', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_merkleRoot', internalType: 'bytes32', type: 'bytes32' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addTranche',
    outputs: [{ name: 'trancheId', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_address', internalType: 'address', type: 'address' },
      { name: '_tranche', internalType: 'uint256', type: 'uint256' },
      { name: '_index', internalType: 'uint256', type: 'uint256' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_merkleProof', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'claimTranche',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_address', internalType: 'address', type: 'address' },
      { name: '_tranches', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '_indexes', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '_amounts', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '_merkleProofs', internalType: 'bytes32[][]', type: 'bytes32[][]' },
    ],
    name: 'claimTranches',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_trancheId', internalType: 'uint256', type: 'uint256' }],
    name: 'expireTranche',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tranche', internalType: 'uint256', type: 'uint256' },
      { name: '_index', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'isClaimed',
    outputs: [{ name: 'claimed', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'merkleRoots',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheActive',
    outputs: [{ name: 'valid', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmount',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmountClaimed',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmounts',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmountsClaimed',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'trancheCursor',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_transferTo', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferToken',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_address', internalType: 'address', type: 'address' },
      { name: '_tranche', internalType: 'uint256', type: 'uint256' },
      { name: '_index', internalType: 'uint256', type: 'uint256' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_merkleProof', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'verifyClaim',
    outputs: [{ name: 'valid', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_to', internalType: 'address payable', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'claimer', internalType: 'address', type: 'address', indexed: false },
      { name: 'tranche', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Claimed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'previousOwner', internalType: 'address', type: 'address', indexed: true },
      { name: 'newOwner', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'tranche', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'merkleRoot', internalType: 'bytes32', type: 'bytes32', indexed: false },
      { name: 'totalAmount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'TrancheAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'tranche', internalType: 'uint256', type: 'uint256', indexed: false }],
    name: 'TrancheExpired',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'AddressInsufficientBalance',
  },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const sendMerkleDropAddress = {
  1: '0xB9310daE45E71c7a160A13D64204623071a8E347',
  1337: '0xB9310daE45E71c7a160A13D64204623071a8E347',
  8008: '0xB9310daE45E71c7a160A13D64204623071a8E347',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const sendMerkleDropConfig = {
  address: sendMerkleDropAddress,
  abi: sendMerkleDropAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendMultisigSignerPayoutsSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendMultisigSignerPayoutsSafeAbi = [] as const

export const sendMultisigSignerPayoutsSafeAddress =
  '0x5355c409fa3D0901292231Ddb953C949C2211D96' as const

export const sendMultisigSignerPayoutsSafeConfig = {
  address: sendMultisigSignerPayoutsSafeAddress,
  abi: sendMultisigSignerPayoutsSafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendRevenueSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendRevenueSafeAbi = [] as const

export const sendRevenueSafeAddress = '0xBB253919a15C5E0C9986d83f205A9279b4247E3d' as const

export const sendRevenueSafeConfig = {
  address: sendRevenueSafeAddress,
  abi: sendRevenueSafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendToken
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const sendTokenAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address', indexed: true },
      { name: 'spender', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Transfer',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const sendTokenAddress = {
  1: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  1337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  8008: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  8453: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  84532: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  845337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const sendTokenConfig = { address: sendTokenAddress, abi: sendTokenAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendTreasurySafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendTreasurySafeAbi = [] as const

export const sendTreasurySafeAddress = '0x4bB2f4c771ccB60723a78a974a2537AD339071c7' as const

export const sendTreasurySafeConfig = {
  address: sendTreasurySafeAddress,
  abi: sendTreasurySafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendUniswapV3Pool
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendUniswapV3PoolAbi = [] as const

export const sendUniswapV3PoolAddress = '0x14F59C715C205002c6e3F36766D302c1a19bacC8' as const

export const sendUniswapV3PoolConfig = {
  address: sendUniswapV3PoolAddress,
  abi: sendUniswapV3PoolAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SenderCreator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const senderCreatorAbi = [
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'createSender',
    outputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TestUSDC
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const testUsdcAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address', indexed: true },
      { name: 'spender', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Transfer',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// USDC
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const usdcAbi = [
  {
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const usdcAddress = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  1337: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  8008: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  845337: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const usdcConfig = { address: usdcAddress, abi: usdcAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountAbi}__
 */
export const readDaimoAccount = /*#__PURE__*/ createReadContract({ abi: daimoAccountAbi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 */
export const readDaimoAccountUpgradeInterfaceVersion = /*#__PURE__*/ createReadContract({
  abi: daimoAccountAbi,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"entryPoint"`
 */
export const readDaimoAccountEntryPoint = /*#__PURE__*/ createReadContract({
  abi: daimoAccountAbi,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"getActiveSigningKeys"`
 */
export const readDaimoAccountGetActiveSigningKeys = /*#__PURE__*/ createReadContract({
  abi: daimoAccountAbi,
  functionName: 'getActiveSigningKeys',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"isValidSignature"`
 */
export const readDaimoAccountIsValidSignature = /*#__PURE__*/ createReadContract({
  abi: daimoAccountAbi,
  functionName: 'isValidSignature',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"keys"`
 */
export const readDaimoAccountKeys = /*#__PURE__*/ createReadContract({
  abi: daimoAccountAbi,
  functionName: 'keys',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"maxKeys"`
 */
export const readDaimoAccountMaxKeys = /*#__PURE__*/ createReadContract({
  abi: daimoAccountAbi,
  functionName: 'maxKeys',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"numActiveKeys"`
 */
export const readDaimoAccountNumActiveKeys = /*#__PURE__*/ createReadContract({
  abi: daimoAccountAbi,
  functionName: 'numActiveKeys',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const readDaimoAccountProxiableUuid = /*#__PURE__*/ createReadContract({
  abi: daimoAccountAbi,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"verifier"`
 */
export const readDaimoAccountVerifier = /*#__PURE__*/ createReadContract({
  abi: daimoAccountAbi,
  functionName: 'verifier',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountAbi}__
 */
export const writeDaimoAccount = /*#__PURE__*/ createWriteContract({ abi: daimoAccountAbi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"addSigningKey"`
 */
export const writeDaimoAccountAddSigningKey = /*#__PURE__*/ createWriteContract({
  abi: daimoAccountAbi,
  functionName: 'addSigningKey',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"executeBatch"`
 */
export const writeDaimoAccountExecuteBatch = /*#__PURE__*/ createWriteContract({
  abi: daimoAccountAbi,
  functionName: 'executeBatch',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"initialize"`
 */
export const writeDaimoAccountInitialize = /*#__PURE__*/ createWriteContract({
  abi: daimoAccountAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"removeSigningKey"`
 */
export const writeDaimoAccountRemoveSigningKey = /*#__PURE__*/ createWriteContract({
  abi: daimoAccountAbi,
  functionName: 'removeSigningKey',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"signatureStruct"`
 */
export const writeDaimoAccountSignatureStruct = /*#__PURE__*/ createWriteContract({
  abi: daimoAccountAbi,
  functionName: 'signatureStruct',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const writeDaimoAccountUpgradeToAndCall = /*#__PURE__*/ createWriteContract({
  abi: daimoAccountAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"validateUserOp"`
 */
export const writeDaimoAccountValidateUserOp = /*#__PURE__*/ createWriteContract({
  abi: daimoAccountAbi,
  functionName: 'validateUserOp',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountAbi}__
 */
export const prepareWriteDaimoAccount = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"addSigningKey"`
 */
export const prepareWriteDaimoAccountAddSigningKey = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'addSigningKey',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"executeBatch"`
 */
export const prepareWriteDaimoAccountExecuteBatch = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'executeBatch',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"initialize"`
 */
export const prepareWriteDaimoAccountInitialize = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"removeSigningKey"`
 */
export const prepareWriteDaimoAccountRemoveSigningKey = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'removeSigningKey',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"signatureStruct"`
 */
export const prepareWriteDaimoAccountSignatureStruct = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'signatureStruct',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const prepareWriteDaimoAccountUpgradeToAndCall = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"validateUserOp"`
 */
export const prepareWriteDaimoAccountValidateUserOp = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'validateUserOp',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__
 */
export const watchDaimoAccountEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoAccountAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"AccountInitialized"`
 */
export const watchDaimoAccountAccountInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'AccountInitialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"Initialized"`
 */
export const watchDaimoAccountInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"SigningKeyAdded"`
 */
export const watchDaimoAccountSigningKeyAddedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'SigningKeyAdded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"SigningKeyRemoved"`
 */
export const watchDaimoAccountSigningKeyRemovedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'SigningKeyRemoved',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchDaimoAccountUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__
 *
 *
 */
export const readDaimoAccountFactory = /*#__PURE__*/ createReadContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"accountImplementation"`
 *
 *
 */
export const readDaimoAccountFactoryAccountImplementation = /*#__PURE__*/ createReadContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'accountImplementation',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"entryPoint"`
 *
 *
 */
export const readDaimoAccountFactoryEntryPoint = /*#__PURE__*/ createReadContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"getAddress"`
 *
 *
 */
export const readDaimoAccountFactoryGetAddress = /*#__PURE__*/ createReadContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'getAddress',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"verifier"`
 *
 *
 */
export const readDaimoAccountFactoryVerifier = /*#__PURE__*/ createReadContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'verifier',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__
 *
 *
 */
export const writeDaimoAccountFactory = /*#__PURE__*/ createWriteContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"createAccount"`
 *
 *
 */
export const writeDaimoAccountFactoryCreateAccount = /*#__PURE__*/ createWriteContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'createAccount',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__
 *
 *
 */
export const prepareWriteDaimoAccountFactory = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"createAccount"`
 *
 *
 */
export const prepareWriteDaimoAccountFactoryCreateAccount = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'createAccount',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoVerifierAbi}__
 *
 *
 */
export const readDaimoVerifier = /*#__PURE__*/ createReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 *
 */
export const readDaimoVerifierUpgradeInterfaceVersion = /*#__PURE__*/ createReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"implementation"`
 *
 *
 */
export const readDaimoVerifierImplementation = /*#__PURE__*/ createReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'implementation',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"owner"`
 *
 *
 */
export const readDaimoVerifierOwner = /*#__PURE__*/ createReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 *
 */
export const readDaimoVerifierProxiableUuid = /*#__PURE__*/ createReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"verifySignature"`
 *
 *
 */
export const readDaimoVerifierVerifySignature = /*#__PURE__*/ createReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'verifySignature',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoVerifierAbi}__
 *
 *
 */
export const writeDaimoVerifier = /*#__PURE__*/ createWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"init"`
 *
 *
 */
export const writeDaimoVerifierInit = /*#__PURE__*/ createWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'init',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const writeDaimoVerifierRenounceOwnership = /*#__PURE__*/ createWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const writeDaimoVerifierTransferOwnership = /*#__PURE__*/ createWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"upgradeTo"`
 *
 *
 */
export const writeDaimoVerifierUpgradeTo = /*#__PURE__*/ createWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const writeDaimoVerifierUpgradeToAndCall = /*#__PURE__*/ createWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__
 *
 *
 */
export const prepareWriteDaimoVerifier = /*#__PURE__*/ createSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"init"`
 *
 *
 */
export const prepareWriteDaimoVerifierInit = /*#__PURE__*/ createSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'init',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const prepareWriteDaimoVerifierRenounceOwnership = /*#__PURE__*/ createSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const prepareWriteDaimoVerifierTransferOwnership = /*#__PURE__*/ createSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"upgradeTo"`
 *
 *
 */
export const prepareWriteDaimoVerifierUpgradeTo = /*#__PURE__*/ createSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const prepareWriteDaimoVerifierUpgradeToAndCall = /*#__PURE__*/ createSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__
 *
 *
 */
export const watchDaimoVerifierEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__ and `eventName` set to `"Initialized"`
 *
 *
 */
export const watchDaimoVerifierInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 *
 */
export const watchDaimoVerifierOwnershipTransferredEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  eventName: 'OwnershipTransferred',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__ and `eventName` set to `"Upgraded"`
 *
 *
 */
export const watchDaimoVerifierUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoVerifierProxyAbi}__
 *
 *
 */
export const watchDaimoVerifierProxyEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoVerifierProxyAbi,
  address: daimoVerifierProxyAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoVerifierProxyAbi}__ and `eventName` set to `"Upgraded"`
 *
 *
 */
export const watchDaimoVerifierProxyUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoVerifierProxyAbi,
  address: daimoVerifierProxyAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc165Abi}__
 */
export const readErc165 = /*#__PURE__*/ createReadContract({ abi: erc165Abi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc165Abi}__ and `functionName` set to `"supportsInterface"`
 */
export const readErc165SupportsInterface = /*#__PURE__*/ createReadContract({
  abi: erc165Abi,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__
 */
export const watchErc1967ProxyEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967ProxyAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchErc1967ProxyUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967ProxyAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__
 */
export const watchErc1967UtilsEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UtilsAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const watchErc1967UtilsAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const watchErc1967UtilsBeaconUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'BeaconUpgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchErc1967UtilsUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const readErc20 = /*#__PURE__*/ createReadContract({ abi: erc20Abi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"allowance"`
 */
export const readErc20Allowance = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"balanceOf"`
 */
export const readErc20BalanceOf = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"decimals"`
 */
export const readErc20Decimals = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"name"`
 */
export const readErc20Name = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"symbol"`
 */
export const readErc20Symbol = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"totalSupply"`
 */
export const readErc20TotalSupply = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const writeErc20 = /*#__PURE__*/ createWriteContract({ abi: erc20Abi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const writeErc20Approve = /*#__PURE__*/ createWriteContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transfer"`
 */
export const writeErc20Transfer = /*#__PURE__*/ createWriteContract({
  abi: erc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transferFrom"`
 */
export const writeErc20TransferFrom = /*#__PURE__*/ createWriteContract({
  abi: erc20Abi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const prepareWriteErc20 = /*#__PURE__*/ createSimulateContract({ abi: erc20Abi })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const prepareWriteErc20Approve = /*#__PURE__*/ createSimulateContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transfer"`
 */
export const prepareWriteErc20Transfer = /*#__PURE__*/ createSimulateContract({
  abi: erc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transferFrom"`
 */
export const prepareWriteErc20TransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: erc20Abi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc20Abi}__
 */
export const watchErc20Event = /*#__PURE__*/ createWatchContractEvent({ abi: erc20Abi })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc20Abi}__ and `eventName` set to `"Approval"`
 */
export const watchErc20ApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc20Abi,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc20Abi}__ and `eventName` set to `"Transfer"`
 */
export const watchErc20TransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc20Abi,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const readEntryPoint = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const readEntryPointBalanceOf = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getDepositInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const readEntryPointGetDepositInfo = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const readEntryPointGetNonce = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getUserOpHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const readEntryPointGetUserOpHash = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPoint = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointAddStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointDelegateAndRevert = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointDepositTo = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointGetSenderAddress = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointHandleAggregatedOps = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointHandleOps = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointIncrementNonce = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointUnlockStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointWithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointWithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPoint = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointAddStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointDelegateAndRevert = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointDepositTo = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointGetSenderAddress = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointHandleAggregatedOps = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointHandleOps = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointIncrementNonce = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointUnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointWithdrawStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointWithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"AccountDeployed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointAccountDeployedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'AccountDeployed',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"BeforeExecution"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointBeforeExecutionEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'BeforeExecution',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Deposited"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointDepositedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"PostOpRevertReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointPostOpRevertReasonEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'PostOpRevertReason',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointAbi,
    address: entryPointAddress,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeLocked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointStakeLockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeUnlocked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointStakeUnlockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeWithdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointStakeWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeWithdrawn',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationEvent"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointUserOperationEventEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'UserOperationEvent',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointAbi,
    address: entryPointAddress,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointUserOperationRevertReasonEvent = /*#__PURE__*/ createWatchContractEvent(
  { abi: entryPointAbi, address: entryPointAddress, eventName: 'UserOperationRevertReason' }
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Withdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const readEntryPointSimulations = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"_validateSenderAndPaymaster"`
 */
export const readEntryPointSimulationsValidateSenderAndPaymaster = /*#__PURE__*/ createReadContract(
  { abi: entryPointSimulationsAbi, functionName: '_validateSenderAndPaymaster' }
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"balanceOf"`
 */
export const readEntryPointSimulationsBalanceOf = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"deposits"`
 */
export const readEntryPointSimulationsDeposits = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'deposits',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const readEntryPointSimulationsGetDepositInfo = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getNonce"`
 */
export const readEntryPointSimulationsGetNonce = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const readEntryPointSimulationsGetUserOpHash = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"nonceSequenceNumber"`
 */
export const readEntryPointSimulationsNonceSequenceNumber = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'nonceSequenceNumber',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const readEntryPointSimulationsSupportsInterface = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const writeEntryPointSimulations = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const writeEntryPointSimulationsAddStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const writeEntryPointSimulationsDelegateAndRevert = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const writeEntryPointSimulationsDepositTo = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const writeEntryPointSimulationsGetSenderAddress = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const writeEntryPointSimulationsHandleAggregatedOps = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const writeEntryPointSimulationsHandleOps = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const writeEntryPointSimulationsIncrementNonce = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"innerHandleOp"`
 */
export const writeEntryPointSimulationsInnerHandleOp = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'innerHandleOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const writeEntryPointSimulationsSimulateHandleOp = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const writeEntryPointSimulationsSimulateValidation = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'simulateValidation',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const writeEntryPointSimulationsUnlockStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const writeEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const writeEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const prepareWriteEntryPointSimulations = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const prepareWriteEntryPointSimulationsAddStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const prepareWriteEntryPointSimulationsDelegateAndRevert =
  /*#__PURE__*/ createSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'delegateAndRevert',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const prepareWriteEntryPointSimulationsDepositTo = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const prepareWriteEntryPointSimulationsGetSenderAddress =
  /*#__PURE__*/ createSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'getSenderAddress',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const prepareWriteEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const prepareWriteEntryPointSimulationsHandleOps = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const prepareWriteEntryPointSimulationsIncrementNonce = /*#__PURE__*/ createSimulateContract(
  { abi: entryPointSimulationsAbi, functionName: 'incrementNonce' }
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"innerHandleOp"`
 */
export const prepareWriteEntryPointSimulationsInnerHandleOp = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'innerHandleOp',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const prepareWriteEntryPointSimulationsSimulateHandleOp =
  /*#__PURE__*/ createSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'simulateHandleOp',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const prepareWriteEntryPointSimulationsSimulateValidation =
  /*#__PURE__*/ createSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'simulateValidation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const prepareWriteEntryPointSimulationsUnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const prepareWriteEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const prepareWriteEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const watchEntryPointSimulationsEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const watchEntryPointSimulationsAccountDeployedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'AccountDeployed',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const watchEntryPointSimulationsBeforeExecutionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'BeforeExecution',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"Deposited"`
 */
export const watchEntryPointSimulationsDepositedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointSimulationsAbi,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const watchEntryPointSimulationsPostOpRevertReasonEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'PostOpRevertReason',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const watchEntryPointSimulationsSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const watchEntryPointSimulationsStakeLockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointSimulationsAbi,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const watchEntryPointSimulationsStakeUnlockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointSimulationsAbi,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const watchEntryPointSimulationsStakeWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent(
  { abi: entryPointSimulationsAbi, eventName: 'StakeWithdrawn' }
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const watchEntryPointSimulationsUserOperationEventEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationEvent',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const watchEntryPointSimulationsUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const watchEntryPointSimulationsUserOperationRevertReasonEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const watchEntryPointSimulationsWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointSimulationsAbi,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const readIEntryPoint = /*#__PURE__*/ createReadContract({ abi: iEntryPointAbi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"balanceOf"`
 */
export const readIEntryPointBalanceOf = /*#__PURE__*/ createReadContract({
  abi: iEntryPointAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const readIEntryPointGetDepositInfo = /*#__PURE__*/ createReadContract({
  abi: iEntryPointAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getNonce"`
 */
export const readIEntryPointGetNonce = /*#__PURE__*/ createReadContract({
  abi: iEntryPointAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const readIEntryPointGetUserOpHash = /*#__PURE__*/ createReadContract({
  abi: iEntryPointAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const writeIEntryPoint = /*#__PURE__*/ createWriteContract({ abi: iEntryPointAbi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"addStake"`
 */
export const writeIEntryPointAddStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const writeIEntryPointDelegateAndRevert = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"depositTo"`
 */
export const writeIEntryPointDepositTo = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const writeIEntryPointGetSenderAddress = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const writeIEntryPointHandleAggregatedOps = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleOps"`
 */
export const writeIEntryPointHandleOps = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const writeIEntryPointIncrementNonce = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"unlockStake"`
 */
export const writeIEntryPointUnlockStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const writeIEntryPointWithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const writeIEntryPointWithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const prepareWriteIEntryPoint = /*#__PURE__*/ createSimulateContract({ abi: iEntryPointAbi })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"addStake"`
 */
export const prepareWriteIEntryPointAddStake = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const prepareWriteIEntryPointDelegateAndRevert = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"depositTo"`
 */
export const prepareWriteIEntryPointDepositTo = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const prepareWriteIEntryPointGetSenderAddress = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const prepareWriteIEntryPointHandleAggregatedOps = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleOps"`
 */
export const prepareWriteIEntryPointHandleOps = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const prepareWriteIEntryPointIncrementNonce = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"unlockStake"`
 */
export const prepareWriteIEntryPointUnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const prepareWriteIEntryPointWithdrawStake = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const prepareWriteIEntryPointWithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const watchIEntryPointEvent = /*#__PURE__*/ createWatchContractEvent({ abi: iEntryPointAbi })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const watchIEntryPointAccountDeployedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'AccountDeployed',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const watchIEntryPointBeforeExecutionEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'BeforeExecution',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"Deposited"`
 */
export const watchIEntryPointDepositedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const watchIEntryPointPostOpRevertReasonEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'PostOpRevertReason',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const watchIEntryPointSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const watchIEntryPointStakeLockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const watchIEntryPointStakeUnlockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const watchIEntryPointStakeWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeWithdrawn',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const watchIEntryPointUserOperationEventEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'UserOperationEvent',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const watchIEntryPointUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const watchIEntryPointUserOperationRevertReasonEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const watchIEntryPointWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const readIEntryPointSimulations = /*#__PURE__*/ createReadContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"balanceOf"`
 */
export const readIEntryPointSimulationsBalanceOf = /*#__PURE__*/ createReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const readIEntryPointSimulationsGetDepositInfo = /*#__PURE__*/ createReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getNonce"`
 */
export const readIEntryPointSimulationsGetNonce = /*#__PURE__*/ createReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const readIEntryPointSimulationsGetUserOpHash = /*#__PURE__*/ createReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const writeIEntryPointSimulations = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const writeIEntryPointSimulationsAddStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const writeIEntryPointSimulationsDelegateAndRevert = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const writeIEntryPointSimulationsDepositTo = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const writeIEntryPointSimulationsGetSenderAddress = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const writeIEntryPointSimulationsHandleAggregatedOps = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const writeIEntryPointSimulationsHandleOps = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const writeIEntryPointSimulationsIncrementNonce = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const writeIEntryPointSimulationsSimulateHandleOp = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const writeIEntryPointSimulationsSimulateValidation = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'simulateValidation',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const writeIEntryPointSimulationsUnlockStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const writeIEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const writeIEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const prepareWriteIEntryPointSimulations = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const prepareWriteIEntryPointSimulationsAddStake = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const prepareWriteIEntryPointSimulationsDelegateAndRevert =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'delegateAndRevert',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const prepareWriteIEntryPointSimulationsDepositTo = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const prepareWriteIEntryPointSimulationsGetSenderAddress =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'getSenderAddress',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const prepareWriteIEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const prepareWriteIEntryPointSimulationsHandleOps = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const prepareWriteIEntryPointSimulationsIncrementNonce =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'incrementNonce',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const prepareWriteIEntryPointSimulationsSimulateHandleOp =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'simulateHandleOp',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const prepareWriteIEntryPointSimulationsSimulateValidation =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'simulateValidation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const prepareWriteIEntryPointSimulationsUnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const prepareWriteIEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createSimulateContract(
  { abi: iEntryPointSimulationsAbi, functionName: 'withdrawStake' }
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const prepareWriteIEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const watchIEntryPointSimulationsEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const watchIEntryPointSimulationsAccountDeployedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'AccountDeployed',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const watchIEntryPointSimulationsBeforeExecutionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'BeforeExecution',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"Deposited"`
 */
export const watchIEntryPointSimulationsDepositedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointSimulationsAbi,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const watchIEntryPointSimulationsPostOpRevertReasonEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'PostOpRevertReason',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const watchIEntryPointSimulationsSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const watchIEntryPointSimulationsStakeLockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointSimulationsAbi,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const watchIEntryPointSimulationsStakeUnlockedEvent = /*#__PURE__*/ createWatchContractEvent(
  { abi: iEntryPointSimulationsAbi, eventName: 'StakeUnlocked' }
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const watchIEntryPointSimulationsStakeWithdrawnEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'StakeWithdrawn',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const watchIEntryPointSimulationsUserOperationEventEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationEvent',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const watchIEntryPointSimulationsUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const watchIEntryPointSimulationsUserOperationRevertReasonEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const watchIEntryPointSimulationsWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointSimulationsAbi,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDrop = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"isClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropIsClaimed = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'isClaimed',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"merkleRoots"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropMerkleRoots = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'merkleRoots',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropOwner = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"token"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropToken = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'token',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheActive"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropTrancheActive = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheActive',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmount"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropTrancheAmount = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmount',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmountClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropTrancheAmountClaimed = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmountClaimed',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmounts"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropTrancheAmounts = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmounts',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmountsClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropTrancheAmountsClaimed = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmountsClaimed',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheCursor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropTrancheCursor = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheCursor',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"verifyClaim"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const readSendMerkleDropVerifyClaim = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'verifyClaim',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const writeSendMerkleDrop = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"addTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const writeSendMerkleDropAddTranche = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'addTranche',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const writeSendMerkleDropClaimTranche = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranche',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranches"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const writeSendMerkleDropClaimTranches = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranches',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"expireTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const writeSendMerkleDropExpireTranche = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'expireTranche',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const writeSendMerkleDropRenounceOwnership = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const writeSendMerkleDropTransferOwnership = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const writeSendMerkleDropTransferToken = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const writeSendMerkleDropWithdraw = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const prepareWriteSendMerkleDrop = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"addTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const prepareWriteSendMerkleDropAddTranche = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'addTranche',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const prepareWriteSendMerkleDropClaimTranche = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranche',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranches"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const prepareWriteSendMerkleDropClaimTranches = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranches',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"expireTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const prepareWriteSendMerkleDropExpireTranche = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'expireTranche',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const prepareWriteSendMerkleDropRenounceOwnership = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const prepareWriteSendMerkleDropTransferOwnership = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const prepareWriteSendMerkleDropTransferToken = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const prepareWriteSendMerkleDropWithdraw = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const watchSendMerkleDropEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"Claimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const watchSendMerkleDropClaimedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'Claimed',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const watchSendMerkleDropOwnershipTransferredEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'OwnershipTransferred',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"TrancheAdded"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const watchSendMerkleDropTrancheAddedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'TrancheAdded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"TrancheExpired"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const watchSendMerkleDropTrancheExpiredEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'TrancheExpired',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendToken = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenAllowance = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenBalanceOf = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenDecimals = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenName = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenSymbol = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenTotalSupply = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendToken = /*#__PURE__*/ createWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendTokenApprove = /*#__PURE__*/ createWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendTokenTransfer = /*#__PURE__*/ createWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendTokenTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendToken = /*#__PURE__*/ createSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendTokenApprove = /*#__PURE__*/ createSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendTokenTransfer = /*#__PURE__*/ createSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendTokenTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const watchSendTokenEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const watchSendTokenApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const watchSendTokenTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link senderCreatorAbi}__
 */
export const writeSenderCreator = /*#__PURE__*/ createWriteContract({ abi: senderCreatorAbi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link senderCreatorAbi}__ and `functionName` set to `"createSender"`
 */
export const writeSenderCreatorCreateSender = /*#__PURE__*/ createWriteContract({
  abi: senderCreatorAbi,
  functionName: 'createSender',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link senderCreatorAbi}__
 */
export const prepareWriteSenderCreator = /*#__PURE__*/ createSimulateContract({
  abi: senderCreatorAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link senderCreatorAbi}__ and `functionName` set to `"createSender"`
 */
export const prepareWriteSenderCreatorCreateSender = /*#__PURE__*/ createSimulateContract({
  abi: senderCreatorAbi,
  functionName: 'createSender',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link testUsdcAbi}__
 */
export const readTestUsdc = /*#__PURE__*/ createReadContract({ abi: testUsdcAbi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"allowance"`
 */
export const readTestUsdcAllowance = /*#__PURE__*/ createReadContract({
  abi: testUsdcAbi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"balanceOf"`
 */
export const readTestUsdcBalanceOf = /*#__PURE__*/ createReadContract({
  abi: testUsdcAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"decimals"`
 */
export const readTestUsdcDecimals = /*#__PURE__*/ createReadContract({
  abi: testUsdcAbi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"name"`
 */
export const readTestUsdcName = /*#__PURE__*/ createReadContract({
  abi: testUsdcAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"symbol"`
 */
export const readTestUsdcSymbol = /*#__PURE__*/ createReadContract({
  abi: testUsdcAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"totalSupply"`
 */
export const readTestUsdcTotalSupply = /*#__PURE__*/ createReadContract({
  abi: testUsdcAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link testUsdcAbi}__
 */
export const writeTestUsdc = /*#__PURE__*/ createWriteContract({ abi: testUsdcAbi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"approve"`
 */
export const writeTestUsdcApprove = /*#__PURE__*/ createWriteContract({
  abi: testUsdcAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"transfer"`
 */
export const writeTestUsdcTransfer = /*#__PURE__*/ createWriteContract({
  abi: testUsdcAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"transferFrom"`
 */
export const writeTestUsdcTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: testUsdcAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link testUsdcAbi}__
 */
export const prepareWriteTestUsdc = /*#__PURE__*/ createSimulateContract({ abi: testUsdcAbi })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"approve"`
 */
export const prepareWriteTestUsdcApprove = /*#__PURE__*/ createSimulateContract({
  abi: testUsdcAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"transfer"`
 */
export const prepareWriteTestUsdcTransfer = /*#__PURE__*/ createSimulateContract({
  abi: testUsdcAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"transferFrom"`
 */
export const prepareWriteTestUsdcTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: testUsdcAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link testUsdcAbi}__
 */
export const watchTestUsdcEvent = /*#__PURE__*/ createWatchContractEvent({ abi: testUsdcAbi })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link testUsdcAbi}__ and `eventName` set to `"Approval"`
 */
export const watchTestUsdcApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: testUsdcAbi,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link testUsdcAbi}__ and `eventName` set to `"Transfer"`
 */
export const watchTestUsdcTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: testUsdcAbi,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const readUsdc = /*#__PURE__*/ createReadContract({ abi: usdcAbi, address: usdcAddress })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const readUsdcAllowance = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const readUsdcBalanceOf = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const readUsdcDecimals = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const readUsdcName = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const readUsdcSymbol = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const readUsdcTotalSupply = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const writeUsdc = /*#__PURE__*/ createWriteContract({ abi: usdcAbi, address: usdcAddress })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const writeUsdcApprove = /*#__PURE__*/ createWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const writeUsdcTransfer = /*#__PURE__*/ createWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const writeUsdcTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const prepareWriteUsdc = /*#__PURE__*/ createSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const prepareWriteUsdcApprove = /*#__PURE__*/ createSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const prepareWriteUsdcTransfer = /*#__PURE__*/ createSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const prepareWriteUsdcTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const watchUsdcEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link usdcAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const watchUsdcApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link usdcAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const watchUsdcTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
  eventName: 'Transfer',
})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountAbi}__
 */
export const useReadDaimoAccount = /*#__PURE__*/ createUseReadContract({ abi: daimoAccountAbi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 */
export const useReadDaimoAccountUpgradeInterfaceVersion = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountAbi,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"entryPoint"`
 */
export const useReadDaimoAccountEntryPoint = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountAbi,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"getActiveSigningKeys"`
 */
export const useReadDaimoAccountGetActiveSigningKeys = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountAbi,
  functionName: 'getActiveSigningKeys',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"isValidSignature"`
 */
export const useReadDaimoAccountIsValidSignature = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountAbi,
  functionName: 'isValidSignature',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"keys"`
 */
export const useReadDaimoAccountKeys = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountAbi,
  functionName: 'keys',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"maxKeys"`
 */
export const useReadDaimoAccountMaxKeys = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountAbi,
  functionName: 'maxKeys',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"numActiveKeys"`
 */
export const useReadDaimoAccountNumActiveKeys = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountAbi,
  functionName: 'numActiveKeys',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const useReadDaimoAccountProxiableUuid = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountAbi,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"verifier"`
 */
export const useReadDaimoAccountVerifier = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountAbi,
  functionName: 'verifier',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountAbi}__
 */
export const useWriteDaimoAccount = /*#__PURE__*/ createUseWriteContract({ abi: daimoAccountAbi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"addSigningKey"`
 */
export const useWriteDaimoAccountAddSigningKey = /*#__PURE__*/ createUseWriteContract({
  abi: daimoAccountAbi,
  functionName: 'addSigningKey',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"executeBatch"`
 */
export const useWriteDaimoAccountExecuteBatch = /*#__PURE__*/ createUseWriteContract({
  abi: daimoAccountAbi,
  functionName: 'executeBatch',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"initialize"`
 */
export const useWriteDaimoAccountInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: daimoAccountAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"removeSigningKey"`
 */
export const useWriteDaimoAccountRemoveSigningKey = /*#__PURE__*/ createUseWriteContract({
  abi: daimoAccountAbi,
  functionName: 'removeSigningKey',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"signatureStruct"`
 */
export const useWriteDaimoAccountSignatureStruct = /*#__PURE__*/ createUseWriteContract({
  abi: daimoAccountAbi,
  functionName: 'signatureStruct',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useWriteDaimoAccountUpgradeToAndCall = /*#__PURE__*/ createUseWriteContract({
  abi: daimoAccountAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"validateUserOp"`
 */
export const useWriteDaimoAccountValidateUserOp = /*#__PURE__*/ createUseWriteContract({
  abi: daimoAccountAbi,
  functionName: 'validateUserOp',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountAbi}__
 */
export const useSimulateDaimoAccount = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"addSigningKey"`
 */
export const useSimulateDaimoAccountAddSigningKey = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'addSigningKey',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"executeBatch"`
 */
export const useSimulateDaimoAccountExecuteBatch = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'executeBatch',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"initialize"`
 */
export const useSimulateDaimoAccountInitialize = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"removeSigningKey"`
 */
export const useSimulateDaimoAccountRemoveSigningKey = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'removeSigningKey',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"signatureStruct"`
 */
export const useSimulateDaimoAccountSignatureStruct = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'signatureStruct',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useSimulateDaimoAccountUpgradeToAndCall = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"validateUserOp"`
 */
export const useSimulateDaimoAccountValidateUserOp = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'validateUserOp',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__
 */
export const useWatchDaimoAccountEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoAccountAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"AccountInitialized"`
 */
export const useWatchDaimoAccountAccountInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoAccountAbi,
    eventName: 'AccountInitialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"Initialized"`
 */
export const useWatchDaimoAccountInitializedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"SigningKeyAdded"`
 */
export const useWatchDaimoAccountSigningKeyAddedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'SigningKeyAdded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"SigningKeyRemoved"`
 */
export const useWatchDaimoAccountSigningKeyRemovedEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: daimoAccountAbi, eventName: 'SigningKeyRemoved' }
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchDaimoAccountUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__
 *
 *
 */
export const useReadDaimoAccountFactory = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"accountImplementation"`
 *
 *
 */
export const useReadDaimoAccountFactoryAccountImplementation = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'accountImplementation',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"entryPoint"`
 *
 *
 */
export const useReadDaimoAccountFactoryEntryPoint = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"getAddress"`
 *
 *
 */
export const useReadDaimoAccountFactoryGetAddress = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'getAddress',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"verifier"`
 *
 *
 */
export const useReadDaimoAccountFactoryVerifier = /*#__PURE__*/ createUseReadContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'verifier',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__
 *
 *
 */
export const useWriteDaimoAccountFactory = /*#__PURE__*/ createUseWriteContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"createAccount"`
 *
 *
 */
export const useWriteDaimoAccountFactoryCreateAccount = /*#__PURE__*/ createUseWriteContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'createAccount',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__
 *
 *
 */
export const useSimulateDaimoAccountFactory = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountFactoryAbi}__ and `functionName` set to `"createAccount"`
 *
 *
 */
export const useSimulateDaimoAccountFactoryCreateAccount = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddress,
  functionName: 'createAccount',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoVerifierAbi}__
 *
 *
 */
export const useReadDaimoVerifier = /*#__PURE__*/ createUseReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 *
 */
export const useReadDaimoVerifierUpgradeInterfaceVersion = /*#__PURE__*/ createUseReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"implementation"`
 *
 *
 */
export const useReadDaimoVerifierImplementation = /*#__PURE__*/ createUseReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'implementation',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"owner"`
 *
 *
 */
export const useReadDaimoVerifierOwner = /*#__PURE__*/ createUseReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 *
 */
export const useReadDaimoVerifierProxiableUuid = /*#__PURE__*/ createUseReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"verifySignature"`
 *
 *
 */
export const useReadDaimoVerifierVerifySignature = /*#__PURE__*/ createUseReadContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'verifySignature',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoVerifierAbi}__
 *
 *
 */
export const useWriteDaimoVerifier = /*#__PURE__*/ createUseWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"init"`
 *
 *
 */
export const useWriteDaimoVerifierInit = /*#__PURE__*/ createUseWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'init',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const useWriteDaimoVerifierRenounceOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useWriteDaimoVerifierTransferOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"upgradeTo"`
 *
 *
 */
export const useWriteDaimoVerifierUpgradeTo = /*#__PURE__*/ createUseWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const useWriteDaimoVerifierUpgradeToAndCall = /*#__PURE__*/ createUseWriteContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__
 *
 *
 */
export const useSimulateDaimoVerifier = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"init"`
 *
 *
 */
export const useSimulateDaimoVerifierInit = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'init',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const useSimulateDaimoVerifierRenounceOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useSimulateDaimoVerifierTransferOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"upgradeTo"`
 *
 *
 */
export const useSimulateDaimoVerifierUpgradeTo = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoVerifierAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const useSimulateDaimoVerifierUpgradeToAndCall = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__
 *
 *
 */
export const useWatchDaimoVerifierEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__ and `eventName` set to `"Initialized"`
 *
 *
 */
export const useWatchDaimoVerifierInitializedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 *
 */
export const useWatchDaimoVerifierOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoVerifierAbi,
    address: daimoVerifierAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__ and `eventName` set to `"Upgraded"`
 *
 *
 */
export const useWatchDaimoVerifierUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoVerifierProxyAbi}__
 *
 *
 */
export const useWatchDaimoVerifierProxyEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoVerifierProxyAbi,
  address: daimoVerifierProxyAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoVerifierProxyAbi}__ and `eventName` set to `"Upgraded"`
 *
 *
 */
export const useWatchDaimoVerifierProxyUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoVerifierProxyAbi,
  address: daimoVerifierProxyAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc165Abi}__
 */
export const useReadErc165 = /*#__PURE__*/ createUseReadContract({ abi: erc165Abi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc165Abi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadErc165SupportsInterface = /*#__PURE__*/ createUseReadContract({
  abi: erc165Abi,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__
 */
export const useWatchErc1967ProxyEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967ProxyAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchErc1967ProxyUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967ProxyAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__
 */
export const useWatchErc1967UtilsEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UtilsAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const useWatchErc1967UtilsAdminChangedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const useWatchErc1967UtilsBeaconUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'BeaconUpgraded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchErc1967UtilsUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useReadErc20 = /*#__PURE__*/ createUseReadContract({ abi: erc20Abi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"allowance"`
 */
export const useReadErc20Allowance = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadErc20BalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"decimals"`
 */
export const useReadErc20Decimals = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"name"`
 */
export const useReadErc20Name = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"symbol"`
 */
export const useReadErc20Symbol = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadErc20TotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useWriteErc20 = /*#__PURE__*/ createUseWriteContract({ abi: erc20Abi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const useWriteErc20Approve = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transfer"`
 */
export const useWriteErc20Transfer = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteErc20TransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useSimulateErc20 = /*#__PURE__*/ createUseSimulateContract({ abi: erc20Abi })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const useSimulateErc20Approve = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateErc20Transfer = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateErc20TransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20Abi}__
 */
export const useWatchErc20Event = /*#__PURE__*/ createUseWatchContractEvent({ abi: erc20Abi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20Abi}__ and `eventName` set to `"Approval"`
 */
export const useWatchErc20ApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc20Abi,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20Abi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchErc20TransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc20Abi,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useReadEntryPoint = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useReadEntryPointBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getDepositInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useReadEntryPointGetDepositInfo = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useReadEntryPointGetNonce = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getUserOpHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useReadEntryPointGetUserOpHash = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPoint = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointAddStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointDelegateAndRevert = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointDepositTo = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointGetSenderAddress = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointHandleAggregatedOps = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointHandleOps = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointIncrementNonce = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointUnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointWithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPoint = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointAddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointDelegateAndRevert = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointDepositTo = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointGetSenderAddress = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointHandleAggregatedOps = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointHandleOps = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointIncrementNonce = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointUnlockStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointWithdrawStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointWithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"AccountDeployed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointAccountDeployedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'AccountDeployed',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"BeforeExecution"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointBeforeExecutionEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'BeforeExecution',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Deposited"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointDepositedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"PostOpRevertReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointPostOpRevertReasonEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'PostOpRevertReason',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointAbi,
    address: entryPointAddress,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeLocked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointStakeLockedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeUnlocked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointStakeUnlockedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeWithdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointStakeWithdrawnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeWithdrawn',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationEvent"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointUserOperationEventEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'UserOperationEvent',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointAbi,
    address: entryPointAddress,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointUserOperationRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointAbi,
    address: entryPointAddress,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Withdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointWithdrawnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const useReadEntryPointSimulations = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"_validateSenderAndPaymaster"`
 */
export const useReadEntryPointSimulationsValidateSenderAndPaymaster =
  /*#__PURE__*/ createUseReadContract({
    abi: entryPointSimulationsAbi,
    functionName: '_validateSenderAndPaymaster',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadEntryPointSimulationsBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"deposits"`
 */
export const useReadEntryPointSimulationsDeposits = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'deposits',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const useReadEntryPointSimulationsGetDepositInfo = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getNonce"`
 */
export const useReadEntryPointSimulationsGetNonce = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const useReadEntryPointSimulationsGetUserOpHash = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"nonceSequenceNumber"`
 */
export const useReadEntryPointSimulationsNonceSequenceNumber = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'nonceSequenceNumber',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadEntryPointSimulationsSupportsInterface = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const useWriteEntryPointSimulations = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const useWriteEntryPointSimulationsAddStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useWriteEntryPointSimulationsDelegateAndRevert = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const useWriteEntryPointSimulationsDepositTo = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useWriteEntryPointSimulationsGetSenderAddress = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useWriteEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createUseWriteContract({
    abi: entryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const useWriteEntryPointSimulationsHandleOps = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useWriteEntryPointSimulationsIncrementNonce = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"innerHandleOp"`
 */
export const useWriteEntryPointSimulationsInnerHandleOp = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'innerHandleOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const useWriteEntryPointSimulationsSimulateHandleOp = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const useWriteEntryPointSimulationsSimulateValidation = /*#__PURE__*/ createUseWriteContract(
  { abi: entryPointSimulationsAbi, functionName: 'simulateValidation' }
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useWriteEntryPointSimulationsUnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useWriteEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useWriteEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const useSimulateEntryPointSimulations = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const useSimulateEntryPointSimulationsAddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useSimulateEntryPointSimulationsDelegateAndRevert =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'delegateAndRevert',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const useSimulateEntryPointSimulationsDepositTo = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useSimulateEntryPointSimulationsGetSenderAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'getSenderAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useSimulateEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const useSimulateEntryPointSimulationsHandleOps = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useSimulateEntryPointSimulationsIncrementNonce =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'incrementNonce',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"innerHandleOp"`
 */
export const useSimulateEntryPointSimulationsInnerHandleOp =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'innerHandleOp',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const useSimulateEntryPointSimulationsSimulateHandleOp =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'simulateHandleOp',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const useSimulateEntryPointSimulationsSimulateValidation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'simulateValidation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useSimulateEntryPointSimulationsUnlockStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useSimulateEntryPointSimulationsWithdrawStake =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'withdrawStake',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useSimulateEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const useWatchEntryPointSimulationsEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const useWatchEntryPointSimulationsAccountDeployedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'AccountDeployed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const useWatchEntryPointSimulationsBeforeExecutionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'BeforeExecution',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"Deposited"`
 */
export const useWatchEntryPointSimulationsDepositedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'Deposited',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const useWatchEntryPointSimulationsPostOpRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'PostOpRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const useWatchEntryPointSimulationsSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const useWatchEntryPointSimulationsStakeLockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'StakeLocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const useWatchEntryPointSimulationsStakeUnlockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'StakeUnlocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const useWatchEntryPointSimulationsStakeWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'StakeWithdrawn',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const useWatchEntryPointSimulationsUserOperationEventEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationEvent',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const useWatchEntryPointSimulationsUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const useWatchEntryPointSimulationsUserOperationRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const useWatchEntryPointSimulationsWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'Withdrawn',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const useReadIEntryPoint = /*#__PURE__*/ createUseReadContract({ abi: iEntryPointAbi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadIEntryPointBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const useReadIEntryPointGetDepositInfo = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getNonce"`
 */
export const useReadIEntryPointGetNonce = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const useReadIEntryPointGetUserOpHash = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const useWriteIEntryPoint = /*#__PURE__*/ createUseWriteContract({ abi: iEntryPointAbi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"addStake"`
 */
export const useWriteIEntryPointAddStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useWriteIEntryPointDelegateAndRevert = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"depositTo"`
 */
export const useWriteIEntryPointDepositTo = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useWriteIEntryPointGetSenderAddress = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useWriteIEntryPointHandleAggregatedOps = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleOps"`
 */
export const useWriteIEntryPointHandleOps = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useWriteIEntryPointIncrementNonce = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useWriteIEntryPointUnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useWriteIEntryPointWithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useWriteIEntryPointWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const useSimulateIEntryPoint = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"addStake"`
 */
export const useSimulateIEntryPointAddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useSimulateIEntryPointDelegateAndRevert = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"depositTo"`
 */
export const useSimulateIEntryPointDepositTo = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useSimulateIEntryPointGetSenderAddress = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useSimulateIEntryPointHandleAggregatedOps = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleOps"`
 */
export const useSimulateIEntryPointHandleOps = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useSimulateIEntryPointIncrementNonce = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useSimulateIEntryPointUnlockStake = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useSimulateIEntryPointWithdrawStake = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useSimulateIEntryPointWithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const useWatchIEntryPointEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const useWatchIEntryPointAccountDeployedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'AccountDeployed',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const useWatchIEntryPointBeforeExecutionEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'BeforeExecution',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"Deposited"`
 */
export const useWatchIEntryPointDepositedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const useWatchIEntryPointPostOpRevertReasonEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: iEntryPointAbi, eventName: 'PostOpRevertReason' }
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const useWatchIEntryPointSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const useWatchIEntryPointStakeLockedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const useWatchIEntryPointStakeUnlockedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const useWatchIEntryPointStakeWithdrawnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeWithdrawn',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const useWatchIEntryPointUserOperationEventEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: iEntryPointAbi, eventName: 'UserOperationEvent' }
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const useWatchIEntryPointUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const useWatchIEntryPointUserOperationRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const useWatchIEntryPointWithdrawnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const useReadIEntryPointSimulations = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadIEntryPointSimulationsBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const useReadIEntryPointSimulationsGetDepositInfo = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getNonce"`
 */
export const useReadIEntryPointSimulationsGetNonce = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const useReadIEntryPointSimulationsGetUserOpHash = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const useWriteIEntryPointSimulations = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const useWriteIEntryPointSimulationsAddStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useWriteIEntryPointSimulationsDelegateAndRevert = /*#__PURE__*/ createUseWriteContract(
  { abi: iEntryPointSimulationsAbi, functionName: 'delegateAndRevert' }
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const useWriteIEntryPointSimulationsDepositTo = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useWriteIEntryPointSimulationsGetSenderAddress = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useWriteIEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createUseWriteContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const useWriteIEntryPointSimulationsHandleOps = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useWriteIEntryPointSimulationsIncrementNonce = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const useWriteIEntryPointSimulationsSimulateHandleOp = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const useWriteIEntryPointSimulationsSimulateValidation =
  /*#__PURE__*/ createUseWriteContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'simulateValidation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useWriteIEntryPointSimulationsUnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useWriteIEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useWriteIEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const useSimulateIEntryPointSimulations = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const useSimulateIEntryPointSimulationsAddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useSimulateIEntryPointSimulationsDelegateAndRevert =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'delegateAndRevert',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const useSimulateIEntryPointSimulationsDepositTo = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useSimulateIEntryPointSimulationsGetSenderAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'getSenderAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useSimulateIEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const useSimulateIEntryPointSimulationsHandleOps = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useSimulateIEntryPointSimulationsIncrementNonce =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'incrementNonce',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const useSimulateIEntryPointSimulationsSimulateHandleOp =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'simulateHandleOp',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const useSimulateIEntryPointSimulationsSimulateValidation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'simulateValidation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useSimulateIEntryPointSimulationsUnlockStake = /*#__PURE__*/ createUseSimulateContract(
  { abi: iEntryPointSimulationsAbi, functionName: 'unlockStake' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useSimulateIEntryPointSimulationsWithdrawStake =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'withdrawStake',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useSimulateIEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const useWatchIEntryPointSimulationsEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const useWatchIEntryPointSimulationsAccountDeployedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'AccountDeployed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const useWatchIEntryPointSimulationsBeforeExecutionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'BeforeExecution',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"Deposited"`
 */
export const useWatchIEntryPointSimulationsDepositedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'Deposited',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const useWatchIEntryPointSimulationsPostOpRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'PostOpRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const useWatchIEntryPointSimulationsSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const useWatchIEntryPointSimulationsStakeLockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'StakeLocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const useWatchIEntryPointSimulationsStakeUnlockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'StakeUnlocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const useWatchIEntryPointSimulationsStakeWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'StakeWithdrawn',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const useWatchIEntryPointSimulationsUserOperationEventEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationEvent',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const useWatchIEntryPointSimulationsUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const useWatchIEntryPointSimulationsUserOperationRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const useWatchIEntryPointSimulationsWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'Withdrawn',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDrop = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"isClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropIsClaimed = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'isClaimed',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"merkleRoots"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropMerkleRoots = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'merkleRoots',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropOwner = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"token"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropToken = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'token',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheActive"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropTrancheActive = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheActive',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmount"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropTrancheAmount = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmount',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmountClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropTrancheAmountClaimed = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmountClaimed',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmounts"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropTrancheAmounts = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmounts',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmountsClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropTrancheAmountsClaimed = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmountsClaimed',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheCursor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropTrancheCursor = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheCursor',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"verifyClaim"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useReadSendMerkleDropVerifyClaim = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'verifyClaim',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWriteSendMerkleDrop = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"addTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWriteSendMerkleDropAddTranche = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'addTranche',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWriteSendMerkleDropClaimTranche = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranche',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranches"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWriteSendMerkleDropClaimTranches = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranches',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"expireTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWriteSendMerkleDropExpireTranche = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'expireTranche',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWriteSendMerkleDropRenounceOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWriteSendMerkleDropTransferOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWriteSendMerkleDropTransferToken = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWriteSendMerkleDropWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useSimulateSendMerkleDrop = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"addTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useSimulateSendMerkleDropAddTranche = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'addTranche',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useSimulateSendMerkleDropClaimTranche = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranche',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranches"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useSimulateSendMerkleDropClaimTranches = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranches',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"expireTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useSimulateSendMerkleDropExpireTranche = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'expireTranche',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useSimulateSendMerkleDropRenounceOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useSimulateSendMerkleDropTransferOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useSimulateSendMerkleDropTransferToken = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useSimulateSendMerkleDropWithdraw = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWatchSendMerkleDropEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"Claimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWatchSendMerkleDropClaimedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'Claimed',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWatchSendMerkleDropOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: sendMerkleDropAbi,
    address: sendMerkleDropAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"TrancheAdded"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWatchSendMerkleDropTrancheAddedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'TrancheAdded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"TrancheExpired"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const useWatchSendMerkleDropTrancheExpiredEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'TrancheExpired',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendToken = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenAllowance = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenDecimals = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenName = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenSymbol = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendToken = /*#__PURE__*/ createUseWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendTokenApprove = /*#__PURE__*/ createUseWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendTokenTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendTokenTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendToken = /*#__PURE__*/ createUseSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendTokenApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendTokenTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendTokenTransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWatchSendTokenEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWatchSendTokenApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWatchSendTokenTransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link senderCreatorAbi}__
 */
export const useWriteSenderCreator = /*#__PURE__*/ createUseWriteContract({ abi: senderCreatorAbi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link senderCreatorAbi}__ and `functionName` set to `"createSender"`
 */
export const useWriteSenderCreatorCreateSender = /*#__PURE__*/ createUseWriteContract({
  abi: senderCreatorAbi,
  functionName: 'createSender',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link senderCreatorAbi}__
 */
export const useSimulateSenderCreator = /*#__PURE__*/ createUseSimulateContract({
  abi: senderCreatorAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link senderCreatorAbi}__ and `functionName` set to `"createSender"`
 */
export const useSimulateSenderCreatorCreateSender = /*#__PURE__*/ createUseSimulateContract({
  abi: senderCreatorAbi,
  functionName: 'createSender',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link testUsdcAbi}__
 */
export const useReadTestUsdc = /*#__PURE__*/ createUseReadContract({ abi: testUsdcAbi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"allowance"`
 */
export const useReadTestUsdcAllowance = /*#__PURE__*/ createUseReadContract({
  abi: testUsdcAbi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadTestUsdcBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: testUsdcAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"decimals"`
 */
export const useReadTestUsdcDecimals = /*#__PURE__*/ createUseReadContract({
  abi: testUsdcAbi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"name"`
 */
export const useReadTestUsdcName = /*#__PURE__*/ createUseReadContract({
  abi: testUsdcAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadTestUsdcSymbol = /*#__PURE__*/ createUseReadContract({
  abi: testUsdcAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadTestUsdcTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: testUsdcAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link testUsdcAbi}__
 */
export const useWriteTestUsdc = /*#__PURE__*/ createUseWriteContract({ abi: testUsdcAbi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteTestUsdcApprove = /*#__PURE__*/ createUseWriteContract({
  abi: testUsdcAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"transfer"`
 */
export const useWriteTestUsdcTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: testUsdcAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteTestUsdcTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: testUsdcAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link testUsdcAbi}__
 */
export const useSimulateTestUsdc = /*#__PURE__*/ createUseSimulateContract({ abi: testUsdcAbi })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateTestUsdcApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: testUsdcAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateTestUsdcTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: testUsdcAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateTestUsdcTransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: testUsdcAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link testUsdcAbi}__
 */
export const useWatchTestUsdcEvent = /*#__PURE__*/ createUseWatchContractEvent({ abi: testUsdcAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link testUsdcAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchTestUsdcApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: testUsdcAbi,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link testUsdcAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchTestUsdcTransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: testUsdcAbi,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useReadUsdc = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useReadUsdcAllowance = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useReadUsdcBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useReadUsdcDecimals = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useReadUsdcName = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useReadUsdcSymbol = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useReadUsdcTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useWriteUsdc = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useWriteUsdcApprove = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useWriteUsdcTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useWriteUsdcTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useSimulateUsdc = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useSimulateUsdcApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useSimulateUsdcTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useSimulateUsdcTransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useWatchUsdcEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdcAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useWatchUsdcApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdcAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 */
export const useWatchUsdcTransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
  eventName: 'Transfer',
})
