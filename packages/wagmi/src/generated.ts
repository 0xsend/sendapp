import {
  getContract,
  GetContractArgs,
  readContract,
  ReadContractConfig,
  writeContract,
  WriteContractArgs,
  WriteContractPreparedArgs,
  WriteContractUnpreparedArgs,
  prepareWriteContract,
  PrepareWriteContractConfig,
  WriteContractMode,
} from 'wagmi/actions'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoAccount
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoAccountABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_daimoVerifier', internalType: 'contract DaimoVerifier', type: 'address' },
    ],
  },
  { stateMutability: 'payable', type: 'receive' },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'slot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
    ],
    name: 'addSigningKey',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getActiveSigningKeys',
    outputs: [
      { name: 'activeSigningKeys', internalType: 'bytes32[2][]', type: 'bytes32[2][]' },
      { name: 'activeSigningKeySlots', internalType: 'uint8[]', type: 'uint8[]' },
    ],
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'message', internalType: 'bytes32', type: 'bytes32' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ name: 'magicValue', internalType: 'bytes4', type: 'bytes4' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint8', type: 'uint8' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'keys',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'maxKeys',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'numActiveKeys',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'slot', internalType: 'uint8', type: 'uint8' }],
    name: 'removeSigningKey',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newImplementation', internalType: 'address', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'verifier',
    outputs: [{ name: '', internalType: 'contract DaimoVerifier', type: 'address' }],
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
export const daimoAccountFactoryABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_verifier', internalType: 'contract DaimoVerifier', type: 'address' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'accountImplementation',
    outputs: [{ name: '', internalType: 'contract DaimoAccount', type: 'address' }],
  },
  {
    stateMutability: 'payable',
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
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
  },
  {
    stateMutability: 'view',
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
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'verifier',
    outputs: [{ name: '', internalType: 'contract DaimoVerifier', type: 'address' }],
  },
] as const

/**
 *
 */
export const daimoAccountFactoryAddress = {
  845337: '0xb722912027054bb1145c711426d404016a90BBF0',
} as const

/**
 *
 */
export const daimoAccountFactoryConfig = {
  address: daimoAccountFactoryAddress,
  abi: daimoAccountFactoryABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoEphemeralNotes
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoEphemeralNotesABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [{ name: '_token', internalType: 'contract IERC20', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_ephemeralOwner', internalType: 'address', type: 'address' },
      { name: '_signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'claimNote',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_ephemeralOwner', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createNote',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'notes',
    outputs: [
      { name: 'ephemeralOwner', internalType: 'address', type: 'address' },
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
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

export const daimoNameRegistryABI = [
  { stateMutability: 'nonpayable', type: 'constructor', inputs: [] },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'name', internalType: 'bytes32', type: 'bytes32' },
      { name: 'addr', internalType: 'address', type: 'address' },
    ],
    name: 'forceRegister',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'initialOwner', internalType: 'address', type: 'address' }],
    name: 'init',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'name', internalType: 'bytes32', type: 'bytes32' },
      { name: 'addr', internalType: 'address', type: 'address' },
    ],
    name: 'register',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'name', internalType: 'bytes32', type: 'bytes32' }],
    name: 'registerSelf',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'name', internalType: 'bytes32', type: 'bytes32' }],
    name: 'resolveAddr',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'addr', internalType: 'address', type: 'address' }],
    name: 'resolveName',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newImplementation', internalType: 'address', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
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

export const daimoNameRegistryProxyABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_logic', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
  },
  { stateMutability: 'payable', type: 'fallback' },
  { stateMutability: 'payable', type: 'receive' },
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
// DaimoPaymaster
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoPaymasterABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
      { name: '_metaPaymaster', internalType: 'contract IMetaPaymaster', type: 'address' },
    ],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
  },
  { stateMutability: 'payable', type: 'function', inputs: [], name: 'deposit', outputs: [] },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'destWhitelist',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getDeposit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'metaPaymaster',
    outputs: [{ name: '', internalType: 'contract IMetaPaymaster', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'mode', internalType: 'enum IPaymaster.PostOpMode', type: 'uint8' },
      { name: 'context', internalType: 'bytes', type: 'bytes' },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'postOp',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'addresses', internalType: 'address[]', type: 'address[]' },
      { name: 'isWhitelisted', internalType: 'bool', type: 'bool' },
    ],
    name: 'setDestAddressWhitelist',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_ticketSigner', internalType: 'address', type: 'address' }],
    name: 'setTicketSigner',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'ticketSigner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
  { stateMutability: 'nonpayable', type: 'function', inputs: [], name: 'unlockStake', outputs: [] },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
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
export const daimoVerifierABI = [
  { stateMutability: 'nonpayable', type: 'constructor', inputs: [] },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'initialOwner', internalType: 'address', type: 'address' }],
    name: 'init',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newImplementation', internalType: 'address', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'message', internalType: 'bytes', type: 'bytes' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
      { name: 'x', internalType: 'uint256', type: 'uint256' },
      { name: 'y', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'verifySignature',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
  845337: '0x90ebcFFfc78297a5039491CFCb7B1675a4618BAc',
} as const

/**
 *
 */
export const daimoVerifierConfig = { address: daimoVerifierAddress, abi: daimoVerifierABI } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoVerifierProxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const daimoVerifierProxyABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_logic', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
  },
  { stateMutability: 'payable', type: 'fallback' },
  { stateMutability: 'payable', type: 'receive' },
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
  845337: '0x5ccF3633f2018D836db449071262B57e3882A762',
} as const

/**
 *
 */
