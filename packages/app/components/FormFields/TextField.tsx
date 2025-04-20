import {
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
  useThemeName,
} from '@my/ui'
import type { IconProps } from '@tamagui/helpers-icon'
import { AlertTriangle } from '@tamagui/lucide-icons'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { useId } from 'react'

export const TextField = (
  props: InputProps & {
    fieldsetProps?: FieldsetProps
    labelProps?: LabelProps
    iconBefore?: React.ReactNode
    iconAfter?: React.ReactNode
    iconProps?: IconProps
  }
) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<string>()

  const { label, placeholder, maxLength, isEmail } = useStringFieldInfo()
  const themeName = useThemeName()
  const id = useId()
  const disabled = isSubmitting
  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <Fieldset {...props.fieldsetProps}>
        {!!label && (
          <Label
            size={props.size || '$5'}
            // $mono font is broken in tests
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
        <Stack pos="relative">
          {props.iconBefore && (
            <Stack
              pos={'absolute'}
              top="50%"
              p={'$3'}
              left={2}
              transform={'translateY(-50%)'}
              zIndex={1}
            >
              {props.iconBefore}
            </Stack>
          )}
          <Input
            aria-label={label ?? field.name}
            disabled={disabled}
            maxLength={maxLength}
            borderWidth={0}
            borderRadius={'$4'}
            fontSize={'$5'}
            fontWeight={field.value ? 'bold' : 'normal'}
            $theme-dark={{
              ...(process.env.NODE_ENV !== 'test' ? { placeholderTextColor: '$white' } : {}),
            }}
            $theme-light={{
              ...(process.env.NODE_ENV !== 'test' ? { placeholderTextColor: '$black' } : {}),
            }}
            spellCheck={isEmail ? false : undefined}
            autoCapitalize={isEmail ? 'none' : undefined}
            keyboardType={isEmail ? 'email-address' : undefined}
            value={field.value ?? ''}
            onChangeText={(text) => field.onChange(text)}
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
          {props.iconAfter && (
            <Stack
              pos={'absolute'}
              top="50%"
              p={'$3'}
              right={2}
              transform={'translateY(-50%)'}
              zIndex={1}
            >
              {props.iconAfter}
            </Stack>
          )}
        </Stack>
        <Stack position="absolute" right="$4" gap="$2">
          {(() => {
            switch (true) {
              case error !== undefined:
                return (
                  <Theme name={'red'}>
                    <AlertTriangle color={'$color9'} />
                  </Theme>
                )
              //@todo: Validating logic isn't working like it expect it to
              // case isValid:
              //   return <Check color={'$primary'} />
              default:
                return null
            }
          })()}
        </Stack>
        <Shake shakeKey={error?.errorMessage}>
          <Paragraph size={'$4'} $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            {error?.errorMessage}
          </Paragraph>
        </Shake>
      </Fieldset>
    </Theme>
  )
}
