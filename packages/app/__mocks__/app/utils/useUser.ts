import { jest } from '@jest/globals'
const mock = {
  useUser: jest.fn().mockReturnValue({
    profile: {
      name: 'No Name',
      avatar_url: 'https://example.com',
    },
    user: {
      id: '123',
    },
    tags: [
      {
        name: 'tag1',
      },
    ],
    main_tag_id: 1,
    main_tag_name: 'tag1',
  }),
}

export const useUser = mock.useUser

export default mock
