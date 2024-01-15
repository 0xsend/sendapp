import { YStack } from '@my/ui'
import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg'

const Settings = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <YStack px={'$1.5'}>
      <Svg
        viewBox="0 0 24 26"
        color={color as ColorTokens | undefined}
        width={size ?? 24}
        height={size ?? 26}
        {...rest}
      >
        <Path
          d="M12 25.7999C11.1935 25.7999 10.375 25.6194 9.737 25.2462L3.1166 21.4305C0.420283 19.6129 0.251762 19.336 0.251762 16.4832V9.52573C0.251762 6.67293 0.408245 6.39607 3.05642 4.60254L9.72496 0.750651C10.9889 0.0163847 12.975 0.0163847 14.2389 0.750651L20.8834 4.57846C23.5797 6.39607 23.7482 6.67293 23.7482 9.52573V16.4712C23.7482 19.324 23.5918 19.6008 20.9436 21.3944L14.275 25.2462C13.625 25.6194 12.8065 25.7999 12 25.7999ZM12 2.01455C11.4944 2.01455 11.0009 2.11085 10.6518 2.31548L4.03143 6.14329C2.06937 7.46738 2.06937 7.46738 2.06937 9.52573V16.4712C2.06937 18.5295 2.06937 18.5295 4.07957 19.8897L10.6518 23.6814C11.362 24.0907 12.65 24.0907 13.3602 23.6814L19.9806 19.8536C21.9306 18.5295 21.9306 18.5295 21.9306 16.4712V9.52573C21.9306 7.46738 21.9306 7.46738 19.9204 6.10718L13.3481 2.31548C12.9991 2.11085 12.5055 2.01455 12 2.01455Z"
          fill="url(#paint0_linear_190_913)"
        />
        <Path
          d="M11.9997 17.5186C9.50805 17.5186 7.48581 15.4963 7.48581 13.0047C7.48581 10.513 9.50805 8.49072 11.9997 8.49072C14.4914 8.49072 16.5137 10.513 16.5137 13.0047C16.5137 15.4963 14.4914 17.5186 11.9997 17.5186ZM11.9997 10.2963C10.5071 10.2963 9.29138 11.512 9.29138 13.0047C9.29138 14.4973 10.5071 15.713 11.9997 15.713C13.4923 15.713 14.7081 14.4973 14.7081 13.0047C14.7081 11.512 13.4923 10.2963 11.9997 10.2963Z"
          fill="url(#paint1_linear_190_913)"
        />
        <Defs>
          <LinearGradient
            id="paint0_linear_190_913"
            x1={11.0601}
            y1={-6.20005}
            x2={11.0601}
            y2={55.4888}
            gradientUnits="userSpaceOnUse"
          >
            {/* colors are hard-coded for now */}
            <Stop stopColor="#BCA687" />
            <Stop offset={0.066468} stopColor="#B8A284" />
            <Stop offset={0.0795685} stopColor="#FFF8EE" />
            <Stop offset={0.306859} stopColor="#DAC5A5" />
            <Stop offset={0.524492} stopColor="#AB8F76" />
            <Stop offset={0.659198} stopColor="#735B42" />
            <Stop offset={0.792652} stopColor="#A68B6E" />
            <Stop offset={0.918041} stopColor="#B79A7A" />
            <Stop offset={1} stopColor="#8F7E61" />
          </LinearGradient>
          <LinearGradient
            id="paint1_linear_190_913"
            x1={11.6386}
            y1={6.23376}
            x2={11.6386}
            y2={27.9884}
            gradientUnits="userSpaceOnUse"
          >
            {/* colors are hard-coded for now */}
            <Stop stopColor="#BCA687" />
            <Stop offset={0.066468} stopColor="#B8A284" />
            <Stop offset={0.0795685} stopColor="#FFF8EE" />
            <Stop offset={0.306859} stopColor="#DAC5A5" />
            <Stop offset={0.524492} stopColor="#AB8F76" />
            <Stop offset={0.659198} stopColor="#735B42" />
            <Stop offset={0.792652} stopColor="#A68B6E" />
            <Stop offset={0.918041} stopColor="#B79A7A" />
            <Stop offset={1} stopColor="#8F7E61" />
          </LinearGradient>
        </Defs>
      </Svg>
    </YStack>
  )
}
const IconSettings = memo(themed(Settings))
export { IconSettings }
