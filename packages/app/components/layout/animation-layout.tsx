import { AnimatePresence } from '@tamagui/animate-presence'
import { YStack, styled } from '@my/ui';

type AnimationLayoutProps = {
  children: React.ReactNode;
  currentKey: string; // Unique identifier for the current screen or content
  direction: number;
};

const YStackEnterable = styled(YStack, {
  variants: {
    isLeft: { true: { x: -300, opacity: 0 } },
    isRight: { true: { x: 300, opacity: 0 } },
  } as const,
})

export const AnimationLayout = ({ children, currentKey, direction }: AnimationLayoutProps) => {
  const enterVariant = direction === 1 || direction === 0 ? 'isRight' : 'isLeft'
  const exitVariant = direction === 1 ? 'isLeft' : 'isRight'

  return (
    <AnimatePresence enterVariant={enterVariant} exitVariant={exitVariant}>
      <YStackEnterable key={currentKey} animation="quick" fullscreen x={0} opacity={1}>
        {children}
      </YStackEnterable>
    </AnimatePresence>
  );
};