import { Paragraph } from '@my/ui'
import { useRouter } from 'expo-router'

export default function ViewHistoryButton({ sendId }: { sendId?: number | null }) {
  const router = useRouter()

  const onPress = () => {
    router.push(`/profile/${sendId}/history`)
  }

  return (
    <Paragraph
      textDecorationLine="underline"
      onPress={onPress}
      als="flex-start"
      fontSize={'$5'}
      color="$color10"
    >
      View History
    </Paragraph>
  )
}
