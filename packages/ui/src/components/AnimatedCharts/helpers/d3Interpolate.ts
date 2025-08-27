// Minimal no-op shim for d3-interpolate-path used on worklet runtime.
// We avoid bundling the full library to keep lint rules satisfied.
export function d3Interpolate() {
  'worklet'
  return {
    interpolatePath: (_a: string, _b: string) => (_t: number) => '',
    interpolatePathCommands: () => [],
    pathCommandsFromString: () => [],
  }
}
