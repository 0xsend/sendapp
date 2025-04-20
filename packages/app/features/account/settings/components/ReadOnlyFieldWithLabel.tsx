import { FieldWithLabel } from 'app/features/account/settings/components/FieldWithLabel'
import { Paragraph } from '@my/ui'

export const ReadOnlyFieldWithLabel = ({
  label,
  text,
  additionalInfo,
}: {
  label: string
  text: string
  additionalInfo?: string
}) => {
  return (
    <FieldWithLabel label={label} additionalInfo={additionalInfo}>
      <Paragraph size={'$5'} color={'$color12'}>
        {text}
      </Paragraph>
    </FieldWithLabel>
  )
}
