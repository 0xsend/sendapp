import { useState } from 'react';
import { SendScreen } from './send';
import { SendTagScreen } from './send-tag';
import { SendItScreen } from './send-it';
import { SendScreenType } from '../../types';
import { AnimationLayout } from '../../../../components/layout/animation-layout';

const screens = {
  send: SendScreen,
  sendtag: SendTagScreen,
  sendit: SendItScreen,
};

const screenOrder = ['send', 'sendtag', 'sendit'];

export const SendPage = () => {
  const [currentScreen, setCurrentScreen] = useState<SendScreenType>('send');

  const ScreenComponent = screens[currentScreen];

  return (
    <AnimationLayout currentKey={currentScreen} screenOrder={screenOrder}>
      <ScreenComponent setCurrentScreen={setCurrentScreen} />
    </AnimationLayout>
  );
};