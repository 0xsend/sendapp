/**
 * Native no-op version of VersionUpdater.
 * Version skew detection is only needed for web deployments.
 * Native apps are updated through app stores, not hot reloads.
 */
export function VersionUpdater() {
  return null
}
