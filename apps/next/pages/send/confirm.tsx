import type { GetServerSideProps } from 'next'

/**
 * Redirect /send/confirm to /send.
 * The SendChat component now handles confirmation inline.
 * Modal opens when idType and recipient params are present.
 */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // Pass through all query params to /send
  const queryString = ctx.resolvedUrl.split('?')[1] || ''
  return {
    redirect: {
      destination: `/send${queryString ? `?${queryString}` : ''}`,
      permanent: true,
    },
  }
}

export default function SendConfirmRedirect() {
  // This component won't render due to the redirect
  return null
}
