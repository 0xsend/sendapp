import { Sheet, SheetProps, setupNativeSheet } from '@tamagui/sheet'
import { ModalView } from 'react-native-ios-modal'

setupNativeSheet('ios', ModalView)

export const BottomSheet = ({ children, ...props }: SheetProps) => {
  return (
    <Sheet {...props} native modal>
      {children}
    </Sheet>
  )
}
