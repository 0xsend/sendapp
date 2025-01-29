import { Anchor, Paragraph } from '@my/ui'

export const EarnTerms = () => {
  return (
    <Paragraph color={'$lightGrayTextField'} $theme-light={{ color: '$darkGrayTextField' }}>
      I accept{' '}
      <TermsLink
        // TODO plug real hrefs
        text={'Terms of Service'}
        href="/terms"
      />
      , <TermsLink href="/privacy" text={'Privacy Policy'} /> &{' '}
      <TermsLink href="/disclaimer" text={'Disclaimer of the Send Earn Program'} />
    </Paragraph>
  )
}

const TermsLink = ({ text, href }: { text: string; href: string }) => {
  return (
    <Anchor
      href={href}
      target="_blank"
      textDecorationLine="underline"
      color={'$lightGrayTextField'}
      $theme-light={{ color: '$darkGrayTextField' }}
    >
      {text}
    </Anchor>
  )
}