export const daimoVerifierProxyConfig = {
  address: daimoVerifierProxyAddress,
  abi: daimoVerifierProxyABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Proxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967ProxyABI = [
  {
    stateMutability: 'payable',
    type: 'constructor',
    inputs: [
      { name: '_logic', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
  },
  { stateMutability: 'payable', type: 'fallback' },
  { stateMutability: 'payable', type: 'receive' },
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

export const erc1967UpgradeABI = [
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

export const erc20ABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: 'name_', internalType: 'string', type: 'string' },
      { name: 'symbol_', internalType: 'string', type: 'string' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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

export const erc20SnapshotABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'snapshotId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'balanceOfAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'snapshotId', internalType: 'uint256', type: 'uint256' }],
    name: 'totalSupplyAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
// IEntryPoint
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iEntryPointABI = [
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: '_unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
  },
  {
    stateMutability: 'view',
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
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
  },
  {
    stateMutability: 'view',
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
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'nonpayable',
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
  },
  { stateMutability: 'nonpayable', type: 'function', inputs: [], name: 'unlockStake', outputs: [] },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
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

export const iMetaPaymasterABI = [
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'fund',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Send
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export const sendABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: 'multisig', internalType: 'address', type: 'address' },
      { name: 'manager', internalType: 'address', type: 'address' },
      { name: 'knownBots', internalType: 'address[]', type: 'address[]' },
      { name: 'initialMaxBuy', internalType: 'uint256', type: 'uint256' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_botDefence',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_botDefenceActivatedOnce',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: '_knownBots',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_manager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_maxBuy',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_multisig',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'activateBotDefenceOnce',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_spender', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approveToken',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'snapshotId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'balanceOfAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_newManager', internalType: 'address', type: 'address' }],
    name: 'changeOwner',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'createSnapshot',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'deactivateBotDefence',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getLatestSnapshot',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_newMaxBuy', internalType: 'uint256', type: 'uint256' }],
    name: 'modifyMaxBuy',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_bots', internalType: 'address[]', type: 'address[]' }],
    name: 'removeBots',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'snapshotId', internalType: 'uint256', type: 'uint256' }],
    name: 'totalSupplyAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_transferTo', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferToken',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_transferFrom', internalType: 'address', type: 'address' },
      { name: '_transferTo', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferTokenFrom',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_to', internalType: 'address payable', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [],
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
 */
export const sendAddress = {
  1: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  1337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  8008: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export const sendConfig = { address: sendAddress, abi: sendABI } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendAirdropsSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendAirdropsSafeABI = [] as const

export const sendAirdropsSafeAddress = '0x6204Bc0662ccd8a9A762d59fe7906733f251E3b7' as const

export const sendAirdropsSafeConfig = {
  address: sendAirdropsSafeAddress,
  abi: sendAirdropsSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendContributorIncentivesSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendContributorIncentivesSafeABI = [] as const

export const sendContributorIncentivesSafeAddress =
  '0x4F30818f5c1a20803AB2075B813DBDE810e51b98' as const

export const sendContributorIncentivesSafeConfig = {
  address: sendContributorIncentivesSafeAddress,
  abi: sendContributorIncentivesSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendCoreTeamSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendCoreTeamSafeABI = [] as const

export const sendCoreTeamSafeAddress = '0xE52D0967A2eE242098d11c209f53C8158E329eCC' as const

export const sendCoreTeamSafeConfig = {
  address: sendCoreTeamSafeAddress,
  abi: sendCoreTeamSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendEXListingsSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendExListingsSafeABI = [] as const

export const sendExListingsSafeAddress = '0xF530e6E60e7a65Ea717f843a8b2e6fcdC727aC9E' as const

export const sendExListingsSafeConfig = {
  address: sendExListingsSafeAddress,
  abi: sendExListingsSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendMerkleDrop
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const sendMerkleDropABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_token', internalType: 'contract IERC20', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_merkleRoot', internalType: 'bytes32', type: 'bytes32' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addTranche',
    outputs: [{ name: 'trancheId', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_trancheId', internalType: 'uint256', type: 'uint256' }],
    name: 'expireTranche',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: '_tranche', internalType: 'uint256', type: 'uint256' },
      { name: '_index', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'isClaimed',
    outputs: [{ name: 'claimed', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'merkleRoots',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheActive',
    outputs: [{ name: 'valid', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmount',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmountClaimed',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmounts',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmountsClaimed',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'trancheCursor',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_transferTo', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferToken',
    outputs: [],
  },
  {
    stateMutability: 'view',
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_to', internalType: 'address payable', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [],
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
  abi: sendMerkleDropABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendMultisigSignerPayoutsSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendMultisigSignerPayoutsSafeABI = [] as const

export const sendMultisigSignerPayoutsSafeAddress =
  '0x5355c409fa3D0901292231Ddb953C949C2211D96' as const

export const sendMultisigSignerPayoutsSafeConfig = {
  address: sendMultisigSignerPayoutsSafeAddress,
  abi: sendMultisigSignerPayoutsSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendRevenueSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendRevenueSafeABI = [] as const

export const sendRevenueSafeAddress = '0xBB253919a15C5E0C9986d83f205A9279b4247E3d' as const

export const sendRevenueSafeConfig = {
  address: sendRevenueSafeAddress,
  abi: sendRevenueSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendTreasurySafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendTreasurySafeABI = [] as const

export const sendTreasurySafeAddress = '0x4bB2f4c771ccB60723a78a974a2537AD339071c7' as const

export const sendTreasurySafeConfig = {
  address: sendTreasurySafeAddress,
  abi: sendTreasurySafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendUniswapV3Pool
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendUniswapV3PoolABI = [] as const

export const sendUniswapV3PoolAddress = '0x14F59C715C205002c6e3F36766D302c1a19bacC8' as const

export const sendUniswapV3PoolConfig = {
  address: sendUniswapV3PoolAddress,
  abi: sendUniswapV3PoolABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SenderCreator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const senderCreatorABI = [
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'createSender',
    outputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TestUSDC
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const testUsdcABI = [
  { stateMutability: 'nonpayable', type: 'constructor', inputs: [] },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'pure',
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
// Core
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoAccountABI}__.
 */
export function getDaimoAccount(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoAccountABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountABI}__.
 */
export function readDaimoAccount<
  TAbi extends readonly unknown[] = typeof daimoAccountABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: daimoAccountABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountABI}__.
 */
export function writeDaimoAccount<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof daimoAccountABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof daimoAccountABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: daimoAccountABI, ...config } as unknown as WriteContractArgs<
    typeof daimoAccountABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoAccountABI}__.
 */
export function prepareWriteDaimoAccount<
  TAbi extends readonly unknown[] = typeof daimoAccountABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: daimoAccountABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoAccountFactoryABI}__.
 *
 *
 */
export function getDaimoAccountFactory(
  config: Omit<GetContractArgs, 'abi' | 'address'> & {
    chainId?: keyof typeof daimoAccountFactoryAddress
  }
) {
  return getContract({
    abi: daimoAccountFactoryABI,
    address: daimoAccountFactoryAddress[845337],
    ...config,
  })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountFactoryABI}__.
 *
 *
 */
export function readDaimoAccountFactory<
  TAbi extends readonly unknown[] = typeof daimoAccountFactoryABI,
  TFunctionName extends string = string
>(
  config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof daimoAccountFactoryAddress
  }
) {
  return readContract({
    abi: daimoAccountFactoryABI,
    address: daimoAccountFactoryAddress[845337],
    ...config,
  } as unknown as ReadContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountFactoryABI}__.
 *
 *
 */
export function writeDaimoAccountFactory<
  TFunctionName extends string,
  TMode extends WriteContractMode,
  TChainId extends number = keyof typeof daimoAccountFactoryAddress
>(
  config:
    | (Omit<
        WriteContractPreparedArgs<typeof daimoAccountFactoryABI, TFunctionName>,
        'abi' | 'address'
      > & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof daimoAccountFactoryAddress
      })
    | (Omit<
        WriteContractUnpreparedArgs<typeof daimoAccountFactoryABI, TFunctionName>,
        'abi' | 'address'
      > & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof daimoAccountFactoryAddress
      })
) {
  return writeContract({
    abi: daimoAccountFactoryABI,
    address: daimoAccountFactoryAddress[845337],
    ...config,
  } as unknown as WriteContractArgs<typeof daimoAccountFactoryABI, TFunctionName>)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoAccountFactoryABI}__.
 *
 *
 */
export function prepareWriteDaimoAccountFactory<
  TAbi extends readonly unknown[] = typeof daimoAccountFactoryABI,
  TFunctionName extends string = string
>(
  config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof daimoAccountFactoryAddress
  }
) {
  return prepareWriteContract({
    abi: daimoAccountFactoryABI,
    address: daimoAccountFactoryAddress[845337],
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoEphemeralNotesABI}__.
 */
export function getDaimoEphemeralNotes(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoEphemeralNotesABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoEphemeralNotesABI}__.
 */
export function readDaimoEphemeralNotes<
  TAbi extends readonly unknown[] = typeof daimoEphemeralNotesABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: daimoEphemeralNotesABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoEphemeralNotesABI}__.
 */
export function writeDaimoEphemeralNotes<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof daimoEphemeralNotesABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof daimoEphemeralNotesABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: daimoEphemeralNotesABI, ...config } as unknown as WriteContractArgs<
    typeof daimoEphemeralNotesABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoEphemeralNotesABI}__.
 */
export function prepareWriteDaimoEphemeralNotes<
  TAbi extends readonly unknown[] = typeof daimoEphemeralNotesABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: daimoEphemeralNotesABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoNameRegistryABI}__.
 */
export function getDaimoNameRegistry(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoNameRegistryABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoNameRegistryABI}__.
 */
export function readDaimoNameRegistry<
  TAbi extends readonly unknown[] = typeof daimoNameRegistryABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: daimoNameRegistryABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryABI}__.
 */
export function writeDaimoNameRegistry<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof daimoNameRegistryABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof daimoNameRegistryABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: daimoNameRegistryABI, ...config } as unknown as WriteContractArgs<
    typeof daimoNameRegistryABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoNameRegistryABI}__.
 */
export function prepareWriteDaimoNameRegistry<
  TAbi extends readonly unknown[] = typeof daimoNameRegistryABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: daimoNameRegistryABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoNameRegistryProxyABI}__.
 */
export function getDaimoNameRegistryProxy(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoNameRegistryProxyABI, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoPaymasterABI}__.
 */
export function getDaimoPaymaster(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoPaymasterABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoPaymasterABI}__.
 */
export function readDaimoPaymaster<
  TAbi extends readonly unknown[] = typeof daimoPaymasterABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: daimoPaymasterABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterABI}__.
 */
export function writeDaimoPaymaster<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof daimoPaymasterABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof daimoPaymasterABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: daimoPaymasterABI, ...config } as unknown as WriteContractArgs<
    typeof daimoPaymasterABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoPaymasterABI}__.
 */
export function prepareWriteDaimoPaymaster<
  TAbi extends readonly unknown[] = typeof daimoPaymasterABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: daimoPaymasterABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoVerifierABI}__.
 *
 *
 */
