import type { GetServerSidePropsContext } from 'next'

export function logRequest(ctx: GetServerSidePropsContext) {
  const ip =
    (ctx.req.headers['cf-connecting-ip'] ||
      ctx.req.headers['x-forwarded-for'] ||
      ctx.req.socket.remoteAddress) ??
    ''
  console.log(`${ctx.req.url} - ${ctx.req.headers['user-agent']} - ${ip}`)
}
