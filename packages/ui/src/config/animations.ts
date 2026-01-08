import { createAnimations } from '@tamagui/animations-moti'
import { Easing } from 'react-native-reanimated'

export const animations = createAnimations({
  '50ms': {
    type: 'timing',
    duration: 50,
  },
  '100ms': {
    type: 'timing',
    duration: 100,
  },
  '125ms': {
    type: 'timing',
    duration: 125,
    easing: Easing.inOut(Easing.quad),
  },
  '125msDelayed': {
    type: 'timing',
    duration: 125,
    easing: Easing.inOut(Easing.quad),
    delay: 250,
  },
  '125msDelayedLong': {
    type: 'timing',
    duration: 125,
    easing: Easing.inOut(Easing.quad),
    delay: 2000,
  },
  '200ms': {
    type: 'timing',
    duration: 200,
  },
  '300ms': {
    type: 'timing',
    duration: 300,
  },
  '80ms-ease-in-out': {
    type: 'timing',
    duration: 80,
    easing: Easing.inOut(Easing.quad),
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  fast: {
    type: 'spring',
    damping: 75,
    stiffness: 1000,
    mass: 1,
  },
  fastHeavy: {
    type: 'spring',
    damping: 75,
    stiffness: 1000,
    mass: 1.4,
  },
  responsive: {
    type: 'spring',
    stiffness: 1400,
    damping: 120,
    mass: 0.9,
  },
  smoothResponsive: {
    type: 'spring',
    stiffness: 1100,
    damping: 100,
    mass: 1.1,
  },
})
