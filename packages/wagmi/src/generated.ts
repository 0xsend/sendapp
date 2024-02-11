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
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
    inputs: [{ name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }],
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
  845337: '0x754ADB349777994F666A788a6bbE4B9DDEBED6A8',
} as const

/**
 *
 */
export const daimoAccountFactoryConfig = {
  address: daimoAccountFactoryAddress,
  abi: daimoAccountFactoryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoEphemeralNotes
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoEphemeralNotesAbi = [
  {
    type: 'constructor',
    inputs: [{ name: '_token', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_ephemeralOwner', internalType: 'address', type: 'address' },
      { name: '_signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'claimNote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_ephemeralOwner', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createNote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'notes',
    outputs: [
      { name: 'ephemeralOwner', internalType: 'address', type: 'address' },
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'note',
        internalType: 'struct Note',
        type: 'tuple',
        components: [
          { name: 'ephemeralOwner', internalType: 'address', type: 'address' },
          { name: 'from', internalType: 'address', type: 'address' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
    ],
    name: 'NoteCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'note',
        internalType: 'struct Note',
        type: 'tuple',
        components: [
          { name: 'ephemeralOwner', internalType: 'address', type: 'address' },
          { name: 'from', internalType: 'address', type: 'address' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
      { name: 'redeemer', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'NoteRedeemed',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoEphemeralNotesV2
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoEphemeralNotesV2Abi = [
  {
    type: 'constructor',
    inputs: [{ name: '_token', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_ephemeralOwner', internalType: 'address', type: 'address' },
      { name: 'recipient', internalType: 'address', type: 'address' },
      { name: '_signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'claimNoteRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_ephemeralOwner', internalType: 'address', type: 'address' }],
    name: 'claimNoteSelf',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_ephemeralOwner', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createNote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'notes',
    outputs: [
      { name: 'ephemeralOwner', internalType: 'address', type: 'address' },
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'note',
        internalType: 'struct Note',
        type: 'tuple',
        components: [
          { name: 'ephemeralOwner', internalType: 'address', type: 'address' },
          { name: 'from', internalType: 'address', type: 'address' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
    ],
    name: 'NoteCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'note',
        internalType: 'struct Note',
        type: 'tuple',
        components: [
          { name: 'ephemeralOwner', internalType: 'address', type: 'address' },
          { name: 'from', internalType: 'address', type: 'address' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
      { name: 'redeemer', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'NoteRedeemed',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoNameRegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoNameRegistryAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [
      { name: 'name', internalType: 'bytes32', type: 'bytes32' },
      { name: 'addr', internalType: 'address', type: 'address' },
    ],
    name: 'forceRegister',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [
      { name: 'name', internalType: 'bytes32', type: 'bytes32' },
      { name: 'addr', internalType: 'address', type: 'address' },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'name', internalType: 'bytes32', type: 'bytes32' }],
    name: 'registerSelf',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [{ name: 'name', internalType: 'bytes32', type: 'bytes32' }],
    name: 'resolveAddr',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'addr', internalType: 'address', type: 'address' }],
    name: 'resolveName',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
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
    inputs: [{ name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }],
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
    inputs: [
      { name: 'name', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'addr', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'Registered',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoNameRegistryProxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoNameRegistryProxyAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_logic', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  { type: 'receive', stateMutability: 'payable' },
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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoPaymasterV2
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoPaymasterV2Abi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
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
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'bundlerWhitelist',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  { type: 'function', inputs: [], name: 'deposit', outputs: [], stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getDeposit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'metaPaymaster',
    outputs: [{ name: '', internalType: 'contract IMetaPaymaster', type: 'address' }],
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
    inputs: [
      { name: 'mode', internalType: 'enum IPaymaster.PostOpMode', type: 'uint8' },
      { name: 'context', internalType: 'bytes', type: 'bytes' },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'postOp',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [
      { name: 'addresses', internalType: 'address[]', type: 'address[]' },
      { name: 'isWhitelisted', internalType: 'bool', type: 'bool' },
    ],
    name: 'setBundlerWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_metaPaymaster', internalType: 'contract IMetaPaymaster', type: 'address' }],
    name: 'setMetaPaymaster',
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
  { type: 'function', inputs: [], name: 'unlockStake', outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'maxCost', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'validatePaymasterUserOp',
    outputs: [
      { name: 'context', internalType: 'bytes', type: 'bytes' },
      { name: 'validationData', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
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
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'requiredPreFund', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationSponsored',
  },
] as const

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
    inputs: [{ name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }],
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
] as const

/**
 *
 */
export const daimoVerifierAddress = {
  845337: '0x63637Dd8e9586eA50a28b117bc9ce9E5f17984a2',
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
  { type: 'receive', stateMutability: 'payable' },
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
] as const

/**
 *
 */
export const daimoVerifierProxyAddress = {
  845337: '0x5F0Fd3e14e41E31890BeE3740A14e51A23129706',
} as const

/**
 *
 */
export const daimoVerifierProxyConfig = {
  address: daimoVerifierProxyAddress,
  abi: daimoVerifierProxyAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Proxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967ProxyAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_logic', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'payable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  { type: 'receive', stateMutability: 'payable' },
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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Upgrade
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967UpgradeAbi = [
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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20Abi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'name_', internalType: 'string', type: 'string' },
      { name: 'symbol_', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'nonpayable',
  },
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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
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
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC20Snapshot
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20SnapshotAbi = [
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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
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
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'snapshotId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'balanceOfAt',
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
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
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
    inputs: [{ name: 'snapshotId', internalType: 'uint256', type: 'uint256' }],
    name: 'totalSupplyAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
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
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256', indexed: false }],
    name: 'Snapshot',
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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EntryPoint
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
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
          { name: 'deposit', internalType: 'uint112', type: 'uint112' },
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
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
            internalType: 'struct UserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
              { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
        internalType: 'struct UserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'targetCallData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateHandleOp',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'simulateValidation',
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
      { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
      { name: 'paid', internalType: 'uint256', type: 'uint256' },
      { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
      { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
      { name: 'targetSuccess', internalType: 'bool', type: 'bool' },
      { name: 'targetResult', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'ExecutionResult',
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
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'returnInfo',
        internalType: 'struct IEntryPoint.ReturnInfo',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'sigFailed', internalType: 'bool', type: 'bool' },
          { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
          { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
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
    ],
    name: 'ValidationResult',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'returnInfo',
        internalType: 'struct IEntryPoint.ReturnInfo',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'sigFailed', internalType: 'bool', type: 'bool' },
          { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
          { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
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
    name: 'ValidationResultWithAggregation',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const entryPointAddress = {
  1: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  1337: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  8008: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  8453: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  84532: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  845337: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const entryPointConfig = { address: entryPointAddress, abi: entryPointAbi } as const

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
          { name: 'deposit', internalType: 'uint112', type: 'uint112' },
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
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
            internalType: 'struct UserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
              { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
        internalType: 'struct UserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'targetCallData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateHandleOp',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'simulateValidation',
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
      { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
      { name: 'paid', internalType: 'uint256', type: 'uint256' },
      { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
      { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
      { name: 'targetSuccess', internalType: 'bool', type: 'bool' },
      { name: 'targetResult', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'ExecutionResult',
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
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'returnInfo',
        internalType: 'struct IEntryPoint.ReturnInfo',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'sigFailed', internalType: 'bool', type: 'bool' },
          { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
          { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
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
    ],
    name: 'ValidationResult',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'returnInfo',
        internalType: 'struct IEntryPoint.ReturnInfo',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'sigFailed', internalType: 'bool', type: 'bool' },
          { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
          { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
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
    name: 'ValidationResultWithAggregation',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMetaPaymaster
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iMetaPaymasterAbi = [
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'fund',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Send
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const sendAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'multisig', internalType: 'address', type: 'address' },
      { name: 'manager', internalType: 'address', type: 'address' },
      { name: 'knownBots', internalType: 'address[]', type: 'address[]' },
      { name: 'initialMaxBuy', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: '_botDefence',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: '_botDefenceActivatedOnce',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: '_knownBots',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: '_manager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: '_maxBuy',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: '_multisig',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: '_totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'activateBotDefenceOnce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_spender', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approveToken',
    outputs: [],
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
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'snapshotId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'balanceOfAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_newManager', internalType: 'address', type: 'address' }],
    name: 'changeOwner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'createSnapshot',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'deactivateBotDefence',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getLatestSnapshot',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_newMaxBuy', internalType: 'uint256', type: 'uint256' }],
    name: 'modifyMaxBuy',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [{ name: '_bots', internalType: 'address[]', type: 'address[]' }],
    name: 'removeBots',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [{ name: 'snapshotId', internalType: 'uint256', type: 'uint256' }],
    name: 'totalSupplyAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_transferFrom', internalType: 'address', type: 'address' },
      { name: '_transferTo', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferTokenFrom',
    outputs: [],
    stateMutability: 'nonpayable',
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
      { name: 'owner', internalType: 'address', type: 'address', indexed: true },
      { name: 'spender', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256', indexed: false }],
    name: 'Snapshot',
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
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const sendAddress = {
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
export const sendConfig = { address: sendAddress, abi: sendAbi } as const

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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
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
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
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
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
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
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const writeDaimoAccountUpgradeTo = /*#__PURE__*/ createWriteContract({
  abi: daimoAccountAbi,
  functionName: 'upgradeTo',
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
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const prepareWriteDaimoAccountUpgradeTo = /*#__PURE__*/ createSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'upgradeTo',
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
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const watchDaimoAccountAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const watchDaimoAccountBeaconUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'BeaconUpgraded',
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
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__
 */
export const readDaimoEphemeralNotes = /*#__PURE__*/ createReadContract({
  abi: daimoEphemeralNotesAbi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"notes"`
 */
export const readDaimoEphemeralNotesNotes = /*#__PURE__*/ createReadContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'notes',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"token"`
 */
export const readDaimoEphemeralNotesToken = /*#__PURE__*/ createReadContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'token',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__
 */
export const writeDaimoEphemeralNotes = /*#__PURE__*/ createWriteContract({
  abi: daimoEphemeralNotesAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"claimNote"`
 */
export const writeDaimoEphemeralNotesClaimNote = /*#__PURE__*/ createWriteContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'claimNote',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"createNote"`
 */
export const writeDaimoEphemeralNotesCreateNote = /*#__PURE__*/ createWriteContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'createNote',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__
 */
export const prepareWriteDaimoEphemeralNotes = /*#__PURE__*/ createSimulateContract({
  abi: daimoEphemeralNotesAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"claimNote"`
 */
export const prepareWriteDaimoEphemeralNotesClaimNote = /*#__PURE__*/ createSimulateContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'claimNote',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"createNote"`
 */
export const prepareWriteDaimoEphemeralNotesCreateNote = /*#__PURE__*/ createSimulateContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'createNote',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__
 */
export const watchDaimoEphemeralNotesEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoEphemeralNotesAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `eventName` set to `"NoteCreated"`
 */
export const watchDaimoEphemeralNotesNoteCreatedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoEphemeralNotesAbi,
  eventName: 'NoteCreated',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `eventName` set to `"NoteRedeemed"`
 */
export const watchDaimoEphemeralNotesNoteRedeemedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoEphemeralNotesAbi,
  eventName: 'NoteRedeemed',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__
 */
export const readDaimoEphemeralNotesV2 = /*#__PURE__*/ createReadContract({
  abi: daimoEphemeralNotesV2Abi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"notes"`
 */
export const readDaimoEphemeralNotesV2Notes = /*#__PURE__*/ createReadContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'notes',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"token"`
 */
export const readDaimoEphemeralNotesV2Token = /*#__PURE__*/ createReadContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'token',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__
 */
export const writeDaimoEphemeralNotesV2 = /*#__PURE__*/ createWriteContract({
  abi: daimoEphemeralNotesV2Abi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"claimNoteRecipient"`
 */
export const writeDaimoEphemeralNotesV2ClaimNoteRecipient = /*#__PURE__*/ createWriteContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'claimNoteRecipient',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"claimNoteSelf"`
 */
export const writeDaimoEphemeralNotesV2ClaimNoteSelf = /*#__PURE__*/ createWriteContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'claimNoteSelf',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"createNote"`
 */
export const writeDaimoEphemeralNotesV2CreateNote = /*#__PURE__*/ createWriteContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'createNote',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__
 */
export const prepareWriteDaimoEphemeralNotesV2 = /*#__PURE__*/ createSimulateContract({
  abi: daimoEphemeralNotesV2Abi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"claimNoteRecipient"`
 */
export const prepareWriteDaimoEphemeralNotesV2ClaimNoteRecipient =
  /*#__PURE__*/ createSimulateContract({
    abi: daimoEphemeralNotesV2Abi,
    functionName: 'claimNoteRecipient',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"claimNoteSelf"`
 */
export const prepareWriteDaimoEphemeralNotesV2ClaimNoteSelf = /*#__PURE__*/ createSimulateContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'claimNoteSelf',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"createNote"`
 */
export const prepareWriteDaimoEphemeralNotesV2CreateNote = /*#__PURE__*/ createSimulateContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'createNote',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__
 */
export const watchDaimoEphemeralNotesV2Event = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoEphemeralNotesV2Abi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `eventName` set to `"NoteCreated"`
 */
export const watchDaimoEphemeralNotesV2NoteCreatedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoEphemeralNotesV2Abi,
  eventName: 'NoteCreated',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `eventName` set to `"NoteRedeemed"`
 */
export const watchDaimoEphemeralNotesV2NoteRedeemedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoEphemeralNotesV2Abi,
  eventName: 'NoteRedeemed',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__
 */
export const readDaimoNameRegistry = /*#__PURE__*/ createReadContract({ abi: daimoNameRegistryAbi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"implementation"`
 */
export const readDaimoNameRegistryImplementation = /*#__PURE__*/ createReadContract({
  abi: daimoNameRegistryAbi,
  functionName: 'implementation',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"owner"`
 */
export const readDaimoNameRegistryOwner = /*#__PURE__*/ createReadContract({
  abi: daimoNameRegistryAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const readDaimoNameRegistryProxiableUuid = /*#__PURE__*/ createReadContract({
  abi: daimoNameRegistryAbi,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"resolveAddr"`
 */
export const readDaimoNameRegistryResolveAddr = /*#__PURE__*/ createReadContract({
  abi: daimoNameRegistryAbi,
  functionName: 'resolveAddr',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"resolveName"`
 */
export const readDaimoNameRegistryResolveName = /*#__PURE__*/ createReadContract({
  abi: daimoNameRegistryAbi,
  functionName: 'resolveName',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__
 */
export const writeDaimoNameRegistry = /*#__PURE__*/ createWriteContract({
  abi: daimoNameRegistryAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"forceRegister"`
 */
export const writeDaimoNameRegistryForceRegister = /*#__PURE__*/ createWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'forceRegister',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"init"`
 */
export const writeDaimoNameRegistryInit = /*#__PURE__*/ createWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'init',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"register"`
 */
export const writeDaimoNameRegistryRegister = /*#__PURE__*/ createWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'register',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"registerSelf"`
 */
export const writeDaimoNameRegistryRegisterSelf = /*#__PURE__*/ createWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'registerSelf',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const writeDaimoNameRegistryRenounceOwnership = /*#__PURE__*/ createWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const writeDaimoNameRegistryTransferOwnership = /*#__PURE__*/ createWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const writeDaimoNameRegistryUpgradeTo = /*#__PURE__*/ createWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const writeDaimoNameRegistryUpgradeToAndCall = /*#__PURE__*/ createWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__
 */
export const prepareWriteDaimoNameRegistry = /*#__PURE__*/ createSimulateContract({
  abi: daimoNameRegistryAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"forceRegister"`
 */
export const prepareWriteDaimoNameRegistryForceRegister = /*#__PURE__*/ createSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'forceRegister',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"init"`
 */
export const prepareWriteDaimoNameRegistryInit = /*#__PURE__*/ createSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'init',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"register"`
 */
export const prepareWriteDaimoNameRegistryRegister = /*#__PURE__*/ createSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'register',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"registerSelf"`
 */
export const prepareWriteDaimoNameRegistryRegisterSelf = /*#__PURE__*/ createSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'registerSelf',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const prepareWriteDaimoNameRegistryRenounceOwnership = /*#__PURE__*/ createSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const prepareWriteDaimoNameRegistryTransferOwnership = /*#__PURE__*/ createSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const prepareWriteDaimoNameRegistryUpgradeTo = /*#__PURE__*/ createSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const prepareWriteDaimoNameRegistryUpgradeToAndCall = /*#__PURE__*/ createSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__
 */
export const watchDaimoNameRegistryEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoNameRegistryAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const watchDaimoNameRegistryAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoNameRegistryAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const watchDaimoNameRegistryBeaconUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoNameRegistryAbi,
  eventName: 'BeaconUpgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"Initialized"`
 */
export const watchDaimoNameRegistryInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoNameRegistryAbi,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const watchDaimoNameRegistryOwnershipTransferredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: daimoNameRegistryAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"Registered"`
 */
export const watchDaimoNameRegistryRegisteredEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoNameRegistryAbi,
  eventName: 'Registered',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchDaimoNameRegistryUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoNameRegistryAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryProxyAbi}__
 */
export const watchDaimoNameRegistryProxyEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoNameRegistryProxyAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryProxyAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const watchDaimoNameRegistryProxyAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoNameRegistryProxyAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryProxyAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const watchDaimoNameRegistryProxyBeaconUpgradedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: daimoNameRegistryProxyAbi,
    eventName: 'BeaconUpgraded',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoNameRegistryProxyAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchDaimoNameRegistryProxyUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoNameRegistryProxyAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__
 */
export const readDaimoPaymasterV2 = /*#__PURE__*/ createReadContract({ abi: daimoPaymasterV2Abi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"bundlerWhitelist"`
 */
export const readDaimoPaymasterV2BundlerWhitelist = /*#__PURE__*/ createReadContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'bundlerWhitelist',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"entryPoint"`
 */
export const readDaimoPaymasterV2EntryPoint = /*#__PURE__*/ createReadContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"getDeposit"`
 */
export const readDaimoPaymasterV2GetDeposit = /*#__PURE__*/ createReadContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'getDeposit',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"metaPaymaster"`
 */
export const readDaimoPaymasterV2MetaPaymaster = /*#__PURE__*/ createReadContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'metaPaymaster',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"owner"`
 */
export const readDaimoPaymasterV2Owner = /*#__PURE__*/ createReadContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'owner',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__
 */
export const writeDaimoPaymasterV2 = /*#__PURE__*/ createWriteContract({ abi: daimoPaymasterV2Abi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"addStake"`
 */
export const writeDaimoPaymasterV2AddStake = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"deposit"`
 */
export const writeDaimoPaymasterV2Deposit = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"postOp"`
 */
export const writeDaimoPaymasterV2PostOp = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'postOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"renounceOwnership"`
 */
export const writeDaimoPaymasterV2RenounceOwnership = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"setBundlerWhitelist"`
 */
export const writeDaimoPaymasterV2SetBundlerWhitelist = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'setBundlerWhitelist',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"setMetaPaymaster"`
 */
export const writeDaimoPaymasterV2SetMetaPaymaster = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'setMetaPaymaster',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"transferOwnership"`
 */
export const writeDaimoPaymasterV2TransferOwnership = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"unlockStake"`
 */
export const writeDaimoPaymasterV2UnlockStake = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"validatePaymasterUserOp"`
 */
export const writeDaimoPaymasterV2ValidatePaymasterUserOp = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'validatePaymasterUserOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"withdrawStake"`
 */
export const writeDaimoPaymasterV2WithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"withdrawTo"`
 */
export const writeDaimoPaymasterV2WithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__
 */
export const prepareWriteDaimoPaymasterV2 = /*#__PURE__*/ createSimulateContract({
  abi: daimoPaymasterV2Abi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"addStake"`
 */
export const prepareWriteDaimoPaymasterV2AddStake = /*#__PURE__*/ createSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"deposit"`
 */
export const prepareWriteDaimoPaymasterV2Deposit = /*#__PURE__*/ createSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"postOp"`
 */
export const prepareWriteDaimoPaymasterV2PostOp = /*#__PURE__*/ createSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'postOp',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"renounceOwnership"`
 */
export const prepareWriteDaimoPaymasterV2RenounceOwnership = /*#__PURE__*/ createSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"setBundlerWhitelist"`
 */
export const prepareWriteDaimoPaymasterV2SetBundlerWhitelist = /*#__PURE__*/ createSimulateContract(
  { abi: daimoPaymasterV2Abi, functionName: 'setBundlerWhitelist' }
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"setMetaPaymaster"`
 */
export const prepareWriteDaimoPaymasterV2SetMetaPaymaster = /*#__PURE__*/ createSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'setMetaPaymaster',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"transferOwnership"`
 */
export const prepareWriteDaimoPaymasterV2TransferOwnership = /*#__PURE__*/ createSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"unlockStake"`
 */
export const prepareWriteDaimoPaymasterV2UnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"validatePaymasterUserOp"`
 */
export const prepareWriteDaimoPaymasterV2ValidatePaymasterUserOp =
  /*#__PURE__*/ createSimulateContract({
    abi: daimoPaymasterV2Abi,
    functionName: 'validatePaymasterUserOp',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"withdrawStake"`
 */
export const prepareWriteDaimoPaymasterV2WithdrawStake = /*#__PURE__*/ createSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"withdrawTo"`
 */
export const prepareWriteDaimoPaymasterV2WithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoPaymasterV2Abi}__
 */
export const watchDaimoPaymasterV2Event = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoPaymasterV2Abi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const watchDaimoPaymasterV2OwnershipTransferredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: daimoPaymasterV2Abi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `eventName` set to `"UserOperationSponsored"`
 */
export const watchDaimoPaymasterV2UserOperationSponsoredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: daimoPaymasterV2Abi,
    eventName: 'UserOperationSponsored',
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
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__ and `eventName` set to `"AdminChanged"`
 *
 *
 */
export const watchDaimoVerifierAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__ and `eventName` set to `"BeaconUpgraded"`
 *
 *
 */
export const watchDaimoVerifierBeaconUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  eventName: 'BeaconUpgraded',
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
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoVerifierProxyAbi}__ and `eventName` set to `"AdminChanged"`
 *
 *
 */
export const watchDaimoVerifierProxyAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoVerifierProxyAbi,
  address: daimoVerifierProxyAddress,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link daimoVerifierProxyAbi}__ and `eventName` set to `"BeaconUpgraded"`
 *
 *
 */
export const watchDaimoVerifierProxyBeaconUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: daimoVerifierProxyAbi,
  address: daimoVerifierProxyAddress,
  eventName: 'BeaconUpgraded',
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
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__
 */
export const watchErc1967ProxyEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967ProxyAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const watchErc1967ProxyAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967ProxyAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const watchErc1967ProxyBeaconUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967ProxyAbi,
  eventName: 'BeaconUpgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchErc1967ProxyUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967ProxyAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UpgradeAbi}__
 */
export const watchErc1967UpgradeEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UpgradeAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UpgradeAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const watchErc1967UpgradeAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UpgradeAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UpgradeAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const watchErc1967UpgradeBeaconUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UpgradeAbi,
  eventName: 'BeaconUpgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UpgradeAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchErc1967UpgradeUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UpgradeAbi,
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
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const writeErc20DecreaseAllowance = /*#__PURE__*/ createWriteContract({
  abi: erc20Abi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"increaseAllowance"`
 */
export const writeErc20IncreaseAllowance = /*#__PURE__*/ createWriteContract({
  abi: erc20Abi,
  functionName: 'increaseAllowance',
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
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const prepareWriteErc20DecreaseAllowance = /*#__PURE__*/ createSimulateContract({
  abi: erc20Abi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"increaseAllowance"`
 */
export const prepareWriteErc20IncreaseAllowance = /*#__PURE__*/ createSimulateContract({
  abi: erc20Abi,
  functionName: 'increaseAllowance',
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
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotAbi}__
 */
export const readErc20Snapshot = /*#__PURE__*/ createReadContract({ abi: erc20SnapshotAbi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"allowance"`
 */
export const readErc20SnapshotAllowance = /*#__PURE__*/ createReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"balanceOf"`
 */
export const readErc20SnapshotBalanceOf = /*#__PURE__*/ createReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"balanceOfAt"`
 */
export const readErc20SnapshotBalanceOfAt = /*#__PURE__*/ createReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'balanceOfAt',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"decimals"`
 */
export const readErc20SnapshotDecimals = /*#__PURE__*/ createReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"name"`
 */
export const readErc20SnapshotName = /*#__PURE__*/ createReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"symbol"`
 */
export const readErc20SnapshotSymbol = /*#__PURE__*/ createReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"totalSupply"`
 */
export const readErc20SnapshotTotalSupply = /*#__PURE__*/ createReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"totalSupplyAt"`
 */
export const readErc20SnapshotTotalSupplyAt = /*#__PURE__*/ createReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'totalSupplyAt',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20SnapshotAbi}__
 */
export const writeErc20Snapshot = /*#__PURE__*/ createWriteContract({ abi: erc20SnapshotAbi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"approve"`
 */
export const writeErc20SnapshotApprove = /*#__PURE__*/ createWriteContract({
  abi: erc20SnapshotAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const writeErc20SnapshotDecreaseAllowance = /*#__PURE__*/ createWriteContract({
  abi: erc20SnapshotAbi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"increaseAllowance"`
 */
export const writeErc20SnapshotIncreaseAllowance = /*#__PURE__*/ createWriteContract({
  abi: erc20SnapshotAbi,
  functionName: 'increaseAllowance',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"transfer"`
 */
export const writeErc20SnapshotTransfer = /*#__PURE__*/ createWriteContract({
  abi: erc20SnapshotAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"transferFrom"`
 */
export const writeErc20SnapshotTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: erc20SnapshotAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__
 */
export const prepareWriteErc20Snapshot = /*#__PURE__*/ createSimulateContract({
  abi: erc20SnapshotAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"approve"`
 */
export const prepareWriteErc20SnapshotApprove = /*#__PURE__*/ createSimulateContract({
  abi: erc20SnapshotAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const prepareWriteErc20SnapshotDecreaseAllowance = /*#__PURE__*/ createSimulateContract({
  abi: erc20SnapshotAbi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"increaseAllowance"`
 */
export const prepareWriteErc20SnapshotIncreaseAllowance = /*#__PURE__*/ createSimulateContract({
  abi: erc20SnapshotAbi,
  functionName: 'increaseAllowance',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"transfer"`
 */
export const prepareWriteErc20SnapshotTransfer = /*#__PURE__*/ createSimulateContract({
  abi: erc20SnapshotAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"transferFrom"`
 */
export const prepareWriteErc20SnapshotTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: erc20SnapshotAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc20SnapshotAbi}__
 */
export const watchErc20SnapshotEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc20SnapshotAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `eventName` set to `"Approval"`
 */
export const watchErc20SnapshotApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc20SnapshotAbi,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `eventName` set to `"Snapshot"`
 */
export const watchErc20SnapshotSnapshotEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc20SnapshotAbi,
  eventName: 'Snapshot',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `eventName` set to `"Transfer"`
 */
export const watchErc20SnapshotTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc20SnapshotAbi,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const readEntryPoint = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const readEntryPointBalanceOf = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getDepositInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const readEntryPointGetDepositInfo = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const readEntryPointGetNonce = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getUserOpHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const readEntryPointGetUserOpHash = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPoint = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointAddStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointDepositTo = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointGetSenderAddress = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointHandleAggregatedOps = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointHandleOps = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointIncrementNonce = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"simulateHandleOp"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointSimulateHandleOp = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"simulateValidation"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointSimulateValidation = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'simulateValidation',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointUnlockStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointWithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const writeEntryPointWithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPoint = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointAddStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointDepositTo = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointGetSenderAddress = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointHandleAggregatedOps = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointHandleOps = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointIncrementNonce = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"simulateHandleOp"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointSimulateHandleOp = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"simulateValidation"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointSimulateValidation = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'simulateValidation',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointUnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointWithdrawStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const prepareWriteEntryPointWithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const watchEntryPointEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"AccountDeployed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const watchEntryPointAccountDeployedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'AccountDeployed',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"BeforeExecution"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const watchEntryPointBeforeExecutionEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'BeforeExecution',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Deposited"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const watchEntryPointDepositedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const watchEntryPointStakeLockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeUnlocked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const watchEntryPointStakeUnlockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeWithdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const watchEntryPointStakeWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeWithdrawn',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationEvent"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const watchEntryPointUserOperationEventEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'UserOperationEvent',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const watchEntryPointUserOperationRevertReasonEvent = /*#__PURE__*/ createWatchContractEvent(
  { abi: entryPointAbi, address: entryPointAddress, eventName: 'UserOperationRevertReason' }
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Withdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const watchEntryPointWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
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
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const writeIEntryPointSimulateHandleOp = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const writeIEntryPointSimulateValidation = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'simulateValidation',
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
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const prepareWriteIEntryPointSimulateHandleOp = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const prepareWriteIEntryPointSimulateValidation = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'simulateValidation',
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
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iMetaPaymasterAbi}__
 */
export const writeIMetaPaymaster = /*#__PURE__*/ createWriteContract({ abi: iMetaPaymasterAbi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iMetaPaymasterAbi}__ and `functionName` set to `"fund"`
 */
export const writeIMetaPaymasterFund = /*#__PURE__*/ createWriteContract({
  abi: iMetaPaymasterAbi,
  functionName: 'fund',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iMetaPaymasterAbi}__
 */
export const prepareWriteIMetaPaymaster = /*#__PURE__*/ createSimulateContract({
  abi: iMetaPaymasterAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iMetaPaymasterAbi}__ and `functionName` set to `"fund"`
 */
export const prepareWriteIMetaPaymasterFund = /*#__PURE__*/ createSimulateContract({
  abi: iMetaPaymasterAbi,
  functionName: 'fund',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSend = /*#__PURE__*/ createReadContract({ abi: sendAbi, address: sendAddress })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_botDefence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendBotDefence = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_botDefence',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_botDefenceActivatedOnce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendBotDefenceActivatedOnce = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_botDefenceActivatedOnce',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_knownBots"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendKnownBots = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_knownBots',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_manager"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendManager = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_manager',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_maxBuy"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendMaxBuy = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_maxBuy',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_multisig"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendMultisig = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_multisig',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTotalSupply = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_totalSupply',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendAllowance = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendBalanceOf = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"balanceOfAt"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendBalanceOfAt = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'balanceOfAt',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendDecimals = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"getLatestSnapshot"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendGetLatestSnapshot = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'getLatestSnapshot',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendName = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendSymbol = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const _readSendTotalSupply = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"totalSupplyAt"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTotalSupplyAt = /*#__PURE__*/ createReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'totalSupplyAt',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSend = /*#__PURE__*/ createWriteContract({ abi: sendAbi, address: sendAddress })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"activateBotDefenceOnce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendActivateBotDefenceOnce = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'activateBotDefenceOnce',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendApprove = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"approveToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendApproveToken = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'approveToken',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"changeOwner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendChangeOwner = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'changeOwner',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"createSnapshot"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendCreateSnapshot = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'createSnapshot',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"deactivateBotDefence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendDeactivateBotDefence = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'deactivateBotDefence',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"decreaseAllowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendDecreaseAllowance = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"increaseAllowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendIncreaseAllowance = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'increaseAllowance',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"modifyMaxBuy"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendModifyMaxBuy = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'modifyMaxBuy',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"removeBots"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendRemoveBots = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'removeBots',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendTransfer = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendTransferToken = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferTokenFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendTransferTokenFrom = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferTokenFrom',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendWithdraw = /*#__PURE__*/ createWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSend = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"activateBotDefenceOnce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendActivateBotDefenceOnce = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'activateBotDefenceOnce',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendApprove = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"approveToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendApproveToken = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'approveToken',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"changeOwner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendChangeOwner = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'changeOwner',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"createSnapshot"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendCreateSnapshot = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'createSnapshot',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"deactivateBotDefence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendDeactivateBotDefence = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'deactivateBotDefence',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"decreaseAllowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendDecreaseAllowance = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"increaseAllowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendIncreaseAllowance = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'increaseAllowance',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"modifyMaxBuy"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendModifyMaxBuy = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'modifyMaxBuy',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"removeBots"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendRemoveBots = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'removeBots',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendTransfer = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendTransferToken = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferTokenFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendTransferTokenFrom = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferTokenFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendWithdraw = /*#__PURE__*/ createSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const watchSendEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendAbi,
  address: sendAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const watchSendApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendAbi,
  address: sendAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAbi}__ and `eventName` set to `"Snapshot"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const watchSendSnapshotEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendAbi,
  address: sendAddress,
  eventName: 'Snapshot',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const watchSendTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendAbi,
  address: sendAddress,
  eventName: 'Transfer',
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
 * Wraps __{@link writeContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const writeTestUsdcDecreaseAllowance = /*#__PURE__*/ createWriteContract({
  abi: testUsdcAbi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"increaseAllowance"`
 */
export const writeTestUsdcIncreaseAllowance = /*#__PURE__*/ createWriteContract({
  abi: testUsdcAbi,
  functionName: 'increaseAllowance',
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
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const prepareWriteTestUsdcDecreaseAllowance = /*#__PURE__*/ createSimulateContract({
  abi: testUsdcAbi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"increaseAllowance"`
 */
export const prepareWriteTestUsdcIncreaseAllowance = /*#__PURE__*/ createSimulateContract({
  abi: testUsdcAbi,
  functionName: 'increaseAllowance',
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
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const useWriteDaimoAccountUpgradeTo = /*#__PURE__*/ createUseWriteContract({
  abi: daimoAccountAbi,
  functionName: 'upgradeTo',
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
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoAccountAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const useSimulateDaimoAccountUpgradeTo = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoAccountAbi,
  functionName: 'upgradeTo',
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
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const useWatchDaimoAccountAdminChangedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoAccountAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const useWatchDaimoAccountBeaconUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoAccountAbi,
  eventName: 'BeaconUpgraded',
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
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__
 */
export const useReadDaimoEphemeralNotes = /*#__PURE__*/ createUseReadContract({
  abi: daimoEphemeralNotesAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"notes"`
 */
export const useReadDaimoEphemeralNotesNotes = /*#__PURE__*/ createUseReadContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'notes',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"token"`
 */
export const useReadDaimoEphemeralNotesToken = /*#__PURE__*/ createUseReadContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'token',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__
 */
export const useWriteDaimoEphemeralNotes = /*#__PURE__*/ createUseWriteContract({
  abi: daimoEphemeralNotesAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"claimNote"`
 */
export const useWriteDaimoEphemeralNotesClaimNote = /*#__PURE__*/ createUseWriteContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'claimNote',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"createNote"`
 */
export const useWriteDaimoEphemeralNotesCreateNote = /*#__PURE__*/ createUseWriteContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'createNote',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__
 */
export const useSimulateDaimoEphemeralNotes = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoEphemeralNotesAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"claimNote"`
 */
export const useSimulateDaimoEphemeralNotesClaimNote = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'claimNote',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `functionName` set to `"createNote"`
 */
export const useSimulateDaimoEphemeralNotesCreateNote = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoEphemeralNotesAbi,
  functionName: 'createNote',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__
 */
export const useWatchDaimoEphemeralNotesEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoEphemeralNotesAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `eventName` set to `"NoteCreated"`
 */
export const useWatchDaimoEphemeralNotesNoteCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoEphemeralNotesAbi,
    eventName: 'NoteCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesAbi}__ and `eventName` set to `"NoteRedeemed"`
 */
export const useWatchDaimoEphemeralNotesNoteRedeemedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoEphemeralNotesAbi,
    eventName: 'NoteRedeemed',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__
 */
export const useReadDaimoEphemeralNotesV2 = /*#__PURE__*/ createUseReadContract({
  abi: daimoEphemeralNotesV2Abi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"notes"`
 */
export const useReadDaimoEphemeralNotesV2Notes = /*#__PURE__*/ createUseReadContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'notes',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"token"`
 */
export const useReadDaimoEphemeralNotesV2Token = /*#__PURE__*/ createUseReadContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'token',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__
 */
export const useWriteDaimoEphemeralNotesV2 = /*#__PURE__*/ createUseWriteContract({
  abi: daimoEphemeralNotesV2Abi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"claimNoteRecipient"`
 */
export const useWriteDaimoEphemeralNotesV2ClaimNoteRecipient = /*#__PURE__*/ createUseWriteContract(
  { abi: daimoEphemeralNotesV2Abi, functionName: 'claimNoteRecipient' }
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"claimNoteSelf"`
 */
export const useWriteDaimoEphemeralNotesV2ClaimNoteSelf = /*#__PURE__*/ createUseWriteContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'claimNoteSelf',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"createNote"`
 */
export const useWriteDaimoEphemeralNotesV2CreateNote = /*#__PURE__*/ createUseWriteContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'createNote',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__
 */
export const useSimulateDaimoEphemeralNotesV2 = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoEphemeralNotesV2Abi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"claimNoteRecipient"`
 */
export const useSimulateDaimoEphemeralNotesV2ClaimNoteRecipient =
  /*#__PURE__*/ createUseSimulateContract({
    abi: daimoEphemeralNotesV2Abi,
    functionName: 'claimNoteRecipient',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"claimNoteSelf"`
 */
export const useSimulateDaimoEphemeralNotesV2ClaimNoteSelf =
  /*#__PURE__*/ createUseSimulateContract({
    abi: daimoEphemeralNotesV2Abi,
    functionName: 'claimNoteSelf',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `functionName` set to `"createNote"`
 */
export const useSimulateDaimoEphemeralNotesV2CreateNote = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoEphemeralNotesV2Abi,
  functionName: 'createNote',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__
 */
export const useWatchDaimoEphemeralNotesV2Event = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoEphemeralNotesV2Abi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `eventName` set to `"NoteCreated"`
 */
export const useWatchDaimoEphemeralNotesV2NoteCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoEphemeralNotesV2Abi,
    eventName: 'NoteCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoEphemeralNotesV2Abi}__ and `eventName` set to `"NoteRedeemed"`
 */
export const useWatchDaimoEphemeralNotesV2NoteRedeemedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoEphemeralNotesV2Abi,
    eventName: 'NoteRedeemed',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__
 */
export const useReadDaimoNameRegistry = /*#__PURE__*/ createUseReadContract({
  abi: daimoNameRegistryAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"implementation"`
 */
export const useReadDaimoNameRegistryImplementation = /*#__PURE__*/ createUseReadContract({
  abi: daimoNameRegistryAbi,
  functionName: 'implementation',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"owner"`
 */
export const useReadDaimoNameRegistryOwner = /*#__PURE__*/ createUseReadContract({
  abi: daimoNameRegistryAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const useReadDaimoNameRegistryProxiableUuid = /*#__PURE__*/ createUseReadContract({
  abi: daimoNameRegistryAbi,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"resolveAddr"`
 */
export const useReadDaimoNameRegistryResolveAddr = /*#__PURE__*/ createUseReadContract({
  abi: daimoNameRegistryAbi,
  functionName: 'resolveAddr',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"resolveName"`
 */
export const useReadDaimoNameRegistryResolveName = /*#__PURE__*/ createUseReadContract({
  abi: daimoNameRegistryAbi,
  functionName: 'resolveName',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__
 */
export const useWriteDaimoNameRegistry = /*#__PURE__*/ createUseWriteContract({
  abi: daimoNameRegistryAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"forceRegister"`
 */
export const useWriteDaimoNameRegistryForceRegister = /*#__PURE__*/ createUseWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'forceRegister',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"init"`
 */
export const useWriteDaimoNameRegistryInit = /*#__PURE__*/ createUseWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'init',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"register"`
 */
export const useWriteDaimoNameRegistryRegister = /*#__PURE__*/ createUseWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'register',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"registerSelf"`
 */
export const useWriteDaimoNameRegistryRegisterSelf = /*#__PURE__*/ createUseWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'registerSelf',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteDaimoNameRegistryRenounceOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteDaimoNameRegistryTransferOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const useWriteDaimoNameRegistryUpgradeTo = /*#__PURE__*/ createUseWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useWriteDaimoNameRegistryUpgradeToAndCall = /*#__PURE__*/ createUseWriteContract({
  abi: daimoNameRegistryAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__
 */
export const useSimulateDaimoNameRegistry = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoNameRegistryAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"forceRegister"`
 */
export const useSimulateDaimoNameRegistryForceRegister = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'forceRegister',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"init"`
 */
export const useSimulateDaimoNameRegistryInit = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'init',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"register"`
 */
export const useSimulateDaimoNameRegistryRegister = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'register',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"registerSelf"`
 */
export const useSimulateDaimoNameRegistryRegisterSelf = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'registerSelf',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateDaimoNameRegistryRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: daimoNameRegistryAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateDaimoNameRegistryTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: daimoNameRegistryAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const useSimulateDaimoNameRegistryUpgradeTo = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoNameRegistryAbi,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useSimulateDaimoNameRegistryUpgradeToAndCall = /*#__PURE__*/ createUseSimulateContract(
  { abi: daimoNameRegistryAbi, functionName: 'upgradeToAndCall' }
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__
 */
export const useWatchDaimoNameRegistryEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoNameRegistryAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const useWatchDaimoNameRegistryAdminChangedEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: daimoNameRegistryAbi, eventName: 'AdminChanged' }
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const useWatchDaimoNameRegistryBeaconUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoNameRegistryAbi,
    eventName: 'BeaconUpgraded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"Initialized"`
 */
export const useWatchDaimoNameRegistryInitializedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoNameRegistryAbi,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchDaimoNameRegistryOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoNameRegistryAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"Registered"`
 */
export const useWatchDaimoNameRegistryRegisteredEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoNameRegistryAbi,
  eventName: 'Registered',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchDaimoNameRegistryUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoNameRegistryAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryProxyAbi}__
 */
export const useWatchDaimoNameRegistryProxyEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoNameRegistryProxyAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryProxyAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const useWatchDaimoNameRegistryProxyAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoNameRegistryProxyAbi,
    eventName: 'AdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryProxyAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const useWatchDaimoNameRegistryProxyBeaconUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoNameRegistryProxyAbi,
    eventName: 'BeaconUpgraded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoNameRegistryProxyAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchDaimoNameRegistryProxyUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoNameRegistryProxyAbi,
    eventName: 'Upgraded',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__
 */
export const useReadDaimoPaymasterV2 = /*#__PURE__*/ createUseReadContract({
  abi: daimoPaymasterV2Abi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"bundlerWhitelist"`
 */
export const useReadDaimoPaymasterV2BundlerWhitelist = /*#__PURE__*/ createUseReadContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'bundlerWhitelist',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"entryPoint"`
 */
export const useReadDaimoPaymasterV2EntryPoint = /*#__PURE__*/ createUseReadContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"getDeposit"`
 */
export const useReadDaimoPaymasterV2GetDeposit = /*#__PURE__*/ createUseReadContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'getDeposit',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"metaPaymaster"`
 */
export const useReadDaimoPaymasterV2MetaPaymaster = /*#__PURE__*/ createUseReadContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'metaPaymaster',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"owner"`
 */
export const useReadDaimoPaymasterV2Owner = /*#__PURE__*/ createUseReadContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__
 */
export const useWriteDaimoPaymasterV2 = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"addStake"`
 */
export const useWriteDaimoPaymasterV2AddStake = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"deposit"`
 */
export const useWriteDaimoPaymasterV2Deposit = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"postOp"`
 */
export const useWriteDaimoPaymasterV2PostOp = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'postOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteDaimoPaymasterV2RenounceOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"setBundlerWhitelist"`
 */
export const useWriteDaimoPaymasterV2SetBundlerWhitelist = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'setBundlerWhitelist',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"setMetaPaymaster"`
 */
export const useWriteDaimoPaymasterV2SetMetaPaymaster = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'setMetaPaymaster',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteDaimoPaymasterV2TransferOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"unlockStake"`
 */
export const useWriteDaimoPaymasterV2UnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"validatePaymasterUserOp"`
 */
export const useWriteDaimoPaymasterV2ValidatePaymasterUserOp = /*#__PURE__*/ createUseWriteContract(
  { abi: daimoPaymasterV2Abi, functionName: 'validatePaymasterUserOp' }
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"withdrawStake"`
 */
export const useWriteDaimoPaymasterV2WithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"withdrawTo"`
 */
export const useWriteDaimoPaymasterV2WithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__
 */
export const useSimulateDaimoPaymasterV2 = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoPaymasterV2Abi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"addStake"`
 */
export const useSimulateDaimoPaymasterV2AddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"deposit"`
 */
export const useSimulateDaimoPaymasterV2Deposit = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"postOp"`
 */
export const useSimulateDaimoPaymasterV2PostOp = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'postOp',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateDaimoPaymasterV2RenounceOwnership = /*#__PURE__*/ createUseSimulateContract(
  { abi: daimoPaymasterV2Abi, functionName: 'renounceOwnership' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"setBundlerWhitelist"`
 */
export const useSimulateDaimoPaymasterV2SetBundlerWhitelist =
  /*#__PURE__*/ createUseSimulateContract({
    abi: daimoPaymasterV2Abi,
    functionName: 'setBundlerWhitelist',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"setMetaPaymaster"`
 */
export const useSimulateDaimoPaymasterV2SetMetaPaymaster = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'setMetaPaymaster',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateDaimoPaymasterV2TransferOwnership = /*#__PURE__*/ createUseSimulateContract(
  { abi: daimoPaymasterV2Abi, functionName: 'transferOwnership' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"unlockStake"`
 */
export const useSimulateDaimoPaymasterV2UnlockStake = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"validatePaymasterUserOp"`
 */
export const useSimulateDaimoPaymasterV2ValidatePaymasterUserOp =
  /*#__PURE__*/ createUseSimulateContract({
    abi: daimoPaymasterV2Abi,
    functionName: 'validatePaymasterUserOp',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"withdrawStake"`
 */
export const useSimulateDaimoPaymasterV2WithdrawStake = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `functionName` set to `"withdrawTo"`
 */
export const useSimulateDaimoPaymasterV2WithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: daimoPaymasterV2Abi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoPaymasterV2Abi}__
 */
export const useWatchDaimoPaymasterV2Event = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoPaymasterV2Abi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchDaimoPaymasterV2OwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoPaymasterV2Abi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoPaymasterV2Abi}__ and `eventName` set to `"UserOperationSponsored"`
 */
export const useWatchDaimoPaymasterV2UserOperationSponsoredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoPaymasterV2Abi,
    eventName: 'UserOperationSponsored',
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
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__ and `eventName` set to `"AdminChanged"`
 *
 *
 */
export const useWatchDaimoVerifierAdminChangedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoVerifierAbi}__ and `eventName` set to `"BeaconUpgraded"`
 *
 *
 */
export const useWatchDaimoVerifierBeaconUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: daimoVerifierAbi,
  address: daimoVerifierAddress,
  eventName: 'BeaconUpgraded',
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
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoVerifierProxyAbi}__ and `eventName` set to `"AdminChanged"`
 *
 *
 */
export const useWatchDaimoVerifierProxyAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoVerifierProxyAbi,
    address: daimoVerifierProxyAddress,
    eventName: 'AdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link daimoVerifierProxyAbi}__ and `eventName` set to `"BeaconUpgraded"`
 *
 *
 */
export const useWatchDaimoVerifierProxyBeaconUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: daimoVerifierProxyAbi,
    address: daimoVerifierProxyAddress,
    eventName: 'BeaconUpgraded',
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
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__
 */
export const useWatchErc1967ProxyEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967ProxyAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const useWatchErc1967ProxyAdminChangedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967ProxyAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const useWatchErc1967ProxyBeaconUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967ProxyAbi,
  eventName: 'BeaconUpgraded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchErc1967ProxyUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967ProxyAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UpgradeAbi}__
 */
export const useWatchErc1967UpgradeEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UpgradeAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UpgradeAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const useWatchErc1967UpgradeAdminChangedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UpgradeAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UpgradeAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const useWatchErc1967UpgradeBeaconUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UpgradeAbi,
  eventName: 'BeaconUpgraded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UpgradeAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchErc1967UpgradeUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UpgradeAbi,
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
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const useWriteErc20DecreaseAllowance = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"increaseAllowance"`
 */
export const useWriteErc20IncreaseAllowance = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'increaseAllowance',
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
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const useSimulateErc20DecreaseAllowance = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"increaseAllowance"`
 */
export const useSimulateErc20IncreaseAllowance = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
  functionName: 'increaseAllowance',
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
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20SnapshotAbi}__
 */
export const useReadErc20Snapshot = /*#__PURE__*/ createUseReadContract({ abi: erc20SnapshotAbi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"allowance"`
 */
export const useReadErc20SnapshotAllowance = /*#__PURE__*/ createUseReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadErc20SnapshotBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"balanceOfAt"`
 */
export const useReadErc20SnapshotBalanceOfAt = /*#__PURE__*/ createUseReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'balanceOfAt',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"decimals"`
 */
export const useReadErc20SnapshotDecimals = /*#__PURE__*/ createUseReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"name"`
 */
export const useReadErc20SnapshotName = /*#__PURE__*/ createUseReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadErc20SnapshotSymbol = /*#__PURE__*/ createUseReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadErc20SnapshotTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"totalSupplyAt"`
 */
export const useReadErc20SnapshotTotalSupplyAt = /*#__PURE__*/ createUseReadContract({
  abi: erc20SnapshotAbi,
  functionName: 'totalSupplyAt',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20SnapshotAbi}__
 */
export const useWriteErc20Snapshot = /*#__PURE__*/ createUseWriteContract({ abi: erc20SnapshotAbi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteErc20SnapshotApprove = /*#__PURE__*/ createUseWriteContract({
  abi: erc20SnapshotAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const useWriteErc20SnapshotDecreaseAllowance = /*#__PURE__*/ createUseWriteContract({
  abi: erc20SnapshotAbi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"increaseAllowance"`
 */
export const useWriteErc20SnapshotIncreaseAllowance = /*#__PURE__*/ createUseWriteContract({
  abi: erc20SnapshotAbi,
  functionName: 'increaseAllowance',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"transfer"`
 */
export const useWriteErc20SnapshotTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: erc20SnapshotAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteErc20SnapshotTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: erc20SnapshotAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__
 */
export const useSimulateErc20Snapshot = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20SnapshotAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateErc20SnapshotApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20SnapshotAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const useSimulateErc20SnapshotDecreaseAllowance = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20SnapshotAbi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"increaseAllowance"`
 */
export const useSimulateErc20SnapshotIncreaseAllowance = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20SnapshotAbi,
  functionName: 'increaseAllowance',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateErc20SnapshotTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20SnapshotAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateErc20SnapshotTransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20SnapshotAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20SnapshotAbi}__
 */
export const useWatchErc20SnapshotEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc20SnapshotAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchErc20SnapshotApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc20SnapshotAbi,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `eventName` set to `"Snapshot"`
 */
export const useWatchErc20SnapshotSnapshotEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc20SnapshotAbi,
  eventName: 'Snapshot',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20SnapshotAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchErc20SnapshotTransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc20SnapshotAbi,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useReadEntryPoint = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useReadEntryPointBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getDepositInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useReadEntryPointGetDepositInfo = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useReadEntryPointGetNonce = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getUserOpHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useReadEntryPointGetUserOpHash = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPoint = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointAddStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointDepositTo = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointGetSenderAddress = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointHandleAggregatedOps = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointHandleOps = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointIncrementNonce = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"simulateHandleOp"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointSimulateHandleOp = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"simulateValidation"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointSimulateValidation = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'simulateValidation',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointUnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointWithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWriteEntryPointWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPoint = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointAddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointDepositTo = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointGetSenderAddress = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointHandleAggregatedOps = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointHandleOps = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointIncrementNonce = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"simulateHandleOp"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointSimulateHandleOp = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"simulateValidation"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointSimulateValidation = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'simulateValidation',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointUnlockStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointWithdrawStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useSimulateEntryPointWithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWatchEntryPointEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"AccountDeployed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWatchEntryPointAccountDeployedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'AccountDeployed',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"BeforeExecution"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWatchEntryPointBeforeExecutionEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'BeforeExecution',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Deposited"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWatchEntryPointDepositedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWatchEntryPointStakeLockedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeUnlocked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWatchEntryPointStakeUnlockedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeWithdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWatchEntryPointStakeWithdrawnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeWithdrawn',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationEvent"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWatchEntryPointUserOperationEventEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'UserOperationEvent',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
 */
export const useWatchEntryPointWithdrawnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
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
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const useWriteIEntryPointSimulateHandleOp = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const useWriteIEntryPointSimulateValidation = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'simulateValidation',
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
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const useSimulateIEntryPointSimulateHandleOp = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const useSimulateIEntryPointSimulateValidation = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'simulateValidation',
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
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iMetaPaymasterAbi}__
 */
export const useWriteIMetaPaymaster = /*#__PURE__*/ createUseWriteContract({
  abi: iMetaPaymasterAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iMetaPaymasterAbi}__ and `functionName` set to `"fund"`
 */
export const useWriteIMetaPaymasterFund = /*#__PURE__*/ createUseWriteContract({
  abi: iMetaPaymasterAbi,
  functionName: 'fund',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iMetaPaymasterAbi}__
 */
export const useSimulateIMetaPaymaster = /*#__PURE__*/ createUseSimulateContract({
  abi: iMetaPaymasterAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iMetaPaymasterAbi}__ and `functionName` set to `"fund"`
 */
export const useSimulateIMetaPaymasterFund = /*#__PURE__*/ createUseSimulateContract({
  abi: iMetaPaymasterAbi,
  functionName: 'fund',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSend = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_botDefence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendBotDefence = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_botDefence',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_botDefenceActivatedOnce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendBotDefenceActivatedOnce = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_botDefenceActivatedOnce',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_knownBots"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendKnownBots = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_knownBots',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_manager"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendManager = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_manager',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_maxBuy"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendMaxBuy = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_maxBuy',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_multisig"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendMultisig = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_multisig',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"_totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: '_totalSupply',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendAllowance = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"balanceOfAt"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendBalanceOfAt = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'balanceOfAt',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendDecimals = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"getLatestSnapshot"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendGetLatestSnapshot = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'getLatestSnapshot',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendName = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendSymbol = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const _useReadSendTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"totalSupplyAt"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTotalSupplyAt = /*#__PURE__*/ createUseReadContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'totalSupplyAt',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSend = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"activateBotDefenceOnce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendActivateBotDefenceOnce = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'activateBotDefenceOnce',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendApprove = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"approveToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendApproveToken = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'approveToken',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"changeOwner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendChangeOwner = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'changeOwner',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"createSnapshot"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendCreateSnapshot = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'createSnapshot',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"deactivateBotDefence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendDeactivateBotDefence = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'deactivateBotDefence',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"decreaseAllowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendDecreaseAllowance = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"increaseAllowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendIncreaseAllowance = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'increaseAllowance',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"modifyMaxBuy"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendModifyMaxBuy = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'modifyMaxBuy',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"removeBots"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendRemoveBots = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'removeBots',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendTransferToken = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferTokenFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendTransferTokenFrom = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferTokenFrom',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSend = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"activateBotDefenceOnce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendActivateBotDefenceOnce = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'activateBotDefenceOnce',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"approveToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendApproveToken = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'approveToken',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"changeOwner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendChangeOwner = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'changeOwner',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"createSnapshot"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendCreateSnapshot = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'createSnapshot',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"deactivateBotDefence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendDeactivateBotDefence = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'deactivateBotDefence',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"decreaseAllowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendDecreaseAllowance = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"increaseAllowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendIncreaseAllowance = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'increaseAllowance',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"modifyMaxBuy"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendModifyMaxBuy = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'modifyMaxBuy',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"removeBots"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendRemoveBots = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'removeBots',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendTransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendTransferToken = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"transferTokenFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendTransferTokenFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'transferTokenFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendWithdraw = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAbi,
  address: sendAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWatchSendEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendAbi,
  address: sendAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWatchSendApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendAbi,
  address: sendAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAbi}__ and `eventName` set to `"Snapshot"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWatchSendSnapshotEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendAbi,
  address: sendAddress,
  eventName: 'Snapshot',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWatchSendTransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendAbi,
  address: sendAddress,
  eventName: 'Transfer',
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
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const useWriteTestUsdcDecreaseAllowance = /*#__PURE__*/ createUseWriteContract({
  abi: testUsdcAbi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"increaseAllowance"`
 */
export const useWriteTestUsdcIncreaseAllowance = /*#__PURE__*/ createUseWriteContract({
  abi: testUsdcAbi,
  functionName: 'increaseAllowance',
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
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"decreaseAllowance"`
 */
export const useSimulateTestUsdcDecreaseAllowance = /*#__PURE__*/ createUseSimulateContract({
  abi: testUsdcAbi,
  functionName: 'decreaseAllowance',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link testUsdcAbi}__ and `functionName` set to `"increaseAllowance"`
 */
export const useSimulateTestUsdcIncreaseAllowance = /*#__PURE__*/ createUseSimulateContract({
  abi: testUsdcAbi,
  functionName: 'increaseAllowance',
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
