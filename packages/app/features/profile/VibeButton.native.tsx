import { Button, type ButtonProps, styled } from '@my/ui'
import { useRouter } from 'expo-router'

const _VibeButton = styled(Button, {
  elevation: 1,
  br: '$6',
  ai: 'center',
  jc: 'space-around',
  w: 'auto',
  maw: 100,
  h: 'auto',
  gap: '$2',
  f: 1,
  fd: 'column',
  p: 0,
  py: '$3.5',
})

export default function VibeButton({
  href,
  ...props
}: ButtonProps & { href: { pathname: string; query: Record<string, string> } }) {
  const router = useRouter()

  const onPress = () => {
    router.push({ pathname: href.pathname, params: href.query })
  }

  return <_VibeButton onPress={onPress} {...props} />
}
