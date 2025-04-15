import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const WorldSearch = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...rest}
    >
      <Path
        fill={'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap={'round'}
        strokeLinejoin={'round'}
        d="M21 12C21 10.22 20.4722 8.47991 19.4832 6.99987C18.4943 5.51983 17.0887 4.36628 15.4442 3.68509C13.7996 3.0039 11.99 2.82567 10.2442 3.17294C8.49836 3.5202 6.89472 4.37737 5.63604 5.63604C4.37737 6.89472 3.5202 8.49836 3.17294 10.2442C2.82567 11.99 3.0039 13.7996 3.68509 15.4442C4.36628 17.0887 5.51983 18.4943 6.99987 19.4832C8.47991 20.4722 10.22 21 12 21M3.6 9H20.4M3.6 15H11.5"
      />
      <Path
        stroke="currentColor"
        fill={'none'}
        strokeWidth={2}
        strokeLinecap={'round'}
        strokeLinejoin={'round'}
        d="M11.4997 3C9.81501 5.69961 8.92188 8.81787 8.92188 12C8.92188 15.1821 9.81501 18.3004 11.4997 21M12.4997 3C14.1162 5.59006 15.0053 8.56766 15.0737 11.62M20.1997 20.2L21.9997 22M14.9997 18C14.9997 18.7956 15.3157 19.5587 15.8783 20.1213C16.441 20.6839 17.204 21 17.9997 21C18.7953 21 19.5584 20.6839 20.121 20.1213C20.6836 19.5587 20.9997 18.7956 20.9997 18C20.9997 17.2044 20.6836 16.4413 20.121 15.8787C19.5584 15.3161 18.7953 15 17.9997 15C17.204 15 16.441 15.3161 15.8783 15.8787C15.3157 16.4413 14.9997 17.2044 14.9997 18Z"
      />
    </Svg>
  )
}
const IconWorldSearch = memo<IconProps>(themed(WorldSearch))
export { IconWorldSearch }
