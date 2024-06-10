import {
  Fieldset,
  type FieldsetProps,
  Input,
  type InputProps,
  Label,
  Paragraph,
  Shake,
  Stack,
  Theme,
  Tooltip,
  useMedia,
  useThemeName,
} from '@my/ui'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { useId } from 'react'

import { AlertTriangle } from '@tamagui/lucide-icons'

export const TextField = (props: InputProps & { fieldsetProps?: FieldsetProps }) => {
  const media = useMedia()
  const {
    field,
    error,
    formState: { isSubmitting, isValid },
  } = useTsController<string>()

  const { label, placeholder, isOptional, maxLength, isEmail } = useStringFieldInfo()
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
            color="$olive"
          >
            {label} {isOptional && '(Optional)'}
          </Label>
        )}
        <Shake shakeKey={error?.errorMessage}>
          {/* @todo: We should make it so that placement can be passed from props */}
          {/* @todo Write a native component. tooltip doesn't work on native. Maybe wrap into field error */}
          <Tooltip open={error !== undefined} placement={media.gtMd ? 'right' : 'bottom'}>
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
              <Input
                accessibilityLabel={label}
                disabled={disabled}
                maxLength={maxLength}
                borderWidth={0}
                borderRadius={'$4'}
                fontSize={'$5'}
                fontStyle={field.value ? 'normal' : 'italic'}
                fontWeight={field.value ? 'bold' : 'normal'}
                bc={'$color2'}
                $theme-dark={{
                  color: '$gray12Dark',
                  // placeholderTextColor fails in test env for some reason
                  ...(process.env.NODE_ENV !== 'test' ? { placeholderTextColor: '$white' } : {}),
                }}
                $theme-light={{
                  color: '$black',
                  // placeholderTextColor fails in test env for some reason
                  ...(process.env.NODE_ENV !== 'test' ? { placeholderTextColor: '$black' } : {}),
                }}
                // @todo use the theme colors if we ever have the palette scales
                // bc={'$color2'}
                // color={'$color12'}
                // placeholderTextColor={'$color10'}
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
            </Tooltip.Trigger>
          </Tooltip>
        </Shake>
        <Stack position="absolute" right="$4" bottom="$2.5" gap="$2">
          {(() => {
            switch (true) {
              case error !== undefined:
                return <AlertTriangle color={'$red500'} />
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
