import { useState } from 'react';
import { MainScreen } from './send';
import { SendTagScreen } from './send-tag';
import { SendItScreen } from './send-it';
import { SendScreenType } from 'app/features/send/types';
import { AnimationLayout } from 'app/components/layout/animation-layout';
import { TransferProvider } from 'app/features/send/providers';

const screens = {
  send: MainScreen,
  'send-tag': SendTagScreen,
  'send-it': SendItScreen,
};

export const SendScreen = () => {
  const [[currentScreen, direction], setCurrentScreen] = useState<[SendScreenType, number]>(['send', -1]);

  const ScreenComponent = screens[currentScreen];

  return (
    <TransferProvider>
      <AnimationLayout currentKey={currentScreen} direction={direction}>
        <ScreenComponent setCurrentScreen={setCurrentScreen} />
      </AnimationLayout>
    </TransferProvider>
  );
};