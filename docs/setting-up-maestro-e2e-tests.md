# Setting Up Maestro E2E Tests for Send App

## Overview

This document outlines the setup process for Maestro end-to-end tests in the Send Expo app, focusing on local testing before implementing EAS workflow integration.

## Current App Configuration

- App ID: `app.send`
- Expo SDK version: Detected from expo package
- iOS Bundle ID: `app.send`
- Android Package: `app.send`
- Test Environment: Local development with Expo Go

### 1. Project Structure

Create the following directory structure:

```
apps/expo/
├── .maestro/               # Maestro test directory
│   ├── home.yml           # Home screen tests
│   ├── auth.yml           # Authentication flow tests
│   ├── send.yml           # Send flow tests
│   └── profile.yml        # Profile tests
```

### 2. Test Configuration

For testing the Send app directly, use the actual bundle identifier `app.send` instead of Expo Go.

**Note**: This requires having the Send app installed on your device/simulator with the `app.send` bundle identifier. If you're testing with Expo Go during development, you would use `host.exp.Exponent`, but for production-like E2E tests, use the actual app identifier.

## Sample Test Files

### Basic Test Structure

```yaml
appId: app.send  # Use the actual Send app bundle identifier
---
- launchApp
- waitForAnimationToEnd
- assertVisible: "Welcome to Send"
```

### Authentication Test Example

```yaml
appId: app.send
---
- launchApp
- tapOn: "Sign Up"
- inputText: "user@example.com"
- tapOn: "Continue"
```

## Current App Screens to Test

Based on the app structure, we should create tests for:

1. **Authentication Flow** (`(auth)/`)
   - Onboarding
   - Sign up
   - Login with phone

2. **Main Navigation** (`(drawer)/(tabs)/`)
   - Home screen
   - Activity feed
   - Earn section
   - Profile

3. **Key Features**
   - Send money
   - Deposit (crypto, debit card, Apple Pay)
   - Sendpot (buy tickets)
   - Trade
   - Leaderboard

## Best Practices for Send App

1. **Test IDs**: Add `testID` props to interactive elements in the React Native components
2. **Platform Handling**: Some tests may need platform-specific flows (iOS vs Android)
3. **Wait for Content**: Use appropriate wait commands since the app loads data asynchronously

## Next Steps

1. **Create Test Directory**
   ```bash
   cd apps/expo
   mkdir -p .maestro
   ```

2. **Write First Test**
   Start with a simple launch test:
   ```yaml
   appId: app.send
   ---
   - launchApp
   ```

3. **Add Test IDs to Components**
   Update React Native components to include `testID` props:
   ```tsx
   <Button testID="send_button" onPress={handleSend} />
   ```

4. **Run Tests Locally**
   ```bash
   maestro test .maestro/home.yml
   ```

## References

- [Expo E2E Testing Docs](https://docs.expo.dev/eas/workflows/reference/e2e-tests/)
- [Maestro React Native Docs](https://docs.maestro.dev/platform-support/react-native)
- [Maestro CLI Documentation](https://maestro.mobile.dev)
