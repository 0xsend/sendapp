import { type ColorTokens, getTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const aspectRatio = 47 / 310

export const DotLineBorder = memo(
  themed((props: IconProps) => {
    const { size: sizeToken, color, ...rest } = props

    const size =
      // @ts-expect-error because tamagui expects size tokens to not be prefixed with $
      typeof sizeToken === 'string' ? getTokens().size[sizeToken] : props.size

    return (
      <Svg
        color={color as ColorTokens | undefined}
        fill="none"
        width={aspectRatio * size}
        height={size}
        viewBox="0 0 47 310"
        {...rest}
      >
        <Path
          d="M24.6667 3C24.6667 4.47276 23.4728 5.66667 22 5.66667C20.5272 5.66667 19.3333 4.47276 19.3333 3C19.3333 1.52724 20.5272 0.333333 22 0.333333C23.4728 0.333333 24.6667 1.52724 24.6667 3ZM46 3V2.5H46.5V3H46ZM27 307L27.4781 307.147L27.3697 307.5H27V307ZM5.66667 307C5.66667 308.473 4.47276 309.667 3 309.667C1.52724 309.667 0.333332 308.473 0.333332 307C0.333332 305.527 1.52724 304.333 3 304.333C4.47276 304.333 5.66667 305.527 5.66667 307ZM46 245H46.5V245.075L46.4781 245.146L46 245ZM22 2.5H46V3.5H22V2.5ZM27 307.5H3V306.5H27V307.5ZM46.5 3V245H45.5V3H46.5ZM46.4781 245.146L27.4781 307.147L26.5219 306.853L45.5219 244.854L46.4781 245.146Z"
          fill="currentColor"
        />
      </Svg>
    )
  })
)
