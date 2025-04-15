import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

const Referral = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 47}
      height={size ?? 47}
      color={color as ColorTokens | undefined}
      viewBox="0 0 47 47"
      fill="none"
      {...rest}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M46.3 7.59297V15.0161V25.6209C46.3 26.4989 45.5874 27.2116 44.7093 27.2116C43.8312 27.2116 43.1186 26.4989 43.1186 25.6209V16.6068H3.88141V39.4069C3.88141 40.391 4.27166 41.3349 4.96944 42.0305C5.66511 42.7283 6.60892 43.1186 7.59304 43.1186H16.0768C16.9548 43.1186 17.6675 43.8312 17.6675 44.7093C17.6675 45.5873 16.9548 46.2999 16.0768 46.2999H7.59304C5.76479 46.2999 4.01078 45.5746 2.71914 44.2808C1.42537 42.9892 0.700012 41.2352 0.700012 39.4069V15.0161V7.59297C0.700012 3.7859 3.78597 0.699951 7.59304 0.699951H39.407C43.2141 0.699951 46.3 3.7859 46.3 7.59297ZM43.1186 7.59297V13.4255H3.88141V7.59297C3.88141 5.54203 5.5421 3.88135 7.59304 3.88135H39.407C41.4579 3.88135 43.1186 5.54203 43.1186 7.59297ZM10.7745 8.65375C10.7745 9.53227 10.0624 10.2444 9.18384 10.2444C8.30532 10.2444 7.59314 9.53227 7.59314 8.65375C7.59314 7.77523 8.30532 7.06305 9.18384 7.06305C10.0624 7.06305 10.7745 7.77523 10.7745 8.65375ZM16.0767 8.65375C16.0767 9.53227 15.3645 10.2444 14.486 10.2444C13.6075 10.2444 12.8953 9.53227 12.8953 8.65375C12.8953 7.77523 13.6075 7.06305 14.486 7.06305C15.3645 7.06305 16.0767 7.77523 16.0767 8.65375ZM19.7884 10.2444C20.6669 10.2444 21.3791 9.53227 21.3791 8.65375C21.3791 7.77523 20.6669 7.06305 19.7884 7.06305C18.9098 7.06305 18.1977 7.77523 18.1977 8.65375C18.1977 9.53227 18.9098 10.2444 19.7884 10.2444ZM36.2256 46.3002H38.3465C40.4568 46.3002 42.4781 45.4625 43.9712 43.9714C45.4622 42.4783 46.3 40.4571 46.3 38.3467C46.3 36.2364 45.4622 34.2152 43.9712 32.722C42.4781 31.231 40.4568 30.3932 38.3465 30.3932H36.1726C35.2945 30.3932 34.5819 31.1059 34.5819 31.9839C34.5819 32.862 35.2945 33.5746 36.1726 33.5746H38.3465C39.6127 33.5746 40.8259 34.0773 41.7209 34.9723C42.6159 35.8674 43.1186 37.0805 43.1186 38.3467C43.1186 39.6129 42.6159 40.8261 41.7209 41.7211C40.8259 42.6162 39.6127 43.1188 38.3465 43.1188H36.2256C35.3475 43.1188 34.6349 43.8315 34.6349 44.7095C34.6349 45.5876 35.3475 46.3002 36.2256 46.3002ZM27.6889 43.1188H29.8098C30.6879 43.1188 31.4005 43.8315 31.4005 44.7095C31.4005 45.5876 30.6879 46.3002 29.8098 46.3002H27.6889C25.5785 46.3002 23.5552 45.4625 22.0642 43.9714C20.5732 42.4783 19.7354 40.4571 19.7354 38.3467C19.7354 36.2364 20.5732 34.2152 22.0642 32.722C23.5552 31.231 25.5785 30.3932 27.6889 30.3932H29.8628C30.7409 30.3932 31.4535 31.1059 31.4535 31.9839C31.4535 32.862 30.7409 33.5746 29.8628 33.5746H27.6889C26.4227 33.5746 25.2095 34.0773 24.3145 34.9723C23.4194 35.8674 22.9168 37.0805 22.9168 38.3467C22.9168 39.6129 23.4194 40.8261 24.3145 41.7211C25.2095 42.6162 26.4227 43.1188 27.6889 43.1188ZM37.286 39.937H28.8023C27.9242 39.937 27.2116 39.2244 27.2116 38.3463C27.2116 37.4683 27.9242 36.7556 28.8023 36.7556H37.286C38.1641 36.7556 38.8767 37.4683 38.8767 38.3463C38.8767 39.2244 38.1641 39.937 37.286 39.937Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconReferral = memo<IconProps>(themed(Referral))
export { IconReferral }
