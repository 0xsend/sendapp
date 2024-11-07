import { Button, ButtonText } from '@my/ui'
import { useRouter } from 'solito/router'

export const ManageChecksBtn = () => {
  const router = useRouter()

  const onPress = () => {
    router.push('/checks')
  }

  return (
    <Button onPress={onPress} theme="green" px="$15" br={12} disabledStyle={{ opacity: 0.5 }}>
      <ButtonText textTransform="uppercase">Manage checks</ButtonText>
    </Button>
  )
}
