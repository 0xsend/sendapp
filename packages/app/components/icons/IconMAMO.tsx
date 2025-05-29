import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Mamo = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      color="transparent"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <Path d="M0 0h64v64H0V0z" fill="#BBD9BD" />
      <Path
        d="M41.438 19.375c4.224.741 6.964 2.237 9.562 5.625.71 2.815.576 5.433.375 8.313l-.082 2.244c-.07 1.815-.178 3.63-.293 5.443h-6l-1-14h-4l-.55 1.898-.763 2.477-.738 2.46C37 36 37 36 34 38c-2.938 0-2.938 0-6-1a749.534 749.534 0 01-4-6h-5v10h-6c-.628-9.954-.628-9.954 1.875-14.125 2.501-2.207 3.558-2.81 6.875-3.188 4.08.393 6.126 1.71 9.25 4.313v3h2l-.313-2.688C33 25 33 25 35.063 22.125 38 20 38 20 41.437 19.375z"
        fill="#F9FBF9"
      />
      <Path
        d="M63 37h1v27H37c2.245-1.123 4.505-2.22 6.805-3.227 8.292-3.777 12.89-7.286 16.437-15.73.992-2.664 1.91-5.33 2.758-8.043z"
        fill="#FBFDFB"
      />
      <Path
        d="M0 37c1.116 2.231 2.206 4.478 3.191 6.77 3.733 8.283 7.872 13.73 16.387 17.316A76.612 76.612 0 0026 63v1H0V37z"
        fill="#FCFDFC"
      />
      <Path
        d="M39 0h25v26c-2-4-2-4-2.895-5.93l-.917-1.945-.895-1.93C55.692 10.081 52.033 7 45.688 4.125l-1.956-.93A380.168 380.168 0 0039 1V0zM0 0h26c-4 2-4 2-5.93 2.895C11.685 6.85 5.476 12.2 2.246 21.07 1.775 22.698 1.38 24.348 1 26H0V0z"
        fill="#FDFDFD"
      />
    </Svg>
  )
}
const IconMAMO = memo<IconProps>(themed(Mamo))
export { IconMAMO }
