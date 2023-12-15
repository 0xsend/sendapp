import { useState } from 'react';
import { ReceiveQRCodeScreen } from './receive-qrcode';
import { ReceiveTagScreen } from './receive-tag';
import { ReceiveAmountScreen } from './receive-amount';
import { IReceiveScreenType } from 'app/features/send/types';
import { AnimationLayout } from 'app/components/layout/animation-layout';
import { TransferProvider } from 'app/features/send/providers';

const screens = {
  'receive-qrcode': ReceiveQRCodeScreen,
  'receive-tag': ReceiveTagScreen,
  'receive-amount': ReceiveAmountScreen,
};

export const ReceiveScreen = () => {
  const [[currentScreen, direction], setCurrentScreen] = useState<[IReceiveScreenType, number]>(['receive-qrcode', -1]);

  const ScreenComponent = screens[currentScreen];

  return (
    <TransferProvider>
      <AnimationLayout currentKey={currentScreen} direction={direction}>
        <ScreenComponent setCurrentScreen={setCurrentScreen} />
      </AnimationLayout>
    </TransferProvider>
  );
};