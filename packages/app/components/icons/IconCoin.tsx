import type { allCoins, coin } from 'app/data/coins'
import { IconEthereum } from './IconEthereum'
import { IconSend } from './IconSend'
import { IconUSDC } from './IconUSDC'
import { IconSPX6900 } from './IconSPX6900'
import type { IconProps } from '@tamagui/helpers-icon'
import type { NamedExoticComponent } from 'react'
import { IconMopho } from './IconMorpho'
import { IconAerodrome } from './IconAerodrome'
import { IconMoonwell } from './IconMoonwell'
import { IconCbBtc } from './IconCbBtc'
import { IconEURC } from './IconEURC'
import { IconMAMO } from './IconMAMO'
import { IconMASQ } from './IconMASQ'
import { Image, type ImageSourcePropType, type ImageStyle } from 'react-native'
import { getTokens } from '@tamagui/core'

// Type for icon entries: either a component or an image source
type ImageSource = ImageSourcePropType
type IconEntry = NamedExoticComponent<IconProps> | { type: 'image'; source: ImageSource }

const coinSymbolToIcons: Record<coin['symbol'], IconEntry> = {
  USDC: IconUSDC,
  ETH: IconEthereum,
  SEND: IconSend,
  SPX: IconSPX6900,
  WELL: IconMoonwell,
  MORPHO: IconMopho,
  AERO: IconAerodrome,
  CBBTC: IconCbBtc,
  EURC: IconEURC,
  MAMO: IconMAMO,
  MASQ: IconMASQ,
  LNOB: { type: 'image', source: require('./IconLnob.png') },
}

export const IconCoin = ({
  symbol,
  size = '$2.5',
  ...props
}: { symbol: allCoins[number]['symbol'] } & IconProps) => {
  const iconEntry = coinSymbolToIcons[symbol]

  if (!iconEntry) {
    console.warn(`No icon found for symbol ${symbol}`)
    return null
  }

  // Check if it's a PNG image entry
  if (typeof iconEntry === 'object' && 'type' in iconEntry && iconEntry.type === 'image') {
    // Convert Tamagui size token to pixel value for Image component
    const numericSize =
      typeof size === 'string' && size.startsWith('$')
        ? (getTokens().size[size.slice(1)]?.val ?? 32)
        : typeof size === 'number'
          ? size
          : 32

    // Extract the actual image source for React Native Image
    let imageSource: ImageSourcePropType = iconEntry.source

    // Handle different module formats:
    // - React Native require() returns a number
    // - Next.js require() returns an object with { src, width, height, ... }
    // - ESM import returns an object with default property
    if (typeof imageSource === 'object' && imageSource !== null) {
      if ('default' in imageSource) {
        // ESM default export - unwrap it first
        imageSource = imageSource.default as ImageSourcePropType
      }
      // After unwrapping, check if it's a Next.js image object
      if (typeof imageSource === 'object' && imageSource !== null && 'src' in imageSource) {
        // Next.js static import format - convert to { uri: string } for React Native Image
        imageSource = { uri: imageSource.src as string }
      }
    }

    const imageStyle: ImageStyle = {
      width: numericSize,
      height: numericSize,
      borderRadius: numericSize / 2,
    }

    // Don't spread props as they might contain incompatible Icon props
    return <Image source={imageSource} style={imageStyle} />
  }

  // Otherwise it's an SVG icon component
  const Icon = iconEntry as NamedExoticComponent<IconProps>
  return <Icon size={size} {...props} />
}
