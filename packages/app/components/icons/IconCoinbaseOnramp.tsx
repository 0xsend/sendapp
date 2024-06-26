import type { ColorTokens } from '@my/ui'
import { themed, type IconProps } from '@tamagui/helpers-icon'
import { memo } from 'react'
import Svg, { Path } from 'react-native-svg'

const aspectRatio = 144 / 32

function CoinbaseOnramp(props) {
  const { size = 32, color, ...rest } = props

  const width = size * aspectRatio
  const height = size

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 144 32"
      color={color as ColorTokens | undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <Path
        d="M16.03 24c-4.428 0-8.015-3.58-8.015-8s3.587-8 8.015-8a8.008 8.008 0 017.895 6.667H32C31.319 6.453 24.433 0 16.03 0 7.18 0 0 7.167 0 16s7.18 16 16.03 16C24.432 32 31.32 25.547 32 17.333h-8.075A8.008 8.008 0 0116.03 24zM130.968 24.175V7.848h7.051c3.525 0 5.496 1.971 5.496 4.847 0 2.876-1.971 4.87-5.496 4.87h-4.593v6.61h-2.458zm10.042-11.34v-.28c0-1.6-1.02-2.597-3.061-2.597h-4.523v5.497h4.523c2.041 0 3.061-.997 3.061-2.62zM110.041 24.175V7.848h3.618l4.777 12.663h.023l4.732-12.663h3.594v16.327h-2.388V10.538h-.024l-5.079 13.66h-1.855l-5.079-13.59h-.023v13.567h-2.296zM105.175 24.175l-1.461-3.896h-7.306l-1.438 3.896H92.42L98.68 7.848h2.806l6.332 16.327h-2.644zm-5.172-13.706l-2.83 7.7h5.752l-2.876-7.7h-.046zM78.695 24.175V7.848h7.073c3.526 0 5.474 1.971 5.474 4.824 0 2.876-1.902 4.708-5.358 4.708H84.47l7.56 6.795h-3.502l-7.375-6.795v6.795h-2.458zM88.76 12.857v-.278c0-1.647-1.044-2.644-3.061-2.644h-4.546v5.543H85.7c2.017 0 3.061-.997 3.061-2.62zM61.255 24.175V7.848h2.946l7.931 12.802h.023V7.848h2.366v16.327h-2.806l-8.048-13.103h-.023v13.103h-2.389zM50.538 24.5C45.574 24.5 43 20.673 43 16.012c0-4.639 2.574-8.512 7.538-8.512 4.94 0 7.514 3.873 7.514 8.512 0 4.661-2.551 8.488-7.514 8.488zm0-2.134c2.736 0 5.01-2.11 5.01-5.844v-1.044c0-3.734-2.274-5.844-5.01-5.844-2.76 0-5.033 2.11-5.033 5.844v1.044c0 3.734 2.273 5.844 5.032 5.844z"
        fill="currentColor"
      />
    </Svg>
  )
}

const IconCoinbaseOnramp = memo<IconProps>(themed(CoinbaseOnramp))
export { IconCoinbaseOnramp }
