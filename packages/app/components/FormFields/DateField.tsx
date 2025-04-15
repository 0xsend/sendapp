import { useDateFieldInfo, useTsController } from '@ts-react/form'
import { useId, useMemo } from 'react'

import {
  DatePicker,
  Fieldset,
  type FieldsetProps,
  Input,
  type InputProps,
  Label,
  type LabelProps,
  Paragraph,
  Shake,
  Stack,
  Theme,
  Tooltip,
  useMedia,
  useThemeName,
} from '@my/ui'
import { AlertTriangle } from '@tamagui/lucide-icons'

export const DateField = (
  props: InputProps & {
    fieldsetProps?: FieldsetProps
    labelProps?: LabelProps
    customDateFormatter?: (value?: Date) => string
  }
) => {
  const id = useId()
  const themeName = useThemeName()
  const media = useMedia()
  const { label, placeholder } = useDateFieldInfo()
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<Date>()

  const displayedValue = useMemo(() => {
    if (props.customDateFormatter) {
      return props.customDateFormatter(field.value)
    }

    if (!field.value) {
      return ''
    }

    return field.value.toLocaleString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  }, [props.customDateFormatter, field.value])

  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <Fieldset {...props.fieldsetProps} opacity={props.disabled ? 0.5 : 1}>
        {!!label && (
          <Label
            size={props.size || '$5'}
            fontFamily={'$mono'}
            lineHeight={'$11'}
            htmlFor={id}
            textTransform={'uppercase'}
            color={props.labelProps?.color ?? '$olive'}
            {...props.labelProps}
          >
            {label}
          </Label>
        )}
        <Shake shakeKey={error?.errorMessage}>
          <Tooltip
            open={error !== undefined && error.errorMessage !== undefined}
            placement={media.gtMd ? 'right' : 'bottom'}
          >
            <Tooltip.Content
              enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
              exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
              scale={1}
              x={0}
              y={0}
              opacity={1}
              animation={[
                'quick',
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
              boc={'$error'}
              borderWidth={1}
              $theme-dark={{ bc: '$black' }}
              $theme-light={{ bc: '$white' }}
            >
              <Tooltip.Arrow borderColor={'$error'} bw={4} />
              <Paragraph
                size={'$4'}
                $theme-dark={{ col: '$white' }}
                $theme-light={{ col: '$black' }}
              >
                {error?.errorMessage}
              </Paragraph>
            </Tooltip.Content>
            <Tooltip.Trigger>
              <DatePicker
                onChange={(value) => {
                  field.onChange(value)
                }}
                value={field.value}
              >
                <Input
                  aria-label={label ?? field.name}
                  disabled={isSubmitting}
                  editable={false}
                  style={{
                    cursor: 'pointer',
                  }}
                  borderWidth={0}
                  borderRadius={'$4'}
                  fontSize={'$5'}
                  fontStyle={field.value ? 'normal' : 'italic'}
                  fontWeight={field.value ? 'bold' : 'normal'}
                  $theme-dark={{
                    ...(process.env.NODE_ENV !== 'test' ? { placeholderTextColor: '$white' } : {}),
                  }}
                  $theme-light={{
                    ...(process.env.NODE_ENV !== 'test' ? { placeholderTextColor: '$black' } : {}),
                  }}
                  value={displayedValue}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  placeholder={placeholder}
                  id={id}
                  focusStyle={{
                    borderColor: '$color12',
                  }}
                  position="relative"
                  {...props}
                />
              </DatePicker>
            </Tooltip.Trigger>
            <Stack position="absolute" right="$4" bottom="$2.5" gap="$2">
              {error && (
                <Theme name={'red'}>
                  <AlertTriangle color={'$color9'} />
                </Theme>
              )}
            </Stack>
          </Tooltip>
        </Shake>
      </Fieldset>
    </Theme>
  )
}