export function getDaimoVerifier(
  config: Omit<GetContractArgs, 'abi' | 'address'> & { chainId?: keyof typeof daimoVerifierAddress }
) {
  return getContract({ abi: daimoVerifierABI, address: daimoVerifierAddress[845337], ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoVerifierABI}__.
 *
 *
 */
export function readDaimoVerifier<
  TAbi extends readonly unknown[] = typeof daimoVerifierABI,
  TFunctionName extends string = string
>(
  config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof daimoVerifierAddress
  }
) {
  return readContract({
    abi: daimoVerifierABI,
    address: daimoVerifierAddress[845337],
    ...config,
  } as unknown as ReadContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoVerifierABI}__.
 *
 *
 */
export function writeDaimoVerifier<
  TFunctionName extends string,
  TMode extends WriteContractMode,
  TChainId extends number = keyof typeof daimoVerifierAddress
>(
  config:
    | (Omit<
        WriteContractPreparedArgs<typeof daimoVerifierABI, TFunctionName>,
        'abi' | 'address'
      > & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof daimoVerifierAddress
      })
    | (Omit<
        WriteContractUnpreparedArgs<typeof daimoVerifierABI, TFunctionName>,
        'abi' | 'address'
      > & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof daimoVerifierAddress
      })
) {
  return writeContract({
    abi: daimoVerifierABI,
    address: daimoVerifierAddress[845337],
    ...config,
  } as unknown as WriteContractArgs<typeof daimoVerifierABI, TFunctionName>)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoVerifierABI}__.
 *
 *
 */
