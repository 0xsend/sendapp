import { Turnstile as TurnstileOG, type TurnstileProps } from '@marsidev/react-turnstile'

export const Turnstile = (props: Omit<TurnstileProps, 'siteKey'>) => {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
    <TurnstileOG {...props} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
  ) : null
}
