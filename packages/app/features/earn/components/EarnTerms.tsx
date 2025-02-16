import { Anchor, type AnchorProps, Paragraph, Shake, Theme } from '@my/ui'

export const EarnTerms = ({ hasError }: { hasError?: boolean }) => {
  const colorProps = {
    color: hasError ? '$lightGrayTextField' : '$lightGrayTextField',
    '$theme-light': {
      color: hasError ? '$error' : '$darkGrayTextField',
    },
  }

  return (
    <Paragraph flexShrink={1} maxWidth={'100%'} {...colorProps}>
      I accept{' '}
      <TermsLink href="https://info.send.it/send-docs/legal/terms-of-service" {...colorProps}>
        Terms of Service
      </TermsLink>
      ,{' '}
      <TermsLink href="https://info.send.it/send-docs/legal/privacy-policy" {...colorProps}>
        Privacy Policy
      </TermsLink>{' '}
      &{' '}
      <TermsLink href="https://info.send.it/send-docs/legal/disclaimer" {...colorProps}>
        Disclaimer of the Send Earn Program
      </TermsLink>
    </Paragraph>
  )
}

const TermsLink = (props: AnchorProps) => {
  return <Anchor target="_blank" textDecorationLine="underline" {...props} />
}
