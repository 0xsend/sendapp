import { describe, expect, it } from '@jest/globals'
import { UserSchema } from './UserSchema'

describe('UserSchema', () => {
  it('should parse a valid user', () => {
    expect(
      UserSchema.parse({
        id: '123',
        name: 'test',
        avatar_url: 'https://avatars.com',
        send_id: 1234,
        main_tag_id: null,
        main_tag_name: null,
      })
    ).toEqual({
      id: '123',
      name: 'test',
      avatar_url: 'https://avatars.com',
      send_id: 1234,
      tags: [],
      main_tag_id: null,
      main_tag_name: null,
      is_verified: false,
    })
  })
})
