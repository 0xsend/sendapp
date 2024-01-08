import { QRScanScreen } from './qr-scan';
import { QRMyCodeScreen } from './qr-mycode';
import { QRAmountScreen } from './qr-amount';
import { QRShareScreen } from './qr-share';

import { QRScreenType } from 'app/features/send/types';
import { AnimationLayout } from 'app/components/layout/animation-layout';
import {
  TransferProvider,
  SubScreenProvider,
  useSubScreenContext
} from 'app/features/send/providers';

const screens = {
  home: QRScanScreen,
  'qr-scan': QRScanScreen,
  'qr-mycode': QRMyCodeScreen,
  'qr-amount': QRAmountScreen,
  'qr-share': QRShareScreen,
};

const Screen = () => {
  const { currentComponent, direction } = useSubScreenContext()

  const ScreenComponent = screens[currentComponent as QRScreenType];

  return (
    <TransferProvider>
      <AnimationLayout currentKey={currentComponent} direction={direction}>
        <ScreenComponent />
      </AnimationLayout>
    </TransferProvider>
  );
};

export const QRScreen = () => <SubScreenProvider><Screen /></SubScreenProvider>