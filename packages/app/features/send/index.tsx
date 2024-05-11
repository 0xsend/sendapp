import { Spinner } from '@my/ui'
import { SendForm } from 'app/features/send/SendForm'
import { useSendParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'

export const SendScreen = () => {
  const { recipient } = useSendParams()
  const { data: profile, isLoading, error } = useProfileLookup(recipient)
  if (isLoading) return <Spinner size="large" />
  if (error) throw new Error(error.message)
  if (!profile) return 'No profile found'

  return <SendForm profile={profile} />
}
