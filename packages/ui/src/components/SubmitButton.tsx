import { useFormState } from 'react-hook-form'
import { AnimatePresence, type ButtonProps, Spinner, Unspaced, type SpinnerProps } from 'tamagui'
import { withStaticProperties } from '@tamagui/helpers'
import { PrimaryButton, PrimaryButtonText } from '../components/PrimaryButton'

// hack to prevent it from breaking on the server
const useIsSubmitting = () => {
  try {
    return useFormState().isSubmitting
  } catch (error) {
    return false
  }
}
/**
 * created to be used in forms
 * will show loading spinners and disable submission when already submitting
 */
const _SubmitButton = ({
  children,
  theme = 'green',
  disabled,
  spinnerProps,
  ...props
}: ButtonProps & { spinnerProps?: SpinnerProps }) => {
  const isSubmitting = useIsSubmitting()

  return (
    <PrimaryButton
      testID={'SubmitButton'}
      tabIndex={0}
      aria-busy={isSubmitting}
      iconAfter={
        <Unspaced>
          <AnimatePresence>
            {isSubmitting ? (
              <Spinner
                theme="light"
                color="$color12"
                key="loading-spinner"
                opacity={1}
                y={0}
                animation="quick"
                enterStyle={{
                  opacity: 0,
                  y: 4,
                }}
                exitStyle={{
                  opacity: 0,
                  y: 4,
                }}
                {...spinnerProps}
              />
            ) : null}
          </AnimatePresence>
        </Unspaced>
      }
      disabled={disabled || isSubmitting}
      theme={theme}
      {...props}
    >
      {!isSubmitting ? children : <></>}
    </PrimaryButton>
  )
}

export const SubmitButton = withStaticProperties(_SubmitButton, {
  Text: PrimaryButtonText,
})
