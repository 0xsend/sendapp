import { Link } from '@my/ui'

export default function ViewHistoryButton({ sendId }: { sendId?: number | null }) {
  return (
    <Link
      textDecorationLine="underline"
      href={`/profile/${sendId}/history`}
      als="flex-start"
      fontSize={'$5'}
      color="$color10"
    >
      View History
    </Link>
  )
}
