import { faker } from '@faker-js/faker'
import type { Supawright } from 'supawright'
import { Database } from '@my/supabase/database.types'

// @todo this should be in a fixture
export async function createOtherUser(supawright: Supawright<Database, 'public'>) {
  const otherUser = await supawright.createUser({})
  const profile = {
    name: faker.person.fullName(),
    about: faker.lorem.sentence(),
    avatar_url: faker.image.avatar(),
  }
  const { error } = await supawright
    .supabase('public')
    .from('profiles')
    .update(profile)
    .eq('id', otherUser.id)
  if (error) {
    console.error('error updating profile', error)
    throw error
  }

  const tag = await supawright.create('tags', {
    status: 'confirmed',
    user_id: otherUser.id,
  })
  const acct = await supawright.create('send_accounts', {
    user_id: otherUser.id,
  })
  return { otherUser, profile, tag, acct }
}