export function prepareWriteDaimoVerifier<
  TAbi extends readonly unknown[] = typeof daimoVerifierABI,
  TFunctionName extends string = string
>(
  config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof daimoVerifierAddress
  }
) {
  return prepareWriteContract({
    abi: daimoVerifierABI,
    address: daimoVerifierAddress[845337],
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoVerifierProxyABI}__.
 *
 *
 */
export function getDaimoVerifierProxy(
  config: Omit<GetContractArgs, 'abi' | 'address'> & {
    chainId?: keyof typeof daimoVerifierProxyAddress
  }
) {
  return getContract({
    abi: daimoVerifierProxyABI,
    address: daimoVerifierProxyAddress[845337],
    ...config,
  })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link erc1967ProxyABI}__.
 */
export function getErc1967Proxy(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: erc1967ProxyABI, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link erc1967UpgradeABI}__.
 */
export function getErc1967Upgrade(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: erc1967UpgradeABI, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link erc20ABI}__.
 */
export function getErc20(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: erc20ABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20ABI}__.
 */
export function readErc20<
  TAbi extends readonly unknown[] = typeof erc20ABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: erc20ABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20ABI}__.
 */
export function writeErc20<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof erc20ABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof erc20ABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: erc20ABI, ...config } as unknown as WriteContractArgs<
    typeof erc20ABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link erc20ABI}__.
 */
export function prepareWriteErc20<
  TAbi extends readonly unknown[] = typeof erc20ABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({ abi: erc20ABI, ...config } as unknown as PrepareWriteContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link erc20SnapshotABI}__.
 */
