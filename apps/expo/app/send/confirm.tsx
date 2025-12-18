import { useSendScreenParams } from 'app/routers/params'
import { Redirect } from 'expo-router'

/**
 * Redirect /send/confirm to /send.
 * The SendChat component now handles confirmation inline.
 * Modal opens when idType and recipient params are present.
 */
export default function SendConfirmRedirect() {
  const [params] = useSendScreenParams()

  return (
    <Redirect
      href={{
        pathname: '/send',
        params: {
          idType: params.idType,
          recipient: params.recipient,
          amount: params.amount,
          sendToken: params.sendToken,
          note: params.note,
        },
      }}
    />
  )
}
