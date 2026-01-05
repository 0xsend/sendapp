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
  type StackProps,
} from '@my/ui'
import type { IconProps } from '@tamagui/helpers-icon'
import { AlertTriangle } from '@tamagui/lucide-icons'
import { useTsController } from '@ts-react/form'
import { useId } from 'react'
import IconBefore from './IconBefore/IconBefore'
import IconAfter from './IconAfter/IconAfter'

/**
 * A form field for EVM addresses.
 *
 * This is similar to TextField but doesn't use useStringFieldInfo() since
 * the evmAddress schema uses ZodEffects (refine/transform) which is incompatible
 * with useStringFieldInfo.
 */
export const EvmAddressField = (
  props: InputProps & {
    fieldsetProps?: FieldsetProps
    labelProps?: LabelProps
    iconBefore?: React.ReactNode
    iconAfter?: React.ReactNode
    iconProps?: IconProps
    iconBeforeProps?: StackProps
    iconAfterProps?: StackProps
  }
) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<string>()

  const themeName = useThemeName()
  const id = useId()
  const disabled = isSubmitting

  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <Fieldset {...props.fieldsetProps}>
        {props.iconBefore && <IconBefore {...props.iconBeforeProps}>{props.iconBefore}</IconBefore>}
        <Input
          aria-label={field.name}
          disabled={disabled}
          borderWidth={0}
          borderRadius={'$4'}
          fontSize={'$5'}
          fontWeight={field.value ? 'bold' : 'normal'}
          placeholderTextColor={'$color4'}
          autoCapitalize="none"
          autoCorrect={false}
          value={field.value ?? ''}
          onChangeText={(text) => field.onChange(text)}
          onBlur={field.onBlur}
          ref={field.ref}
          placeholder={props.placeholder ?? '0x...'}
          id={id}
          focusStyle={{
            borderColor: '$color12',
          }}
          position="relative"
          {...props}
        />
        {props.iconAfter && <IconAfter {...props.iconAfterProps}>{props.iconAfter}</IconAfter>}
        <Stack
          position="absolute"
          alignItems={'center'}
          jc={'center'}
          right="$4"
          t={0}
          b={0}
          gap="$2"
        >
          {(() => {
            switch (true) {
              case error !== undefined:
                return (
                  <Theme name={'red'}>
                    <AlertTriangle color={'$color9'} />
                  </Theme>
                )
              default:
                return null
            }
          })()}
        </Stack>
        <Shake shakeKey={error?.errorMessage}>
          {error?.errorMessage && (
            <Paragraph size={'$4'} $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
              {error?.errorMessage}
            </Paragraph>
          )}
        </Shake>
      </Fieldset>
    </Theme>
  )
}
