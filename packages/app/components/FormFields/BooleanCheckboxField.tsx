import { Check } from '@tamagui/lucide-icons'
import { useFieldInfo, useTsController } from '@ts-react/form'
import { useEffect, useState, useId } from 'react'
import {
  FieldError,
  Checkbox,
  type CheckboxProps,
  type CheckedState,
  Fieldset,
  Label,
  Theme,
  type ThemeName,
  XStack,
  useThemeName,
  type LabelProps,
} from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'

export const BooleanCheckboxField = (
  props: Pick<CheckboxProps, 'size' | 'native' | 'defaultChecked'> & { labelProps?: LabelProps }
) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<CheckedState>()
  const { label, isOptional } = useFieldInfo()
  const id = useId()
  const disabled = isSubmitting
  const defaultTheme = useThemeName() as string
  const { resolvedTheme } = useThemeSetting()
  const themeName = (resolvedTheme ?? defaultTheme) as ThemeName

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
              color={props.labelProps?.color ?? '$olive'}
              {...props.labelProps}
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
            {...props}
          >
            <Checkbox.Indicator>
              <Check />
            </Checkbox.Indicator>
          </Checkbox>
        </XStack>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}
