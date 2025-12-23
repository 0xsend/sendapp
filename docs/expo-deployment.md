# Expo App Deployment

This document describes the deployment flow for the Send mobile app built with Expo.

## Deployment Flow Diagram

```mermaid
flowchart TD
    Dev[Developer]

    Dev --> Preview[Preview Build<br/>On-demand]
    Dev --> PushDev[Push to dev branch]
    Dev --> PushMain[Push to main branch]

    PushDev --> StagingWF[Staging Deploy Workflow]
    PushMain --> ProdWF[Production Deploy Workflow]

    StagingWF --> FP1[Fingerprint Check]
    ProdWF --> FP2[Fingerprint Check]

    FP1 --> CheckAndroid1{Android<br/>Build Exists?}
    FP1 --> CheckiOS1{iOS<br/>Build Exists?}

    FP2 --> CheckAndroid2{Android<br/>Build Exists?}
    FP2 --> CheckiOS2{iOS<br/>Build Exists?}

    CheckAndroid1 -->|Yes| OTA1[Publish OTA Update]
    CheckAndroid1 -->|No| Build1[New Android Build]

    CheckiOS1 -->|Yes| OTA2[Publish OTA Update]
    CheckiOS1 -->|No| Build2[New iOS Build]

    CheckAndroid2 -->|Yes| OTA3[Publish OTA Update]
    CheckAndroid2 -->|No| Build3[New Android Build]

    CheckiOS2 -->|Yes| OTA4[Publish OTA Update]
    CheckiOS2 -->|No| Build4[New iOS Build]
```

## Environments

| Environment | Branch | Build Profile | Update Channel |
|-------------|--------|---------------|----------------|
| Staging     | `dev`  | staging       | staging        |
| Production  | `main` | production    | production     |

## Automated Deployments

### Staging (dev branch)

Triggered automatically on every push to `dev`:

1. **Fingerprint** - Generates a unique hash based on native code changes
2. **Check Existing Builds** - Looks for Android/iOS builds matching the fingerprint
3. **Build or Update**:
   - **Build exists**: Publishes OTA update via `eas update`
   - **No build**: Creates new native build via `eas build`

### Production (main branch)

Triggered automatically on every push to `main`:

Same flow as staging but targets the production profile and channel.

## On-Demand Preview Builds

Developers can build preview versions locally to test changes before merging to `dev`.

### Available Scripts

From `apps/expo/`:

```bash
# Android preview build
yarn eas:build:preview:android

# iOS preview build
yarn eas:build:preview:ios
```

### When to Use Preview Builds

- Testing native code changes before merging
- QA verification of specific features
- Debugging platform-specific issues
- Sharing builds with team members for review

## Build Profiles

| Profile     | Purpose                                    |
|-------------|--------------------------------------------|
| development | Local development with dev client          |
| preview     | On-demand testing builds                   |
| staging     | Automated builds from dev branch           |
| production  | Automated builds from main branch          |

## OTA Updates vs Native Builds

The workflow uses **fingerprinting** to determine whether a native rebuild is needed:

- **OTA Update**: JavaScript/asset changes only - fast, no app store submission
- **Native Build**: Native code changes - requires new binary build

This optimization reduces build times and costs when only JS changes are deployed.
