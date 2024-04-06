import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import * as React from 'react'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Gear = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      fill="none"
      color={color as ColorTokens | undefined}
      width={size ?? 20}
      height={size ?? 20}
      viewBox="0 0 24 24"
      {...rest}
    >
      <Path
        d="M13.9001 2.3999C14.0453 2.39991 14.1867 2.44599 14.304 2.53151C14.4213 2.61703 14.5085 2.73758 14.5529 2.87579L15.3072 5.21956C15.624 5.37453 15.9271 5.5487 16.2164 5.74482L18.6247 5.22642C18.7666 5.1961 18.9146 5.21164 19.0472 5.27079C19.1798 5.32994 19.2902 5.42965 19.3625 5.55556L21.2633 8.84562C21.3359 8.97145 21.3666 9.11709 21.3511 9.26153C21.3356 9.40597 21.2746 9.54174 21.1769 9.64927L19.5243 11.4733C19.5484 11.823 19.5484 12.174 19.5243 12.5238L21.1769 14.3505C21.2746 14.4581 21.3356 14.5938 21.3511 14.7383C21.3666 14.8827 21.3359 15.0284 21.2633 15.1542L19.3625 18.4456C19.29 18.5713 19.1795 18.6707 19.0469 18.7296C18.9143 18.7885 18.7665 18.8038 18.6247 18.7734L16.2164 18.255C15.9284 18.4497 15.624 18.6253 15.3085 18.7802L14.5529 21.124C14.5085 21.2622 14.4213 21.3828 14.304 21.4683C14.1867 21.5538 14.0453 21.5999 13.9001 21.5999H10.0985C9.95331 21.5999 9.81188 21.5538 9.69456 21.4683C9.57725 21.3828 9.49011 21.2622 9.44568 21.124L8.69277 18.7816C8.37682 18.6271 8.07207 18.4507 7.78077 18.2536L5.37391 18.7734C5.23192 18.8037 5.08397 18.7882 4.95138 18.729C4.81878 18.6699 4.70838 18.5702 4.63608 18.4442L2.73528 15.1542C2.6627 15.0284 2.63196 14.8827 2.64748 14.7383C2.66301 14.5938 2.72401 14.4581 2.82168 14.3505L4.47425 12.5238C4.45032 12.1749 4.45032 11.8249 4.47425 11.476L2.82168 9.64927C2.72401 9.54174 2.66301 9.40597 2.64748 9.26153C2.63196 9.11709 2.6627 8.97145 2.73528 8.84562L4.63608 5.55419C4.70858 5.42853 4.81907 5.3291 4.95165 5.2702C5.08423 5.21131 5.23207 5.19598 5.37391 5.22642L7.78077 5.74619C8.07151 5.55007 8.37597 5.37316 8.69277 5.21819L9.44705 2.87579C9.49133 2.73802 9.57806 2.61779 9.69483 2.53231C9.81159 2.44683 9.9524 2.40049 10.0971 2.3999H13.8987H13.9001ZM13.3981 3.77133H10.6004L9.82146 6.19465L9.2962 6.4511C9.03798 6.57746 8.78871 6.72134 8.55014 6.88173L8.06466 7.21087L5.57414 6.67327L4.17528 9.09796L5.88271 10.9878L5.84157 11.5693C5.82186 11.856 5.82186 12.1438 5.84157 12.4305L5.88271 13.012L4.17254 14.9018L5.57277 17.3265L8.06328 16.7903L8.54877 17.1181C8.78734 17.2785 9.03661 17.4223 9.29483 17.5487L9.82008 17.8052L10.6004 20.2285H13.4009L14.1826 17.8038L14.7065 17.5487C14.9644 17.4226 15.2133 17.2787 15.4512 17.1181L15.9353 16.7903L18.4272 17.3265L19.826 14.9018L18.1172 13.012L18.1584 12.4305C18.1781 12.1433 18.1781 11.8551 18.1584 11.5679L18.1172 10.9864L19.8274 9.09796L18.4272 6.67327L15.9353 7.20813L15.4512 6.88173C15.2133 6.72102 14.9644 6.57713 14.7065 6.4511L14.1826 6.19602L13.3995 3.77133H13.3981ZM11.9993 7.88562C13.0905 7.88562 14.1369 8.31909 14.9085 9.09066C15.6801 9.86224 16.1136 10.9087 16.1136 11.9999C16.1136 13.0911 15.6801 14.1376 14.9085 14.9091C14.1369 15.6807 13.0905 16.1142 11.9993 16.1142C10.9081 16.1142 9.86162 15.6807 9.09004 14.9091C8.31847 14.1376 7.885 13.0911 7.885 11.9999C7.885 10.9087 8.31847 9.86224 9.09004 9.09066C9.86162 8.31909 10.9081 7.88562 11.9993 7.88562ZM11.9993 9.25705C11.2718 9.25705 10.5742 9.54602 10.0598 10.0604C9.54541 10.5748 9.25643 11.2725 9.25643 11.9999C9.25643 12.7274 9.54541 13.425 10.0598 13.9394C10.5742 14.4538 11.2718 14.7428 11.9993 14.7428C12.7267 14.7428 13.4244 14.4538 13.9388 13.9394C14.4532 13.425 14.7421 12.7274 14.7421 11.9999C14.7421 11.2725 14.4532 10.5748 13.9388 10.0604C13.4244 9.54602 12.7267 9.25705 11.9993 9.25705Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconGear = memo(themed(Gear))
export { IconGear }
