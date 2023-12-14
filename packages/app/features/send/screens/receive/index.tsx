import { useState } from 'react';
import { ReceiveQRCodeScreen } from './receive-qrcode';
import { ReceiveTagScreen } from './receive-tag';
import { ReceiveAmountScreen } from './receive-amount';
import { ReceiveScreenType } from '../../types';
import { AnimationLayout } from '../../../../components/layout/animation-layout';

const screens = {
  'receive-qrcode': ReceiveQRCodeScreen,
  'receive-tag': ReceiveTagScreen,
  'receive-amount': ReceiveAmountScreen,
};

export const ReceiveScreen = () => {
  const [[currentScreen, direction], setCurrentScreen] = useState<[ReceiveScreenType, number]>(['receive-qrcode', -1]);

  const ScreenComponent = screens[currentScreen];

  return (
    <AnimationLayout currentKey={currentScreen} direction={direction}>
      <ScreenComponent setCurrentScreen={setCurrentScreen} />
    </AnimationLayout>
  );
};