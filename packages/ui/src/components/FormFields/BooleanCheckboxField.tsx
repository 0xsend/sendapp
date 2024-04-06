import { Check } from '@tamagui/lucide-icons'
import { useFieldInfo, useTsController } from '@ts-react/form'
import { useEffect, useState, useId } from 'react'
import {
  Checkbox,
  type CheckboxProps,
  type CheckedState,
  Fieldset,
  Label,
  Theme,
  type ThemeName,
  XStack,
  useThemeName,
} from 'tamagui'
import { FieldError } from '../FieldError'
import { useThemeSetting } from '@tamagui/next-theme'

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
              color="$olive"
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
            $theme-dark={{
              bc: '$accent1Dark',
            }}
            $theme-light={{
              bc: '$accent1Light',
            }}
            {...props}
          >
            <Checkbox.Indicator>
              <Check
                $theme-dark={{
                  bc: '$accent1Dark',
                  color: '$accent12Dark',
                }}
                $theme-light={{
                  bc: '$accent1Light',
                  color: '$accent12Light',
                }}
              />
            </Checkbox.Indicator>
          </Checkbox>
        </XStack>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}
