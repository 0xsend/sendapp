import { useNumberFieldInfo, useTsController } from '@ts-react/form'
import { useId } from 'react'
import { Fieldset, Input, type InputProps, Label, Theme, useThemeName } from 'tamagui'
import { FieldError } from '../FieldError'
import { Shake } from '../Shake'

export const NumberField = (props: InputProps) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<number>()
  const { label, defaultValue, isOptional, placeholder, minValue, maxValue } = useNumberFieldInfo()
  const themeName = useThemeName()
  const id = useId()
  const disabled = isSubmitting
  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <Fieldset>
        {!!label && (
          <Label theme="alt1" size={props.size || '$3'} htmlFor={id}>
            {label} {isOptional && '(Optional)'}
          </Label>
        )}
        <Shake shakeKey={error?.errorMessage}>
          <Input
            accessibilityLabel={label}
            disabled={disabled}
            placeholderTextColor="$color10"
            keyboardType="number-pad"
            inputMode="numeric"
            value={field.value?.toString() || '0'}
            onChangeText={(text) => {
              const num = Number(text)
              if (Number.isNaN(num)) {
                if (!field.value) {
                  field.onChange(defaultValue || 0)
                }
                return
              }
              if (typeof maxValue !== 'undefined' && num > maxValue) {
                field.onChange(minValue)
                return
              }
              if (typeof minValue !== 'undefined' && num < minValue) {
                field.onChange(minValue)
                return
              }
              field.onChange(num)
            }}
            onBlur={field.onBlur}
            ref={field.ref}
            placeholder={placeholder}
            id={id}
            {...props}
          />
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}
