// Minimal Reanimated stub for Next.js SSR
// This prevents "worklets failed to create" errors during server-side rendering

const NOOP = () => {}
const NOOP_FACTORY = () => NOOP
const ID = (t) => t

// Simple mock component
const MockComponent = () => null

// createAnimatedComponent should return the component as-is on server
const createAnimatedComponent = (Component) => Component

// All the exports
const reanimatedExports = {
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: (fn) => ({}),
  useAnimatedProps: (fn) => ({}),
  useDerivedValue: (fn) => ({ value: undefined }),
  useAnimatedReaction: NOOP,
  useAnimatedGestureHandler: NOOP_FACTORY,
  useAnimatedScrollHandler: NOOP_FACTORY,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedKeyboard: () => ({ height: { value: 0 }, state: { value: 0 } }),
  useFrameCallback: NOOP,
  useAnimatedSensor: () => ({ sensor: { value: {} }, unregister: NOOP }),
  withTiming: ID,
  withSpring: ID,
  withDecay: ID,
  withDelay: (_, animation) => animation,
  withRepeat: (animation) => animation,
  withSequence: (...animations) => animations[0],
  cancelAnimation: NOOP,
  measure: NOOP,
  scrollTo: NOOP,
  Easing: {
    linear: ID,
    ease: ID,
    quad: ID,
    cubic: ID,
    poly: (n) => ID,
    sin: ID,
    circle: ID,
    exp: ID,
    elastic: (bounciness) => ID,
    back: (s) => ID,
    bounce: ID,
    bezier: (x1, y1, x2, y2) => ID,
    bezierFn: (x1, y1, x2, y2) => ID,
    steps: (n, end) => ID,
    in: (easing) => easing,
    out: (easing) => easing,
    inOut: (easing) => easing,
  },
  runOnUI: (fn) => fn,
  runOnJS: (fn) => fn,
  makeMutable: (v) => ({ value: v }),
  makeRemote: (v) => ({ value: v }),
  interpolate: (value, inputRange, outputRange) => value,
  interpolateColor: (value, inputRange, outputRange) => (outputRange ? outputRange[0] : value),
  Extrapolate: {
    EXTEND: 'extend',
    CLAMP: 'clamp',
    IDENTITY: 'identity',
  },
  createAnimatedComponent,
  // Mocked Animated components
  View: MockComponent,
  Text: MockComponent,
  Image: MockComponent,
  ScrollView: MockComponent,
  FlatList: MockComponent,
}

// Export both as default and named exports
module.exports = reanimatedExports
module.exports.default = reanimatedExports
