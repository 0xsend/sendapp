import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

type AnimationLayoutProps = {
  children: React.ReactNode;
  currentKey: string; // Unique identifier for the current screen or content
  screenOrder: string[];
};

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

export const AnimationLayout = ({ children, currentKey, screenOrder }: AnimationLayoutProps) => {
  const [direction, setDirection] = useState(1);
  const [prevKey, setPrevKey] = useState(currentKey);

  useEffect(() => {
    // Determine the direction of the animation based on the keys
    const currentIndex = screenOrder.indexOf(currentKey);
    const prevIndex = screenOrder.indexOf(prevKey);
    setDirection(currentIndex >= prevIndex ? 1 : -1);
    setPrevKey(currentKey);
  }, [currentKey]);

  return (
    <AnimatePresence exitBeforeEnter>
      <motion.div
        key={currentKey}
        custom={direction}
        initial="initial"
        animate="in"
        exit="out"
        variants={screenVariants}
        transition={screenTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};