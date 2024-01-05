import { Sheet, SheetProps } from "@my/ui";

export const BottomSheet = ({ children, ...props }: SheetProps) => {
  return (
    <Sheet {...props} modal animation={"quick"}>
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame px="$6" zIndex={1} justifyContent="space-around" alignItems="center" >
        {children}
      </Sheet.Frame>
    </Sheet>
  )
}