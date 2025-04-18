import {
  Fieldset,
  type FieldsetProps,
  Input,
  type InputProps,
  Label,
  Paragraph,
  Shake,
  Stack,
  type LabelProps,
  Theme,
  Tooltip,
  useMedia,
  useThemeName,
} from '@my/ui'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { useId } from 'react'

import { AlertTriangle } from '@tamagui/lucide-icons'
import type { IconProps } from '@tamagui/helpers-icon'

export const TextField = (
  props: InputProps & {
    fieldsetProps?: FieldsetProps
    labelProps?: LabelProps
    iconBefore?: React.ReactNode
    iconAfter?: React.ReactNode
    iconProps?: IconProps
  }
) => {
  const media = useMedia()
  const {
    field,
    error,
    formState: {
      isSubmitting,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      isValid,
    },
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
        <Shake shakeKey={error?.errorMessage}>
          {/* @todo: We should make it so that placement can be passed from props */}
          {/* @todo Write a native component. tooltip doesn't work on native. Maybe wrap into field error */}
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
              boc={'$red500'}
              borderWidth={1}
              $theme-dark={{ bc: '$black' }}
              $theme-light={{ bc: '$white' }}
            >
              <Tooltip.Arrow borderColor={'$red500'} bw={4} />
              <Paragraph
                size={'$4'}
                $theme-dark={{ col: '$white' }}
                $theme-light={{ col: '$black' }}
              >
                {error?.errorMessage}
              </Paragraph>
            </Tooltip.Content>
            <Tooltip.Trigger>
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
            </Tooltip.Trigger>
          </Tooltip>
        </Shake>
        <Stack position="absolute" right="$4" bottom="$2.5" gap="$2">
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
      </Fieldset>
    </Theme>
  )
}