export function getErc20Snapshot(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: erc20SnapshotABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotABI}__.
 */
export function readErc20Snapshot<
  TAbi extends readonly unknown[] = typeof erc20SnapshotABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: erc20SnapshotABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20SnapshotABI}__.
 */
export function writeErc20Snapshot<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof erc20SnapshotABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof erc20SnapshotABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: erc20SnapshotABI, ...config } as unknown as WriteContractArgs<
    typeof erc20SnapshotABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link erc20SnapshotABI}__.
 */
export function prepareWriteErc20Snapshot<
  TAbi extends readonly unknown[] = typeof erc20SnapshotABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: erc20SnapshotABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iEntryPointABI}__.
 */
export function getIEntryPoint(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iEntryPointABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointABI}__.
 */
export function readIEntryPoint<
  TAbi extends readonly unknown[] = typeof iEntryPointABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: iEntryPointABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointABI}__.
 */
export function writeIEntryPoint<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof iEntryPointABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof iEntryPointABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: iEntryPointABI, ...config } as unknown as WriteContractArgs<
    typeof iEntryPointABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link iEntryPointABI}__.
 */
export function prepareWriteIEntryPoint<
  TAbi extends readonly unknown[] = typeof iEntryPointABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: iEntryPointABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iMetaPaymasterABI}__.
 */
export function getIMetaPaymaster(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iMetaPaymasterABI, ...config })
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iMetaPaymasterABI}__.
 */
export function writeIMetaPaymaster<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof iMetaPaymasterABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof iMetaPaymasterABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: iMetaPaymasterABI, ...config } as unknown as WriteContractArgs<
    typeof iMetaPaymasterABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link iMetaPaymasterABI}__.
 */
export function prepareWriteIMetaPaymaster<
  TAbi extends readonly unknown[] = typeof iMetaPaymasterABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: iMetaPaymasterABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export function getSend(
  config: Omit<GetContractArgs, 'abi' | 'address'> & { chainId?: keyof typeof sendAddress }
) {
  return getContract({
    abi: sendABI,
    address: sendAddress[config.chainId as keyof typeof sendAddress],
    ...config,
  })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export function readSend<
  TAbi extends readonly unknown[] = typeof sendABI,
  TFunctionName extends string = string
>(
  config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof sendAddress
  }
) {
  return readContract({
    abi: sendABI,
    address: sendAddress[config.chainId as keyof typeof sendAddress],
    ...config,
  } as unknown as ReadContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export function writeSend<
  TFunctionName extends string,
  TMode extends WriteContractMode,
  TChainId extends number = keyof typeof sendAddress
>(
  config:
    | (Omit<WriteContractPreparedArgs<typeof sendABI, TFunctionName>, 'abi' | 'address'> & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof sendAddress
      })
    | (Omit<WriteContractUnpreparedArgs<typeof sendABI, TFunctionName>, 'abi' | 'address'> & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof sendAddress
      })
) {
  return writeContract({
    abi: sendABI,
    address: sendAddress[config.chainId as keyof typeof sendAddress],
    ...config,
  } as unknown as WriteContractArgs<typeof sendABI, TFunctionName>)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link sendABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export function prepareWriteSend<
  TAbi extends readonly unknown[] = typeof sendABI,
  TFunctionName extends string = string
>(
  config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof sendAddress
  }
) {
  return prepareWriteContract({
    abi: sendABI,
    address: sendAddress[config.chainId as keyof typeof sendAddress],
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendAirdropsSafeABI}__.
 */
export function getSendAirdropsSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendAirdropsSafeABI, address: sendAirdropsSafeAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendContributorIncentivesSafeABI}__.
 */
export function getSendContributorIncentivesSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({
    abi: sendContributorIncentivesSafeABI,
    address: sendContributorIncentivesSafeAddress,
    ...config,
  })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendCoreTeamSafeABI}__.
 */
export function getSendCoreTeamSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendCoreTeamSafeABI, address: sendCoreTeamSafeAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendExListingsSafeABI}__.
 */
