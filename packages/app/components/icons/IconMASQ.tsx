import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Defs, Path, RadialGradient, Rect, Stop, Svg, G } from 'react-native-svg'

const Masq = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {/* Blue background circle */}
      <Rect width={200} height={200} rx={100} fill="url(#paint0_radial_masq)" />
      
      {/* MASQ Logo - Centered and filled with white, 50% larger */}
      <G transform="translate(25, 25) scale(1.2)">
        <Path
          d="M88.5233 32.8736C89.0379 33.3942 89.5526 33.9726 90.0672 34.5509C102.819 49.1262 102.305 71.3361 88.5805 85.1594L65.8785 108.121C65.421 108.584 64.6777 108.584 64.2202 108.121C63.1337 106.964 62.1616 105.692 61.2466 104.42C61.0751 104.188 60.9607 103.957 60.7892 103.726L60.732 103.668C58.6734 100.487 57.015 96.9006 56.1573 93.6038C55.5283 91.059 55.1852 88.5141 55.128 85.9113C55.0136 77.4091 58.2159 69.4274 64.163 63.4123L73.6555 53.9846C73.9986 53.6376 73.484 53.0592 73.0837 53.4062L56.7863 68.0393C50.8392 73.9967 47.6369 82.0362 47.7513 90.5384V90.9433C47.7513 91.8687 46.8363 92.4471 46.0929 92.0422C42.7191 90.3071 39.574 88.0514 36.772 85.2173C22.4189 70.7577 22.4189 47.2754 36.7148 32.8158C51.0107 18.3562 74.2273 18.4141 88.5233 32.8736Z"
          fill="white"
        />
      </G>
      
      <Defs>
        <RadialGradient
          id="paint0_radial_masq"
          cx={0.5}
          cy={0}
          r={1}
          gradientUnits="objectBoundingBox"
        >
          <Stop stopColor="#01c2ff" />
          <Stop offset={1} stopColor="#0189ff" />
        </RadialGradient>
      </Defs>
    </Svg>
  )
}
const IconMASQ = memo<IconProps>(themed(Masq))
export { IconMASQ }
