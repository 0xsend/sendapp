import { type CreateTRPCReact, createTRPCReact } from '@trpc/react-query'

import type { AppRouter } from '@my/api'
import { httpBatchLink, httpLink, splitLink } from '@trpc/client'
import SuperJSON from 'superjson'
import getBaseUrl from './getBaseUrl'
import { supabase } from './supabase/client.native'

export const api: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>()
export const createTrpcClient = () =>
  api.createClient({
    links: [
      splitLink({
        condition(op) {
          return op.type === 'query' && op.path.startsWith('coinGecko.')
        },
        // Public coin endpoints -> GET without auth/cookies to enable CDN caching
        true: httpLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: SuperJSON,
          fetch(url, opts) {
            return fetch(url, { ...opts, credentials: 'omit' } as RequestInit)
          },
        }),
        // Everything else - split again for temporal.transfer workaround
        false: splitLink({
          condition(op) {
            // Apply XHR workaround only to temporal.transfer mutations
            return op.type === 'mutation' && op.path === 'temporal.transfer'
          },
          // temporal.transfer: Use httpLink with XHR (iOS fetch hangs on this endpoint)
          true: httpLink({
            transformer: SuperJSON,
            url: `${getBaseUrl()}/api/trpc`,
            async headers() {
              const headers = new Map<string, string>()
              headers.set('x-trpc-source', 'expo-react')
              const session = (await supabase.auth.getSession()).data.session

              if (session?.access_token) {
                headers.set('Authorization', `Bearer ${session.access_token}`)
                headers.set('Refresh-Token', `${session.refresh_token}`)
              }
              return Object.fromEntries(headers)
            },
            async fetch(url, opts) {
              const signal = opts?.signal

              // Use XMLHttpRequest for temporal.transfer to avoid iOS fetch hang
              return new Promise<Response>((resolve, reject) => {
                const xhr = new XMLHttpRequest()

                // Convert url to string (it can be Request | string | URL)
                const urlString = typeof url === 'string' ? url : url.toString()
                xhr.open(opts?.method || 'GET', urlString)

                // Set headers
                if (opts?.headers) {
                  for (const [key, value] of Object.entries(
                    opts.headers as Record<string, string>
                  )) {
                    xhr.setRequestHeader(key, value)
                  }
                }

                // Handle abort signal
                if (signal) {
                  signal.addEventListener('abort', () => {
                    xhr.abort()
                    reject(new DOMException('Aborted', 'AbortError'))
                  })
                }

                xhr.onload = () => {
                  // Create Response object from XHR
                  const response = new Response(xhr.responseText, {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: new Headers(
                      xhr
                        .getAllResponseHeaders()
                        .split('\r\n')
                        .reduce(
                          (acc, line) => {
                            const [key, value] = line.split(': ')
                            if (key && value) acc[key] = value
                            return acc
                          },
                          {} as Record<string, string>
                        )
                    ),
                  })

                  resolve(response)
                }

                xhr.onerror = () => {
                  reject(new TypeError('Network request failed'))
                }

                xhr.ontimeout = () => {
                  reject(new TypeError('Network request timed out'))
                }

                xhr.timeout = 60000 // 60 second timeout

                xhr.send(opts?.body as string | undefined)
              })
            },
          }),
          // Everything else: Use httpBatchLink with normal fetch for performance
          false: httpBatchLink({
            transformer: SuperJSON,
            url: `${getBaseUrl()}/api/trpc`,
            async headers() {
              const headers = new Map<string, string>()
              headers.set('x-trpc-source', 'expo-react')
              const session = (await supabase.auth.getSession()).data.session

              if (session?.access_token) {
                headers.set('Authorization', `Bearer ${session.access_token}`)
                headers.set('Refresh-Token', `${session.refresh_token}`)
              }
              return Object.fromEntries(headers)
            },
          }),
        }),
      }),
    ],
  })

export type { RouterInputs, RouterOutputs } from '@my/api'
