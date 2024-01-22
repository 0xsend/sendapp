import { StackProps, Stack } from 'tamagui'

type CornerProp = { corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' }

const transformCorner = (corner: CornerProp['corner']) => {
  switch (corner) {
    case 'topLeft':
      return 'rotate(0deg)'
    case 'topRight':
      return 'rotate(90deg)'
    case 'bottomLeft':
      return 'rotate(270deg)'
    case 'bottomRight':
      return 'rotate(180deg)'
    default:
      return 'rotate(0deg)'
  }
}

export const CornerTriangle = (props: StackProps & CornerProp) => (
  <Stack
    w={0}
    h={0}
    bc={'transparent'}
    bs={'solid'}
    brw={(props.borderRightWidth || props.brw) ?? 100}
    btw={(props.borderTopWidth || props.btw) ?? 100}
    bbw={0}
    blw={0}
    brc={'transparent'}
    btc={(props.borderTopColor || props.btc) ?? '$backgroundHover'}
    transform={transformCorner(props.corner)}
    {...props}
  />
)
