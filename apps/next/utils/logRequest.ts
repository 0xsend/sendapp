import type { GetServerSidePropsContext } from 'next'

export function logRequest(ctx: GetServerSidePropsContext) {
  console.log(
    `${ctx.req.url} - ${ctx.req.headers['user-agent']}${
      ctx.req.headers['x-forwarded-for'] ? ` - ${ctx.req.headers['x-forwarded-for']}` : ''
    }`
  )
}
