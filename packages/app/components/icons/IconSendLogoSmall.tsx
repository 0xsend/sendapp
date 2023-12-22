import { themed, IconProps } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg'

//TODO: allow custom color with color prop
const SendLogoSmall = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 95}
      height={size ?? 16}
      viewBox='0 0 82 64'
      fill="none"
    >
      <Path
        d="M78.3869 14.4736H16.9244H16.9093V21.4842C16.9093 22.8862 17.3682 23.8208 17.812 24.2884C18.7298 25.2231 19.6479 25.2231 20.5812 25.2231H65.0905C67.8446 25.2231 70.5987 25.6904 72.4349 26.6253C74.7298 27.56 76.1071 28.4946 77.4688 29.8968C78.8458 31.2988 79.7639 33.1684 80.6818 35.0379C81.141 36.9072 81.5999 39.2441 81.5999 41.581V46.722C81.5999 49.0589 81.141 50.9282 80.6818 52.7978C79.7791 54.6673 78.8458 56.5369 77.4688 57.9388C76.1071 59.8084 74.7147 60.743 72.4349 61.6777C70.5987 62.6126 67.8446 63.0799 65.0905 63.0799H15.3001C7.81455 63.0799 1.74634 57.0118 1.74634 49.5262H61.688C64.6563 49.5262 67.0626 47.1199 67.0626 44.1514C67.0626 41.1831 64.6563 38.7768 61.6877 38.7768H16.4501H14.4209C6.67733 38.7768 0.399902 32.4994 0.399902 24.7558V14.4736H16.9093H16.9244V0.919922H64.8637C72.3442 0.919922 78.4037 6.99312 78.3869 14.4736"
        fill={"url(#paint0_linear_1167_8152)"}
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_1167_8152"
          x1="40.2038"
          y1="-2.96508"
          x2="40.2038"
          y2="63.0799"
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FFF8EE" />
          <Stop offset="0.306859" stopColor="#DAC5A5" />
          <Stop offset="0.524492" stopColor="#AB8F76" />
          <Stop offset="0.659198" stopColor="#8F775D" />
          <Stop offset="0.792652" stopColor="#A68B6E" />
          <Stop offset="1" stopColor="#B79A7A" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}
const IconSendLogoSmall = memo(themed(SendLogoSmall))
export { IconSendLogoSmall }
