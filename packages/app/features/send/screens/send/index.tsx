import { MainScreen } from './send';
import { SendTagScreen } from "./send-tag";
import { SendItScreen } from './send-it';
import { SendScreenType } from 'app/features/send/types';
import { AnimationLayout } from 'app/components/layout/animation-layout';
import {
  SubScreenProvider,
  TransferProvider,
  useSubScreenContext
} from 'app/features/send/providers';

const screens = {
  home: MainScreen,
  send: MainScreen,
  'send-tag': SendTagScreen,
  'send-it': SendItScreen,
};

const Screen = () => {
  const { currentComponent, direction } = useSubScreenContext()

  const ScreenComponent = screens[currentComponent as SendScreenType];

  return (
    <TransferProvider>
      <AnimationLayout currentKey={currentComponent} direction={direction}>
        <ScreenComponent />
      </AnimationLayout>
    </TransferProvider>
  );
};

export const SendScreen = () => <SubScreenProvider><Screen /></SubScreenProvider>