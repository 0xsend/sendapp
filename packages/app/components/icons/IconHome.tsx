import { ColorTokens } from '@my/ui/types'
import { themed, IconProps } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg'

const Home = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 32 32"
      color={color as ColorTokens | undefined}
      width={size ?? 32}
      height={size ?? 32}
      {...rest}
    >
      <Path
        d="M22.8 28.7982H9.2C5.8916 28.7982 3.2 26.1066 3.2 22.7982V14.3846C3.2 12.5251 4.08275 10.7416 5.5613 9.61389L12.3613 4.42744C14.5037 2.79339 17.4962 2.79339 19.6387 4.42744L21.8 6.07444V4.79819C21.8528 3.47139 23.7476 3.47239 23.8 4.79819V8.09374C23.8 8.47389 23.5844 8.82114 23.2437 8.98989C22.903 9.15859 22.4962 9.11949 22.1938 8.88914L18.4261 6.01799C16.9975 4.92839 15.0024 4.92839 13.5741 6.01774L6.77415 11.2042C5.7885 11.9559 5.2 13.1449 5.2 14.3846V22.7982C5.2 25.0038 6.9944 26.7982 9.2 26.7982H22.8C25.0056 26.7982 26.8 25.0038 26.8 22.7982V14.3846C26.8 13.1297 26.2181 11.9367 25.2435 11.1933C24.8044 10.8583 24.7199 10.2308 25.0549 9.79174C25.3898 9.35259 26.0174 9.26814 26.4564 9.60309C27.9239 10.7223 28.8 12.5098 28.8 14.3846V22.7982C28.8 26.1066 26.1084 28.7982 22.8 28.7982ZM14 14.7482C13.3096 14.7482 12.75 15.3078 12.75 15.9982C12.816 17.6567 15.1845 17.6554 15.25 15.9982C15.25 15.3078 14.6903 14.7482 14 14.7482ZM19.25 15.9981C19.1839 17.6566 16.8154 17.6554 16.75 15.9981C16.816 14.3396 19.1845 14.3409 19.25 15.9981ZM15.25 19.9981C15.1839 21.6566 12.8154 21.6554 12.75 19.9981C12.816 18.3396 15.1845 18.3409 15.25 19.9981ZM19.25 19.9981C19.1839 21.6566 16.8154 21.6554 16.75 19.9981C16.816 18.3396 19.1845 18.3409 19.25 19.9981Z"
        fill="url(#paint0_linear_56_965)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_56_965"
          x1={14.976}
          y1={-3.19717}
          x2={14.976}
          y2={58.4828}
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
  )
}
const IconHome = memo(themed(Home))
export { IconHome }
