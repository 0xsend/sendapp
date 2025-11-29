import { createAnimations } from './motion'

export const animations = createAnimations({
  '50ms': {
    type: 'tween',
    duration: 50,
  },
  '100ms': {
    type: 'tween',
    duration: 100,
  },
  '125ms': {
    type: 'tween',
    duration: 125,
    ease: 'easeInOut',
  },
  '125msDelayed': {
    type: 'tween',
    duration: 125,
    ease: 'easeInOut',
    delay: 250,
  },
  '125msDelayedLong': {
    type: 'tween',
    duration: 125,
    ease: 'easeInOut',
    delay: 2000,
  },
  '200ms': {
    type: 'tween',
    duration: 200,
  },
  '300ms': {
    type: 'tween',
    duration: 300,
  },
  '80ms-ease-in-out': {
    type: 'tween',
    duration: 80,
    ease: 'easeInOut',
  },
  quick: {
    type: 'spring',
    duration: 400,
    bounce: 0.2,
  },
  fast: {
    type: 'spring',
    duration: 280,
    bounce: 0.1,
  },
  fastHeavy: {
    type: 'spring',
    duration: 400,
    bounce: 0.2,
  },
  responsive: {
    type: 'spring',
    duration: 250,
    bounce: 0.1,
  },
  smoothResponsive: {
    type: 'spring',
    duration: 400,
    bounce: 0.2,
  },
})
