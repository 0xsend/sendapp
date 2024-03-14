import { Sheet, SheetProps, YStackProps } from 'tamagui'

export const BottomSheet = ({
  closeButton,
  children,
  frameProps,
  ...props
}: SheetProps & { closeButton?: boolean; frameProps?: YStackProps }) => {
  return (
    <Sheet {...props} modal animation={'quick'} dismissOnSnapToBottom>
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame
        p="$6"
        zIndex={1}
        justifyContent="space-around"
        borderRadius={'$11'}
        {...frameProps}
      >
        {children}
      </Sheet.Frame>
    </Sheet>
  )
}
