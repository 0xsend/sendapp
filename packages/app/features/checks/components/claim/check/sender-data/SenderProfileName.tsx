import { Text } from '@my/ui'

interface Props {
  profileName: string
}

export const SenderProfileName = (props: Props) => {
  return (
    <Text fontWeight="bold" fontSize="$9">
      {props.profileName}
    </Text>
  )
}
