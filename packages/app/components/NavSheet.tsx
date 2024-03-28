import { Sheet, SheetProps, isWeb } from '@my/ui'

export function NavSheet({ children, ...props }: SheetProps) {
  return (
    <Sheet
      disableDrag
      modal
      animation={'quick'}
      dismissOnSnapToBottom
      snapPointsMode="fit"
      {...props}
    >
      <Sheet.Overlay />
      <Sheet.Frame
        p="$6"
        zIndex={1}
        justifyContent="space-around"
        height={isWeb ? '100vh' : '100%'}
      >
        {children}
      </Sheet.Frame>
    </Sheet>
  )
}
