import { EventArraySchema } from 'app/utils/zod/activity'

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
] as const

export const useActivityFeed = jest.fn().mockReturnValue({
  data: {
    pages: [EventArraySchema.parse(MockActivityFeed)],
  },
  isLoading: false,
  error: null,
})

export default {
  useActivityFeed,
}
