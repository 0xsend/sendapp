import { useState } from 'react';
import { MainScreen } from './send';
import { SendTagScreen } from './send-tag';
import { SendItScreen } from './send-it';
import { SendScreenType } from '../../types';
import { AnimationLayout } from '../../../../components/layout/animation-layout';

const screens = {
  send: MainScreen,
  sendtag: SendTagScreen,
  sendit: SendItScreen,
};

export const SendScreen = () => {
  const [[currentScreen, direction], setCurrentScreen] = useState<[SendScreenType, number]>(['send', -1]);

  const ScreenComponent = screens[currentScreen];

  return (
    <AnimationLayout currentKey={currentScreen} direction={direction}>
      <ScreenComponent setCurrentScreen={setCurrentScreen} />
    </AnimationLayout>
  );
};