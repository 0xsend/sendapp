import {
  FieldError,
  Fieldset,
  Label,
  type LabelProps,
  Shake,
  Stack,
  type StackProps,
  TextArea,
  type TextAreaProps,
  Theme,
  type ThemeName,
  useThemeName,
} from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { type ReactNode, useId } from 'react'
import IconBefore from './IconBefore/IconBefore'
import IconAfter from './IconAfter/IconAfter'

export const TextAreaField = (
  props: TextAreaProps & {
    labelProps?: LabelProps
    iconBefore?: ReactNode
    iconAfter?: ReactNode
    iconBeforeProps?: StackProps
    iconAfterProps?: StackProps
  }
) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<string>()
  const { label, placeholder } = useStringFieldInfo()
  const id = useId()
  const disabled = isSubmitting
  const defaultTheme = useThemeName() as string
  const { resolvedTheme } = useThemeSetting()
  const themeName = (resolvedTheme ?? defaultTheme) as ThemeName

  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <Fieldset>
        {!!label && (
          <Label
            size={props.size || '$5'}
            htmlFor={id}
            fontFamily={props.labelProps?.fontFamily ?? '$mono'}
            lineHeight={props.labelProps?.lineHeight ?? 52}
            textTransform={props.labelProps?.textTransform ?? 'uppercase'}
            color={props.labelProps?.color ?? '$olive'}
            {...props.labelProps}
          >
            {label}
          </Label>
        )}
        <Shake shakeKey={error?.errorMessage}>
          <Stack pos="relative">
            {props.iconBefore && (
              <IconBefore {...props.iconBeforeProps}>{props.iconBefore}</IconBefore>
            )}
            <TextArea
              disabled={disabled}
              width={'100%'}
              borderWidth={0}
              borderRadius={'$4'}
              lineHeight={18}
              placeholderTextColor={'$color4'}
              // @todo use the theme colors if we ever have the palette scales
              // bc={'$color2'}
              // color={'$color12'}
              // placeholderTextColor={'$color10'}
              value={field.value}
              onChangeText={(text) => field.onChange(text)}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={placeholder}
              id={id}
              focusStyle={{
                fontStyle: 'italic',
                borderColor: '$color12',
              }}
              {...props}
            />
            {props.iconAfter && <IconAfter {...props.iconAfterProps}>{props.iconAfter}</IconAfter>}
          </Stack>
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}
