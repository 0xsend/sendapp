import { type BrowserContext, mergeTests } from '@playwright/test'
import { test as ethereumTest } from '../ethereum'
import { test as webauthnTest } from '../webauthn'
import { test as snapletTest } from '../snaplet'

import type { Database, Tables } from '@my/supabase/database.types'
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'
import {
  createSupabaseAdminClient,
  SUPABASE_SUBDOMAIN,
  SUPABASE_URL,
} from 'app/utils/supabase/admin'
import debug from 'debug'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import config from '../../../playwright.config'
import { assert } from 'app/utils/assert'
import { faker } from '@faker-js/faker'
import { generateCountry, generatePhone } from '../../utils/generators'

let log: debug.Debugger

const supabaseCookieRegex = /sb-[a-z0-9]+-auth-token/

export const getAuthSessionFromContext = async (context: BrowserContext) => {
  const cookies = await context.cookies()
  const authCookie = cookies.find((cookie) => cookie.name.match(supabaseCookieRegex))?.value
  if (!authCookie) {
    throw new Error('Supabase auth cookie not found')
  }

  // grab auth session from jwt
  const authSessionDecoded = decodeURIComponent(authCookie)
  const authSessionParsed = JSON.parse(authSessionDecoded)
  const token = authSessionParsed[0] as string
  const decoded = jwt.decode(token) as JwtPayload

  if (!decoded || !decoded.sub) {
    throw new Error('could not decode user jwt from cookie')
  }

  return { token, decoded }
}

const authTest = snapletTest.extend<{
  context: BrowserContext
  supabase: SupabaseClient<Database>
  authSession: { token: string; decoded: JwtPayload }
  user: {
    user: User
    session: Session
    profile: Tables<'profiles'>
  }
}>({
  context: async ({ pg, context, user: { user, session } }, use) => {
    const { parallelIndex } = test.info()

    log = debug(`test:auth:${user.id}:${parallelIndex}`)

    if (!config?.use?.baseURL) {
      throw new Error('config.use.baseURL not defined')
    }
    const { access_token, refresh_token } = session

    // @note see how Supabase does it here: https://github.com/supabase/supabase-js/blob/f6bf008d8017ae013450ecd3fa806acad735bacc/src/SupabaseClient.ts#L95
    assert(!!SUPABASE_SUBDOMAIN, 'subdomain not found')
    const name = `sb-${SUPABASE_SUBDOMAIN}-auth-token`
    const domain = new URL(config.use.baseURL).hostname
    assert(!!domain, 'domain not found')

    log(
      'setting auth cookie',
      `id=${parallelIndex}`,
      `user=${user.id}`,
      `domain=${domain}`,
      `name=${name}`
    )

    // set auth session cookie
    await context.addCookies([
      {
        name,
        value: encodeURIComponent(JSON.stringify([access_token, refresh_token, null, null, null])),
        domain,
        path: '/',
      },
    ])

    // set debug in localStorage
    await context.addInitScript(() => {
      console.log('setting debug in localStorage to app:*')
      localStorage.setItem('debug', 'app:*')
    })

    try {
      await use(context)
    } finally {
      // @todo figure out why this doesn't work after adding activity feed
      // delete the user
      // await supabaseAdmin.auth.admin.deleteUser(user.id).then(({ error }) => {
      //   if (error) {
      //     log('error deleting user', `id=${parallelIndex}`, `user=${user.id}`, error)
      //   }
      // })
      await pg.query('delete from auth.users where id = $1', [user.id]).catch((e) => {
        log('error deleting user', `id=${parallelIndex}`, `user=${user.id}`, e)
      })
    }
  },

  // biome-ignore lint/correctness/noEmptyPattern: playwright/test needs empty pattern
  user: async ({}, use) => {
    const { parallelIndex } = test.info()
    log = debug(`test:auth:${parallelIndex}`)
    const supabaseAdmin = createSupabaseAdminClient()

    const randomNumber = generatePhone()
    const country = generateCountry()
    const { data, error } = await supabaseAdmin.auth.signUp({
      options: {
        data: {
          parallelIndex,
          workerIndex: test.info().workerIndex,
        },
      },
      email: `${faker.internet.userName()}@${faker.internet.domainName()}`,
      password: 'changeme',
    })

    if (error) {
      log('error creating user', `id=${parallelIndex}`, error)
      throw error
    }

    assert(!!data.user, 'user not found')
    assert(!!data.session, 'session not found')

    const { user } = data
    const { session } = data

    log('created user', `id=${parallelIndex}`, `user=${user.id}`)

    // update profile
    await supabaseAdmin
      .from('profiles')
      .update({
        name: faker.person.fullName(),
        about: faker.lorem.sentence(),
        avatar_url: faker.image.avatar(),
      })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) {
          log('error updating profile', `id=${parallelIndex}`, `user=${user.id}`, error)
          throw error
        }
      })

    const profile = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          log('error fetching profile', `id=${parallelIndex}`, `user=${user.id}`, error)
          throw error
        }
        return data
      })
    await use({ user, session, profile })
  },
  authSession: async ({ context }, use) => {
    const { token, decoded } = await getAuthSessionFromContext(context)
    await use({ token, decoded })
  },
  supabase: async ({ authSession, context }, use) => {
    const { token } = authSession
    use(
      createClient(SUPABASE_URL, token, {
        auth: { persistSession: false },
        global: {
          fetch: async (url: URL | RequestInfo, init?: RequestInit) => {
            const headersObject = init?.headers
              ? init?.headers.entries instanceof Function
                ? Object.fromEntries(init?.headers.entries())
                : init?.headers
              : {}

            // Fetch using Playwright's context
            const response = await context.request.fetch(url.toString(), {
              method: init?.method,
              data: init?.body,
              headers: headersObject,
            })

            // Convert back to node-fetch response
            const responseBody = await response.text()
            const nodeFetchResponse = new Response(responseBody, {
              status: response.status(),
              statusText: response.statusText(),
              headers: response.headers(),
            })

            return nodeFetchResponse
          },
        },
      })
    )
  },
})
export const test = mergeTests(webauthnTest, ethereumTest, authTest)

export const expect = test.expect
