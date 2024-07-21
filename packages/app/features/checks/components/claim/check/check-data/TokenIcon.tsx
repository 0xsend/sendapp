import { Circle, Image, Link } from '@my/ui'

interface Props {
  tokenImageUrl: string
  tokenName?: string
  tokenInfoUrl?: string
  tokenIconSize?: number
}

export const TokenIcon = (props: Props) => {
  const defaultTokenIconSize: number = 50

  const getIconAlt = () => {
    return props.tokenName ? `${props.tokenName} token icon` : 'token icon'
  }

  const showTokenIcon = () => {
    return (
      <Circle size={props.tokenIconSize ?? defaultTokenIconSize} overflow="hidden">
        <Image
          source={{
            uri: props.tokenImageUrl,
            width: 50,
            height: 50,
          }}
          alt={getIconAlt()}
        />
      </Circle>
    )
  }
  return props.tokenInfoUrl ? (
    <Link href={props.tokenInfoUrl}>{showTokenIcon()}</Link>
  ) : (
    showTokenIcon()
  )
}
