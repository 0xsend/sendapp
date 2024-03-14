import { Check } from '@tamagui/lucide-icons'
import { useFieldInfo, useTsController } from '@ts-react/form'
import { useEffect, useState, useId } from 'react'
import {
  Checkbox,
  CheckboxProps,
  CheckedState,
  Fieldset,
  Label,
  Theme,
  XStack,
  useThemeName,
} from 'tamagui'
import { FieldError } from '../FieldError'

export const BooleanCheckboxField = (
  props: Pick<CheckboxProps, 'size' | 'native' | 'defaultChecked'>
) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<CheckedState>()
  const { label, isOptional } = useFieldInfo()
  const id = useId()
  const themeName = useThemeName()
  const disabled = isSubmitting

  const [isChecked, setIsChecked] = useState(props.defaultChecked)

  useEffect(() => {
    setIsChecked(props.defaultChecked)
  }, [props.defaultChecked])

  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <Fieldset>
        <XStack gap="$4" ai={'center'}>
          {!!label && (
            <Label
              size={props.size || '$5'}
              fontFamily={'$mono'}
              lineHeight={52}
              htmlFor={id}
              textTransform={'uppercase'}
            >
              {label} {isOptional && '(Optional)'}
            </Label>
          )}
          <Checkbox
            disabled={disabled}
            checked={isChecked}
            onCheckedChange={(checked) => {
              setIsChecked(checked)
              field.onChange(checked)
            }}
            ref={field.ref}
            id={id}
            borderWidth={0}
            backgroundColor={'$charcoal'}
            {...props}
          >
            <Checkbox.Indicator>
              <Check color={'$color12'} />
            </Checkbox.Indicator>
          </Checkbox>
        </XStack>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}
