// Mock activity feed on it's own for maximum portability. esm vs cjs(playwright)
export const MockActivityFeed = [
  {
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
  },
  {
    created_at: '2024-05-26T13:36:07.15651+00:00',
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
      value: 20000000000000000,
      tx_hash: '\\x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c',
    },
  },
  {
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
  },
  {
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
    },
  },
  {
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
    },
  },
] as const

// you can use this to mock the activity feed by overriding the network request in the developer console
// https://developer.chrome.com/docs/devtools/overrides
// console.log(JSON.stringify(MockActivityFeed, null, 2))
