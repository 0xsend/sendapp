import { useState } from 'react';
import { QRScanScreen } from './qr-scan';
import { QRMyCodeScreen } from './qr-mycode';
import { QRAmountScreen } from './qr-amount';
import { QRShareScreen } from './qr-share';

import { QRScreenType } from 'app/features/send/types';
import { AnimationLayout } from 'app/components/layout/animation-layout';
import { TransferProvider } from 'app/features/send/providers';

const screens = {
  'qr-scan': QRScanScreen,
  'qr-mycode': QRMyCodeScreen,
  'qr-amount': QRAmountScreen,
  'qr-share': QRShareScreen,
};

export const QRScreen = () => {
  const [[currentScreen, direction, sendOrRequest], setCurrentScreenState] = useState<
    [QRScreenType, number, 'Send' | 'Request' | undefined]
  >(['qr-scan', -1, undefined]);

  const setCurrentScreen = (
    [
      newScreen,
      newDirection,
      newSendOrRequest
    ]: [
        newScreen: QRScreenType,
        newDirection: number,
        newSendOrRequest?: 'Send' | 'Request'
      ]) => {
    setCurrentScreenState([newScreen, newDirection, newSendOrRequest]);
  };

  const ScreenComponent = screens[currentScreen];

  return (
    <TransferProvider>
      <AnimationLayout currentKey={currentScreen} direction={direction}>
        <ScreenComponent setCurrentScreen={setCurrentScreen} sendOrRequest={sendOrRequest} />
      </AnimationLayout>
    </TransferProvider>
  );
};