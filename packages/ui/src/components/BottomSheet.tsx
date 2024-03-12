import { Sheet, SheetProps } from 'tamagui'

export const BottomSheet = ({
  closeButton,
  children,
  ...props
}: SheetProps & { closeButton?: boolean }) => {
  return (
    <Sheet {...props} modal animation={'quick'} dismissOnSnapToBottom>
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame px="$6" zIndex={1} justifyContent="space-around" alignItems="center">
        {children}
      </Sheet.Frame>
    </Sheet>
  )
}
