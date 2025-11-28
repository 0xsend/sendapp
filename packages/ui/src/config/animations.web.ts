import { createAnimations } from './motion'

export const animations = createAnimations({
  '50ms': {
    type: 'tween',
    duration: 50 / 1000,
  },
  '100ms': {
    type: 'tween',
    duration: 100 / 1000,
  },
  '125ms': {
    type: 'tween',
    duration: 125 / 1000,
    ease: 'easeInOut',
  },
  '125msDelayed': {
    type: 'tween',
    duration: 125 / 1000,
    ease: 'easeInOut',
    delay: 250,
  },
  '125msDelayedLong': {
    type: 'tween',
    duration: 125 / 1000,
    ease: 'easeInOut',
    delay: 2000,
  },
  '200ms': {
    type: 'tween',
    duration: 200 / 1000,
  },
  '300ms': {
    type: 'tween',
    duration: 300 / 1000,
  },
  '80ms-ease-in-out': {
    type: 'tween',
    duration: 80 / 1000,
    ease: 'easeInOut',
  },
  quick: {
    type: 'spring',
    duration: 0.4,
    bounce: 0.2,
  },
  fast: {
    type: 'spring',
    duration: 0.28,
    bounce: 0.1,
  },
  fastHeavy: {
    type: 'spring',
    duration: 0.4,
    bounce: 0.2,
  },
  responsive: {
    type: 'spring',
    duration: 0.25,
    bounce: 0.1,
  },
  smoothResponsive: {
    type: 'spring',
    duration: 0.4,
    bounce: 0.2,
  },
})
