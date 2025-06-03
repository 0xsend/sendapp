/**
 * Tables that should be selected when seeding
 */
export const select = [
  'public.*',
  'shovel.*',
  '!pgtle.*',
  '!auth.*',
  '!net.*',
  '!realtime.*',
  '!_realtime.*',
  '!*.migrations',
  '!*.schema_migrations',
  'auth.users',
]
