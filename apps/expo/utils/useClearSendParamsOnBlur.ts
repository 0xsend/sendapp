import { useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import { useSendScreenParams } from 'app/routers/params'

/**
 * Clears send recipient params (idType, recipient, note) when the screen loses focus.
 * This prevents stale params from reopening SendChat when navigating back to the screen.
 *
 * Should be used in expo screen wrappers, not in shared app code.
 */
export function useClearSendParamsOnBlur() {
  const [sendParams, setSendParams] = useSendScreenParams()

  // Use refs to access current values in cleanup without causing re-runs
  const sendParamsRef = useRef(sendParams)
  sendParamsRef.current = sendParams
  const setSendParamsRef = useRef(setSendParams)
  setSendParamsRef.current = setSendParams

  useFocusEffect(
    useCallback(() => {
      // Cleanup runs when screen loses focus
      return () => {
        setSendParamsRef.current({
          idType: undefined,
          recipient: undefined,
          note: undefined,
          // Preserve amount and sendToken
          amount: sendParamsRef.current.amount,
          sendToken: sendParamsRef.current.sendToken,
        })
      }
    }, [])
  )
}
