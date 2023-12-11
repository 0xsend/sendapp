import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { SendScreen } from './send';
import { SendTagScreen } from './send-tag';
import { SendItScreen } from './send-it';
import { SendScreenType } from '../../types';

const screenVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100vw' : '-100vw',
  }),
  in: {
    x: 0,
  },
  out: (direction: number) => ({
    x: direction > 0 ? '-100vw' : '100vw',
  }),
};

const screenTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3,
};

const screens = {
  send: SendScreen,
  sendtag: SendTagScreen,
  sendit: SendItScreen,
};

const screenOrder = ['send', 'sendtag', 'sendit'];

export const SendPage = () => {
  const [currentScreen, setCurrentScreen] = useState<SendScreenType>('send');
  const [direction, setDirection] = useState(1);
  const [prevScreenIndex, setPrevScreenIndex] = useState(0);

  useEffect(() => {
    const currentIndex = screenOrder.indexOf(currentScreen);

    setDirection(currentIndex > prevScreenIndex ? 1 : -1);

    // Update the previous screen index
    setPrevScreenIndex(currentIndex);
  }, [currentScreen]);

  const ScreenComponent = screens[currentScreen];

  return (
    <AnimatePresence exitBeforeEnter>
      <motion.div
        key={currentScreen}
        custom={direction}
        initial="initial"
        animate="in"
        exit="out"
        variants={screenVariants}
        transition={screenTransition}
      >
        <ScreenComponent setCurrentScreen={setCurrentScreen} />
      </motion.div>
    </AnimatePresence>
  );
};
