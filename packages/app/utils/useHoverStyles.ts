import { useThemeSetting } from '@tamagui/next-theme'

export const useHoverStyles = (): {
  background: `rgba(${string})`
  transition: string
  cursor: string
} => {
  const { resolvedTheme } = useThemeSetting()

  const rowHoverBC = resolvedTheme?.startsWith('dark')
    ? 'rgba(255,255,255, 0.1)'
    : 'rgba(0,0,0, 0.1)'

  return {
    background: rowHoverBC,
    transition: 'background 0.2s ease-in-out',
    cursor: 'pointer',
  }
}