export function getSendExListingsSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendExListingsSafeABI, address: sendExListingsSafeAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendMerkleDropABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export function getSendMerkleDrop(
  config: Omit<GetContractArgs, 'abi' | 'address'> & {
    chainId?: keyof typeof sendMerkleDropAddress
  }
) {
  return getContract({
    abi: sendMerkleDropABI,
    address: sendMerkleDropAddress[config.chainId as keyof typeof sendMerkleDropAddress],
    ...config,
  })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export function readSendMerkleDrop<
  TAbi extends readonly unknown[] = typeof sendMerkleDropABI,
  TFunctionName extends string = string
>(
  config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof sendMerkleDropAddress
  }
) {
  return readContract({
    abi: sendMerkleDropABI,
    address: sendMerkleDropAddress[config.chainId as keyof typeof sendMerkleDropAddress],
    ...config,
  } as unknown as ReadContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export function writeSendMerkleDrop<
  TFunctionName extends string,
  TMode extends WriteContractMode,
  TChainId extends number = keyof typeof sendMerkleDropAddress
>(
  config:
    | (Omit<
        WriteContractPreparedArgs<typeof sendMerkleDropABI, TFunctionName>,
        'abi' | 'address'
      > & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof sendMerkleDropAddress
      })
    | (Omit<
        WriteContractUnpreparedArgs<typeof sendMerkleDropABI, TFunctionName>,
        'abi' | 'address'
      > & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof sendMerkleDropAddress
      })
) {
  return writeContract({
    abi: sendMerkleDropABI,
    address: sendMerkleDropAddress[config.chainId as keyof typeof sendMerkleDropAddress],
    ...config,
  } as unknown as WriteContractArgs<typeof sendMerkleDropABI, TFunctionName>)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link sendMerkleDropABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export function prepareWriteSendMerkleDrop<
  TAbi extends readonly unknown[] = typeof sendMerkleDropABI,
  TFunctionName extends string = string
>(
  config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof sendMerkleDropAddress
  }
) {
  return prepareWriteContract({
    abi: sendMerkleDropABI,
    address: sendMerkleDropAddress[config.chainId as keyof typeof sendMerkleDropAddress],
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendMultisigSignerPayoutsSafeABI}__.
 */
export function getSendMultisigSignerPayoutsSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({
    abi: sendMultisigSignerPayoutsSafeABI,
    address: sendMultisigSignerPayoutsSafeAddress,
    ...config,
  })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendRevenueSafeABI}__.
 */
export function getSendRevenueSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendRevenueSafeABI, address: sendRevenueSafeAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendTreasurySafeABI}__.
 */
export function getSendTreasurySafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendTreasurySafeABI, address: sendTreasurySafeAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendUniswapV3PoolABI}__.
 */
export function getSendUniswapV3Pool(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendUniswapV3PoolABI, address: sendUniswapV3PoolAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link senderCreatorABI}__.
 */
export function getSenderCreator(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: senderCreatorABI, ...config })
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link senderCreatorABI}__.
 */
export function writeSenderCreator<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof senderCreatorABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof senderCreatorABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: senderCreatorABI, ...config } as unknown as WriteContractArgs<
    typeof senderCreatorABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link senderCreatorABI}__.
 */
export function prepareWriteSenderCreator<
  TAbi extends readonly unknown[] = typeof senderCreatorABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: senderCreatorABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link testUsdcABI}__.
 */
export function getTestUsdc(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: testUsdcABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link testUsdcABI}__.
 */
export function readTestUsdc<
  TAbi extends readonly unknown[] = typeof testUsdcABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: testUsdcABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link testUsdcABI}__.
 */
export function writeTestUsdc<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof testUsdcABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof testUsdcABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: testUsdcABI, ...config } as unknown as WriteContractArgs<
    typeof testUsdcABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link testUsdcABI}__.
 */
export function prepareWriteTestUsdc<
  TAbi extends readonly unknown[] = typeof testUsdcABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: testUsdcABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}
