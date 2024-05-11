import { Spinner } from '@my/ui'
import { useSendParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { SendAmountForm } from './SendAmountForm'

export const SendScreen = () => {
  const {
    params: { recipient },
  } = useSendParams()
  const { data: profile, isLoading, error } = useProfileLookup('tag', recipient)

  if (isLoading) return <Spinner size="large" />
  if (error) return error.message
  if (!profile) return 'No profile found'

  return <SendAmountForm />
}
