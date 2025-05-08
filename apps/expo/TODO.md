# TODO

## monorepo

- upgrade tamagui
- upgrade react native
- upgrade expo

## expo

- make app `./assets`
- do first dev build. https://docs.expo.dev/development/build/
- finish `./PLAN.md`
- review expo plugins
- maestro tests:
  - iOS
    - enroll biometrics `xcrun simctl spawn 'iPhone X' notifyutil -s com.apple.BiometricKit.enrollmentChanged '1' && xcrun simctl spawn 'iPhone X' notifyutil -p com.apple.BiometricKit.enrollmentChanged` https://stackoverflow.com/questions/40117907/how-can-i-enroll-touch-id-in-simulator-from-the-command-line
