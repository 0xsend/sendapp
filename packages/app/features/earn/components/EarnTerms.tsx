import { Anchor, type AnchorProps, Paragraph } from '@my/ui'
import { Trans, useTranslation } from 'react-i18next'

export const EarnTerms = ({ hasError }: { hasError?: boolean }) => {
  const { t } = useTranslation('earn')
  const colorProps = {
    color: hasError ? '$error' : '$lightGrayTextField',
    '$theme-light': {
      color: hasError ? '$error' : '$darkGrayTextField',
    },
  } as const

  return (
    <Paragraph flexShrink={1} maxWidth={'100%'} {...colorProps}>
      <Trans
        t={t}
        i18nKey="deposit.terms.text"
        components={{
          tos: (
            <TermsLink href="https://info.send.it/docs/legal/terms-of-service" {...colorProps} />
          ),
          privacy: (
            <TermsLink href="https://info.send.it/docs/legal/privacy-policy" {...colorProps} />
          ),
          disclaimer: (
            <TermsLink href="https://info.send.it/docs/legal/disclaimer" {...colorProps} />
          ),
        }}
      />
    </Paragraph>
  )
}

const TermsLink = (props: AnchorProps) => {
  return <Anchor target="_blank" textDecorationLine="underline" {...props} />
}
