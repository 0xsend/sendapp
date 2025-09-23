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
  props: CheckboxProps & {
    labelProps?: LabelProps
  }
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

  // Filter out props that shouldn't reach the DOM (e.g., enumValues from ts-react/form)
  const { labelProps: labelPropsIn } =
    (props as unknown as CheckboxProps & { enumValues?: unknown; labelProps?: LabelProps }) || {}
  const checkboxProps = {
    ...(props as unknown as CheckboxProps & { enumValues?: unknown; labelProps?: LabelProps }),
  }
  // Remove non-DOM prop to avoid leaking to Checkbox/web
  ;(checkboxProps as { enumValues?: undefined }).enumValues = undefined

  const [isChecked, setIsChecked] = useState(checkboxProps.defaultChecked)

  useEffect(() => {
    setIsChecked(checkboxProps.defaultChecked)
  }, [checkboxProps.defaultChecked])

  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <Fieldset>
        <XStack gap="$4" ai={'center'}>
          {!!label && (
            <Label
              size={checkboxProps.size || '$5'}
              fontFamily={'$mono'}
              lineHeight={52}
              htmlFor={id}
              textTransform={'uppercase'}
              color={labelPropsIn?.color ?? '$olive'}
              {...labelPropsIn}
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
            backgroundColor={isChecked ? '$primary' : '$background'}
            circular={true}
            {...checkboxProps}
          >
            <Checkbox.Indicator>
              <Check color={'$black'} />
            </Checkbox.Indicator>
          </Checkbox>
        </XStack>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}
