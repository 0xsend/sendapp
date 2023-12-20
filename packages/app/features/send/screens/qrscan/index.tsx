import { useState } from 'react';
import { QRScanScreen } from './qr-scan';
import { QRMyCodeScreen } from './qr-mycode';
import { QRScreenType } from 'app/features/send/types';
import { AnimationLayout } from 'app/components/layout/animation-layout';
import { TransferProvider } from 'app/features/send/providers';

const screens = {
  'qr-scan': QRScanScreen,
  'qr-mycode': QRMyCodeScreen,
};

export const QRScreen = () => {
  const [[currentScreen, direction], setCurrentScreen] = useState<[QRScreenType, number]>(['qr-scan', -1]);

  const ScreenComponent = screens[currentScreen];

  return (
    <TransferProvider>
      <AnimationLayout currentKey={currentScreen} direction={direction}>
        <ScreenComponent setCurrentScreen={setCurrentScreen} />
      </AnimationLayout>
    </TransferProvider>
  );
};