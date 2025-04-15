import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import * as React from 'react'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Distributions = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      {...rest}
    >
      <Path
        d="M12.5312 19.2813C12.79 19.2813 13 19.4913 13 19.75C13 20.0088 12.79 20.2188 12.5312 20.2188C12.2725 20.2188 12.0625 20.0088 12.0625 19.75C12.0625 19.4913 12.2725 19.2813 12.5312 19.2813Z"
        fill="currentColor"
      />
      <Path
        d="M7.5625 15.0625V21.625"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.9127 21.0166L16.1837 23.0425C16.5452 23.3739 17.0341 23.538 17.4967 23.5M17.4967 23.5C17.8333 23.4728 18.1567 23.3379 18.407 23.0828C19.0019 22.4753 18.9859 21.5172 18.3986 20.9298L13.6389 16.1702C12.9297 15.4609 11.9679 15.0625 10.9652 15.0625H4.49969C4.48281 15.0625 4.46875 15.0766 4.46875 15.0935V21.5941C4.46875 21.611 4.48281 21.625 4.49969 21.625H8.14609C8.55817 21.625 8.95938 21.7586 9.28938 22.0061L14.5854 25.744C15.0775 26.1129 15.6766 26.3125 16.2916 26.3125H23.3125C24.0893 26.3125 24.7188 25.683 24.7188 24.9062C24.7188 24.1295 24.0893 23.5 23.3125 23.5H17.4967Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M27.5312 16.9375C27.5312 19.0084 25.8522 20.6875 23.7812 20.6875C21.7103 20.6875 20.0312 19.0084 20.0312 16.9375C20.0312 14.8666 21.7103 13.1875 23.7812 13.1875C25.8522 13.1875 27.5312 14.8666 27.5312 16.9375Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M23.7812 15.0625C24.8153 15.0625 25.6562 15.9039 25.6562 16.9375C25.6562 17.9711 24.8153 18.8125 23.7812 18.8125"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.9687 9.4375C20.9687 11.5084 19.2897 13.1875 17.2187 13.1875C15.1478 13.1875 13.4688 11.5084 13.4688 9.4375C13.4688 7.36656 15.1478 5.6875 17.2187 5.6875C19.2897 5.6875 20.9687 7.36656 20.9687 9.4375Z"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.2188 7.5625C18.2528 7.5625 19.0937 8.40391 19.0937 9.4375C19.0937 10.4711 18.2528 11.3125 17.2188 11.3125"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
const IconDistributions = memo<IconProps>(themed(Distributions))
export { IconDistributions }
