import { useFormState } from 'react-hook-form'
import { AnimatePresence, Button, type ButtonProps, ButtonText, Spinner, Unspaced } from 'tamagui'

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
export const SubmitButton = ({ children, theme = 'green', ...props }: ButtonProps) => {
  const isSubmitting = useIsSubmitting()

  return (
    <Button
      testID={'SubmitButton'}
      tabIndex={0}
      aria-busy={isSubmitting}
      iconAfter={
        <Unspaced>
          <AnimatePresence>
            {isSubmitting ? (
              <Spinner
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
              />
            ) : null}
          </AnimatePresence>
        </Unspaced>
      }
      disabled={isSubmitting}
      theme={theme}
      {...props}
    >
      {!isSubmitting ? <ButtonText>{children}</ButtonText> : <></>}
    </Button>
  )
}
