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
      <Sheet.Frame p="$6" zIndex={1} justifyContent="space-around" borderRadius={'$11'}>
        {children}
      </Sheet.Frame>
    </Sheet>
  )
}
