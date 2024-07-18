// Mock activity feed on it's own for maximum portability. esm vs cjs(playwright)
export const mockReceivedTransfer = {
  created_at: '2024-05-26T13:38:25+00:00',
  event_name: 'send_account_transfers',
  from_user: null,
  to_user: {
    id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
    name: null,
    avatar_url: null,
    send_id: 65244,
    tags: ['asdf', 'teq', 'yuw'],
  },
  data: {
    f: '\\x760e2928c3aa3af87897be52eb4833d42bbb27cf',
    t: '\\xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1',
    v: 19032,
    tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
    log_addr: '\\x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    block_num: '15164540',
    tx_idx: '0',
    log_idx: '2',
  },
}

export const mockSentTransfer = {
  created_at: '2024-05-27T13:36:07.15651+00:00',
  event_name: 'send_account_transfers',
  from_user: {
    id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
    name: null,
    avatar_url: null,
    send_id: 65244,
    tags: ['asdf', 'teq', 'yuw'],
  },
  to_user: {
    id: null,
    name: 'Mr. Dan Conn',
    avatar_url: 'https://i.pravatar.cc/500?u=Hortense Ratke',
    send_id: 12530,
    tags: ['dan'],
  },
  data: {
    f: '\\x760e2928c3aa3af87897be52eb4833d42bbb27cf',
    t: '\\xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1',
    v: 77777,
    tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
    log_addr: '\\x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    block_num: '15164541',
    tx_idx: '0',
    log_idx: '2',
  },
}

export const mockTagReceipt = {
  created_at: '2024-05-26T19:41:05.370+00:00',
  event_name: 'tag_receipts',
  from_user: {
    id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
    name: null,
    avatar_url: null,
    send_id: 65244,
    tags: ['asdf', 'teq', 'yuw'],
  },
  to_user: null,
  data: {
    tags: ['yuw'],
    value: '20000000000000000',
    log_addr: '\\x71fa02bb11e4b119bEDbeeD2f119F62048245301',
    block_num: 15164541,
    tx_idx: 0,
    log_idx: 2,
    tx_hash: '\\x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c',
  },
}

export const mockTagReceiptUSDC = {
  created_at: '2024-05-26T19:41:05.370+00:00',
  event_name: 'tag_receipt_usdc',
  from_user: {
    id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
    name: null,
    avatar_url: null,
    send_id: 65244,
    tags: ['asdf', 'teq'],
  },
  to_user: null,
  data: {
    tags: ['tag_receipt_usdc'],
    value: '2000000',
    log_addr: '\\x71fa02bb11e4b119bEDbeeD2f119F62048245301',
    block_num: 15164541,
    tx_idx: 0,
    log_idx: 2,
    tx_hash: '\\x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c',
  },
}

export const mockReferral = {
  created_at: '2024-05-26T19:41:05.370062+00:00',
  event_name: 'referrals',
  from_user: {
    id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
    name: null,
    avatar_url: null,
    send_id: 65244,
    tags: ['asdf', 'teq', 'yuw'],
  },
  to_user: {
    id: null,
    name: 'Mr. Dan Conn',
    avatar_url: 'https://i.pravatar.cc/500?u=Hortense Ratke',
    send_id: 12530,
    tags: ['disconnect_whorl7351'],
  },
  data: {
    tags: ['disconnect_whorl7351'],
  },
}

export const mockSendAccountReceive = {
  created_at: '2024-06-12T00:31:48+00:00',
  event_name: 'send_account_receives',
  from_user: {
    id: null,
    name: null,
    avatar_url: null,
    send_id: 65244,
    tags: null,
  },
  to_user: {
    id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
    name: null,
    avatar_url: null,
    send_id: 65244,
    tags: ['asdf', 'teq', 'yuw'],
  },
  data: {
    value: '10000000000000000',
    sender: '\\xa0ee7a142d267c1f36714e4a8f75612f20a79720',
    tx_idx: '0',
    log_idx: '0',
    tx_hash: '\\xeec33cc50042cbba53fc1de714bd99b206635f890dbe29771c7986df6da0f6af',
    log_addr: '\\xb2c21f54653531aa4affa80f63593913f0c70628',
    block_num: '15681483',
  },
} as const

export const mockSendtagReferralRewardUSDC = {
  created_at: '2024-07-18T19:32:08+00:00',
  event_name: 'send_account_transfers',
  from_user: null,
  to_user: {
    id: '5def5ec4-7f0e-4509-990f-d52e85e95187',
    name: null,
    avatar_url: null,
    send_id: 64705,
    tags: null,
  },
  data: {
    f: '\\x3936f906910C0f74b6d1536614068368B94CDa85',
    t: '\\x29369a06d3c17897e819c43202a7f4a1004b20cf',
    v: '8000000',
    tx_idx: '0',
    log_idx: '4',
    tx_hash: '\\x797a6a0fdd1c849e4e6e58bdc02966d19cff1eb8ef257216914288e715e460b8',
    log_addr: '\\x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    block_num: '17270890',
  },
}

const mockSigningKeyAdded = {
  created_at: '2024-05-29T13:34:26+00:00',
  event_name: 'send_account_signing_key_added',
  from_user: {
    id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
    name: null,
    avatar_url: null,
    send_id: 55617,
    tags: null,
  },
  to_user: null,
  data: {
    key: [
      '\\x351631d94d8cfc12f6adfc2586111990681f216c7d6d8531e669471293f32f07',
      '\\x83577aa62079c3bb5b813017df43832562d133feb3a7447d28849dac74c8aa43',
    ],
    account: '\\xa7ded3f6316c7d3b5ae2ed711cf535395db921b1',
    tx_hash: '\\x8c5eeeaf3c97bc2378854be36a99536dd181a1273b359ea714b9c1d4ed6c1e85',
    key_slot: 0,
    log_addr: '\\xa7ded3f6316c7d3b5ae2ed711cf535395db921b1',
    block_num: '15164541',
    tx_idx: '0',
    log_idx: '2',
  },
}

const mockSigningKeyRemoved = {
  created_at: '2024-05-29T13:34:26+00:00',
  event_name: 'send_account_signing_key_removed',
  from_user: {
    id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
    name: null,
    avatar_url: null,
    send_id: 55617,
    tags: null,
  },
  to_user: null,
  data: {
    key: [
      '\\x351631d94d8cfc12f6adfc2586111990681f216c7d6d8531e669471293f32f07',
      '\\x83577aa62079c3bb5b813017df43832562d133feb3a7447d28849dac74c8aa43',
    ],
    account: '\\xa7ded3f6316c7d3b5ae2ed711cf535395db921b1',
    tx_hash: '\\x8c5eeeaf3c97bc2378854be36a99536dd181a1273b359ea714b9c1d4ed6c1e85',
    key_slot: 0,
    log_addr: '\\xa7ded3f6316c7d3b5ae2ed711cf535395db921b1',
    block_num: '15164542',
    tx_idx: '0',
    log_idx: '2',
  },
}

// make it easier on yourself and add the events to the end of the array
export const MockActivityFeed = [
  mockReceivedTransfer,
  mockTagReceipt,
  mockReferral,
  mockSigningKeyAdded,
  mockSigningKeyRemoved,
  mockSentTransfer,
  mockSendAccountReceive,
  mockTagReceiptUSDC,
  mockSendtagReferralRewardUSDC,
] as const

// you can use this to mock the activity feed by overriding the network request in the developer console
// https://developer.chrome.com/docs/devtools/overrides
// console.log(JSON.stringify(MockActivityFeed, null, 2))
