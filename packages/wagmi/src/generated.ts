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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC20Snapshot
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20SnapshotABI = [
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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc20ABI = [
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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC20Metadata
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc20MetadataABI = [
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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC20Permit
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc20PermitABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMulticall3
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iMulticall3ABI = [
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'aggregate',
    outputs: [
      { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
      { name: 'returnData', internalType: 'bytes[]', type: 'bytes[]' },
    ],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call3[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'allowFailure', internalType: 'bool', type: 'bool' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'aggregate3',
    outputs: [
      {
        name: 'returnData',
        internalType: 'struct IMulticall3.Result[]',
        type: 'tuple[]',
        components: [
          { name: 'success', internalType: 'bool', type: 'bool' },
          { name: 'returnData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call3Value[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'allowFailure', internalType: 'bool', type: 'bool' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'aggregate3Value',
    outputs: [
      {
        name: 'returnData',
        internalType: 'struct IMulticall3.Result[]',
        type: 'tuple[]',
        components: [
          { name: 'success', internalType: 'bool', type: 'bool' },
          { name: 'returnData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'blockAndAggregate',
    outputs: [
      { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
      { name: 'blockHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'returnData',
        internalType: 'struct IMulticall3.Result[]',
        type: 'tuple[]',
        components: [
          { name: 'success', internalType: 'bool', type: 'bool' },
          { name: 'returnData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getBasefee',
    outputs: [{ name: 'basefee', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'blockNumber', internalType: 'uint256', type: 'uint256' }],
    name: 'getBlockHash',
    outputs: [{ name: 'blockHash', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getBlockNumber',
    outputs: [{ name: 'blockNumber', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getChainId',
    outputs: [{ name: 'chainid', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getCurrentBlockCoinbase',
    outputs: [{ name: 'coinbase', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getCurrentBlockDifficulty',
    outputs: [{ name: 'difficulty', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getCurrentBlockGasLimit',
    outputs: [{ name: 'gaslimit', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getCurrentBlockTimestamp',
    outputs: [{ name: 'timestamp', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'addr', internalType: 'address', type: 'address' }],
    name: 'getEthBalance',
    outputs: [{ name: 'balance', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getLastBlockHash',
    outputs: [{ name: 'blockHash', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'requireSuccess', internalType: 'bool', type: 'bool' },
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'tryAggregate',
    outputs: [
      {
        name: 'returnData',
        internalType: 'struct IMulticall3.Result[]',
        type: 'tuple[]',
        components: [
          { name: 'success', internalType: 'bool', type: 'bool' },
          { name: 'returnData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'requireSuccess', internalType: 'bool', type: 'bool' },
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'tryBlockAndAggregate',
    outputs: [
      { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
      { name: 'blockHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'returnData',
        internalType: 'struct IMulticall3.Result[]',
        type: 'tuple[]',
        components: [
          { name: 'success', internalType: 'bool', type: 'bool' },
          { name: 'returnData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ownable
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ownableABI = [
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
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
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

export const sendRevenueSafeABI = [
  { stateMutability: 'nonpayable', type: 'constructor', inputs: [] },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'owner', internalType: 'address', type: 'address', indexed: false }],
    name: 'AddedOwner',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'approvedHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'owner', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'ApproveHash',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'handler', internalType: 'address', type: 'address', indexed: false }],
    name: 'ChangedFallbackHandler',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'guard', internalType: 'address', type: 'address', indexed: false }],
    name: 'ChangedGuard',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'threshold', internalType: 'uint256', type: 'uint256', indexed: false }],
    name: 'ChangedThreshold',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'module', internalType: 'address', type: 'address', indexed: false }],
    name: 'DisabledModule',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'module', internalType: 'address', type: 'address', indexed: false }],
    name: 'EnabledModule',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'txHash', internalType: 'bytes32', type: 'bytes32', indexed: false },
      { name: 'payment', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'ExecutionFailure',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'module', internalType: 'address', type: 'address', indexed: true }],
    name: 'ExecutionFromModuleFailure',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'module', internalType: 'address', type: 'address', indexed: true }],
    name: 'ExecutionFromModuleSuccess',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'txHash', internalType: 'bytes32', type: 'bytes32', indexed: false },
      { name: 'payment', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'ExecutionSuccess',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'owner', internalType: 'address', type: 'address', indexed: false }],
    name: 'RemovedOwner',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'SafeReceived',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'initiator', internalType: 'address', type: 'address', indexed: true },
      { name: 'owners', internalType: 'address[]', type: 'address[]', indexed: false },
      { name: 'threshold', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'initializer', internalType: 'address', type: 'address', indexed: false },
      { name: 'fallbackHandler', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'SafeSetup',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'msgHash', internalType: 'bytes32', type: 'bytes32', indexed: true }],
    name: 'SignMsg',
  },
  { stateMutability: 'nonpayable', type: 'fallback' },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: '_threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addOwnerWithThreshold',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'hashToApprove', internalType: 'bytes32', type: 'bytes32' }],
    name: 'approveHash',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'approvedHashes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_threshold', internalType: 'uint256', type: 'uint256' }],
    name: 'changeThreshold',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'dataHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'signatures', internalType: 'bytes', type: 'bytes' },
      { name: 'requiredSignatures', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'checkNSignatures',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'dataHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'signatures', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'checkSignatures',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'prevModule', internalType: 'address', type: 'address' },
      { name: 'module', internalType: 'address', type: 'address' },
    ],
    name: 'disableModule',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'domainSeparator',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'module', internalType: 'address', type: 'address' }],
    name: 'enableModule',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
      { name: 'safeTxGas', internalType: 'uint256', type: 'uint256' },
      { name: 'baseGas', internalType: 'uint256', type: 'uint256' },
      { name: 'gasPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'gasToken', internalType: 'address', type: 'address' },
      { name: 'refundReceiver', internalType: 'address', type: 'address' },
      { name: '_nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'encodeTransactionData',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
      { name: 'safeTxGas', internalType: 'uint256', type: 'uint256' },
      { name: 'baseGas', internalType: 'uint256', type: 'uint256' },
      { name: 'gasPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'gasToken', internalType: 'address', type: 'address' },
      { name: 'refundReceiver', internalType: 'address payable', type: 'address' },
      { name: 'signatures', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'execTransaction',
    outputs: [{ name: 'success', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'execTransactionFromModule',
    outputs: [{ name: 'success', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'execTransactionFromModuleReturnData',
    outputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'returnData', internalType: 'bytes', type: 'bytes' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getChainId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'start', internalType: 'address', type: 'address' },
      { name: 'pageSize', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getModulesPaginated',
    outputs: [
      { name: 'array', internalType: 'address[]', type: 'address[]' },
      { name: 'next', internalType: 'address', type: 'address' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getOwners',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'offset', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getStorageAt',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getThreshold',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
      { name: 'safeTxGas', internalType: 'uint256', type: 'uint256' },
      { name: 'baseGas', internalType: 'uint256', type: 'uint256' },
      { name: 'gasPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'gasToken', internalType: 'address', type: 'address' },
      { name: 'refundReceiver', internalType: 'address', type: 'address' },
      { name: '_nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTransactionHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'module', internalType: 'address', type: 'address' }],
    name: 'isModuleEnabled',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'isOwner',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'nonce',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'prevOwner', internalType: 'address', type: 'address' },
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: '_threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'removeOwner',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'requiredTxGas',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'handler', internalType: 'address', type: 'address' }],
    name: 'setFallbackHandler',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'guard', internalType: 'address', type: 'address' }],
    name: 'setGuard',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_owners', internalType: 'address[]', type: 'address[]' },
      { name: '_threshold', internalType: 'uint256', type: 'uint256' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'fallbackHandler', internalType: 'address', type: 'address' },
      { name: 'paymentToken', internalType: 'address', type: 'address' },
      { name: 'payment', internalType: 'uint256', type: 'uint256' },
      { name: 'paymentReceiver', internalType: 'address payable', type: 'address' },
    ],
    name: 'setup',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'signedMessages',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'targetContract', internalType: 'address', type: 'address' },
      { name: 'calldataPayload', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateAndRevert',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'prevOwner', internalType: 'address', type: 'address' },
      { name: 'oldOwner', internalType: 'address', type: 'address' },
      { name: 'newOwner', internalType: 'address', type: 'address' },
    ],
    name: 'swapOwner',
    outputs: [],
  },
  { stateMutability: 'payable', type: 'receive' },
] as const

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
// Core
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
 * Wraps __{@link getContract}__ with `abi` set to __{@link ierc20ABI}__.
 */
export function getIerc20(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ierc20ABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ierc20ABI}__.
 */
export function readIerc20<
  TAbi extends readonly unknown[] = typeof ierc20ABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ierc20ABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link ierc20ABI}__.
 */
export function writeIerc20<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof ierc20ABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof ierc20ABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: ierc20ABI, ...config } as unknown as WriteContractArgs<
    typeof ierc20ABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link ierc20ABI}__.
 */
export function prepareWriteIerc20<
  TAbi extends readonly unknown[] = typeof ierc20ABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: ierc20ABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link ierc20MetadataABI}__.
 */
export function getIerc20Metadata(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ierc20MetadataABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ierc20MetadataABI}__.
 */
export function readIerc20Metadata<
  TAbi extends readonly unknown[] = typeof ierc20MetadataABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ierc20MetadataABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link ierc20MetadataABI}__.
 */
export function writeIerc20Metadata<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof ierc20MetadataABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof ierc20MetadataABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: ierc20MetadataABI, ...config } as unknown as WriteContractArgs<
    typeof ierc20MetadataABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link ierc20MetadataABI}__.
 */
export function prepareWriteIerc20Metadata<
  TAbi extends readonly unknown[] = typeof ierc20MetadataABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: ierc20MetadataABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link ierc20PermitABI}__.
 */
export function getIerc20Permit(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ierc20PermitABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ierc20PermitABI}__.
 */
export function readIerc20Permit<
  TAbi extends readonly unknown[] = typeof ierc20PermitABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ierc20PermitABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link ierc20PermitABI}__.
 */
export function writeIerc20Permit<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof ierc20PermitABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof ierc20PermitABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: ierc20PermitABI, ...config } as unknown as WriteContractArgs<
    typeof ierc20PermitABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link ierc20PermitABI}__.
 */
export function prepareWriteIerc20Permit<
  TAbi extends readonly unknown[] = typeof ierc20PermitABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: ierc20PermitABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function getIMulticall3(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iMulticall3ABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function readIMulticall3<
  TAbi extends readonly unknown[] = typeof iMulticall3ABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: iMulticall3ABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function writeIMulticall3<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof iMulticall3ABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof iMulticall3ABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: iMulticall3ABI, ...config } as unknown as WriteContractArgs<
    typeof iMulticall3ABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function prepareWriteIMulticall3<
  TAbi extends readonly unknown[] = typeof iMulticall3ABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: iMulticall3ABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link ownableABI}__.
 */
export function getOwnable(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ownableABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ownableABI}__.
 */
export function readOwnable<
  TAbi extends readonly unknown[] = typeof ownableABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ownableABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link ownableABI}__.
 */
export function writeOwnable<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof ownableABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof ownableABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: ownableABI, ...config } as unknown as WriteContractArgs<
    typeof ownableABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link ownableABI}__.
 */
export function prepareWriteOwnable<
  TAbi extends readonly unknown[] = typeof ownableABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: ownableABI,
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
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendRevenueSafeABI}__.
 */
export function readSendRevenueSafe<
  TAbi extends readonly unknown[] = typeof sendRevenueSafeABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi' | 'address'>) {
  return readContract({
    abi: sendRevenueSafeABI,
    address: sendRevenueSafeAddress,
    ...config,
  } as unknown as ReadContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendRevenueSafeABI}__.
 */
export function writeSendRevenueSafe<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof sendRevenueSafeABI, TFunctionName>, 'abi' | 'address'>
    | Omit<WriteContractUnpreparedArgs<typeof sendRevenueSafeABI, TFunctionName>, 'abi' | 'address'>
) {
  return writeContract({
    abi: sendRevenueSafeABI,
    address: sendRevenueSafeAddress,
    ...config,
  } as unknown as WriteContractArgs<typeof sendRevenueSafeABI, TFunctionName>)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link sendRevenueSafeABI}__.
 */
export function prepareWriteSendRevenueSafe<
  TAbi extends readonly unknown[] = typeof sendRevenueSafeABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi' | 'address'>) {
  return prepareWriteContract({
    abi: sendRevenueSafeABI,
    address: sendRevenueSafeAddress,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
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
