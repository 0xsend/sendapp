import { Avatar, type AvatarProps, Paragraph, View } from '@my/ui'
import type { Address } from 'viem'
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg'

type AddressAvatarProps = Omit<AvatarProps, 'children'> & {
  address: Address
}

/**
 * Generates two deterministic HSL colors from an Ethereum address.
 * Uses address bytes to create a unique gradient for each address.
 */
function addressToColors(address: Address): [string, string] {
  // Remove 0x prefix and get bytes
  const hex = address.slice(2).toLowerCase()

  // Use different parts of the address for each color
  // First 8 chars for color 1, chars 8-16 for color 2
  const hue1 = Number.parseInt(hex.slice(0, 4), 16) % 360
  const hue2 = Number.parseInt(hex.slice(8, 12), 16) % 360

  // Use fixed saturation and lightness for consistent appearance
  const saturation = 65
  const lightness = 55

  return [
    `hsl(${hue1}, ${saturation}%, ${lightness}%)`,
    `hsl(${hue2}, ${saturation}%, ${lightness}%)`,
  ]
}

/**
 * Avatar component that displays a unique gradient based on an Ethereum address.
 * Similar to blockies/jazicons but using a simple dual-color gradient.
 */
export function AddressAvatar({ address, size = '$8', ...props }: AddressAvatarProps) {
  const [color1, color2] = addressToColors(address)

  // Get short address display (first 4 chars after 0x)
  const shortAddress = address.slice(2, 6).toUpperCase()

  return (
    <Avatar size={size} br="$4" overflow="hidden" {...props}>
      <View position="absolute" inset={0}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`gradient-${address}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={color1} stopOpacity={1} />
              <Stop offset="100%" stopColor={color2} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill={`url(#gradient-${address})`} />
        </Svg>
      </View>
      <View f={1} ai="center" jc="center">
        <Paragraph
          color="white"
          fontFamily="$mono"
          fontWeight="600"
          fontSize="$3"
          textShadowColor="rgba(0,0,0,0.3)"
          textShadowOffset={{ width: 0, height: 1 }}
          textShadowRadius={2}
        >
          {shortAddress}
        </Paragraph>
      </View>
    </Avatar>
  )
}
