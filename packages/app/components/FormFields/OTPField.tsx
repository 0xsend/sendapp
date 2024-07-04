import {
  FieldError,
  Fieldset,
  Input,
  Label,
  Shake,
  Theme,
  XStack,
  useThemeName,
  type InputProps,
} from '@my/ui'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { useId, useState } from 'react'

export const OTPField = (props: InputProps) => {
  const { field, error } = useTsController<string>()
  const { label, placeholder, isOptional } = useStringFieldInfo()
  const themeName = useThemeName()
  const id = useId()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])

  const onChangeText = (text, index) => {
    const temp = otp
    otp[index] = text
    setOtp(temp)
    field.onChange(otp.join(''))
  }

  const onChange = async (event, index) => {
    let nextIndex = index
    if (event.nativeEvent.inputType === 'deleteContentBackward' && index > 0) {
      nextIndex = index - 1
    } else if (event.nativeEvent.inputType !== 'deleteContentBackward' && index < 6) {
      nextIndex = index + 1
    }
    if (event.nativeEvent.inputType === 'insertFromPaste') {
      //fetch the last copied element from clipboard
      const d = await navigator.clipboard.readText()
      if (typeof d === 'string') {
        setOtp(d.split('').slice(0, 6))
        const length = d.length
        nextIndex = Math.min(5, length)
      }
    }

    const elementWithTabIndex = document.querySelector(
      `[data-selector="otp-${nextIndex}"]`
    ) as HTMLElement | null
    if (elementWithTabIndex) {
      elementWithTabIndex.focus()
    }
  }

  const onKeyPress = (event, index) => {
    if (event?.key === 'Backspace' && event.target?.value === '' && index > 0) {
      const elementWithTabIndex = document.querySelector(
        `[data-selector="otp-${index - 1}"]`
      ) as HTMLElement | null
      if (elementWithTabIndex) {
        elementWithTabIndex.focus()
      }
    }
  }

  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <XStack gap={'$0.25'} jc={'flex-start'}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Fieldset flex={1} key={index}>
            {!!label && (
              <Label theme="alt1" size={props.size || '$3'} htmlFor={id}>
                {label} {isOptional && '(Optional)'}
              </Label>
            )}
            <Shake shakeKey={error?.errorMessage}>
              <Input
                autoComplete={'off'}
                textAlign={'center'}
                maxLength={1}
                placeholderTextColor="$color10"
                keyboardType={'number-pad'}
                value={otp[index]}
                height={'$5'}
                width={'$6'}
                $sm={{ width: '$3', height: '$3' }}
                $gtSm={{ width: '$4', height: '$3' }}
                $md={{ width: '$4', height: '$5' }}
                $gtLg={{ width: '$6', height: '$5' }}
                tabIndex={index}
                onChangeText={(text) => onChangeText(text, index)}
                onChange={(event) => onChange(event, index)}
                onKeyPress={(event) => onKeyPress(event, index)}
                onBlur={field.onBlur}
                ref={field.ref}
                placeholder={placeholder}
                id={id}
                data-selector={`otp-${index}`}
                {...props}
              />
            </Shake>
          </Fieldset>
        ))}
      </XStack>
      <FieldError message={error?.errorMessage} />
    </Theme>
  )
}
