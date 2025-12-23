/**
 * Web no-op version of OTAUpdateSheet.
 *
 * OTA updates via expo-updates are only available on native platforms.
 * Web deployments use the existing VersionUpdater component instead,
 * which polls /api/version to detect new deployments.
 */
export function OTAUpdateSheet() {
  return null
}
