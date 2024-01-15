import { QRAmountScreen } from './qr-amount'
import { QRMyCodeScreen } from './qr-mycode'
import { QRScanScreen } from './qr-scan'
import { QRShareScreen } from './qr-share'

import { AnimationLayout } from 'app/components/layout/animation-layout'
import {
  SubScreenProvider,
  TransferProvider,
  useSubScreenContext,
} from 'app/features/send/providers'
import { QRScreenType } from 'app/features/send/types'

const screens = {
  home: QRScanScreen,
  'qr-scan': QRScanScreen,
  'qr-mycode': QRMyCodeScreen,
  'qr-amount': QRAmountScreen,
  'qr-share': QRShareScreen,
}

const Screen = () => {
  const { currentComponent, direction } = useSubScreenContext()

  const ScreenComponent = screens[currentComponent as QRScreenType]

  return (
    <TransferProvider>
      <AnimationLayout currentKey={currentComponent} direction={direction}>
        <ScreenComponent />
      </AnimationLayout>
    </TransferProvider>
  )
}

export const QRScreen = () => (
  <SubScreenProvider>
    <Screen />
  </SubScreenProvider>
)
